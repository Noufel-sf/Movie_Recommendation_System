from pathlib import Path
import pandas as pd
import numpy as np

from ml.src.models.baseline import IMDBWeightedRecommender, TimeDecayPopularityRecommender
from ml.src.models.content_based import ContentBasedRecommender
from ml.src.models.matrix_factorization import ExplicitSGDMatrixFactorization


class RecommendationEngineService:
    """
    Singleton service managing in-memory models and precomputed artifacts for FastAPI.
    Decoupled from training: loads preprocessed data and fits fast inference artifacts at startup.
    """

    def __init__(self, data_dir: Path = Path("data/processed")):
        self.data_dir = data_dir
        self.movies_df: pd.DataFrame = pd.DataFrame()
        self.ratings_df: pd.DataFrame = pd.DataFrame()

        # Models
        self.popularity_model: IMDBWeightedRecommender = None
        self.trending_model: TimeDecayPopularityRecommender = None
        self.content_model: ContentBasedRecommender = None
        self.mf_model: ExplicitSGDMatrixFactorization = None

        # User runtime additions (dynamic ratings)
        self.dynamic_ratings: list[dict] = []

    def initialize(self):
        print("Initializing RecommendationEngineService...")
        movies_path = self.data_dir / "movies.parquet"
        ratings_path = self.data_dir / "ratings_train.parquet"

        if not movies_path.exists() or not ratings_path.exists():
            raise FileNotFoundError(f"Processed data not found at {self.data_dir}. Run ingestion pipeline first.")

        self.movies_df = pd.read_parquet(movies_path)
        self.ratings_df = pd.read_parquet(ratings_path)
        print(f"Loaded {len(self.movies_df):,} movies and {len(self.ratings_df):,} ratings.")

        # Fit models
        print("Fitting IMDB Popularity baseline...")
        self.popularity_model = IMDBWeightedRecommender(m=10.0).fit(self.ratings_df)

        print("Fitting Trending model...")
        self.trending_model = TimeDecayPopularityRecommender(half_life_days=180.0).fit(self.ratings_df)

        print("Fitting Content-Based model...")
        self.content_model = ContentBasedRecommender(use_tfidf=True).fit(self.ratings_df, self.movies_df)

        print("Fitting Matrix Factorization model (SGD)...")
        self.mf_model = ExplicitSGDMatrixFactorization(
            n_factors=20, 
            lr=0.005, 
            reg=0.02, 
            n_epochs=10, 
            random_state=42
        ).fit(self.ratings_df)

        print("RecommendationEngineService ready!")

    def get_movies(self, page: int = 1, page_size: int = 20, genre: str = None, query: str = None):
        df = self.movies_df
        if genre and genre.lower() != "all":
            df = df[df["genres"].str.contains(genre, case=False, na=False)]
        if query and query.strip():
            df = df[df["title"].str.contains(query.strip(), case=False, na=False)]

        total = len(df)
        start = (page - 1) * page_size
        end = start + page_size
        items = df.iloc[start:end].to_dict(orient="records")

        # Enrich with weighted rating if available
        for item in items:
            mid = item["movie_id"]
            item["score"] = round(self.popularity_model.predict(0, mid), 2)
            item["genres_list"] = [g.strip() for g in item["genres"].split("|") if g.strip()] if item["genres"] else []

        return {"items": items, "total": total, "page": page, "page_size": page_size}

    def get_movie_detail(self, movie_id: int):
        match = self.movies_df[self.movies_df["movie_id"] == movie_id]
        if match.empty:
            return None
        item = match.iloc[0].to_dict()
        item["score"] = round(self.popularity_model.predict(0, movie_id), 2)
        item["genres_list"] = [g.strip() for g in item["genres"].split("|") if g.strip()] if item["genres"] else []
        return item

    def get_similar_movies(self, movie_id: int, n: int = 10):
        # Use content model + latent factors
        content_sims = self.content_model.similar_movies(movie_id, n=n)
        results = []
        for mid, sim in content_sims:
            detail = self.get_movie_detail(mid)
            if detail:
                detail["similarity_score"] = round(sim, 3)
                results.append(detail)
        return results

    def get_recommendations(self, user_id: int, n: int = 10):
        """
        Hybrid recommendation:
        Uses Matrix Factorization if user has history, with Content-based explanations,
        falling back gracefully to Bayesian Popularity for cold-start users.
        """
        user_has_history = user_id in self.mf_model.user_to_idx
        
        if user_has_history:
            mf_recs = self.mf_model.recommend(user_id, n=n, exclude_seen=True)
            recs_to_format = mf_recs
        else:
            # Cold start fallback
            pop_recs = self.popularity_model.recommend(user_id, n=n, exclude_seen=True)
            recs_to_format = pop_recs

        results = []
        for mid, score in recs_to_format:
            detail = self.get_movie_detail(mid)
            if detail:
                detail["match_score"] = round(float(score), 2)
                # Attach explanation
                if user_has_history:
                    explanation = self.content_model.explain_recommendation(user_id, mid)
                    detail["explanation"] = explanation.get("reason", "Matches your taste profile")
                else:
                    detail["explanation"] = "Trending choice popular among all viewers"
                results.append(detail)

        return results

    def get_trending(self, n: int = 10):
        recs = self.trending_model.recommend(0, n=n, exclude_seen=False)
        results = []
        for mid, score in recs:
            detail = self.get_movie_detail(mid)
            if detail:
                results.append(detail)
        return results

    def add_rating(self, user_id: int, movie_id: int, rating: float):
        entry = {"user_id": user_id, "movie_id": movie_id, "rating": rating}
        self.dynamic_ratings.append(entry)
        # Update user history in content model
        if user_id not in self.content_model.user_history:
            self.content_model.user_history[user_id] = []
        self.content_model.user_history[user_id].append((movie_id, rating))
        self.content_model.user_profiles[user_id] = self.content_model._build_user_profile(user_id)
        return entry


# Global engine instance
rec_service = RecommendationEngineService()
