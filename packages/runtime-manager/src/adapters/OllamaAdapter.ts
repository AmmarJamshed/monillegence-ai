import { spawn, type ChildProcess } from 'node:child_process';
import { platform } from 'node:os';
import type { RuntimeInstance } from '@monillegence/shared';
import { RUNTIME_PORTS } from '@monillegence/shared';
import type { RuntimeAdapter } from '../types.js';

const OLLAMA_BASE = `http://127.0.0.1:${RUNTIME_PORTS.ollama}`;

export class OllamaAdapter implements RuntimeAdapter {
  readonly type = 'ollama' as const;
  private instance: RuntimeInstance | null = null;
  private process: ChildProcess | null = null;

  async detect(): Promise<boolean> {
    try {
      const res = await fetch(`${OLLAMA_BASE}/api/tags`, {
        signal: AbortSignal.timeout(2000),
      });
      return res.ok;
    } catch {
      return this.checkBinary();
    }
  }

  private async checkBinary(): Promise<boolean> {
    return new Promise((resolve) => {
      const cmd = platform() === 'win32' ? 'where' : 'which';
      const child = spawn(cmd, ['ollama'], { shell: true });
      child.on('close', (code) => resolve(code === 0));
      child.on('error', () => resolve(false));
    });
  }

  getInstance(): RuntimeInstance | null {
    return this.instance;
  }

  async start(options?: { port?: number }): Promise<RuntimeInstance> {
    const port = options?.port ?? RUNTIME_PORTS.ollama;
    const baseUrl = `http://127.0.0.1:${port}`;

    const healthy = await this.probeHealth(baseUrl);
    if (!healthy) {
      this.process = spawn('ollama', ['serve'], {
        detached: false,
        stdio: 'ignore',
        shell: platform() === 'win32',
        env: { ...process.env, OLLAMA_HOST: `127.0.0.1:${port}` },
      });
      await this.waitForHealth(baseUrl, 30000);
    }

    this.instance = {
      id: `ollama-${port}`,
      type: 'ollama',
      status: 'running',
      baseUrl,
      apiPath: '/v1',
      port,
      pid: this.process?.pid,
      lastHealthCheck: new Date().toISOString(),
    };
    return this.instance;
  }

  async stop(): Promise<void> {
    if (this.process) {
      this.process.kill('SIGTERM');
      this.process = null;
    }
    if (this.instance) {
      this.instance = { ...this.instance, status: 'stopped' };
    }
  }

  async healthCheck(): Promise<boolean> {
    if (!this.instance) return false;
    const ok = await this.probeHealth(this.instance.baseUrl);
    if (this.instance) {
      this.instance.lastHealthCheck = new Date().toISOString();
      this.instance.status = ok ? 'running' : 'degraded';
    }
    return ok;
  }

  async listModels(): Promise<string[]> {
    const base = this.instance?.baseUrl ?? OLLAMA_BASE;
    const res = await fetch(`${base}/api/tags`);
    if (!res.ok) return [];
    const data = (await res.json()) as { models?: { name: string }[] };
    return (data.models ?? []).map((m) => m.name);
  }

  async pullModel(
    modelTag: string,
    onProgress?: (percent: number, message: string) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn('ollama', ['pull', modelTag], {
        shell: platform() === 'win32',
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let lastPercent = 0;
      child.stdout?.on('data', (chunk: Buffer) => {
        const line = chunk.toString();
        const match = line.match(/(\d+)%/);
        if (match) {
          lastPercent = parseInt(match[1], 10);
          onProgress?.(lastPercent, line.trim());
        } else {
          onProgress?.(lastPercent, line.trim());
        }
      });

      child.on('close', (code) => {
        if (code === 0) {
          onProgress?.(100, 'Download complete');
          resolve();
        } else {
          reject(new Error(`ollama pull failed with code ${code}`));
        }
      });
      child.on('error', reject);
    });
  }

  async uninstallModel(modelTag: string): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const child = spawn('ollama', ['rm', modelTag], {
        shell: platform() === 'win32',
      });
      child.on('close', (code) =>
        code === 0 ? resolve() : reject(new Error(`ollama rm failed: ${code}`))
      );
      child.on('error', reject);
    });
  }

  private async probeHealth(baseUrl: string): Promise<boolean> {
    try {
      const res = await fetch(`${baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(3000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  private async waitForHealth(baseUrl: string, timeoutMs: number): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (await this.probeHealth(baseUrl)) return;
      await new Promise((r) => setTimeout(r, 500));
    }
    throw new Error('Ollama failed to start within timeout');
  }
}
