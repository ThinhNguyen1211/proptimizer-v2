import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/index.html'),
        content: resolve(__dirname, 'src/content/index.tsx'),
        background: resolve(__dirname, 'src/background/index.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          // Keep content script as content.js
          return chunkInfo.name === 'content' ? '[name].js' : '[name].js';
        },
        chunkFileNames: '[name].js',
        assetFileNames: (assetInfo) => {
          // Extract content CSS to assets/content.css
          if (assetInfo.name === 'content.css') {
            return 'assets/[name].[ext]';
          }
          return '[name].[ext]';
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});