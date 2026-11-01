import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: { jsx: "automatic" },
  test: {
    globals: true,
    environment: "node",
    // The cross-check against the print HTML needs Chromium: test:browser (vitest.browser.config.ts).
    include: ["test/*.test.{ts,tsx}"],
    setupFiles: ["./test/setup.ts"],
    testTimeout: 60000,
  },
});
