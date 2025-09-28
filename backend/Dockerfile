# Backend Dockerfile - FastAPI + Uvicorn
# Multi-stage for smaller final image
FROM python:3.11-slim AS base
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1
WORKDIR /app

# System deps (add build-essential if future native deps appear)
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY backend /app/backend

# Non-root user
RUN useradd -u 1001 appuser && chown -R appuser /app
USER appuser

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD curl -fsS http://localhost:8000/health || exit 1

ENV LOG_LEVEL=INFO \
    TTS_RATE_WINDOW_SEC=60 \
    TTS_RATE_MAX=5

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
