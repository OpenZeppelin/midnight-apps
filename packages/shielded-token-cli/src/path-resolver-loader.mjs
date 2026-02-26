// Custom ESM loader wrapper that resolves @src path aliases and delegates to ts-node/esm

import { existsSync } from 'node:fs';
import { resolve as resolvePath } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Get the absolute path to contracts/dist
const __filename = fileURLToPath(import.meta.url);
const __dirname = resolvePath(__filename, '..');
const contractsDistPath = resolvePath(__dirname, '../../../contracts/dist');

// Import ts-node/esm loader
const tsNodeLoader = await import('ts-node/esm');

// Wrap ts-node's resolve hook
export async function resolve(specifier, context, nextResolve) {
  // Resolve @src/* imports to contracts/dist/*
  if (specifier.startsWith('@src/')) {
    const relativePath = specifier.replace('@src/', '');
    let resolvedPath = resolvePath(contractsDistPath, relativePath);

    // Try with .js extension if not present
    if (!existsSync(resolvedPath) && !resolvedPath.endsWith('.js')) {
      const withJs = `${resolvedPath}.js`;
      if (existsSync(withJs)) {
        resolvedPath = withJs;
      }
    }

    return {
      shortCircuit: true,
      url: pathToFileURL(resolvedPath).href,
    };
  }

  // Delegate to ts-node's resolve hook
  if (tsNodeLoader.resolve) {
    return tsNodeLoader.resolve(specifier, context, nextResolve);
  }

  // Fallback to default resolution
  return nextResolve(specifier, context);
}

// Delegate other hooks to ts-node
export const load = tsNodeLoader.load;
export const getFormat = tsNodeLoader.getFormat;
export const transformSource = tsNodeLoader.transformSource;
