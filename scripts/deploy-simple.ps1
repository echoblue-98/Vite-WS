<#!
.SYNOPSIS
  One-shot simple deployment / run script (no Docker) for local or bare VM.
.DESCRIPTION
  - Creates/updates Python venv
  - Installs backend dependencies
  - Copies .env.example to .env if .env missing
  - Builds frontend (Vite)
  - Starts backend (uvicorn) and static server for dist/ in separate background jobs
  - Prints access URLs
.NOTES
  Stop processes: Get-Job | Stop-Job; Remove-Job *
#>

param(
  [switch]$RebuildFrontend,
  [switch]$SkipFrontendBuild,
  [int]$BackendPort = 8000,
  [int]$FrontendPort = 5173,
  [switch]$ProdLike,
  [int]$HealthWaitSeconds = 25
)

Write-Host '== Simple Deploy Script ==' -ForegroundColor Cyan

$ErrorActionPreference = 'Stop'

# 1. Ensure .env exists
if (-not (Test-Path .env)) {
  if (Test-Path .env.example) { Copy-Item .env.example .env; Write-Host 'Created .env from .env.example' } else { New-Item -ItemType File -Name .env | Out-Null }
}

# 2. Python venv
if (-not (Test-Path .venv)) {
  Write-Host 'Creating virtual environment (.venv)...'
  python -m venv .venv
}

# Activate venv
$venvActivate = Join-Path . '.venv/Scripts/Activate.ps1'
. $venvActivate

# Resolve venv python (used inside background job to avoid activation scope issues)
$VenvPython = Join-Path . '.venv/Scripts/python.exe'
if (-not (Test-Path $VenvPython)) { throw "Venv python not found at $VenvPython" }
${PWD_PATH} = (Get-Location).Path

# 3. Backend deps
Write-Host 'Installing backend requirements...' -ForegroundColor Yellow
pip install --upgrade pip > $null
pip install -r backend/requirements.txt

# 4. Frontend deps + build
if (-not (Test-Path node_modules)) {
  Write-Host 'Installing npm dependencies...' -ForegroundColor Yellow
  npm install --no-audit --no-fund
}
if ($RebuildFrontend -or (-not $SkipFrontendBuild) -and -not (Test-Path dist/index.html)) {
  Write-Host 'Building frontend...' -ForegroundColor Yellow
  if ($ProdLike) { $env:VITE_PREAMBLE_MODE = 'auto' }
  npm run build
}

# 5. Start backend
Write-Host 'Starting backend...' -ForegroundColor Green
# Run uvicorn via venv python to ensure correct interpreter in the job
Start-Job -Name backend -ScriptBlock {
  param($py, $port, $prodLike, $wd)
  try {
    Set-Location -Path $wd
  } catch {}
  $argsList = @('-m','uvicorn','backend.main:app','--host','0.0.0.0','--port',[string]$port)
  if ($prodLike) { $argsList += @('--workers','2') }
  & $py @argsList
} -ArgumentList $VenvPython, $BackendPort, $ProdLike, $PWD_PATH | Out-Null
Start-Sleep -Seconds 2

# 6. Serve frontend dist
if (-not (Get-Command npx -ErrorAction SilentlyContinue)) { throw 'npx not found. Ensure Node.js is installed.' }
Write-Host 'Starting static file server...' -ForegroundColor Green
Start-Job -Name frontend -ScriptBlock {
  param($port, $wd)
  try { Set-Location -Path $wd } catch {}
  & npx serve -s dist -l $port
} -ArgumentList $FrontendPort, $PWD_PATH | Out-Null
Start-Sleep -Seconds 2

 # 7. Summary (initial)
Write-Host ''
Write-Host 'Backend:' -NoNewline; Write-Host " http://localhost:$BackendPort/health" -ForegroundColor Cyan
Write-Host 'Frontend:' -NoNewline; Write-Host " http://localhost:$FrontendPort" -ForegroundColor Cyan
Write-Host 'Version:' -NoNewline; Write-Host " http://localhost:$BackendPort/version" -ForegroundColor Cyan
Write-Host ''
Write-Host "Waiting up to $HealthWaitSeconds s for backend health..." -ForegroundColor DarkCyan

# 8. Poll health
$healthOk = $false
for ($i=1; $i -le $HealthWaitSeconds; $i++) {
  try {
    $resp = Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:$BackendPort/health" -TimeoutSec 3
    if ($resp.StatusCode -eq 200) { $healthOk = $true; Write-Host "Health OK (ready in ${i}s)" -ForegroundColor Green; break }
  } catch { Start-Sleep -Milliseconds 700 }
  Start-Sleep -Milliseconds 300
}

if (-not $healthOk) {
  Write-Host 'Backend not healthy within timeout.' -ForegroundColor Yellow
  $backendJob = Get-Job -Name backend -ErrorAction SilentlyContinue
  if ($backendJob -and $backendJob.State -eq 'Failed') { Write-Host 'Backend job FAILED.' -ForegroundColor Red }
  if ($backendJob) {
    Write-Host '---- Last backend output ----' -ForegroundColor Magenta
    Receive-Job -Name backend -Keep | Select-Object -Last 40 | ForEach-Object { $_ }
    Write-Host '---- End backend output ----' -ForegroundColor Magenta
  }
}

Write-Host ''
Write-Host 'Jobs running: (Get-Job)' -ForegroundColor Magenta
Write-Host 'Stop all jobs with:'
Write-Host '  Get-Job | Stop-Job; Remove-Job *' -ForegroundColor Yellow
