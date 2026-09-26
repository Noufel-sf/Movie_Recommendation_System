import pytest
from fastapi.testclient import TestClient
from apps.api.src.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_genres_endpoint():
    with TestClient(app) as test_client:
        response = test_client.get("/api/v1/genres")
        assert response.status_code == 200
        genres = response.json()["genres"]
        assert "Action" in genres
        assert "Comedy" in genres


def test_list_movies_pagination():
    with TestClient(app) as test_client:
        response = test_client.get("/api/v1/movies?page=1&page_size=5")
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 5
        assert data["total"] > 0
        assert "clean_title" in data["items"][0]


def test_movie_detail():
    with TestClient(app) as test_client:
        response = test_client.get("/api/v1/movies/1")
        assert response.status_code == 200
        data = response.json()
        assert data["movie_id"] == 1
        assert "Toy Story" in data["title"]


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
