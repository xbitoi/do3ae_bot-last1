# Telegram Bot Studio - PowerShell Launcher
# Usage: Right-click -> Run with PowerShell

$Host.UI.RawUI.WindowTitle = "Telegram Bot Studio"

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "              Telegram Bot Studio               " -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
try {
    $nodeVersion = node --version 2>&1
    Write-Host "[✓] Node.js Version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please download and install Node.js from: https://nodejs.org/"
    Read-Host "Press Enter to exit"
    exit 1
}

# Install if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "[!] Dependencies are missing. Installing node packages..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Node package dependency installation failed!" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Load .env variables
if (Test-Path ".env") {
    Write-Host "[✓] Loading environment settings from .env..." -ForegroundColor Green
    Get-Content ".env" | ForEach-Object {
        if ($_ -match "^\s*([^#][^=]+)=(.+)$") {
            $key = $matches[1].Trim()
            $val = $matches[2].Trim()
            [System.Environment]::SetEnvironmentVariable($key, $val, "Process")
        }
    }
}

# Setup standard parameters
if (-not $env:PORT) { $env:PORT = "3000" }
$env:NODE_ENV = "production"

$port = $env:PORT
Write-Host "[✓] Active Port: $port" -ForegroundColor Green
Write-Host ""
Write-Host "[Progress] Starting the server..." -ForegroundColor Yellow
Write-Host "[•] Please open your browser: http://localhost:$port" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl + C to stop the application." -ForegroundColor Gray
Write-Host "================================================" -ForegroundColor DarkGray
Write-Host ""

# Open browser after 2 seconds automatically in background
Start-Job -ScriptBlock {
    param($p)
    Start-Sleep 2
    Start-Process "http://localhost:$p"
} -ArgumentList $port | Out-Null

# Run server with Node
node --enable-source-maps dist/index.mjs

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[ERROR] The server has terminated due to an error." -ForegroundColor Red
    Read-Host "Press Enter to exit"
}
