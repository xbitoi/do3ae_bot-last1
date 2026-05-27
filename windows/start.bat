@echo off
setlocal enabledelayedexpansion
cls
echo ============================================================
echo                   Telegram Bot Studio
echo ============================================================
echo.

:: Double check if node_modules exists
if not exist "node_modules" (
    echo [!] Dependencies are missing. Launching install.bat first...
    echo.
    call install.bat
)

:: Clear screen again after installation if it occurred
cls
echo ============================================================
echo                   Telegram Bot Studio
echo ============================================================
echo.

:: Load .env lines if file exists
if exist ".env" (
    echo [✓] Loading configurations from .env...
    for /f "usebackq tokens=1,2 delims==" %%a in (".env") do (
        set "line=%%a"
        if not "!line:~0,1!"=="#" (
            if not "%%b"=="" (
                set "%%a=%%b"
            )
        )
    )
)

:: Set standard port if undefined
if "%PORT%"=="" set PORT=3000

echo [✓] Port Configured: %PORT%
echo.
echo [Progress] Starting the local workspace server...
echo [•] Open your server URL: http://localhost:%PORT%
echo.
echo Press [Ctrl + C] or close this window to stop the application.
echo ============================================================
echo.

set NODE_ENV=production
node --enable-source-maps dist/index.mjs

if errorlevel 1 (
    echo.
    echo [ERROR] The server stopped unexpectedly due to an error!
    echo.
    pause
)
