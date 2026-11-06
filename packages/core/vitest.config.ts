import { defineConfig } from 'vitest/config';

export default defineConfig({
  // The writers' JSX writes strings (src/writers/jsx.ts), not React elements.
  esbuild: { jsxFactory: 'h', jsxFragment: 'Fragment' },
  test: {
    globals: true,
    // The writers' widths in Chromium: test:browser (vitest.browser.config.ts).
    include: ['test/*.test.ts', 'test/writers/*.test.{ts,tsx}'],
  },
});
