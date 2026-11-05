import { defineConfig } from 'vitest/config';

// Run after `playwright install chromium` (see .github/workflows/test.yml): it fails, not skips, without a browser.
export default defineConfig({
  // The writers' JSX writes strings (src/writers/jsx.ts), not React elements.
  esbuild: { jsxFactory: 'h', jsxFragment: 'Fragment' },
  test: {
    globals: true,
    include: ['test/browser/*.test.ts'],
    testTimeout: 60000,
  },
});
