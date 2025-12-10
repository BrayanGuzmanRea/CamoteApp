# Script para reinstalar y reconstruir completamente
$env:Path = $env:Path + ";$env:LOCALAPPDATA\Android\Sdk\platform-tools"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Reinstalacion COMPLETA con React Native 0.74" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Limpiando node_modules..." -ForegroundColor Yellow
Remove-Item -Path node_modules -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path package-lock.json -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "2. Instalando dependencias..." -ForegroundColor Yellow
npm install

Write-Host ""
Write-Host "3. Desinstalando app antigua..." -ForegroundColor Yellow
adb uninstall com.camoteapp

Write-Host ""
Write-Host "4. Limpiando build de Android..." -ForegroundColor Yellow
cd android
.\gradlew clean
cd ..

Write-Host ""
Write-Host "5. Construyendo APK..." -ForegroundColor Yellow
cd android
.\gradlew assembleDebug
cd ..

Write-Host ""
Write-Host "6. Instalando app..." -ForegroundColor Yellow
adb install android\app\build\outputs\apk\debug\app-debug.apk

Write-Host ""
Write-Host "7. Iniciando app..." -ForegroundColor Yellow
adb shell am start -n com.camoteapp/.MainActivity

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "Instalacion completada con RN 0.74!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Asegurate de que el metro bundler este corriendo (npm start)" -ForegroundColor Yellow
