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
export const API_URL = 'http://localhost:4001';
export const APP_URL = 'http://localhost:5174';

// Fixed, obviously-fake secrets: these only ever sign tokens for a throwaway database.
export const backendEnv = {
  DATABASE_URL: DB_URL,
  DIRECT_URL: DB_URL,
  PORT: '4001',
  CORS_ORIGIN: APP_URL,
  JWT_ACCESS_SECRET: 'e2e-access-secret',
  JWT_REFRESH_SECRET: 'e2e-refresh-secret',
  E2E_AUTO_VERIFY: '1',
  RESEND_API_KEY: '', // unset → lib/email.js warns and sends nothing
};

export const COMPOSE_FILE = path.join(here, 'docker-compose.yml');
