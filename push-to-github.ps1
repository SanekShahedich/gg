# Завантаження коду на https://github.com/SanekShahedich/gg
# Потрібен Git: https://git-scm.com/download/win

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Write-Host "Встановіть Git: https://git-scm.com/download/win" -ForegroundColor Red
  exit 1
}

if (-not (Test-Path .git)) {
  git init
  git branch -M main
}

git remote remove origin 2>$null
git remote add origin https://github.com/SanekShahedich/gg.git

git add .
git status

git commit -m "Anime Telegram bot: search, plans, multi-language" 2>$null
if ($LASTEXITCODE -ne 0) {
  git commit --allow-empty -m "Anime Telegram bot: search, plans, multi-language"
}

git pull origin main --allow-unrelated-histories --no-edit 2>$null
git push -u origin main
if ($LASTEXITCODE -ne 0) {
  Write-Host "Повтор з --force (замінить віддалений main)..." -ForegroundColor Yellow
  git push -u origin main --force
}

Write-Host "Готово: https://github.com/SanekShahedich/gg" -ForegroundColor Green
