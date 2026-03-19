import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: [
    'lexical',
    '@lexical/headless',
    '@lexical/html',
    '@lexical/link',
    '@lexical/list',
    '@lexical/rich-text',
    '@unlayer/exporters',
  ],
});
