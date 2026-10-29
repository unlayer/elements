/**
 * `@unlayer/react-elements/fizz-cleanup` outside Node (an edge runtime, a Worker, a browser, React Server Components),
 * and where a bundler doesn't read package.json's "exports" (webpack 4, Jest before 28: the package's `fizz-cleanup/`
 * folder): react-dom/server isn't loaded for it (see fizz-cleanup.node.ts), so contexts' values stay as React's renders
 * left them.
 */
export const cleanUp = (): boolean => false;
