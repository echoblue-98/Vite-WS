<#!
Kill local dev processes on ports 8000/5173 and common dev executables.
#>
param()
$ErrorActionPreference = 'SilentlyContinue'
Write-Host "[kill] Stopping listeners on 8000/5173" -ForegroundColor Yellow
$ports = @(8000,5173)
foreach ($p in $ports) {
  try {
    $procs = Get-NetTCPConnection -State Listen -LocalPort $p | Select-Object -ExpandProperty OwningProcess | Sort-Object -Unique
    foreach ($pid in $procs) { Stop-Process -Id $pid -Force }
  } catch {}
}
Write-Host "[kill] Stopping node/python/uvicorn if present" -ForegroundColor Yellow
foreach ($name in @('node','python','python3','uvicorn')) {
  try { Get-Process -Name $name -ErrorAction SilentlyContinue | Stop-Process -Force } catch {}
}
Write-Host "[kill] Done" -ForegroundColor Green
