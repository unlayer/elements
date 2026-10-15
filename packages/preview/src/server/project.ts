/**
 * The project the templates belong to: its root, and the versions of Elements
 * and React it has installed. Templates render with the project's own copies,
 * so what the preview can do depends on them.
 */

import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

/** The oldest Elements the preview supports. Older releases render a template component with the wrong document shell. */
export const MINIMUM_ELEMENTS = "0.2.0";

export interface ProjectInfo {
  /** The folder with the project's package.json (where its packages resolve from). */
  root: string;
  elementsVersion?: string;
  reactVersion?: string;
  /** Whether the installed Elements has `@unlayer/react-elements/tailwind`. */
  tailwind: boolean;
  /**
   * The installed Elements' asynchronous renderers, which render async components and load
   * `<Tailwind>` configs: `@unlayer/react-elements/async`, or on releases before it, `/tailwind`.
   */
  asyncEntry?: "@unlayer/react-elements/async" | "@unlayer/react-elements/tailwind";
  /** Problems to show: Elements or React missing, or an Elements older than the minimum. */
  warnings: string[];
  /** Whether templates can render at all (Elements and React are installed). */
  canRender: boolean;
}

/** The nearest folder at or above `from` with a package.json, or `from` itself. */
export function findProjectRoot(from: string): string {
  let dir = path.resolve(from);
  for (;;) {
    if (existsSync(path.join(dir, "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return path.resolve(from);
    dir = parent;
  }
}

function readPackage(require: NodeRequire, name: string): { version?: string; exports?: unknown } | undefined {
  try {
    return JSON.parse(readFileSync(require.resolve(`${name}/package.json`), "utf8"));
  } catch {
    return undefined;
  }
}

/** -1, 0 or 1 as `a` is older than, the same as or newer than `b` (major.minor.patch, prerelease tags ignored). */
export function compareVersions(a: string, b: string): number {
  const parse = (v: string) => v.split("-")[0].split(".").map((n) => Number.parseInt(n, 10) || 0);
  const [x, y] = [parse(a), parse(b)];
  for (let i = 0; i < 3; i++) {
    if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) < (y[i] ?? 0) ? -1 : 1;
  }
  return 0;
}

export function inspectProject(templatesDir: string): ProjectInfo {
  const root = findProjectRoot(templatesDir);
  // Resolve from the templates folder, so a workspace package's own node_modules count.
  const require = createRequire(path.join(path.resolve(templatesDir), "noop.js"));
  const elements = readPackage(require, "@unlayer/react-elements");
  const react = readPackage(require, "react");
  const warnings: string[] = [];
  if (!elements) warnings.push("@unlayer/react-elements isn't installed in this project. Install it: npm install @unlayer/react-elements");
  if (!react) warnings.push("react isn't installed in this project. Install it: npm install react react-dom");
  if (elements?.version && compareVersions(elements.version, MINIMUM_ELEMENTS) < 0) {
    warnings.push(
      `This project has @unlayer/react-elements ${elements.version}. The preview needs ${MINIMUM_ELEMENTS} or later to render templates written as components correctly: npm install @unlayer/react-elements@latest`
    );
  }
  const exportsField = elements?.exports;
  const hasExport = (name: string) => Boolean(exportsField && typeof exportsField === "object" && name in (exportsField as Record<string, unknown>));
  const tailwind = hasExport("./tailwind");
  const asyncEntry = hasExport("./async") ? "@unlayer/react-elements/async" : tailwind ? "@unlayer/react-elements/tailwind" : undefined;
  return {
    root,
    elementsVersion: elements?.version,
    reactVersion: react?.version,
    tailwind,
    asyncEntry,
    warnings,
    canRender: Boolean(elements && react),
  };
}
