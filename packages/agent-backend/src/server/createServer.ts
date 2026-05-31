import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'node:http';
import {
  ChatRequestSchema,
  InstallRuntimeSchema,
  PullModelSchema,
  ResolvePermissionSchema,
  UpdateConfigSchema,
  MODEL_CATALOG,
  DEFAULT_AGENT_PORT,
  DEFAULT_AGENT_HOST,
  type WsServerMessage,
} from '@monillegence/shared';
import { ModelRouter } from '@monillegence/model-router';
import { RuntimeManager, getRuntimeDataDir } from '@monillegence/runtime-manager';
import { AuditLogger, PermissionGate } from '../permissions/PermissionGate.js';
import {
  CodingAgent,
} from '../agents/CodingAgent.js';
import {
  ConfigStore,
  createChatMessage,
} from '../agents/agentExports.js';

export interface AgentServerDeps {
  runtime: RuntimeManager;
  router: ModelRouter;
  agent: CodingAgent;
  permissions: PermissionGate;
  config: ConfigStore;
  audit: AuditLogger;
}

export function createApp(deps: AgentServerDeps): express.Application {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', async (_req, res) => {
    const runtime = deps.runtime.getActiveRuntime();
    const models = await deps.runtime.listModels().catch(() => []);
    res.json({
      backend: 'ok',
      runtime: runtime?.status ?? 'stopped',
      runtimeType: runtime?.type,
      modelsReady: models.length,
      message: runtime ? undefined : 'No local runtime detected',
    });
  });

  app.get('/api/runtimes', async (_req, res) => {
    const detected = await deps.runtime.detectRuntimes();
    res.json({ runtimes: detected, active: deps.runtime.getActiveRuntime() });
  });

  app.post('/api/runtimes/install', async (req, res) => {
    const parsed = InstallRuntimeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const result = await deps.runtime.installRuntime(
      parsed.data.runtimeType,
      { approved: true, runtimeType: parsed.data.runtimeType, timestamp: parsed.data.consent.timestamp }
    );
    res.json(result);
  });

  app.post('/api/runtimes/start', async (_req, res) => {
    try {
      const instance = await deps.runtime.ensureRuntime();
      res.json({ success: true, runtime: instance });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err instanceof Error ? err.message : 'Start failed',
      });
    }
  });

  app.post('/api/runtimes/stop', async (_req, res) => {
    await deps.runtime.stop();
    res.json({ success: true });
  });

  app.get('/api/models', async (_req, res) => {
    const installed = await deps.runtime.listModels().catch(() => []);
    res.json({ catalog: MODEL_CATALOG, installed });
  });

  app.post('/api/models/pull', async (req, res) => {
    const parsed = PullModelSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    try {
      await deps.runtime.pullModel(parsed.data.modelId);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Pull failed',
      });
    }
  });

  app.get('/api/config', (_req, res) => {
    res.json(deps.config.get());
  });

  app.patch('/api/config', async (req, res) => {
    const parsed = UpdateConfigSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const updated = await deps.config.save(parsed.data);
    res.json(updated);
  });

  app.post('/api/chat', async (req, res) => {
    const parsed = ChatRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    let content = '';
    for await (const event of deps.agent.streamChat(
      parsed.data.message,
      parsed.data.taskType,
      parsed.data.context
    )) {
      if (event.kind === 'token') content += event.content;
    }
    res.json({ message: createChatMessage('assistant', content) });
  });

  app.get('/api/permissions/:id', (req, res) => {
    const request = deps.permissions.getRequest(req.params.id);
    if (!request) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json(request);
  });

  app.post('/api/permissions/:id/resolve', async (req, res) => {
    const parsed = ResolvePermissionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const result = await deps.permissions.resolve(req.params.id, parsed.data.approved);
    if (!result) {
      res.status(404).json({ error: 'Not found or already resolved' });
      return;
    }
    res.json(result);
  });

  app.get('/api/audit', async (req, res) => {
    const limit = parseInt(String(req.query.limit ?? '100'), 10);
    const entries = await deps.audit.read(limit);
    res.json({ entries });
  });

  app.get('/api/workspace', (_req, res) => {
    res.json({ root: deps.agent.getWorkspaceRoot() });
  });

  return app;
}

export function attachWebSocket(server: Server, deps: AgentServerDeps): WebSocketServer {
  const wss = new WebSocketServer({ server, path: '/agent' });

  wss.on('connection', (ws: WebSocket) => {
    deps.runtime.onRuntimeStatus((runtime) => {
      send(ws, { type: 'runtime_status', runtime });
    });

    deps.runtime.onInstallProgress((progress) => {
      send(ws, { type: 'install_progress', progress });
    });

    ws.on('message', async (raw) => {
      try {
        const data = JSON.parse(raw.toString()) as {
          type: string;
          message?: string;
          taskType?: Parameters<CodingAgent['streamChat']>[1];
          context?: Parameters<CodingAgent['streamChat']>[2];
        };

        if (data.type !== 'chat' || !data.message) {
          send(ws, { type: 'error', message: 'Invalid message' });
          return;
        }

        const messageId = createChatMessage('assistant', '').id;

        for await (const event of deps.agent.streamChat(
          data.message,
          data.taskType ?? 'chat',
          data.context
        )) {
          if (event.kind === 'routing') {
            send(ws, { type: 'routing', decision: event.decision });
          } else if (event.kind === 'token') {
            send(ws, { type: 'token', content: event.content });
          } else if (event.kind === 'build_status') {
            send(ws, {
              type: 'build_status',
              phase: event.phase,
              message: event.message,
            });
          } else if (event.kind === 'build_progress') {
            send(ws, {
              type: 'build_progress',
              elapsedSec: event.elapsedSec,
              charsReceived: event.charsReceived,
              filesDetected: event.filesDetected,
              currentFile: event.currentFile,
            });
          } else if (event.kind === 'build_file') {
            send(ws, {
              type: 'build_file',
              path: event.path,
              status: event.status,
            });
            if (event.preview) {
              send(ws, {
                type: 'build_file_preview',
                path: event.path,
                preview: event.preview,
                status: event.status,
              });
            }
          } else if (event.kind === 'build_timeline') {
            send(ws, {
              type: 'build_timeline',
              id: event.id,
              label: event.label,
              status: event.status,
            });
          } else if (event.kind === 'build_compute') {
            send(ws, {
              type: 'build_compute',
              cores: event.cores,
              workers: event.workers,
              activeTasks: event.activeTasks,
              strategy: event.strategy,
            });
          } else if (event.kind === 'files_written') {
            send(ws, {
              type: 'files_written',
              projectPath: event.projectPath,
              files: event.files,
            });
          } else if (event.kind === 'build_complete') {
            send(ws, {
              type: 'build_complete',
              projectPath: event.projectPath,
              files: event.files,
              runCommand: event.runCommand,
              valid: event.valid,
              errors: event.errors,
              warnings: event.warnings,
            });
          } else if (event.kind === 'error') {
            send(ws, { type: 'error', message: event.message, code: 'INFERENCE_ERROR' });
            return;
          }
        }

        send(ws, { type: 'done', messageId });
      } catch (err) {
        send(ws, {
          type: 'error',
          message: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    });
  });

  return wss;
}

function send(ws: WebSocket, msg: WsServerMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

export async function bootstrapServer(): Promise<{
  app: express.Application;
  server: Server;
  deps: AgentServerDeps;
}> {
  if (process.env.MONILLEGENCE_AUTO_BUILD === undefined) {
    process.env.MONILLEGENCE_AUTO_BUILD = 'true';
  }

  const dataDir = getRuntimeDataDir();
  const audit = new AuditLogger(dataDir);
  await audit.init();

  const config = new ConfigStore(dataDir);
  await config.load();

  const runtime = new RuntimeManager({ dataDir });
  const router = new ModelRouter({ installedModels: [] });
  const permissions = new PermissionGate(audit);
  const agent = new CodingAgent(runtime, router, permissions);

  const deps: AgentServerDeps = { runtime, router, agent, permissions, config, audit };

  const app = createApp(deps);
  const port = parseInt(process.env.MONILLEGENCE_AGENT_PORT ?? String(DEFAULT_AGENT_PORT), 10);
  const host = process.env.MONILLEGENCE_AGENT_HOST ?? DEFAULT_AGENT_HOST;

  const server = app.listen(port, host, () => {
    console.log(`Monillegence Agent Backend → http://${host}:${port}`);
  });

  attachWebSocket(server, deps);

  void (async () => {
    if (!config.get().autoStartRuntime) return;
    try {
      await runtime.ensureRuntime();
      const models = await runtime.listModels();
      router.updateInstalled(models);
      if (!config.get().starterModelInstalled && models.length === 0) {
        await runtime.ensureStarterModel();
        await config.save({ starterModelInstalled: true });
      }
    } catch {
      /* runtime optional at boot */
    }
  })();

  return { app, server, deps };
}

export { DEFAULT_AGENT_PORT, DEFAULT_AGENT_HOST };
