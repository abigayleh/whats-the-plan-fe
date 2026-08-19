import * as Sentry from '@sentry/react';

// No DSN (local dev, tests) means the SDK never starts, and every capture below is a no-op.
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;
  Sentry.init({
    dsn,
    // Injected by vite.config.js — the commit the bundle was built from, so uploaded
    // source maps for that release resolve the minified frames.
    release: __SENTRY_RELEASE__ || undefined,
    environment: import.meta.env.MODE,
  });
}

// For failures outside render — socket handlers, background refreshes — which no error
// boundary can ever see.
export function captureError(error, source) {
  Sentry.captureException(error, { tags: { source } });
}
