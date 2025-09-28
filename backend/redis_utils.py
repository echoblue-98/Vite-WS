import os
from functools import lru_cache
from typing import Optional

try:
    import redis  # type: ignore
except ImportError:  # pragma: no cover - optional dep
    redis = None  # type: ignore


@lru_cache()
def get_redis_client() -> Optional["redis.Redis"]:
    """Return a Redis client if REDIS_URL is configured and redis lib available; else None.

    Uses a short socket timeout to avoid hanging the FastAPI event loop when Redis is absent/unreachable.
    """
    url = os.getenv("REDIS_URL")
    if not url or not redis:
        return None
    try:
        client = redis.from_url(url, socket_timeout=0.5, socket_connect_timeout=0.5, retry_on_timeout=False)
        # Lightweight ping to validate
        client.ping()
        return client
    except Exception:
        return None


def redis_available() -> bool:
    return get_redis_client() is not None
