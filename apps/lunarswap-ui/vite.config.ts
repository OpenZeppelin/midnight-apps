import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
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
/**
 * Returns 404 for missing ZK artifact files (/keys/*, /zkir/*, /shielded-token/*)
 * instead of letting Vite's SPA fallback serve index.html as 200 OK.
 * Without this, the SDK treats HTML as valid binary key data and corrupts proof payloads.
 */
/**
 * Patches proof provider: `body: payload.buffer` → `body: new Uint8Array(payload)`.
 * payload.buffer sends the entire WASM heap when payload is a view on WASM memory.
 */
function patchProofProviderPayload(): Plugin {
  return {
    name: 'patch-proof-provider-payload',
    transform(code, id) {
      if (
        !id.includes('midnight-js-http-client-proof-provider') ||
        !code.includes('payload.buffer')
      ) {
        return null;
      }
      return {
        code: code.replaceAll('payload.buffer', 'new Uint8Array(payload)'),
        map: null,
      };
    },
  };
}

function zkArtifact404(): Plugin {
  const zkPrefixes = ['/keys/', '/zkir/', '/shielded-token/'];
  return {
    name: 'zk-artifact-404',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0] ?? '';
        if (zkPrefixes.some((p) => url.startsWith(p))) {
          const filePath = join(__dirname, 'public', url);
          if (!existsSync(filePath)) {
            res.statusCode = 404;
            res.end('Not found');
            return;
          }
        }
        next();
      });
    },
  };
}

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
    // zkArtifact404(),
    // patchProofProviderPayload(),
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
      plugins: [
        // {
        //   name: 'patch-proof-provider-payload-esbuild',
        //   setup(build) {
        //     build.onLoad(
        //       {
        //         filter:
        //           /midnight-js-http-client-proof-provider.*index\.(mjs|cjs|js)$/,
        //       },
        //       (args) => {
        //         let contents = readFileSync(args.path, 'utf8');
        //         if (!contents.includes('payload.buffer')) return null;
        //         contents = contents.replaceAll(
        //           'payload.buffer',
        //           'new Uint8Array(payload)',
        //         );
        //         return { contents, loader: 'js' };
        //       },
        //     );
        //   },
        // },
        {
          name: 'patch-crypto-timingSafeEqual-esbuild',
          setup(build) {
            build.onLoad(
              { filter: /crypto-browserify[\\/]index\.js$/ },
              (args) => {
                let contents = readFileSync(args.path, 'utf8');
                if (contents.includes('timingSafeEqual')) return null;
                contents += `
;(function() {
  function timingSafeEqual(a, b) {
    if (a.length !== b.length) throw new TypeError('Input buffers must have the same length');
    var len = a.length, out = 0, i = -1;
    while (++i < len) out |= a[i] ^ b[i];
    return out === 0;
  }
  if (typeof exports !== 'undefined') { exports.timingSafeEqual = timingSafeEqual; }
  if (typeof module !== 'undefined' && module.exports) { module.exports.timingSafeEqual = timingSafeEqual; }
})();`;
                return { contents, loader: 'js' };
              },
            );
          },
        },
      ],
    },
    include: ['buffer', 'vite-plugin-node-polyfills/shims/buffer'],
  },
  resolve: {
    alias: {
      // 'vite-plugin-node-polyfills/shims/buffer': require.resolve(
      //   'vite-plugin-node-polyfills/shims/buffer',
      // ),
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
        // Temporary: proxy proof server requests to log payloads for debugging
        '/prove': {
          target: 'http://localhost:6300',
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq, req) => {
              const chunks: Buffer[] = [];
              req.on('data', (chunk: Buffer) => chunks.push(chunk));
              req.on('end', () => {
                const body = Buffer.concat(chunks);
                const header = body.subarray(0, 80).toString('utf8', 0, Math.min(80, body.length));
                console.log(`\n[PROOF-DEBUG] POST /prove — ${body.length} bytes`);
                console.log(`[PROOF-DEBUG] First 80 bytes (utf8): ${JSON.stringify(header)}`);
                console.log(`[PROOF-DEBUG] First 32 bytes (hex): ${body.subarray(0, 32).toString('hex')}`);
              });
            });
            proxy.on('proxyRes', (proxyRes) => {
              const chunks: Buffer[] = [];
              proxyRes.on('data', (chunk: Buffer) => chunks.push(chunk));
              proxyRes.on('end', () => {
                const body = Buffer.concat(chunks).toString('utf8');
                console.log(`[PROOF-DEBUG] /prove response ${proxyRes.statusCode}: ${body.substring(0, 200)}`);
              });
            });
          },
        },
        '/check': {
          target: 'http://localhost:6300',
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq, req) => {
              const chunks: Buffer[] = [];
              req.on('data', (chunk: Buffer) => chunks.push(chunk));
              req.on('end', () => {
                const body = Buffer.concat(chunks);
                const header = body.subarray(0, 80).toString('utf8', 0, Math.min(80, body.length));
                console.log(`\n[PROOF-DEBUG] POST /check — ${body.length} bytes`);
                console.log(`[PROOF-DEBUG] First 80 bytes (utf8): ${JSON.stringify(header)}`);
                console.log(`[PROOF-DEBUG] First 32 bytes (hex): ${body.subarray(0, 32).toString('hex')}`);
              });
            });
            proxy.on('proxyRes', (proxyRes) => {
              const chunks: Buffer[] = [];
              proxyRes.on('data', (chunk: Buffer) => chunks.push(chunk));
              proxyRes.on('end', () => {
                const body = Buffer.concat(chunks).toString('utf8');
                console.log(`[PROOF-DEBUG] /check response ${proxyRes.statusCode}: ${body.substring(0, 200)}`);
              });
            });
          },
        },
      };
    })(),
  },
});
