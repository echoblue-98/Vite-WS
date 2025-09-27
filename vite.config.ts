import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Bundle optimization: split vendor & heavy libs for better caching and initial load
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'pdf': ['jspdf'],
        }
      }
    }
  }
});
