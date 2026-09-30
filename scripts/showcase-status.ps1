param([string] $LanHost = '')

$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $Root
. (Join-Path $PSScriptRoot 'showcase-common.ps1')

$Head = Get-GitHead
$prepared = Read-JsonFile $Script:PreparedStatePath
$runtime = Read-JsonFile $Script:RuntimeStatePath
$degraded = $false

Write-Host 'ONE TALIBON — SHOWCASE STATUS' -ForegroundColor Cyan
Write-Host "Current SHA: $Head"
if ($prepared) {
    $preparedMatch = ([string] $prepared.sha -eq $Head)
    Write-Host "Prepared SHA: $($prepared.sha)"
    Write-Host "Prepared/current match: $preparedMatch"
    if (-not $preparedMatch) { $degraded = $true }
} else {
    Write-Host 'Prepared marker: missing' -ForegroundColor Yellow
    $degraded = $true
}

if (-not $runtime) {
    Write-Host 'Runtime state: not running / not recorded' -ForegroundColor Yellow
    Write-Host 'Logs: storage/logs/showcase-proxy.log; storage/logs/showcase-worker-<port>.log'
    exit 1
}

Write-Host "Recorded SHA: $($runtime.sha)"
if ([string] $runtime.sha -ne $Head) { $degraded = $true }
$proxyIdentity = Test-RecordedProcessIdentity ([int] $runtime.proxyPid) 'proxy' ([int] $runtime.proxyPort)
Write-Host "Proxy PID $($runtime.proxyPid): alive=$($proxyIdentity.Alive) identity=$($proxyIdentity.Matches)"
if (-not $proxyIdentity.Alive -or -not $proxyIdentity.Matches) { $degraded = $true }

foreach ($worker in @($runtime.workers)) {
    $identity = Test-RecordedProcessIdentity ([int] $worker.pid) 'worker' ([int] $worker.port)
    $health = $false
    if ($identity.Alive -and $identity.Matches) { $health = Test-HttpOk "http://127.0.0.1:$($worker.port)/up" 2 }
    Write-Host "Worker port $($worker.port) PID $($worker.pid): alive=$($identity.Alive) identity=$($identity.Matches) /up=$health"
    if (-not $identity.Alive -or -not $identity.Matches -or -not $health) { $degraded = $true }
}

$publicHealth = Test-HttpOk "http://127.0.0.1:$($runtime.proxyPort)/up" 3
Write-Host "Public proxy health: $publicHealth"
Write-Host "Public port: $($runtime.proxyPort)"
if (-not $publicHealth) { $degraded = $true }
$lan = Get-LanIPv4 $LanHost
if ($lan) { Write-Host "LAN IPv4: $lan"; Write-Host "LAN URL: http://$lan`:$($runtime.proxyPort)" } else { Write-Host 'LAN IPv4: not resolved' -ForegroundColor Yellow }
Write-Host "Proxy log: storage/logs/showcase-proxy.log"
foreach ($worker in @($runtime.workers)) { Write-Host "Worker log: storage/logs/showcase-worker-$($worker.port).log" }

if ($degraded) {
    Write-Host 'STATE: DEGRADED' -ForegroundColor Red
    exit 1
}
Write-Host 'STATE: HEALTHY' -ForegroundColor Green
exit 0
