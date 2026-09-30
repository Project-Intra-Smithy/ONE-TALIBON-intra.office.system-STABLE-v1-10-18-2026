$Script:ShowcaseDatabase = 'talibon_showcase_s1'
$Script:ShowcaseDbHost = '127.0.0.1'
$Script:ShowcaseDbPort = '5432'
$Script:PreparedStatePath = Join-Path $Root 'storage\framework\showcase-prepared.json'
$Script:RuntimeStatePath = Join-Path $Root 'storage\framework\showcase-runtime.json'

function Resolve-ShowcasePublicOrigin([string] $Explicit = '', [int] $Port = 18000) {
    $candidate = $Explicit
    if ([string]::IsNullOrWhiteSpace($candidate)) { $candidate = $env:SHOWCASE_PUBLIC_ORIGIN }
    if ([string]::IsNullOrWhiteSpace($candidate)) {
        $lan = Get-LanIPv4
        $candidate = if ($lan) { "http://$lan`:$Port" } else { "http://127.0.0.1:$Port" }
    }

    try { $uri = [Uri] $candidate }
    catch { throw "Invalid showcase public origin '$candidate'. Use an absolute http(s) origin such as https://portal.example.test." }

    if (-not $uri.IsAbsoluteUri -or $uri.Scheme -notin @('http', 'https')) {
        throw "Invalid showcase public origin '$candidate'. Only absolute http(s) origins are supported."
    }
    if (-not [string]::IsNullOrWhiteSpace($uri.UserInfo) -or -not [string]::IsNullOrWhiteSpace($uri.Query) -or -not [string]::IsNullOrWhiteSpace($uri.Fragment)) {
        throw "Invalid showcase public origin '$candidate'. Credentials, query strings, and fragments are not allowed."
    }
    if ($uri.AbsolutePath -and $uri.AbsolutePath -ne '/') {
        throw "Invalid showcase public origin '$candidate'. Use the origin only, without a path."
    }

    return $uri.GetLeftPart([System.UriPartial]::Authority).TrimEnd('/')
}

function Set-ShowcaseEnvironment([string] $PublicOrigin = '') {
    if ([string]::IsNullOrWhiteSpace($PublicOrigin)) {
        $PublicOrigin = Resolve-ShowcasePublicOrigin
    } else {
        $PublicOrigin = Resolve-ShowcasePublicOrigin $PublicOrigin
    }

    $env:APP_ENV = 'showcase'
    $env:APP_DEBUG = 'false'
    $env:APP_URL = $PublicOrigin
    $env:SHOWCASE_PUBLIC_ORIGIN = $PublicOrigin
    $env:SHOWCASE_MODE = 'true'
    $env:SESSION_DRIVER = 'file'
    $env:CACHE_STORE = 'file'
    $env:QUEUE_CONNECTION = 'sync'
    $env:DB_CONNECTION = 'pgsql'
    $env:DB_HOST = $Script:ShowcaseDbHost
    $env:DB_PORT = $Script:ShowcaseDbPort
    $env:DB_DATABASE = $Script:ShowcaseDatabase
}

function Get-GitHead {
    $value = (& git rev-parse HEAD 2>$null)
    if ($LASTEXITCODE -ne 0 -or -not $value) { throw 'Unable to resolve current Git HEAD.' }
    return ($value | Select-Object -First 1).Trim()
}

function Assert-CleanTrackedWorktree {
    $status = (& git status --porcelain --untracked-files=no 2>$null)
    if ($LASTEXITCODE -ne 0) { throw 'git status failed.' }
    if ($status) { throw 'Tracked worktree is not clean. Commit or restore tracked changes before showcase preparation.' }
}

function Get-DotEnvValue([string] $Name) {
    $path = Join-Path $Root '.env'
    if (-not (Test-Path $path)) { return $null }
    $line = Get-Content $path | Where-Object { $_ -match ('^\s*' + [regex]::Escape($Name) + '\s*=') } | Select-Object -First 1
    if (-not $line) { return $null }
    $value = ($line -split '=', 2)[1].Trim()
    if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
        $value = $value.Substring(1, $value.Length - 2)
    }
    return $value
}

function Assert-AppKeyExists {
    $key = $env:APP_KEY
    if ([string]::IsNullOrWhiteSpace($key)) { $key = Get-DotEnvValue 'APP_KEY' }
    if ([string]::IsNullOrWhiteSpace($key)) { throw 'APP_KEY is missing. Showcase preparation will not generate one.' }
}

function Invoke-Checked([string] $Label, [scriptblock] $Command) {
    Write-Host $Label -ForegroundColor Cyan
    & $Command
    if ($LASTEXITCODE -ne 0) { throw "$Label failed with exit code $LASTEXITCODE." }
}

function Read-JsonFile([string] $Path) {
    if (-not (Test-Path $Path)) { return $null }
    try { return (Get-Content $Path -Raw | ConvertFrom-Json) }
    catch { throw "Invalid JSON state file: $Path" }
}

function Write-AtomicJson([string] $Path, $Value) {
    $directory = Split-Path $Path -Parent
    New-Item -ItemType Directory -Path $directory -Force | Out-Null
    $temp = "$Path.tmp"
    $Value | ConvertTo-Json -Depth 8 | Set-Content -Path $temp -Encoding UTF8
    Move-Item -Path $temp -Destination $Path -Force
}

function Get-ListeningProcessId([int] $Port) {
    $listener = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($listener) { return [int] $listener.OwningProcess }
    return $null
}

function Test-HttpOk([string] $Uri, [int] $TimeoutSec = 2) {
    try {
        $response = Invoke-WebRequest -Uri $Uri -UseBasicParsing -TimeoutSec $TimeoutSec -MaximumRedirection 0 -ErrorAction Stop
        return ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400)
    } catch {
        if ($_.Exception.Response -and [int] $_.Exception.Response.StatusCode -ge 200 -and [int] $_.Exception.Response.StatusCode -lt 400) { return $true }
        return $false
    }
}

function Wait-HttpOk([string] $Uri, [int] $Attempts = 40, [int] $DelayMs = 250) {
    for ($i = 0; $i -lt $Attempts; $i++) {
        if (Test-HttpOk $Uri 2) { return $true }
        Start-Sleep -Milliseconds $DelayMs
    }
    return $false
}

function Get-LanIPv4([string] $Explicit = '') {
    if (-not [string]::IsNullOrWhiteSpace($Explicit)) { return $Explicit }
    try {
        return Get-NetIPConfiguration |
            Where-Object { $_.IPv4DefaultGateway -and $_.NetAdapter.Status -eq 'Up' } |
            ForEach-Object { $_.IPv4Address.IPAddress } |
            Where-Object { $_ -and $_ -ne '127.0.0.1' -and $_ -notlike '169.254.*' } |
            Select-Object -First 1
    } catch { return $null }
}

function Get-ProcessRecord([int] $ProcessId) {
    try { return Get-CimInstance Win32_Process -Filter "ProcessId = $ProcessId" -ErrorAction Stop }
    catch { return $null }
}

function Test-RecordedProcessIdentity([int] $ProcessId, [string] $Kind, [int] $Port) {
    $record = Get-ProcessRecord $ProcessId
    if (-not $record) { return @{ Alive = $false; Matches = $false; Description = 'not running' } }
    $name = [string] $record.Name
    $command = [string] $record.CommandLine
    if ($Kind -eq 'proxy') {
        $matches = ($name -match '^node(\.exe)?$') -and ($command -match 'showcase-proxy\.mjs') -and ($command -match [regex]::Escape("--port $Port"))
    } else {
        $matches = ($name -match '^php(\.exe)?$') -and ($command -match 'artisan') -and ($command -match 'serve') -and (($command -match [regex]::Escape("--port=$Port")) -or ($command -match [regex]::Escape("--port $Port")))
    }
    return @{ Alive = $true; Matches = [bool] $matches; Description = "$name $command" }
}
