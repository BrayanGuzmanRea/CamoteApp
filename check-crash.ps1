# Ver logs de crash de la aplicación
$env:Path = $env:Path + ";$env:LOCALAPPDATA\Android\Sdk\platform-tools"

Write-Host "==================================" -ForegroundColor Red
Write-Host "Buscando errores de la aplicación" -ForegroundColor Red
Write-Host "==================================" -ForegroundColor Red
Write-Host ""
Write-Host "Abre la app en tu teléfono AHORA..." -ForegroundColor Yellow
Write-Host ""

# Ver todos los errores y crashes
adb logcat *:E | Select-String -Pattern "CamoteApp|ReactNative|AndroidRuntime"
