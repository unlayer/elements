import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  target: "node20",
  platform: "node",
  dts: {
    // convert-core is a private workspace package: its types go in ours.
    resolve: ["@unlayer/convert-core"],
    compilerOptions: {
      // Resolve the workspace source as part of this declaration build, so
      // its relative imports are bundled too.
      paths: { "@unlayer/convert-core": ["../convert-core/src/index.ts"] },
    },
  },
  splitting: false,
  sourcemap: true,
  clean: true,
  noExternal: ["entities", "parse5", "@unlayer/convert-core"],
  external: ["react", "react-dom", /^@react-email\//, "@unlayer/react-elements", "typescript", "prettier"],
});
