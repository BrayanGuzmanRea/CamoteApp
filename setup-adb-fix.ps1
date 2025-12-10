# Script para configurar ADB en el PATH del sistema
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Configurando ADB en el PATH" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Ruta del Android SDK
$sdkPath = "$env:LOCALAPPDATA\Android\Sdk\platform-tools"

# Verificar que existe
if (!(Test-Path $sdkPath)) {
    Write-Host "ERROR: No se encontro el Android SDK en $sdkPath" -ForegroundColor Red
    Write-Host ""
    Write-Host "Por favor, verifica que Android Studio este instalado correctamente." -ForegroundColor Yellow
    Read-Host "Presiona Enter para salir"
    exit 1
}

Write-Host "Android SDK encontrado en: $sdkPath" -ForegroundColor Green
Write-Host ""

# Obtener el PATH actual del usuario
$userPath = [Environment]::GetEnvironmentVariable("Path", [EnvironmentVariableTarget]::User)

# Verificar si ya está en el PATH
if ($userPath -like "*$sdkPath*") {
    Write-Host "ADB ya esta en el PATH del usuario!" -ForegroundColor Yellow
} else {
    # Agregar al PATH del usuario
    $newPath = $userPath + ";" + $sdkPath
    [Environment]::SetEnvironmentVariable("Path", $newPath, [EnvironmentVariableTarget]::User)
    Write-Host "ADB agregado al PATH del usuario exitosamente!" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Configuracion completada!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANTE:" -ForegroundColor Yellow
Write-Host "1. Cierra COMPLETAMENTE todas las ventanas de PowerShell" -ForegroundColor White
Write-Host "2. Cierra COMPLETAMENTE todas las ventanas de Git Bash" -ForegroundColor White
Write-Host "3. Abre una NUEVA ventana de PowerShell" -ForegroundColor White
Write-Host "4. Ejecuta: npm run android" -ForegroundColor White
Write-Host ""
Write-Host "Para verificar que funciona, ejecuta en la nueva ventana:" -ForegroundColor Cyan
Write-Host "  adb version" -ForegroundColor White
Write-Host ""

Read-Host "Presiona Enter para cerrar"
