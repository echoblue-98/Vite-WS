<#!
Single-command style deployment helper for Option B (Docker Compose).
Usage:
  powershell -ExecutionPolicy Bypass -File .\scripts\run-compose.ps1 [-Rebuild] [-WithRedis]
#>
param(
  [switch]$Rebuild,
  [switch]$WithRedis
)

Write-Host "[compose] Starting deployment (Rebuild=$Rebuild, WithRedis=$WithRedis)" -ForegroundColor Cyan

# 1. Preconditions -----------------------------------------------------------
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  Write-Error "Docker CLI not found in PATH."; exit 1
}
try { docker info 1>$null 2>$null } catch { Write-Error "Docker daemon not reachable."; exit 1 }
if (-not (Test-Path ./docker-compose.yml)) { Write-Error "docker-compose.yml not found in current directory."; exit 1 }

# 2. Optional: generate a temp compose file that includes redis --------------
$composeFile = "docker-compose.yml"
$tempFile = $null
if ($WithRedis) {
  $content = Get-Content $composeFile -Raw
  if ($content -notmatch "redis:") {
    $redisFragment = @"
  redis:
    image: redis:7-alpine
    restart: unless-stopped
"@
    # Insert redis right before networks or at end
    if ($content -match "networks:") {
      $updated = $content -replace "networks:", "$redisFragment`nnetworks:"
    } else {
      $updated = $content + "`n$redisFragment" 
    }
    $tempFile = [System.IO.Path]::GetTempFileName() + ".yml"
    Set-Content -Path $tempFile -Value $updated -Encoding UTF8
    $composeFile = $tempFile
    Write-Host "[compose] Added ephemeral redis service via temp file: $composeFile" -ForegroundColor Yellow
  } else {
    Write-Host "[compose] Redis service already present in base compose." -ForegroundColor Yellow
  }
}

# 3. Build ------------------------------------------------------------------
if ($Rebuild) { docker compose -f $composeFile build --no-cache } else { docker compose -f $composeFile build }
if ($LASTEXITCODE -ne 0) { Write-Error "Build failed"; exit 2 }

# 4. Up ---------------------------------------------------------------------
docker compose -f $composeFile up -d
if ($LASTEXITCODE -ne 0) { Write-Error "compose up failed"; exit 3 }

# 5. Health wait ------------------------------------------------------------
$healthUrl = "http://localhost:8000/health"
$readyUrl  = "http://localhost:8000/ready"
$attempts = 0; $max = 40
Write-Host "[compose] Waiting for backend health..." -ForegroundColor Cyan
while ($attempts -lt $max) {
  try {
    $r = Invoke-WebRequest -Uri $healthUrl -TimeoutSec 2 -ErrorAction Stop
    if ($r.StatusCode -eq 200) { break }
  } catch {}
  Start-Sleep -Seconds 1
  $attempts++
}
if ($attempts -ge $max) { Write-Warning "Backend health endpoint did not stabilize." } else { Write-Host "[compose] /health OK after $attempts s" -ForegroundColor Green }

# 6. Ready check ------------------------------------------------------------
try { $r2 = Invoke-WebRequest -Uri $readyUrl -TimeoutSec 2 -ErrorAction Stop; if ($r2.StatusCode -eq 200) { Write-Host "[compose] /ready OK" -ForegroundColor Green } } catch { Write-Warning "/ready not OK yet" }

# 7. Version info -----------------------------------------------------------
try { (Invoke-WebRequest -Uri http://localhost:8000/version -TimeoutSec 3).Content | Write-Host } catch { Write-Warning "Could not fetch /version" }

# 8. Metrics sample ---------------------------------------------------------
try {
  $metrics = (Invoke-WebRequest -Uri http://localhost:8000/metrics -TimeoutSec 3).Content -split "`n" | Select-String -Pattern "http_requests_total|tts_cache" | Select-Object -First 8
  Write-Host "[compose] Metrics sample:" -ForegroundColor Cyan
  $metrics | ForEach-Object { Write-Host "  $_" }
} catch { Write-Warning "Metrics not available yet" }

# 9. Frontend probe ---------------------------------------------------------
try {
  $html = Invoke-WebRequest -Uri http://localhost:5173 -TimeoutSec 5
  if ($html.StatusCode -eq 200) { Write-Host "[compose] Frontend reachable (200)" -ForegroundColor Green }
} catch { Write-Warning "Frontend not reachable on 5173 yet" }

# 10. Redis functional hint -------------------------------------------------
if ($WithRedis) {
  Write-Host "[compose] Redis enabled. Export REDIS_URL if you want backend to use it (add to compose env)." -ForegroundColor Yellow
}

# 11. Exit summary ----------------------------------------------------------
Write-Host "[compose] Done. To view logs: docker compose logs -f backend" -ForegroundColor Cyan
if ($tempFile) { Write-Host "[compose] Temp compose file was: $tempFile" -ForegroundColor DarkGray }
