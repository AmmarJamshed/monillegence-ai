import type {
  InstallConsent,
  InstallProgress,
  InstalledModel,
  RuntimeInstance,
  RuntimeType,
} from '@monillegence/shared';

export interface RuntimeAdapter {
  readonly type: RuntimeType;
  detect(): Promise<boolean>;
  getInstance(): RuntimeInstance | null;
  start(options?: { port?: number }): Promise<RuntimeInstance>;
  stop(): Promise<void>;
  healthCheck(): Promise<boolean>;
  listModels(): Promise<string[]>;
  pullModel(
    modelTag: string,
    onProgress?: (percent: number, message: string) => void
  ): Promise<void>;
  uninstallModel(modelTag: string): Promise<void>;
}

export interface RuntimeInstaller {
  readonly type: RuntimeType;
  isInstalled(): Promise<boolean>;
  install(
    onProgress: (progress: InstallProgress) => void,
    targetDir: string
  ): Promise<{ success: boolean; error?: string }>;
}

export interface RuntimeManagerEvents {
  'runtime:status': (instance: RuntimeInstance) => void;
  'install:progress': (progress: InstallProgress) => void;
  'model:progress': (modelId: string, percent: number, message: string) => void;
  'health:degraded': (instance: RuntimeInstance) => void;
}

export interface RuntimeManagerOptions {
  dataDir: string;
  preferredRuntime?: RuntimeType;
  maxRestartAttempts?: number;
}

export interface InstallRuntimeOptions {
  consent: InstallConsent;
  runtimeType: RuntimeType;
}

export type { RuntimeInstance, InstalledModel, InstallConsent };
