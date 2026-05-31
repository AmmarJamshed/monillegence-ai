# Monillegence AI — System Architecture

> Pakistan's AI-native software engineering platform. Local-first, open-source powered.

## Overview

Monillegence AI is a desktop AI coding assistant built on Electron + Code-OSS principles. It routes coding tasks to locally running open-source models via OpenAI-compatible localhost APIs, with intelligent model selection based on task complexity.

## Layered Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Monillegence AI Desktop                       │
│  Electron Shell │ Code-OSS Workbench │ React UI │ Onboarding    │
└────────────────────────────┬────────────────────────────────────┘
                             │ IPC / WebSocket
┌────────────────────────────▼────────────────────────────────────┐
│                     Agent Backend (Node.js)                        │
│  Chat API │ Agent Workflows │ Permission Gate │ Audit Log         │
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ Model Router  │   │ Runtime Mgr   │   │ Model Manager │
│ Complexity    │   │ Health/Restart│   │ Download/VRAM │
│ Estimation    │   │ Auto-install  │   │ Catalog       │
└───────┬───────┘   └───────┬───────┘   └───────────────┘
        │                   │
        └─────────┬─────────┘
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│              Runtime Adapters (Plugin Architecture)              │
│   OllamaAdapter │ LMStudioAdapter │ LlamaCppAdapter │ vLLM (future)│
└────────────────────────────┬────────────────────────────────────┘
                             │ OpenAI-compatible HTTP
┌────────────────────────────▼────────────────────────────────────┐
│              localhost:11434 / :1234 / :8080                     │
│              Qwen2.5-Coder │ DeepSeek │ StarCoder2 │ ...          │
└─────────────────────────────────────────────────────────────────┘
```

## Design Principles

1. **Local-first** — Core chat, autocomplete, and file edits work offline after initial setup.
2. **Zero manual runtime setup** — App detects, installs (with consent), configures, and starts runtimes.
3. **OpenAI-compatible internal API** — All inference goes through a unified client abstraction.
4. **Safety by default** — Destructive actions require explicit user approval with audit trail.
5. **Modular adapters** — New runtimes (vLLM, llama.cpp server) plug in without core changes.

## Package Boundaries

| Package | Responsibility |
|---------|----------------|
| `@monillegence/shared` | Types, constants, i18n keys, event schemas |
| `@monillegence/runtime-manager` | Runtime detection, install, lifecycle, health |
| `@monillegence/model-router` | Task complexity analysis, model selection |
| `@monillegence/agent-backend` | HTTP/WebSocket server, agent workflows, permissions |
| `@monillegence/ui` | React components (chat, onboarding, model manager) |
| `@monillegence/desktop` | Electron main/preload, IPC bridge, app shell |

## Communication Patterns

- **Desktop ↔ Backend**: WebSocket for streaming chat; HTTP REST for config/models.
- **Backend ↔ Runtime Manager**: In-process (same Node process in dev; embedded in desktop prod).
- **Backend ↔ Models**: OpenAI SDK pointed at `http://127.0.0.1:{port}/v1`.

## Security Model

- All terminal commands, file deletes, deployments pass through `PermissionGate`.
- Audit log persisted to `%APPDATA%/MonillegenceAI/audit.jsonl`.
- Rollback stores file snapshots before agent edits (configurable depth).

## Pakistan Localization

- Bilingual UI (en / ur) via i18next.
- PKR pricing metadata in shared constants (future payment integration).
- Branding assets and onboarding copy tailored for Pakistani developers.

## Legal Disclaimer

Displayed on first launch and in settings:

> AI-generated code may contain bugs, vulnerabilities, or incorrect logic. Review outputs before production use.
