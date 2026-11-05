import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: { jsx: "automatic" },
  // Elements 0.2's components: no package exports them from 0.3.0, so the react package's internal build stands in.
  resolve: { alias: [{ find: /^@unlayer\/react-elements\/legacy$/, replacement: fileURLToPath(new URL("../react/dist/index.js", import.meta.url)) }] },
  test: {
    environment: "node",
    testTimeout: 30000,
  },
});
