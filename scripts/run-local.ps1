<#!
Run backend (FastAPI) + frontend (Vite) locally without Docker.
Creates virtual env if missing, installs deps selectively, starts both.
Usage:
  powershell -ExecutionPolicy Bypass -File .\scripts\run-local.ps1 [-SkipFrontend] [-SkipBackend] [-PortBackend 8000] [-PortFrontend 5173]
#>
param(
  [switch]$SkipFrontend,
  [switch]$SkipBackend,
  [int]$PortBackend = 8000,
  [int]$PortFrontend = 5173
)

$ErrorActionPreference = 'Stop'
function Section($msg) { Write-Host "[local] $msg" -ForegroundColor Cyan }
function Warn($msg) { Write-Host "[local] $msg" -ForegroundColor Yellow }
function WaitForUrl($url, $attempts = 12, $delayMs = 500) {
  for ($i = 1; $i -le $attempts; $i++) {
    try {
      $resp = Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 3
      if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 500) { return $true }
    } catch {}
    Start-Sleep -Milliseconds $delayMs
  }
  return $false
}

$root = Split-Path -Parent $MyInvocation.MyCommand.Path | Split-Path -Parent
Push-Location $root

# Backend -------------------------------------------------------------------
if (-not $SkipBackend) {
  Section "Preparing backend environment"
  if (-not (Test-Path .venv)) {
    Section "Creating virtual environment (.venv)"
    python -m venv .venv
  }
  . .\.venv\Scripts\Activate.ps1
  if (-not (Get-Command pip -ErrorAction SilentlyContinue)) { throw 'pip missing in venv' }
  Section "Installing backend requirements (only if new)"
  pip install -r backend/requirements.txt | Out-Null
  # Provide JSON array for List[str] env parsing (build safely to avoid quoting issues)
  $allowedOrigins = @("http://localhost:$PortFrontend")
  $env:ALLOWED_ORIGINS = ($allowedOrigins | ConvertTo-Json -Compress)
  $env:ENABLE_PROMETHEUS = 'true'
  Section "Starting backend on :$PortBackend"
  Start-Process -WindowStyle Minimized powershell -ArgumentList "-NoLogo","-NoProfile","-Command",". .\\.venv\\Scripts\\Activate.ps1; uvicorn backend.main:app --host 0.0.0.0 --port $PortBackend --reload" | Out-Null
  $ok = WaitForUrl "http://localhost:$PortBackend/health"
  if ($ok) { Section "/health OK" } else { Warn "Backend health not ready after wait" }
}

# Frontend ------------------------------------------------------------------
if (-not $SkipFrontend) {
  Section "Installing frontend dependencies (if needed)"
  if (-not (Test-Path node_modules)) { npm install | Out-Null }
  Section "Starting Vite dev server on :$PortFrontend"
  # Ensure both env vars are set for compatibility across components
  $env:VITE_API_BASE = "http://localhost:$PortBackend"
  $env:VITE_API_URL = "http://localhost:$PortBackend"
  Start-Process -WindowStyle Minimized powershell -ArgumentList "-NoLogo","-NoProfile","-Command","npm run dev" | Out-Null
  $frontOk = WaitForUrl "http://localhost:$PortFrontend"
  if ($frontOk) { Section "Frontend reachable" } else { Warn "Frontend not reachable after wait" }
}

Section "Summary"
if (-not $SkipBackend) { Write-Host "  Backend: http://localhost:$PortBackend" }
if (-not $SkipFrontend) { Write-Host "  Frontend: http://localhost:$PortFrontend" }
Write-Host "  Metrics: http://localhost:$PortBackend/metrics" -ForegroundColor DarkCyan
Write-Host "  Stop: Close spawned PowerShell windows OR kill processes (uvicorn, node)." -ForegroundColor DarkGray

Pop-Location
