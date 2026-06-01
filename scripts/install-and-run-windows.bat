@echo off
setlocal EnableDelayedExpansion
title Monillegence AI - Installing...
color 0A

set "INSTALL_DIR=%LOCALAPPDATA%\Monillegence-AI"
set "REPO=https://github.com/AmmarJamshed/monillegence-ai.git"
set "ZIP_URL=https://github.com/AmmarJamshed/monillegence-ai/archive/refs/heads/main.zip"

echo.
echo   Monillegence AI - One-Click Installer
echo   =====================================
echo.

where node >nul 2>&1 || (
  echo  [!] Node.js is required.
  start https://nodejs.org/
  echo  Install Node.js, then double-click this file again.
  pause
  exit /b 1
)

where pnpm >nul 2>&1 || (
  echo  [*] Setting up pnpm...
  call npm install -g pnpm
)

if not exist "%INSTALL_DIR%\package.json" (
  echo  [*] Downloading Monillegence AI...
  if exist "%INSTALL_DIR%" rmdir /s /q "%INSTALL_DIR%" 2>nul
  mkdir "%INSTALL_DIR%" 2>nul

  where git >nul 2>&1 && (
    git clone --depth 1 %REPO% "%INSTALL_DIR%"
  ) || (
    powershell -NoProfile -ExecutionPolicy Bypass -Command ^
      "$z='$env:TEMP\monil-ai.zip'; Invoke-WebRequest -Uri '%ZIP_URL%' -OutFile $z; Expand-Archive -Path $z -DestinationPath $env:TEMP -Force; $d=Get-ChildItem $env:TEMP -Directory -Filter 'monillegence-ai-*' | Select-Object -First 1; Move-Item $d.FullName '%INSTALL_DIR%' -Force; Remove-Item $z -Force"
  )
) else (
  echo  [*] Monillegence AI already installed. Updating...
  cd /d "%INSTALL_DIR%"
  where git >nul 2>&1 && git pull --ff-only 2>nul
)

cd /d "%INSTALL_DIR%"
if not exist package.json (
  echo  [X] Install failed. Check your internet connection.
  pause
  exit /b 1
)

echo  [*] Installing app (first time: 2-5 minutes)...
call pnpm install
if errorlevel 1 (
  echo  [X] Install failed.
  pause
  exit /b 1
)

if not exist .env copy .env.example .env >nul 2>&1

echo  [*] Preparing Monillegence AI...
call pnpm --filter @monillegence/shared build >nul 2>&1
call pnpm --filter @monillegence/runtime-manager build >nul 2>&1
call pnpm --filter @monillegence/model-router build >nul 2>&1
call pnpm --filter @monillegence/agent-backend build >nul 2>&1

where ollama >nul 2>&1 && (
  echo  [*] Downloading AI brain - qwen2.5-coder:7b - one time ~5 GB...
  ollama pull qwen2.5-coder:7b
) || (
  echo  [!] Ollama not installed - opening download page.
  echo      After Ollama is installed, run "Monillegence AI" on your Desktop again.
  start https://ollama.com/download
)

copy /Y "%INSTALL_DIR%\scripts\start-monillegence.bat" "%USERPROFILE%\Desktop\Monillegence AI.bat" >nul 2>&1

echo.
echo   =====================================
echo   DONE! Look on your Desktop for:
echo   "Monillegence AI.bat"
echo.
echo   Double-click it anytime to open the app.
echo   =====================================
echo.

choice /C YN /M "Start Monillegence AI now"
if errorlevel 2 goto :done
call "%INSTALL_DIR%\scripts\start-monillegence.bat"
:done
pause
