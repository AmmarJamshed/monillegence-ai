export type RuntimeType = 'ollama' | 'lmstudio' | 'llamacpp' | 'vllm';

export type RuntimeStatus =
  | 'stopped'
  | 'starting'
  | 'running'
  | 'error'
  | 'installing'
  | 'degraded';

export type ModelTier = 'small' | 'medium' | 'large';

export type AgentTaskType =
  | 'autocomplete'
  | 'quick_edit'
  | 'summary'
  | 'syntax_fix'
  | 'file_generation'
  | 'refactor'
  | 'debug'
  | 'architecture'
  | 'deployment'
  | 'devops'
  | 'chat';

export type TaskComplexity = 'trivial' | 'low' | 'medium' | 'high' | 'critical';

export type PermissionAction =
  | 'terminal_execute'
  | 'file_delete'
  | 'file_write'
  | 'deploy'
  | 'env_modify'
  | 'credential_access'
  | 'domain_connect';

export type PermissionStatus = 'pending' | 'approved' | 'denied' | 'expired';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type Locale = 'en' | 'ur';

export interface RuntimeInstance {
  id: string;
  type: RuntimeType;
  status: RuntimeStatus;
  baseUrl: string;
  apiPath: string;
  port: number;
  pid?: number;
  version?: string;
  lastHealthCheck?: string;
  errorMessage?: string;
}

export interface ModelDefinition {
  id: string;
  name: string;
  displayName: string;
  tier: ModelTier;
  family: string;
  sizeBytes: number;
  ramRequiredMb: number;
  vramRequiredMb?: number;
  quantizations: string[];
  tags: string[];
  ollamaTag?: string;
  hfRepo?: string;
  isStarter: boolean;
}

export interface InstalledModel {
  definitionId: string;
  runtimeType: RuntimeType;
  runtimeModelId: string;
  installedAt: string;
  sizeOnDiskBytes: number;
  status: 'ready' | 'downloading' | 'error';
  downloadProgress?: number;
}

export interface RoutingDecision {
  modelId: string;
  tier: ModelTier;
  reason: string;
  estimatedTokens: number;
  fallbackModelId?: string;
  confidence: number;
}

export interface AgentTask {
  id: string;
  type: AgentTaskType;
  prompt: string;
  context?: {
    files?: string[];
    workspaceRoot?: string;
    language?: string;
  };
  complexity: TaskComplexity;
  status:
    | 'pending'
    | 'running'
    | 'awaiting_approval'
    | 'completed'
    | 'failed';
  routing?: RoutingDecision;
  createdAt: string;
}

export interface PermissionRequest {
  id: string;
  action: PermissionAction;
  description: string;
  preview: string;
  riskLevel: RiskLevel;
  metadata: Record<string, unknown>;
  status: PermissionStatus;
  requestedAt: string;
  resolvedAt?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  actor: 'user' | 'agent' | 'system';
  permissionRequestId?: string;
  outcome: 'success' | 'failure' | 'denied';
  details: Record<string, unknown>;
}

export interface UserConfig {
  locale: Locale;
  theme: 'light' | 'dark' | 'system';
  preferredRuntime?: RuntimeType;
  autoStartRuntime: boolean;
  cpuFallbackMode: boolean;
  ramOptimizationMode: boolean;
  onboardingCompleted: boolean;
  legalDisclaimerAccepted: boolean;
  starterModelInstalled: boolean;
  region?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  modelId?: string;
  taskId?: string;
  timestamp: string;
  streaming?: boolean;
}

export interface InstallConsent {
  approved: boolean;
  runtimeType: RuntimeType;
  timestamp: string;
}

export interface InstallProgress {
  phase: 'download' | 'install' | 'configure' | 'model_pull';
  percent: number;
  message: string;
}

export interface HealthStatus {
  backend: 'ok' | 'error';
  runtime: RuntimeStatus;
  runtimeType?: RuntimeType;
  modelsReady: number;
  message?: string;
}

export type WsServerMessage =
  | { type: 'routing'; decision: RoutingDecision }
  | { type: 'token'; content: string }
  | { type: 'permission_request'; request: PermissionRequest }
  | { type: 'tool_call'; tool: string; args: Record<string, unknown> }
  | { type: 'install_progress'; progress: InstallProgress }
  | { type: 'runtime_status'; runtime: RuntimeInstance }
  | { type: 'build_status'; phase: 'generating' | 'writing' | 'installing' | 'validating' | 'done'; message: string }
  | {
      type: 'build_progress';
      elapsedSec: number;
      charsReceived: number;
      filesDetected: string[];
      currentFile?: string;
    }
  | { type: 'build_file'; path: string; status: 'generating' | 'written' | 'scaffolded' | 'done' }
  | {
      type: 'build_timeline';
      id: string;
      label: string;
      status: 'pending' | 'active' | 'done';
    }
  | {
      type: 'build_compute';
      cores: number;
      workers: number;
      activeTasks: number;
      strategy: string;
    }
  | { type: 'build_file_preview'; path: string; preview: string; status: string }
  | { type: 'files_written'; projectPath: string; files: string[] }
  | {
      type: 'build_complete';
      projectPath: string;
      files: string[];
      runCommand: string;
      valid: boolean;
      errors: string[];
      warnings: string[];
    }
  | { type: 'done'; messageId: string }
  | { type: 'error'; message: string; code?: string };

export type WsClientMessage = {
  type: 'chat';
  message: string;
  taskType?: AgentTaskType;
  context?: AgentTask['context'];
};
