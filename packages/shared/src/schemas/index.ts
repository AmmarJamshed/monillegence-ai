import { z } from 'zod';

export const ChatRequestSchema = z.object({
  message: z.string().min(1),
  taskType: z
    .enum([
      'autocomplete',
      'quick_edit',
      'summary',
      'syntax_fix',
      'file_generation',
      'refactor',
      'debug',
      'architecture',
      'deployment',
      'devops',
      'chat',
    ])
    .optional()
    .default('chat'),
  context: z
    .object({
      files: z.array(z.string()).optional(),
      workspaceRoot: z.string().optional(),
      language: z.string().optional(),
    })
    .optional(),
});

export const InstallRuntimeSchema = z.object({
  runtimeType: z.enum(['ollama', 'lmstudio', 'llamacpp']),
  consent: z.object({
    approved: z.literal(true),
    timestamp: z.string(),
  }),
});

export const PullModelSchema = z.object({
  modelId: z.string().min(1),
});

export const ResolvePermissionSchema = z.object({
  approved: z.boolean(),
});

export const UpdateConfigSchema = z.object({
  locale: z.enum(['en', 'ur']).optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  preferredRuntime: z.enum(['ollama', 'lmstudio', 'llamacpp', 'vllm']).optional(),
  autoStartRuntime: z.boolean().optional(),
  cpuFallbackMode: z.boolean().optional(),
  ramOptimizationMode: z.boolean().optional(),
  onboardingCompleted: z.boolean().optional(),
  legalDisclaimerAccepted: z.boolean().optional(),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;
export type InstallRuntimeRequest = z.infer<typeof InstallRuntimeSchema>;
export type PullModelRequest = z.infer<typeof PullModelSchema>;
