param(
    [ValidateRange(1, 32)] [int] $Workers = 4,
    [ValidateRange(1, 65535)] [int] $Port = 18000,
    [ValidateRange(1, 65535)] [int] $WorkerBasePort = 18101,
    [string] $LanHost = ''
)

$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $Root
. (Join-Path $PSScriptRoot 'showcase-common.ps1')

Write-Host 'ONE TALIBON — SHOWCASE START' -ForegroundColor Cyan
$Head = Get-GitHead
$prepared = Read-JsonFile $Script:PreparedStatePath
if (-not $prepared) { throw 'Showcase is not prepared. Run scripts/showcase-prepare.ps1 once for this SHA.' }
if ([string] $prepared.sha -ne $Head) { throw "Prepared SHA $($prepared.sha) does not match current HEAD $Head. Run showcase-prepare.ps1." }
if ([string] $prepared.database -ne $Script:ShowcaseDatabase) { throw 'Prepared marker targets the wrong database.' }
if ([int] $prepared.proxyPort -ne $Port) { throw "Prepared proxy port $($prepared.proxyPort) does not match requested port $Port. Re-run showcase-prepare.ps1 -Port $Port." }
if ([string]::IsNullOrWhiteSpace([string] $prepared.publicOrigin)) { throw 'Prepared marker does not contain a public origin. Re-run showcase-prepare.ps1.' }
if (-not (Test-Path (Join-Path $Root 'public\build\manifest.json'))) { throw 'Compiled assets are missing. Run showcase-prepare.ps1.' }
if (Test-Path (Join-Path $Root 'public\hot')) { throw 'public/hot exists. Showcase start refuses Vite hot mode.' }
if (Test-Path (Join-Path $Root 'storage\framework\vite.hot')) { throw 'storage/framework/vite.hot exists. Showcase start refuses Vite hot mode.' }
if (Test-Path $Script:RuntimeStatePath) { throw "Runtime state already exists at $Script:RuntimeStatePath. Run showcase-status.ps1 or showcase-stop.ps1 first." }

$publicOrigin = Resolve-ShowcasePublicOrigin ([string] $prepared.publicOrigin) $Port
Set-ShowcaseEnvironment $publicOrigin
New-Item -ItemType Directory -Path (Join-Path $Root 'storage\logs') -Force | Out-Null

$ports = @()
for ($i = 0; $i -lt $Workers; $i++) {
    $workerPort = $WorkerBasePort + $i
    if ($workerPort -gt 65535) { throw 'Worker port range exceeds 65535.' }
    if ($workerPort -eq $Port) { throw "Worker port $workerPort conflicts with public proxy port $Port." }
    $ports += $workerPort
}

$publicOwner = Get-ListeningProcessId $Port
if ($publicOwner) { throw "Public port $Port is already occupied by PID $publicOwner. It was not terminated." }
foreach ($workerPort in $ports) {
    $owner = Get-ListeningProcessId $workerPort
    if ($owner) { throw "Worker port $workerPort is already occupied by PID $owner. It was not terminated." }
}

$startedWorkers = New-Object System.Collections.ArrayList
$proxyProcess = $null
try {
    foreach ($workerPort in $ports) {
        $log = Join-Path $Root "storage\logs\showcase-worker-$workerPort.log"
        $err = Join-Path $Root "storage\logs\showcase-worker-$workerPort.err.log"
        $process = Start-Process -FilePath 'php' -ArgumentList @('artisan', 'serve', '--host=127.0.0.1', "--port=$workerPort") -WorkingDirectory $Root -RedirectStandardOutput $log -RedirectStandardError $err -PassThru -WindowStyle Hidden
        [void] $startedWorkers.Add([pscustomobject]@{ Process = $process; Port = $workerPort; Log = $log })
    }

    foreach ($worker in $startedWorkers) {
        $health = "http://127.0.0.1:$($worker.Port)/up"
        if (-not (Wait-HttpOk $health 48 250)) {
            throw "Laravel worker on port $($worker.Port) failed /up health check. See $($worker.Log)."
        }
    }

    $proxyLog = Join-Path $Root 'storage\logs\showcase-proxy.log'
    $proxyErr = Join-Path $Root 'storage\logs\showcase-proxy.err.log'
    $workerArg = ($ports -join ',')
    $proxyProcess = Start-Process -FilePath 'node' -ArgumentList @('scripts/showcase-proxy.mjs', '--host', '0.0.0.0', '--port', "$Port", '--workers', $workerArg) -WorkingDirectory $Root -RedirectStandardOutput $proxyLog -RedirectStandardError $proxyErr -PassThru -WindowStyle Hidden

    if (-not (Wait-HttpOk "http://127.0.0.1:$Port/up" 48 250)) {
        throw "Showcase proxy failed /up health check. See $proxyLog."
    }

    $runtime = [ordered]@{
        sha = $Head
        startedAt = (Get-Date).ToUniversalTime().ToString('o')
        publicOrigin = $publicOrigin
        proxyPid = [int] $proxyProcess.Id
        proxyPort = $Port
        workers = @($startedWorkers | ForEach-Object { [ordered]@{ pid = [int] $_.Process.Id; port = [int] $_.Port } })
    }
    Write-AtomicJson $Script:RuntimeStatePath $runtime

    $lan = Get-LanIPv4 $LanHost
    Write-Host 'SHOWCASE RUNTIME READY' -ForegroundColor Green
    Write-Host "SHA: $Head"
    Write-Host "Public origin: $publicOrigin"
    Write-Host "Local: http://127.0.0.1:$Port"
    if ($lan) { Write-Host "LAN:   http://$lan`:$Port" } else { Write-Host 'LAN:   not resolved' -ForegroundColor Yellow }
    Write-Host "Workers: $Workers"
    Write-Host "Worker ports: $($ports -join ', ')"
    Write-Host "Proxy PID: $($proxyProcess.Id)"
    Write-Host "Worker PIDs: $((@($startedWorkers | ForEach-Object { $_.Process.Id })) -join ', ')"
    Write-Host 'Health: proxy PASS; all workers PASS'
} catch {
    if ($proxyProcess -and -not $proxyProcess.HasExited) {
        Stop-Process -Id $proxyProcess.Id -Force -ErrorAction SilentlyContinue
    }
    foreach ($worker in $startedWorkers) {
        if (-not $worker.Process.HasExited) { Stop-Process -Id $worker.Process.Id -Force -ErrorAction SilentlyContinue }
    }
    Remove-Item $Script:RuntimeStatePath -Force -ErrorAction SilentlyContinue
    throw
}
