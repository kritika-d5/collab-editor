import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://collab_backend:4000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/yjs': {
        target: 'ws://collab_backend:4000',
        ws: true,
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://collab_backend:4000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
});