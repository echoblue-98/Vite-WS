from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class NextQuestionRequest(BaseModel):
    text: str = None
    sentiment: str = None
    eq_score: int = None
    emotion_scores: dict = None
    voice_features: dict = None

@router.post("/next_question")
async def next_question_endpoint(req: NextQuestionRequest):
    if req.sentiment == "Negative":
        question = "Can you share how you overcame a recent challenge?"
    elif req.eq_score is not None and req.eq_score < 15:
        question = "How do you handle feedback or criticism?"
    elif req.emotion_scores and req.emotion_scores.get("joy", 0) > 0.6:
        question = "What achievement are you most proud of?"
    else:
        question = "Tell me about a time you worked in a team."
    return {"next_question": question}
