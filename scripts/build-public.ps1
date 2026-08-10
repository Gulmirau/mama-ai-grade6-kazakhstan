$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$workspaceRoot = Split-Path -Parent $projectRoot
$publicDir = Join-Path $workspaceRoot "mama_ai_public_static"
$zipPath = Join-Path $workspaceRoot "mama_ai_public_static.zip"

if (Test-Path -LiteralPath $publicDir) {
  Remove-Item -LiteralPath $publicDir -Recurse -Force
}

New-Item -ItemType Directory -Force -Path $publicDir | Out-Null

Copy-Item -LiteralPath `
  (Join-Path $projectRoot "index.html"), `
  (Join-Path $projectRoot "style.css"), `
  (Join-Path $projectRoot "script.js"), `
  (Join-Path $projectRoot "i18n.js"), `
  (Join-Path $projectRoot "official_textbooks.js") `
  -Destination $publicDir -Force

Set-Content -LiteralPath (Join-Path $publicDir "README_PUBLIC.txt") -Encoding UTF8 -Value @"
Mama AI public static package

Upload this folder or ZIP to Netlify Drop, Vercel, GitHub Pages, or another static hosting provider.

Important: this static package opens publicly, but server functions such as persistent analytics, OCR file storage, and OpenAI API calls require a backend deployment.
"@

if (Test-Path -LiteralPath $zipPath) {
  Remove-Item -LiteralPath $zipPath -Force
}

Compress-Archive -Path (Join-Path $publicDir "*") -DestinationPath $zipPath -Force

Write-Host "Public static folder: $publicDir"
Write-Host "Public static ZIP: $zipPath"
