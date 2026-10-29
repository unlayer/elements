/**
 * Has react-dom's static renderer (renderToString's and renderToStaticMarkup's) put back what a render of its own left
 * in contexts' `_currentValue2`: one that failed or suspended inside a provider leaves its value there, which that
 * renderer puts back when its next render starts. So this renders nothing with it (see `defaultOf` in dispatcher.ts).
 *
 * Built on its own, as an ES module and CommonJS (dist/fizz-cleanup.node.js and .cjs), and imported as
 * `@unlayer/react-elements/fizz-cleanup`, which is this module in Node and fizz-cleanup.noop.ts everywhere else
 * (package.json's "exports"): bundled for an edge runtime, a Worker or a browser, react-dom/server is its browser
 * build, and React 19's opens a MessageChannel when it loads, which keeps Node running; in React Server Components it
 * throws when it loads. In Node, Elements loads react-dom/server anyway (@unlayer/exporters imports it), so this
 * imports it as any module does: a bundler bundles the app's own copy, and Vite can run it inlined (a CommonJS file
 * it can't). Deno gets the CommonJS one: its `import` of react-dom/server is the browser build, its `require` Node's.
 */
import * as server from "react-dom/server";

type Server = { renderToStaticMarkup?: (node: null) => string };

/** Whether react-dom's static renderer rendered: false where react-dom/server has no static renderer. */
export function cleanUp(): boolean {
  const loaded = server as Server & { default?: Server };
  const render = loaded.renderToStaticMarkup ?? loaded.default?.renderToStaticMarkup;
  if (typeof render !== "function") return false;
  render(null);
  return true;
}
