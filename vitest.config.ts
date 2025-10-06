import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts', '**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['lib/calculations/**/*.ts'],
      exclude: ['node_modules', '.next', 'coverage', '**/*.test.ts', '**/*.spec.ts'],
      lines: 90,
      functions: 90,
      branches: 85,
      statements: 90,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
