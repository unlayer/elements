import { coverageConfigDefaults, defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
    coverage: {
      exclude: [
        // Browser-run gate scripts (E2E, CSP probe, visual drift) — not unit-testable
        'scripts/**',
        // Storybook stories are exercised by the Storybook smoke/visual gates
        '**/*.stories.tsx',
        '**/*.fixture.tsx',
        // So are the frames two of them draw in; and the fixtures: designs in the new components, and the codemod's output
        'src/compat/SideBySide.tsx',
        'src/primitives/testing/examples.tsx',
        'src/primitives/testing/codemod-examples.tsx',
        ...coverageConfigDefaults.exclude,
      ],
    },
  },
});
