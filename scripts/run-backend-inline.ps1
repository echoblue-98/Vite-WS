<#!
Run FastAPI backend inline with logs visible in this terminal.
#>
param(
  [int]$Port = 8000,
  [string]$BindHost = '127.0.0.1'
)
$ErrorActionPreference = 'Stop'
Write-Host ("[inline] Starting backend on {0}:{1}" -f $BindHost, $Port) -ForegroundColor Cyan
if (-not (Test-Path .venv)) { python -m venv .venv }
. .\.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt | Out-Null
$env:ALLOWED_ORIGINS = '["http://localhost:5173"]'
$env:ENABLE_PROMETHEUS = "true"
uvicorn backend.main:app --host $BindHost --port $Port
