import { defineConfig } from "tsup";

const cli = defineConfig({
  entry: ["src/bin.ts", "src/start.ts", "src/cli.ts", "src/hooks.ts"],
  format: ["esm"],
  target: "node20",
  platform: "node",
  splitting: false,
  // The library entries build in parallel: keep their output when cleaning the CLI.
  clean: ["!react-email.*", "!elements.*"],
  // The converters (src/react-email, src/convert) and their parsers are bundled; React, React Email, Elements,
  // TypeScript, Prettier and tsx stay external (resolved from the project first, see hooks.ts).
  noExternal: ["entities", "parse5"],
  // bin.ts checks the Node.js version before loading start.js, which registers the hooks before loading cli.js: keep
  // those runtime imports.
  external: ["react", "react-dom", /^@react-email\//, /^@unlayer\/react-elements(\/|$)/, "typescript", "prettier", /^tsx/, "./cli.js", "./start.js"],
  esbuildOptions(options) {
    options.jsx = "automatic";
  },
});

const reactEmail = defineConfig({
  entry: ["src/react-email.ts", "src/elements.ts"],
  format: ["esm", "cjs"],
  target: "node20",
  platform: "node",
  dts: {
    compilerOptions: {
      // Omit the converters' source comments: banners and notes about their internals.
      removeComments: true,
    },
  },
  splitting: false,
  sourcemap: true,
  clean: false,
  noExternal: ["entities", "parse5"],
  // Elements (its components and /builder) is the project's: a peer dependency.
  external: ["react", "react-dom", /^@react-email\//, /^@unlayer\/react-elements(\/|$)/, "typescript", "prettier"],
  esbuildOptions(options) {
    options.jsx = "automatic";
  },
});

export default defineConfig([cli, reactEmail]);
