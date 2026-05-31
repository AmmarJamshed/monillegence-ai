import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { platform } from 'node:os';
import type { InstallProgress, RuntimeType } from '@monillegence/shared';
import type { RuntimeInstaller } from '../types.js';

const OLLAMA_WINDOWS_URL = 'https://ollama.com/download/OllamaSetup.exe';

export class OllamaInstaller implements RuntimeInstaller {
  readonly type = 'ollama' as const;

  async isInstalled(): Promise<boolean> {
    const { spawn } = await import('node:child_process');
    return new Promise((resolve) => {
      const cmd = platform() === 'win32' ? 'where' : 'which';
      const child = spawn(cmd, ['ollama'], { shell: true });
      child.on('close', (code) => resolve(code === 0));
      child.on('error', () => resolve(false));
    });
  }

  async install(
    onProgress: (progress: InstallProgress) => void,
    targetDir: string
  ): Promise<{ success: boolean; error?: string }> {
    await mkdir(targetDir, { recursive: true });

    onProgress({
      phase: 'download',
      percent: 0,
      message: 'Preparing Ollama installation...',
    });

    if (platform() === 'win32') {
      onProgress({
        phase: 'install',
        percent: 10,
        message: `Download Ollama from ${OLLAMA_WINDOWS_URL} and run the installer.`,
      });
      onProgress({
        phase: 'install',
        percent: 50,
        message:
          'After install, restart Monillegence AI. Ollama will be detected automatically.',
      });

      const installed = await this.isInstalled();
      if (installed) {
        onProgress({ phase: 'configure', percent: 100, message: 'Ollama ready.' });
        return { success: true };
      }

      return {
        success: false,
        error:
          'Ollama not detected. Please install from ollama.com/download then click Retry.',
      };
    }

    onProgress({
      phase: 'install',
      percent: 20,
      message: 'Run: curl -fsSL https://ollama.com/install.sh | sh',
    });

    const installed = await this.isInstalled();
    return installed
      ? { success: true }
      : {
          success: false,
          error: 'Install Ollama manually, then retry.',
        };
  }
}

export function getInstaller(type: RuntimeType): RuntimeInstaller | null {
  switch (type) {
    case 'ollama':
      return new OllamaInstaller();
    default:
      return null;
  }
}

export function getRuntimeDataDir(): string {
  const base =
    process.env.MONILLEGENCE_DATA_DIR ??
    (platform() === 'win32'
      ? join(process.env.APPDATA ?? '', 'MonillegenceAI')
      : join(process.env.HOME ?? '', '.monillegence-ai'));
  return base;
}
