# Monillegence AI — Localhost Communication Design

## Internal API Topology

```
Desktop (Electron)
    │
    │  ws://127.0.0.1:9477/agent          ← Agent WebSocket (streaming)
    │  http://127.0.0.1:9477/api/*        ← REST config/models/chat
    │
    ▼
Agent Backend (:9477)
    │
    │  In-process calls
    ▼
Runtime Manager + Model Router
    │
    │  HTTP OpenAI-compatible
    ▼
┌─────────────────┬─────────────────┬─────────────────┐
│ Ollama :11434   │ LM Studio :1234 │ llama.cpp :8080 │
│ /v1/chat/...    │ /v1/chat/...    │ /v1/chat/...    │
└─────────────────┴─────────────────┴─────────────────┘
```

## Port Allocation

| Service | Default Port | Env Override |
|---------|--------------|--------------|
| Agent Backend | 9477 | `MONILLEGENCE_AGENT_PORT` |
| Ollama | 11434 | `OLLAMA_HOST` |
| LM Studio | 1234 | `LMSTUDIO_PORT` |
| llama.cpp | 8080 | `LLAMACPP_PORT` |

## OpenAI-Compatible Client

All inference uses a unified client:

```typescript
const client = new OpenAI({
  baseURL: `${runtime.baseUrl}/v1`,
  apiKey: 'monillegence-local', // ignored by local runtimes
});

const stream = await client.chat.completions.create({
  model: routingDecision.modelId,
  messages,
  stream: true,
});
```

## REST Endpoints (Agent Backend)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Backend + runtime status |
| GET | `/api/runtimes` | List detected runtimes |
| POST | `/api/runtimes/install` | Trigger install (requires body consent flag) |
| POST | `/api/runtimes/start` | Start runtime |
| POST | `/api/runtimes/stop` | Stop runtime |
| GET | `/api/models` | Installed + catalog models |
| POST | `/api/models/pull` | Download model |
| DELETE | `/api/models/:id` | Uninstall model |
| GET | `/api/config` | User config |
| PATCH | `/api/config` | Update config |
| POST | `/api/chat` | Non-streaming chat (fallback) |
| GET | `/api/permissions/:id` | Permission request status |
| POST | `/api/permissions/:id/resolve` | Approve/deny |
| GET | `/api/audit` | Audit log (paginated) |

## WebSocket Events

See `agent-workflows.md` for message types.

## Reconnection Strategy

1. Desktop maintains WebSocket with exponential backoff (1s, 2s, 4s, max 30s).
2. Runtime Manager polls health every 10s.
3. On runtime crash: auto-restart up to 3 times, then surface error in UI.
4. In-flight streams: emit `error` with `code: RUNTIME_DISCONNECTED`, allow retry.

## IPC Bridge (Electron)

Preload exposes:

```typescript
window.monillegence = {
  getConfig: () => ipc.invoke('config:get'),
  onRuntimeStatus: (cb) => ipc.on('runtime:status', cb),
  approvePermission: (id, approved) => ipc.invoke('permission:resolve', id, approved),
};
```

Main process proxies to Agent Backend over localhost HTTP/WS — renderer never talks to Ollama directly.

## Offline Mode

When no network:

- Chat works if runtime + models are local.
- Model downloads queued until online.
- Catalog served from bundled `models-catalog.json`.
