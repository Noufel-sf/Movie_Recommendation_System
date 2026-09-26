import numpy as np
import pandas as pd
from sklearn.decomposition import TruncatedSVD
from scipy.sparse import csr_matrix
from ml.src.models.base import BaseRecommender


class ExplicitSGDMatrixFactorization(BaseRecommender):
    """
    Matrix Factorization via Stochastic Gradient Descent (SGD) with User/Item Biases.
    
    Formula:
        predicted_rating = global_mean + user_bias + item_bias + dot(user_factors, item_factors)
        
    Optimization Objective:
        Minimize squared error on observed ratings + L2 regularization penalty:
        Loss = sum [ (r - r_pred)^2 ] + lambda * [ ||P_u||^2 + ||Q_i||^2 + b_u^2 + b_i^2 ]
        
    SGD Updates for each observation:
        error = r - r_pred
        b_u <- b_u + lr * (error - reg * b_u)
        b_i <- b_i + lr * (error - reg * b_i)
        P_u <- P_u + lr * (error * Q_i - reg * P_u)
        Q_i <- Q_i + lr * (error * P_u - reg * Q_i)
    """

    def __init__(
        self,
        n_factors: int = 20,
        lr: float = 0.005,
        reg: float = 0.02,
        n_epochs: int = 15,
        random_state: int = 42,
    ):
        self.n_factors = n_factors
        self.lr = lr
        self.reg = reg
        self.n_epochs = n_epochs
        self.random_state = random_state

        # Parameters to learn
        self.global_mean: float = 3.5
        self.user_biases: np.ndarray = np.array([])
        self.item_biases: np.ndarray = np.array([])
        self.user_factors: np.ndarray = np.array([])
        self.item_factors: np.ndarray = np.array([])

        # Mappings
        self.user_to_idx: dict[int, int] = {}
        self.idx_to_user: dict[int, int] = {}
        self.movie_to_idx: dict[int, int] = {}
        self.idx_to_movie: dict[int, int] = {}
        self.user_seen: dict[int, set[int]] = {}

        # Training history
        self.epoch_losses: list[float] = []

    def fit(self, train_df: pd.DataFrame) -> "ExplicitSGDMatrixFactorization":
        rng = np.random.default_rng(self.random_state)
        self.global_mean = float(train_df["rating"].mean())

        # 1. Build index mappings
        unique_users = sorted(train_df["user_id"].unique())
        unique_movies = sorted(train_df["movie_id"].unique())

        self.user_to_idx = {uid: i for i, uid in enumerate(unique_users)}
        self.idx_to_user = {i: uid for i, uid in enumerate(unique_users)}
        self.movie_to_idx = {mid: j for j, mid in enumerate(unique_movies)}
        self.idx_to_movie = {j: mid for j, mid in enumerate(unique_movies)}

        n_users = len(unique_users)
        n_movies = len(unique_movies)

        # 2. Track seen items for fast recommendation filtering
        self.user_seen = train_df.groupby("user_id")["movie_id"].apply(set).to_dict()

        # 3. Initialize parameters
        # Zero initialization for biases
        self.user_biases = np.zeros(n_users, dtype=np.float32)
        self.item_biases = np.zeros(n_movies, dtype=np.float32)

        # Small random normal initialization for latent factor embeddings (mean 0, std 0.1)
        self.user_factors = rng.normal(0.0, 0.1, size=(n_users, self.n_factors)).astype(np.float32)
        self.item_factors = rng.normal(0.0, 0.1, size=(n_movies, self.n_factors)).astype(np.float32)

        # 4. Prepare training arrays for vector speed
        u_indices = np.array([self.user_to_idx[uid] for uid in train_df["user_id"]], dtype=np.int32)
        i_indices = np.array([self.movie_to_idx[mid] for mid in train_df["movie_id"]], dtype=np.int32)
        ratings = train_df["rating"].values.astype(np.float32)
        n_samples = len(ratings)

        # 5. Stochastic Gradient Descent Loop
        self.epoch_losses = []
        for epoch in range(self.n_epochs):
            # Shuffle indices each epoch for true stochastic descent
            shuffle_order = rng.permutation(n_samples)
            total_loss = 0.0

            for idx in shuffle_order:
                u = u_indices[idx]
                i = i_indices[idx]
                r = ratings[idx]

                # Current prediction: mu + b_u + b_i + P_u . Q_i
                dot = np.dot(self.user_factors[u], self.item_factors[i])
                pred = self.global_mean + self.user_biases[u] + self.item_biases[i] + dot
                error = r - pred
                total_loss += error ** 2

                # Cache vectors before updating
                u_fac = self.user_factors[u].copy()
                i_fac = self.item_factors[i].copy()

                # SGD updates with L2 Regularization
                self.user_biases[u] += self.lr * (error - self.reg * self.user_biases[u])
                self.item_biases[i] += self.lr * (error - self.reg * self.item_biases[i])
                self.user_factors[u] += self.lr * (error * i_fac - self.reg * u_fac)
                self.item_factors[i] += self.lr * (error * u_fac - self.reg * i_fac)

            rmse_epoch = np.sqrt(total_loss / n_samples)
            self.epoch_losses.append(float(rmse_epoch))

        return self

    def predict(self, user_id: int, movie_id: int) -> float:
        """
        Predict rating using the trained latent factor model.
        """
        has_user = user_id in self.user_to_idx
        has_movie = movie_id in self.movie_to_idx

        if not has_user and not has_movie:
            return self.global_mean

        u_bias = self.user_biases[self.user_to_idx[user_id]] if has_user else 0.0
        i_bias = self.item_biases[self.movie_to_idx[movie_id]] if has_movie else 0.0

        if has_user and has_movie:
            u_idx = self.user_to_idx[user_id]
            i_idx = self.movie_to_idx[movie_id]
            interaction = float(np.dot(self.user_factors[u_idx], self.item_factors[i_idx]))
        else:
            interaction = 0.0

        pred = self.global_mean + u_bias + i_bias + interaction
        return float(np.clip(pred, 0.5, 5.0))

    def recommend(
        self, 
        user_id: int, 
        n: int = 10, 
        exclude_seen: bool = True
    ) -> list[tuple[int, float]]:
        """
        Score all catalog movies simultaneously via matrix-vector multiplication:
        scores = global_mean + user_bias + item_biases + (item_factors * user_factors[u])
        """
        if user_id not in self.user_to_idx:
            # Fallback for unknown user: return global mean + item biases
            scores = self.global_mean + self.item_biases
        else:
            u_idx = self.user_to_idx[user_id]
            user_vec = self.user_factors[u_idx]
            u_bias = self.user_biases[u_idx]
            # Fast dot product: (n_movies, n_factors) @ (n_factors,) -> (n_movies,)
            interactions = np.dot(self.item_factors, user_vec)
            scores = self.global_mean + u_bias + self.item_biases + interactions

        # Mask seen movies
        if exclude_seen and user_id in self.user_seen:
            seen_set = self.user_seen[user_id]
            for mid in seen_set:
                if mid in self.movie_to_idx:
                    scores[self.movie_to_idx[mid]] = -1.0

        top_indices = np.argsort(scores)[::-1]
        recs = []
        for idx in top_indices:
            if exclude_seen and scores[idx] < 0.0:
                continue
            recs.append((self.idx_to_movie[idx], float(scores[idx])))
            if len(recs) == n:
                break
        return recs

    def similar_items(self, movie_id: int, n: int = 10) -> list[tuple[int, float]]:
        """
        Finds similar movies by computing Cosine Similarity between latent item embeddings.
        """
        if movie_id not in self.movie_to_idx:
            return []

        target_idx = self.movie_to_idx[movie_id]
        target_vec = self.item_factors[target_idx]

        # Normalize item factors for cosine similarity
        norms = np.linalg.norm(self.item_factors, axis=1)
        norms[norms == 0] = 1e-10
        norm_target = np.linalg.norm(target_vec)
        if norm_target == 0:
            norm_target = 1e-10

        dots = np.dot(self.item_factors, target_vec)
        similarities = dots / (norms * norm_target)
        similarities[target_idx] = -1.0

        top_indices = np.argsort(similarities)[::-1][:n]
        return [(self.idx_to_movie[idx], float(similarities[idx])) for idx in top_indices]


class TruncatedSVDRecommender(BaseRecommender):
    """
    Matrix Factorization using Scikit-Learn's TruncatedSVD.
    Provides standard linear-algebra SVD comparison to our manual SGD solver.
    """

    def __init__(self, n_components: int = 20, random_state: int = 42):
        self.n_components = n_components
        self.random_state = random_state
        self.svd = TruncatedSVD(n_components=n_components, random_state=random_state)
        
        self.user_to_idx: dict[int, int] = {}
        self.idx_to_user: dict[int, int] = {}
        self.movie_to_idx: dict[int, int] = {}
        self.idx_to_movie: dict[int, int] = {}
        self.user_seen: dict[int, set[int]] = {}
        
        self.user_factors: np.ndarray = np.array([])
        self.item_factors: np.ndarray = np.array([])
        self.global_mean: float = 3.5

    def fit(self, train_df: pd.DataFrame) -> "TruncatedSVDRecommender":
        self.global_mean = float(train_df["rating"].mean())
        unique_users = sorted(train_df["user_id"].unique())
        unique_movies = sorted(train_df["movie_id"].unique())

        self.user_to_idx = {uid: i for i, uid in enumerate(unique_users)}
        self.idx_to_user = {i: uid for i, uid in enumerate(unique_users)}
        self.movie_to_idx = {mid: j for j, mid in enumerate(unique_movies)}
        self.idx_to_movie = {j: mid for j, mid in enumerate(unique_movies)}
        self.user_seen = train_df.groupby("user_id")["movie_id"].apply(set).to_dict()

        # Build centered sparse matrix
        rows = [self.user_to_idx[uid] for uid in train_df["user_id"]]
        cols = [self.movie_to_idx[mid] for mid in train_df["movie_id"]]
        vals = train_df["rating"].values - self.global_mean

        R_sparse = csr_matrix((vals, (rows, cols)), shape=(len(unique_users), len(unique_movies)))
        
        # Fit SVD: user_factors = R * V, item_factors = V
        self.user_factors = self.svd.fit_transform(R_sparse)
        self.item_factors = self.svd.components_.T  # Shape: (n_movies, n_components)

        return self

    def predict(self, user_id: int, movie_id: int) -> float:
        if user_id not in self.user_to_idx or movie_id not in self.movie_to_idx:
            return self.global_mean

        u_idx = self.user_to_idx[user_id]
        i_idx = self.movie_to_idx[movie_id]
        dot = float(np.dot(self.user_factors[u_idx], self.item_factors[i_idx]))
        return float(np.clip(self.global_mean + dot, 0.5, 5.0))

    def recommend(
        self, 
        user_id: int, 
        n: int = 10, 
        exclude_seen: bool = True
    ) -> list[tuple[int, float]]:
        if user_id not in self.user_to_idx:
            return []

        u_idx = self.user_to_idx[user_id]
        scores = self.global_mean + np.dot(self.item_factors, self.user_factors[u_idx])

        if exclude_seen and user_id in self.user_seen:
            for mid in self.user_seen[user_id]:
                if mid in self.movie_to_idx:
                    scores[self.movie_to_idx[mid]] = -1.0

        top_indices = np.argsort(scores)[::-1]
        recs = []
        for idx in top_indices:
            if exclude_seen and scores[idx] < 0.0:
                continue
            recs.append((self.idx_to_movie[idx], float(scores[idx])))
            if len(recs) == n:
                break
        return recs
