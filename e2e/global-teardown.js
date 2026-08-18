import { execFileSync } from 'node:child_process';
import { COMPOSE_FILE, EXTERNAL_DB } from './config.js';

export default async function globalTeardown() {
  if (EXTERNAL_DB) return; // not ours to tear down
  if (process.env.WTP_KEEP_DB === '1') return; // keep the DB up to inspect a failure
  execFileSync('docker', ['compose', '-f', COMPOSE_FILE, 'down', '-v'], { stdio: 'ignore' });
}
