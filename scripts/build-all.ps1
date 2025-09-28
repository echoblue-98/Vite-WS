<#!
Clean, install, and build the frontend; verify backend imports.
Usage:
  powershell -ExecutionPolicy Bypass -File .\scripts\build-all.ps1
#>
param()
$ErrorActionPreference = 'Stop'
function Section($m){ Write-Host "[build] $m" -ForegroundColor Cyan }

# Frontend build -----------------------------------------------------------
Section "Installing frontend deps"
if (-not (Test-Path node_modules)) { npm install }
else { Write-Host "[build] node_modules present" -ForegroundColor DarkGray }

Section "Building frontend (vite build)"
$env:VITE_API_URL = $env:VITE_API_URL -as [string]
if (-not $env:VITE_API_URL) { $env:VITE_API_URL = 'http://localhost:8000' }
$build = npm run build
if ($LASTEXITCODE -ne 0) { throw "Vite build failed" }

# Backend quick check ------------------------------------------------------
Section "Verifying backend imports"
if (-not (Test-Path .venv)) { python -m venv .venv }
. .\.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt | Out-Null
python -c "import importlib; mods=['backend.main','backend.tts_preamble','backend.emotion','backend.sentiment','backend.feedback','backend.archetype','backend.eq_api']; [importlib.import_module(m) for m in mods]; print('Backend imports OK')"

Section "Done"
