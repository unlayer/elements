import { defineConfig } from 'tsup';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export default defineConfig([{
  // The other entries ("@unlayer/react-elements/tailwind", …) import the main one by its name, so all share one copy
  // of Elements. Each keeps what only it needs out of the main entry: `tailwindcss` (an optional peer dependency,
  // loaded when it's first asked for), Markdown's parser and the code highlighter (built in: see noExternal).
  // `codegen` (a design as Elements code) is pure: no React, no Node APIs, and nothing from the main entry.
  entry: { index: 'src/index.ts', tailwind: 'src/tailwind/index.ts', font: 'src/font/index.tsx', head: 'src/head/index.tsx', code: 'src/code/index.ts', markdown: 'src/markdown/index.ts', async: 'src/async/index.ts', codegen: 'src/codegen/index.ts' },
  format: ['cjs', 'esm'],
  dts: {
    // Inline types from private workspace packages and their type deps
    // so consumers get full type completion without extra installs
    resolve: ['@unlayer-internal/shared-elements', '@unlayer/types'],
  },
  splitting: false,
  sourcemap: true,
  // (Not `@unlayer/react-elements/fizz-cleanup`'s modules, which the two builds below write at the same time.)
  clean: ['!fizz-cleanup.*'],
  // (`@unlayer/react-elements/fizz-cleanup` too, the package's export that the runtime loading Elements picks:
  // react-dom/server's static renderer in Node, nothing elsewhere; see src/engine/fizz-cleanup.node.ts.)
  external: ['react', 'react-dom', '@unlayer/react-elements'],
  esbuildPlugins: [
    {
      // `import text from "…?raw"`: the file's text, built in (Tailwind's default theme, as Vite reads it in tests).
      name: 'raw',
      setup(build) {
        // The path as written (with its `?raw`, which tsup's CSS plugin, for paths ending in .css, leaves alone; and no
        // folder of the machine that built it in the bundle), the file in pluginData.
        build.onResolve({ filter: /\?raw$/ }, (args) => ({ path: args.path, namespace: 'raw', pluginData: require.resolve(args.path.slice(0, -4), { paths: [args.resolveDir] }) }));
        build.onLoad({ filter: /\?raw$/, namespace: 'raw' }, async (args) => ({ contents: await readFile(args.pluginData, 'utf8'), loader: 'text' }));
      },
    },
  ],
  // Bundle @unlayer-internal/shared-elements into the output so consumers
  // don't need to install it separately (it's a private workspace package).
  // Its own deps (Lexical, exporters) stay external via our dependencies.
  // marked and highlight.js are built into the Markdown and code entries (their licenses in THIRD_PARTY_LICENSES.md):
  // nothing more to install, the same code in every module system (marked is ESM-only), and highlight.js's
  // languages beyond the ones built in aren't downloaded by everyone who installs Elements.
  noExternal: ['@unlayer-internal/shared-elements', /\?raw$/, 'marked', /^highlight\.js/],
  treeshake: true,
},
// `@unlayer/react-elements/fizz-cleanup`'s modules, Node's and the one for every other runtime, each in both formats
// (the CommonJS build requires them, also where a runtime can't require an ES module: Jest's jsdom, an older Node
// under react-server; and Vite can't run a CommonJS file it inlines).
{ entry: { 'fizz-cleanup.node': 'src/engine/fizz-cleanup.node.ts' }, format: ['esm', 'cjs'], sourcemap: true, clean: false, external: ['react-dom'] },
{ entry: { 'fizz-cleanup.noop': 'src/engine/fizz-cleanup.noop.ts' }, format: ['esm', 'cjs'], sourcemap: true, clean: false }]);
