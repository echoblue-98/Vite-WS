param(
  [string]$Base = "http://localhost:8000",
  [string]$Name = "Taylor",
  [switch]$Force,
  [switch]$Play
)

$ErrorActionPreference = 'Stop'
function Section($m) { Write-Host "[tts-verify] $m" -ForegroundColor Cyan }

$baseClean = $Base.TrimEnd('/')
$qs = "name=$Name"
if ($Force) { $qs += "&force=true" }
$uri = "$baseClean/tts/preamble?$qs"

Section "Requesting $uri"
try {
  $resp = Invoke-WebRequest -UseBasicParsing -Uri $uri -Method GET -TimeoutSec 60 -ErrorAction Stop
} catch {
  Write-Host "Request failed: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}

# Print rate limit and cache headers if present
$headers = @('X-Cache','X-RateLimit-Limit','X-RateLimit-Remaining','X-RateLimit-Reset','X-RateLimit-Backend')
foreach ($h in $headers) {
  $val = $resp.Headers[$h]
  if ($null -ne $val) { Write-Host "$($h): $(@($val) -join ', ')" }
}

# Save MP3 (perform a dedicated download to preserve binary)
$outDir = Join-Path $PSScriptRoot "..\public"
if (-not (Test-Path $outDir)) { $outDir = $PSScriptRoot }
$outFile = Join-Path $outDir ("preamble-" + ($Name -replace '\\s+','_') + ".mp3")
try {
  Invoke-WebRequest -UseBasicParsing -Uri $uri -Method GET -TimeoutSec 60 -OutFile $outFile -ErrorAction Stop | Out-Null
  Section "Saved to $outFile"
} catch {
  Write-Host "Failed to save MP3: $($_.Exception.Message)" -ForegroundColor Yellow
}

if ($Play) {
  Section "Attempting to play audio (Windows)"
  try { Start-Process $outFile } catch {}
}
