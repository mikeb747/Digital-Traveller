import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  build: {
    // Renamed from the default "dist" so electron-builder can't filter it out
    outDir: 'web-build',
  },
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
    proxy: {
      '/api/feature-permissions': {
        target: 'https://spd-apps/FeaturePermissions',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/feature-permissions/, ''),
        secure: false, // allow internal corporate self-signed certs
      },
    },
  },
});
