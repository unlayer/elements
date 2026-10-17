import { defineConfig } from "vite";

// The preview app: built into dist/ui, which the preview server serves.
// `pnpm dev:ui` runs it against a preview server on port 3000 (start one with `elements-preview dev`).
export default defineConfig({
  root: "ui",
  base: "/",
  build: {
    outDir: "../dist/ui",
    emptyOutDir: true,
    assetsDir: "assets",
  },
  server: {
    proxy: { "/api": "http://localhost:3000", "/static": "http://localhost:3000" },
  },
});
