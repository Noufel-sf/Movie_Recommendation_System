import pytest
import pandas as pd
import numpy as np
from pydantic import ValidationError

from ml.src.data.schemas import MovieRecord, RatingRecord
from ml.src.data.loader import clean_movies, clean_ratings, temporal_split, compute_sparsity


def test_movie_schema_genre_parsing():
    record = MovieRecord(movie_id=1, title="Toy Story (1995)", genres="Adventure|Animation|Children")
    assert record.movie_id == 1
    assert record.genres == ["Adventure", "Animation", "Children"]


def test_movie_schema_no_genre():
    record = MovieRecord(movie_id=2, title="Unknown Movie (2020)", genres="(no genres listed)")
    assert record.genres == []


def test_rating_schema_validation():
    valid = RatingRecord(user_id=1, movie_id=10, rating=4.5, timestamp=1600000000)
    assert valid.rating == 4.5
    
    with pytest.raises(ValidationError):
        # Invalid rating out of range
        RatingRecord(user_id=1, movie_id=10, rating=5.5, timestamp=1600000000)


def test_clean_movies_extracts_year():
    raw_df = pd.DataFrame({
        "movieId": [1, 2],
        "title": ["Toy Story (1995)", "Title Without Year"],
        "genres": ["Animation|Children", "(no genres listed)"]
    })
    cleaned = clean_movies(raw_df)
    assert cleaned.loc[0, "release_year"] == 1995.0
    assert cleaned.loc[0, "clean_title"] == "Toy Story"
    assert np.isnan(cleaned.loc[1, "release_year"])
    assert cleaned.loc[1, "clean_title"] == "Title Without Year"


def test_temporal_split_no_leakage():
    # 10 timestamps sequentially from 100 to 109
    df = pd.DataFrame({
        "user_id": [1] * 10,
        "movie_id": list(range(1, 11)),
        "rating": [4.0] * 10,
        "timestamp": list(range(100, 110))
    })
    
    train, val, test = temporal_split(df, val_ratio=0.2, test_ratio=0.2)
    
    assert len(train) == 6
    assert len(val) == 2
    assert len(test) == 2
    
    # Assert strict temporal ordering: max(train) <= min(val) and max(val) <= min(test)
    assert train["timestamp"].max() <= val["timestamp"].min()
    assert val["timestamp"].max() <= test["timestamp"].min()


def test_compute_sparsity():
    # 2 users, 2 items = 4 cells. If 1 rating is observed: sparsity = 1 - (1/4) = 0.75 (75%)
    assert compute_sparsity(n_users=2, n_items=2, n_ratings=1) == 0.75
