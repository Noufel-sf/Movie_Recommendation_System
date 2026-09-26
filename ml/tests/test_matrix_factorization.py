import pytest
import numpy as np
import pandas as pd
from ml.src.models.matrix_factorization import ExplicitSGDMatrixFactorization, TruncatedSVDRecommender


def test_sgd_matrix_factorization_loss_converges():
    # Synthetic consistent interactions
    train_df = pd.DataFrame({
        "user_id":  [1, 1, 1, 2, 2, 3, 3, 3],
        "movie_id": [1, 2, 3, 1, 2, 2, 3, 4],
        "rating":   [5.0, 4.0, 1.0, 5.0, 4.5, 4.0, 1.5, 2.0],
        "timestamp":[10, 11, 12, 13, 14, 15, 16, 17]
    })

    model = ExplicitSGDMatrixFactorization(n_factors=5, lr=0.01, reg=0.01, n_epochs=20)
    model.fit(train_df)

    # 1. Verify loss decreased from first epoch to final epoch
    assert len(model.epoch_losses) == 20
    assert model.epoch_losses[-1] < model.epoch_losses[0]

    # 2. Check prediction boundaries
    pred = model.predict(user_id=1, movie_id=1)
    assert 0.5 <= pred <= 5.0

    # 3. Check cold-start fallback (unknown user)
    unknown_pred = model.predict(user_id=9999, movie_id=1)
    assert 0.5 <= unknown_pred <= 5.0

    # 4. Check recommendation excludes seen
    recs = model.recommend(user_id=1, n=2, exclude_seen=True)
    rec_ids = [mid for mid, _ in recs]
    assert 1 not in rec_ids
    assert 2 not in rec_ids
    assert 3 not in rec_ids


def test_truncated_svd_recommender():
    train_df = pd.DataFrame({
        "user_id":  [1, 1, 2, 2, 3, 3],
        "movie_id": [1, 2, 1, 2, 2, 3],
        "rating":   [5.0, 4.0, 4.5, 5.0, 3.5, 4.0],
        "timestamp":[1, 2, 3, 4, 5, 6]
    })

    model = TruncatedSVDRecommender(n_components=2)
    model.fit(train_df)

    pred = model.predict(user_id=1, movie_id=3)
    assert 0.5 <= pred <= 5.0

    recs = model.recommend(user_id=1, n=1, exclude_seen=True)
    assert len(recs) == 1
    assert recs[0][0] == 3  # Unseen movie 3 recommended
