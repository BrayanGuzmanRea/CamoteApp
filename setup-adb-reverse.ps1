# Script para configurar port forwarding de ADB
$env:Path = $env:Path + ";$env:LOCALAPPDATA\Android\Sdk\platform-tools"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Configurando conexion USB con Metro" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Verificando dispositivos conectados..." -ForegroundColor Yellow
adb devices

Write-Host ""
Write-Host "2. Configurando port forwarding (reverse)..." -ForegroundColor Yellow
adb reverse tcp:8081 tcp:8081

Write-Host ""
Write-Host "3. Verificando puertos configurados..." -ForegroundColor Yellow
adb reverse --list

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "Configuracion completada!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Ahora presiona RELOAD (R, R) en tu dispositivo" -ForegroundColor Yellow
Write-Host ""
