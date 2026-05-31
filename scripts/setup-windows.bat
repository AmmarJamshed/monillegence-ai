@echo off
echo.
echo  Monillegence AI - Setup Script (Windows)
echo  ========================================
echo.

where node >nul 2>&1 || (echo ERROR: Node.js not found. Install from https://nodejs.org && exit /b 1)
where pnpm >nul 2>&1 || (echo Installing pnpm... && npm install -g pnpm)

echo [1/4] Installing dependencies...
call pnpm install
if errorlevel 1 exit /b 1

if not exist .env copy .env.example .env

echo [2/4] Building packages...
call pnpm --filter @monillegence/shared build
call pnpm --filter @monillegence/runtime-manager build
call pnpm --filter @monillegence/model-router build
call pnpm --filter @monillegence/agent-backend build

echo [3/4] Checking Ollama...
where ollama >nul 2>&1 && (
  echo Ollama found. Pulling starter model if needed...
  ollama pull qwen2.5-coder:7b
) || (
  echo WARNING: Ollama not installed. Get it from https://ollama.com/download
)

echo.
echo [4/4] Setup complete!
echo.
echo  Start Monillegence AI:
echo    Terminal 1:  pnpm dev:backend
echo    Terminal 2:  pnpm dev:ui
echo    Browser:     http://localhost:5173
echo.
echo  See INSTALL.md for full instructions.
echo.
pause
