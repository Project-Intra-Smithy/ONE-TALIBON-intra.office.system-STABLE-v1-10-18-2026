$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $Root
$Host.UI.RawUI.WindowTitle = 'TALIBON — CONTROL'

function Stop-Listener([int] $Port) {
    Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
        ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
}

Stop-Listener 8000
Stop-Listener 5173
Remove-Item (Join-Path $Root 'public\hot') -Force -ErrorAction SilentlyContinue
Remove-Item (Join-Path $Root 'storage\framework\vite.hot') -Force -ErrorAction SilentlyContinue
Remove-Item (Join-Path $Root 'node_modules\.vite') -Recurse -Force -ErrorAction SilentlyContinue

Write-Host 'TALIBON DEV STACK STOPPED' -ForegroundColor Green
