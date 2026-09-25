param(
    [switch]$SkipMigration,
    [switch]$SkipPersonaCheck
)

$ErrorActionPreference = 'Stop'

function Assert-NativeSuccess {
    param([Parameter(Mandatory = $true)][string]$Label)

    if ($LASTEXITCODE -ne 0) {
        throw "$Label failed with exit code $LASTEXITCODE."
    }
}

Write-Host '=== ONE TALIBON — CURRENT PRODUCT VERIFICATION ===' -ForegroundColor Cyan
Write-Host "Working directory: $(Get-Location)"

$branchOutput = git branch --show-current
Assert-NativeSuccess 'git branch --show-current'
$currentBranch = ($branchOutput | Out-String).Trim()

$headOutput = git rev-parse HEAD
Assert-NativeSuccess 'git rev-parse HEAD'
$head = ($headOutput | Out-String).Trim()

Write-Host "Branch: $currentBranch"
Write-Host "HEAD:   $head"

Write-Host "`n=== Git Status ===" -ForegroundColor Cyan
$dirty = git status --porcelain
Assert-NativeSuccess 'git status --porcelain'
if ($dirty) {
    $dirty | Write-Host
    throw 'Verification requires a clean worktree. Preserve or commit local work before continuing.'
}
Write-Host 'Worktree: CLEAN' -ForegroundColor Green

if (-not $SkipMigration) {
    Write-Host "`n=== Additive Migration Readiness ===" -ForegroundColor Cyan
    Write-Host 'This verification never runs migrate:fresh. Use only the separately authorized disposable-database audit for destructive seeding.' -ForegroundColor Yellow
    php artisan migrate --force --no-interaction
    Assert-NativeSuccess 'php artisan migrate --force --no-interaction'
}

if (-not $SkipPersonaCheck) {
    Write-Host "`n=== Showcase Persona Readiness ===" -ForegroundColor Cyan
    $personaOutput = & php artisan tinker --execute="
        $emails = array_column(config('showcase.personas'), 'email');
        $count = AppModelsUser::query()->whereIn('email', $emails)->where('is_active', true)->count();
        echo 'SHOWCASE_PERSONAS='.$count.PHP_EOL;
        if ($count !== 7) { throw new RuntimeException('Expected seven active showcase personas; got '.$count); }
    " 2>&1
    $personaExit = $LASTEXITCODE
    $personaOutput | Write-Host
    if ($personaExit -ne 0) {
        throw 'Showcase persona readiness failed.'
    }
}

Write-Host "`n=== TypeScript ===" -ForegroundColor Cyan
npm.cmd run types:check
Assert-NativeSuccess 'npm.cmd run types:check'

Write-Host "`n=== Production Build ===" -ForegroundColor Cyan
npm.cmd run build
Assert-NativeSuccess 'npm.cmd run build'

Write-Host "`n=== Laravel Route Cache ===" -ForegroundColor Cyan
php artisan route:cache
Assert-NativeSuccess 'php artisan route:cache'

Write-Host "`n=== Laravel View Cache ===" -ForegroundColor Cyan
php artisan view:cache
Assert-NativeSuccess 'php artisan view:cache'

Write-Host "`n=== Feature Suite ===" -ForegroundColor Cyan
php artisan test --testsuite=Feature
Assert-NativeSuccess 'php artisan test --testsuite=Feature'

Write-Host "`n=== ONE TALIBON VERIFICATION COMPLETE ===" -ForegroundColor Green
Write-Host "Verified branch: $currentBranch"
Write-Host "Verified HEAD:   $head"
Write-Host 'This verifies migration/build/type/Feature gates only.'
Write-Host 'Prototype-day readiness still requires the DA1 browser, mutation, messaging, and presentation gates.'
