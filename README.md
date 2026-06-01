# Monillegence AI

**Pakistan's AI-native software engineering platform** — build apps, utilities, and software locally with open-source AI. No cloud API required.

Monillegence AI is a local-first coding assistant (Cursor-style) that **actually builds runnable projects** — React apps, utilities, tools — and writes them to your machine.

## What you can build

- Web apps (React, Vite, Tailwind)
- Todo apps, dashboards, utilities
- Full project scaffolds with `npm install` + `npm run dev` ready
- Chat for coding help, debug, and refactor (local models)

## Download

### Download website (one-click)

Open the **download center** for software ZIP, setup scripts, and AI model downloads:

```bash
pnpm install
pnpm dev:website
```

Then visit **http://localhost:5180** — use **Download software**, **Download everything**, or per-model buttons.

Hosted copy (after GitHub Pages is enabled):  
**https://ammarjamshed.github.io/monillegence-ai/**

### Option 1 — Clone from GitHub (recommended)

```bash
git clone https://github.com/AmmarJamshed/monillegence-ai.git
cd monillegence-ai
```

### Option 2 — Download ZIP

1. Go to [github.com/AmmarJamshed/monillegence-ai](https://github.com/AmmarJamshed/monillegence-ai)
2. Click **Code → Download ZIP**
3. Extract and open the folder in terminal

## Requirements

| Requirement | Version | Notes |
|-------------|---------|-------|
| **Node.js** | 20+ | [nodejs.org](https://nodejs.org) |
| **pnpm** | 9+ | `npm install -g pnpm` |
| **Ollama** | Latest | [ollama.com](https://ollama.com) — runs AI models locally |
| **RAM** | 8 GB+ | 16 GB recommended for 7B models |
| **OS** | Windows 10/11, macOS, Linux | Windows is primary target |

## Quick start (5 minutes)

### 1. Install Ollama + model

```bash
# Install Ollama from https://ollama.com/download
# Then pull the starter coding model:
ollama pull qwen2.5-coder:7b
```

### 2. Install Monillegence AI

```bash
cd monillegence-ai
pnpm install
copy .env.example .env    # Windows
# cp .env.example .env    # macOS/Linux
```

### 3. Build core packages

```bash
pnpm --filter @monillegence/shared build
pnpm --filter @monillegence/runtime-manager build
pnpm --filter @monillegence/model-router build
pnpm --filter @monillegence/agent-backend build
```

### 4. Start the app

**Terminal 1 — Backend:**
```bash
pnpm dev:backend
```

**Terminal 2 — UI:**
```bash
pnpm dev:ui
```

Open **http://localhost:5173** in your browser.

### 5. Build your first app

In the chat, type:

```
Create a React todo app with Tailwind
```

Monillegence will:
1. Scaffold config files instantly
2. Generate a polished, usable UI
3. Write files to `%APPDATA%/MonillegenceAI/workspace/` (Windows) or `~/.monillegence-ai/workspace/`
4. Run `npm install` automatically

Then run your app:

```bash
cd "%APPDATA%\MonillegenceAI\workspace\react-todo-tailwind"
npm run dev
```

## Desktop app (optional)

```bash
pnpm --filter @monillegence/desktop dev
```

Requires backend + UI running first.

## Features

- **Local-first** — AI runs on your machine via Ollama (no cloud API keys)
- **Parallel build engine** — config files scaffold instantly; app code generates in parallel across CPU cores
- **Production UI templates** — todo, counter, and smiley apps ship with polished, understandable interfaces
- **Claude-style artifact panel** — live file tree, activity timeline, code preview while building
- **Intelligent model routing** — small/medium/large models by task complexity
- **English + Urdu** UI
- **Safety** — approval gates for destructive actions; audit log

## Architecture

```
Browser/Electron UI (:5173)
        ↓ WebSocket
Agent Backend (:9477)
        ↓
Runtime Manager → Ollama (:11434)
        ↓
Open-source models (Qwen2.5-Coder, etc.)
```

Full docs: [docs/architecture.md](./docs/architecture.md)

## Configuration

Copy `.env.example` to `.env`:

| Variable | Default | Description |
|----------|---------|-------------|
| `MONILLEGENCE_AGENT_PORT` | `9477` | Backend port |
| `MONILLEGENCE_AUTO_BUILD` | `true` | Auto-write project files |
| `MONILLEGENCE_PARALLEL_WORKERS` | half CPU cores | Parallel build workers |
| `MONILLEGENCE_DEFAULT_STARTER_MODEL` | `qwen2.5-coder:7b` | Ollama model |

## Project structure

```
monillegence-ai/
├── packages/
│   ├── agent-backend/    # API + build agent
│   ├── ui/               # React frontend
│   ├── download-site/    # Public download landing page
│   ├── desktop/          # Electron shell
│   ├── runtime-manager/  # Ollama/LM Studio
│   ├── model-router/     # AI routing
│   └── shared/           # Types & constants
├── docs/                 # Architecture docs
└── scripts/              # Dev scripts
```

## Troubleshooting

**"Backend unreachable"** — Run `pnpm dev:backend` and check http://127.0.0.1:9477/api/health

**"Local model unavailable"** — Ensure Ollama is running: `ollama serve` then `ollama list`

**Build stuck** — Hard refresh browser (Ctrl+Shift+R). Restart backend.

**Slow generation** — Use GPU if available; or set `MONILLEGENCE_PARALLEL_WORKERS=2`

## Legal disclaimer

> AI-generated code may contain bugs, vulnerabilities, or incorrect logic. Review outputs before production use.

## License

MIT — see [LICENSE](./LICENSE)

## Contributing

Pull requests welcome. See [docs/](./docs/) for architecture before large changes.

---

Built in Pakistan 🇵🇰 — *Pakistan's AI-native software engineering platform*
