-- ===================================================
-- Phase 9: PostgreSQL + pgvector Schema with HNSW Index
-- ===================================================

CREATE EXTENSION IF NOT EXISTS vector;

DROP TABLE IF EXISTS movie_embeddings CASCADE;

CREATE TABLE movie_embeddings (
    movie_id INT PRIMARY KEY,
    embedding vector(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- HNSW (Hierarchical Navigable Small World) index for sub-millisecond Cosine distance queries (<=>)
CREATE INDEX IF NOT EXISTS movie_embeddings_hnsw_idx 
ON movie_embeddings 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
