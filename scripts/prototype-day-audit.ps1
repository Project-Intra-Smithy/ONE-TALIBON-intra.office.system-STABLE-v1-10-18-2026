param(
    [switch]$SkipDependencyInstall,
    [switch]$SkipPlaywrightInstall
)

$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $Root

function Assert-NativeSuccess {
    param([Parameter(Mandatory = $true)][string]$Label)
    if ($LASTEXITCODE -ne 0) {
        throw "$Label failed with exit code $LASTEXITCODE."
    }
}

function Get-DotEnvValue {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [string]$Default = ''
    )

    if (-not (Test-Path '.env')) { return $Default }

    $pattern = '^\s*' + [regex]::Escape($Name) + '='
    $line = Get-Content '.env' | Where-Object { $_ -match $pattern } | Select-Object -First 1
    if (-not $line) { return $Default }

    $value = ($line -replace $pattern, '').Trim()
    if ($value.Length -ge 2) {
        if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
            $value = $value.Substring(1, $value.Length - 2)
        }
    }
    return $value
}

function Ensure-Database {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][string]$Psql
    )

    $allowed = @('talibon_portal_test', 'talibon_h1_mutations')
    if ($allowed -notcontains $Name) {
        throw "Refusing database operation for unexpected database: $Name"
    }

    $exists = & $Psql -h $env:DB_HOST -p $env:DB_PORT -U $env:DB_USERNAME -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$Name';"
    Assert-NativeSuccess "psql lookup $Name"

    if (($exists | Out-String).Trim() -ne '1') {
        Write-Host "Creating dedicated audit database: $Name" -ForegroundColor Yellow
        & $Psql -h $env:DB_HOST -p $env:DB_PORT -U $env:DB_USERNAME -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE $Name;"
        Assert-NativeSuccess "create database $Name"
    }
}

function Reset-AuditDatabase {
    param([Parameter(Mandatory = $true)][string]$Name)

    $allowed = @('talibon_portal_test', 'talibon_h1_mutations')
    if ($allowed -notcontains $Name) {
        throw "Refusing migrate:fresh for unexpected database: $Name"
    }

    $env:DB_DATABASE = $Name
    Write-Host ""
    Write-Host "=== RESET DISPOSABLE DATABASE: $Name ===" -ForegroundColor Cyan

    php artisan optimize:clear
    Assert-NativeSuccess 'artisan optimize:clear'

    php artisan migrate:fresh --seed --force
    Assert-NativeSuccess "migrate:fresh --seed $Name"
}

function Assert-PrototypeSeed {
    Write-Host ""
    Write-Host '=== PROTOTYPE SEED CONTRACT ===' -ForegroundColor Cyan

    $code = @'
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

    $output = & php artisan tinker --execute=$code 2>&1
    $exit = $LASTEXITCODE
    $output | Write-Host
    if ($exit -ne 0) { throw 'Prototype seed contract failed.' }
}

function Get-AuditPortListener {
    return Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue |
        Select-Object -First 1
}

function Assert-AuditPortFree {
    $listener = Get-AuditPortListener
    if (-not $listener) { return }

    $pidValue = $listener.OwningProcess
    $process = Get-CimInstance Win32_Process -Filter "ProcessId = $pidValue" -ErrorAction SilentlyContinue
    $command = [string]$process.CommandLine
    throw "Port 8000 is already occupied before audit server startup. PID=$pidValue COMMAND=$command"
}

function Start-AuditServer {
    param([Parameter(Mandatory = $true)][string]$Label)

    $outLog = Join-Path $Root ("storage\logs\" + $Label + ".out.log")
    $errLog = Join-Path $Root ("storage\logs\" + $Label + ".err.log")
    New-Item -ItemType Directory -Force (Split-Path $outLog) | Out-Null
    Remove-Item $outLog -Force -ErrorAction SilentlyContinue
    Remove-Item $errLog -Force -ErrorAction SilentlyContinue
    Remove-Item (Join-Path $Root 'public\hot') -Force -ErrorAction SilentlyContinue
    Remove-Item (Join-Path $Root 'storage\framework\vite.hot') -Force -ErrorAction SilentlyContinue

    Assert-AuditPortFree

    $serverScript = Join-Path $Root 'vendor\laravel\framework\src\Illuminate\Foundation\resources\server.php'
    if (-not (Test-Path $serverScript)) {
        throw "Laravel built-in server router not found: $serverScript"
    }

    Write-Host "Runtime DB target: $env:DB_DATABASE" -ForegroundColor DarkGray

    # Directly own the PHP listener. Avoid artisan serve on Windows because its
    # cmd/php child can outlive the process handle and contaminate the next phase.
    $proc = Start-Process `
        -FilePath 'php' `
        -ArgumentList @('-S','127.0.0.1:8000',$serverScript) `
        -WorkingDirectory $Root `
        -RedirectStandardOutput $outLog `
        -RedirectStandardError $errLog `
        -PassThru `
        -WindowStyle Hidden

    for ($i = 0; $i -lt 60; $i++) {
        if ($proc.HasExited) {
            Get-Content $outLog -Tail 100 -ErrorAction SilentlyContinue
            Get-Content $errLog -Tail 100 -ErrorAction SilentlyContinue
            throw "Laravel audit server exited during $Label."
        }

        $listener = Get-AuditPortListener
        if ($listener -and $listener.OwningProcess -ne $proc.Id) {
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
            $other = Get-CimInstance Win32_Process -Filter "ProcessId = $($listener.OwningProcess)" -ErrorAction SilentlyContinue
            $otherCommand = [string]$other.CommandLine
            throw "Port 8000 listener does not belong to the current $Label server. PID=$($listener.OwningProcess) COMMAND=$otherCommand"
        }

        if ($listener -and $listener.OwningProcess -eq $proc.Id) {
            try {
                $response = Invoke-WebRequest -Uri 'http://127.0.0.1:8000/login' -UseBasicParsing -TimeoutSec 2
                if ($response.StatusCode -eq 200) {
                    return @{ Process = $proc; OutLog = $outLog; ErrLog = $errLog }
                }
            } catch {}
        }

        Start-Sleep -Milliseconds 500
    }

    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    Get-Content $outLog -Tail 100 -ErrorAction SilentlyContinue
    Get-Content $errLog -Tail 100 -ErrorAction SilentlyContinue
    throw "Laravel audit server did not become ready during $Label."
}

function Stop-AuditServer {
    param($Server)

    if ($Server -and $Server.Process -and -not $Server.Process.HasExited) {
        Stop-Process -Id $Server.Process.Id -Force -ErrorAction SilentlyContinue
    }

    for ($i = 0; $i -lt 30; $i++) {
        $listener = Get-AuditPortListener
        if (-not $listener) { return }
        if ($Server -and $Server.Process -and $listener.OwningProcess -ne $Server.Process.Id) {
            Write-Host "WARNING: port 8000 is owned by another process after audit stop. PID=$($listener.OwningProcess)" -ForegroundColor Yellow
            return
        }
        Start-Sleep -Milliseconds 100
    }

    $leftover = Get-AuditPortListener
    if ($leftover) {
        Write-Host "WARNING: audit server PID $($leftover.OwningProcess) still owns port 8000 after stop." -ForegroundColor Yellow
    }
}

Write-Host '=== ONE TALIBON — DA1 FULL PROTOTYPE-DAY AUDIT ===' -ForegroundColor Cyan

if (-not (Test-Path '.git')) { throw 'Run this script from the ONE TALIBON Git checkout.' }
if (-not (Test-Path '.env')) { throw 'Missing .env. Prepare a private local environment first.' }

$headOutput = git rev-parse HEAD
Assert-NativeSuccess 'git rev-parse HEAD'
$head = ($headOutput | Out-String).Trim()

$branchOutput = git branch --show-current
Assert-NativeSuccess 'git branch --show-current'
$branchName = ($branchOutput | Out-String).Trim()

if ([string]::IsNullOrWhiteSpace($branchName)) {
    $branchName = '(detached HEAD — expected for isolated audit worktree)'
}

Write-Host "Branch: $branchName"
Write-Host "HEAD:   $head"

$dirty = git status --porcelain
Assert-NativeSuccess 'git status --porcelain'
if ($dirty) {
    $dirty | Write-Host
    throw 'Audit requires a clean worktree.'
}

$demoPassword = Get-DotEnvValue 'PROTOTYPE_DEMO_PASSWORD'
if ([string]::IsNullOrWhiteSpace($demoPassword) -or $demoPassword.Length -lt 16) {
    throw 'Set a private PROTOTYPE_DEMO_PASSWORD with at least 16 characters in .env before DA1.'
}

$env:APP_ENV = 'testing'
$env:APP_DEBUG = 'false'
$env:APP_URL = 'http://127.0.0.1:8000'
$env:SHOWCASE_MODE = 'true'
$env:PROTOTYPE_DEMO_PASSWORD = $demoPassword
$env:SESSION_DRIVER = 'file'
$env:CACHE_STORE = 'file'
$env:QUEUE_CONNECTION = 'sync'
$env:DB_CONNECTION = Get-DotEnvValue 'DB_CONNECTION' 'pgsql'
$env:DB_HOST = Get-DotEnvValue 'DB_HOST' '127.0.0.1'
$env:DB_PORT = Get-DotEnvValue 'DB_PORT' '5432'
$env:DB_USERNAME = Get-DotEnvValue 'DB_USERNAME' 'postgres'
$env:DB_PASSWORD = Get-DotEnvValue 'DB_PASSWORD' ''
$env:PGPASSWORD = $env:DB_PASSWORD
$env:QA_BASE_URL = 'http://127.0.0.1:8000'
$env:QA_MODE = 'production'
$env:QA_DEMO_PASSWORD = $demoPassword
$env:QA_EXPECTED_SHA = $head
$env:QA_ENVIRONMENT = 'da1-local-clean-room'

$psqlCommand = Get-Command psql -ErrorAction SilentlyContinue
$psql = $null
if ($psqlCommand) { $psql = $psqlCommand.Source }
if (-not $psql) {
    $psql = Get-ChildItem 'C:\Program Files\PostgreSQL' -Filter psql.exe -Recurse -ErrorAction SilentlyContinue | Select-Object -ExpandProperty FullName -First 1
}
if (-not $psql) { throw 'psql.exe was not found. Install PostgreSQL client tools or add psql to PATH.' }

Ensure-Database 'talibon_portal_test' $psql
Ensure-Database 'talibon_h1_mutations' $psql

if (-not $SkipDependencyInstall) {
    Write-Host ""
    Write-Host '=== LOCKED DEPENDENCIES ===' -ForegroundColor Cyan
    composer install --no-interaction --prefer-dist --optimize-autoloader
    Assert-NativeSuccess 'composer install'
    npm.cmd ci --no-audit --no-fund
    Assert-NativeSuccess 'npm ci'
}

Write-Host ""
Write-Host '=== STATIC / BUILD GATES ===' -ForegroundColor Cyan
npm.cmd run types:check
Assert-NativeSuccess 'npm types:check'
npm.cmd run build
Assert-NativeSuccess 'npm build'

$chromeCandidates = @(
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "$env:ProgramFiles(x86)\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
) | Where-Object { $_ -and (Test-Path $_) }

$chrome = $chromeCandidates | Select-Object -First 1

if ($chrome) {
    $env:QA_BROWSER_EXECUTABLE_PATH = $chrome
    Write-Host ""
    Write-Host '=== BROWSER RUNTIME ===' -ForegroundColor Cyan
    Write-Host "Using installed Google Chrome: $chrome" -ForegroundColor Green
}
elseif (-not $SkipPlaywrightInstall) {
    Write-Host ""
    Write-Host '=== BROWSER RUNTIME ===' -ForegroundColor Cyan
    Write-Host 'Google Chrome not found; installing Playwright-managed Chromium.' -ForegroundColor Yellow
    npx.cmd playwright install chromium
    Assert-NativeSuccess 'playwright install chromium'
}
else {
    throw 'No installed Google Chrome found and -SkipPlaywrightInstall was supplied.'
}

Reset-AuditDatabase 'talibon_portal_test'
Assert-PrototypeSeed

Write-Host ""
Write-Host '=== CACHEABILITY ===' -ForegroundColor Cyan
php artisan route:cache
Assert-NativeSuccess 'route:cache'
php artisan view:cache
Assert-NativeSuccess 'view:cache'
php artisan config:cache
Assert-NativeSuccess 'config:cache'
php artisan optimize:clear
Assert-NativeSuccess 'optimize:clear'

Write-Host ""
Write-Host '=== FULL FEATURE SUITE ===' -ForegroundColor Cyan
$env:DB_DATABASE = 'talibon_portal_test'
php artisan test --testsuite=Feature
Assert-NativeSuccess 'Feature suite'

Reset-AuditDatabase 'talibon_portal_test'
Assert-PrototypeSeed

$server = $null
try {
    Write-Host ""
    Write-Host '=== V1 SHOWCASE BROWSER AUDIT ===' -ForegroundColor Cyan
    $server = Start-AuditServer 'da1-v1-runtime'
    node tests/Browser/v1-showcase-readiness.mjs
    Assert-NativeSuccess 'V1 showcase browser audit'

    Write-Host ""
    Write-Host '=== TWO-USER MESSAGES AUDIT ===' -ForegroundColor Cyan
    node tests/Browser/mp0-messaging-closure.mjs
    Assert-NativeSuccess 'MP0 two-user messaging audit'
}
finally {
    Stop-AuditServer $server
}

Reset-AuditDatabase 'talibon_h1_mutations'
Assert-PrototypeSeed

$server = $null
try {
    Write-Host ""
    Write-Host '=== H1 REAL MUTATION AUDIT ===' -ForegroundColor Cyan
    $env:DB_DATABASE = 'talibon_h1_mutations'
    $server = Start-AuditServer 'da1-h1-runtime'
    node tests/Browser/h1-mutation-readiness.mjs
    Assert-NativeSuccess 'H1 mutation audit'
}
finally {
    Stop-AuditServer $server
}

Write-Host ""
Write-Host '=== FINAL GIT INTEGRITY ===' -ForegroundColor Cyan
$finalHead = (git rev-parse HEAD).Trim()
Assert-NativeSuccess 'final git rev-parse HEAD'
if ($finalHead -ne $head) { throw "HEAD changed during audit: start=$head final=$finalHead" }

$finalDirty = git status --porcelain
Assert-NativeSuccess 'final git status'
if ($finalDirty) {
    $finalDirty | Write-Host
    throw 'Tracked worktree changed during audit.'
}

Write-Host ""
Write-Host '=== DA1 FULL AUDIT PASS ===' -ForegroundColor Green
Write-Host "Exact HEAD: $head"
Write-Host 'Evidence directory: storage\app\qa'
Write-Host 'Runtime logs: storage\logs\da1-*.log'
