import tsconfigPaths from 'vitest-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: [
      // Archive tests referencing non-compiled contracts (.compact.archive)
      'src/archive/test/Bytes32.test.ts',
      'src/archive/test/Field254.test.ts',
      'src/archive/test/Uint256.test.ts',
    ],
    reporters: 'verbose',
  },
});
