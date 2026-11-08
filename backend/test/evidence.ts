import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Opt-in proof output contains only test traces/metadata, never tokens or passwords.
export function saveEvidence(name: string, data: unknown): void {
  if (!process.env.TASK_EVIDENCE_DIR) return;
  const directory = resolve(process.env.TASK_EVIDENCE_DIR);
  mkdirSync(directory, { recursive: true });
  writeFileSync(resolve(directory, name + '.json'), JSON.stringify(data, null, 2) + '\n');
}
