#!/usr/bin/env node
/**
 * Start Monillegence AI development stack:
 * 1. Agent backend
 * 2. UI dev server (Vite)
 * 3. Electron desktop (optional with --desktop flag)
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const isWin = process.platform === 'win32';
const pnpm = isWin ? 'pnpm.cmd' : 'pnpm';

const procs = [];

function run(name, args, cwd = root) {
  const child = spawn(pnpm, args, {
    cwd,
    stdio: 'inherit',
    shell: isWin,
    env: { ...process.env, FORCE_COLOR: '1' },
  });
  child.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`[dev] ${name} exited with code ${code}`);
    }
  });
  procs.push(child);
  return child;
}

console.log('🇵🇰 Monillegence AI — Development Mode');
console.log('Starting agent backend on http://127.0.0.1:9477\n');

run('agent-backend', ['--filter', '@monillegence/agent-backend', 'dev']);
run('ui', ['--filter', '@monillegence/ui', 'dev']);

if (process.argv.includes('--desktop')) {
  setTimeout(() => {
    run('desktop', ['--filter', '@monillegence/desktop', 'dev']);
  }, 3000);
}

function shutdown() {
  for (const p of procs) {
    p.kill('SIGTERM');
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
