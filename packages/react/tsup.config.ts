import { defineConfig, type Options } from 'tsup';

const shared: Options = {
  format: ['cjs', 'esm'],
  dts: {
    // Inline types from private workspace packages and their type deps
    // so consumers get full type completion without extra installs
    resolve: ['@unlayer-internal/shared-elements', '@unlayer-internal/elements-core', '@unlayer-internal/elements-exporters', '@unlayer/types'],
  },
  splitting: false,
  sourcemap: true,
  external: ['react', 'react-dom'],
  // The CommonJS build can load another module of react-dom's with the `require` it's loaded with; the module build
  // uses Node's (see src/utils/server-renderer.ts), so it has no stand-in for `require`.
  esbuildOptions(options, { format }) {
    options.define = { ...options.define, __UNLAYER_CJS__: String(format === 'cjs') };
  },
  // Bundle @unlayer-internal/shared-elements, elements-core and elements-exporters into the output so consumers
  // don't need to install it separately (it's a private workspace package).
  // Its own deps (Lexical) stay external via our dependencies.
  noExternal: ['@unlayer-internal/shared-elements', '@unlayer-internal/elements-core', '@unlayer-internal/elements-exporters'],
  treeshake: true,
};

export default defineConfig([
  { ...shared, entry: { index: 'src/index.ts', primitives: 'src/primitives/index.ts' }, clean: true },
  // toDesign() and fromDesign() import nothing of today's components (src/builder/imports.test.ts).
  { ...shared, entry: { builder: 'src/builder/index.ts' } },
]);
