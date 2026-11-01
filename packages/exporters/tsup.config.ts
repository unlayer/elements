import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: ['@unlayer-internal/elements-core'],
  // The writers' JSX writes strings (src/jsx.ts), not React elements.
  esbuildOptions(options) {
    options.jsxFactory = 'h';
    options.jsxFragment = 'Fragment';
  },
});
