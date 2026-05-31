import type { ModelDefinition, UserConfig } from '../types/index.js';

export const APP_NAME = 'Monillegence AI';
export const APP_TAGLINE = "Pakistan's AI-native software engineering platform";
export const LEGAL_DISCLAIMER =
  'AI-generated code may contain bugs, vulnerabilities, or incorrect logic. Review outputs before production use.';

export const DEFAULT_AGENT_PORT = 9477;
export const DEFAULT_AGENT_HOST = '127.0.0.1';

export const RUNTIME_PORTS: Record<string, number> = {
  ollama: 11434,
  lmstudio: 1234,
  llamacpp: 8080,
};

export const DEFAULT_STARTER_MODEL = 'qwen2.5-coder:7b';

export const DEFAULT_USER_CONFIG: UserConfig = {
  locale: 'en',
  theme: 'system',
  autoStartRuntime: true,
  cpuFallbackMode: false,
  ramOptimizationMode: false,
  onboardingCompleted: false,
  legalDisclaimerAccepted: false,
  starterModelInstalled: false,
  region: 'PK',
};

export const MODEL_CATALOG: ModelDefinition[] = [
  {
    id: 'qwen2.5-coder-7b',
    name: 'qwen2.5-coder:7b',
    displayName: 'Qwen2.5 Coder 7B',
    tier: 'medium',
    family: 'qwen',
    sizeBytes: 4_700_000_000,
    ramRequiredMb: 8192,
    vramRequiredMb: 6144,
    quantizations: ['Q4_K_M', 'Q8_0'],
    tags: ['coding', 'chat'],
    ollamaTag: 'qwen2.5-coder:7b',
    hfRepo: 'Qwen/Qwen2.5-Coder-7B-Instruct',
    isStarter: true,
  },
  {
    id: 'deepseek-coder-v2-lite',
    name: 'deepseek-coder-v2:16b-lite',
    displayName: 'DeepSeek Coder V2 Lite',
    tier: 'medium',
    family: 'deepseek',
    sizeBytes: 9_000_000_000,
    ramRequiredMb: 12288,
    vramRequiredMb: 8192,
    quantizations: ['Q4_K_M'],
    tags: ['coding'],
    ollamaTag: 'deepseek-coder-v2:16b-lite',
    isStarter: false,
  },
  {
    id: 'starcoder2-7b',
    name: 'starcoder2:7b',
    displayName: 'StarCoder2 7B',
    tier: 'small',
    family: 'starcoder',
    sizeBytes: 4_000_000_000,
    ramRequiredMb: 8192,
    vramRequiredMb: 4096,
    quantizations: ['Q4_K_M'],
    tags: ['coding', 'autocomplete'],
    ollamaTag: 'starcoder2:7b',
    isStarter: false,
  },
  {
    id: 'qwen2.5-14b',
    name: 'qwen2.5:14b',
    displayName: 'Qwen2.5 14B',
    tier: 'large',
    family: 'qwen',
    sizeBytes: 9_000_000_000,
    ramRequiredMb: 16384,
    vramRequiredMb: 10240,
    quantizations: ['Q4_K_M'],
    tags: ['reasoning', 'chat', 'architecture'],
    ollamaTag: 'qwen2.5:14b',
    isStarter: false,
  },
  {
    id: 'deepseek-r1-8b',
    name: 'deepseek-r1:8b',
    displayName: 'DeepSeek R1 8B',
    tier: 'large',
    family: 'deepseek',
    sizeBytes: 5_200_000_000,
    ramRequiredMb: 12288,
    vramRequiredMb: 8192,
    quantizations: ['Q4_K_M'],
    tags: ['reasoning', 'debug'],
    ollamaTag: 'deepseek-r1:8b',
    isStarter: false,
  },
];

export const PKR_PRICING_PLACEHOLDER = {
  currency: 'PKR',
  freeTier: { price: 0, label: 'Free (Local Models)' },
  proTier: { price: 2999, label: 'Pro (Coming Soon)' },
};
