param(
  [string]$Base = "http://localhost:8000"
)
Write-Host "[verify] Checking endpoints at $Base" -ForegroundColor Cyan
function ShowSection($title) { Write-Host ("`n== " + $title + " ==") -ForegroundColor Green }

try { $h = Invoke-WebRequest -UseBasicParsing -Uri "$Base/health" -TimeoutSec 5 } catch { $h = $_ }
try { $r = Invoke-WebRequest -UseBasicParsing -Uri "$Base/ready" -TimeoutSec 5 } catch { $r = $_ }
try { $v = Invoke-WebRequest -UseBasicParsing -Uri "$Base/version" -TimeoutSec 5 } catch { $v = $_ }
try { $m = Invoke-WebRequest -UseBasicParsing -Uri "$Base/metrics" -TimeoutSec 5 } catch { $m = $_ }

ShowSection "health"
if ($h -is [Microsoft.PowerShell.Commands.HtmlWebResponseObject]) { Write-Host $h.Content } else { Write-Host $h }
ShowSection "ready"
if ($r -is [Microsoft.PowerShell.Commands.HtmlWebResponseObject]) { Write-Host $r.Content } else { Write-Host $r }
ShowSection "version"
if ($v -is [Microsoft.PowerShell.Commands.HtmlWebResponseObject]) { Write-Host $v.Content } else { Write-Host $v }
ShowSection "metrics (first 15 lines)"
if ($m -is [Microsoft.PowerShell.Commands.HtmlWebResponseObject]) { ($m.Content -split "`n" | Select-Object -First 15) -join "`n" | Write-Host } else { Write-Host $m }

try {
  $preamble = Invoke-WebRequest -UseBasicParsing -Method Head -Uri "$Base/tts/preamble" -TimeoutSec 5
  ShowSection "tts/preamble headers"
  $preamble.Headers.GetEnumerator() | ForEach-Object { Write-Host ("{0}: {1}" -f $_.Key, ($_.Value -join ', ')) }
} catch {
  Write-Host "tts/preamble not available (expected if no ELEVENLABS_API_KEY)" -ForegroundColor Yellow
}
Write-Host "`n[verify] Done" -ForegroundColor Cyan
