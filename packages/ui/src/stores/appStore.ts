import { create } from 'zustand';
import type {
  HealthStatus,
  InstallProgress,
  ModelDefinition,
  PermissionRequest,
  RoutingDecision,
  RuntimeInstance,
  UserConfig,
  WsServerMessage,
} from '@monillegence/shared';
import { DEFAULT_AGENT_HOST, DEFAULT_AGENT_PORT } from '@monillegence/shared';

const API_BASE = `http://${DEFAULT_AGENT_HOST}:${DEFAULT_AGENT_PORT}/api`;
const WS_URL = `ws://${DEFAULT_AGENT_HOST}:${DEFAULT_AGENT_PORT}/agent`;

export interface ChatEntry {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
}

interface AppState {
  config: UserConfig | null;
  health: HealthStatus | null;
  runtime: RuntimeInstance | null;
  catalog: ModelDefinition[];
  installedModels: string[];
  chat: ChatEntry[];
  onboardingStep: number;
  installProgress: InstallProgress | null;
  pendingPermission: PermissionRequest | null;
  lastRouting: RoutingDecision | null;
  buildStatus: string | null;
  lastProjectPath: string | null;
  lastRunCommand: string | null;
  buildValid: boolean | null;
  buildFiles: Array<{
    path: string;
    status: 'generating' | 'written' | 'scaffolded' | 'done' | 'pending';
  }>;
  buildTimeline: Array<{ id: string; label: string; status: 'pending' | 'active' | 'done' }>;
  buildCompute: {
    cores: number;
    workers: number;
    activeTasks: number;
    strategy: string;
  } | null;
  filePreviews: Record<string, string>;
  selectedBuildFile: string | null;
  buildElapsedSec: number;
  buildPhase: string | null;
  buildActive: boolean;
  setSelectedBuildFile: (path: string | null) => void;
  ws: WebSocket | null;
  isConnecting: boolean;

  loadConfig: () => Promise<void>;
  updateConfig: (partial: Partial<UserConfig>) => Promise<void>;
  fetchHealth: () => Promise<void>;
  fetchModels: () => Promise<void>;
  installRuntime: () => Promise<boolean>;
  startRuntime: () => Promise<boolean>;
  connectWs: () => void;
  sendChat: (message: string) => void;
  resolvePermission: (id: string, approved: boolean) => Promise<void>;
  setOnboardingStep: (step: number) => void;
  setLocale: (locale: 'en' | 'ur') => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  config: null,
  health: null,
  runtime: null,
  catalog: [],
  installedModels: [],
  chat: [],
  onboardingStep: 0,
  installProgress: null,
  pendingPermission: null,
  lastRouting: null,
  buildStatus: null,
  lastProjectPath: null,
  lastRunCommand: null,
  buildValid: null,
  buildFiles: [],
  buildTimeline: [],
  buildCompute: null,
  filePreviews: {},
  selectedBuildFile: null,
  buildElapsedSec: 0,
  buildPhase: null,
  buildActive: false,
  setSelectedBuildFile: (path) => set({ selectedBuildFile: path }),
  ws: null,
  isConnecting: false,

  loadConfig: async () => {
    const res = await fetch(`${API_BASE}/config`);
    const config = (await res.json()) as UserConfig;
    set({ config });
    if (config.onboardingCompleted) set({ onboardingStep: 99 });
  },

  updateConfig: async (partial) => {
    const res = await fetch(`${API_BASE}/config`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partial),
    });
    const config = (await res.json()) as UserConfig;
    set({ config });
  },

  fetchHealth: async () => {
    try {
      const res = await fetch(`${API_BASE}/health`);
      const health = (await res.json()) as HealthStatus;
      set({ health });
    } catch {
      set({
        health: {
          backend: 'error',
          runtime: 'stopped',
          modelsReady: 0,
          message: 'Backend unreachable',
        },
      });
    }
  },

  fetchModels: async () => {
    const res = await fetch(`${API_BASE}/models`);
    const data = (await res.json()) as {
      catalog: ModelDefinition[];
      installed: string[];
    };
    set({ catalog: data.catalog, installedModels: data.installed });
  },

  installRuntime: async () => {
    const res = await fetch(`${API_BASE}/runtimes/install`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        runtimeType: 'ollama',
        consent: { approved: true, timestamp: new Date().toISOString() },
      }),
    });
    const result = (await res.json()) as { success: boolean };
    return result.success;
  },

  startRuntime: async () => {
    const res = await fetch(`${API_BASE}/runtimes/start`, { method: 'POST' });
    const data = (await res.json()) as { success: boolean; runtime?: RuntimeInstance };
    if (data.runtime) set({ runtime: data.runtime });
    return data.success;
  },

  connectWs: () => {
    const existing = get().ws;
    if (existing?.readyState === WebSocket.OPEN) return;

    set({ isConnecting: true });
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => set({ isConnecting: false });
    ws.onclose = () => {
      set({ ws: null });
      setTimeout(() => get().connectWs(), 3000);
    };

    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data as string) as WsServerMessage;

      switch (msg.type) {
        case 'token': {
          const chat = [...get().chat];
          const last = chat[chat.length - 1];
          if (last?.role === 'assistant' && last.streaming) {
            last.content += msg.content ?? '';
            set({ chat: [...chat.slice(0, -1), last] });
          }
          break;
        }
        case 'routing':
          if (msg.decision) set({ lastRouting: msg.decision });
          break;
        case 'build_status':
          set({
            buildStatus: msg.message,
            buildPhase: msg.phase,
            buildActive: msg.phase !== 'done',
          });
          break;
        case 'build_progress':
          set({
            buildElapsedSec: msg.elapsedSec,
            buildStatus: msg.currentFile
              ? `Generating ${msg.currentFile}… (${msg.elapsedSec}s)`
              : `Generating project… (${msg.elapsedSec}s, ${msg.charsReceived.toLocaleString()} chars)`,
            buildActive: true,
            buildFiles: msg.filesDetected.map((path) => {
              const existing = get().buildFiles.find((f) => f.path === path);
              return existing ?? { path, status: 'generating' as const };
            }),
          });
          break;
        case 'build_file': {
          const files = [...get().buildFiles];
          const idx = files.findIndex((f) => f.path === msg.path);
          const status =
            msg.status === 'written'
              ? ('written' as const)
              : msg.status === 'done'
                ? ('done' as const)
                : msg.status === 'scaffolded'
                  ? ('scaffolded' as const)
                  : ('generating' as const);
          const entry = { path: msg.path, status };
          if (idx >= 0) files[idx] = entry;
          else files.push(entry);
          set({
            buildFiles: files,
            buildActive: true,
            selectedBuildFile: get().selectedBuildFile ?? msg.path,
          });
          break;
        }
        case 'build_file_preview': {
          const previews = { ...get().filePreviews, [msg.path]: msg.preview };
          set({
            filePreviews: previews,
            selectedBuildFile: get().selectedBuildFile ?? msg.path,
          });
          break;
        }
        case 'build_timeline': {
          const timeline = [...get().buildTimeline];
          const idx = timeline.findIndex((t) => t.id === msg.id);
          const entry = { id: msg.id, label: msg.label, status: msg.status };
          if (idx >= 0) timeline[idx] = entry;
          else timeline.push(entry);
          set({ buildTimeline: timeline, buildActive: true });
          break;
        }
        case 'build_compute':
          set({
            buildCompute: {
              cores: msg.cores,
              workers: msg.workers,
              activeTasks: msg.activeTasks,
              strategy: msg.strategy,
            },
            buildActive: true,
          });
          break;
        case 'files_written':
          set({
            lastProjectPath: msg.projectPath,
            buildStatus: `Writing ${msg.files.length} files...`,
          });
          break;
        case 'build_complete':
          set({
            lastProjectPath: msg.projectPath,
            lastRunCommand: msg.runCommand,
            buildValid: msg.valid,
            buildActive: false,
            buildPhase: 'done',
            buildStatus: msg.valid
              ? `✅ Built ${msg.files.length} files — ready to run`
              : `⚠️ Built with issues — see chat`,
            buildFiles: msg.files.map((path) => ({ path, status: 'written' as const })),
          });
          break;
        case 'install_progress':
          if (msg.progress) set({ installProgress: msg.progress });
          break;
        case 'runtime_status':
          if (msg.runtime) set({ runtime: msg.runtime });
          break;
        case 'permission_request':
          if (msg.request) set({ pendingPermission: msg.request });
          break;
        case 'done': {
          const chat = get().chat.map((c) =>
            c.streaming ? { ...c, streaming: false } : c
          );
          set({ chat });
          break;
        }
        case 'error': {
          const chat = get().chat.map((c, i, arr) => {
            const isStreamingAssistant =
              c.streaming &&
              c.role === 'assistant' &&
              i === arr.length - 1;
            if (isStreamingAssistant) {
              return {
                ...c,
                content: msg.message ?? 'Error',
                streaming: false,
              };
            }
            return c;
          });
          set({ chat });
          break;
        }
      }
    };

    set({ ws });
  },

  sendChat: (message) => {
    const looksLikeBuild =
      /\b(create|build|make|scaffold|generate)\b/i.test(message) &&
      /\b(app|application|project|website|site|todo|software)\b/i.test(message);

    const userEntry: ChatEntry = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message,
    };
    const assistantEntry: ChatEntry = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      streaming: true,
    };
    set({
      chat: [...get().chat, userEntry, assistantEntry],
      ...(looksLikeBuild
        ? {
            buildFiles: [],
            buildTimeline: [],
            buildCompute: null,
            filePreviews: {},
            selectedBuildFile: null,
            buildElapsedSec: 0,
            buildPhase: 'generating',
            buildActive: true,
            buildStatus: 'Starting parallel build…',
            buildValid: null,
            lastProjectPath: null,
            lastRunCommand: null,
          }
        : {}),
    });

    const ws = get().ws;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'chat', message, taskType: 'chat' }));
    } else {
      fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })
        .then((r) => r.json())
        .then((data: { message: { content: string } }) => {
          set({
            chat: get().chat.map((c) =>
              c.id === assistantEntry.id
                ? { ...c, content: data.message.content, streaming: false }
                : c
            ),
          });
        })
        .catch((err) => {
          set({
            chat: get().chat.map((c) =>
              c.id === assistantEntry.id
                ? {
                    ...c,
                    content: `Error: ${err instanceof Error ? err.message : 'Failed'}`,
                    streaming: false,
                  }
                : c
            ),
          });
        });
    }
  },

  resolvePermission: async (id, approved) => {
    await fetch(`${API_BASE}/permissions/${id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved }),
    });
    set({ pendingPermission: null });
  },

  setOnboardingStep: (step) => set({ onboardingStep: step }),

  setLocale: (locale) => {
    get().updateConfig({ locale });
    import('../i18n').then((m) => m.default.changeLanguage(locale));
  },
}));
