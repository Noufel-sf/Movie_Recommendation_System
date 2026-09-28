import numpy as np
import pandas as pd
import pytest
from ml.src.models.cold_start import ColdStartOnboardingEngine


@pytest.fixture
def mock_cold_start_setup():
    movies_data = [
        {"movie_id": 1, "clean_title": "Toy Story", "genres": "Animation|Children|Comedy", "vote_count": 1000},
        {"movie_id": 2, "clean_title": "Jumanji", "genres": "Adventure|Children|Fantasy", "vote_count": 500},
        {"movie_id": 3, "clean_title": "Heat", "genres": "Action|Crime|Thriller", "vote_count": 800},
        {"movie_id": 4, "clean_title": "Star Wars", "genres": "Action|Adventure|Sci-Fi", "vote_count": 1500},
        {"movie_id": 5, "clean_title": "Die Hard", "genres": "Action|Thriller", "vote_count": 900},
    ]
    movies_df = pd.DataFrame(movies_data)

    # 5 movies, each with a 3-dimensional normalized feature vector
    raw_vectors = np.array([
        [0.9, 0.1, 0.0],  # Toy Story (Animation/Comedy)
        [0.7, 0.3, 0.0],  # Jumanji
        [0.0, 0.8, 0.6],  # Heat (Action/Crime)
        [0.1, 0.9, 0.4],  # Star Wars (Action/Sci-Fi)
        [0.0, 0.9, 0.4],  # Die Hard (Action/Thriller)
    ], dtype=np.float32)

    # Normalize vectors
    norms = np.linalg.norm(raw_vectors, axis=1, keepdims=True)
    movie_vectors = raw_vectors / norms

    movie_id_to_idx = {row["movie_id"]: i for i, row in enumerate(movies_data)}
    idx_to_movie_id = {i: row["movie_id"] for i, row in enumerate(movies_data)}

    engine = ColdStartOnboardingEngine(
        movies_df=movies_df,
        movie_vectors=movie_vectors,
        movie_id_to_idx=movie_id_to_idx,
        idx_to_movie_id=idx_to_movie_id,
    )
    return engine


def test_get_onboarding_candidates(mock_cold_start_setup):
    engine = mock_cold_start_setup
    candidates = engine.get_onboarding_candidates(per_genre=1)
    assert len(candidates) > 0
    assert "movie_id" in candidates[0]
    assert "primary_genre" in candidates[0]


def test_initialize_user_profile_and_recommend(mock_cold_start_setup):
    engine = mock_cold_start_setup
    new_user_id = 999

    # User #999 chooses Action movie #3 (Heat) during onboarding
    centroid = engine.initialize_user_profile(
        user_id=new_user_id,
        selected_movie_ids=[3],
    )
    assert isinstance(centroid, np.ndarray)
    assert np.isclose(np.linalg.norm(centroid), 1.0)

    # Recommendations should prioritize other Action movies (4: Star Wars, 5: Die Hard) over Toy Story (1)
    recs = engine.recommend(user_id=new_user_id, n=2, exclude_seen=True)
    assert len(recs) == 2
    rec_ids = [r[0] for r in recs]

    # Movie #3 was seen, so it shouldn't be in recs
    assert 3 not in rec_ids
    # Action movies (4 and 5) should rank above Toy Story (1)
    assert rec_ids[0] in [4, 5]
    assert "explanation" in recs[0][2] or "Matches" in recs[0][2]
