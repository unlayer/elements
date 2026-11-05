import { defineConfig, type Options } from 'tsup';

const shared: Options = {
  format: ['cjs', 'esm'],
  dts: {
    // Inline types from the private workspace package so consumers get full type completion without extra installs
    resolve: ['@unlayer-internal/elements-core'],
  },
  splitting: false,
  sourcemap: true,
  external: ['react', 'react-dom'],
  // The CommonJS build can load another module of react-dom's with the `require` it's loaded with; the module build
  // uses Node's (see src/utils/server-renderer.ts), so it has no stand-in for `require`.
  esbuildOptions(options, { format }) {
    options.define = { ...options.define, __UNLAYER_CJS__: String(format === 'cjs') };
  },
  // Bundle elements-core (the engine: the model, layout and the writers) into the output so consumers don't need to
  // install it separately (it's a private workspace package).
  noExternal: ['@unlayer-internal/elements-core'],
  treeshake: true,
};

export default defineConfig([
  { ...shared, entry: { primitives: 'src/primitives/index.ts' }, clean: true },
  { ...shared, entry: { builder: 'src/builder/index.ts' } },
]);
