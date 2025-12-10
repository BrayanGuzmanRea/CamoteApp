# Script para instalar APK en dispositivo conectado
$env:Path = $env:Path + ";$env:LOCALAPPDATA\Android\Sdk\platform-tools"

Write-Host ""
Write-Host "Verificando dispositivos conectados..." -ForegroundColor Yellow
adb devices

Write-Host ""
Write-Host "Instalando APK..." -ForegroundColor Yellow
adb install -r android\app\build\outputs\apk\debug\app-debug.apk

Write-Host ""
Write-Host "Iniciando app..." -ForegroundColor Yellow
adb shell am start -n com.camoteapp/.MainActivity

Write-Host ""
Write-Host "App instalada e iniciada!" -ForegroundColor Green
