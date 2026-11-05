import type { Preview } from '@storybook/react';

const preview: Preview = {
  // Every component has a page with its stories, each with its code ("Show code"), and each story its code in a panel.
  tags: ['autodocs'],
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    docs: {
      codePanel: true,
      source: {
        type: 'code',
      },
    },
  },
};

export default preview;
