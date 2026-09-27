import pytest
import pandas as pd
import numpy as np

from ml.src.models.hybrid import HybridRecommender
from ml.src.models.baseline import IMDBWeightedRecommender
from ml.src.models.content_based import ContentBasedRecommender
from ml.src.models.matrix_factorization import ExplicitSGDMatrixFactorization


@pytest.fixture
def sample_dataset():
    movies_df = pd.DataFrame({
        "movie_id": [1, 2, 3, 4],
        "title": ["Toy Story (1995)", "Jumanji (1995)", "Heat (1995)", "Casino (1995)"],
        "genres": ["Animation|Children|Comedy", "Adventure|Children", "Action|Crime|Thriller", "Crime|Drama"],
    })
    ratings_df = pd.DataFrame({
        "user_id": [1, 1, 2, 2, 3, 3, 4],
        "movie_id": [1, 2, 2, 3, 1, 4, 3],
        "rating": [5.0, 4.0, 3.5, 4.5, 4.0, 5.0, 4.0],
        "timestamp": [100, 101, 102, 103, 104, 105, 106],
    })
    return movies_df, ratings_df


def test_hybrid_weights_normalization(sample_dataset):
    movies_df, ratings_df = sample_dataset
    hybrid = HybridRecommender(alpha=2.0, beta=1.0, gamma=1.0)
    assert np.isclose(hybrid.alpha, 0.5)
    assert np.isclose(hybrid.beta, 0.25)
    assert np.isclose(hybrid.gamma, 0.25)


def test_hybrid_fit_and_predict(sample_dataset):
    movies_df, ratings_df = sample_dataset
    hybrid = HybridRecommender(alpha=0.5, beta=0.3, gamma=0.2)
    hybrid.fit(ratings_df, movies_df)

    pred = hybrid.predict(user_id=1, movie_id=3)
    assert 0.5 <= pred <= 5.0


def test_hybrid_recommend_exclude_seen(sample_dataset):
    movies_df, ratings_df = sample_dataset
    hybrid = HybridRecommender(alpha=0.5, beta=0.3, gamma=0.2)
    hybrid.fit(ratings_df, movies_df)

    # User 1 has rated movies 1 and 2
    recs = hybrid.recommend(user_id=1, n=2, exclude_seen=True)
    rec_ids = [mid for mid, _ in recs]

    assert 1 not in rec_ids
    assert 2 not in rec_ids
    assert len(recs) <= 2
