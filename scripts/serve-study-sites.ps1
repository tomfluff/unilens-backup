# Serve study mock sites without make. Run from anywhere:
#   .\scripts\serve-study-sites.ps1
#   .\scripts\serve-study-sites.ps1 study-wiki
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root
if (-not (Test-Path "node_modules\live-server")) {
    Write-Host "Run once: npm install" -ForegroundColor Yellow
    npm install
}
$site = $args[0]
if ($site) {
    npm run serve:study -- $site
} else {
    npm run serve:study
}
