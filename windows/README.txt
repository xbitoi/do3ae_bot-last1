==============================================================
           Telegram Bot Studio — Operation Guide
==============================================================

Requirements:
─────────────
• Windows 11
• Node.js 24 or newer → https://nodejs.org/
• FFmpeg (required for voice/video rendering processing) → https://ffmpeg.org/download.html
  - After downloading, add the 'bin' folder path to your system's PATH environment variable.

How to Run (First Time):
────────────────────────
1. Double-click on `install.bat`
2. Once packages are installed, double-click on `start.bat`
3. Open your browser and go to: http://localhost:3000
4. Go to "Advanced Settings" in the dashboard and add:
   - Telegram Bot Token (obtained from @BotFather)
   - Gemini AI API Key (obtained from Google AI Studio)

How to Run (Subsequent Times):
──────────────────────────────
• Double-click on `start.bat`
  OR
• Right-click on `start.ps1` and choose "Run with PowerShell"

How to Change Server Port:
──────────────────────────
Open the `.env` file and change:
  PORT=3000
to any port you prefer, for example:
  PORT=8080

Proxy Support:
──────────────
Open the `.env` file and add/uncomment your proxy variables:
  HTTPS_PROXY=http://user:password@proxy-host:port

Or for SOCKS5:
  SOCKS5_PROXY=socks5://proxy-host:port

The application automatically verifies internet connectivity:
  - Valid proxy detected and working -> Utilizes the proxy automatically
  - No proxy specified -> Connects directly
  - No connection available -> Reports network error gracefully

Important Files:
────────────────
  dist/          ← Compiled server and client assets
  .env           ← Environment configuration (PORT, PROXY, etc.)
  start.bat      ← Run application on Windows Command Prompt
  start.ps1      ← Run application on Windows PowerShell
  install.bat    ← Installs required node modules (run once)

==============================================================
