import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));

// The backend is a separate repo. Sibling checkout by default; override for CI.
export const BE_PATH = process.env.WTP_BE_PATH
  || path.resolve(here, '../../whats-the-plan-be');

// Point WTP_DB_URL at any throwaway Postgres to skip Docker entirely (CI service container,
// a local server, a remote scratch DB). Otherwise e2e/docker-compose.yml provides one.
export const EXTERNAL_DB = Boolean(process.env.WTP_DB_URL);
export const DB_URL = process.env.WTP_DB_URL
  || 'postgresql://postgres:postgres@localhost:55432/wtp_e2e';
// Deliberately obscure ports: a normal dev stack (4000/5173) and other worktrees' dev
// servers must be able to run at the same time as the suite.
export const API_URL = 'http://localhost:4801';
export const APP_URL = 'http://localhost:5199';

// Every variable the backend reads is set explicitly. The backend calls dotenv.config(), which
// does not override already-set vars — so setting all of them means its real .env (production
// Supabase credentials) can never leak a single value into an E2E run.
export const backendEnv = {
  DATABASE_URL: DB_URL,
  DIRECT_URL: DB_URL,
  PORT: '4801',
  CORS_ORIGIN: APP_URL,
  JWT_ACCESS_SECRET: 'e2e-access-secret',
  JWT_REFRESH_SECRET: 'e2e-refresh-secret',
  E2E_EXPOSE_VERIFY_TOKEN: '1',
  RESEND_API_KEY: '', // empty → lib/email.js warns and sends nothing
  RESEND_FROM_EMAIL: 'e2e@example.test',
  ADMIN_NOTIFICATION_EMAIL: 'e2e@example.test',
};

const LOCAL_HOST = /@(localhost|127\.0\.0\.1|\[::1\])[:/]/;

/** The suite drops and re-migrates its database. Refuse to aim that at anything remote. */
export function assertDisposableDb() {
  if (LOCAL_HOST.test(DB_URL) || process.env.WTP_ALLOW_REMOTE_DB === '1') return;
  throw new Error(
    `Refusing to run: WTP_DB_URL does not look local (${DB_URL.replace(/:[^:@]*@/, ':***@')}).\n`
    + 'This suite migrates and writes freely to that database. Set WTP_ALLOW_REMOTE_DB=1 only if '
    + 'it is genuinely disposable.',
  );
}

export const COMPOSE_FILE = path.join(here, 'docker-compose.yml');
