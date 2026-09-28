-- ==============================================================================
-- PRODUCTION POSTGRESQL SCHEMA WITH PGVECTOR & SPECIALIZED INDEXES
-- Covers: Phase 9 (ANN Search) & Phase 12 (Full Relational + Telemetry Schema)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. USERS
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. GENRES
CREATE TABLE IF NOT EXISTS genres (
    genre_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- 4. MOVIES
CREATE TABLE IF NOT EXISTS movies (
    movie_id INT PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    clean_title VARCHAR(500),
    release_year INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. MOVIE_GENRES (Normalized Many-to-Many junction)
CREATE TABLE IF NOT EXISTS movie_genres (
    movie_id INT REFERENCES movies(movie_id) ON DELETE CASCADE,
    genre_id INT REFERENCES genres(genre_id) ON DELETE CASCADE,
    PRIMARY KEY (movie_id, genre_id)
);

-- 6. RATINGS (Explicit Feedback)
CREATE TABLE IF NOT EXISTS ratings (
    id BIGSERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    movie_id INT REFERENCES movies(movie_id) ON DELETE CASCADE,
    rating NUMERIC(2,1) NOT NULL CHECK (rating >= 0.5 AND rating <= 5.0),
    rating_timestamp BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_movie_rating UNIQUE (user_id, movie_id)
);

-- 7. LIKES (Implicit Positive Preference)
CREATE TABLE IF NOT EXISTS likes (
    id BIGSERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    movie_id INT REFERENCES movies(movie_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_movie_like UNIQUE (user_id, movie_id)
);

-- 8. WATCH HISTORY (Implicit Consumption Telemetry)
CREATE TABLE IF NOT EXISTS watch_history (
    id BIGSERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    movie_id INT REFERENCES movies(movie_id) ON DELETE CASCADE,
    watch_percentage NUMERIC(3,2) NOT NULL DEFAULT 1.00 CHECK (watch_percentage >= 0.00 AND watch_percentage <= 1.00),
    completed BOOLEAN NOT NULL DEFAULT TRUE,
    watched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. PRECOMPUTED / LOGGED RECOMMENDATIONS
CREATE TABLE IF NOT EXISTS recommendations (
    id BIGSERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    movie_id INT REFERENCES movies(movie_id) ON DELETE CASCADE,
    model_type VARCHAR(50) NOT NULL,
    rank INT NOT NULL,
    predicted_score NUMERIC(5,4),
    explanation TEXT,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. EXPERIMENTS & MODEL REGISTRY
CREATE TABLE IF NOT EXISTS experiments (
    experiment_id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS model_versions (
    version_id SERIAL PRIMARY KEY,
    experiment_id INT REFERENCES experiments(experiment_id) ON DELETE SET NULL,
    model_name VARCHAR(100) NOT NULL,
    version VARCHAR(50) NOT NULL,
    rmse NUMERIC(6,4),
    mae NUMERIC(6,4),
    ndcg_at_10 NUMERIC(6,4),
    map_at_10 NUMERIC(6,4),
    artifact_uri TEXT,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. PGVECTOR EMBEDDINGS (Phase 9)
CREATE TABLE IF NOT EXISTS movie_embeddings (
    movie_id INT PRIMARY KEY REFERENCES movies(movie_id) ON DELETE CASCADE,
    embedding vector(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- INDEXING STRATEGY & QUERY OPTIMIZATIONS
-- ==============================================================================

-- A. Ratings Queries:
-- 1. Index on user_id: Critical for fast retrieval of a user's entire history during real-time inference (O(log N))
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings(user_id);

-- 2. Index on movie_id: Needed for movie aggregations (mean rating, vote count, collaborative filtering lookups)
CREATE INDEX IF NOT EXISTS idx_ratings_movie_id ON ratings(movie_id);

-- 3. Composite Index on (movie_id, rating): Accelerates IMDb weighted ranking and item-item similarity co-occurrences
CREATE INDEX IF NOT EXISTS idx_ratings_movie_rating ON ratings(movie_id, rating);

-- 4. Index on timestamp: Enables time-decay popularity and sequential train/validation/test chronological splits
CREATE INDEX IF NOT EXISTS idx_ratings_timestamp ON ratings(rating_timestamp DESC);

-- B. Telemetry & User Queries:
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_history_user_watched ON watch_history(user_id, watched_at DESC);

-- C. Recommendation Serving:
-- Composite index for instant sub-millisecond retrieval of user recommendations by model:
CREATE INDEX IF NOT EXISTS idx_recommendations_user_model ON recommendations(user_id, model_type, generated_at DESC);

-- D. Vector Search Index (HNSW for Cosine Distance):
CREATE INDEX IF NOT EXISTS movie_embeddings_hnsw_idx 
ON movie_embeddings 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
