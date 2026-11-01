import { defineConfig } from 'vitest/config';

export default defineConfig({
  // The writers' JSX writes strings (src/jsx.ts), not React elements.
  esbuild: { jsxFactory: 'h', jsxFragment: 'Fragment' },
  test: {
    globals: true,
    include: ['test/*.test.{ts,tsx}'],
  },
});
