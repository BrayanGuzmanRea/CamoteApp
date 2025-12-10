# Script para iniciar Metro Bundler
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Iniciando Metro Bundler para CamoteApp" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "INSTRUCCIONES IMPORTANTES:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Asegurate de que tu dispositivo y PC esten en la MISMA RED WiFi" -ForegroundColor White
Write-Host "2. En el dispositivo, presiona 'RELOAD (R, R)'" -ForegroundColor White
Write-Host "3. Si no carga, sacude el telefono para abrir el menu de desarrollo" -ForegroundColor White
Write-Host "4. Selecciona 'Settings' y verifica la IP del Dev Server" -ForegroundColor White
Write-Host ""
Write-Host "Para detener el Metro Bundler, presiona Ctrl+C" -ForegroundColor Yellow
Write-Host ""

npm start
