from functools import lru_cache
import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator


class Settings(BaseSettings):
    app_name: str = "EQ Adaptive Interview"
    app_version: str = "0.1.0"
    commit: str = "unknown"
    build_time: str = "unknown"

    allowed_origins: List[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    log_level: str = "INFO"

    tts_rate_window_sec: int = 60
    tts_rate_max: int = 5
    tts_cache_ttl: int = 21600

    hsts_enabled: bool = True

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False, extra="ignore")

    @field_validator("app_version", "commit", "build_time", mode="before")
    def env_override_simple(cls, v, info):  # type: ignore[override]
        # If already provided via environment (pydantic-settings loads), value is v
        return v

    @field_validator("allowed_origins", mode="before")
    def split_origins(cls, v):  # type: ignore[override]
        # Accept multiple input shapes:
        # 1. Comma separated string: "https://a, https://b"
        # 2. JSON-style list string: "[https://a, https://b]" (with or without quotes)
        # 3. Empty / whitespace -> return default by signalling None so pydantic uses default
        # 4. Already a list -> passthrough
        if v is None:
            # No env provided: let pydantic use the model default
            return Settings.model_fields["allowed_origins"].default
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            raw = v.strip()
            if not raw:
                # Empty string provided via env: fall back to model default to avoid validation error
                return Settings.model_fields["allowed_origins"].default
            # If looks like a bracketed list, strip brackets then split
            if raw.startswith("[") and raw.endswith("]"):
                inner = raw[1:-1].strip()
                if not inner:
                    # Empty bracketed list: fall back to default
                    return Settings.model_fields["allowed_origins"].default
                # Split on commas; allow either quoted or unquoted entries
                parts = [p.strip().strip('"\'') for p in inner.split(",")]
                cleaned = [p for p in (s.strip() for s in parts) if p]
                return cleaned
            # Fallback: simple comma separated
            return [o.strip() for o in raw.split(",") if o.strip()]
        return v

    @field_validator("hsts_enabled", mode="before")
    def parse_bool(cls, v):  # type: ignore[override]
        if isinstance(v, str):
            return v.lower() in ("1", "true", "yes", "on")
        return v

    @field_validator("tts_rate_window_sec", "tts_rate_max", "tts_cache_ttl", mode="before")
    def parse_ints(cls, v):  # type: ignore[override]
        if isinstance(v, str) and v.isdigit():
            return int(v)
        return v

@lru_cache()
def get_settings() -> Settings:
    return Settings()  # environment automatically loaded
