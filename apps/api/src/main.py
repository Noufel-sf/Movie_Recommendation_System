from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from apps.api.src.service import rec_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize and load model artifacts once at startup
    rec_service.initialize()
    yield


app = FastAPI(
    title="Movie Recommendation Engine API",
    version="1.0.0",
    description="Production-grade API serving baseline, content-based, and matrix-factorization recommendations.",
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


@app.get("/api/v1/health")
def health_check():
    return {"status": "ok", "service": "Movie Recommendation API"}


@app.get("/api/v1/genres")
def list_genres():
    """Return all unique movie genres."""
    genres_set = set()
    for g_str in rec_service.movies_df["genres"].dropna():
        for g in g_str.split("|"):
            if g.strip():
                genres_set.add(g.strip())
    return {"genres": sorted(list(genres_set))}


@app.get("/api/v1/movies")
def list_movies(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    genre: str = Query(None),
    query: str = Query(None),
):
    """Paginated movie catalog with search and genre filtering."""
    return rec_service.get_movies(page=page, page_size=page_size, genre=genre, query=query)


@app.get("/api/v1/movies/{movie_id}")
def movie_detail(movie_id: int):
    """Retrieve detailed metadata for a single movie."""
    detail = rec_service.get_movie_detail(movie_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Movie not found")
    return detail


@app.get("/api/v1/movies/{movie_id}/similar")
def similar_movies(movie_id: int, n: int = Query(10, ge=1, le=30)):
    """Retrieve top similar movies powered by content & latent similarities."""
    return {"similar_movies": rec_service.get_similar_movies(movie_id, n=n)}


@app.get("/api/v1/spotlights")
def spotlight_movies(count: int = Query(5, ge=1, le=10)):
    """Retrieve top spotlight movies with high-res backdrops for hero banner."""
    return {"spotlights": rec_service.get_spotlights(count=count)}


@app.get("/api/v1/trending")
def trending_movies(n: int = Query(10, ge=1, le=30)):
    """Retrieve top trending movies via time-decay popularity."""
    return {"trending": rec_service.get_trending(n=n)}


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
