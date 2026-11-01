import { defineConfig } from "vitest/config";

// Run after `playwright install chromium` (see .github/workflows/test.yml): it fails, not skips, without a browser.
// Chromium draws the Canvas's HTML the image is compared with; the image itself is written without it.
export default defineConfig({
  esbuild: { jsx: "automatic" },
  test: {
    globals: true,
    environment: "node",
    include: ["test/browser/*.test.{ts,tsx}"],
    testTimeout: 60000,
  },
});
