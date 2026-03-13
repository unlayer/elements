import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: {
    // Inline types from private workspace packages and their type deps
    // so consumers get full type completion without extra installs
    resolve: ['@unlayer-internal/shared-elements', '@unlayer/types'],
  },
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom'],
  // Bundle @unlayer-internal/shared-elements into the output so consumers
  // don't need to install it separately (it's a private workspace package).
  // Its own deps (Lexical, exporters) stay external via our dependencies.
  noExternal: ['@unlayer-internal/shared-elements'],
  treeshake: true,
});
