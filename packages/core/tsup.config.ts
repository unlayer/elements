import { defineConfig, type Options } from 'tsup';

const shared: Options = {
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  treeshake: true,
  external: ['react', '@react-pdf/renderer', 'satori', '@resvg/resvg-js'],
  // The writers' JSX writes strings (src/writers/jsx.ts), not React elements.
  esbuildOptions(options) {
    options.jsxFactory = 'h';
    options.jsxFragment = 'Fragment';
  },
};

// The main entry never imports an engine. The PDF and image entries do (react-pdf; Satori and resvg): they are
// `@hyper-elements/react/pdf` and `/image`'s writers, and nothing else imports them. One build for each entry, so
// each one's declarations are complete in its own files: a build with several entries shares types through a chunk
// file (`resolve-*.d.ts`) that a package bundling these declarations (`@hyper-elements/react`) doesn't follow.
export default defineConfig([
  { ...shared, entry: { index: 'src/index.ts' }, clean: true },
  { ...shared, entry: { pdf: 'src/pdf/index.ts' } },
  { ...shared, entry: { image: 'src/image/index.ts' } },
]);
