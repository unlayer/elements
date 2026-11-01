import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  // The core's types inline, so the declarations need no private package.
  dts: { resolve: ["@unlayer-internal/elements-core"] },
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  // React, react-pdf and Elements come from the project; the core's helpers (page sizes, a document's pages) are bundled.
  external: ["react", "@react-pdf/renderer", "@unlayer/react-elements"],
  noExternal: ["@unlayer-internal/elements-core"],
  esbuildOptions(options) {
    options.jsx = "automatic";
  },
});
