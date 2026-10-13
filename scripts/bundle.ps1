# Copy latest accessibility.js + quiz.js + unilens.js into all frontends (no make).
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root
npm run bundle
