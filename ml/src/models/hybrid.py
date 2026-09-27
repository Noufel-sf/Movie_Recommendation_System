from typing import Optional
import numpy as np
import pandas as pd

from ml.src.models.base import BaseRecommender
from ml.src.models.baseline import IMDBWeightedRecommender
from ml.src.models.content_based import ContentBasedRecommender
from ml.src.models.matrix_factorization import ExplicitSGDMatrixFactorization


class HybridRecommender(BaseRecommender):
    """
    Weighted Hybrid Recommender System:
    Combines Collaborative Matrix Factorization (SVD), Content-Based (TF-IDF & Genres),
    and Bayesian Popularity with configurable weights:

        hybrid_score = alpha * svd_score + beta * content_score + gamma * popularity_score

    Why Hybrid is the Industry Standard:
    1. Overcomes Cold Start: If an item or user has few collaborative interactions,
       content-based and Bayesian popularity ensure high-quality recommendations.
    2. Combines Serendipity & Relevance: Collaborative filtering finds unexpected
       cross-genre affinities, while content-based ensures strict genre taste adherence.
    3. Graceful Fallback: When any sub-model has low confidence, the others stabilize the output.
    """

    def __init__(
        self,
        alpha: float = 0.60,
        beta: float = 0.25,
        gamma: float = 0.15,
        mf_model: Optional[ExplicitSGDMatrixFactorization] = None,
        content_model: Optional[ContentBasedRecommender] = None,
        popularity_model: Optional[IMDBWeightedRecommender] = None,
    ):
        # Normalize weights so alpha + beta + gamma = 1.0
        total = alpha + beta + gamma
        self.alpha = alpha / total
        self.beta = beta / total
        self.gamma = gamma / total

        self.mf_model = mf_model or ExplicitSGDMatrixFactorization(n_factors=20, n_epochs=15)
        self.content_model = content_model or ContentBasedRecommender()
        self.popularity_model = popularity_model or IMDBWeightedRecommender(m=10.0)

        self.movies_df: pd.DataFrame = pd.DataFrame()
        self.all_movie_ids: list[int] = []

    def fit(self, train_df: pd.DataFrame, movies_df: Optional[pd.DataFrame] = None) -> "HybridRecommender":
        self.train_df = train_df
        if movies_df is not None:
            self.movies_df = movies_df
            self.all_movie_ids = list(movies_df["movie_id"].unique())
        else:
            self.all_movie_ids = list(train_df["movie_id"].unique())

        # Fit sub-models if not already fitted
        if not hasattr(self.mf_model, "user_factors") or len(self.mf_model.user_factors) == 0:
            self.mf_model.fit(train_df)

        if not hasattr(self.content_model, "tfidf_matrix") or self.content_model.tfidf_matrix is None:
            if movies_df is not None:
                self.content_model.fit(train_df, movies_df)

        if not hasattr(self.popularity_model, "ranked_movies") or len(self.popularity_model.ranked_movies) == 0:
            self.popularity_model.fit(train_df)

        return self

    def predict(self, user_id: int, movie_id: int) -> float:
        """
        Predict rating using the weighted combination of SVD, Content, and Popularity scores.
        """
        # 1. SVD Score (ranges 0.5 to 5.0)
        try:
            svd_val = self.mf_model.predict(user_id, movie_id)
        except Exception:
            svd_val = 3.5

        # 2. Content Score (scaled to 1.0 - 5.0)
        try:
            content_val = self.content_model.predict(user_id, movie_id)
        except Exception:
            content_val = 3.0

        # 3. Popularity Score (Bayesian score ranges 0.5 to 5.0)
        try:
            pop_val = self.popularity_model.predict(user_id, movie_id)
        except Exception:
            pop_val = 3.5

        hybrid = (self.alpha * svd_val) + (self.beta * content_val) + (self.gamma * pop_val)
        return float(np.clip(hybrid, 0.5, 5.0))

    def recommend(
        self,
        user_id: int,
        n: int = 10,
        exclude_seen: bool = True,
        weights: Optional[dict[str, float]] = None,
    ) -> list[tuple[int, float]]:
        """
        Generate top-N hybrid recommendations with optional dynamic runtime weight tuning.
        """
        a = weights.get("alpha", self.alpha) if weights else self.alpha
        b = weights.get("beta", self.beta) if weights else self.beta
        c = weights.get("gamma", self.gamma) if weights else self.gamma
        tot = a + b + c
        a, b, c = a / tot, b / tot, c / tot

        # Determine seen movies
        seen_movies = set()
        if exclude_seen and hasattr(self, "train_df"):
            user_ratings = self.train_df[self.train_df["user_id"] == user_id]
            seen_movies = set(user_ratings["movie_id"])

        # Candidate selection: union of top candidates from SVD, Content, and Popularity
        candidate_set = set()
        
        # SVD candidates
        try:
            for mid, _ in self.mf_model.recommend(user_id, n=n * 3, exclude_seen=exclude_seen):
                candidate_set.add(mid)
        except Exception:
            pass

        # Content candidates
        try:
            for mid, _ in self.content_model.recommend(user_id, n=n * 3, exclude_seen=exclude_seen):
                candidate_set.add(mid)
        except Exception:
            pass

        # Popularity candidates
        try:
            for mid, _ in self.popularity_model.recommend(user_id, n=n * 2, exclude_seen=exclude_seen):
                candidate_set.add(mid)
        except Exception:
            pass

        if exclude_seen:
            candidate_set -= seen_movies

        if not candidate_set:
            candidate_set = set(self.all_movie_ids[:100]) - seen_movies

        scored_candidates = []
        for mid in candidate_set:
            score = (a * self.mf_model.predict(user_id, mid)) + \
                    (b * self.content_model.predict(user_id, mid)) + \
                    (c * self.popularity_model.predict(user_id, mid))
            scored_candidates.append((mid, float(score)))

        scored_candidates.sort(key=lambda x: x[1], reverse=True)
        return scored_candidates[:n]
