# Script completo para solucionar problemas de conexión
$env:Path = $env:Path + ";$env:LOCALAPPDATA\Android\Sdk\platform-tools"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Solucionando problemas de conexion" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Verificando dispositivos..." -ForegroundColor Yellow
adb devices
Write-Host ""

Write-Host "2. Reiniciando servidor ADB..." -ForegroundColor Yellow
adb kill-server
Start-Sleep -Seconds 2
adb start-server
Start-Sleep -Seconds 2
Write-Host ""

Write-Host "3. Configurando port forwarding..." -ForegroundColor Yellow
adb reverse tcp:8081 tcp:8081
adb reverse tcp:8097 tcp:8097
Write-Host ""

Write-Host "4. Verificando configuracion..." -ForegroundColor Yellow
adb reverse --list
Write-Host ""

Write-Host "5. Reiniciando la app en el dispositivo..." -ForegroundColor Yellow
adb shell am force-stop com.camoteapp
Start-Sleep -Seconds 1
adb shell am start -n com.camoteapp/.MainActivity
Write-Host ""

Write-Host "==========================================" -ForegroundColor Green
Write-Host "Configuracion completada!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "La app deberia abrirse automaticamente" -ForegroundColor Yellow
Write-Host "Si ves la pantalla roja, presiona RELOAD (R, R)" -ForegroundColor Yellow
Write-Host ""
