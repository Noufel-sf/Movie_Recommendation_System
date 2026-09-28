from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from apps.api.src.service import rec_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize and load model artifacts once at startup (Training decoupled from Inference)
    rec_service.initialize()
    yield


app = FastAPI(
    title="Movie Recommendation Engine API",
    version="1.0.0",
    description="Production-grade API serving baseline, content-based, matrix-factorization, and vector search recommendations.",
    lifespan=lifespan,
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RatingSubmission(BaseModel):
    user_id: int = Field(gt=0, description="Target user ID")
    movie_id: int = Field(gt=0, description="Target movie ID")
    rating: float = Field(ge=0.5, le=5.0, description="Rating between 0.5 and 5.0")


class LikeSubmission(BaseModel):
    user_id: int = Field(gt=0, description="Target user ID")
    movie_id: int = Field(gt=0, description="Target movie ID")


class WatchHistorySubmission(BaseModel):
    user_id: int = Field(gt=0, description="Target user ID")
    movie_id: int = Field(gt=0, description="Target movie ID")
    watch_percentage: float = Field(1.0, ge=0.0, le=1.0, description="Fraction of movie watched (0.0 to 1.0)")
    completed: bool = Field(True, description="Whether user completed the movie")


class OnboardingSubmission(BaseModel):
    user_id: int = Field(gt=0, description="Target user ID (e.g. 999)")
    selected_movie_ids: list[int] = Field(..., min_length=1, max_length=20, description="Selected seed movie IDs")


# ==========================================
# HEALTH ENDPOINTS
# ==========================================
@app.get("/health")
@app.get("/api/v1/health")
def health_check():
    return {"status": "ok", "service": "Movie Recommendation API"}


# ==========================================
# MOVIE CATALOG & SEARCH
# ==========================================
@app.get("/api/v1/genres")
def list_genres():
    """Return all unique movie genres."""
    genres_set = set()
    for g_str in rec_service.movies_df["genres"].dropna():
        for g in g_str.split("|"):
            if g.strip():
                genres_set.add(g.strip())
    return {"genres": sorted(list(genres_set))}


@app.get("/movies/search")
@app.get("/api/v1/movies/search")
def search_movies(
    q: str = Query(..., min_length=1, description="Movie title query"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """Phase 10: Dedicated search endpoint by movie title."""
    return rec_service.search_movies(query=q, page=page, page_size=page_size)


@app.get("/movies")
@app.get("/api/v1/movies")
def list_movies(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    genre: str = Query(None),
    query: str = Query(None),
):
    """Paginated movie catalog with search and genre filtering."""
    return rec_service.get_movies(page=page, page_size=page_size, genre=genre, query=query)


@app.get("/movies/{movie_id}")
@app.get("/api/v1/movies/{movie_id}")
def movie_detail(movie_id: int):
    """Retrieve detailed metadata for a single movie."""
    detail = rec_service.get_movie_detail(movie_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Movie not found")
    return detail


@app.get("/movies/{movie_id}/similar")
@app.get("/api/v1/movies/{movie_id}/similar")
def similar_movies(movie_id: int, n: int = Query(10, ge=1, le=30)):
    """Retrieve top similar movies powered by content & latent similarities."""
    return {"similar_movies": rec_service.get_similar_movies(movie_id, n=n)}


@app.get("/api/v1/movies/{movie_id}/vector-similar")
def vector_similar_movies(
    movie_id: int,
    n: int = Query(10, ge=1, le=30),
    metric: str = Query("cosine", description="Distance metric: cosine, dot, or euclidean"),
):
    """
    Phase 9: Retrieve nearest neighbor movies via 64-dimensional dense vector embeddings.
    """
    return {
        "movie_id": movie_id,
        "metric": metric,
        "similar_movies": rec_service.get_vector_similar_movies(movie_id, n=n, metric=metric),
    }


@app.get("/api/v1/spotlights")
def spotlight_movies(count: int = Query(5, ge=1, le=10)):
    """Retrieve top spotlight movies with high-res backdrops for hero banner."""
    return {"spotlights": rec_service.get_spotlights(count=count)}


@app.get("/api/v1/trending")
def trending_movies(n: int = Query(10, ge=1, le=30)):
    """Retrieve top trending movies via time-decay popularity."""
    return {"trending": rec_service.get_trending(n=n)}


# ==========================================
# RECOMMENDATIONS
# ==========================================
@app.get("/recommendations")
@app.get("/api/v1/recommendations")
def personalized_recommendations(
    user_id: int = Query(..., ge=1),
    n: int = Query(10, ge=1, le=30),
    model: str = Query("hybrid", description="Recommendation algorithm: hybrid, svd, content, or popularity"),
):
    """
    Retrieve personalized top-N recommendations with model-derived explanations.
    Supports algorithm selection: 'hybrid' (Weighted SVD+Content+Bayesian), 'svd', 'content', or 'popularity'.
    """
    recs = rec_service.get_recommendations(user_id=user_id, n=n, model_type=model)
    return {"user_id": user_id, "model": model, "recommendations": recs}


@app.get("/users/{user_id}/recommendations")
@app.get("/api/v1/users/{user_id}/recommendations")
def user_recommendations(
    user_id: int,
    n: int = Query(10, ge=1, le=30),
    model: str = Query("hybrid"),
):
    """Phase 10: User-centric recommendations endpoint."""
    return personalized_recommendations(user_id=user_id, n=n, model=model)


# ==========================================
# USER PROFILE & FEEDBACK (Explicit & Implicit)
# ==========================================
@app.get("/users/{user_id}/profile")
@app.get("/api/v1/users/{user_id}/profile")
def get_user_profile(user_id: int):
    """
    Phase 10: Retrieve user profile summary including rating count, top genres, likes, and watch history.
    """
    return rec_service.get_user_profile(user_id)


@app.post("/ratings")
@app.post("/api/v1/ratings")
def submit_rating(submission: RatingSubmission):
    """
    Submit an explicit user rating to update user profile recommendations.
    """
    result = rec_service.add_rating(
        user_id=submission.user_id,
        movie_id=submission.movie_id,
        rating=submission.rating,
    )
    return {"message": "Rating recorded successfully", "rating": result}


@app.post("/likes")
@app.post("/api/v1/likes")
def submit_like(submission: LikeSubmission):
    """
    Phase 10: Submit implicit positive feedback (Like).
    """
    result = rec_service.add_like(
        user_id=submission.user_id,
        movie_id=submission.movie_id,
    )
    return {"message": "Like recorded successfully", "data": result}


@app.post("/watch-history")
@app.post("/api/v1/watch-history")
def submit_watch_history(submission: WatchHistorySubmission):
    """
    Phase 10: Submit implicit consumption telemetry (watch percentage).
    """
    result = rec_service.add_watch_history(
        user_id=submission.user_id,
        movie_id=submission.movie_id,
        watch_percentage=submission.watch_percentage,
        completed=submission.completed,
    )
    return {"message": "Watch event recorded successfully", "data": result}


# ==========================================
# COLD-START ONBOARDING
# ==========================================
@app.get("/api/v1/onboarding/candidates")
def onboarding_candidates(per_genre: int = Query(2, ge=1, le=5)):
    """
    Retrieve diverse, high-recognition seed movies across core genres for new user onboarding.
    """
    candidates = rec_service.get_onboarding_candidates(per_genre=per_genre)
    return {"candidates": candidates, "total": len(candidates)}


@app.post("/api/v1/onboarding")
def complete_onboarding(submission: OnboardingSubmission):
    """
    Submit user onboarding selections to instantly synthesize their taste centroid vector.
    """
    result = rec_service.complete_onboarding(
        user_id=submission.user_id,
        selected_movie_ids=submission.selected_movie_ids,
    )
    return result
