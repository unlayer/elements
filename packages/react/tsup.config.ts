import { defineConfig, type Options } from 'tsup';

const shared: Options = {
  format: ['cjs', 'esm'],
  dts: {
    // Inline types from the private workspace packages so consumers get full type completion without extra installs
    resolve: ['@unlayer-internal/elements-core', '@unlayer-internal/elements-exporters'],
  },
  splitting: false,
  sourcemap: true,
  external: ['react', 'react-dom'],
  // The CommonJS build can load another module of react-dom's with the `require` it's loaded with; the module build
  // uses Node's (see src/utils/server-renderer.ts), so it has no stand-in for `require`.
  esbuildOptions(options, { format }) {
    options.define = { ...options.define, __UNLAYER_CJS__: String(format === 'cjs') };
  },
  // Bundle elements-core and elements-exporters into the output so consumers don't need to install them separately
  // (they're private workspace packages).
  noExternal: ['@unlayer-internal/elements-core', '@unlayer-internal/elements-exporters'],
  treeshake: true,
};

export default defineConfig([
  { ...shared, entry: { primitives: 'src/primitives/index.ts' }, clean: true },
  { ...shared, entry: { builder: 'src/builder/index.ts' } },
]);
