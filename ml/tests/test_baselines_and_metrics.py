import pytest
import math
import pandas as pd
import numpy as np

from ml.src.evaluation.metrics import rmse, mae, precision_at_k, recall_at_k, ndcg_at_k
from ml.src.models.baseline import (
    MostPopularRecommender,
    IMDBWeightedRecommender,
    TimeDecayPopularityRecommender,
    GenrePopularityRecommender,
)


def test_rmse_and_mae():
    y_true = [3.0, 4.0]
    y_pred = [4.0, 2.0]
    # errors: +1.0, -2.0
    # mae = (1.0 + 2.0) / 2 = 1.5
    # rmse = sqrt((1.0^2 + (-2.0)^2) / 2) = sqrt(5.0 / 2) = sqrt(2.5)
    assert mae(y_true, y_pred) == 1.5
    assert math.isclose(rmse(y_true, y_pred), math.sqrt(2.5), rel_tol=1e-5)


def test_ranking_metrics_precision_recall():
    recommended = [10, 20, 30, 40]
    relevant = {20, 40}

    # At K=2 (recommended: [10, 20]) -> 1 hit out of 2
    assert precision_at_k(recommended, relevant, k=2) == 0.5
    assert recall_at_k(recommended, relevant, k=2) == 0.5

    # At K=4 (recommended: [10, 20, 30, 40]) -> 2 hits out of 4 recommended, 2 out of 2 relevant
    assert precision_at_k(recommended, relevant, k=4) == 0.5
    assert recall_at_k(recommended, relevant, k=4) == 1.0


def test_ndcg_at_k_position_sensitivity():
    relevant = {100}

    # Hit at rank 1: ideal ranking -> NDCG = 1.0
    ndcg_rank1 = ndcg_at_k(recommended_ids=[100, 200], actual_relevant_ids=relevant, k=2)
    assert math.isclose(ndcg_rank1, 1.0)

    # Hit at rank 2: discounted -> DCG = 1/log2(3), IDCG = 1/log2(2)=1
    ndcg_rank2 = ndcg_at_k(recommended_ids=[200, 100], actual_relevant_ids=relevant, k=2)
    expected = (1.0 / math.log2(3)) / (1.0 / math.log2(2))
    assert math.isclose(ndcg_rank2, expected, rel_tol=1e-5)
    assert ndcg_rank1 > ndcg_rank2


def test_imdb_bayesian_shrinkage():
    # Movie 1: 1 vote of 5.0 (low confidence)
    # Movie 2: 50 votes of 4.5 (high confidence)
    # Movie 3..20: 100 votes of 3.0 (catalog bulk defining global prior C ~ 3.5)
    train_df = pd.DataFrame({
        "user_id": list(range(1, 152)),
        "movie_id": [1] + [2] * 50 + [3] * 100,
        "rating": [5.0] + [4.5] * 50 + [3.0] * 100,
        "timestamp": [1000] * 151,
    })

    recommender = IMDBWeightedRecommender(m=10.0)
    recommender.fit(train_df)

    score_1 = recommender.predict(user_id=999, movie_id=1)
    score_2 = recommender.predict(user_id=999, movie_id=2)

    # Movie 2 (many 4.5 ratings) must beat Movie 1 (single 5.0 rating) because Movie 1 shrinks toward C ~ 3.5
    assert score_2 > score_1


def test_most_popular_and_exclude_seen():
    train_df = pd.DataFrame({
        "user_id": [1, 1, 2, 3],
        "movie_id": [10, 20, 10, 10],  # Movie 10 has 3 votes, Movie 20 has 1 vote
        "rating": [4.0, 5.0, 3.0, 4.5],
        "timestamp": [100, 101, 102, 103],
    })

    model = MostPopularRecommender().fit(train_df)
    
    # For user 2 (who saw movie 10), top recommendation excluding seen should be movie 20
    recs = model.recommend(user_id=2, n=1, exclude_seen=True)
    assert len(recs) == 1
    assert recs[0][0] == 20
