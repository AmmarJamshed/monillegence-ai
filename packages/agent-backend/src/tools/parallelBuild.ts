import os from 'node:os';
import type { ProjectFile } from './parseProjectFiles.js';

export interface ComputeStatus {
  cpuCores: number;
  parallelWorkers: number;
  activeTasks: number;
  strategy: string;
}

export function getCpuCores(): number {
  return os.cpus().length;
}

export function getParallelWorkers(): number {
  const env = parseInt(process.env.MONILLEGENCE_PARALLEL_WORKERS ?? '', 10);
  if (!Number.isNaN(env)) {
    return Math.max(1, Math.min(env, 8));
  }
  const cores = getCpuCores();
  // Leave headroom for OS + Ollama; cap for single-GPU/CPU local inference
  return Math.max(1, Math.min(Math.floor(cores / 2), 4));
}

export function createComputeStatus(
  activeTasks: number,
  strategy: string
): ComputeStatus {
  return {
    cpuCores: getCpuCores(),
    parallelWorkers: getParallelWorkers(),
    activeTasks,
    strategy,
  };
}

/** Standard Vite + React + TS + Tailwind scaffold (instant — no LLM). */
export function scaffoldReactTailwindProject(projectName: string): ProjectFile[] {
  return [
    {
      path: 'package.json',
      content: JSON.stringify(
        {
          name: projectName,
          private: true,
          version: '0.1.0',
          type: 'module',
          scripts: {
            dev: 'vite',
            build: 'tsc -b && vite build',
            preview: 'vite preview',
          },
          dependencies: {
            react: '^18.3.1',
            'react-dom': '^18.3.1',
          },
          devDependencies: {
            '@types/react': '^18.3.12',
            '@types/react-dom': '^18.3.1',
            '@vitejs/plugin-react': '^4.3.4',
            autoprefixer: '^10.4.20',
            postcss: '^8.4.49',
            tailwindcss: '^3.4.17',
            typescript: '^5.7.2',
            vite: '^6.0.6',
          },
        },
        null,
        2
      ),
    },
    {
      path: 'index.html',
      content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
  </head>
  <body class="bg-slate-950 text-white">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
    },
    {
      path: 'vite.config.ts',
      content: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
`,
    },
    {
      path: 'tsconfig.json',
      content: JSON.stringify(
        {
          compilerOptions: {
            target: 'ES2022',
            useDefineForClassFields: true,
            lib: ['ES2022', 'DOM', 'DOM.Iterable'],
            module: 'ESNext',
            skipLibCheck: true,
            moduleResolution: 'bundler',
            allowImportingTsExtensions: true,
            resolveJsonModule: true,
            isolatedModules: true,
            noEmit: true,
            jsx: 'react-jsx',
            strict: true,
          },
          include: ['src'],
        },
        null,
        2
      ),
    },
    {
      path: 'tsconfig.node.json',
      content: JSON.stringify(
        {
          compilerOptions: {
            target: 'ES2022',
            lib: ['ES2023'],
            module: 'ESNext',
            skipLibCheck: true,
            moduleResolution: 'bundler',
          },
          include: ['vite.config.ts'],
        },
        null,
        2
      ),
    },
    {
      path: 'tailwind.config.js',
      content: `/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: [],
};
`,
    },
    {
      path: 'postcss.config.js',
      content: `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`,
    },
    {
      path: 'src/main.tsx',
      content: `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
`,
    },
    {
      path: 'src/index.css',
      content: `@tailwind base;
@tailwind components;
@tailwind utilities;
`,
    },
    {
      path: 'src/vite-env.d.ts',
      content: `/// <reference types="vite/client" />
`,
    },
  ];
}

export const DEFAULT_LLM_FILES = ['src/App.tsx'];

export async function runParallel<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
  onStart?: (item: T, index: number) => void,
  onDone?: (item: T, index: number, result: R) => void
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function runWorker(): Promise<void> {
    while (true) {
      const i = nextIndex++;
      if (i >= items.length) return;
      const item = items[i];
      onStart?.(item, i);
      results[i] = await worker(item, i);
      onDone?.(item, i, results[i]);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => runWorker()
  );
  await Promise.all(workers);
  return results;
}
