import { execSync } from 'node:child_process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'

// Sentry releases are named after the commit, so an event points at the exact source.
// COMMIT_REF is what the CI host exposes; the git call covers local builds.
function releaseName() {
  if (process.env.SENTRY_RELEASE) return process.env.SENTRY_RELEASE
  if (process.env.COMMIT_REF) return process.env.COMMIT_REF
  try {
    return execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    return ''
  }
}

// https://vite.dev/config/
export default defineConfig(({ command, isSsrBuild }) => {
  const release = command === 'build' ? releaseName() : ''
  // Client build only: the SSR pass would start a second upload for the same release and
  // its cleanup can delete the client's maps mid-flight. Without a token (every local
  // build) the plugin is left out entirely, so nothing is uploaded.
  const uploadSourcemaps = command === 'build' && !isSsrBuild && Boolean(process.env.SENTRY_AUTH_TOKEN)
  return {
    plugins: [
      react(),
      uploadSourcemaps && sentryVitePlugin({
        org: process.env.SENTRY_ORG || 'whatstheplaninc',
        project: process.env.SENTRY_PROJECT || 'whats-the-plan-fe',
        authToken: process.env.SENTRY_AUTH_TOKEN,
        release: { name: release },
        // Uploaded, then removed from dist — the debug ids in the bundle still tie the
        // maps to it, so nothing is ever served publicly.
        sourcemaps: { filesToDeleteAfterUpload: ['./dist/**/*.map'] },
      }),
    ].filter(Boolean),
    define: { __SENTRY_RELEASE__: JSON.stringify(release) },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/test/setup.js',
      // e2e/ holds Playwright specs, which match Vitest's default include glob.
      exclude: ['e2e/**', '**/node_modules/**', 'dist/**'],
      css: false,
      clearMocks: true,
      restoreMocks: true,
      coverage: { provider: 'v8', reporter: ['text', 'html'], include: ['src/**/*.{js,jsx}'] },
    },
    build: isSsrBuild
      // `vite build --ssr <entry>` compiles the landing page to a module Node can import, which
      // is what scripts/prerender.js renders to static HTML. Intermediate output, never shipped.
      ? { outDir: '.prerender', copyPublicDir: false }
      : {
        // 'hidden' emits the maps without a sourceMappingURL comment: browsers never ask
        // for them, but Sentry can still resolve frames from the uploaded copies.
        sourcemap: 'hidden',
        rollupOptions: {
          output: {
            // Keep the rarely-changing framework code in its own chunk so it stays
            // cached across app deploys and page chunks stay small.
            manualChunks(id) {
              if (id.includes('node_modules/socket.io-client')) return 'socket';
              if (/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(id)) return 'vendor';
              return undefined;
            },
          },
        },
      },
  }
})
