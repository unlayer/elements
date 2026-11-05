import { coverageConfigDefaults, defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
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
  },
});
