# Script para ejecutar npm run android con ADB configurado
$env:Path = $env:Path + ";$env:LOCALAPPDATA\Android\Sdk\platform-tools"

Write-Host "Ejecutando: npm run android" -ForegroundColor Cyan
Write-Host ""

npm run android
