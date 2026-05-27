@echo off
cls
echo ============================================================
echo           Telegram Bot Studio - Installation Wizard
echo ============================================================
echo.

:: Check Node.js installation
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed!
    echo Please download and install Node.js from: https://nodejs.org/
    echo Minimum version recommended: v24.0.0
    echo.
    pause
    exit /b 1
)

for /f "tokens=1" %%v in ('node --version') do set NODE_VER=%%v
echo [✓] Found Node.js: %NODE_VER%

:: Install dependencies
echo.
echo [Progress] Installing node packages, please wait...
npm install
if errorlevel 1 (
    echo.
    echo [ERROR] Package installation failed!
    pause
    exit /b 1
)

:: Creating environment file
if not exist ".env" (
    copy ".env.example" ".env" >nul
    echo [✓] Created .env configuration file. You can edit it to set a Port or Proxy.
)

echo.
echo ============================================================
echo [✓] Installation completed successfully!
echo.
echo To launch the app, double-click on: start.bat
echo ============================================================
echo.
pause
