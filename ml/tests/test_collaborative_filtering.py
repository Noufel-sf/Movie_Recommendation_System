import pytest
import numpy as np
import pandas as pd
from ml.src.models.collaborative_filtering import ItemItemCollaborativeRecommender


def test_item_item_cf_similarity_and_co_raters():
    # User 1, 2, 3 all rate Movie 10 and Movie 20 identically high
    # Movie 30 only rated by User 1 (fewer than min_co_raters=2)
    train_df = pd.DataFrame({
        "user_id":  [1, 1, 1, 2, 2, 3, 3],
        "movie_id": [10, 20, 30, 10, 20, 10, 20],
        "rating":   [5.0, 5.0, 4.0, 4.0, 4.0, 5.0, 5.0],
        "timestamp":[1, 2, 3, 4, 5, 6, 7]
    })

    model = ItemItemCollaborativeRecommender(k_neighbors=5, min_co_raters=2)
    model.fit(train_df)

    # Movie 10 and Movie 20 share 3 co-raters, so similarity should be non-zero
    sim_10_20 = model.item_sim_matrix[model.movie_to_idx[10], model.movie_to_idx[20]]
    assert sim_10_20 > 0.0

    # Movie 30 only co-rated once with Movie 10 (< min_co_raters=2), so filtered to 0.0
    sim_10_30 = model.item_sim_matrix[model.movie_to_idx[10], model.movie_to_idx[30]]
    assert sim_10_30 == 0.0


def test_item_item_prediction_and_exclude_seen():
    # Users who liked Star Wars (1) also loved Empire Strikes Back (2)
    # User 4 has seen Star Wars (1) with 5.0, but hasn't seen Empire (2)
    train_df = pd.DataFrame({
        "user_id":  [1, 1, 2, 2, 3, 3, 4],
        "movie_id": [1, 2, 1, 2, 1, 2, 1],
        "rating":   [5.0, 5.0, 4.5, 4.5, 5.0, 5.0, 5.0],
        "timestamp":[10, 11, 12, 13, 14, 15, 16]
    })

    model = ItemItemCollaborativeRecommender(k_neighbors=5, min_co_raters=2)
    model.fit(train_df)

    # Predict rating for user 4 on movie 2
    predicted = model.predict(user_id=4, movie_id=2)
    assert predicted >= 4.0

    # Recommend for user 4 should return movie 2 as top recommendation and exclude movie 1
    recs = model.recommend(user_id=4, n=1, exclude_seen=True)
    assert len(recs) == 1
    assert recs[0][0] == 2  # Movie 2 recommended
