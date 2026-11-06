import { fileURLToPath } from 'node:url';
import { coverageConfigDefaults, defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

/** What each of src/pdf's and src/image's tests (test/pdf, test/image) runs in: Node, with these files' own timeout. */
const output = (name: string) => ({
  extends: true as const,
  test: {
    name,
    environment: 'node' as const,
    globals: true,
    // The cross-check against Chromium needs a browser: test:browser (vitest.browser.config.ts).
    include: [`test/${name}/*.test.{ts,tsx}`],
    ...(name === 'pdf' ? { setupFiles: ['./test/pdf/setup.ts'] } : {}),
    testTimeout: 60000,
  },
});

export default defineConfig({
  plugins: [react()],
  resolve: {
    // src/pdf and src/image (and their tests) import this package by name, as its users do: its main entry, here its source.
    alias: [{ find: /^@unlayer\/react-elements$/, replacement: fileURLToPath(new URL('./src/primitives/index.ts', import.meta.url)) }],
  },
  test: {
    coverage: {
      exclude: [
        // Browser-run gate scripts (E2E, CSP probe, visual drift) — not unit-testable
        'scripts/**',
        // Storybook stories are exercised by the Storybook smoke/visual gates
        '**/*.stories.tsx',
        // So are the frames they draw in; and the fixtures: designs in the new components, and the codemod's output
        'src/stories/SideBySide.tsx',
        'src/primitives/testing/examples.tsx',
        'src/primitives/testing/codemod-examples.tsx',
        ...coverageConfigDefaults.exclude,
      ],
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'react',
          environment: 'jsdom',
          globals: true,
          include: ['src/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
        },
      },
      output('pdf'),
      output('image'),
    ],
  },
});
