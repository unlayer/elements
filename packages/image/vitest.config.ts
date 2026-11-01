import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: { jsx: "automatic" },
  test: {
    globals: true,
    environment: "node",
    // The visual check against Chromium: test:browser (vitest.browser.config.ts).
    include: ["test/*.test.{ts,tsx}"],
    testTimeout: 60000,
  },
});
