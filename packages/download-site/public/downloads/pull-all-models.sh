#!/bin/sh
echo "Monillegence AI — pull all recommended models"
command -v ollama >/dev/null || { echo "Install Ollama from https://ollama.com/download"; exit 1; }
ollama pull qwen2.5-coder:7b
ollama pull deepseek-coder-v2:16b-lite
ollama pull starcoder2:7b
ollama pull qwen2.5:14b
ollama pull deepseek-r1:8b
echo "Done."
