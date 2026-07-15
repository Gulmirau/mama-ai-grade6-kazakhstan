$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$git = "C:\Users\gulmi\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe"
$node = "C:\Users\gulmi\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

Push-Location $projectRoot
try {
  & $node --check .\server.js
  & $node --check .\script.js
  & $node --check .\i18n.js
  & $node .\build-sites-worker.js
  & "$PSScriptRoot\build-public.ps1"

  & $git add index.html style.css script.js i18n.js server.js package.json README.md PRD.md .env.example .openai .github knowledge_base build-sites-worker.js dist scripts

  $status = & $git status --porcelain
  if ($status) {
    & $git commit -m "Update Mama AI public site"
  } else {
    Write-Host "No code changes to commit."
  }

  & $git push origin main
  Write-Host "Published changes to GitHub. GitHub Pages will update automatically after the workflow finishes."
} finally {
  Pop-Location
}
