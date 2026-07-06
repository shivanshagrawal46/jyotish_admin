import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The admin is served by Express under /admin, so the app is built with that base.
// In dev, API and uploaded images are proxied to the Express server on :5000.
export default defineConfig({
  base: '/admin/',
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000',
      '/images': 'http://localhost:5000',
      '/uploads': 'http://localhost:5000',
    },
  },
});
