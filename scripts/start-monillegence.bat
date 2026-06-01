@echo off
title Monillegence AI
set "ROOT=%LOCALAPPDATA%\Monillegence-AI"

if not exist "%ROOT%\package.json" (
  echo  Monillegence AI is not installed yet.
  echo  Run the installer from the download page first.
  pause
  exit /b 1
)

cd /d "%ROOT%"
where pnpm >nul 2>&1 || call npm install -g pnpm

echo.
echo   Starting Monillegence AI...
echo.

powershell -NoProfile -Command "try { (Invoke-WebRequest -Uri 'http://127.0.0.1:9477/api/health' -UseBasicParsing -TimeoutSec 2).StatusCode } catch { exit 1 }" >nul 2>&1
if errorlevel 1 (
  start "Monillegence Backend" /MIN cmd /c "cd /d \"%ROOT%\" && pnpm dev:backend"
  timeout /t 8 /nobreak >nul
)

powershell -NoProfile -Command "try { (Invoke-WebRequest -Uri 'http://127.0.0.1:5173' -UseBasicParsing -TimeoutSec 2).StatusCode } catch { exit 1 }" >nul 2>&1
if errorlevel 1 (
  start "Monillegence UI" /MIN cmd /c "cd /d \"%ROOT%\" && pnpm dev:ui"
  timeout /t 12 /nobreak >nul
)

start "" http://localhost:5173

echo   Monillegence AI is open in your browser.
echo   Tip: Keep the two small terminal windows minimized - do not close them.
echo.
timeout /t 5
