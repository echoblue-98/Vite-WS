import pytest
from fastapi.testclient import TestClient
from backend.feedback import router as feedback_router, session_state as feedback_state
from fastapi import FastAPI

app = FastAPI()
app.include_router(feedback_router)
client = TestClient(app)

def test_feedback_personalization():
    candidate_id = "test_user"
    payloads = [
        {"text": "I am happy.", "sentiment": "Positive", "eq_score": 32, "emotion_scores": {"joy": 0.7}, "candidate_id": candidate_id},
        {"text": "I am focused.", "sentiment": "Neutral", "eq_score": 28, "emotion_scores": {"joy": 0.2}, "candidate_id": candidate_id},
        {"text": "I am proud.", "sentiment": "Positive", "eq_score": 35, "emotion_scores": {"joy": 0.8}, "candidate_id": candidate_id},
    ]
    feedbacks = []
    for payload in payloads:
        resp = client.post("/feedback", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert "feedback" in data
        assert "history" in data
        feedbacks.append(data["feedback"])
    # Check personalization
    assert any("Previously:" in f for f in feedbacks)
    assert any("consistently demonstrate high emotional intelligence" in f for f in feedbacks)
    assert any("overall sentiment is positive" in f for f in feedbacks)
    history = data["history"]
    assert len(history["feedbacks"]) == len(payloads)

if __name__ == "__main__":
    pytest.main()
