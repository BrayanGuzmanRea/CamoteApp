# Ver el error completo del crash
$env:Path = $env:Path + ";$env:LOCALAPPDATA\Android\Sdk\platform-tools"

Write-Host "==================================" -ForegroundColor Red
Write-Host "Mostrando ERROR COMPLETO" -ForegroundColor Red
Write-Host "==================================" -ForegroundColor Red
Write-Host ""
Write-Host "Limpiando logs anteriores..." -ForegroundColor Yellow
adb logcat -c

Write-Host ""
Write-Host "ABRE LA APP AHORA EN TU TELEFONO" -ForegroundColor Yellow
Write-Host ""
Write-Host "Esperando logs..." -ForegroundColor Cyan
Write-Host ""

# Capturar todo el crash
adb logcat AndroidRuntime:E ReactNativeJS:V ReactNative:V *:S
