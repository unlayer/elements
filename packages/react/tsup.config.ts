import { defineConfig, type Options } from 'tsup';

const shared: Options = {
  format: ['cjs', 'esm'],
  dts: {
    // Inline types from the private workspace package so consumers get full type completion without extra installs
    // (its main entry and the PDF and image ones).
    resolve: [/^@unlayer-internal\/elements-core($|\/)/],
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

// PDF and image output are entries of their own, so the main entry and /builder load no engine and keep their size
// budgets. Each engine is an optional peer dependency, and each entry imports this package by name (src/pdf and
// src/image): left external, it's the main entry's `prepare()` and `ElementsError`, not a copy of them.
const output = (entry: string, engines: string[]): Options => ({
  ...shared,
  entry: { [entry]: `src/${entry}/index.ts` },
  external: [...(shared.external as string[]), ...engines, '@hyper-elements/react'],
});

export default defineConfig([
  { ...shared, entry: { primitives: 'src/primitives/index.ts' }, clean: true },
  { ...shared, entry: { builder: 'src/builder/index.ts' } },
  output('pdf', ['@react-pdf/renderer']),
  output('image', ['satori', '@resvg/resvg-js']),
]);
