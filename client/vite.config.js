import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Static (GitHub Pages) build: `VITE_STATIC=true vite build --base=/hello-world/`
// Local full-stack build/dev: base `/`, proxy /api to the Express server.
export default defineConfig(({ mode }) => ({
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
}));
