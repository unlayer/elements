/**
 * `@unlayer/react-elements/fizz-cleanup` where a bundler or runtime names React Server Components (`react-server`), a
 * browser, a Worker or an edge runtime (`browser`, `worker`, `workerd`, `edge-light`), and where a bundler doesn't read
 * package.json's "exports" (webpack 4, Jest before 28: the package's `fizz-cleanup/` folder): react-dom/server isn't
 * loaded for it (see fizz-cleanup.node.ts), so contexts' values stay as React's renders left them.
 */
export const cleanUp = (): boolean => false;
