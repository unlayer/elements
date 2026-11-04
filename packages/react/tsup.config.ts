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
  {
    ...shared,
    entry: { builder: 'src/builder/index.ts' },
    // toDesign() and fromDesign() read today's components while a template is collected: what draws one rendered
    // through React, and all it reaches, isn't called here (roundtrip.test.tsx fails if it is).
    esbuildPlugins: [
      {
        name: 'no-render-path-in-builder',
        setup(build) {
          build.onLoad({ filter: /[\\/]compat[\\/]render\.ts$/ }, () => ({
            contents: `const none = () => { throw new Error("[Unlayer] @unlayer/react-elements/builder doesn't render today's components: use renderToHtml from @unlayer/react-elements"); };
              export const onItsOwn = none;
              export const renderThroughNewEngine = none;`,
            loader: 'ts',
          }));
        },
      },
    ],
  },
]);
