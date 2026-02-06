import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@src': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: [
      // Archive tests referencing non-compiled contracts (.compact.archive)
      'src/archive/test/**',
    ],
    reporters: 'verbose',
  },
});
