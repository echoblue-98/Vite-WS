# One-minute Deploy: Render (backend) + Vercel (frontend)

Follow these exact steps for stable public URLs.

## 1) Backend on Render

- In Render dashboard: New -> Web Service -> Connect your repo
- Environment: Python, Root Directory: `backend`
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
- Add Environment Variables:
  - `ALLOWED_ORIGINS` = `https://YOUR-VERCEL-DOMAIN.vercel.app` (add preview URL later if needed)
  - `ENABLE_PROMETHEUS` = `true`
  - `HSTS_ENABLED` = `false` (enable later behind HTTPS)
- Click Deploy; copy the public URL (e.g., `https://your-backend.onrender.com`).

Optional (via repo file): `render.yaml` is included so you can click “Automatic Deploys from YAML”.

## 2) Frontend on Vercel

- In Vercel dashboard: New Project -> Import your repo (root at repo root)
- Build & Output Settings:
  - Framework Preset: Vite
  - Build Command: `npm run build`
  - Output Directory: `dist`
- Environment Variables:
  - `VITE_API_URL` = `https://your-backend.onrender.com`
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

## Fast Rollbacks
- Render: redeploy previous commit from the dashboard.
- Vercel: promote previous deployment.

## Troubleshooting
- 403/CORS: Ensure `ALLOWED_ORIGINS` on Render exactly matches the Vercel URL.
- 404 on SPA routes: Vercel rewrites are configured in `vercel.json`.
- Voice upload 501: Ensure `python-multipart` is installed (it is in `backend/requirements.txt`).
