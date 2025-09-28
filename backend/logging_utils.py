import json, time, os, sys, threading, uuid
from typing import Any, Dict

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
_LEVEL_ORDER = ["DEBUG", "INFO", "WARN", "ERROR"]
_LEVEL_INDEX = {lvl: i for i, lvl in enumerate(_LEVEL_ORDER)}
_lock = threading.Lock()

def log(level: str, message: str, **fields: Any):
    level = level.upper()
    if _LEVEL_INDEX.get(level, 99) < _LEVEL_INDEX.get(LOG_LEVEL, 1):
        return
    record: Dict[str, Any] = {
        "ts": time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        "level": level,
        "msg": message,
    }
    record.update(fields)
    line = json.dumps(record, ensure_ascii=False)
    with _lock:
        sys.stdout.write(line + "\n")
        sys.stdout.flush()

def log_exception(message: str, exc: Exception, **fields: Any):
    log("ERROR", message, error=str(exc), **fields)

def generate_request_id() -> str:
    """Generate a short UUID4-based request id."""
    return uuid.uuid4().hex[:12]
