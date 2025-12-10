# Script para instalación completamente limpia
$env:Path = $env:Path + ";$env:LOCALAPPDATA\Android\Sdk\platform-tools"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Instalacion Limpia de CamoteApp" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Desinstalando app antigua del dispositivo..." -ForegroundColor Yellow
adb uninstall com.camoteapp

Write-Host ""
Write-Host "2. Limpiando build de Android..." -ForegroundColor Yellow
cd android
.\gradlew clean
cd ..

Write-Host ""
Write-Host "3. Construyendo APK debug..." -ForegroundColor Yellow
cd android
.\gradlew assembleDebug --no-daemon
cd ..

Write-Host ""
Write-Host "4. Instalando app..." -ForegroundColor Yellow
adb install android\app\build\outputs\apk\debug\app-debug.apk

Write-Host ""
Write-Host "5. Iniciando app..." -ForegroundColor Yellow
adb shell am start -n com.camoteapp/.MainActivity

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Instalacion completada!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "La app deberia estar abierta en tu telefono" -ForegroundColor Yellow
Write-Host "Si se cierra, ejecuta: .\check-crash.ps1" -ForegroundColor Yellow
Write-Host "y abre la app manualmente para ver el error" -ForegroundColor Yellow
