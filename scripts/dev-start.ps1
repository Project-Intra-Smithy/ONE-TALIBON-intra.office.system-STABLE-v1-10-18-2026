param(
    [switch] $Pull,
    [switch] $Fast,
    [switch] $ResetFrontendCache,
    [string] $LanHost = ''
)

$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $Root
$Host.UI.RawUI.WindowTitle = 'TALIBON — CONTROL'

function Stop-Listener([int] $Port) {
    Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
        ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
}

if ([string]::IsNullOrWhiteSpace($LanHost)) {
    $LanHost = Get-NetIPConfiguration |
        Where-Object { $_.IPv4DefaultGateway -and $_.NetAdapter.Status -eq 'Up' } |
        ForEach-Object { $_.IPv4Address.IPAddress } |
        Where-Object { $_ -and $_ -notlike '169.254.*' } |
        Select-Object -First 1
}
if ([string]::IsNullOrWhiteSpace($LanHost)) { throw 'Could not determine a LAN IPv4 address. Pass -LanHost <ip>.' }

$AppUrl = "http://$LanHost`:8000"
$ViteUrl = "http://$LanHost`:5173"
$HotFile = Join-Path $Root 'storage\framework\vite.hot'

Write-Host 'ONE TALIBON — CLEAN DEV START' -ForegroundColor Cyan
Write-Host "LAN: $LanHost"

Stop-Listener 8000
Stop-Listener 5173
Remove-Item (Join-Path $Root 'public\hot') -Force -ErrorAction SilentlyContinue
Remove-Item $HotFile -Force -ErrorAction SilentlyContinue
if ($ResetFrontendCache) {
    Write-Host 'Resetting Vite dependency cache by explicit request...' -ForegroundColor Yellow
    Remove-Item (Join-Path $Root 'node_modules\.vite') -Recurse -Force -ErrorAction SilentlyContinue
}
Remove-Item (Join-Path $Root '.phpunit.result.cache') -Force -ErrorAction SilentlyContinue

if ($Pull) {
    $dirty = git status --porcelain
    if ($dirty) { throw 'Working tree is dirty. Commit or stash before -Pull.' }
    git fetch origin --prune
    if ($LASTEXITCODE -ne 0) { throw 'git fetch failed.' }
    git pull --ff-only
    if ($LASTEXITCODE -ne 0) { throw 'git pull --ff-only failed.' }
}

if (-not (Test-Path (Join-Path $Root 'node_modules'))) { throw 'node_modules is missing. Run npm.cmd ci once.' }
if (-not (Test-Path (Join-Path $Root 'vendor\autoload.php'))) { throw 'vendor is missing. Run composer install once.' }
if ($Fast) {
    Write-Host 'FAST RENDER MODE — compiling current frontend assets and skipping Vite/HMR...' -ForegroundColor Cyan
    npm.cmd run build
    if ($LASTEXITCODE -ne 0) { throw 'npm build failed.' }
} elseif (-not (Test-Path (Join-Path $Root 'public\build\manifest.json'))) {
    Write-Host 'Production fallback missing; building once...' -ForegroundColor Yellow
    npm.cmd run build
    if ($LASTEXITCODE -ne 0) { throw 'npm build failed.' }
}

$env:APP_ENV = 'local'
$env:APP_DEBUG = 'true'
$env:APP_URL = $AppUrl
$env:VITE_DEV_HOST = '0.0.0.0'
$env:VITE_HMR_HOST = $LanHost
$env:VITE_PORT = '5173'

php artisan optimize:clear
if ($LASTEXITCODE -ne 0) { throw 'artisan optimize:clear failed.' }

Write-Host 'Checking PostgreSQL and migrations...' -ForegroundColor Cyan
php artisan migrate --force --no-interaction
if ($LASTEXITCODE -ne 0) {
    throw 'PostgreSQL or migration readiness failed. Browser was not opened.'
}
Write-Host 'PostgreSQL + migrations: ready' -ForegroundColor Green

Write-Host 'Checking prototype-day showcase seed readiness...' -ForegroundColor Cyan
$showcaseOutput = & php artisan tinker --execute="
    $emails = array_column(config('showcase.personas'), 'email');
    $active = \App\Models\User::query()->whereIn('email', $emails)->where('is_active', true)->count();
    $transaction = \App\Models\WorkflowTransaction::query()->where('title', 'Road Rehabilitation Funding Request')->exists();
    $memorandum = \App\Models\Memorandum::query()->where('status', 'published')->exists();
    $legislative = \App\Models\LegislativeRecord::query()->exists();
    $employee = \App\Models\User::query()->where('email', 'employee@talibon.demo')->with('employee.leaveCreditAccounts')->first();
    $leaveReady = $employee?->employee?->leaveCreditAccounts?->isNotEmpty() === true;
    if ($active !== 7 || !$transaction || !$memorandum || !$legislative || !$leaveReady) {
        throw new RuntimeException('Prototype-day seed preflight failed: personas='.$active.', transaction='.(int)$transaction.', memorandum='.(int)$memorandum.', legislative='.(int)$legislative.', leave='.(int)$leaveReady);
    }
    echo 'PROTOTYPE_DAY_SEED_READY personas='.$active.PHP_EOL;
" 2>&1
$showcaseExit = $LASTEXITCODE
$showcaseOutput | Write-Host
if ($showcaseExit -ne 0) {
    throw 'Prototype-day showcase data is incomplete. Seed the configured demo database before starting the stack.'
}
Write-Host 'Prototype-day showcase data: ready' -ForegroundColor Green

if ($Fast) {
    $LaravelLauncher = Join-Path $env:TEMP 'talibon-laravel-fast.ps1'
    @"
Set-Location '$Root'
`$Host.UI.RawUI.WindowTitle = 'TALIBON — FAST RENDER'
`$env:APP_ENV = 'local'
`$env:APP_DEBUG = 'true'
`$env:APP_URL = '$AppUrl'
php artisan serve --host=0.0.0.0 --port=8000
"@ | Set-Content -Path $LaravelLauncher -Encoding UTF8

    Start-Process powershell.exe -ArgumentList @('-NoExit', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $LaravelLauncher)

    $laravelReady = $false
    for ($i = 0; $i -lt 60; $i++) {
        try {
            $response = Invoke-WebRequest -Uri "$AppUrl/login" -UseBasicParsing -TimeoutSec 2
            if ($response.StatusCode -eq 200 -and $response.Content -notmatch '/@vite/client') {
                $laravelReady = $true
                break
            }
        } catch {}
        Start-Sleep -Milliseconds 500
    }
    if (-not $laravelReady) { throw 'Laravel production-asset health check failed. Browser was not opened.' }

    Write-Host 'FAST RENDER STACK READY' -ForegroundColor Green
    Write-Host "Laravel: $AppUrl"
    Write-Host 'Assets:  compiled Vite production bundle'
    Write-Host 'HMR:     disabled for this run'

    Add-Type -AssemblyName System.Windows.Forms
    $screens = [System.Windows.Forms.Screen]::AllScreens
    $screen = if ($screens.Count -gt 1) { $screens[1] } else { $screens[0] }
    $chrome = @(
        "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
        "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
        "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
    ) | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1

    if ($chrome) {
        $profile = Join-Path $env:LOCALAPPDATA 'TalibonDevChrome'
        Start-Process $chrome -ArgumentList @('--new-window', "--user-data-dir=$profile", "--window-position=$($screen.WorkingArea.X),$($screen.WorkingArea.Y)", "--window-size=$($screen.WorkingArea.Width),$($screen.WorkingArea.Height)", "$AppUrl/login")
    } else {
        Start-Process "$AppUrl/login"
    }

    exit 0
}

$ViteLauncher = Join-Path $env:TEMP 'talibon-vite.ps1'
@"
Set-Location '$Root'
`$Host.UI.RawUI.WindowTitle = 'TALIBON — VITE'
`$env:APP_ENV = 'local'
`$env:APP_DEBUG = 'true'
`$env:APP_URL = '$AppUrl'
`$env:VITE_DEV_HOST = '0.0.0.0'
`$env:VITE_HMR_HOST = '$LanHost'
`$env:VITE_PORT = '5173'
npm.cmd run dev
"@ | Set-Content -Path $ViteLauncher -Encoding UTF8

$LaravelLauncher = Join-Path $env:TEMP 'talibon-laravel.ps1'
@"
Set-Location '$Root'
`$Host.UI.RawUI.WindowTitle = 'TALIBON — LARAVEL'
`$env:APP_ENV = 'local'
`$env:APP_DEBUG = 'true'
`$env:APP_URL = '$AppUrl'
php artisan serve --host=0.0.0.0 --port=8000
"@ | Set-Content -Path $LaravelLauncher -Encoding UTF8

Start-Process powershell.exe -ArgumentList @('-NoExit', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $ViteLauncher)

$viteReady = $false
for ($i = 0; $i -lt 60; $i++) {
    if (Test-Path $HotFile) {
        $hotUrl = (Get-Content $HotFile -Raw).Trim()
        if ($hotUrl -eq $ViteUrl) {
            try {
                $response = Invoke-WebRequest -Uri "$ViteUrl/@vite/client" -UseBasicParsing -TimeoutSec 2
                if ($response.StatusCode -eq 200) { $viteReady = $true; break }
            } catch {}
        }
    }
    Start-Sleep -Milliseconds 500
}
if (-not $viteReady) {
    Remove-Item $HotFile -Force -ErrorAction SilentlyContinue
    throw 'Vite failed its health check. Laravel was not started, so no white-shell state was exposed.'
}

Start-Process powershell.exe -ArgumentList @('-NoExit', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $LaravelLauncher)

$laravelReady = $false
for ($i = 0; $i -lt 60; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "$AppUrl/login" -UseBasicParsing -TimeoutSec 2
        if ($response.StatusCode -eq 200 -and $response.Content -match [regex]::Escape($ViteUrl)) { $laravelReady = $true; break }
    } catch {}
    Start-Sleep -Milliseconds 500
}
if (-not $laravelReady) { throw 'Laravel/Vite integration failed its health check. Browser was not opened.' }

Write-Host 'DEV STACK READY' -ForegroundColor Green
Write-Host "Laravel: $AppUrl"
Write-Host "Vite:    $ViteUrl"
Write-Host "Hot:     $HotFile"

Add-Type -AssemblyName System.Windows.Forms
$screens = [System.Windows.Forms.Screen]::AllScreens
$screen = if ($screens.Count -gt 1) { $screens[1] } else { $screens[0] }
$chrome = @(
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
) | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1

if ($chrome) {
    $profile = Join-Path $env:LOCALAPPDATA 'TalibonDevChrome'
    Start-Process $chrome -ArgumentList @('--new-window', "--user-data-dir=$profile", "--window-position=$($screen.WorkingArea.X),$($screen.WorkingArea.Y)", "--window-size=$($screen.WorkingArea.Width),$($screen.WorkingArea.Height)", "$AppUrl/login")
} else {
    Start-Process "$AppUrl/login"
}
