import { EventEmitter } from 'eventemitter3';
import {
  DEFAULT_STARTER_MODEL,
  MODEL_CATALOG,
  type InstallConsent,
  type InstallProgress,
  type RuntimeInstance,
  type RuntimeType,
} from '@monillegence/shared';
import { LMStudioAdapter } from './adapters/LMStudioAdapter.js';
import { OllamaAdapter } from './adapters/OllamaAdapter.js';
import { getInstaller, getRuntimeDataDir } from './installer/OllamaInstaller.js';
import type {
  RuntimeAdapter,
  RuntimeManagerEvents,
  RuntimeManagerOptions,
} from './types.js';

export class RuntimeManager extends EventEmitter<RuntimeManagerEvents> {
  private adapters: Map<RuntimeType, RuntimeAdapter>;
  private activeAdapter: RuntimeAdapter | null = null;
  private healthInterval: ReturnType<typeof setInterval> | null = null;
  private restartAttempts = 0;
  private readonly options: Required<RuntimeManagerOptions>;

  constructor(options?: Partial<RuntimeManagerOptions>) {
    super();
    this.options = {
      dataDir: options?.dataDir ?? getRuntimeDataDir(),
      preferredRuntime: options?.preferredRuntime ?? 'ollama',
      maxRestartAttempts: options?.maxRestartAttempts ?? 3,
    };
    this.adapters = new Map<RuntimeType, RuntimeAdapter>([
      ['ollama', new OllamaAdapter()],
      ['lmstudio', new LMStudioAdapter()],
    ]);
  }

  async detectRuntimes(): Promise<RuntimeInstance[]> {
    const found: RuntimeInstance[] = [];
    for (const adapter of this.adapters.values()) {
      if (await adapter.detect()) {
        const inst = adapter.getInstance();
        if (inst) found.push(inst);
        else {
          try {
            const started = await adapter.start();
            found.push(started);
          } catch {
            /* not running */
          }
        }
      }
    }
    return found;
  }

  async ensureRuntime(): Promise<RuntimeInstance> {
    const preferred = this.options.preferredRuntime;
    const adapter = this.adapters.get(preferred) ?? this.adapters.get('ollama')!;
    this.activeAdapter = adapter;

    if (await adapter.detect()) {
      const existing = adapter.getInstance();
      if (existing?.status === 'running') {
        this.emitStatus(existing);
        return existing;
      }
    }

    const instance = await adapter.start();
    this.emitStatus(instance);
    this.startHealthMonitor();
    return instance;
  }

  async installRuntime(
    runtimeType: RuntimeType,
    consent: InstallConsent
  ): Promise<{ success: boolean; error?: string }> {
    if (!consent.approved) {
      return { success: false, error: 'User consent required' };
    }

    const installer = getInstaller(runtimeType);
    if (!installer) {
      return { success: false, error: `No installer for ${runtimeType}` };
    }

    const onProgress = (progress: InstallProgress) => {
      this.emit('install:progress', progress);
    };

    return installer.install(onProgress, this.options.dataDir);
  }

  async ensureStarterModel(): Promise<void> {
    const adapter = this.activeAdapter ?? this.adapters.get('ollama')!;
    await adapter.start();

    const models = await adapter.listModels();
    const starter = MODEL_CATALOG.find((m) => m.isStarter);
    const tag = starter?.ollamaTag ?? DEFAULT_STARTER_MODEL;

    if (models.some((m) => m.includes(tag.split(':')[0]))) {
      return;
    }

    await adapter.pullModel(tag, (percent, message) => {
      this.emit('model:progress', tag, percent, message);
    });
  }

  async pullModel(modelTag: string): Promise<void> {
    const adapter = this.activeAdapter ?? this.adapters.get('ollama')!;
    await adapter.pullModel(modelTag, (percent, message) => {
      this.emit('model:progress', modelTag, percent, message);
    });
  }

  async listModels(): Promise<string[]> {
    const adapter = this.activeAdapter ?? this.adapters.get('ollama')!;
    return adapter.listModels();
  }

  getActiveRuntime(): RuntimeInstance | null {
    return this.activeAdapter?.getInstance() ?? null;
  }

  onInstallProgress(handler: RuntimeManagerEvents['install:progress']): void {
    this.on('install:progress', handler);
  }

  onRuntimeStatus(handler: RuntimeManagerEvents['runtime:status']): void {
    this.on('runtime:status', handler);
  }

  getOpenAiBaseUrl(): string {
    const inst = this.getActiveRuntime();
    if (!inst) return 'http://127.0.0.1:11434/v1';
    return `${inst.baseUrl}${inst.apiPath}`;
  }

  async stop(): Promise<void> {
    if (this.healthInterval) {
      clearInterval(this.healthInterval);
      this.healthInterval = null;
    }
    await this.activeAdapter?.stop();
  }

  private startHealthMonitor(): void {
    if (this.healthInterval) return;
    this.healthInterval = setInterval(async () => {
      if (!this.activeAdapter) return;
      const ok = await this.activeAdapter.healthCheck();
      const inst = this.activeAdapter.getInstance();
      if (!inst) return;

      if (!ok) {
        this.emit('health:degraded', inst);
        if (this.restartAttempts < this.options.maxRestartAttempts) {
          this.restartAttempts++;
          try {
            await this.activeAdapter.start();
            this.restartAttempts = 0;
          } catch {
            /* retry next interval */
          }
        }
      } else {
        this.restartAttempts = 0;
      }
      this.emitStatus(inst);
    }, 10000);
  }

  private emitStatus(instance: RuntimeInstance): void {
    this.emit('runtime:status', instance);
  }
}
