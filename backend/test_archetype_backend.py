import pytest
from fastapi.testclient import TestClient
from backend.archetype import router as archetype_router, session_state as archetype_state
from fastapi import FastAPI

app = FastAPI()
app.include_router(archetype_router)
client = TestClient(app)

def test_archetype_trend_learning():
    candidate_id = "test_user"
    scores = [10, 20, 35, 32, 28, 15, 8]
    expected_archetypes = []
    for score in scores:
        resp = client.post("/archetype", json={"eq_score": score, "candidate_id": candidate_id})
        assert resp.status_code == 200
        data = resp.json()
        assert "archetype" in data
        assert "history" in data
        expected_archetypes.append(data["archetype"])
    # Check for trend-based adaptation
    assert any("Improving" in a or "Needs Consistency" in a or "/" in a for a in expected_archetypes)
    # Check history tracking
    history = data["history"]
    assert len(history["eq_scores"]) == len(scores)
    assert len(history["archetypes"]) == len(scores)

if __name__ == "__main__":
    pytest.main()
