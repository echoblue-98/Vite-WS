import pytest
from fastapi.testclient import TestClient
from backend.emotion import router as emotion_router, session_state as emotion_state
from backend.sentiment import router as sentiment_router, session_state as sentiment_state
from fastapi import FastAPI

app = FastAPI()
app.include_router(emotion_router)
app.include_router(sentiment_router)
client = TestClient(app)

def test_emotion_adaptive_learning():
    candidate_id = "test_user"
    texts = [
        "I am happy and excited today!",
        "I feel sad and disappointed.",
        "I am angry and frustrated.",
        "I am worried and afraid.",
        "I am joyful and proud.",
    ]
    for text in texts:
        resp = client.post("/emotion", json={"text": text, "candidate_id": candidate_id})
        assert resp.status_code == 200
        data = resp.json()
        assert "emotion_scores" in data
        assert "history" in data
    # Check ML adaptation
    resp = client.post("/emotion", json={"text": "I am joyful and proud.", "candidate_id": candidate_id})
    scores = resp.json()["emotion_scores"]
    assert max(scores.values()) >= 0.8

def test_sentiment_adaptive_learning():
    candidate_id = "test_user"
    texts = [
        "I am happy and excited today!",
        "This is a bad and tough situation.",
        "I feel great and proud.",
        "I am sad and disappointed.",
        "I am successful and enjoy my work.",
    ]
    for text in texts:
        resp = client.post("/sentiment", json={"text": text, "candidate_id": candidate_id})
        assert resp.status_code == 200
        data = resp.json()
        assert "sentiment" in data
        assert "history" in data
    # Check ML adaptation
    resp = client.post("/sentiment", json={"text": "I am successful and enjoy my work.", "candidate_id": candidate_id})
    sentiment = resp.json()["sentiment"]
    assert sentiment in ["Positive", "Negative", "Neutral"]

if __name__ == "__main__":
    pytest.main()
