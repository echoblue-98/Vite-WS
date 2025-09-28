# One-minute Deploy: Render (backend) + Vercel (frontend)

Follow these exact steps for stable public URLs.

## 1) Backend on Render

- In Render dashboard: New -> Web Service -> Connect your repo
- Environment: Python
- Health Check Path: `/health`
- Preferred: set Root Directory to `backend`
  - Build Command: `pip install -r requirements.txt`
  - Start Command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
- Alternate (works because we added a root delegator): leave Root Directory blank (repo root)
  - Build Command: `pip install -r requirements.txt` (this file delegates to `backend/requirements.txt`)
  - Start Command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
- Add Environment Variables:
  - `ALLOWED_ORIGINS` = `https://YOUR-VERCEL-DOMAIN.vercel.app` (add preview URL later if needed)
  - `ENABLE_PROMETHEUS` = `true`
  - `HSTS_ENABLED` = `false` (enable later behind HTTPS)
  - `ELEVENLABS_API_KEY` = `...` (required for TTS preamble)
  - `ELEVENLABS_VOICE_ID` = `aY9ejnGefMHNgwzgYnU1` (or your provided Voice ID)
  - `ELEVENLABS_MODEL_ID` = `eleven_monolingual_v1` (optional; keep default unless directed)
  - `TTS_PREAMBLE_TTL` = `21600` (seconds; cache to control cost/latency)
  - `TTS_RATE_WINDOW_SEC` = `60` and `TTS_RATE_MAX` = `5` (rate-limit per IP)
  - Optional cache: `REDIS_URL` = `redis://:<password>@host:6379/0` (if you wire Redis; app works without it)
  - Optional narration tuning (override defaults if desired):
    - `PREAMBLE_STABILITY` (default 0.32)
    - `PREAMBLE_SIMILARITY` (default 0.94)
    - `PREAMBLE_STYLE` (default 0.68)
    - `PREAMBLE_SPEAKER_BOOST` (default true)
    - `PREAMBLE_SCRIPT` (supports placeholders: `{name}`, `{name_part}`, `{company}`, `{product}`)
    - `PREAMBLE_COMPANY` (default "Western & Southern Financial Group")
    - `PREAMBLE_PRODUCT` (default "AI Adaptive Interview")
- Click Deploy; copy the public URL (e.g., `https://your-backend.onrender.com`).

Optional (via repo file): `render.yaml` is included so you can click “Automatic Deploys from YAML”. It sets the Python env, `rootDir: backend`, health check, and the same start/build commands. Secrets like `ELEVENLABS_API_KEY` are referenced via Render Secrets.

Quick verify
- After deploy, visit `https://your-backend.onrender.com/health` (should return `{ "status": "ok" }`).
- Visit `/ready` to confirm `tts_enabled: true` once `ELEVENLABS_API_KEY` is set.
- Test TTS MP3: `GET /tts/preamble?name=FirstName` (browser should download/play an MP3). Headers include `X-Cache` and `X-RateLimit-*`.

## 2) Frontend on Vercel

- In Vercel dashboard: New Project -> Import your repo (root at repo root)
- Build & Output Settings:
  - Framework Preset: Vite
  - Build Command: `npm run build`
  - Output Directory: `dist`
- Environment Variables:
  - `VITE_API_URL` = `https://your-backend.onrender.com`
  - Tip: Add a preview variable for preview deployments if your backend allows it via CORS.
- Deploy; copy the public URL (e.g., `https://your-frontend.vercel.app`).

Optional (via repo file): `vercel.json` included to set dist dir and a default `VITE_API_URL` (update after first backend deploy).

## 3) Test

- Open `https://your-frontend.vercel.app`
- In the app, verify:
  - Next question flow (button and voice command "next question")
  - Sentiment/Emotion endpoints respond
  - Voice upload works (if browser grants mic perms)

## 4) Notes

- CORS: `backend/config.py` allows `ALLOWED_ORIGINS` via env; set your Vercel domain precisely.
- Preview Deploys: For Vercel preview URLs, you can comma-separate `ALLOWED_ORIGINS` (e.g., `https://YOUR-PROD.vercel.app, https://YOUR-PREVIEW.vercel.app`).
- Metrics: Prometheus metrics exposed at `/metrics` on backend.
- Health: `/health`, `/ready`, `/version` endpoints are available.
- TTS: `GET /tts/preamble?name=FirstName` returns MP3. Headers include `X-Cache` and `X-RateLimit-*`. If `ELEVENLABS_API_KEY` is not set, endpoint returns 503.

## Fast Rollbacks
- Render: redeploy previous commit from the dashboard.
- Vercel: promote previous deployment.

## Troubleshooting
- 403/CORS: Ensure `ALLOWED_ORIGINS` on Render exactly matches the Vercel URL.
- 404 on SPA routes: Vercel rewrites are configured in `vercel.json`.
- Voice upload 501: Ensure `python-multipart` is installed (it is in `backend/requirements.txt`).
- "Could not open requirements file: requirements.txt": either set Render Root Directory to `backend` (preferred) or leave it blank and rely on the root `requirements.txt` delegator we added. After changing settings, use Render's "Clear build cache" and redeploy.
- Docker context errors on Render (e.g., `'/backend': not found`): do not use Docker for this project on Render. Use a Python Web Service with the commands above.
