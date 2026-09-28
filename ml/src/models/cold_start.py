"""Cold-Start Recommender & User Onboarding Engine.

Solves the classic cold-start problem:
1. For completely new users (0 historical ratings), offers popular diverse seed movies across genres.
2. Once the user picks 3-5 favorite movies or genres, computes an instantaneous taste centroid vector.
3. Ranks catalog titles via cosine similarity to the onboarding centroid without requiring full model retraining.
"""

from typing import Dict, List, Optional, Tuple, Any
import numpy as np
import pandas as pd


class ColdStartOnboardingEngine:
    """Handles cold-start recommendations and instant taste profile initialization."""

    def __init__(
        self,
        movies_df: pd.DataFrame,
        movie_vectors: np.ndarray,
        movie_id_to_idx: Dict[int, int],
        idx_to_movie_id: Dict[int, int],
    ):
        self.movies_df = movies_df.copy()
        self.movie_vectors = movie_vectors
        self.movie_id_to_idx = movie_id_to_idx
        self.idx_to_movie_id = idx_to_movie_id

        # Ephemeral in-memory profiles for new / onboarding users:
        # user_id -> centroid vector (float array)
        self.user_centroids: Dict[int, np.ndarray] = {}
        # user_id -> list of selected seed movie_ids
        self.user_seed_movies: Dict[int, List[int]] = {}

    def get_onboarding_candidates(self, per_genre: int = 2) -> List[Dict[str, Any]]:
        """Returns diverse, high-recognition candidate movies across core genres for the onboarding survey.

        Ensures brand-new users are presented with recognizable, high-vote titles
        spanning Action, Comedy, Drama, Sci-Fi, Animation, and Thriller.
        """
        core_genres = ["Action", "Comedy", "Drama", "Sci-Fi", "Animation", "Thriller", "Romance", "Adventure"]
        selected_candidates: List[Dict[str, Any]] = []
        seen_movie_ids = set()

        # Explode genres if list or split string
        df = self.movies_df.copy()

        for genre in core_genres:
            matches = df[df["genres"].str.contains(genre, case=False, na=False)]
            # If vote_count or popularity exists, sort by it, otherwise head
            if "vote_count" in matches.columns:
                matches = matches.sort_values(by="vote_count", ascending=False)
            
            count = 0
            for _, row in matches.iterrows():
                mid = int(row["movie_id"])
                if mid not in seen_movie_ids:
                    seen_movie_ids.add(mid)
                    selected_candidates.append({
                        "movie_id": mid,
                        "title": row.get("clean_title", row.get("title", f"Movie #{mid}")),
                        "genres": row.get("genres", ""),
                        "release_year": int(row["release_year"]) if "release_year" in row and pd.notna(row["release_year"]) else None,
                        "poster_url": row.get("poster_url", None),
                        "primary_genre": genre,
                    })
                    count += 1
                    if count >= per_genre:
                        break

        return selected_candidates

    def initialize_user_profile(
        self,
        user_id: int,
        selected_movie_ids: List[int],
        selected_genres: Optional[List[str]] = None,
    ) -> np.ndarray:
        """Initializes a new user's taste centroid vector from their onboarding choices.

        Averages the normalized feature vectors of selected seed movies.
        """
        chosen_vectors = []

        for mid in selected_movie_ids:
            if mid in self.movie_id_to_idx:
                idx = self.movie_id_to_idx[mid]
                chosen_vectors.append(self.movie_vectors[idx])

        if chosen_vectors:
            centroid = np.mean(chosen_vectors, axis=0)
            norm = np.linalg.norm(centroid)
            if norm > 1e-8:
                centroid = centroid / norm
        else:
            # Fallback uniform vector if no valid movie IDs were matched
            centroid = np.ones(self.movie_vectors.shape[1], dtype=np.float32)
            centroid = centroid / np.linalg.norm(centroid)

        self.user_centroids[user_id] = centroid
        self.user_seed_movies[user_id] = list(selected_movie_ids)
        return centroid

    def recommend(
        self,
        user_id: int,
        n: int = 10,
        exclude_seen: bool = True,
    ) -> List[Tuple[int, float, str]]:
        """Generates instant recommendations for an onboarded user using their centroid vector.

        Returns:
            List of (movie_id, similarity_score, explanation_string)
        """
        if user_id not in self.user_centroids:
            return []

        centroid = self.user_centroids[user_id]
        # Dot product with all movie vectors gives cosine similarity (since vectors are L2-normalized)
        sim_scores = np.dot(self.movie_vectors, centroid)

        exclude_set = set(self.user_seed_movies.get(user_id, [])) if exclude_seen else set()

        # Sort indices by descending similarity
        top_indices = np.argsort(-sim_scores)

        results: List[Tuple[int, float, str]] = []
        for idx in top_indices:
            mid = self.idx_to_movie_id[idx]
            if mid in exclude_set:
                continue

            score = float(sim_scores[idx])
            seed_names = []
            for s_id in self.user_seed_movies.get(user_id, [])[:2]:
                row = self.movies_df[self.movies_df["movie_id"] == s_id]
                if not row.empty:
                    title = row.iloc[0].get("clean_title", row.iloc[0].get("title", f"Movie #{s_id}"))
                    seed_names.append(title)

            if seed_names:
                explanation = f"Matches your taste in '{seed_names[0]}'"
            else:
                explanation = "Matches your onboarding preferences"

            results.append((mid, score, explanation))
            if len(results) >= n:
                break

        return results
