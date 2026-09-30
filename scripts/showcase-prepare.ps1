$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $Root
. (Join-Path $PSScriptRoot 'showcase-common.ps1')

$Head = Get-GitHead
Write-Host 'ONE TALIBON — SHOWCASE PREPARE' -ForegroundColor Cyan
Write-Host "SHA: $Head"

Assert-CleanTrackedWorktree
if (-not (Test-Path (Join-Path $Root 'node_modules'))) { throw 'node_modules is missing. Run npm.cmd ci before showcase preparation.' }
if (-not (Test-Path (Join-Path $Root 'vendor\autoload.php'))) { throw 'vendor/autoload.php is missing. Run composer install before showcase preparation.' }
Assert-AppKeyExists
Set-ShowcaseEnvironment

$DbConfigCheck = @'
echo config('database.default').'|'.config('database.connections.pgsql.host').'|'.config('database.connections.pgsql.port').'|'.config('database.connections.pgsql.database').PHP_EOL;
'@
$dbConfigOutput = & php artisan tinker --execute="$DbConfigCheck" 2>&1
$dbConfigExit = $LASTEXITCODE
$dbConfigOutput | Write-Host
if ($dbConfigExit -ne 0) { throw 'Laravel database configuration check failed.' }
$expectedConfig = "pgsql|$Script:ShowcaseDbHost|$Script:ShowcaseDbPort|$Script:ShowcaseDatabase"
if (($dbConfigOutput -join "`n") -notmatch [regex]::Escape($expectedConfig)) {
    throw "Showcase database configuration mismatch. Expected $expectedConfig."
}

$DbConnectivityCheck = @'
$row = \Illuminate\Support\Facades\DB::connection()->selectOne('select current_database() as database');
echo $row->database.PHP_EOL;
'@
$dbOutput = & php artisan tinker --execute="$DbConnectivityCheck" 2>&1
$dbExit = $LASTEXITCODE
$dbOutput | Write-Host
if ($dbExit -ne 0 -or ($dbOutput -join "`n") -notmatch [regex]::Escape($Script:ShowcaseDatabase)) {
    throw "PostgreSQL connectivity failed or current database is not $Script:ShowcaseDatabase."
}
Write-Host "PostgreSQL: connected to $Script:ShowcaseDatabase on $Script:ShowcaseDbHost`:$Script:ShowcaseDbPort" -ForegroundColor Green

Remove-Item (Join-Path $Root 'public\hot') -Force -ErrorAction SilentlyContinue
Remove-Item (Join-Path $Root 'storage\framework\vite.hot') -Force -ErrorAction SilentlyContinue

Invoke-Checked 'Frontend typecheck' { npm.cmd run types:check }
Invoke-Checked 'Frontend production build' { npm.cmd run build }
$ManifestPath = Join-Path $Root 'public\build\manifest.json'
if (-not (Test-Path $ManifestPath)) { throw 'public/build/manifest.json was not produced.' }

Invoke-Checked 'Non-destructive migration readiness' { php artisan migrate --force --no-interaction }

# Keep showcase runtime variables in the process before Laravel optimization so cached config is showcase-safe.
Set-ShowcaseEnvironment
Invoke-Checked 'Laravel optimize:clear' { php artisan optimize:clear }
Invoke-Checked 'Laravel optimize' { php artisan optimize }
Invoke-Checked 'Laravel boot verification' { php artisan about }

$marker = [ordered]@{
    sha = $Head
    preparedAt = (Get-Date).ToUniversalTime().ToString('o')
    database = $Script:ShowcaseDatabase
    databaseHost = $Script:ShowcaseDbHost
    databasePort = [int] $Script:ShowcaseDbPort
    buildManifest = (Test-Path $ManifestPath)
    appEnv = 'showcase'
    appDebug = $false
    showcaseMode = $true
}
Write-AtomicJson $Script:PreparedStatePath $marker

Write-Host 'SHOWCASE PREPARED' -ForegroundColor Green
Write-Host "Prepared marker: $Script:PreparedStatePath"
Write-Host "SHA: $Head"
Write-Host "Database: $Script:ShowcaseDatabase"
Write-Host 'Build manifest: present'
