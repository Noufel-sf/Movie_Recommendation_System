import numpy as np
import pandas as pd
from ml.src.models.base import BaseRecommender
from ml.src.features.content_features import (
    build_genre_multihot_matrix,
    ManualTfidfVectorizer,
    cosine_similarity_matrix,
)


class ContentBasedRecommender(BaseRecommender):
    """
    Content-Based Recommendation System.
    
    1. Represents movies as dense/sparse feature vectors (TF-IDF of title + genres).
    2. Constructs a User Profile Vector as the rating-weighted centroid of movies the user liked.
    3. Scores candidate movies via Cosine Similarity between User Profile and Movie Vectors.
    4. Generates natural explanations ('Because you watched Movie X').
    """

    def __init__(self, use_tfidf: bool = True):
        self.use_tfidf = use_tfidf
        self.movie_vectors: np.ndarray = np.array([])
        self.movie_id_to_idx: dict[int, int] = {}
        self.idx_to_movie_id: dict[int, int] = {}
        self.user_profiles: dict[int, np.ndarray] = {}
        self.user_history: dict[int, list[tuple[int, float]]] = {}
        self.global_mean_rating: float = 3.5

    def fit(self, train_df: pd.DataFrame, movies_df: pd.DataFrame = None) -> "ContentBasedRecommender":
        if movies_df is None:
            raise ValueError("ContentBasedRecommender requires movies_df to extract content features.")

        self.global_mean_rating = float(train_df["rating"].mean())
        
        # 1. Feature Extraction: Build combined text for each movie
        # Combine title and genres into a descriptive document string
        # e.g. "Toy Story Adventure Animation Children Comedy"
        clean_genres = movies_df["genres"].fillna("").str.replace("|", " ", regex=False)
        title_col = movies_df["clean_title"] if "clean_title" in movies_df.columns else movies_df["title"]
        documents = (title_col.fillna("") + " " + clean_genres).tolist()
        
        if self.use_tfidf:
            vectorizer = ManualTfidfVectorizer()
            self.movie_vectors = vectorizer.fit_transform(documents)
        else:
            self.movie_vectors, _, _ = build_genre_multihot_matrix(movies_df)
            # L2 normalize
            norms = np.linalg.norm(self.movie_vectors, axis=1, keepdims=True)
            norms[norms == 0] = 1e-10
            self.movie_vectors = self.movie_vectors / norms

        self.movie_id_to_idx = {int(mid): idx for idx, mid in enumerate(movies_df["movie_id"])}
        self.idx_to_movie_id = {idx: int(mid) for idx, mid in enumerate(movies_df["movie_id"])}

        # 2. Cache user history: list of (movie_id, rating)
        for user_id, group in train_df.groupby("user_id"):
            self.user_history[int(user_id)] = list(zip(group["movie_id"].astype(int), group["rating"].astype(float)))

        # 3. Precompute User Profile Vectors
        for user_id in self.user_history:
            self.user_profiles[user_id] = self._build_user_profile(user_id)

        return self

    def _build_user_profile(self, user_id: int) -> np.ndarray:
        """
        Builds a user taste vector by taking a weighted sum of their rated movies.
        Weights are centered around the user's mean rating:
            weight = rating - user_mean
        Movies rated above average push the profile toward those features;
        movies rated below average push the profile away.
        """
        history = self.user_history.get(user_id, [])
        if not history:
            # Fallback to zero vector for cold-start users
            return np.zeros(self.movie_vectors.shape[1], dtype=np.float32)

        ratings = np.array([r for _, r in history])
        user_mean = np.mean(ratings)
        
        profile = np.zeros(self.movie_vectors.shape[1], dtype=np.float32)
        total_weight = 0.0

        for movie_id, rating in history:
            if movie_id in self.movie_id_to_idx:
                idx = self.movie_id_to_idx[movie_id]
                weight = rating - user_mean  # Centered rating weight
                # If all ratings are identical, default weight to rating / 5.0
                if weight == 0:
                    weight = rating / 5.0
                profile += weight * self.movie_vectors[idx]
                total_weight += abs(weight)

        norm = np.linalg.norm(profile)
        if norm > 0:
            profile = profile / norm

        return profile

    def similar_movies(self, movie_id: int, n: int = 10) -> list[tuple[int, float]]:
        """
        Finds the top-N most similar movies using Cosine Similarity.
        """
        if movie_id not in self.movie_id_to_idx:
            return []

        target_idx = self.movie_id_to_idx[movie_id]
        target_vec = self.movie_vectors[target_idx]

        # Since movie_vectors are L2-normalized, Cosine Sim is just dot product
        similarities = np.dot(self.movie_vectors, target_vec)

        # Exclude the target movie itself
        similarities[target_idx] = -1.0

        top_indices = np.argsort(similarities)[::-1][:n]
        return [(self.idx_to_movie_id[idx], float(similarities[idx])) for idx in top_indices]

    def predict(self, user_id: int, movie_id: int) -> float:
        """
        Predict affinity on scale [0.5, 5.0] via Cosine Similarity between
        User Profile and Movie Vector.
        """
        if user_id not in self.user_profiles or movie_id not in self.movie_id_to_idx:
            return self.global_mean_rating

        user_vec = self.user_profiles[user_id]
        movie_idx = self.movie_id_to_idx[movie_id]
        movie_vec = self.movie_vectors[movie_idx]

        # Cosine similarity in range [-1.0, 1.0]
        cos_sim = float(np.dot(user_vec, movie_vec))
        
        # Rescale similarity [-1.0, 1.0] to rating scale [0.5, 5.0]
        # (sim + 1) / 2 maps to [0, 1]. Then scale to [0.5, 5.0]
        scaled_rating = 0.5 + ((cos_sim + 1.0) / 2.0) * 4.5
        return float(np.clip(scaled_rating, 0.5, 5.0))

    def recommend(
        self, 
        user_id: int, 
        n: int = 10, 
        exclude_seen: bool = True
    ) -> list[tuple[int, float]]:
        """
        Scores all catalog movies for the user and returns top-N.
        Falls back to global centroid if user has no training history.
        """
        if user_id in self.user_profiles and np.linalg.norm(self.user_profiles[user_id]) > 0:
            user_vec = self.user_profiles[user_id]
        else:
            # Cold-start fallback: average vector across all movies
            user_vec = np.mean(self.movie_vectors, axis=0)
            norm = np.linalg.norm(user_vec)
            if norm > 0:
                user_vec = user_vec / norm

        # Dot product against all movie vectors simultaneously
        scores = np.dot(self.movie_vectors, user_vec)

        # Mask seen movies
        if exclude_seen and user_id in self.user_history:
            for mid, _ in self.user_history[user_id]:
                if mid in self.movie_id_to_idx:
                    scores[self.movie_id_to_idx[mid]] = -1.0

        top_indices = np.argsort(scores)[::-1][:n]
        return [(self.idx_to_movie_id[idx], float(scores[idx])) for idx in top_indices]

    def explain_recommendation(self, user_id: int, recommended_movie_id: int) -> dict:
        """
        Explains why a movie was recommended by identifying the movie in the user's
        history with the highest cosine similarity to this recommendation.
        """
        if user_id not in self.user_history or recommended_movie_id not in self.movie_id_to_idx:
            return {"reason": "Recommended based on general catalog preferences"}

        rec_idx = self.movie_id_to_idx[recommended_movie_id]
        rec_vec = self.movie_vectors[rec_idx]

        best_source_id = None
        max_sim = -1.0
        source_rating = 0.0

        for source_id, rating in self.user_history[user_id]:
            # Only explain using movies the user rated positively (>= 3.5)
            if rating >= 3.5 and source_id in self.movie_id_to_idx:
                s_idx = self.movie_id_to_idx[source_id]
                sim = float(np.dot(rec_vec, self.movie_vectors[s_idx]))
                if sim > max_sim:
                    max_sim = sim
                    best_source_id = source_id
                    source_rating = rating

        if best_source_id is not None:
            return {
                "source_movie_id": best_source_id,
                "similarity_score": round(max_sim, 3),
                "user_rating": source_rating,
                "reason": f"Because you rated movie #{best_source_id} ({source_rating} stars)"
            }
        return {"reason": "Recommended based on overall genre and metadata affinity"}
