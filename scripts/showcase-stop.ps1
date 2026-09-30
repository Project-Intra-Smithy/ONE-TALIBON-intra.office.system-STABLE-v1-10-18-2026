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
$unresolved = @()
$failed = $false
foreach ($entry in $records) {
    $identity = Test-RecordedProcessIdentity $entry.Pid $entry.Kind $entry.Port
    if (-not $identity.Alive) {
        Write-Host "$($entry.Kind) PID $($entry.Pid) already stopped."
        continue
    }
    if (-not $identity.Matches) {
        Write-Warning "Recorded $($entry.Kind) PID $($entry.Pid) no longer matches expected process for port $($entry.Port). It will NOT be terminated. Observed: $($identity.Description)"
        $unresolved += [pscustomobject]@{ pid = $entry.Pid; kind = $entry.Kind; port = $entry.Port; reason = 'identity-mismatch'; observed = $identity.Description }
        continue
    }
    try {
        Stop-Process -Id $entry.Pid -Force -ErrorAction Stop
        $stopped += $entry
        Write-Host "Stopped $($entry.Kind) PID $($entry.Pid) on port $($entry.Port)."
    } catch {
        Write-Warning "Failed to stop recorded $($entry.Kind) PID $($entry.Pid): $($_.Exception.Message)"
        $failed = $true
        $unresolved += [pscustomobject]@{ pid = $entry.Pid; kind = $entry.Kind; port = $entry.Port; reason = 'stop-failed'; observed = $_.Exception.Message }
    }
}

Start-Sleep -Milliseconds 400
foreach ($entry in $stopped) {
    if (Get-Process -Id $entry.Pid -ErrorAction SilentlyContinue) {
        Write-Warning "PID $($entry.Pid) is still alive after stop request."
        $failed = $true
        $unresolved += [pscustomobject]@{ pid = $entry.Pid; kind = $entry.Kind; port = $entry.Port; reason = 'still-alive'; observed = 'Process remained alive after Stop-Process.' }
    }
}

if ($unresolved.Count -gt 0 -or $failed) {
    $runtime | Add-Member -NotePropertyName stopBlockedAt -NotePropertyValue ((Get-Date).ToUniversalTime().ToString('o')) -Force
    $runtime | Add-Member -NotePropertyName unresolvedProcesses -NotePropertyValue @($unresolved) -Force
    Write-AtomicJson $Script:RuntimeStatePath $runtime
    Write-Warning "Runtime state was retained at $Script:RuntimeStatePath because one or more recorded processes remain unresolved."
    throw 'Showcase stop is incomplete. Unresolved recorded process state was preserved; no mismatched PID was terminated.'
}

Remove-Item $Script:RuntimeStatePath -Force -ErrorAction Stop
Write-Host "Removed runtime state: $Script:RuntimeStatePath"
Write-Host 'SHOWCASE RUNTIME STOPPED' -ForegroundColor Green
