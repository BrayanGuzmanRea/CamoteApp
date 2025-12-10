# Script para limpiar y reconstruir completamente la app
$env:Path = $env:Path + ";$env:LOCALAPPDATA\Android\Sdk\platform-tools"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Limpiando y Reconstruyendo CamoteApp" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Limpiando build de Android..." -ForegroundColor Yellow
cd android
.\gradlew clean
cd ..

Write-Host ""
Write-Host "2. Limpiando cache de npm..." -ForegroundColor Yellow
npm cache clean --force

Write-Host ""
Write-Host "3. Limpiando cache de Metro..." -ForegroundColor Yellow
Remove-Item -Path $env:TEMP\metro-* -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path $env:TEMP\haste-* -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "4. Reconstruyendo..." -ForegroundColor Yellow
cd android
.\gradlew assembleDebug
cd ..

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Reconstruccion completa!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Ahora ejecuta: .\run-android.ps1" -ForegroundColor Yellow
