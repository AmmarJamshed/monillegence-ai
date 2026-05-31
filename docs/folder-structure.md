# Monillegence AI — Folder Structure

```
D:\Monillegence-AI\
├── docs/                          # Architecture & design documents
│   ├── architecture.md
│   ├── folder-structure.md
│   ├── data-models.md
│   ├── runtime-lifecycle.md
│   ├── agent-workflows.md
│   ├── localhost-api.md
│   ├── onboarding-flow.md
│   └── runtime-installation.md
│
├── packages/
│   ├── shared/                    # @monillegence/shared
│   │   ├── src/
│   │   │   ├── types/             # Core TypeScript interfaces
│   │   │   ├── constants/         # Ports, model tiers, i18n
│   │   │   ├── schemas/           # Zod validation schemas
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── runtime-manager/           # @monillegence/runtime-manager
│   │   ├── src/
│   │   │   ├── adapters/          # Ollama, LM Studio, llama.cpp
│   │   │   ├── installer/         # Auto-install flows
│   │   │   ├── health/            # Health checks, restart logic
│   │   │   ├── model-download/    # Pull/download models
│   │   │   ├── RuntimeManager.ts  # Facade
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── model-router/              # @monillegence/model-router
│   │   ├── src/
│   │   │   ├── complexity/        # Task complexity estimator
│   │   │   ├── router/            # ModelRouter
│   │   │   ├── catalog/           # Model tier definitions
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── agent-backend/             # @monillegence/agent-backend
│   │   ├── src/
│   │   │   ├── server/            # Express + WebSocket
│   │   │   ├── agents/            # Coding, debug, deploy agents
│   │   │   ├── permissions/       # PermissionGate, audit
│   │   │   ├── tools/             # File, terminal, git tools
│   │   │   ├── workflows/         # LangGraph-style orchestration
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── ui/                        # @monillegence/ui
│   │   ├── src/
│   │   │   ├── components/        # Chat, ModelManager, Onboarding
│   │   │   ├── stores/            # Zustand stores
│   │   │   ├── hooks/
│   │   │   ├── i18n/              # en, ur locales
│   │   │   └── index.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── tailwind.config.js
│   │
│   └── desktop/                   # @monillegence/desktop
│       ├── src/
│       │   ├── main/              # Electron main process
│       │   ├── preload/           # Context bridge
│       │   └── renderer/          # React app entry
│       ├── resources/             # Icons, branding
│       ├── package.json
│       ├── tsconfig.json
│       └── electron-builder.yml
│
├── scripts/
│   ├── dev.mjs                    # Start all services
│   └── build.mjs
│
├── .env.example
├── .gitignore
├── package.json                   # Root workspace
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── README.md
```

## Runtime Data (User Machine)

```
%APPDATA%/MonillegenceAI/
├── config.json                    # User preferences, locale
├── audit.jsonl                    # Permission audit log
├── snapshots/                     # Rollback file snapshots
├── models/                        # Cached model metadata
└── logs/                          # Runtime logs
```
