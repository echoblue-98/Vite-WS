
from fastapi import FastAPI, UploadFile, File, Form, Request
from fastapi.responses import JSONResponse, PlainTextResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from backend.logging_utils import log, generate_request_id
from backend.config import get_settings

settings = get_settings()
app = FastAPI(title=settings.app_name, version=settings.app_version)

# --- Prometheus Metrics ---
try:
	from prometheus_client import Counter as PCounter, Histogram, generate_latest, CONTENT_TYPE_LATEST
except ImportError:  # pragma: no cover
	PCounter = None  # type: ignore
	Histogram = None  # type: ignore

REQUEST_COUNT = None

# --- Router Imports ---
print('Importing routers...')
from backend.eq_api import router as eq_router
from backend.questions import router as questions_router
from backend.feedback import router as feedback_router
from backend.emotion import router as emotion_router
from backend.sentiment import router as sentiment_router
from backend.archetype import router as archetype_router
from backend.tts_preamble import router as tts_router
print('Routers imported')

# --- Router Includes ---
print('Including routers once...')
app.include_router(eq_router)
app.include_router(questions_router)
app.include_router(feedback_router)
app.include_router(emotion_router)
app.include_router(sentiment_router)
try:
	import multipart  # type: ignore
	from backend.voice import router as voice_router
	app.include_router(voice_router)
except Exception as e:  # pragma: no cover
	print('Skipping voice router (python-multipart not installed):', e)
app.include_router(archetype_router)
app.include_router(tts_router)

# --- Lifecycle Events ---
@app.on_event("startup")
async def on_startup():
    log("INFO", "startup", version=settings.app_version, commit=settings.commit)

@app.on_event("shutdown")
async def on_shutdown():
    log("INFO", "shutdown")

# --- Readiness Endpoint ---
@app.get("/ready")
async def ready():
    """Readiness probe: basic checks (cache size, env presence)."""
    from backend.tts_preamble import _CACHE  # lightweight import
    cache_items = len(_CACHE)
    eleven_key = bool(os.getenv('ELEVENLABS_API_KEY'))
    return {"status": "ready", "cache_items": cache_items, "tts_enabled": eleven_key, "version": settings.app_version}

# --- Uvicorn server startup ---
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=False)


@app.middleware("http")
async def prometheus_middleware(request: Request, call_next):
	if not REQUEST_COUNT or not REQUEST_LATENCY:
		return await call_next(request)
	import time
	start = time.perf_counter()
	response = await call_next(request)
	duration = time.perf_counter() - start
	path = request.url.path
	method = request.method
	status = response.status_code
	try:
		REQUEST_COUNT.labels(method=method, path=path, status=status).inc()
		REQUEST_LATENCY.labels(method=method, path=path).observe(duration)
	except Exception:
		pass
	return response

@app.get("/metrics", response_class=PlainTextResponse, include_in_schema=False)
async def metrics():  # pragma: no cover - exposition formatting
	if not REQUEST_COUNT:
		return PlainTextResponse("", status_code=503)
	return PlainTextResponse(generate_latest().decode('utf-8'), media_type=CONTENT_TYPE_LATEST)

# --- Request ID Middleware ---
@app.middleware("http")
async def add_request_id_middleware(request: Request, call_next):
	req_id = request.headers.get("X-Request-ID") or generate_request_id()
	request.state.request_id = req_id
	response = await call_next(request)
	response.headers["X-Request-ID"] = req_id
	return response

# --- Security Headers Middleware ---
@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
	response = await call_next(request)
	response.headers.setdefault("X-Content-Type-Options", "nosniff")
	response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
	response.headers.setdefault("X-Frame-Options", "DENY")
	# Basic CSP skeleton (adjust paths as needed)
	response.headers.setdefault("Content-Security-Policy", "default-src 'self'; img-src 'self' data:; media-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'")
	# Permissions Policy (tighten further if features added)
	response.headers.setdefault("Permissions-Policy", "microphone=(), camera=(), geolocation=()")
	# HSTS (only if behind HTTPS; gate via config)
	if settings.hsts_enabled:
		response.headers.setdefault("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload")
	return response
print('FastAPI app created')

# --- CORS Hardening ---
ALLOWED_ORIGINS = settings.allowed_origins
print(f"CORS allow_origins={ALLOWED_ORIGINS}")

app.add_middleware(
	CORSMiddleware,
	allow_origins=ALLOWED_ORIGINS,
	allow_credentials=True,
	allow_methods=["GET", "POST", "OPTIONS"],
	allow_headers=["*"],
)

@app.get("/")
async def root(request: Request):
	return {"message": "Backend is running", "request_id": getattr(request.state, 'request_id', None)}

@app.get("/version")
async def version(request: Request):
	return {
		"app": settings.app_name,
		"version": settings.app_version,
		"commit": settings.commit,
		"build_time": settings.build_time,
		"request_id": getattr(request.state, 'request_id', None)
	}

@app.get("/health")
async def health():
	"""Liveness probe: returns 200 if process is up."""
	return {"status": "ok"}

	api_key = os.getenv("ELEVENLABS_API_KEY")
	print(f"[DEBUG] ELEVENLABS_API_KEY: {api_key}")
	eleven_key = bool(api_key)
async def ready():
	"""Readiness probe: basic checks (cache size, env presence)."""
	from backend.tts_preamble import _CACHE  # lightweight import
	cache_items = len(_CACHE)
	eleven_key = bool(os.getenv('ELEVENLABS_API_KEY'))
	return {"status": "ready", "cache_items": cache_items, "tts_enabled": eleven_key, "version": settings.app_version}

class NextQuestionRequest(BaseModel):
	"""Request model for adaptive question selection."""
	text: str = None
	sentiment: str = None
	eq_score: int = None
	emotion_scores: dict = None
	voice_features: dict = None



class FeedbackRequest(BaseModel):
	"""Request model for adaptive feedback/coaching."""
	text: str
	sentiment: str = None
	eq_score: int = None
	emotion_scores: dict = None  # e.g., {"joy": 0.8, "anger": 0.1}
	voice_features: dict = None  # e.g., {"pitch": 180, "energy": 0.7, "tonality": "Neutral"}



class ArchetypeRequest(BaseModel):
	"""Request model for archetype alignment."""
	eq_score: int

# --- Endpoints ---
@app.post("/next_question")
async def next_question_endpoint(req: NextQuestionRequest, request: Request):
	"""
	POST /next_question     Returns a suggested next question based on analysis (dummy logic for now).
	"""
	# Dummy logic: branch on sentiment and EQ
	if req.sentiment == "Negative":
		question = "Can you share how you overcame a recent challenge?"
	elif req.eq_score is not None and req.eq_score < 15:
		question = "How do you handle feedback or criticism?"
	elif req.emotion_scores and req.emotion_scores.get("joy", 0) > 0.6:
		question = "What achievement are you most proud of?"
	else:
		question = "Tell me about a time you worked in a team."
	log("INFO", "next_question", sentiment=req.sentiment, eq=req.eq_score, derived=question, request_id=request.state.request_id)
	return {"next_question": question}



@app.post("/feedback")
async def feedback_endpoint(req: FeedbackRequest, request: Request):
	"""
	POST /feedback          Returns adaptive coaching or encouragement based on response and analysis.
	"""
	# Start with sentiment and EQ logic
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
	# Add emotion_scores logic
	if req.emotion_scores:
		if req.emotion_scores.get("joy", 0) > 0.6:
			feedback += " Your joy is contagious!"
		if req.emotion_scores.get("anger", 0) > 0.4:
			feedback += " Try to keep frustration in check and focus on solutions."
		if req.emotion_scores.get("sadness", 0) > 0.4:
			feedback += " It's okay to acknowledge challenges, but highlight your resilience."
	# Add voice_features logic
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
	log("INFO", "feedback_generated", sentiment=req.sentiment, eq=req.eq_score, length=(len(req.text) if req.text else 0), request_id=request.state.request_id)
	return {"feedback": feedback}







print('Importing routers...')
from backend.eq_api import router as eq_router
from backend.questions import router as questions_router
from backend.feedback import router as feedback_router
from backend.emotion import router as emotion_router
from backend.sentiment import router as sentiment_router
from backend.archetype import router as archetype_router
from backend.tts_preamble import router as tts_router
print('Routers imported')

print('Including routers once...')
app.include_router(eq_router)
app.include_router(questions_router)
app.include_router(feedback_router)
app.include_router(emotion_router)
app.include_router(sentiment_router)
# Conditionally include voice router only if multipart is available
try:
	import multipart  # type: ignore
	from backend.voice import router as voice_router
	app.include_router(voice_router)
except Exception as e:  # pragma: no cover
	print('Skipping voice router (python-multipart not installed):', e)
app.include_router(archetype_router)
app.include_router(tts_router)

# --- Lifecycle Events ---
@app.on_event("startup")
async def on_startup():
	log("INFO", "startup", version=settings.app_version, commit=settings.commit)

@app.on_event("shutdown")
async def on_shutdown():
	log("INFO", "shutdown")



