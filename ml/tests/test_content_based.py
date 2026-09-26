import pytest
import numpy as np
import pandas as pd

from ml.src.features.content_features import (
    build_genre_multihot_matrix,
    ManualTfidfVectorizer,
    cosine_similarity_matrix,
)
from ml.src.models.content_based import ContentBasedRecommender


def test_genre_multihot_matrix():
    movies_df = pd.DataFrame({
        "movie_id": [1, 2, 3],
        "genres": ["Action|Sci-Fi", "Comedy", "Action|Comedy"]
    })
    matrix, vocab, mid_to_idx = build_genre_multihot_matrix(movies_df)

    assert vocab == ["Action", "Comedy", "Sci-Fi"]
    assert matrix.shape == (3, 3)
    # Movie 1 has Action (col 0) and Sci-Fi (col 2)
    assert matrix[0, 0] == 1.0
    assert matrix[0, 1] == 0.0
    assert matrix[0, 2] == 1.0


def test_manual_tfidf_vectorizer():
    docs = [
        "Toy Story Animation Children",
        "Jumanji Adventure Children",
        "Heat Action Crime Thriller"
    ]
    vectorizer = ManualTfidfVectorizer()
    matrix = vectorizer.fit_transform(docs)

    # Check shape
    assert matrix.shape[0] == 3
    assert matrix.shape[1] > 0
    # Check L2 normalization: each row norm should be 1.0
    for row in matrix:
        assert np.isclose(np.linalg.norm(row), 1.0, atol=1e-5)


def test_cosine_similarity():
    v1 = np.array([[1.0, 0.0]])
    v2 = np.array([[1.0, 0.0]])
    v3 = np.array([[0.0, 1.0]])

    sim_identical = cosine_similarity_matrix(v1, v2)[0, 0]
    sim_orthogonal = cosine_similarity_matrix(v1, v3)[0, 0]

    assert np.isclose(sim_identical, 1.0)
    assert np.isclose(sim_orthogonal, 0.0)


def test_content_based_similar_movies_and_recommendations():
    movies_df = pd.DataFrame({
        "movie_id": [1, 2, 3, 4],
        "clean_title": ["Toy Story", "Bug's Life", "Die Hard", "Lethal Weapon"],
        "genres": [
            "Animation|Children",
            "Animation|Children",
            "Action|Thriller",
            "Action|Thriller"
        ]
    })

    train_df = pd.DataFrame({
        "user_id": [1, 1],
        "movie_id": [1, 2],       # User 1 loves Animation/Children
        "rating": [5.0, 4.5],
        "timestamp": [100, 101]
    })

    model = ContentBasedRecommender(use_tfidf=True).fit(train_df, movies_df)

    # 1. Test similar_movies: Toy Story (1) should be most similar to Bug's Life (2)
    sims = model.similar_movies(movie_id=1, n=2)
    assert len(sims) > 0
    top_similar_id, top_score = sims[0]
    assert top_similar_id == 2  # Bug's Life
    assert top_score > 0.0

    # 2. Test user recommendations: User 1 excluded seen [1, 2], so must receive unseen movies
    recs = model.recommend(user_id=1, n=2, exclude_seen=True)
    rec_ids = [mid for mid, _ in recs]
    assert 1 not in rec_ids
    assert 2 not in rec_ids

    # 3. Test explainability
    explanation = model.explain_recommendation(user_id=1, recommended_movie_id=2)
    assert "source_movie_id" in explanation
    assert explanation["source_movie_id"] in [1, 2]
