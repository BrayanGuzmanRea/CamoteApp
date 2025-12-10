@echo off
echo ====================================
echo Configurando ADB en el PATH
echo ====================================
echo.

REM Buscar la ruta del Android SDK
set SDK_PATH=%LOCALAPPDATA%\Android\Sdk

if not exist "%SDK_PATH%" (
    echo ERROR: No se encontro el Android SDK en %SDK_PATH%
    echo.
    echo Por favor, verifica que Android Studio este instalado correctamente.
    pause
    exit /b 1
)

echo Android SDK encontrado en: %SDK_PATH%
echo.

REM Agregar platform-tools al PATH del usuario
setx PATH "%PATH%;%SDK_PATH%\platform-tools"

echo.
echo ====================================
echo ADB configurado exitosamente!
echo ====================================
echo.
echo IMPORTANTE: Cierra esta ventana de PowerShell y abre una NUEVA
echo para que los cambios surtan efecto.
echo.
echo Luego ejecuta: npm run android
echo.
pause
