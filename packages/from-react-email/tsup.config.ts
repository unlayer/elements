import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  target: "node20",
  platform: "node",
  dts: {
    // convert-core is a private workspace package: its types go in ours.
    resolve: ["@unlayer/convert-core"],
  },
  splitting: false,
  sourcemap: true,
  clean: true,
  noExternal: ["@unlayer/convert-core"],
  external: ["react", "react-dom", /^@react-email\//, "@unlayer/react-elements", "typescript", "prettier"],
});
