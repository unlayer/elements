import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Run after `playwright install chromium` (see .github/workflows/test.yml): it fails, not skips, without a browser.
// Chromium measures the print HTML a Document's PDF is checked against (test/pdf/browser), and draws the HTML a
// Canvas's image is compared with (test/image/browser); the PDF and the image themselves are written without it.
export default defineConfig({
  esbuild: { jsx: 'automatic' },
  resolve: {
    // src/pdf and src/image import this package by name, as its users do: its main entry, here its source.
    alias: [{ find: /^@unlayer\/react-elements$/, replacement: fileURLToPath(new URL('./src/primitives/index.ts', import.meta.url)) }],
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['test/*/browser/*.test.{ts,tsx}'],
    // pdf.js reads the PDF (test/pdf/setup.ts polyfills what Node 20 lacks).
    setupFiles: ['./test/pdf/setup.ts'],
    testTimeout: 60000,
  },
});
