import { mkdir, writeFile, readFile, readdir, rename, rm, access } from 'node:fs/promises';
import { join, resolve, relative } from 'node:path';
import { spawn } from 'node:child_process';
import { platform } from 'node:os';
import type { ProjectFile } from './parseProjectFiles.js';

export class WorkspaceService {
  constructor(private dataDir: string) {}

  getWorkspaceRoot(): string {
    return join(this.dataDir, 'workspace');
  }

  resolveProjectDir(slug: string): string {
    const root = this.getWorkspaceRoot();
    const safe = slug.replace(/[^a-z0-9-]/gi, '-').replace(/-+/g, '-');
    return join(root, safe);
  }

  assertInsideWorkspace(projectDir: string): void {
    const root = resolve(this.getWorkspaceRoot());
    const target = resolve(projectDir);
    const rel = relative(root, target);
    if (rel.startsWith('..') || resolve(root) === resolve('/')) {
      throw new Error('Project path must stay inside workspace');
    }
  }

  async writeProject(projectDir: string, files: ProjectFile[]): Promise<string[]> {
    this.assertInsideWorkspace(projectDir);
    await mkdir(projectDir, { recursive: true });
    const written: string[] = [];

    for (const file of files) {
      const fullPath = join(projectDir, file.path);
      this.assertInsideWorkspace(fullPath);
      await mkdir(join(fullPath, '..'), { recursive: true });
      await writeFile(fullPath, file.content, 'utf-8');
      written.push(file.path);
    }

    return written;
  }

  async snapshotFile(fullPath: string): Promise<void> {
    try {
      const content = await readFile(fullPath, 'utf-8');
      const snapDir = join(this.dataDir, 'snapshots');
      await mkdir(snapDir, { recursive: true });
      const name = fullPath.replace(/[:\\]/g, '_');
      await writeFile(join(snapDir, `${Date.now()}-${name}`), content, 'utf-8');
    } catch {
      /* new file */
    }
  }

  async runCommand(
    cwd: string,
    command: string,
    args: string[],
    timeoutMs = 180_000
  ): Promise<{ success: boolean; output: string }> {
    this.assertInsideWorkspace(cwd);

    return new Promise((resolvePromise) => {
      const child = spawn(command, args, {
        cwd,
        shell: platform() === 'win32',
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let output = '';
      child.stdout?.on('data', (d: Buffer) => {
        output += d.toString();
      });
      child.stderr?.on('data', (d: Buffer) => {
        output += d.toString();
      });

      const timer = setTimeout(() => {
        child.kill('SIGTERM');
        resolvePromise({ success: false, output: output + '\n(timed out)' });
      }, timeoutMs);

      child.on('close', (code) => {
        clearTimeout(timer);
        resolvePromise({ success: code === 0, output });
      });
      child.on('error', (err) => {
        clearTimeout(timer);
        resolvePromise({ success: false, output: err.message });
      });
    });
  }

  async installDependencies(projectDir: string): Promise<{ success: boolean; output: string }> {
    return this.runCommand(projectDir, 'npm', ['install'], 300_000);
  }

  /** If package.json lives in a single nested subfolder, hoist files to project root. */
  async flattenIfNested(projectDir: string): Promise<string | null> {
    try {
      await access(join(projectDir, 'package.json'));
      return null;
    } catch {
      /* not at root */
    }

    const entries = await readdir(projectDir, { withFileTypes: true });
    const dirs = entries.filter((e) => e.isDirectory());
    if (dirs.length !== 1) return null;

    const nested = join(projectDir, dirs[0].name);
    try {
      await access(join(nested, 'package.json'));
    } catch {
      return null;
    }

    const nestedEntries = await readdir(nested, { withFileTypes: true });
    for (const entry of nestedEntries) {
      await rename(join(nested, entry.name), join(projectDir, entry.name));
    }
    await rm(nested, { recursive: true, force: true });
    return projectDir;
  }

  async listProjectFiles(projectDir: string): Promise<string[]> {
    const results: string[] = [];
    const walk = async (dir: string, prefix = ''): Promise<void> => {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === 'node_modules') continue;
        const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
          await walk(join(dir, entry.name), rel);
        } else {
          results.push(rel.replace(/\\/g, '/'));
        }
      }
    };
    await walk(projectDir);
    return results;
  }
}
