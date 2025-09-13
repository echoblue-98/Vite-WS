

"""
main.py
Main FastAPI app: exposes root, sentiment, voice analysis, and archetype endpoints.
Mounts /score endpoint from eq_api. Clean, documented, and ready for extension.
"""
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
from eq_api import app as eq_app

app = FastAPI()

# Allow CORS for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    """Root endpoint: returns backend status message."""
    return {"message": "Hello from FastAPI backend!"}

# Mount /score endpoint from eq_api
app.mount("/score", eq_app)

# --- New Endpoints ---

class SentimentRequest(BaseModel):
    """Request model for sentiment analysis."""
    text: str

@app.post("/sentiment")
async def sentiment_endpoint(req: SentimentRequest):
    """
    POST /sentiment
    Returns a simple sentiment label for the given text.
    """
    text = req.text.lower()
    positive = ["good", "great", "happy", "excited", "love", "enjoy", "success", "proud"]
    negative = ["bad", "sad", "difficult", "challenge", "problem", "fail", "stress", "tough"]
    score = 0
    if any(w in text for w in positive):
        score += 1
    if any(w in text for w in negative):
        score -= 1
    sentiment = "Positive" if score > 0 else "Negative" if score < 0 else "Neutral"
    return {"sentiment": sentiment}

@app.post("/voice/analyze_voice")
async def analyze_voice(audio: UploadFile = File(...), prompt_index: int = Form(...), responses: str = Form(...)):
    """
    POST /voice/analyze_voice
    Accepts audio file, prompt index, and responses (JSON string).
    Returns dummy analysis (replace with real audio feature extraction in production).
    """
    audio_bytes = await audio.read()
    # Optionally decode audio and extract features here
    # For now, just return dummy values
    return {
        "prompt_index": prompt_index,
        "features": {
            "pitch": 180,
            "energy": 0.7,
            "tonality": "Neutral"
        },
        "responses": json.loads(responses)
    }

class ArchetypeRequest(BaseModel):
    """Request model for archetype alignment."""
    eq_score: int

@app.post("/archetype")
async def archetype_endpoint(req: ArchetypeRequest):
    """
    POST /archetype
    Maps EQ score to an archetype label.
    """
    if req.eq_score >= 30:
        archetype = "The Resonant Eye"
    elif req.eq_score >= 15:
        archetype = "Street Mage"
    else:
        archetype = "The Discordant"
    return {"archetype": archetype}
