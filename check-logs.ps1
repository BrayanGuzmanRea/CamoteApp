# Script para ver los logs de React Native
$env:Path = $env:Path + ";$env:LOCALAPPDATA\Android\Sdk\platform-tools"

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Mostrando logs de la aplicación" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Presiona Ctrl+C para detener los logs" -ForegroundColor Yellow
Write-Host ""

# Filtrar solo los logs de nuestra app
adb logcat -s ReactNativeJS:V ReactNative:V CamoteApp:V
