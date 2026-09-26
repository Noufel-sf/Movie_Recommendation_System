import math
import pandas as pd
import numpy as np
from ml.src.models.base import BaseRecommender


class MostPopularRecommender(BaseRecommender):
    """
    Ranks movies strictly by interaction volume (how many users watched/rated it).
    Non-personalized baseline.
    """
    def __init__(self):
        self.popular_movies: list[tuple[int, float]] = []
        self.seen_by_user: dict[int, set[int]] = {}

    def fit(self, train_df: pd.DataFrame) -> "MostPopularRecommender":
        # Count frequency of each movie
        counts = train_df["movie_id"].value_counts()
        self.popular_movies = [(int(mid), float(cnt)) for mid, cnt in counts.items()]
        
        # Track items seen by user to optionally exclude them during recommendation
        self.seen_by_user = train_df.groupby("user_id")["movie_id"].apply(set).to_dict()
        return self

    def predict(self, user_id: int, movie_id: int) -> float:
        # Default to normalized popularity or 0
        for mid, count in self.popular_movies:
            if mid == movie_id:
                return float(count)
        return 0.0

    def recommend(
        self, 
        user_id: int, 
        n: int = 10, 
        exclude_seen: bool = True
    ) -> list[tuple[int, float]]:
        seen = self.seen_by_user.get(user_id, set()) if exclude_seen else set()
        recs = []
        for mid, score in self.popular_movies:
            if mid not in seen:
                recs.append((mid, score))
            if len(recs) == n:
                break
        return recs


class IMDBWeightedRecommender(BaseRecommender):
    """
    Bayesian Weighted Rating Recommender (IMDB formula):
        W = (v / (v + m)) * R + (m / (v + m)) * C
        
    Where:
        v: number of ratings for the movie
        R: average rating for the movie
        m: minimum ratings threshold (prior weight parameter)
        C: mean rating across the entire catalog (prior belief)
        
    Prevents a movie with 1 review of 5.0 from outranking The Godfather (4.5 with 200 reviews).
    """
    def __init__(self, m: float = 10.0):
        self.m = m
        self.C = 3.5  # Global default prior
        self.movie_scores: dict[int, float] = {}
        self.ranked_movies: list[tuple[int, float]] = []
        self.seen_by_user: dict[int, set[int]] = {}

    def fit(self, train_df: pd.DataFrame) -> "IMDBWeightedRecommender":
        self.C = float(train_df["rating"].mean())
        
        # Aggregate count (v) and mean rating (R)
        stats = train_df.groupby("movie_id")["rating"].agg(["count", "mean"]).reset_index()
        
        # Apply IMDB formula
        stats["weighted_score"] = (
            (stats["count"] / (stats["count"] + self.m)) * stats["mean"]
            + (self.m / (stats["count"] + self.m)) * self.C
        )
        
        sorted_stats = stats.sort_values(by="weighted_score", ascending=False)
        self.ranked_movies = [
            (int(row["movie_id"]), float(row["weighted_score"])) 
            for _, row in sorted_stats.iterrows()
        ]
        self.movie_scores = dict(self.ranked_movies)
        self.seen_by_user = train_df.groupby("user_id")["movie_id"].apply(set).to_dict()
        return self

    def predict(self, user_id: int, movie_id: int) -> float:
        return self.movie_scores.get(movie_id, self.C)

    def recommend(
        self, 
        user_id: int, 
        n: int = 10, 
        exclude_seen: bool = True
    ) -> list[tuple[int, float]]:
        seen = self.seen_by_user.get(user_id, set()) if exclude_seen else set()
        recs = []
        for mid, score in self.ranked_movies:
            if mid not in seen:
                recs.append((mid, score))
            if len(recs) == n:
                break
        return recs


class TimeDecayPopularityRecommender(BaseRecommender):
    """
    Trending / Recently Popular Recommender:
    Decays interaction weights exponentially based on timestamp age.
        weight = exp(-lambda * (max_timestamp - timestamp))
    """
    def __init__(self, half_life_days: float = 180.0):
        self.half_life_days = half_life_days
        self.ranked_movies: list[tuple[int, float]] = []
        self.seen_by_user: dict[int, set[int]] = {}

    def fit(self, train_df: pd.DataFrame) -> "TimeDecayPopularityRecommender":
        df = train_df.copy()
        max_time = df["timestamp"].max()
        # Convert seconds to days
        age_in_days = (max_time - df["timestamp"]) / (60 * 60 * 24)
        
        # decay constant lambda = ln(2) / half_life
        lam = math.log(2) / self.half_life_days
        df["decay_weight"] = np.exp(-lam * age_in_days)
        
        decayed_counts = df.groupby("movie_id")["decay_weight"].sum().reset_index()
        sorted_decayed = decayed_counts.sort_values(by="decay_weight", ascending=False)
        
        self.ranked_movies = [
            (int(row["movie_id"]), float(row["decay_weight"])) 
            for _, row in sorted_decayed.iterrows()
        ]
        self.seen_by_user = train_df.groupby("user_id")["movie_id"].apply(set).to_dict()
        return self

    def predict(self, user_id: int, movie_id: int) -> float:
        for mid, score in self.ranked_movies:
            if mid == movie_id:
                return score
        return 0.0

    def recommend(
        self, 
        user_id: int, 
        n: int = 10, 
        exclude_seen: bool = True
    ) -> list[tuple[int, float]]:
        seen = self.seen_by_user.get(user_id, set()) if exclude_seen else set()
        recs = []
        for mid, score in self.ranked_movies:
            if mid not in seen:
                recs.append((mid, score))
            if len(recs) == n:
                break
        return recs


class GenrePopularityRecommender:
    """
    Ranks top movies within a specific genre using Bayesian weighted rating.
    Useful for cold-start onboarding and genre browsing rows in the UI.
    """
    def __init__(self, m: float = 10.0):
        self.m = m
        self.genre_top_movies: dict[str, list[tuple[int, float]]] = {}

    def fit(self, train_df: pd.DataFrame, movies_df: pd.DataFrame) -> "GenrePopularityRecommender":
        # Merge ratings with movie genres
        merged = train_df.merge(movies_df, on="movie_id")
        global_mean = float(train_df["rating"].mean())
        
        # Explode pipe-separated genres
        merged["genre_list"] = merged["genres"].str.split("|")
        exploded = merged.explode("genre_list")
        exploded = exploded[exploded["genre_list"].str.strip() != ""]

        for genre, group in exploded.groupby("genre_list"):
            stats = group.groupby("movie_id")["rating"].agg(["count", "mean"]).reset_index()
            stats["weighted_score"] = (
                (stats["count"] / (stats["count"] + self.m)) * stats["mean"]
                + (self.m / (stats["count"] + self.m)) * global_mean
            )
            top = stats.sort_values(by="weighted_score", ascending=False)
            self.genre_top_movies[str(genre)] = [
                (int(row["movie_id"]), float(row["weighted_score"])) 
                for _, row in top.iterrows()
            ]
        return self

    def recommend_for_genre(self, genre: str, n: int = 10) -> list[tuple[int, float]]:
        return self.genre_top_movies.get(genre, [])[:n]
