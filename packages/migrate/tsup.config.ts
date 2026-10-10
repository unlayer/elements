import { defineConfig } from "tsup";

const cli = defineConfig({
  entry: ["src/bin.ts", "src/cli.ts", "src/hooks.ts"],
  format: ["esm"],
  target: "node20",
  platform: "node",
  splitting: false,
  // The library entry builds in parallel: keep its output when cleaning the CLI.
  clean: ["!react-email.*"],
  // The converter is bundled; React, React Email, Elements, TypeScript,
  // Prettier and tsx stay external (resolved from the project first, see hooks.ts).
  noExternal: ["entities", "parse5", "@unlayer/from-react-email", "@unlayer/convert-core"],
  // bin.ts registers the hooks before loading cli.js: keep that a runtime import.
  external: ["react", "react-dom", /^@react-email\//, "@unlayer/react-elements", "typescript", "prettier", /^tsx/, "./cli.js"],
  esbuildOptions(options) {
    options.jsx = "automatic";
  },
});

const reactEmail = defineConfig({
  entry: ["src/react-email.ts"],
  format: ["esm", "cjs"],
  target: "node20",
  platform: "node",
  dts: {
    resolve: ["@unlayer/from-react-email", "@unlayer/convert-core"],
    compilerOptions: {
      // Omit source banners that name the internal converter package.
      removeComments: true,
      paths: {
        "@unlayer/from-react-email": ["../from-react-email/src/index.ts"],
        "@unlayer/convert-core": ["../convert-core/src/index.ts"],
      },
    },
  },
  splitting: false,
  sourcemap: true,
  clean: false,
  noExternal: ["entities", "parse5", "@unlayer/from-react-email", "@unlayer/convert-core"],
  external: ["react", "react-dom", /^@react-email\//, "@unlayer/react-elements", "typescript", "prettier"],
  esbuildOptions(options) {
    options.jsx = "automatic";
  },
});

export default defineConfig([cli, reactEmail]);
