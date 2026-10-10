const { getJestConfig } = require("@storybook/test-runner");

module.exports = {
  ...getJestConfig(),
  // Keep Storybook from treating other workspace packages' Vitest snapshots as obsolete.
  roots: [__dirname + "/src"],
};
