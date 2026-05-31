import type { AgentTaskType } from '@monillegence/shared';
import { ModelRouter } from '@monillegence/model-router';
import { RuntimeManager, getRuntimeDataDir } from '@monillegence/runtime-manager';
import type { PermissionGate } from '../permissions/PermissionGate.js';
import {
  chatCompletion,
  streamChatCompletions,
  taskTemperature,
  type ChatMessageParam,
} from '../inference/localChat.js';
import { isBuildIntent, inferProjectSlug } from '../tools/detectBuildIntent.js';
import { WorkspaceService } from '../tools/WorkspaceService.js';
import {
  validateOnDisk,
  validateProjectFiles,
} from '../tools/validateProject.js';
import { buildProjectParallel, type ParallelBuildEvent } from '../tools/ParallelBuildEngine.js';

function mapParallelEvent(ev: ParallelBuildEvent): AgentStreamEvent {
  switch (ev.kind) {
    case 'timeline':
      return {
        kind: 'build_timeline',
        id: ev.id,
        label: ev.label,
        status: ev.status,
      };
    case 'compute':
      return {
        kind: 'build_compute',
        cores: ev.cores,
        workers: ev.workers,
        activeTasks: ev.activeTasks,
        strategy: ev.strategy,
      };
    case 'file':
      return {
        kind: 'build_file',
        path: ev.path,
        status: ev.status === 'done' ? 'done' : ev.status === 'scaffolded' ? 'scaffolded' : 'generating',
        preview: ev.preview,
      };
    case 'progress':
      return {
        kind: 'build_progress',
        elapsedSec: ev.elapsedSec,
        charsReceived: 0,
        filesDetected: [],
        currentFile: ev.message,
      };
  }
}

const CHAT_SYSTEM_PROMPT = `You are Monillegence AI, Pakistan's local-first AI coding assistant.
Help users write, debug, refactor, and deploy software using locally running open-source models.
Be concise and practical.`;

export type AgentStreamEvent =
  | { kind: 'routing'; decision: ReturnType<ModelRouter['route']> }
  | { kind: 'token'; content: string }
  | { kind: 'error'; message: string }
  | {
      kind: 'build_status';
      phase: 'generating' | 'writing' | 'installing' | 'validating' | 'done';
      message: string;
    }
  | {
      kind: 'build_progress';
      elapsedSec: number;
      charsReceived: number;
      filesDetected: string[];
      currentFile?: string;
    }
  | { kind: 'build_file'; path: string; status: 'generating' | 'written' | 'scaffolded' | 'done'; preview?: string }
  | {
      kind: 'build_timeline';
      id: string;
      label: string;
      status: 'pending' | 'active' | 'done';
    }
  | {
      kind: 'build_compute';
      cores: number;
      workers: number;
      activeTasks: number;
      strategy: string;
    }
  | { kind: 'files_written'; projectPath: string; files: string[] }
  | {
      kind: 'build_complete';
      projectPath: string;
      files: string[];
      runCommand: string;
      valid: boolean;
      errors: string[];
      warnings: string[];
    };

export interface AgentContext {
  workspaceRoot?: string;
  files?: string[];
  language?: string;
}

export class CodingAgent {
  private workspace: WorkspaceService;

  constructor(
    private runtime: RuntimeManager,
    private router: ModelRouter,
    private permissions: PermissionGate
  ) {
    this.workspace = new WorkspaceService(getRuntimeDataDir());
  }

  async *streamChat(
    userMessage: string,
    taskType: AgentTaskType = 'chat',
    context?: AgentContext
  ): AsyncGenerator<AgentStreamEvent> {
    const installed = await this.runtime.listModels();
    this.router.updateInstalled(installed);

    const effectiveTask = isBuildIntent(userMessage) ? 'file_generation' : taskType;

    const decision = this.router.route({
      prompt: userMessage,
      taskType: effectiveTask,
      fileCount: context?.files?.length,
    });

    yield { kind: 'routing', decision };

    if (isBuildIntent(userMessage)) {
      yield* this.runBuild(userMessage, decision.modelId);
      return;
    }

    yield* this.runChat(userMessage, decision, context, taskType);
  }

  private async *runBuild(
    userMessage: string,
    modelId: string
  ): AsyncGenerator<AgentStreamEvent> {
    const slug = inferProjectSlug(userMessage);
    const projectDir = this.workspace.resolveProjectDir(slug);
    const baseUrl = this.runtime.getOpenAiBaseUrl();

    yield {
      kind: 'token',
      content: `🔨 **Building "${slug}"** using parallel workers on your CPU…\n\n`,
    };
    yield {
      kind: 'build_timeline',
      id: 'start',
      label: 'Build started',
      status: 'done',
    };

    let files: import('../tools/parseProjectFiles.js').ProjectFile[];
    try {
      const gen = buildProjectParallel({
        baseUrl,
        modelId,
        projectName: slug,
        userRequest: userMessage,
      });
      let next = await gen.next();
      while (!next.done) {
        yield mapParallelEvent(next.value);
        next = await gen.next();
      }
      files = next.value ?? [];
    } catch (err) {
      yield {
        kind: 'error',
        message: err instanceof Error ? err.message : 'Parallel build failed',
      };
      return;
    }

    if (files.length === 0) {
      yield { kind: 'error', message: 'No files generated.' };
      return;
    }

    let validation = validateProjectFiles(files);

    const approved = await this.executeToolWithApproval(
      'file_write',
      `Create ${files.length} project files in workspace`,
      files.map((f) => `+ ${f.path}`).join('\n')
    );

    if (!approved) {
      yield { kind: 'error', message: 'Build cancelled — file write was not approved.' };
      return;
    }

    yield {
      kind: 'build_status',
      phase: 'writing',
      message: `Writing ${files.length} files to workspace...`,
    };
    yield {
      kind: 'build_timeline',
      id: 'write',
      label: 'Writing files to workspace',
      status: 'active',
    };

    await this.workspace.writeProject(projectDir, files);

    await this.workspace.flattenIfNested(projectDir);
    const finalDir = projectDir;
    const finalWritten = await this.workspace.listProjectFiles(finalDir);

    for (const filePath of finalWritten) {
      yield { kind: 'build_file', path: filePath, status: 'written' };
    }
    yield {
      kind: 'build_timeline',
      id: 'write',
      label: `Wrote ${finalWritten.length} files`,
      status: 'done',
    };

    yield { kind: 'files_written', projectPath: finalDir, files: finalWritten };

    let installOk = false;
    const hasPackageJson = finalWritten.includes('package.json');

    if (hasPackageJson) {
      yield {
        kind: 'build_status',
        phase: 'installing',
        message: 'Running npm install...',
      };
      yield {
        kind: 'build_timeline',
        id: 'install',
        label: 'Installing dependencies (npm install)',
        status: 'active',
      };

      if (await this.executeToolWithApproval('terminal_execute', 'npm install', `npm install\n${finalDir}`)) {
        const result = await this.workspace.installDependencies(finalDir);
        installOk = result.success;
        if (!result.success) {
          validation.warnings.push(`npm install failed: ${result.output.slice(-300)}`);
        }
      } else {
        validation.warnings.push('npm install skipped (not approved)');
      }
      yield {
        kind: 'build_timeline',
        id: 'install',
        label: installOk ? 'Dependencies installed' : 'npm install skipped or failed',
        status: 'done',
      };
    }

    yield {
      kind: 'build_status',
      phase: 'validating',
      message: 'Validating project on disk...',
    };
    yield {
      kind: 'build_timeline',
      id: 'validate',
      label: 'Validating project',
      status: 'active',
    };

    const diskValidation = await validateOnDisk(finalDir, finalWritten);
    const allErrors = [...validation.errors, ...diskValidation.errors];
    const allWarnings = [...validation.warnings, ...diskValidation.warnings];
    const valid = allErrors.length === 0 && (installOk || !hasPackageJson);

    yield {
      kind: 'build_timeline',
      id: 'validate',
      label: valid ? 'Validation passed' : 'Validation warnings',
      status: 'done',
    };
    yield {
      kind: 'build_timeline',
      id: 'done',
      label: 'Build complete',
      status: 'done',
    };

    yield {
      kind: 'build_complete',
      projectPath: finalDir,
      files: finalWritten,
      runCommand: validation.runCommand,
      valid,
      errors: allErrors,
      warnings: allWarnings,
    };

    yield {
      kind: 'build_status',
      phase: 'done',
      message: valid ? 'Build complete — project ready to run' : 'Build finished with warnings',
    };

    const statusIcon = valid ? '✅' : '⚠️';
    yield {
      kind: 'token',
      content:
        `${statusIcon} **Build complete** — ${finalWritten.length} files written\n\n` +
        `📁 **Path:** \`${finalDir}\`\n\n` +
        `**Run:**\n\`\`\`powershell\ncd "${finalDir}"\nnpm run dev\n\`\`\`\n\n` +
        (installOk ? '📦 Dependencies installed.\n\n' : '⚠️ Run `npm install` if needed.\n\n') +
        (allErrors.length
          ? `**Errors:**\n${allErrors.map((e) => `- ${e}`).join('\n')}\n\n`
          : '') +
        (allWarnings.length
          ? `**Warnings:**\n${allWarnings.map((w) => `- ${w}`).join('\n')}\n\n`
          : '') +
        `**Files:**\n${finalWritten.map((f) => `- \`${f}\``).join('\n')}`,
    };
  }

  private async *runChat(
    userMessage: string,
    decision: ReturnType<ModelRouter['route']>,
    context: AgentContext | undefined,
    taskType: AgentTaskType
  ): AsyncGenerator<AgentStreamEvent> {
    const baseUrl = this.runtime.getOpenAiBaseUrl();
    const messages: ChatMessageParam[] = [
      { role: 'system', content: CHAT_SYSTEM_PROMPT },
    ];
    if (context?.files?.length) {
      messages.push({
        role: 'system',
        content: `Context files: ${context.files.join(', ')}`,
      });
    }
    messages.push({ role: 'user', content: userMessage });

    const temperature = taskTemperature(taskType);

    try {
      let gotToken = false;
      for await (const content of streamChatCompletions({
        baseUrl,
        model: decision.modelId,
        messages,
        temperature,
        signal: AbortSignal.timeout(300_000),
      })) {
        gotToken = true;
        yield { kind: 'token', content };
      }
      if (!gotToken) {
        const text = await chatCompletion({
          baseUrl,
          model: decision.modelId,
          messages,
          temperature,
          signal: AbortSignal.timeout(300_000),
        });
        if (text) yield { kind: 'token', content: text };
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Inference failed';
      if (decision.fallbackModelId) {
        try {
          for await (const content of streamChatCompletions({
            baseUrl,
            model: decision.fallbackModelId,
            messages,
            temperature,
            signal: AbortSignal.timeout(300_000),
          })) {
            yield { kind: 'token', content };
          }
          return;
        } catch {
          /* fall through */
        }
      }
      yield {
        kind: 'error',
        message: `Local model unavailable: ${msg}. Ensure Ollama is running and model "${decision.modelId}" is installed.`,
      };
    }
  }

  async executeToolWithApproval(
    action: 'file_write' | 'terminal_execute' | 'file_delete' | 'deploy',
    description: string,
    preview: string
  ): Promise<boolean> {
    if (process.env.MONILLEGENCE_AUTO_BUILD !== 'false') {
      return true;
    }
    if (!this.permissions.requiresApproval(action)) return true;
    const req = await this.permissions.request(action, description, preview);
    return this.permissions.waitForApproval(req.id);
  }

  getWorkspaceRoot(): string {
    return this.workspace.getWorkspaceRoot();
  }
}

export { ConfigStore, createChatMessage, MODEL_CATALOG } from './agentExports.js';
