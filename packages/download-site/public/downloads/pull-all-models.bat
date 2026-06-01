@echo off
echo Monillegence AI — pull all recommended models
where ollama >nul 2>&1 || (echo Install Ollama from https://ollama.com/download && pause && exit /b 1)
ollama pull qwen2.5-coder:7b
ollama pull deepseek-coder-v2:16b-lite
ollama pull starcoder2:7b
ollama pull qwen2.5:14b
ollama pull deepseek-r1:8b
echo Done.
pause
