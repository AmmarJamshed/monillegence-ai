import type { ChatMessageParam } from '../inference/localChat.js';
import { chatCompletion } from '../inference/localChat.js';
import type { ProjectFile } from './parseProjectFiles.js';
import {
  createComputeStatus,
  DEFAULT_LLM_FILES,
  getParallelWorkers,
  runParallel,
  scaffoldReactTailwindProject,
} from './parallelBuild.js';
import { getAppTemplate, UI_QUALITY_PROMPT } from './appTemplates.js';

const FILE_GEN_PROMPT = `You are a code generator. Output ONLY the raw file contents.
No markdown fences. No explanations. No ===FILE=== markers.
Do NOT import App.css — use Tailwind CSS classes only.
${UI_QUALITY_PROMPT}
The file must be complete, runnable, and import-correct for a Vite+React+TypeScript+Tailwind project.`;

export type ParallelBuildEvent =
  | { kind: 'timeline'; id: string; label: string; status: 'pending' | 'active' | 'done' }
  | { kind: 'compute'; cores: number; workers: number; activeTasks: number; strategy: string }
  | { kind: 'file'; path: string; status: 'scaffolded' | 'generating' | 'done'; preview?: string }
  | { kind: 'progress'; message: string; elapsedSec: number; completed: number; total: number };

export async function* buildProjectParallel(options: {
  baseUrl: string;
  modelId: string;
  projectName: string;
  userRequest: string;
}): AsyncGenerator<ParallelBuildEvent, ProjectFile[]> {
  const { baseUrl, modelId, projectName, userRequest } = options;
  const workers = getParallelWorkers();
  const startMs = Date.now();
  const elapsed = () => Math.floor((Date.now() - startMs) / 1000);
  const llmFiles = [...DEFAULT_LLM_FILES];

  const emitCompute = function* (
    active: number,
    strategy: string
  ): Generator<ParallelBuildEvent> {
    const s = createComputeStatus(active, strategy);
    yield {
      kind: 'compute',
      cores: s.cpuCores,
      workers: s.parallelWorkers,
      activeTasks: active,
      strategy,
    };
  };

  // Step 1 — instant scaffold (no LLM, immediate UI feedback)
  yield { kind: 'timeline', id: 'scaffold', label: 'Scaffolding project files', status: 'active' };
  yield* emitCompute(0, 'Instant template scaffold — no LLM wait');

  const scaffolded = scaffoldReactTailwindProject(projectName);
  for (const f of scaffolded) {
    yield {
      kind: 'file',
      path: f.path,
      status: 'scaffolded',
      preview: f.content.slice(0, 200),
    };
  }
  yield {
    kind: 'timeline',
    id: 'scaffold',
    label: `Scaffolded ${scaffolded.length} files instantly`,
    status: 'done',
  };

  // Step 2 — quality app template (instant) or parallel LLM
  const appTemplate = getAppTemplate(userRequest, projectName);
  let generated: ProjectFile[] = [];

  if (appTemplate) {
    yield {
      kind: 'timeline',
      id: 'parallel',
      label: 'Applying polished UI template (instant)',
      status: 'active',
    };
    yield* emitCompute(0, 'Production UI template — no LLM wait');

    const appFile = { path: 'src/App.tsx', content: appTemplate };
    generated = [appFile];
    yield {
      kind: 'file',
      path: 'src/App.tsx',
      status: 'done',
      preview: appTemplate.slice(0, 400),
    };
    yield {
      kind: 'timeline',
      id: 'parallel',
      label: 'Polished app UI ready',
      status: 'done',
    };
  } else {
    yield {
      kind: 'timeline',
      id: 'parallel',
      label: `Generating ${llmFiles.join(', ')} with UX requirements`,
      status: 'active',
    };
    yield* emitCompute(
      Math.min(workers, llmFiles.length),
      `${workers} workers on ${createComputeStatus(0, '').cpuCores} CPU cores`
    );

    let completed = 0;
    const eventQueue: ParallelBuildEvent[] = [];
    let resolveWait: (() => void) | null = null;
    let generationDone = false;

    const pushEvent = (ev: ParallelBuildEvent) => {
      eventQueue.push(ev);
      resolveWait?.();
      resolveWait = null;
    };

    const heartbeat = setInterval(() => {
      if (generationDone) return;
      pushEvent({
        kind: 'progress',
        message: `Workers active… (${completed}/${llmFiles.length} done)`,
        elapsedSec: elapsed(),
        completed,
        total: llmFiles.length,
      });
    }, 5000);

    const generationPromise = runParallel(
      llmFiles,
      workers,
      async (filePath) => {
        pushEvent({ kind: 'file', path: filePath, status: 'generating' });
        pushEvent({
          kind: 'progress',
          message: `Generating ${filePath}…`,
          elapsedSec: elapsed(),
          completed,
          total: llmFiles.length,
        });

        const content = await chatCompletion({
          baseUrl,
          model: modelId,
          messages: buildFileMessages(filePath, userRequest, projectName),
          temperature: 0.25,
          signal: AbortSignal.timeout(300_000),
        });

        return { path: filePath, content: stripFences(content) };
      },
      (filePath) => {
        const s = createComputeStatus(workers, `Worker: ${filePath}`);
        pushEvent({
          kind: 'compute',
          cores: s.cpuCores,
          workers: s.parallelWorkers,
          activeTasks: Math.min(workers, llmFiles.length - completed),
          strategy: `Generating ${filePath}`,
        });
      },
      (filePath, _i, result) => {
        completed += 1;
        pushEvent({
          kind: 'file',
          path: filePath,
          status: 'done',
          preview: result.content.slice(0, 500),
        });
        pushEvent({
          kind: 'progress',
          message: `Done: ${filePath}`,
          elapsedSec: elapsed(),
          completed,
          total: llmFiles.length,
        });
      }
    ).finally(() => {
      generationDone = true;
      clearInterval(heartbeat);
    });

    while (!generationDone || eventQueue.length > 0) {
      while (eventQueue.length > 0) {
        yield eventQueue.shift()!;
      }
      if (generationDone) break;
      await new Promise<void>((r) => {
        resolveWait = r;
        setTimeout(r, 500);
      });
    }

    generated = await generationPromise;
    yield {
      kind: 'timeline',
      id: 'parallel',
      label: `Generated ${generated.length} app file(s)`,
      status: 'done',
    };
  }

  yield* emitCompute(0, 'Generation complete');

  return [...scaffolded, ...generated];
}

function buildFileMessages(
  filePath: string,
  userRequest: string,
  projectName: string
): ChatMessageParam[] {
  return [
    { role: 'system', content: FILE_GEN_PROMPT },
    {
      role: 'user',
      content:
        `File: ${filePath}\nProject: ${projectName}\n\n` +
        `Build this app feature completely in this single file:\n${userRequest}\n\n` +
        UI_QUALITY_PROMPT +
        `\nUse Tailwind CSS. Export default component. TypeScript + React 18.`,
    },
  ];
}

function stripFences(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```[\w]*\n([\s\S]*?)```$/);
  let content = fenceMatch ? fenceMatch[1].trim() : trimmed;
  content = content.replace(/import\s+['"]\.\/App\.css['"];?\s*\n?/g, '');
  return content;
}
