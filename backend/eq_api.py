
"""
eq_api.py
FastAPI APIRouter for EQ scoring endpoint. Clean, documented, and ready for extension.
"""
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class EQRequest(BaseModel):
    """Request model for EQ scoring."""
    response: str
    inflection: dict

def calculate_eq_score(response: str, inflection: dict) -> int:
    """
    Calculate a simple EQ score based on response text and inflection features.
    - Adds points for emotional language, high pitch, and long responses.
    """
    score = 0
    if "I feel" in response:
        score += 20
    if inflection.get("pitch", 0) > 1.2:
        score += 15
    if len(response) > 100:
        score += 10
    return score

@router.post("/score")
async def score_endpoint(req: EQRequest):
    """
    POST /score
    Returns an EQ score for the given response and inflection features.
    """
    eq_score = calculate_eq_score(req.response, req.inflection)
    return {"eq_score": eq_score}
