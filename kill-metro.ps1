# Script para detener Metro Bundler
Write-Host ""
Write-Host "Deteniendo Metro Bundler..." -ForegroundColor Yellow

# Encontrar y matar procesos de Node que estén usando el puerto 8081
$processes = Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique

if ($processes) {
    foreach ($proc in $processes) {
        $process = Get-Process -Id $proc -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "Deteniendo proceso: $($process.ProcessName) (PID: $proc)" -ForegroundColor Yellow
            Stop-Process -Id $proc -Force
        }
    }
    Write-Host "Metro Bundler detenido exitosamente" -ForegroundColor Green
} else {
    Write-Host "No se encontro ningun Metro Bundler corriendo" -ForegroundColor Green
}

Write-Host ""
