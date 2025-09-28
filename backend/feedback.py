from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

# Global session state for feedback personalization
session_state = {}

class FeedbackRequest(BaseModel):
    text: str
    sentiment: Optional[str] = None
    eq_score: Optional[int] = None
    emotion_scores: Optional[dict] = None
    voice_features: Optional[dict] = None
    candidate_id: Optional[str] = None

@router.post("/feedback")
async def feedback_endpoint(req: FeedbackRequest):
    candidate_id = req.candidate_id or req.text or "default"
    if candidate_id not in session_state:
        session_state[candidate_id] = {"feedbacks": [], "sentiments": [], "eq_scores": [], "emotions": [], "texts": []}
    state = session_state[candidate_id]
    state["sentiments"].append(req.sentiment)
    state["eq_scores"].append(req.eq_score)
    state["emotions"].append(req.emotion_scores)
    state["texts"].append(req.text)

    feedback = ""
    if req.sentiment == "Positive":
        feedback = "Great positivity! Keep expressing your enthusiasm."
    elif req.sentiment == "Negative":
        feedback = "Consider focusing on growth and what you learned from challenges."
    else:
        feedback = "Stay authentic and clear in your responses."
    if req.eq_score is not None:
        if req.eq_score >= 30:
            feedback += " Your emotional intelligence is outstanding."
        elif req.eq_score >= 15:
            feedback += " Good EQ—keep connecting your feelings to your answers."
        else:
            feedback += " Try to show more empathy and self-awareness."
    if req.emotion_scores:
        if req.emotion_scores.get("joy", 0) > 0.6:
            feedback += " Your joy is contagious!"
        if req.emotion_scores.get("anger", 0) > 0.4:
            feedback += " Try to keep frustration in check and focus on solutions."
        if req.emotion_scores.get("sadness", 0) > 0.4:
            feedback += " It's okay to acknowledge challenges, but highlight your resilience."
    if req.voice_features:
        pitch = req.voice_features.get("pitch")
        if pitch and pitch > 220:
            feedback += " Your vocal energy is strong—keep it up!"
        elif pitch and pitch < 140:
            feedback += " Try to speak with a bit more energy for engagement."
        tonality = req.voice_features.get("tonality")
        if tonality == "Neutral":
            feedback += " Vary your tone to keep responses lively."
        elif tonality == "Energetic":
            feedback += " Your tone is engaging and dynamic."

    # Personalize feedback using candidate history
    if len(state["feedbacks"]) > 0:
        last_feedback = state["feedbacks"][-1]
        feedback += f" Previously: {last_feedback}"
    if len(state["eq_scores"]) > 2:
        eq_scores_valid = [s for s in state["eq_scores"] if isinstance(s, (int, float)) and s is not None]
        if eq_scores_valid and all(s >= 0 for s in eq_scores_valid):
            avg_eq = sum(eq_scores_valid) / len(eq_scores_valid)
            if avg_eq >= 28:
                feedback += " You consistently demonstrate high emotional intelligence."
            elif avg_eq < 15:
                feedback += " Consider working on emotional awareness and empathy."
    if len(state["sentiments"]) > 2:
        pos_count = state["sentiments"].count("Positive")
        neg_count = state["sentiments"].count("Negative")
        if pos_count > neg_count:
            feedback += " Your overall sentiment is positive."
        elif neg_count > pos_count:
            feedback += " Your overall sentiment is more negative—focus on optimism."

    state["feedbacks"].append(feedback)
    return {"feedback": feedback, "history": state}

    state["feedbacks"].append(feedback)
    return {"feedback": feedback, "history": state}
