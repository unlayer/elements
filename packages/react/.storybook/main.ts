import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  // The gallery's images, drawn from code: its templates load them from `gallery/…`, beside the story's page.
  staticDirs: [{ from: '../src/primitives/examples/gallery/assets', to: '/gallery' }],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-onboarding',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
};

export default config;
