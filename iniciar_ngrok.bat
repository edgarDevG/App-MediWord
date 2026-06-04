@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul
title MediWord HSM - Tunel ngrok

:: ── Configuración ────────────────────────────────────────────────
set NGROK=C:\ngrok\ngrok.exe
set BACKEND_PORT=8001
set FRONTEND_PORT=5174

echo.
echo  ====================================================
echo  MediWord HSM - Iniciando tuneles ngrok
echo  Backend : localhost:%BACKEND_PORT%
echo  Frontend: localhost:%FRONTEND_PORT%
echo  ====================================================
echo.

:: Verificar que ngrok existe
if not exist "%NGROK%" (
    echo [ERROR] No se encontro ngrok en %NGROK%
    echo Descarga ngrok desde https://ngrok.com/download
    echo y coloca ngrok.exe en C:\ngrok\
    pause & exit /b 1
)

:: Iniciar tunel del BACKEND en ventana separada
echo [1/2] Abriendo tunel para el backend (puerto %BACKEND_PORT%)...
start "ngrok - Backend MediWord" cmd /k "%NGROK% http %BACKEND_PORT% --log=stdout"

timeout /t 4 /nobreak >nul

echo.
echo  ====================================================
echo  PASOS FINALES:
echo.
echo  1. En la ventana "ngrok - Backend MediWord" busca:
echo     Forwarding https://XXXX.ngrok-free.app -> localhost:%BACKEND_PORT%
echo.
echo  2. Copia esa URL (https://XXXX.ngrok-free.app)
echo.
echo  3. En una terminal en frontend\react-v2\ ejecuta:
echo.
echo     set VITE_BACKEND_URL=https://XXXX.ngrok-free.app
echo     npm run dev
echo.
echo  4. Abre otro tunel para el frontend:
echo     C:\ngrok\ngrok.exe http %FRONTEND_PORT%
echo.
echo  5. Comparte la URL del frontend con tu equipo.
echo  ====================================================
echo.
pause
endlocal
