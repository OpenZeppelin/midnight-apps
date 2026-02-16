import { resolve } from 'node:path';
import { viteCommonjs } from '@originjs/vite-plugin-commonjs';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import topLevelAwait from 'vite-plugin-top-level-await';
import wasm from 'vite-plugin-wasm';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/lunarswap/',
  cacheDir: './.vite',
  plugins: [
    nodePolyfills({
      include: ['crypto', 'fs', 'path', 'stream', 'util', 'buffer'],
      exclude: [],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      // Ensure crypto polyfill works correctly
      protocolImports: true,
    }),
    wasm(),
    react(),
    viteCommonjs(),
    topLevelAwait(),
  ],
  build: {
    target: 'esnext',
    minify: false,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        // Ensure proper handling of polyfilled modules
        format: 'es',
      },
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
    },
    include: ['buffer'],
  },
  resolve: {
    alias: {
      buffer: 'buffer',
      // Resolve vite-plugin-node-polyfills shims to actual polyfills
      'vite-plugin-node-polyfills/shims/buffer': 'buffer',
      'vite-plugin-node-polyfills/shims/crypto': 'crypto',
      'vite-plugin-node-polyfills/shims/fs': false,
      'vite-plugin-node-polyfills/shims/path': 'path',
      // Resolve @src imports from @openzeppelin/midnight-apps-contracts package
      '@src': resolve(__dirname, '../../contracts/dist'),
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
