import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { viteCommonjs } from '@originjs/vite-plugin-commonjs';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import topLevelAwait from 'vite-plugin-top-level-await';
import wasm from 'vite-plugin-wasm';

const require = createRequire(import.meta.url);

/**
 * Vite/Rollup plugin that patches crypto-browserify's CJS output to include
 * timingSafeEqual (which crypto-browserify does not export).
 * Works by intercepting the resolved crypto-browserify module and appending
 * the timing-safe-equal browser implementation inline.
 */
function patchCryptoTimingSafeEqual(): Plugin {
  return {
    name: 'patch-crypto-timingSafeEqual',
    transform(code, id) {
      // Match the crypto-browserify entry (CJS or ESM wrapper)
      if (!id.includes('crypto-browserify') || !id.endsWith('index.js')) {
        return null;
      }
      // If timingSafeEqual is already exported, skip
      if (code.includes('timingSafeEqual')) {
        return null;
      }
      // Append a browser-safe timingSafeEqual to the exports
      const patch = `
;(function() {
  function timingSafeEqual(a, b) {
    if (a.length !== b.length) throw new TypeError('Input buffers must have the same length');
    var len = a.length, out = 0, i = -1;
    while (++i < len) out |= a[i] ^ b[i];
    return out === 0;
  }
  if (typeof exports !== 'undefined') {
    exports.timingSafeEqual = timingSafeEqual;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports.timingSafeEqual = timingSafeEqual;
  }
})();
`;
      return { code: code + patch, map: null };
    },
  };
}

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
      protocolImports: true,
    }),
    patchCryptoTimingSafeEqual(),
    wasm(),
    react(),
    viteCommonjs(),
    topLevelAwait(),
  ],
  build: {
    target: 'esnext',
    minify: false,
    // Emit source maps so stack traces resolve to app and package source (not just App-xxx.js)
    sourcemap: true,
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
