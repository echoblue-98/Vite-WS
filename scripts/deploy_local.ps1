param(
  [int]$Port = 8000
)
Write-Host "[deploy_local] Starting backend on port $Port" -ForegroundColor Cyan
if (-not (Test-Path ..\.venv)) {
  Write-Host "[deploy_local] Creating virtual environment" -ForegroundColor Yellow
  python -m venv ..\.venv
}
. ..\.venv\Scripts\Activate.ps1
pip install -r ..\backend\requirements.txt | Out-Null
$env:PYTHONPATH=".."
uvicorn backend.main:app --port $Port
