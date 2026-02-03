import { defineConfig } from 'vitest/config';

export default defineConfig({
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
