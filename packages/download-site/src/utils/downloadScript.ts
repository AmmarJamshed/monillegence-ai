/** Trigger browser download of a text file (one-click installer scripts). */
export function downloadTextFile(filename: string, content: string, mime = 'text/plain') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function scriptPullModel(ollamaTag: string, platform: 'win' | 'unix') {
  if (platform === 'win') {
    return `@echo off\r\necho Pulling ${ollamaTag} via Ollama...\r\nollama pull ${ollamaTag}\r\nif errorlevel 1 pause\r\n`;
  }
  return `#!/bin/sh\necho "Pulling ${ollamaTag} via Ollama..."\nollama pull ${ollamaTag}\n`;
}

export function scriptPullAll(tags: string[], platform: 'win' | 'unix') {
  if (platform === 'win') {
    const pulls = tags.map((t) => `ollama pull ${t}`).join('\r\n');
    return `@echo off\r\necho Monillegence AI — pull all recommended models\r\nwhere ollama >nul 2>&1 || (echo Install Ollama from https://ollama.com/download && pause && exit /b 1)\r\n${pulls}\r\necho Done.\r\npause\r\n`;
  }
  const pulls = tags.map((t) => `ollama pull ${t}`).join('\n');
  return `#!/bin/sh\necho "Monillegence AI — pull all recommended models"\ncommand -v ollama >/dev/null || { echo "Install Ollama from https://ollama.com/download"; exit 1; }\n${pulls}\necho "Done."\n`;
}

export function scriptFullSetupWin() {
  return `@echo off
echo.
echo  Monillegence AI — Full one-click setup
echo  ======================================
echo.

where node >nul 2>&1 || (echo Install Node.js from https://nodejs.org && pause && exit /b 1)
where git >nul 2>&1 || (echo Install Git from https://git-scm.com && pause && exit /b 1)

set INSTALL_DIR=%USERPROFILE%\\Monillegence-AI
if not exist "%INSTALL_DIR%" (
  echo Cloning repository...
  git clone https://github.com/AmmarJamshed/monillegence-ai.git "%INSTALL_DIR%"
) else (
  echo Folder exists: %INSTALL_DIR%
)

cd /d "%INSTALL_DIR%"
call scripts\\setup-windows.bat
`;
}

export function detectPlatform(): 'win' | 'unix' {
  return navigator.platform.toLowerCase().includes('win') ? 'win' : 'unix';
}
