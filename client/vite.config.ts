import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(), // This enables path aliases from tsconfig.json
  ],
  server: {
    port: 3000,
    open: true,
    proxy: {
      // proxy carto basemap requests to bypass cors restrictions
      '/basemaps': {
        target: 'https://basemaps.cartocdn.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/basemaps/, ''),
      },
      '/tiles': {
        target: 'https://tiles-a.basemaps.cartocdn.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tiles/, ''),
      },
    },
  },
  build: {
    outDir: 'build',
    sourcemap: true,
  },
  envPrefix: 'VITE_', // Vite standard env variable prefix
});
