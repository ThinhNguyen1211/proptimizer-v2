import { defineConfig } from 'vite';
import { resolve } from 'path';

/**
 * Vite Config for Content Script (Vanilla JS)
 * CRITICAL: Must output EXACTLY to dist/content.js
 */
export default defineConfig({
  plugins: [],
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  build: {
    outDir: 'dist',
    emptyOutDir: false, // Don't delete popup/background builds
    lib: {
      entry: resolve(__dirname, 'src/content/content-vanilla.js'),
      name: 'ProptimizerContent',
      formats: ['iife'],
      fileName: () => 'content', // Output: content.js
    },
    rollupOptions: {
      output: {
        extend: true,
        entryFileNames: 'content.js', // FORCE exact filename
        inlineDynamicImports: true, // Single file, no chunks
        assetFileNames: 'assets/[name].[ext]',
      },
    },
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});