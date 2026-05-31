/**
 * E2E build agent test — run from repo root:
 * npx tsx scripts/test-build.mjs
 */
import { AuditLogger, PermissionGate } from '../packages/agent-backend/src/permissions/PermissionGate.js';
import { CodingAgent } from '../packages/agent-backend/src/agents/CodingAgent.js';
import { ConfigStore } from '../packages/agent-backend/src/agents/agentExports.js';
import { RuntimeManager, getRuntimeDataDir } from '../packages/runtime-manager/src/index.js';
import { ModelRouter } from '../packages/model-router/src/index.js';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

process.env.MONILLEGENCE_AUTO_BUILD = 'true';

const dataDir = getRuntimeDataDir();
const audit = new AuditLogger(dataDir);
await audit.init();
const runtime = new RuntimeManager({ dataDir });
await runtime.ensureRuntime();
const router = new ModelRouter({ installedModels: await runtime.listModels() });
const agent = new CodingAgent(runtime, router, new PermissionGate(audit));

const prompt = 'Create a React todo app with Tailwind';
console.log('Testing build:', prompt);
console.log('Workspace:', agent.getWorkspaceRoot());

const t = Date.now();
let projectPath = '';
let fileCount = 0;
let valid = false;

for await (const event of agent.streamChat(prompt)) {
  if (event.kind === 'build_status') {
    console.log(`[${event.phase}] ${event.message}`);
  } else if (event.kind === 'files_written') {
    projectPath = event.projectPath;
    fileCount = event.files.length;
    console.log('Files written:', event.files.length, '→', projectPath);
  } else if (event.kind === 'build_complete') {
    valid = event.valid;
    console.log('Build complete. Valid:', event.valid);
    if (event.errors.length) console.log('Errors:', event.errors);
    if (event.warnings.length) console.log('Warnings:', event.warnings);
  } else if (event.kind === 'error') {
    console.error('ERROR:', event.message);
    process.exit(1);
  }
}

console.log(`Done in ${Math.round((Date.now() - t) / 1000)}s`);
if (projectPath) {
  const entries = await readdir(projectPath, { recursive: true });
  console.log('On disk:', entries.length, 'entries');
  console.log('Project path:', projectPath);
  console.log('Run: cd "' + projectPath + '" && npm run dev');
}
process.exit(valid ? 0 : 1);
