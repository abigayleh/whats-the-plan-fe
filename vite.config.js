import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    css: false,
    clearMocks: true,
    restoreMocks: true,
    coverage: { provider: 'v8', reporter: ['text', 'html'], include: ['src/**/*.{js,jsx}'] },
  },
  build: {
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
})
