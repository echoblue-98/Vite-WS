
import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_root():
    r = client.get("/")
    assert r.status_code == 200
    assert "message" in r.json()

def test_sentiment():
    data = {"text": "I am happy and excited for this opportunity!"}
    r = client.post("/sentiment", json=data)
    assert r.status_code == 200
    assert "sentiment" in r.json()

def test_archetype():
    data = {"eq_score": 32}
    r = client.post("/archetype", json=data)
    assert r.status_code == 200
    assert "archetype" in r.json()

def test_score():
    data = {"response": "I feel great about this.", "inflection": {"pitch": 1.5}}
    r = client.post("/score", json=data)
    assert r.status_code == 200
    assert "eq_score" in r.json()

if __name__ == "__main__":
    pytest.main()
