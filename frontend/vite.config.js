import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api/transcribe': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/api/users': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/api/notation': {
        target: 'http://localhost:3002',
        changeOrigin: true
      },
      '/api/conversion': {
        target: 'http://localhost:3002',
        changeOrigin: true
      },
      '/api/analysis': {
        target: 'http://localhost:3002',
        changeOrigin: true
      }
    }
  },
  optimizeDeps: {
    include: ['tone', 'vexflow', 'alphatab', '@tonejs/midi']
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'music-libs': ['tone', 'vexflow', 'alphatab', '@tonejs/midi'],
          'ui-libs': ['lucide-svelte'],
          'utils': ['axios', 'socket.io-client']
        }
      }
    }
  }
});