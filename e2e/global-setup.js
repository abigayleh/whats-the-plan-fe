import { execFileSync } from 'node:child_process';
import {
  BE_PATH, COMPOSE_FILE, DB_URL, EXTERNAL_DB, backendEnv,
} from './config.js';

const run = (cmd, args, opts = {}) => execFileSync(cmd, args, { stdio: 'inherit', ...opts });

function startDockerDb() {
  try {
    execFileSync('docker', ['info'], { stdio: 'ignore' });
  } catch {
    throw new Error(
      'No usable Docker daemon. Either start one (Docker Desktop, OrbStack, colima), or point '
      + 'WTP_DB_URL at a throwaway Postgres and re-run `npm run e2e`.',
    );
  }
  // A leftover container from a killed run holds the old schema, so always start clean.
  run('docker', ['compose', '-f', COMPOSE_FILE, 'down', '-v'], { stdio: 'ignore' });
  run('docker', ['compose', '-f', COMPOSE_FILE, 'up', '-d', '--wait']);
}

export default async function globalSetup() {
  if (!EXTERNAL_DB) startDockerDb();

  run('npx', ['prisma', 'migrate', 'deploy'], {
    cwd: BE_PATH,
    env: { ...process.env, DATABASE_URL: DB_URL, DIRECT_URL: DB_URL },
  });

  // webServer boots the BE from this same env; keep the two in sync via one source.
  Object.assign(process.env, backendEnv);
}
