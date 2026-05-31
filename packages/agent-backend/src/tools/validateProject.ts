import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ProjectFile } from './parseProjectFiles.js';

const PLACEHOLDER_PATTERNS = [
  /\.\.\.\s*(rest of|remaining|etc)/i,
  /\/\/\s*TODO:\s*implement/i,
  /\/\*\s*TODO/i,
  /add (more|your) (code|content) here/i,
  /implement (this|here)/i,
  /\/\/\s*\.\.\./,
];

const VITE_REACT_REQUIRED = [
  'package.json',
  'index.html',
  'vite.config.ts',
  'src/main.tsx',
  'src/App.tsx',
];

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  runCommand: string;
}

export function validateProjectFiles(files: ProjectFile[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const paths = new Set(files.map((f) => f.path.replace(/\\/g, '/')));

  if (!paths.has('package.json')) {
    errors.push('Missing package.json');
  } else {
    const pkg = files.find((f) => f.path === 'package.json');
    if (pkg) {
      try {
        const json = JSON.parse(pkg.content) as { scripts?: Record<string, string> };
        if (!json.scripts?.dev && !json.scripts?.start) {
          errors.push('package.json must include a "dev" or "start" script');
        }
      } catch {
        errors.push('package.json is not valid JSON');
      }
    }
  }

  for (const required of VITE_REACT_REQUIRED) {
    if (!paths.has(required)) {
      warnings.push(`Missing recommended file: ${required}`);
    }
  }

  for (const file of files) {
    if (file.path.endsWith('App.tsx') || file.path.endsWith('.tsx')) {
      if (!/<h1/i.test(file.content) && !/role=.heading/i.test(file.content)) {
        warnings.push(`${file.path} should include a clear title (h1) for users`);
      }
      if (!/placeholder|empty|no .* yet|get started/i.test(file.content)) {
        warnings.push(`${file.path} should include an empty-state message for new users`);
      }
      if (!/<button/i.test(file.content)) {
        errors.push(`${file.path} must include visible buttons — not input-only UI`);
      }
    }
    for (const pattern of PLACEHOLDER_PATTERNS) {
      if (pattern.test(file.content)) {
        errors.push(`${file.path} contains incomplete placeholder content`);
        break;
      }
    }
    if (file.content.trim().length < 5) {
      errors.push(`${file.path} is empty or too short`);
    }
  }

  if (files.length < 5) {
    warnings.push(`Only ${files.length} files generated — a full Vite+React app usually needs 8+ files`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    runCommand: 'npm run dev',
  };
}

export async function validateOnDisk(
  projectDir: string,
  written: string[]
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const rel of written) {
    try {
      await access(join(projectDir, rel));
    } catch {
      errors.push(`File not found on disk: ${rel}`);
    }
  }

  const pkgPath = join(projectDir, 'package.json');
  try {
    const raw = await readFile(pkgPath, 'utf-8');
    JSON.parse(raw);
  } catch {
    errors.push('package.json missing or invalid on disk');
  }

  const nodeModules = join(projectDir, 'node_modules');
  try {
    await access(nodeModules);
  } catch {
    warnings.push('node_modules not found — npm install may have failed');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    runCommand: 'npm run dev',
  };
}
