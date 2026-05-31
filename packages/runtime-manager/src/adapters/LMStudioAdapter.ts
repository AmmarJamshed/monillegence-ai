import type { RuntimeInstance } from '@monillegence/shared';
import { RUNTIME_PORTS } from '@monillegence/shared';
import type { RuntimeAdapter } from '../types.js';

const LM_BASE = `http://127.0.0.1:${RUNTIME_PORTS.lmstudio}`;

/**
 * LM Studio adapter — uses OpenAI-compatible API on port 1234.
 * Headless llmster CLI integration is stubbed for auto-install path.
 */
export class LMStudioAdapter implements RuntimeAdapter {
  readonly type = 'lmstudio' as const;
  private instance: RuntimeInstance | null = null;

  async detect(): Promise<boolean> {
    try {
      const res = await fetch(`${LM_BASE}/v1/models`, {
        signal: AbortSignal.timeout(2000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  getInstance(): RuntimeInstance | null {
    return this.instance;
  }

  async start(options?: { port?: number }): Promise<RuntimeInstance> {
    const port = options?.port ?? RUNTIME_PORTS.lmstudio;
    const baseUrl = `http://127.0.0.1:${port}`;

    const healthy = await this.healthCheckAt(baseUrl);
    if (!healthy) {
      throw new Error(
        'LM Studio server not running. Start LM Studio or install via onboarding.'
      );
    }

    this.instance = {
      id: `lmstudio-${port}`,
      type: 'lmstudio',
      status: 'running',
      baseUrl,
      apiPath: '/v1',
      port,
      lastHealthCheck: new Date().toISOString(),
    };
    return this.instance;
  }

  async stop(): Promise<void> {
    if (this.instance) {
      this.instance = { ...this.instance, status: 'stopped' };
    }
  }

  async healthCheck(): Promise<boolean> {
    if (!this.instance) return this.detect();
    const ok = await this.healthCheckAt(this.instance.baseUrl);
    if (this.instance) {
      this.instance.status = ok ? 'running' : 'degraded';
      this.instance.lastHealthCheck = new Date().toISOString();
    }
    return ok;
  }

  async listModels(): Promise<string[]> {
    const base = this.instance?.baseUrl ?? LM_BASE;
    const res = await fetch(`${base}/v1/models`);
    if (!res.ok) return [];
    const data = (await res.json()) as { data?: { id: string }[] };
    return (data.data ?? []).map((m) => m.id);
  }

  async pullModel(
    _modelTag: string,
    onProgress?: (percent: number, message: string) => void
  ): Promise<void> {
    onProgress?.(
      0,
      'LM Studio models are managed in LM Studio UI. Use model manager to load.'
    );
    throw new Error('Use LM Studio app to download models');
  }

  async uninstallModel(_modelTag: string): Promise<void> {
    throw new Error('Uninstall via LM Studio');
  }

  private async healthCheckAt(baseUrl: string): Promise<boolean> {
    try {
      const res = await fetch(`${baseUrl}/v1/models`, {
        signal: AbortSignal.timeout(3000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}
