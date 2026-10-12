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
  // The MessageChannel files around react-dom/server.browser's import stay files of their own, imported in order
  // (see src/utils/server-renderer.ts): bundled, their code would run after it.
  external: ['react', 'react-dom', /message-channel-(unref|restore)\.cjs$/],
  onSuccess: 'cp src/utils/message-channel-unref.cjs src/utils/message-channel-restore.cjs dist/',
  // Bundle @unlayer-internal/shared-elements into the output so consumers
  // don't need to install it separately (it's a private workspace package).
  // Its own deps (Lexical, exporters) stay external via our dependencies.
  noExternal: ['@unlayer-internal/shared-elements'],
  treeshake: true,
});
