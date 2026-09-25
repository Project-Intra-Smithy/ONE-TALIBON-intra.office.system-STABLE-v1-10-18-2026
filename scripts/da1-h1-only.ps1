$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $Root
$Branch = 'KIRCH-TALIBON-DA1-H1-CARRIER-NAVIGATION-REPAIR'
$TargetDb = 'talibon_h1_mutations'

function Assert-NativeSuccess([string]$Label) { if ($LASTEXITCODE -ne 0) { throw "$Label failed with exit code $LASTEXITCODE." } }
function Get-DotEnvValue([string]$Name, [string]$Default = '') {
    if (-not (Test-Path '.env')) { return $Default }
    $pattern = '^\s*' + [regex]::Escape($Name) + '='
    $line = Get-Content '.env' | Where-Object { $_ -match $pattern } | Select-Object -First 1
    if (-not $line) { return $Default }
    $value = ($line -replace $pattern, '').Trim()
    if ($value.Length -ge 2 -and (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'")))) { $value = $value.Substring(1, $value.Length - 2) }
    return $value
}

Write-Host '=== ONE TALIBON — DA1 H1-ONLY AUDIT ===' -ForegroundColor Cyan
if (-not (Test-Path '.env')) { throw 'Missing private .env.' }
if (-not (Test-Path 'public\build\manifest.json')) { throw 'Missing production build manifest.' }

git fetch sales --prune
Assert-NativeSuccess 'git fetch'
$RemoteHead = (git rev-parse "sales/$Branch").Trim()
$Head = (git rev-parse HEAD).Trim()
Write-Host "Remote: $RemoteHead"
Write-Host "HEAD:   $Head"
if ($Head -ne $RemoteHead) { throw "Checkout is not at current DA1 authority. Expected $RemoteHead" }
$Dirty = git status --porcelain
Assert-NativeSuccess 'git status'
if ($Dirty) { $Dirty | Write-Host; throw 'H1 requires a clean worktree.' }

$Listener = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($Listener) {
    $PidValue = $Listener.OwningProcess
    $Proc = Get-CimInstance Win32_Process -Filter "ProcessId = $PidValue" -ErrorAction SilentlyContinue
    $Cmd = [string]$Proc.CommandLine
    $IsDa1 = $Cmd -match '127\.0\.0\.1:8000' -and $Cmd -match 'Talibon-DA1-Audit' -and $Cmd -match 'laravel.*resources[\\/]server\.php'
    if (-not $IsDa1) { throw "Port 8000 is occupied by an unrelated process. PID=$PidValue" }
    Stop-Process -Id $PidValue -Force
    Start-Sleep -Milliseconds 800
}

$DemoPassword = Get-DotEnvValue 'PROTOTYPE_DEMO_PASSWORD'
if ([string]::IsNullOrWhiteSpace($DemoPassword) -or $DemoPassword.Length -lt 16) { throw 'PROTOTYPE_DEMO_PASSWORD must be at least 16 characters.' }

$env:APP_ENV = 'testing'
$env:APP_DEBUG = 'false'
$env:APP_URL = 'http://127.0.0.1:8000'
$env:SHOWCASE_MODE = 'true'
$env:PROTOTYPE_DEMO_PASSWORD = $DemoPassword
$env:QA_DEMO_PASSWORD = $DemoPassword
$env:SESSION_DRIVER = 'file'
$env:CACHE_STORE = 'file'
$env:QUEUE_CONNECTION = 'sync'
$env:DB_CONNECTION = Get-DotEnvValue 'DB_CONNECTION' 'pgsql'
$env:DB_HOST = Get-DotEnvValue 'DB_HOST' '127.0.0.1'
$env:DB_PORT = Get-DotEnvValue 'DB_PORT' '5432'
$env:DB_USERNAME = Get-DotEnvValue 'DB_USERNAME' 'postgres'
$env:DB_PASSWORD = Get-DotEnvValue 'DB_PASSWORD' ''
$env:PGPASSWORD = $env:DB_PASSWORD
$env:DB_DATABASE = $TargetDb
$env:QA_BASE_URL = 'http://127.0.0.1:8000'
$env:QA_MODE = 'production'
$env:QA_EXPECTED_SHA = $Head
$env:QA_ENVIRONMENT = 'da1-local-clean-room'

$PsqlCommand = Get-Command psql -ErrorAction SilentlyContinue
$Psql = if ($PsqlCommand) { $PsqlCommand.Source } else { Get-ChildItem 'C:\Program Files\PostgreSQL' -Filter psql.exe -Recurse -ErrorAction SilentlyContinue | Select-Object -ExpandProperty FullName -First 1 }
if (-not $Psql) { throw 'psql.exe not found.' }
$Exists = & $Psql -h $env:DB_HOST -p $env:DB_PORT -U $env:DB_USERNAME -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$TargetDb';"
Assert-NativeSuccess 'H1 database lookup'
if (($Exists | Out-String).Trim() -ne '1') {
    & $Psql -h $env:DB_HOST -p $env:DB_PORT -U $env:DB_USERNAME -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE $TargetDb;"
    Assert-NativeSuccess 'H1 database create'
}

Write-Host ''
Write-Host "=== RESET DISPOSABLE DATABASE: $TargetDb ===" -ForegroundColor Cyan
php artisan optimize:clear
Assert-NativeSuccess 'optimize:clear'
php artisan migrate:fresh --seed --force
Assert-NativeSuccess 'H1 migrate:fresh --seed'

Write-Host ''
Write-Host '=== PROTOTYPE SEED CONTRACT ===' -ForegroundColor Cyan
$SeedCode = @'
$emails = array_column(config('showcase.personas'), 'email');
$active = \App\Models\User::query()->whereIn('email', $emails)->where('is_active', true)->count();
$transaction = \App\Models\WorkflowTransaction::query()->where('title', 'Road Rehabilitation Funding Request')->exists();
$memorandum = \App\Models\Memorandum::query()->where('status', 'published')->exists();
$legislative = \App\Models\LegislativeRecord::query()->exists();
$employee = \App\Models\User::query()->where('email', 'employee@talibon.demo')->with('employee.leaveCreditAccounts')->first();
$leaveReady = $employee?->employee?->leaveCreditAccounts?->isNotEmpty() === true;
echo json_encode(['personas' => $active, 'transaction' => $transaction, 'memorandum' => $memorandum, 'legislative' => $legislative, 'leave' => $leaveReady], JSON_THROW_ON_ERROR).PHP_EOL;
if ($active !== 7 || !$transaction || !$memorandum || !$legislative || !$leaveReady) { throw new RuntimeException('Prototype seed contract failed.'); }
'@
php artisan tinker --execute=$SeedCode
Assert-NativeSuccess 'Prototype seed contract'

$Chrome = @(
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
) | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1
if (-not $Chrome) { throw 'Google Chrome not found.' }
$env:QA_BROWSER_EXECUTABLE_PATH = $Chrome

Remove-Item 'public\hot' -Force -ErrorAction SilentlyContinue
Remove-Item 'storage\framework\vite.hot' -Force -ErrorAction SilentlyContinue
$Out = 'storage\logs\da1-h1-runtime.out.log'
$Err = 'storage\logs\da1-h1-runtime.err.log'
Remove-Item $Out -Force -ErrorAction SilentlyContinue
Remove-Item $Err -Force -ErrorAction SilentlyContinue
$ServerScript = Join-Path $Root 'vendor\laravel\framework\src\Illuminate\Foundation\resources\server.php'
if (-not (Test-Path $ServerScript)) { throw "Laravel built-in server router not found: $ServerScript" }
Write-Host "Runtime DB target: $env:DB_DATABASE" -ForegroundColor DarkGray
$Server = Start-Process -FilePath 'php' -ArgumentList @('-S','127.0.0.1:8000',$ServerScript) -WorkingDirectory $Root -RedirectStandardOutput $Out -RedirectStandardError $Err -PassThru -WindowStyle Hidden

try {
    Write-Host ''
    Write-Host '=== WAITING FOR H1 SERVER ===' -ForegroundColor Cyan
    $Ready = $false
    for ($i = 0; $i -lt 60; $i++) {
        if ($Server.HasExited) { throw 'H1 Laravel server exited before readiness.' }
        $CurrentListener = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($CurrentListener -and $CurrentListener.OwningProcess -ne $Server.Id) {
            throw "Port 8000 listener is not the current H1 server. Expected PID=$($Server.Id) Actual PID=$($CurrentListener.OwningProcess)"
        }
        if ($CurrentListener -and $CurrentListener.OwningProcess -eq $Server.Id) {
            try {
                $Response = Invoke-WebRequest -Uri 'http://127.0.0.1:8000/login' -UseBasicParsing -TimeoutSec 2
                if ($Response.StatusCode -eq 200) { $Ready = $true; break }
            } catch {}
        }
        Start-Sleep -Milliseconds 500
    }
    if (-not $Ready) { throw 'H1 Laravel server did not become ready.' }
    Write-Host ''
    Write-Host '=== H1 REAL MUTATION AUDIT ===' -ForegroundColor Cyan
    node tests/Browser/h1-mutation-readiness.mjs
    if ($LASTEXITCODE -ne 0) {
        Write-Host '=== H1 FAILURE REPORT ===' -ForegroundColor Red
        Get-Content 'storage/app/qa/h1-mutation-readiness-report.json' -Raw -ErrorAction SilentlyContinue
        throw "H1 mutation audit failed with exit code $LASTEXITCODE."
    }
    Write-Host 'H1 REAL MUTATION AUDIT: PASS' -ForegroundColor Green
} finally {
    if ($Server -and -not $Server.HasExited) {
        Stop-Process -Id $Server.Id -Force -ErrorAction SilentlyContinue
    }
    for ($i = 0; $i -lt 30; $i++) {
        $Leftover = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
        if (-not $Leftover) { break }
        if ($Leftover.OwningProcess -ne $Server.Id) {
            throw "STOP: port 8000 changed ownership during H1. PID=$($Leftover.OwningProcess)"
        }
        Start-Sleep -Milliseconds 100
    }
}

Write-Host ''
Write-Host '=== FINAL GIT INTEGRITY ===' -ForegroundColor Cyan
$FinalHead = (git rev-parse HEAD).Trim()
if ($FinalHead -ne $Head) { throw "HEAD changed during H1: start=$Head final=$FinalHead" }
$FinalDirty = git status --porcelain
Assert-NativeSuccess 'final git status'
if ($FinalDirty) { $FinalDirty | Write-Host; throw 'H1 completed but worktree is dirty.' }
Write-Host "HEAD: $FinalHead"
Write-Host 'FINAL GIT INTEGRITY: PASS' -ForegroundColor Green
Write-Host 'DA1 H1-ONLY AUDIT COMPLETE' -ForegroundColor Green
