import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  // The writers' JSX writes strings (src/writers/jsx.ts), not React elements.
  esbuildOptions(options) {
    options.jsxFactory = 'h';
    options.jsxFragment = 'Fragment';
  },
});
