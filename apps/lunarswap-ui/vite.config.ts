import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { viteCommonjs } from '@originjs/vite-plugin-commonjs';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import topLevelAwait from 'vite-plugin-top-level-await';
import wasm from 'vite-plugin-wasm';

/**
 * Vite/Rollup plugin that patches crypto-browserify's CJS output to include
 * timingSafeEqual (which crypto-browserify does not export).
 * Works by intercepting the resolved crypto-browserify module and appending
 * the timing-safe-equal browser implementation inline.
 */
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
    zkArtifact404(),
    // patchProofProviderPayload(), // Fixed upstream in midnight-js 4.0.2
    //patchGetKeyMaterial(),
    //atchZkConfigProvider(),
    //patchCryptoTimingSafeEqual(),
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
        // patch-proof-provider-payload-esbuild: removed — fixed upstream in midnight-js 4.0.2
    //     {
    //       name: 'patch-get-key-material-esbuild',
    //       setup(build) {
    //         build.onLoad(
    //           {
    //             filter:
    //               /midnight-js-http-client-proof-provider.*index\.(mjs|cjs|js)$/,
    //           },
    //           (args) => {
    //             let contents = readFileSync(args.path, 'utf8');
    //             if (!contents.includes('getKeyMaterial')) return null;
    //             contents = contents.replace(
    //               /catch\s*\{\s*\n?\s*return undefined;\s*\n?\s*\}/,
    //               `catch (err) {
    //     console.warn('[getKeyMaterial] No local key material for "' + keyLocation + '" — proof server will use built-in keys:', err?.message || err);
    //     return undefined;
    // }`,
    //             );
    //             // Also add success logging
    //             contents = contents.replace(
    //               'return zkConfigToProvingKeyMaterial(zkConfig);',
    //               `var material = zkConfigToProvingKeyMaterial(zkConfig);
    //     console.debug('[getKeyMaterial] OK for "' + keyLocation + '" — ir:', !!material?.ir, ', proverKey:', !!material?.proverKey);
    //     return material;`,
    //             );
    //             return { contents, loader: 'js' };
    //           },
    //         );
    //       },
    //     },
        {
          name: 'patch-zk-config-provider-esbuild',
          setup(build) {
            build.onLoad(
              {
                filter:
                  /midnight-js-fetch-zk-config-provider.*index\.(mjs|cjs|js)$/,
              },
              (args) => {
                let contents = readFileSync(args.path, 'utf8');
                if (!contents.includes('FetchZkConfigProvider')) return null;
                contents += `
    var _origSendRequest = FetchZkConfigProvider.prototype.sendRequest;
    FetchZkConfigProvider.prototype.sendRequest = async function(url, circuitId, ext, responseType) {
      var fullUrl = this.baseURL + '/' + url + '/' + circuitId + ext;
      var response = await this.fetchFunc(fullUrl, { method: 'GET' });
      if (!response.ok) throw new Error(response.statusText);
      var ct = (response.headers.get('content-type') || '').toLowerCase();
      if (responseType === 'arraybuffer' && ct.includes('text/html')) {
        throw new Error('Expected binary ZK artifact for ' + circuitId + ', got text/html (possible SPA fallback)');
      }
      if (responseType === 'text') return await response.text();
      var arrayBuffer = await response.arrayBuffer();
      var bytes = new Uint8Array(arrayBuffer);
      if (ext === '.bzkir' && bytes.length > 20) {
        var header = new TextDecoder().decode(bytes.subarray(0, 20));
        if (!header.startsWith('midnight:ir-source')) {
          throw new Error('Invalid ZKIR data for ' + circuitId + ': expected midnight:ir-source header, got: ' + JSON.stringify(header));
        }
      }
      return bytes;
    };`;
                return { contents, loader: 'js' };
              },
            );
          },
        },
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
    include: [
      'buffer',
      'vite-plugin-node-polyfills/shims/buffer',
    ],
  },
  resolve: {
    alias: {
      'vite-plugin-node-polyfills/shims/buffer': new URL(
        './node_modules/vite-plugin-node-polyfills/shims/buffer/dist/index.js',
        import.meta.url,
      ).pathname,
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
