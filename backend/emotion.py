from fastapi import APIRouter
from pydantic import BaseModel
from collections import defaultdict
from typing import List

# Optional ML dependencies (disabled by default for lightweight deploys)
try:
    from sklearn.naive_bayes import MultinomialNB  # type: ignore
    _ML_AVAILABLE = True
except Exception:  # ImportError or runtime errors
    MultinomialNB = None  # type: ignore
    _ML_AVAILABLE = False
from .ml_utils import SimpleMultinomialNB

router = APIRouter()

class EmotionRequest(BaseModel):
    text: str
    candidate_id: str = None  # Optional: track candidate

session_state = {}

# --- Optional ML model for emotion learning ---
ml_models = defaultdict(lambda: MultinomialNB()) if _ML_AVAILABLE else defaultdict(lambda: SimpleMultinomialNB())  # type: ignore

@router.post("/emotion")
async def emotion_endpoint(req: EmotionRequest):
    text = req.text.lower()
    scores = {"joy": 0.0, "anger": 0.0, "sadness": 0.0, "fear": 0.0}
    if any(w in text for w in ["happy", "excited", "love", "enjoy"]):
        scores["joy"] = 0.8
    if any(w in text for w in ["angry", "mad", "frustrated"]):
        scores["anger"] = 0.7
    if any(w in text for w in ["sad", "disappointed", "upset"]):
        scores["sadness"] = 0.7
    if any(w in text for w in ["worried", "afraid", "nervous"]):
        scores["fear"] = 0.6
    
    # Default keywords
    default_keywords = {
        "joy": ["happy", "excited", "love", "enjoy"],
        "anger": ["angry", "mad", "frustrated"],
        "sadness": ["sad", "disappointed", "upset"],
        "fear": ["worried", "afraid", "nervous"],
    }

    # Get candidate session
    candidate_id = req.candidate_id or "default"
    if candidate_id not in session_state:
        session_state[candidate_id] = {"keywords": default_keywords.copy(), "history": []}
    state = session_state[candidate_id]

    # Expand keywords based on new words in text
    for emotion, words in state["keywords"].items():
        for word in text.split():
            if word not in words and emotion in text:
                state["keywords"][emotion].append(word)

    # Score emotions
    scores = {e: 0.0 for e in default_keywords}
    for emotion, words in state["keywords"].items():
        if any(w in text for w in words):
            scores[emotion] = 0.7 + 0.1 * len(set(words) & set(text.split()))

    # Save history
    state["history"].append({"text": text, "scores": scores})

    # --- ML model training/prediction ---
    texts: List[str] = [h["text"] for h in state["history"]]
    labels: List[str] = []
    for h in state["history"]:
        labels.append(max(h["scores"], key=lambda k: h["scores"][k]))
    if len(texts) > 2:
        tokenized = [t.split() for t in texts]
        model = ml_models[candidate_id]
        model.fit(tokenized, labels)
        pred = model.predict([text.split()])[0]
        # lift the predicted emotion score slightly
        scores[pred] = max(scores.get(pred, 0.0), 0.85)

    return {"emotion_scores": scores, "history": state["history"]}
