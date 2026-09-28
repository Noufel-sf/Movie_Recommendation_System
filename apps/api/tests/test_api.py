from fastapi.testclient import TestClient
from apps.api.src.main import app


def test_health():
    with TestClient(app) as test_client:
        response = test_client.get("/api/v1/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"


def test_genres():
    with TestClient(app) as test_client:
        response = test_client.get("/api/v1/genres")
        assert response.status_code == 200
        data = response.json()
        assert "genres" in data
        assert len(data["genres"]) > 0
        assert "Action" in data["genres"]


def test_list_movies():
    with TestClient(app) as test_client:
        response = test_client.get("/api/v1/movies?page=1&page_size=10")
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 10
        assert data["total"] > 0
        assert "clean_title" in data["items"][0]


def test_movie_detail():
    with TestClient(app) as test_client:
        response = test_client.get("/api/v1/movies/1")
        assert response.status_code == 200
        data = response.json()
        assert data["movie_id"] == 1
        assert "Toy Story" in data["title"]


def test_similar_movies_endpoint():
    with TestClient(app) as test_client:
        response = test_client.get("/api/v1/movies/1/similar?n=6")
        assert response.status_code == 200
        data = response.json()
        assert "similar_movies" in data
        assert len(data["similar_movies"]) == 6
        assert "clean_title" in data["similar_movies"][0]
        assert "similarity_score" in data["similar_movies"][0]


def test_recommendations_endpoint():
    with TestClient(app) as test_client:
        response = test_client.get("/api/v1/recommendations?user_id=15&n=5")
        assert response.status_code == 200
        data = response.json()
        assert data["user_id"] == 15
        assert len(data["recommendations"]) == 5
        assert "explanation" in data["recommendations"][0]


def test_submit_rating():
    with TestClient(app) as test_client:
        payload = {"user_id": 999, "movie_id": 1, "rating": 4.5}
        response = test_client.post("/api/v1/ratings", json=payload)
        assert response.status_code == 200
        assert response.json()["rating"]["rating"] == 4.5


def test_onboarding_candidates():
    with TestClient(app) as test_client:
        response = test_client.get("/api/v1/onboarding/candidates?per_genre=1")
        assert response.status_code == 200
        data = response.json()
        assert "candidates" in data
        assert len(data["candidates"]) > 0
        assert "primary_genre" in data["candidates"][0]


def test_complete_onboarding_and_recommendations():
    with TestClient(app) as test_client:
        # Submit onboarding survey for User #999 choosing Toy Story (#1) and Star Wars (#260)
        payload = {"user_id": 999, "selected_movie_ids": [1, 260]}
        response = test_client.post("/api/v1/onboarding", json=payload)
        assert response.status_code == 200
        assert response.json()["status"] == "profile_initialized"

        # Now recommendations for User #999 should instantly return personalized centroid recs
        rec_res = test_client.get("/api/v1/recommendations?user_id=999&n=5&model=hybrid")
        assert rec_res.status_code == 200
        recs = rec_res.json()["recommendations"]
        assert len(recs) == 5
        assert "Matches your taste" in recs[0]["explanation"] or "Matches" in recs[0]["explanation"]
