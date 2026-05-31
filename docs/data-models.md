# Monillegence AI — Data Models

## Core Entities

### RuntimeInstance

Represents a local inference runtime (Ollama, LM Studio, etc.).

```typescript
interface RuntimeInstance {
  id: string;
  type: 'ollama' | 'lmstudio' | 'llamacpp' | 'vllm';
  status: 'stopped' | 'starting' | 'running' | 'error' | 'installing';
  baseUrl: string;           // e.g. http://127.0.0.1:11434
  apiPath: string;           // e.g. /v1 or /v1/chat/completions
  port: number;
  pid?: number;
  version?: string;
  lastHealthCheck?: string;  // ISO timestamp
  errorMessage?: string;
}
```

### ModelDefinition

Catalog entry for a downloadable/runnable model.

```typescript
interface ModelDefinition {
  id: string;
  name: string;
  displayName: string;
  tier: 'small' | 'medium' | 'large';
  family: string;              // qwen, deepseek, starcoder
  sizeBytes: number;
  ramRequiredMb: number;
  vramRequiredMb?: number;
  quantizations: string[];     // Q4_K_M, Q8_0, etc.
  tags: string[];              // coding, reasoning, chat
  ollamaTag?: string;          // qwen2.5-coder:7b
  hfRepo?: string;             // HuggingFace repo id
  isStarter: boolean;
}
```

### InstalledModel

User's locally available model.

```typescript
interface InstalledModel {
  definitionId: string;
  runtimeType: RuntimeType;
  runtimeModelId: string;    // name as seen by runtime
  installedAt: string;
  sizeOnDiskBytes: number;
  status: 'ready' | 'downloading' | 'error';
  downloadProgress?: number;   // 0-100
}
```

### RoutingDecision

Output of the model router.

```typescript
interface RoutingDecision {
  modelId: string;
  tier: ModelTier;
  reason: string;
  estimatedTokens: number;
  fallbackModelId?: string;
  confidence: number;        // 0-1
}
```

### AgentTask

A unit of work for the agent system.

```typescript
interface AgentTask {
  id: string;
  type: AgentTaskType;
  prompt: string;
  context?: {
    files?: string[];
    workspaceRoot?: string;
    language?: string;
  };
  complexity: TaskComplexity;
  status: 'pending' | 'running' | 'awaiting_approval' | 'completed' | 'failed';
  routing?: RoutingDecision;
  createdAt: string;
}
```

### PermissionRequest

Safety gate for dangerous operations.

```typescript
interface PermissionRequest {
  id: string;
  action: PermissionAction;
  description: string;
  preview: string;           // Human-readable preview
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  metadata: Record<string, unknown>;
  status: 'pending' | 'approved' | 'denied' | 'expired';
  requestedAt: string;
  resolvedAt?: string;
}
```

### AuditLogEntry

```typescript
interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  actor: 'user' | 'agent' | 'system';
  permissionRequestId?: string;
  outcome: 'success' | 'failure' | 'denied';
  details: Record<string, unknown>;
}
```

### UserConfig

```typescript
interface UserConfig {
  locale: 'en' | 'ur';
  theme: 'light' | 'dark' | 'system';
  preferredRuntime?: RuntimeType;
  autoStartRuntime: boolean;
  cpuFallbackMode: boolean;
  ramOptimizationMode: boolean;
  onboardingCompleted: boolean;
  legalDisclaimerAccepted: boolean;
  starterModelInstalled: boolean;
}
```

### ChatMessage

```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  modelId?: string;
  taskId?: string;
  timestamp: string;
  streaming?: boolean;
}
```

## Enums

```typescript
type RuntimeType = 'ollama' | 'lmstudio' | 'llamacpp' | 'vllm';
type ModelTier = 'small' | 'medium' | 'large';
type AgentTaskType =
  | 'autocomplete'
  | 'quick_edit'
  | 'file_generation'
  | 'refactor'
  | 'debug'
  | 'architecture'
  | 'deployment'
  | 'devops'
  | 'chat';
type TaskComplexity = 'trivial' | 'low' | 'medium' | 'high' | 'critical';
type PermissionAction =
  | 'terminal_execute'
  | 'file_delete'
  | 'file_write'
  | 'deploy'
  | 'env_modify'
  | 'credential_access'
  | 'domain_connect';
```
