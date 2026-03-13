import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Force CJS entry for exporters — the ESM bundle has lodash resolution
      // issues under Vite's module resolution. CJS works via Vite's interop.
      '@unlayer-dev/exporters': path.resolve(
        __dirname,
        '../../node_modules/@unlayer-dev/exporters/index.cjs'
      ),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
  },
});
