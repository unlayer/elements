/**
 * Another copy of React than the tests' (with its react-dom), as a second install or a bundler gives one: Next.js's
 * App Router renders with react-dom's React, and Elements' components in a route handler or a Server Component call
 * React Server Components' own. Copied into a temporary folder (a link would resolve back to the same files) and
 * loaded with Node's require, so nothing the tests import shares it.
 */
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";

// One for the test file (it's loaded again after `vi.resetModules()`).
const COPY = Symbol.for("@unlayer/react-elements/test-react-copy");

export function reactCopy(): (id: "react" | "react-dom/server") => any {
  const shared = globalThis as Record<symbol, string | undefined>;
  let dir = shared[COPY];
  if (!dir) {
    dir = shared[COPY] = fs.mkdtempSync(path.join(os.tmpdir(), "elements-react-copy-"));
    const own = createRequire(import.meta.url);
    for (const name of ["react", "react-dom"]) {
      fs.cpSync(path.dirname(fs.realpathSync(own.resolve(`${name}/package.json`))), path.join(dir, "node_modules", name), { recursive: true });
    }
  }
  return createRequire(path.join(dir, "index.js"));
}

/** The copy's folder taken away, once the test file is done with it (what it loaded stays loaded). */
export function removeReactCopy(): void {
  const shared = globalThis as Record<symbol, string | undefined>;
  if (shared[COPY]) fs.rmSync(shared[COPY], { recursive: true, force: true });
  shared[COPY] = undefined;
}
