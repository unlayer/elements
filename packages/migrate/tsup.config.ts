import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/bin.ts", "src/cli.ts", "src/hooks.ts"],
  format: ["esm"],
  target: "node20",
  platform: "node",
  splitting: false,
  clean: true,
  // The converter is bundled; React, React Email, Elements, TypeScript,
  // Prettier and tsx stay external (resolved from the project first, see hooks.ts).
  noExternal: ["@unlayer/from-react-email", "@unlayer/convert-core"],
  // bin.ts registers the hooks before loading cli.js: keep that a runtime import.
  external: ["react", "react-dom", /^@react-email\//, "@unlayer/react-elements", "typescript", "prettier", /^tsx/, "./cli.js"],
  esbuildOptions(options) {
    options.jsx = "automatic";
  },
});
