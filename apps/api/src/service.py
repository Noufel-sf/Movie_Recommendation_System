import json
from pathlib import Path
import pandas as pd
import numpy as np

from ml.src.models.baseline import IMDBWeightedRecommender, TimeDecayPopularityRecommender
from ml.src.models.content_based import ContentBasedRecommender
from ml.src.models.matrix_factorization import ExplicitSGDMatrixFactorization

# Curated fallback posters by genre
GENRE_FALLBACK_IMAGES = {
    "Action": "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop&q=80",
    "Adventure": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80",
    "Animation": "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=80",
    "Comedy": "https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=500&auto=format&fit=crop&q=80",
    "Crime": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&auto=format&fit=crop&q=80",
    "Drama": "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=500&auto=format&fit=crop&q=80",
    "Horror": "https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=500&auto=format&fit=crop&q=80",
    "Sci-Fi": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500&auto=format&fit=crop&q=80",
    "Thriller": "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=500&auto=format&fit=crop&q=80",
    "Default": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80",
}


class RecommendationEngineService:
    """
    Singleton service managing in-memory models and precomputed artifacts for FastAPI.
    Decoupled from training: loads preprocessed data and fits fast inference artifacts at startup.
    """

    def __init__(self, data_dir: Path = Path("data/processed")):
        self.data_dir = data_dir
        self.movies_df: pd.DataFrame = pd.DataFrame()
        self.ratings_df: pd.DataFrame = pd.DataFrame()
        self.tmdb_cache: dict[str, dict] = {}

        # Models
        self.popularity_model: IMDBWeightedRecommender = None
        self.trending_model: TimeDecayPopularityRecommender = None
        self.content_model: ContentBasedRecommender = None
        self.mf_model: ExplicitSGDMatrixFactorization = None

        # Dynamic user additions
        self.dynamic_ratings: list[dict] = []

    def initialize(self):
        print("Initializing RecommendationEngineService...")
        movies_path = self.data_dir / "movies.parquet"
        ratings_path = self.data_dir / "ratings_train.parquet"
        cache_path = self.data_dir / "tmdb_cache.json"

        if not movies_path.exists() or not ratings_path.exists():
            raise FileNotFoundError(f"Processed data not found at {self.data_dir}. Run ingestion pipeline first.")

        self.movies_df = pd.read_parquet(movies_path)
        self.ratings_df = pd.read_parquet(ratings_path)

        if cache_path.exists():
            try:
                with open(cache_path, "r", encoding="utf-8") as f:
                    self.tmdb_cache = json.load(f)
                print(f"Loaded TMDB visual cache for {len(self.tmdb_cache)} movies.")
            except Exception as e:
                print(f"Warning: could not read tmdb_cache.json: {e}")

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

    def _enrich_movie(self, movie_dict: dict) -> dict:
        mid_str = str(movie_dict["movie_id"])
        meta = self.tmdb_cache.get(mid_str, {})
        
        # Parse genres list
        genres_raw = movie_dict.get("genres", "") or ""
        genres_list = [g.strip() for g in genres_raw.split("|") if g.strip()]
        movie_dict["genres_list"] = genres_list
        primary_genre = genres_list[0] if genres_list else "Default"

        movie_dict["poster_url"] = meta.get("poster_path") or meta.get("poster_url") or GENRE_FALLBACK_IMAGES.get(primary_genre, GENRE_FALLBACK_IMAGES["Default"])
        movie_dict["backdrop_url"] = meta.get("backdrop_path") or meta.get("backdrop_url") or movie_dict["poster_url"]
        movie_dict["overview"] = meta.get("overview") or f"{movie_dict.get('clean_title', movie_dict.get('title'))} is a classic {genres_raw.replace('|', ' / ')} production."
        movie_dict["runtime"] = meta.get("runtime") or 118
        movie_dict["vote_average"] = meta.get("vote_average") or round(self.popularity_model.predict(0, movie_dict["movie_id"]), 1)
        movie_dict["vote_count"] = meta.get("vote_count") or 1200
        movie_dict["score"] = round(self.popularity_model.predict(0, movie_dict["movie_id"]), 2)
        return movie_dict

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

        enriched = [self._enrich_movie(item) for item in items]
        return {"items": enriched, "total": total, "page": page, "page_size": page_size}

    def get_movie_detail(self, movie_id: int):
        match = self.movies_df[self.movies_df["movie_id"] == movie_id]
        if match.empty:
            return None
        item = match.iloc[0].to_dict()
        return self._enrich_movie(item)

    def get_similar_movies(self, movie_id: int, n: int = 10):
        content_sims = self.content_model.similar_movies(movie_id, n=n)
        results = []
        for mid, sim in content_sims:
            detail = self.get_movie_detail(mid)
            if detail:
                detail["similarity_score"] = round(sim, 3)
                results.append(detail)
        return results

    def get_recommendations(self, user_id: int, n: int = 10):
        user_has_history = user_id in self.mf_model.user_to_idx
        
        if user_has_history:
            mf_recs = self.mf_model.recommend(user_id, n=n, exclude_seen=True)
            recs_to_format = mf_recs
        else:
            pop_recs = self.popularity_model.recommend(user_id, n=n, exclude_seen=True)
            recs_to_format = pop_recs

        results = []
        for mid, score in recs_to_format:
            detail = self.get_movie_detail(mid)
            if detail:
                detail["match_score"] = round(float(score), 2)
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

    def get_spotlights(self, count: int = 5):
        """Top spotlight movies with rich backdrops and synopses for the hero carousel."""
        # Pick top acclaimed movies with backdrops in cache
        cached_mids = [int(m) for m in self.tmdb_cache.keys()]
        popular_cached = [mid for mid, _ in self.popularity_model.ranked_movies if mid in cached_mids]
        selected = popular_cached[:count]
        
        spotlights = []
        for mid in selected:
            detail = self.get_movie_detail(mid)
            if detail and detail.get("backdrop_url"):
                spotlights.append(detail)
        return spotlights

    def add_rating(self, user_id: int, movie_id: int, rating: float):
        entry = {"user_id": user_id, "movie_id": movie_id, "rating": rating}
        self.dynamic_ratings.append(entry)
        if user_id not in self.content_model.user_history:
            self.content_model.user_history[user_id] = []
        self.content_model.user_history[user_id].append((movie_id, rating))
        self.content_model.user_profiles[user_id] = self.content_model._build_user_profile(user_id)
        return entry


# Global engine instance
rec_service = RecommendationEngineService()
