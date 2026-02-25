import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { viteCommonjs } from '@originjs/vite-plugin-commonjs';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import topLevelAwait from 'vite-plugin-top-level-await';
import wasm from 'vite-plugin-wasm';

const require = createRequire(import.meta.url);

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
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
      'vite-plugin-node-polyfills/shims/buffer': require.resolve(
        'vite-plugin-node-polyfills/shims/buffer',
      ),
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
    // Dev-only: faucet proxy target by network. Set VITE_DEFAULT_NETWORK=preview for Preview (VITE_NETWORK is legacy).
    // Runtime source of truth for networks is config.json (loaded by RuntimeConfigurationProvider).
    proxy: (() => {
      const network =
        process.env.VITE_NETWORK ??
        process.env.VITE_DEFAULT_NETWORK ??
        'preprod';
      const faucetTargets: Record<string, string> = {
        preprod: 'https://faucet.preprod.midnight.network',
        preview: 'https://faucet.preview.midnight.network',
      };
      const target =
        faucetTargets[network] ?? 'https://faucet.preprod.midnight.network';
      return {
        '/faucet': {
          target,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/faucet/, ''),
          secure: true,
        },
      };
    })(),
  },
});
