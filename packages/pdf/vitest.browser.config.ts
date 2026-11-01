import { defineConfig } from "vitest/config";

// Run after `playwright install chromium` (see .github/workflows/test.yml): it fails, not skips, without a browser.
// Chromium measures the print HTML the PDF is checked against; the PDF itself is written without it.
export default defineConfig({
  esbuild: { jsx: "automatic" },
  test: {
    globals: true,
    environment: "node",
    include: ["test/browser/*.test.{ts,tsx}"],
    setupFiles: ["./test/setup.ts"],
    testTimeout: 60000,
  },
});
