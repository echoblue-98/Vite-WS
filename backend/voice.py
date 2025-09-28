from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import json
import io
import wave
import struct
import math
from typing import List, Tuple, Optional

router = APIRouter()

# Optional dependency: python-multipart is required for File/Form parsing
try:
    import multipart  # type: ignore
    _MULTIPART_AVAILABLE = True
except Exception:
    _MULTIPART_AVAILABLE = False

@router.post("/voice/analyze_voice")
async def analyze_voice(audio: UploadFile = File(None), prompt_index: int = Form(None), responses: str = Form(None)):
    if not _MULTIPART_AVAILABLE:
        # Provide a clear message rather than crashing app start
        raise HTTPException(status_code=501, detail="Voice upload not enabled: install 'python-multipart' to enable this endpoint.")
    if audio is None or prompt_index is None or responses is None:
        raise HTTPException(status_code=400, detail="Missing form fields: audio, prompt_index, responses")
    contents = await audio.read()
    try:
        sr, mono = _read_wav_mono(contents)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=415, detail=f"Unsupported or invalid audio: {e}")

    # Compute features
    energy = _rms_energy(mono)
    pitch_hz = _estimate_pitch_autocorr(mono, sr)
    tonality = _classify_tonality(energy, pitch_hz)

    feats = {
        "pitch": round(pitch_hz, 1) if pitch_hz else None,
        "energy": round(energy, 4),
        "tonality": tonality,
    }
    # Optional lightweight EQ-like score (scaled 0-30)
    eq_score = int(min(30, max(0, (energy * 400) + (8 if pitch_hz else 0))))
    feats["eqScore"] = eq_score

    return {
        "prompt_index": prompt_index,
        "features": feats,
        # No transcript here (would require STT); frontend falls back to live transcript
        "responses": json.loads(responses)
    }


def _read_wav_mono(data: bytes) -> Tuple[int, List[float]]:
    """
    Read a PCM WAV from bytes and return (sample_rate, mono_float_samples[-1..1]).
    Supports 8/16/32-bit ints. For multi-channel, uses the first channel.
    """
    bio = io.BytesIO(data)
    try:
        with wave.open(bio, 'rb') as w:
            nch = w.getnchannels()
            sw = w.getsampwidth()
            sr = w.getframerate()
            nframes = w.getnframes()
            frames = w.readframes(nframes)
    except wave.Error as e:
        raise HTTPException(status_code=415, detail=f"Invalid WAV: {e}")
    if sw not in (1, 2, 4):
        raise HTTPException(status_code=415, detail=f"Unsupported sample width: {sw} bytes")
    # Convert to ints and take first channel
    if sw == 1:
        # 8-bit PCM unsigned in WAV; convert to signed centered at 0
        ints = list(frames)
        maxv = 127.0
        step = nch
        mono = [((ints[i] - 128) / maxv) for i in range(0, len(ints), step)]
    elif sw == 2:
        count = len(frames) // 2
        fmt = '<' + ('h' * count)
        ints = list(struct.unpack(fmt, frames))
        maxv = 32767.0
        step = nch
        mono = [ints[i] / maxv for i in range(0, len(ints), step)]
    else:  # sw == 4
        count = len(frames) // 4
        fmt = '<' + ('i' * count)
        ints = list(struct.unpack(fmt, frames))
        maxv = 2147483647.0
        step = nch
        mono = [ints[i] / maxv for i in range(0, len(ints), step)]
    return sr, mono


def _rms_energy(samples: List[float]) -> float:
    if not samples:
        return 0.0
    acc = 0.0
    for s in samples:
        acc += s * s
    return math.sqrt(acc / len(samples))


def _estimate_pitch_autocorr(samples: List[float], sr: int) -> Optional[float]:
    """
    Very small autocorrelation-based pitch estimator for voiced speech.
    Searches 75–300 Hz range; returns None if no clear peak.
    """
    if not samples or sr <= 0:
        return None
    # Use up to 1 second from the center to reduce edges
    N = min(len(samples), sr)
    if N < int(0.2 * sr):  # need at least 200ms
        return None
    start = (len(samples) - N) // 2
    window = samples[start:start + N]
    # Remove DC
    mean = sum(window) / len(window)
    window = [x - mean for x in window]
    # Lag search range for 75–300 Hz
    min_lag = max(1, int(sr / 300))
    max_lag = min(len(window) - 1, int(sr / 75))
    if max_lag <= min_lag:
        return None
    best_lag = None
    best_val = -1e9
    # Precompute energy for normalization
    energy0 = sum(x * x for x in window)
    if energy0 <= 1e-9:
        return None
    for lag in range(min_lag, max_lag + 1):
        acc = 0.0
        for i in range(0, len(window) - lag):
            acc += window[i] * window[i + lag]
        # Normalize by zero-lag energy
        val = acc / energy0
        if val > best_val:
            best_val = val
            best_lag = lag
    if best_lag is None or best_val < 0.1:
        return None
    return float(sr) / float(best_lag)


def _classify_tonality(energy: float, pitch_hz: Optional[float]) -> str:
    if energy < 0.02:
        return "Calm"
    if energy > 0.08 and pitch_hz:
        return "Energetic"
    return "Neutral"
