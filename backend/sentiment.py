from fastapi import APIRouter
from pydantic import BaseModel
from collections import defaultdict
from typing import List

# Optional ML dependencies (disabled by default for lightweight deploys)
try:
    from sklearn.naive_bayes import MultinomialNB  # type: ignore
    _ML_AVAILABLE = True
except Exception:
    MultinomialNB = None  # type: ignore
    _ML_AVAILABLE = False
from .ml_utils import SimpleMultinomialNB

router = APIRouter()

class SentimentRequest(BaseModel):
    text: str
    candidate_id: str = None  # Optional: track candidate

session_state = {}
# --- Optional ML model for sentiment learning ---
ml_models = defaultdict(lambda: MultinomialNB()) if _ML_AVAILABLE else defaultdict(lambda: SimpleMultinomialNB())  # type: ignore

@router.post("/sentiment")
async def sentiment_endpoint(req: SentimentRequest):
    text = req.text.lower()

    # Default keywords
    default_keywords = {
        "positive": ["good", "great", "happy", "excited", "love", "enjoy", "success", "proud"],
        "negative": ["bad", "sad", "difficult", "challenge", "problem", "fail", "stress", "tough"],
    }

    # Get candidate session
    candidate_id = req.candidate_id or "default"
    if candidate_id not in session_state:
        session_state[candidate_id] = {"keywords": default_keywords.copy(), "history": []}
    state = session_state[candidate_id]

    # Expand keywords based on new words in text
    for sentiment_type, words in state["keywords"].items():
        for word in text.split():
            if word not in words and sentiment_type in text:
                state["keywords"][sentiment_type].append(word)

    # Score sentiment
    score = 0
    for sentiment_type, words in state["keywords"].items():
        if any(w in text for w in words):
            score += 1 if sentiment_type == "positive" else -1

    sentiment = "Positive" if score > 0 else "Negative" if score < 0 else "Neutral"

    # Save history
    state["history"].append({"text": text, "sentiment": sentiment})

    # --- ML model training/prediction ---
    texts: List[str] = [h["text"] for h in state["history"]]
    labels: List[str] = [h["sentiment"] for h in state["history"]]
    # Use a very small threshold to avoid overfitting when too little data
    if len(texts) > 2:
        # Tokenize
        tokenized = [t.split() for t in texts]
        model = ml_models[candidate_id]
        model.fit(tokenized, labels)
        pred = model.predict([text.split()])[0]
        sentiment = pred

    return {"sentiment": sentiment, "history": state["history"]}
