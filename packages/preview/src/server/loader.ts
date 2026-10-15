/**
 * Loads templates and renders them with the project's own Elements and React.
 *
 * Templates are loaded through Vite's SSR module loader with the project as its
 * root: TypeScript, JSX, tsconfig path aliases and imports of the project's
 * other files work as in the project, and packages (React, Elements) are loaded
 * from the project's node_modules. A virtual module re-exports the renderers
 * from the project's Elements, so the preview renders with exactly the
 * Elements and React the project sends with, never copies of its own.
 */

import { createServer, transformWithOxc, type Plugin, type ViteDevServer } from "vite";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { formatError, type TemplateError } from "./errors.js";
import type { ProjectInfo } from "./project.js";

const RENDER_MODULE = "virtual:elements-preview/render";
const RESOLVED_RENDER_MODULE = `\0${RENDER_MODULE}`;

export type RenderMode = "email" | "web" | "document";

export interface LogEntry {
  level: "error" | "warn" | "info" | "log";
  message: string;
}

export interface RenderedTemplate {
  ok: true;
  html: string;
  text: string;
  /** The design JSON the Unlayer builder opens, or null when it couldn't be made (see jsonError). */
  json: unknown;
  jsonError?: string;
  textError?: string;
  mode: RenderMode;
  logs: LogEntry[];
  durationMs: number;
  /** The template's `PreviewProps`, when it has them. */
  previewProps?: unknown;
  /** The props it rendered with. */
  props?: unknown;
}

export interface FailedTemplate {
  ok: false;
  error: TemplateError;
  logs: LogEntry[];
  durationMs: number;
  previewProps?: unknown;
}

export type RenderResult = RenderedTemplate | FailedTemplate;

export interface RenderOptions {
  /** Props to render with instead of the template's `PreviewProps`. */
  props?: unknown;
}

/** The mode a rendered document is in, from its shell (see Elements' document layouts). */
export function detectMode(html: string): RenderMode {
  if (/^\s*<!doctype html>/i.test(html)) return "web";
  if (/xmlns:v="urn:schemas-microsoft-com:vml"/.test(html)) return "email";
  return "document";
}

function renderModule(project: ProjectInfo): Plugin {
  return {
    name: "elements-preview:render",
    resolveId(id) {
      return id === RENDER_MODULE ? RESOLVED_RENDER_MODULE : undefined;
    },
    load(id) {
      if (id !== RESOLVED_RENDER_MODULE) return undefined;
      return [
        `import * as Elements from "@unlayer/react-elements";`,
        `import { createElement, isValidElement } from "react";`,
        // The async renderers resolve async components and <Tailwind> configs; older releases have only the sync ones.
        project.asyncEntry
          ? `export const loadAsyncRenderers = () => import(${JSON.stringify(project.asyncEntry)});`
          : `export const loadAsyncRenderers = undefined;`,
        `export { Elements, createElement, isValidElement };`,
      ].join("\n");
    },
  };
}

/** JSX in `.js` templates (React Email allows it): Vite only reads JSX in `.jsx` and `.tsx` files. */
function jsxInJs(): Plugin {
  return {
    name: "elements-preview:jsx-in-js",
    enforce: "pre",
    async transform(code, id) {
      if (!/\.m?js$/.test(id) || id.includes("/node_modules/") || !/<\/|\/>/.test(code)) return undefined;
      const result = await transformWithOxc(code, `${id}x`, { jsx: { runtime: "automatic" } });
      return { code: result.code, map: result.map };
    },
  };
}

function formatLogArg(arg: unknown): string {
  if (arg instanceof Error) return arg.message;
  if (typeof arg === "string") return arg;
  try {
    return JSON.stringify(arg);
  } catch {
    return String(arg);
  }
}

/** Runs `fn` with console output captured (Elements reports render problems through the console). */
async function captureConsole<T>(fn: () => Promise<T>): Promise<{ value: T; logs: LogEntry[] }> {
  const logs: LogEntry[] = [];
  const levels = ["error", "warn", "info", "log"] as const;
  const originals = Object.fromEntries(levels.map((level) => [level, console[level]])) as Record<(typeof levels)[number], (...args: unknown[]) => void>;
  for (const level of levels) {
    console[level] = (...args: unknown[]) => {
      // React formats its warnings with %s placeholders.
      let message = args.map(formatLogArg).join(" ");
      if (typeof args[0] === "string" && args[0].includes("%s")) {
        let i = 1;
        message = args[0].replace(/%[sdo]/g, () => formatLogArg(args[i++]));
      }
      // Each output renders the template again, so the same message can repeat.
      if (!logs.some((log) => log.level === level && log.message === message)) logs.push({ level, message });
    };
  }
  try {
    return { value: await fn(), logs };
  } finally {
    for (const level of levels) console[level] = originals[level];
  }
}

/**
 * An email with every block and the row options that change Elements' CSS
 * (layouts, device hiding), made with the project's Elements: the
 * compatibility check measures what Elements' own HTML uses with it.
 */
function referenceEmail(runtime: Record<string, any>): unknown {
  const { Elements: E, createElement: h } = runtime;
  const link = "https://example.com";
  const blocks = () => [
    h(E.Heading, { key: "h" }, "Heading"),
    h(E.Paragraph, { key: "p" }, "Paragraph"),
    h(E.Button, { key: "b", href: link }, "Button"),
    h(E.Image, { key: "i", src: `${link}/image.png`, alt: "Image" }),
    h(E.Divider, { key: "d" }),
    h(E.Menu, { key: "m", items: [{ text: "Home", href: link }] }),
    h(E.Social, { key: "s", icons: [{ name: "Facebook", url: link }] }),
    h(E.Table, { key: "t", headers: ["A", "B"], data: [["1", "2"]] }),
  ];
  const layouts = E.ColumnLayouts ?? {};
  return h(
    E.Email,
    { previewText: "Preview" },
    h(E.Row, { key: "one" }, h(E.Column, null, ...blocks())),
    h(E.Row, { key: "two", layout: layouts.TwoEqual }, h(E.Column, { key: 1 }, ...blocks()), h(E.Column, { key: 2 }, ...blocks())),
    h(E.Row, { key: "phone", hideOnDesktop: true }, h(E.Column, null, h(E.Paragraph, null, "Phone"))),
    h(E.Row, { key: "desktop", hideOnMobile: true }, h(E.Column, null, h(E.Paragraph, null, "Desktop")))
  );
}

export interface TemplateLoader {
  server: ViteDevServer;
  render(file: string, options?: RenderOptions): Promise<RenderResult>;
  /** The reference email (see referenceEmail) rendered to HTML with the project's Elements. */
  referenceHtml(): Promise<string>;
  /** Forget every loaded module, so the next render reads files again. */
  invalidate(): void;
  close(): Promise<void>;
}

export interface LoaderOptions {
  project: ProjectInfo;
  /** Watch files (the dev server); off for a one-off export. */
  watch: boolean;
  /** More Vite plugins for loading templates (e.g. to import SVGs, MDX or a custom file type). */
  plugins?: unknown[];
}

/**
 * The Vite plugins in a module (`--vite-plugins ./preview-plugins.js`): its
 * default export, an array of plugins or a function that returns one (or a
 * Promise of one).
 */
export async function loadVitePlugins(file: string): Promise<unknown[]> {
  const { pathToFileURL } = await import("node:url");
  const mod = await import(pathToFileURL(path.resolve(file)).href);
  const exported = mod.default ?? mod.plugins;
  const plugins = typeof exported === "function" ? await exported() : exported;
  if (!Array.isArray(plugins)) throw new Error(`${file} must export an array of Vite plugins (or a function that returns one) as its default export.`);
  return plugins.flat();
}

export async function createLoader({ project, watch, plugins = [] }: LoaderOptions): Promise<TemplateLoader> {
  const server = await createServer({
    root: project.root,
    configFile: false,
    envFile: false,
    logLevel: "silent",
    clearScreen: false,
    appType: "custom",
    server: {
      middlewareMode: true,
      hmr: false,
      ws: false,
      watch: watch ? { ignored: ["**/node_modules/**", "**/.git/**", "**/dist/**", "**/out/**", "**/.next/**"] } : null,
    },
    resolve: { tsconfigPaths: true },
    optimizeDeps: { noDiscovery: true, include: [] },
    plugins: [renderModule(project), jsxInJs(), ...(plugins as Plugin[])],
  });

  // One render at a time: renders capture the console, which is global.
  let queue: Promise<unknown> = Promise.resolve();

  async function renderNow(file: string, options: RenderOptions): Promise<RenderResult> {
    const started = performance.now();
    const elapsed = () => Math.round(performance.now() - started);
    let mod: Record<string, unknown>;
    let runtime: Record<string, any>;
    try {
      runtime = await server.ssrLoadModule(RENDER_MODULE);
      mod = await server.ssrLoadModule(file);
    } catch (error) {
      if (error instanceof Error) server.ssrFixStacktrace(error);
      return { ok: false, error: formatError(error, project.root, "load"), logs: [], durationMs: elapsed() };
    }
    const exported = mod.default as any;
    // A function component, or a memo/forwardRef one (an object), can carry PreviewProps.
    const previewProps = exported !== null && (typeof exported === "function" || typeof exported === "object") ? exported.PreviewProps : undefined;
    if (exported === undefined || exported === null) {
      return {
        ok: false,
        error: { message: "This file has no default export. Export the template: export default function Welcome() { … }", phase: "load", file: path.relative(project.root, file) },
        logs: [],
        durationMs: elapsed(),
      };
    }
    const props = options.props !== undefined ? options.props : previewProps;
    const { value, logs } = await captureConsole(async () => {
      try {
        const element = runtime.isValidElement(exported) ? exported : runtime.createElement(exported, (props ?? {}) as object);
        // Prefer the async renderers: they render async components and load the <Tailwind> configs a template uses.
        const renderers = runtime.loadAsyncRenderers ? await runtime.loadAsyncRenderers() : runtime.Elements;
        const html: string = await renderers.renderToHtml(element);
        let text = "";
        let textError: string | undefined;
        try {
          text = await renderers.renderToPlainText(element);
        } catch (error) {
          textError = formatError(error, project.root, "render").message;
        }
        let json: unknown = null;
        let jsonError: string | undefined;
        try {
          json = await renderers.renderToJson(element);
        } catch (error) {
          jsonError = formatError(error, project.root, "render").message;
        }
        return { ok: true as const, html, text, textError, json, jsonError };
      } catch (error) {
        if (error instanceof Error) {
          server.ssrFixStacktrace(error);
          if (error.cause instanceof Error) server.ssrFixStacktrace(error.cause);
        }
        return { ok: false as const, error: formatError(error, project.root, "render") };
      }
    });
    if (!value.ok) return { ok: false, error: value.error, logs, durationMs: elapsed(), previewProps };
    return {
      ...value,
      mode: detectMode(value.html),
      logs,
      durationMs: elapsed(),
      previewProps,
      props,
    };
  }

  function enqueue<T>(fn: () => Promise<T>): Promise<T> {
    const next = queue.then(fn);
    queue = next.catch(() => undefined);
    return next;
  }

  return {
    server,
    render: (file, options = {}) => enqueue(() => renderNow(file, options)),
    referenceHtml: () =>
      enqueue(async () => {
        const runtime = await server.ssrLoadModule(RENDER_MODULE);
        const { value } = await captureConsole(async () => runtime.Elements.renderToHtml(referenceEmail(runtime)) as string);
        return value;
      }),
    invalidate() {
      server.moduleGraph.invalidateAll();
    },
    close: () => server.close(),
  };
}

/** The template's source, for the code view. */
export async function readSource(file: string): Promise<string> {
  return readFile(file, "utf8").catch(() => "");
}
