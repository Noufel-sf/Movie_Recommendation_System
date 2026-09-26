import numpy as np
import pandas as pd
from scipy.sparse import csr_matrix
from ml.src.models.base import BaseRecommender


class ItemItemCollaborativeRecommender(BaseRecommender):
    """
    Item-Based Collaborative Filtering Recommender.
    
    Why Item-Based is standard in production:
    1. Items (movies) are far more static than users (users constantly browse and rate).
    2. Number of items is usually much smaller than number of users (e.g. 10k movies vs 10M users).
    3. Item-item similarity matrix can be precomputed offline once and cached.
    4. Prediction at runtime is a lightning-fast dot product:
       pred_score = sum(sim(i, j) * (rating_j - user_mean)) / sum(|sim(i, j)|) + user_mean
    """

    def __init__(self, k_neighbors: int = 20, min_co_raters: int = 5):
        self.k_neighbors = k_neighbors
        self.min_co_raters = min_co_raters
        
        # Mappings
        self.user_to_idx: dict[int, int] = {}
        self.idx_to_user: dict[int, int] = {}
        self.movie_to_idx: dict[int, int] = {}
        self.idx_to_movie: dict[int, int] = {}
        
        # Precomputed state
        self.user_means: np.ndarray = np.array([])
        self.global_mean: float = 3.5
        self.item_sim_matrix: np.ndarray = np.array([])
        self.user_history: dict[int, dict[int, float]] = {}

    def fit(self, train_df: pd.DataFrame) -> "ItemItemCollaborativeRecommender":
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
        
        # 2. Build user history cache: user_id -> {movie_id: rating}
        for uid, group in train_df.groupby("user_id"):
            self.user_history[int(uid)] = dict(zip(group["movie_id"].astype(int), group["rating"].astype(float)))
            
        # 3. Compute per-user means to remove generous/harsh rater bias
        user_sums = np.zeros(n_users, dtype=np.float64)
        user_counts = np.zeros(n_users, dtype=np.float64)
        
        row_indices = [self.user_to_idx[uid] for uid in train_df["user_id"]]
        col_indices = [self.movie_to_idx[mid] for mid in train_df["movie_id"]]
        ratings = train_df["rating"].values.astype(np.float64)
        
        for u_idx, r in zip(row_indices, ratings):
            user_sums[u_idx] += r
            user_counts[u_idx] += 1
            
        self.user_means = np.divide(
            user_sums, 
            np.maximum(user_counts, 1.0), 
            out=np.full(n_users, self.global_mean, dtype=np.float64)
        )

        # 4. Construct Mean-Centered User-Item Matrix
        # Subtracting user mean eliminates generous/harsh rating skew
        centered_ratings = np.zeros(len(ratings), dtype=np.float64)
        for idx, (u_idx, r) in enumerate(zip(row_indices, ratings)):
            centered_ratings[idx] = r - self.user_means[u_idx]

        # Sparse matrix of shape (n_users, n_movies)
        R_centered = csr_matrix(
            (centered_ratings, (row_indices, col_indices)), 
            shape=(n_users, n_movies),
            dtype=np.float32
        )
        
        # Binary interaction matrix to track co-rating counts
        R_binary = csr_matrix(
            (np.ones(len(ratings), dtype=np.float32), (row_indices, col_indices)),
            shape=(n_users, n_movies)
        )

        # 5. Compute Adjusted Cosine Similarity Matrix between all movie pairs
        # Item-Item dot products = R_centered.T * R_centered
        # Shape: (n_movies, n_movies)
        item_dots = R_centered.T.dot(R_centered).toarray()
        
        # Co-rating counts: how many users rated both movie i and movie j
        co_counts = R_binary.T.dot(R_binary).toarray()
        
        # Item vector norms
        # norm of item j is sqrt(sum of centered ratings squared across users who rated item j)
        item_sq_sums = np.array(R_centered.power(2).sum(axis=0)).flatten()
        item_norms = np.sqrt(item_sq_sums)
        
        # Avoid division by zero
        item_norms[item_norms == 0] = 1e-10
        norm_matrix = np.outer(item_norms, item_norms)
        
        # Raw Adjusted Cosine Similarity
        self.item_sim_matrix = item_dots / norm_matrix
        
        # Apply Co-Rating Filter: If two movies share fewer than min_co_raters,
        # set similarity to 0 to prevent spurious correlations between obscure items
        self.item_sim_matrix[co_counts < self.min_co_raters] = 0.0
        
        # Diagonal is self-similarity, set to 0.0 for neighbor search
        np.fill_diagonal(self.item_sim_matrix, 0.0)
        
        return self

    def predict(self, user_id: int, movie_id: int) -> float:
        """
        Predict rating using top-K most similar items rated by this user:
        predicted = user_mean + sum(sim(i, j) * (r_j - user_mean)) / sum(|sim(i, j)|)
        """
        if user_id not in self.user_to_idx:
            return self.global_mean
            
        u_idx = self.user_to_idx[user_id]
        u_mean = self.user_means[u_idx]
        
        if movie_id not in self.movie_to_idx:
            return float(u_mean)

        target_m_idx = self.movie_to_idx[movie_id]
        user_ratings = self.user_history.get(user_id, {})
        
        if not user_ratings:
            return float(u_mean)

        # Find items rated by this user that have positive similarity with target_movie
        sims = []
        centered_r = []

        for rated_mid, r in user_ratings.items():
            if rated_mid in self.movie_to_idx and rated_mid != movie_id:
                rated_idx = self.movie_to_idx[rated_mid]
                sim = self.item_sim_matrix[target_m_idx, rated_idx]
                if sim > 0:
                    sims.append(sim)
                    centered_r.append(r - u_mean)

        if not sims:
            return float(u_mean)

        # Take top-K most similar neighbors
        sims = np.array(sims)
        centered_r = np.array(centered_r)
        
        if len(sims) > self.k_neighbors:
            top_k_idx = np.argsort(sims)[::-1][:self.k_neighbors]
            sims = sims[top_k_idx]
            centered_r = centered_r[top_k_idx]

        sim_sum = np.sum(np.abs(sims))
        if sim_sum == 0:
            return float(u_mean)

        predicted_diff = np.sum(sims * centered_r) / sim_sum
        final_prediction = u_mean + predicted_diff
        return float(np.clip(final_prediction, 0.5, 5.0))

    def recommend(
        self, 
        user_id: int, 
        n: int = 10, 
        exclude_seen: bool = True
    ) -> list[tuple[int, float]]:
        """
        Recommends top-N movies for a user by scoring all unseen candidate movies.
        """
        if user_id not in self.user_to_idx:
            # Fallback for unknown user: return empty list or popularity
            return []

        seen_movies = self.user_history.get(user_id, {})
        u_idx = self.user_to_idx[user_id]
        u_mean = self.user_means[u_idx]

        # Vector of user's centered ratings across all movies: shape (n_movies,)
        user_centered = np.zeros(len(self.movie_to_idx), dtype=np.float32)
        rated_mask = np.zeros(len(self.movie_to_idx), dtype=bool)

        for mid, r in seen_movies.items():
            if mid in self.movie_to_idx:
                idx = self.movie_to_idx[mid]
                user_centered[idx] = r - u_mean
                rated_mask[idx] = True

        # Candidate scores = item_sim_matrix * user_centered
        # Shape: (n_movies,)
        # Mask negative similarities so they don't produce weird positive scores
        pos_sim_matrix = np.maximum(self.item_sim_matrix, 0.0)
        numerator = pos_sim_matrix.dot(user_centered)
        denominator = pos_sim_matrix.dot(rated_mask.astype(np.float32))

        # Safe division
        scores = np.zeros_like(numerator)
        valid = denominator > 0
        scores[valid] = u_mean + (numerator[valid] / denominator[valid])
        scores[~valid] = u_mean

        # Mask seen movies
        if exclude_seen:
            for mid in seen_movies:
                if mid in self.movie_to_idx:
                    scores[self.movie_to_idx[mid]] = -1.0

        top_indices = np.argsort(scores)[::-1][:n]
        return [(self.idx_to_movie[idx], float(scores[idx])) for idx in top_indices]

    def similar_items(self, movie_id: int, n: int = 10) -> list[tuple[int, float]]:
        """
        Returns top-N most similar movies based on co-rating behavior across all users.
        """
        if movie_id not in self.movie_to_idx:
            return []

        idx = self.movie_to_idx[movie_id]
        sims = self.item_sim_matrix[idx].copy()

        top_indices = np.argsort(sims)[::-1][:n]
        return [(self.idx_to_movie[i], float(sims[i])) for i in top_indices if sims[i] > 0]
