#!/bin/sh
set -e
INSTALL_DIR="${HOME}/.local/share/Monillegence-AI"
REPO="https://github.com/AmmarJamshed/monillegence-ai.git"

echo ""
echo "  Monillegence AI — One-Click Installer"
echo "  ====================================="
echo ""

command -v node >/dev/null || { echo "Install Node.js from https://nodejs.org"; open "https://nodejs.org" 2>/dev/null || xdg-open "https://nodejs.org"; exit 1; }
command -v pnpm >/dev/null || npm install -g pnpm

if [ ! -f "$INSTALL_DIR/package.json" ]; then
  echo "  [*] Downloading Monillegence AI..."
  rm -rf "$INSTALL_DIR"
  git clone --depth 1 "$REPO" "$INSTALL_DIR"
else
  echo "  [*] Updating..."
  cd "$INSTALL_DIR" && git pull --ff-only
fi

cd "$INSTALL_DIR"
echo "  [*] Installing app..."
pnpm install
cp -n .env.example .env 2>/dev/null || true

pnpm --filter @monillegence/shared build
pnpm --filter @monillegence/runtime-manager build
pnpm --filter @monillegence/model-router build
pnpm --filter @monillegence/agent-backend build

if command -v ollama >/dev/null; then
  echo "  [*] Downloading AI model..."
  ollama pull qwen2.5-coder:7b
else
  echo "  [!] Install Ollama from https://ollama.com/download"
  open "https://ollama.com/download" 2>/dev/null || xdg-open "https://ollama.com/download"
fi

LAUNCHER="$HOME/Desktop/Start Monillegence AI.command"
cat > "$LAUNCHER" << 'EOF'
#!/bin/sh
cd "$HOME/.local/share/Monillegence-AI"
pnpm dev:backend &
sleep 6
pnpm dev:ui &
sleep 10
open http://localhost:5173 2>/dev/null || xdg-open http://localhost:5173
EOF
chmod +x "$LAUNCHER"

echo ""
echo "  DONE! Double-click 'Start Monillegence AI' on your Desktop."
echo ""
