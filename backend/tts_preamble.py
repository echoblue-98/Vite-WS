import os
import time
import hashlib
from fastapi import APIRouter, Response, HTTPException, Depends, Request, Query
import httpx
from .logging_utils import log, log_exception
try:
    from prometheus_client import Counter as PCounter
except ImportError:  # pragma: no cover
    PCounter = None  # type: ignore

_CACHE_HITS = PCounter('tts_cache_hits_total', 'Total TTS preamble cache hits') if PCounter else None
_CACHE_MISSES = PCounter('tts_cache_misses_total', 'Total TTS preamble cache misses') if PCounter else None
_RATE_LIMIT_BLOCKS = PCounter('tts_rate_limit_blocks_total', 'Total TTS preamble rate limit rejections') if PCounter else None
from .redis_utils import get_redis_client

router = APIRouter(prefix="/tts", tags=["tts"])

ELEVEN_API_KEY = os.getenv("ELEVENLABS_API_KEY")
VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "EXAMPLE_VOICE_ID")
# You can override this default script via PREAMBLE_SCRIPT; {name}, {company}, {product} placeholders supported
DEFAULT_SCRIPT = os.getenv(
    "PREAMBLE_SCRIPT",
    (
        "Welcome{name_part} to the {company} {product}. "
        "You'll answer a short set of questions—focused on how you communicate, decide, and connect. "
        "Keep it natural. If you need a moment, pause—then continue where you left off. "
        "Take a comfortable breath... and when you're ready, we'll begin."
    ),
)
DEFAULT_COMPANY = os.getenv("PREAMBLE_COMPANY", "Western & Southern Financial Group")
DEFAULT_PRODUCT = os.getenv("PREAMBLE_PRODUCT", "AI Adaptive Interview")
MODEL_ID = os.getenv("ELEVENLABS_MODEL_ID", "eleven_monolingual_v1")

# Default voice setting overrides via env (fine‑tuning for more natural cadence)
def _env_bool(name: str, default: bool) -> bool:
    val = os.getenv(name)
    if val is None:
        return default
    return val.lower() in ("1", "true", "yes", "on")

def _env_float(name: str, default: float) -> float:
    try:
        return float(os.getenv(name, str(default)))
    except Exception:
        return default

DEF_STABILITY = _env_float("PREAMBLE_STABILITY", 0.32)
DEF_SIMILARITY = _env_float("PREAMBLE_SIMILARITY", 0.94)
DEF_STYLE = _env_float("PREAMBLE_STYLE", 0.68)
DEF_SPEAKER_BOOST = _env_bool("PREAMBLE_SPEAKER_BOOST", True)

# Simple in-memory cache {key: (expires_at, bytes)}
_CACHE: dict[str, tuple[float, bytes]] = {}
_TTL_SECONDS = int(os.getenv("TTS_PREAMBLE_TTL", "21600"))  # default 6h
_REDIS = get_redis_client()

# --- Simple in-memory rate limiter (per IP) ---
_RL_WINDOW = int(os.getenv("TTS_RATE_WINDOW_SEC", "60"))  # sliding window seconds
_RL_MAX = int(os.getenv("TTS_RATE_MAX", "5"))  # max requests per window
_requests: dict[str, list[float]] = {}

def _rate_limit(request: Request):
    now = time.time()
    ip = request.client.host if request.client else 'unknown'
    # Redis variant
    if _REDIS:
        key = f"tts:rl:{ip}"
        p = _REDIS.pipeline()
        p.zremrangebyscore(key, 0, now - _RL_WINDOW)
        p.zadd(key, {str(now): now})
        p.zcard(key)
        p.expire(key, _RL_WINDOW)
        _, _, count, _ = p.execute()
        if count > _RL_MAX:
            # earliest timestamp to compute reset
            earliest = _REDIS.zrange(key, 0, 0, withscores=True)
            if earliest:
                reset = int(earliest[0][1] + _RL_WINDOW - now)
            else:
                reset = _RL_WINDOW
            raise HTTPException(status_code=429, detail="Rate limit exceeded for TTS preamble")
        remaining = max(_RL_MAX - count, 0)
        earliest = _REDIS.zrange(key, 0, 0, withscores=True)
        reset = int(earliest[0][1] + _RL_WINDOW - now) if earliest else _RL_WINDOW
        request.state.rate_limit = {"limit": _RL_MAX, "remaining": remaining, "reset": reset, "backend": "redis"}
        return True
    # In-memory fallback
    bucket = _requests.setdefault(ip, [])
    cutoff = now - _RL_WINDOW
    while bucket and bucket[0] < cutoff:
        bucket.pop(0)
    if len(bucket) >= _RL_MAX:
        reset = int(bucket[0] + _RL_WINDOW - now) if bucket else _RL_WINDOW
        raise HTTPException(status_code=429, detail="Rate limit exceeded for TTS preamble")
    bucket.append(now)
    remaining = max(_RL_MAX - len(bucket), 0)
    reset = int(bucket[0] + _RL_WINDOW - now) if bucket else _RL_WINDOW
    request.state.rate_limit = {"limit": _RL_MAX, "remaining": remaining, "reset": reset, "backend": "memory"}
    return True

def _cache_key(script: str, voice_id: str, model_id: str, settings: dict | None = None) -> str:
    h = hashlib.sha256()
    h.update(script.encode("utf-8"))
    h.update(voice_id.encode("utf-8"))
    h.update(model_id.encode("utf-8"))
    if settings:
        # Include stable fields so different styles get separate cache entries
        stable = {
            k: settings.get(k)
            for k in ["stability", "similarity_boost", "style", "use_speaker_boost"]
            if k in settings
        }
        h.update(repr(stable).encode("utf-8"))
    return h.hexdigest()

def _get_cached(key: str) -> bytes | None:
    if _REDIS:
        data = _REDIS.get(f"tts:cache:{key}")
        if data:
            return data
        return None
    entry = _CACHE.get(key)
    if not entry:
        return None
    expires, data = entry
    if time.time() > expires:
        _CACHE.pop(key, None)
        return None
    return data

def _store_cache(key: str, data: bytes):
    if _REDIS:
        _REDIS.setex(f"tts:cache:{key}", _TTL_SECONDS, data)
    else:
        _CACHE[key] = (time.time() + _TTL_SECONDS, data)

@router.get("/preamble", response_class=Response)
async def tts_preamble(
    request: Request,
    force: bool = False,
    name: str | None = Query(default=None, description="Candidate name for personalization"),
    script: str | None = Query(default=None, description="Override narration script. {name},{company},{product} supported."),
    # For brand consistency, voice & model are enforced server-side; ignore client overrides
    voice_id: str | None = Query(default=None, description="(ignored) Voice is enforced by server"),
    model_id: str | None = Query(default=None, description="(ignored) Model is enforced by server"),
    stability: float | None = Query(default=None, ge=0.0, le=1.0),
    similarity_boost: float | None = Query(default=None, ge=0.0, le=1.0),
    style: float | None = Query(default=None, ge=0.0, le=1.0),
    use_speaker_boost: bool | None = Query(default=None),
    _: bool = Depends(_rate_limit),
):
    """Return preamble narration audio (MP3) generated on-demand via ElevenLabs.
    Caches result in-memory for TTL to reduce cost/latency.
    Query param force=true bypasses cache (for admin refresh)."""
    if not ELEVEN_API_KEY:
        raise HTTPException(status_code=503, detail="TTS disabled")

    # Build effective script and voice/settings
    person = (name or "").strip()
    name_part = f" {person}," if person else ""
    company = DEFAULT_COMPANY
    product = DEFAULT_PRODUCT
    base_script = (script or DEFAULT_SCRIPT)
    effective_script = base_script.replace("{name}", person).replace("{name_part}", name_part).replace("{company}", company).replace("{product}", product)
    # Enforce configured voice/model regardless of client params
    v_id = VOICE_ID
    m_id = MODEL_ID
    voice_settings = {
        "stability": DEF_STABILITY if stability is None else stability,
        "similarity_boost": DEF_SIMILARITY if similarity_boost is None else similarity_boost,
        "style": DEF_STYLE if style is None else style,
        "use_speaker_boost": DEF_SPEAKER_BOOST if use_speaker_boost is None else bool(use_speaker_boost),
    }

    cache_key = _cache_key(effective_script, v_id, m_id, voice_settings)

    if not force:
        cached = _get_cached(cache_key)
        if cached:
            log("INFO", "tts_preamble cache hit", cache="HIT", backend="redis" if _REDIS else "memory", request_id=getattr(request.state, 'request_id', None))
            if _CACHE_HITS:
                try: _CACHE_HITS.inc()
                except Exception: pass
            rl = getattr(request.state, 'rate_limit', None) or {}
            headers = {
                "X-Cache": "HIT",
                "X-RateLimit-Limit": str(rl.get('limit', _RL_MAX)),
                "X-RateLimit-Remaining": str(rl.get('remaining', _RL_MAX)),
                "X-RateLimit-Reset": str(rl.get('reset', _RL_WINDOW)),
                "X-RateLimit-Backend": rl.get('backend', 'memory')
            }
            return Response(content=cached, media_type="audio/mpeg", headers=headers)

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{v_id}"
    payload = {
        "text": effective_script,
        "model_id": m_id,
        "voice_settings": voice_settings,
    }
    headers = {
        "xi-api-key": ELEVEN_API_KEY,
        "Accept": "audio/mpeg",
        "Content-Type": "application/json"
    }
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(url, json=payload, headers=headers)
        if r.status_code != 200:
            log("WARN", "tts_preamble upstream error", upstream_status=r.status_code, request_id=getattr(request.state, 'request_id', None))
            raise HTTPException(status_code=502, detail=f"ElevenLabs error {r.status_code}")
        audio_bytes = r.content
        _store_cache(cache_key, audio_bytes)
        log("INFO", "tts_preamble cache miss", cache="MISS", backend="redis" if _REDIS else "memory", bytes=len(audio_bytes), request_id=getattr(request.state, 'request_id', None))
        if _CACHE_MISSES:
            try: _CACHE_MISSES.inc()
            except Exception: pass
        rl = getattr(request.state, 'rate_limit', None) or {}
        headers = {
            "X-Cache": "MISS",
            "X-RateLimit-Limit": str(rl.get('limit', _RL_MAX)),
            "X-RateLimit-Remaining": str(rl.get('remaining', _RL_MAX)),
            "X-RateLimit-Reset": str(rl.get('reset', _RL_WINDOW)),
            "X-RateLimit-Backend": rl.get('backend', 'memory')
        }
        return Response(content=audio_bytes, media_type="audio/mpeg", headers=headers)
    except HTTPException:
        raise
    except Exception as e:
        log_exception("tts_preamble unexpected failure", e, request_id=getattr(request.state, 'request_id', None))
        raise HTTPException(status_code=500, detail=f"TTS failure: {e}")
