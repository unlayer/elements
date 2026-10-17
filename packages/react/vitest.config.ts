import { coverageConfigDefaults, defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // The other entries import the main one (and each other) by the package's name (see tsup.config.ts): their sources here.
    alias: [
      { find: /^@unlayer\/react-elements$/, replacement: fileURLToPath(new URL('./src/index.ts', import.meta.url)) },
      ...['tailwind', 'code', 'markdown', 'async', 'codegen'].map((entry) => ({ find: new RegExp(`^@unlayer/react-elements/${entry}$`), replacement: fileURLToPath(new URL(`./src/${entry}/index.ts`, import.meta.url)) })),
      { find: /^@unlayer\/react-elements\/font$/, replacement: fileURLToPath(new URL('./src/font/index.tsx', import.meta.url)) },
      { find: /^@unlayer\/react-elements\/head$/, replacement: fileURLToPath(new URL('./src/head/index.tsx', import.meta.url)) },
    ],
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    // Tailwind's default theme, which the Tailwind entry builds in (`?raw`): its text (Vitest empties CSS otherwise).
    css: { include: [/tailwindcss\/theme\.css/] },
    globals: true,
    coverage: {
      exclude: [
        // Browser-run gate scripts (E2E, CSP probe, visual drift) — not unit-testable
        'scripts/**',
        // Storybook stories are exercised by the Storybook smoke/visual gates
        '**/*.stories.tsx',
        ...coverageConfigDefaults.exclude,
      ],
    },
  },
});
