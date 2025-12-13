# Script para capturar logs detallados de crash
$env:Path = $env:Path + ";$env:LOCALAPPDATA\Android\Sdk\platform-tools"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Capturando logs de crash detallados" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Limpiando logs anteriores..." -ForegroundColor Yellow
adb logcat -c

Write-Host ""
Write-Host "Capturando logs en tiempo real..." -ForegroundColor Yellow
Write-Host "Reproduce el error ahora (presiona Ctrl+C cuando termine de crashear)" -ForegroundColor Yellow
Write-Host ""

# Capturar logs con filtros relevantes
adb logcat -v time *:E ReactNativeJS:V ReactNative:V AndroidRuntime:E
