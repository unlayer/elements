/**
 * Has react-dom's static renderer (renderToString's and renderToStaticMarkup's) put back what a render of its own left
 * in contexts' `_currentValue2`: one that failed or suspended inside a provider leaves its value there, which that
 * renderer puts back when its next render starts. So this renders nothing with it (see `defaultOf` in dispatcher.ts).
 *
 * Built on its own (dist/fizz-cleanup.node.cjs) and imported as `@unlayer/react-elements/fizz-cleanup`, which is this
 * module in Node and fizz-cleanup.noop.ts everywhere else (package.json's "exports"): bundled for an edge runtime, a
 * Worker or a browser, react-dom/server is its browser build, and React 19's opens a MessageChannel when it loads,
 * which keeps Node running; in React Server Components it throws when it loads. It's required the first time it's
 * needed, with CommonJS's synchronous `require`, so importing Elements loads nothing more.
 */
declare const require: (id: string) => unknown;

type Server = { renderToStaticMarkup?: (node: null) => string };

let server: Server | null | undefined;

/** Whether react-dom's static renderer rendered: false where react-dom/server can't be loaded. */
export function cleanUp(): boolean {
  if (server === undefined) {
    try {
      server = require("react-dom/server") as Server;
    } catch {
      server = null;
    }
  }
  if (typeof server?.renderToStaticMarkup !== "function") return false;
  server.renderToStaticMarkup(null);
  return true;
}
