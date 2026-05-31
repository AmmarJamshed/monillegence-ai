import type {
  AgentTaskType,
  ModelTier,
  RoutingDecision,
  TaskComplexity,
} from '@monillegence/shared';
import { MODEL_CATALOG } from '@monillegence/shared';

export interface ComplexityInput {
  prompt: string;
  taskType: AgentTaskType;
  fileCount?: number;
  preferSpeed?: boolean;
  deepReasoning?: boolean;
}

export interface ComplexityResult {
  score: number;
  complexity: TaskComplexity;
  estimatedTokens: number;
}

const TASK_TYPE_WEIGHT: Partial<Record<AgentTaskType, number>> = {
  autocomplete: 0,
  quick_edit: 1,
  summary: 1,
  syntax_fix: 1,
  file_generation: 3,
  refactor: 4,
  debug: 5,
  architecture: 6,
  deployment: 6,
  devops: 5,
  chat: 2,
};

const REASONING_KEYWORDS =
  /\b(architecture|design pattern|debug|root cause|deploy|docker|kubernetes|refactor entire|migration)\b/i;
const STACK_TRACE = /at\s+\w+\s+\(|Error:|Traceback|Exception:/;

export function estimateComplexity(input: ComplexityInput): ComplexityResult {
  let score = TASK_TYPE_WEIGHT[input.taskType] ?? 2;

  if (input.prompt.length > 500) score += 1;
  if (input.prompt.length > 2000) score += 2;
  if (REASONING_KEYWORDS.test(input.prompt)) score += 2;
  if (STACK_TRACE.test(input.prompt)) score += 2;
  if (input.fileCount) score += Math.min(input.fileCount, 3);
  if (input.deepReasoning) score += 3;
  if (input.preferSpeed) score = Math.max(0, score - 2);

  const estimatedTokens = Math.min(
    128000,
    Math.ceil(input.prompt.length / 3) + (input.fileCount ?? 0) * 2000 + 4096
  );

  let complexity: TaskComplexity;
  if (score <= 1) complexity = 'trivial';
  else if (score <= 3) complexity = 'low';
  else if (score <= 5) complexity = 'medium';
  else if (score <= 7) complexity = 'high';
  else complexity = 'critical';

  return { score, complexity, estimatedTokens };
}

function tierFromComplexity(complexity: TaskComplexity): ModelTier {
  switch (complexity) {
    case 'trivial':
    case 'low':
      return 'small';
    case 'medium':
      return 'medium';
    case 'high':
    case 'critical':
      return 'large';
  }
}

export interface ModelRouterOptions {
  installedModels: string[];
  cpuFallback?: boolean;
  ramOptimization?: boolean;
}

export class ModelRouter {
  constructor(private options: ModelRouterOptions) {}

  updateInstalled(models: string[]): void {
    this.options.installedModels = models;
  }

  route(input: ComplexityInput): RoutingDecision {
    const { complexity, estimatedTokens, score } = estimateComplexity(input);
    let tier = tierFromComplexity(complexity);

    if (this.options.ramOptimization && tier === 'large') {
      tier = 'medium';
    }

    const candidates = MODEL_CATALOG.filter((m) => m.tier === tier);
    const installed = this.options.installedModels;

    let selected = candidates.find(
      (c) => c.ollamaTag && installed.some((i) => i.startsWith(c.ollamaTag!.split(':')[0]))
    );

    if (!selected) {
      selected =
        MODEL_CATALOG.find((m) => m.isStarter) ??
        candidates[0] ??
        MODEL_CATALOG[0];
    }

    const fallbackTier: ModelTier =
      tier === 'large' ? 'medium' : tier === 'medium' ? 'small' : 'small';
    const fallback = MODEL_CATALOG.find((m) => m.tier === fallbackTier);

    const modelId = selected.ollamaTag ?? selected.name;

    return {
      modelId,
      tier,
      reason: `Complexity score ${score} (${complexity}) → ${tier} tier for ${input.taskType}`,
      estimatedTokens,
      fallbackModelId: fallback?.ollamaTag ?? fallback?.name,
      confidence: installed.includes(modelId) ? 0.95 : 0.6,
    };
  }
}

export { estimateComplexity as analyzeTaskComplexity };
