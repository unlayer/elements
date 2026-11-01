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
  // React, Satori, resvg and Elements come from the project; the core's helpers are bundled.
  external: ["react", "satori", "@resvg/resvg-js", "@unlayer/react-elements"],
  noExternal: ["@unlayer-internal/elements-core"],
  esbuildOptions(options) {
    options.jsx = "automatic";
  },
});
