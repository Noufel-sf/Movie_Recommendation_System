import numpy as np
import pandas as pd
import pytest
from ml.src.features.embeddings import MovieEmbeddingGenerator
from ml.src.models.vector_search import VectorSearchEngine


@pytest.fixture
def sample_movie_data():
    movies_df = pd.DataFrame([
        {"movie_id": 1, "clean_title": "Toy Story", "genres": "Animation|Children|Comedy", "release_year": 1995},
        {"movie_id": 2, "clean_title": "Jumanji", "genres": "Adventure|Children|Fantasy", "release_year": 1995},
        {"movie_id": 3, "clean_title": "Heat", "genres": "Action|Crime|Thriller", "release_year": 1995},
        {"movie_id": 4, "clean_title": "Toy Story 2", "genres": "Animation|Children|Comedy", "release_year": 1999},
        {"movie_id": 5, "clean_title": "Casino", "genres": "Crime|Drama", "release_year": 1995},
    ])
    return movies_df


def test_embedding_generator(sample_movie_data):
    generator = MovieEmbeddingGenerator(target_dim=64)
    embeddings = generator.fit_transform(sample_movie_data)

    assert embeddings.shape == (5, 64)
    # Check that each vector is L2-normalized (length == 1.0)
    norms = np.linalg.norm(embeddings, axis=1)
    np.testing.assert_allclose(norms, 1.0, atol=1e-5)

    # SQL DDL generation test
    sql = generator.generate_pgvector_sql()
    assert "vector(64)" in sql
    assert "hnsw" in sql
    assert "vector_cosine_ops" in sql


def test_vector_search_engine_ranking(sample_movie_data):
    generator = MovieEmbeddingGenerator(target_dim=64)
    embeddings = generator.fit_transform(sample_movie_data)
    movie_ids = sample_movie_data["movie_id"].tolist()

    engine = VectorSearchEngine(embeddings=embeddings, movie_ids=movie_ids)

    # Toy Story (#1) should have highest similarity to Toy Story 2 (#4)
    cosine_results = engine.search_similar_movies(movie_id=1, n=2, metric="cosine")
    assert len(cosine_results) == 2
    top_mid, top_sim = cosine_results[0]
    assert top_mid == 4  # Toy Story 2
    assert top_sim > 0.7

    # For L2-normalized vectors, Cosine and Dot product rankings must be identical
    dot_results = engine.search_similar_movies(movie_id=1, n=2, metric="dot")
    assert [r[0] for r in cosine_results] == [r[0] for r in dot_results]

    # Euclidean distance should also identify Toy Story 2 (#4) as the nearest neighbor
    euclidean_results = engine.search_similar_movies(movie_id=1, n=2, metric="euclidean")
    assert euclidean_results[0][0] == 4


def test_vector_search_benchmark(sample_movie_data):
    generator = MovieEmbeddingGenerator(target_dim=64)
    embeddings = generator.fit_transform(sample_movie_data)
    engine = VectorSearchEngine(embeddings=embeddings, movie_ids=sample_movie_data["movie_id"].tolist())

    benchmark = engine.benchmark_metrics(movie_id=3, n=3)
    assert "cosine" in benchmark
    assert "dot" in benchmark
    assert "euclidean" in benchmark
    assert len(benchmark["cosine"]) <= 3
