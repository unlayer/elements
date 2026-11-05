import { fileURLToPath } from "node:url";
import { defineConfig } from "tsup";

/** Elements 0.2's components: the react package's internal build, which it doesn't publish (src/todays.ts). */
const TODAYS_BUILD = fileURLToPath(new URL("../react/dist/index.js", import.meta.url));
/** Bundles `@unlayer/react-elements/legacy` from that build, where it isn't left to the module hooks. */
const todaysInline = {
  name: "todays-inline",
  setup(build: { onResolve: (options: { filter: RegExp }, callback: () => { path: string }) => void }) {
    build.onResolve({ filter: /^@unlayer\/react-elements\/legacy$/ }, () => ({ path: TODAYS_BUILD }));
  },
};

const cli = defineConfig({
  entry: ["src/bin.ts", "src/start.ts", "src/cli.ts", "src/hooks.ts"],
  format: ["esm"],
  target: "node20",
  platform: "node",
  splitting: false,
  // The library entries build in parallel: keep their output when cleaning the CLI.
  clean: ["!react-email.*", "!elements.*", "!todays.*"],
  // The converter is bundled; React, React Email, Elements, TypeScript,
  // Prettier and tsx stay external (resolved from the project first, see hooks.ts).
  noExternal: ["entities", "parse5", "@unlayer/from-react-email", "@unlayer/convert-core"],
  // bin.ts checks the Node.js version before loading start.js, which registers the hooks before loading cli.js: keep
  // those runtime imports.
  external: ["react", "react-dom", /^@react-email\//, "@unlayer/react-elements", "typescript", "prettier", /^tsx/, "./cli.js", "./start.js"],
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
    resolve: ["@unlayer/from-react-email", "@unlayer/convert-core"],
    compilerOptions: {
      // Omit source banners that name the internal converter package.
      removeComments: true,
      paths: {
        "@unlayer/from-react-email": ["../from-react-email/src/index.ts"],
        "@unlayer/convert-core": ["../convert-core/src/index.ts"],
        "@unlayer/react-elements/legacy": ["../react/dist/index.d.ts"],
      },
    },
  },
  splitting: false,
  sourcemap: true,
  clean: false,
  noExternal: ["entities", "parse5", "@unlayer/from-react-email", "@unlayer/convert-core", /^@unlayer\/react-elements\/legacy$/],
  external: ["react", "react-dom", /^@react-email\//, "@unlayer/react-elements", "typescript", "prettier"],
  // A library run has no module hooks to map today's components: they're bundled into it.
  esbuildPlugins: [todaysInline],
  esbuildOptions(options) {
    options.jsx = "automatic";
  },
});

/**
 * Migrate's copy of today's components (dist/todays.js), one module that the CLI's converter and the templates it
 * checks both load through the module hooks (src/hooks.ts), as the CLI keeps `@unlayer/react-elements/legacy` external.
 */
const todays = defineConfig({
  entry: ["src/todays.ts"],
  format: ["esm"],
  target: "node20",
  platform: "node",
  splitting: false,
  clean: false,
  noExternal: [/^@unlayer\/react-elements\/legacy$/],
  external: ["react", "react-dom"],
  esbuildPlugins: [todaysInline],
});

export default defineConfig([cli, reactEmail, todays]);
