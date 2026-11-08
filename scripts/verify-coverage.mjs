import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = join(root, 'docs', 'evidence');
mkdirSync(output, { recursive: true });
const clean = (text) => text.replace(/\x1b\[[0-9;]*m/g, '');
const results = [];
const environment = { ...process.env, TASK_EVIDENCE_DIR: output, NO_COLOR: '1' };
// Commands below are fixed project verification commands; no user-provided shell text.
function run(name, executable, args, directory = root) {
  const started = new Date();
  const isNpmOnWindows = process.platform === 'win32' && executable === 'npm';
  const command = isNpmOnWindows ? process.env.ComSpec || 'cmd.exe' : executable;
  const commandArgs = isNpmOnWindows ? ['/d', '/s', '/c', 'npm.cmd ' + args.join(' ')] : args;
  const result = spawnSync(command, commandArgs, { cwd: directory, env: environment, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024, windowsHide: true });
  const transcript = clean((result.stdout || '') + (result.stderr || '') + (result.error ? '\n' + result.error.message : ''));
  writeFileSync(join(output, name + '.txt'), transcript);
  results.push({ name, command: [executable, ...args].join(' '), directory: relative(root, directory) || '.', startedAt: started.toISOString(), finishedAt: new Date().toISOString(), exitCode: result.status });
  console.log(name + ': ' + (result.status === 0 ? 'PASS' : 'FAIL'));
  if (result.status !== 0) { console.error(transcript.slice(-6000)); throw new Error(name + ' failed'); }
  return transcript.trim();
}
const summary = { startedAt: new Date().toISOString(), timezone: 'Asia/Saigon', execution: 'local', nodeVersion: process.version, gitCommit: null, workingTreeDirty: true, versions: {}, sourceSha256: {}, results };
try {
  summary.gitCommit = run('git-head', 'git', ['rev-parse', 'HEAD']);
  summary.workingTreeDirty = run('git-status', 'git', ['status', '--porcelain']).length > 0;
  const lock = JSON.parse(readFileSync(join(root, 'backend/package-lock.json'), 'utf8'));
  for (const name of ['@nestjs/core', '@nestjs/platform-express', 'express', '@prisma/client', 'typescript']) summary.versions[name] = lock.packages['node_modules/' + name].version;
  const sources = [];
  function collect(directory) {
    for (const entry of readdirSync(join(root, directory), { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) collect(path);
      else if (entry.isFile()) sources.push(path);
    }
  }
  for (const path of ['backend/src', 'backend/test', 'backend/prisma', 'frontend/src', '.github/workflows', 'scripts']) collect(path);
  for (const path of ['backend/package.json','backend/package-lock.json','backend/docker-compose.yml','backend/nest-cli.json','backend/tsconfig.json','backend/tsconfig.build.json','backend/vitest.config.ts','backend/vitest.config.e2e.ts','backend/jest.config.cjs','backend/prisma.config.ts','frontend/package.json','frontend/package-lock.json','frontend/tsconfig.json','frontend/tsconfig.app.json','frontend/tsconfig.node.json','frontend/vite.config.ts','README.md']) sources.push(path);
  for (const path of sources.sort()) summary.sourceSha256[path.replaceAll('\\','/')] = createHash('sha256').update(readFileSync(join(root, path))).digest('hex');
  const backend = join(root, 'backend'), frontend = join(root, 'frontend');
  run('docker-start', 'docker', ['compose', 'up', '-d', 'db'], backend);
  run('docker-status', 'docker', ['compose', 'ps', '--format', 'json'], backend);
  run('prisma-generate', 'npm', ['exec', '--', 'prisma', 'generate'], backend);
  run('migration-deploy', 'npm', ['exec', '--', 'prisma', 'migrate', 'deploy'], backend);
  run('migration-status', 'npm', ['exec', '--', 'prisma', 'migrate', 'status'], backend);
  run('backend-build', 'npm', ['run', 'build'], backend);
  run('backend-lint', 'npm', ['run', 'lint'], backend);
  run('vitest', 'npm', ['test', '--', '--reporter=json', '--outputFile=../docs/evidence/vitest.json'], backend);
  run('jest', 'npm', ['run', 'test:unit', '--', '--runInBand', '--json', '--outputFile=../docs/evidence/jest.json'], backend);
  run('e2e', 'npm', ['run', 'test:e2e', '--', '--reporter=json', '--outputFile=../docs/evidence/e2e.json'], backend);
  run('frontend-build', 'npm', ['run', 'build'], frontend);
  run('frontend-lint', 'npm', ['run', 'lint'], frontend);
  summary.passed = true;
} catch (error) {
  summary.passed = false;
  summary.failure = error.message;
  process.exitCode = 1;
} finally {
  summary.finishedAt = new Date().toISOString();
  writeFileSync(join(output, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
  console.log('Evidence: docs/evidence/summary.json (local run; not a sealed Git commit or GitHub Actions run)');
}
