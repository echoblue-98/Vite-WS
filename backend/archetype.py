from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class ArchetypeRequest(BaseModel):
    eq_score: int
    candidate_id: Optional[str] = None

# In-memory session state for archetype history
session_state = {}

@router.post("/archetype")
async def archetype_endpoint(req: ArchetypeRequest):

    candidate_id = req.candidate_id or "default"
    if candidate_id not in session_state:
        session_state[candidate_id] = {"eq_scores": [], "archetypes": []}
    state = session_state[candidate_id]
    state["eq_scores"].append(req.eq_score)

    # Trend-based rules
    scores = state["eq_scores"]
    avg_score = sum(scores) / len(scores)
    recent_scores = scores[-3:] if len(scores) >= 3 else scores
    recent_avg = sum(recent_scores) / len(recent_scores)
    archetype = "Street Mage"
    # Consistently high
    if recent_avg >= 30:
        archetype = "The Resonant Eye"
    # Consistently low
    elif recent_avg < 15:
        archetype = "The Discordant"
    # Volatile: hybrid
    elif len(set(recent_scores)) > 1 and max(recent_scores) - min(recent_scores) > 10:
        archetype = "Street Mage / Discordant"
    # Upward trend
    elif len(recent_scores) == 3 and recent_scores[2] > recent_scores[0]:
        archetype += " (Improving)"
    # Downward trend
    elif len(recent_scores) == 3 and recent_scores[2] < recent_scores[0]:
        archetype += " (Needs Consistency)"

    state["archetypes"].append(archetype)
    return {"archetype": archetype, "history": state}
