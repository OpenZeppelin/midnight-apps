import { resolve } from 'node:path';
import { viteCommonjs } from '@originjs/vite-plugin-commonjs';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import topLevelAwait from 'vite-plugin-top-level-await';
import wasm from 'vite-plugin-wasm';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/lunarswap/',
  cacheDir: './.vite',
  build: {
    target: 'esnext',
    minify: false,
  },
  plugins: [wasm(), react(), viteCommonjs(), topLevelAwait()],

  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
    },
    include: ['buffer'],
  },
  resolve: {
    alias: {
      buffer: 'buffer',
      '@/components': resolve(__dirname, './components'),
      '@/lib': resolve(__dirname, './lib'),
      '@/hooks': resolve(__dirname, './hooks'),
      '@/providers': resolve(__dirname, './providers'),
      '@/utils': resolve(__dirname, './utils'),
      '@/types': resolve(__dirname, './types'),
      '@/app': resolve(__dirname, './app'),
    },
  },
  define: {
    global: 'globalThis',
  },
  server: {
    proxy: {
      '/faucet': {
        target: 'https://faucet.testnet-02.midnight.network',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/faucet/, ''),
        secure: true,
      },
    },
  },
});
