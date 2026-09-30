$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $Root
. (Join-Path $PSScriptRoot 'showcase-common.ps1')

Write-Host 'ONE TALIBON — SHOWCASE STOP' -ForegroundColor Cyan
$runtime = Read-JsonFile $Script:RuntimeStatePath
if (-not $runtime) {
    Write-Host 'No recorded showcase runtime state found. Nothing was terminated.' -ForegroundColor Yellow
    exit 0
}

$records = @()
$records += [pscustomobject]@{ Pid = [int] $runtime.proxyPid; Kind = 'proxy'; Port = [int] $runtime.proxyPort }
foreach ($worker in @($runtime.workers)) {
    $records += [pscustomobject]@{ Pid = [int] $worker.pid; Kind = 'worker'; Port = [int] $worker.port }
}

$stopped = @()
foreach ($entry in $records) {
    $identity = Test-RecordedProcessIdentity $entry.Pid $entry.Kind $entry.Port
    if (-not $identity.Alive) {
        Write-Host "$($entry.Kind) PID $($entry.Pid) already stopped."
        continue
    }
    if (-not $identity.Matches) {
        Write-Warning "Recorded $($entry.Kind) PID $($entry.Pid) no longer matches expected process for port $($entry.Port). It will NOT be terminated. Observed: $($identity.Description)"
        continue
    }
    Stop-Process -Id $entry.Pid -Force -ErrorAction Stop
    $stopped += $entry
    Write-Host "Stopped $($entry.Kind) PID $($entry.Pid) on port $($entry.Port)."
}

Start-Sleep -Milliseconds 400
$failed = $false
foreach ($entry in $stopped) {
    if (Get-Process -Id $entry.Pid -ErrorAction SilentlyContinue) {
        Write-Warning "PID $($entry.Pid) is still alive after stop request."
        $failed = $true
    }
}

Remove-Item $Script:RuntimeStatePath -Force -ErrorAction Stop
Write-Host "Removed runtime state: $Script:RuntimeStatePath"
if ($failed) { throw 'One or more recorded showcase processes did not stop cleanly.' }
Write-Host 'SHOWCASE RUNTIME STOPPED' -ForegroundColor Green
