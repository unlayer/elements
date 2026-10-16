/**
 * `screenshot`: full-length PNGs of rendered templates, taken with a browser
 * already installed (see browser.ts), for a person or an agent to look at the
 * layout without opening the preview.
 *
 * Each template is rendered with its PreviewProps and served from a local
 * server with the templates folder's `static/` files, as in the preview, so
 * `/static/` images load. The page waits for its images and web fonts before
 * each shot. Dark mode is the preview's own simulation (shared/darkMode.ts),
 * loaded into the page. One page, one template and one shot at a time: a
 * browser rendering many large emails at once can load the GPU heavily.
 */

import { existsSync, statSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { DarkMode } from "../../shared/darkMode.js";
import { findBrowser, type FoundBrowser } from "./browser.js";
import { discoverTemplates, selectTemplates, unknownTemplatesMessage } from "./discover.js";
import { UsageError, type TemplateError } from "./errors.js";
import { inside, listenFrom, requestAllowed, sendFile } from "./http.js";
import { createLoader, type RenderMode } from "./loader.js";
import { assertDistinctOutputs } from "./outputs.js";
import { shown } from "./paths.js";
import { inspectProject } from "./project.js";

export type Variant = "desktop" | "phone" | "dark";

export const DESKTOP_WIDTH = 680;
export const PHONE_WIDTH = 375;
/** The dark mode `--dark` shows: the preview's default, where every color flips (the Gmail apps, Outlook.com). */
export const SCREENSHOT_DARK_MODE: Exclude<DarkMode, "off"> = "full";

/** The variants to take: desktop always, phone and dark when asked (`all`: both). */
export function screenshotVariants(options: { phone?: boolean; dark?: boolean; all?: boolean }): Variant[] {
  const variants: Variant[] = ["desktop"];
  if (options.phone || options.all) variants.push("phone");
  if (options.dark || options.all) variants.push("dark");
  return variants;
}

/** Where a template's screenshot goes: `<outDir>/<its path without the extension>.<variant>.png`. */
export function screenshotFile(outDir: string, template: string, variant: Variant): string {
  const base = template.slice(0, template.length - path.extname(template).length);
  return path.join(outDir, ...`${base}.${variant}.png`.split("/"));
}

/** Paper sizes in millimeters, short side first: the sizes Elements' Document takes. */
const PAGE_SIZES: Record<string, [number, number]> = {
  A3: [297, 420],
  A4: [210, 297],
  A5: [148, 210],
  Letter: [215.9, 279.4],
  Legal: [215.9, 355.6],
  Tabloid: [279.4, 431.8],
};

/** A Document's page width in CSS pixels (96 per inch), from its design JSON; A4 portrait, Elements' default, when it doesn't say. */
export function documentPageWidth(design: unknown): number {
  const values = (design as { body?: { values?: { documentSize?: string; documentOrientation?: string } } } | null | undefined)?.body?.values;
  const [short, long] = PAGE_SIZES[values?.documentSize ?? "A4"] ?? PAGE_SIZES.A4;
  return Math.round(((values?.documentOrientation === "landscape" ? long : short) / 25.4) * 96);
}

export interface ScreenshotOptions {
  /** The templates folder. */
  dir: string;
  /** The templates to take (see selectTemplates). */
  templates: string[];
  /** Default: `screenshots`. */
  outDir?: string;
  /** Default: desktop only. */
  variants?: Variant[];
  /** The desktop (and dark) width; default 680, or a Document's page width. */
  width?: number;
  /** The browser's executable (see findBrowser). */
  browser?: string;
  /** More Vite plugins for loading templates (see loadVitePlugins). */
  plugins?: unknown[];
  /** How long a page has to load its images and fonts (default 15 s). */
  timeoutMs?: number;
  /** Called with each screenshot written. */
  onScreenshot?(template: string, screenshot: Screenshot): void;
}

export interface Screenshot {
  variant: Variant;
  width: number;
  height: number;
  /** The PNG, from the working directory. */
  file: string;
}

export interface ScreenshotTemplate {
  path: string;
  ok: boolean;
  mode: RenderMode | null;
  screenshots: Screenshot[];
  /** Images that didn't load, or images and fonts still loading when a shot was taken. */
  warnings: string[];
  /** Why it has no screenshots (its file is from the working directory). */
  error?: TemplateError;
}

export interface ScreenshotResult {
  outDir: string;
  browser: FoundBrowser;
  templates: ScreenshotTemplate[];
  failed: number;
}

const DARK_MODE_PATH = "/__elements-preview/dark-mode.js";

/** The dark mode module for the page: dist/dark-mode.js, or, from the sources (the tests), shared/darkMode.ts compiled. */
async function darkModeScript(): Promise<string> {
  const built = fileURLToPath(new URL("./dark-mode.js", import.meta.url));
  if (existsSync(built)) return readFile(built, "utf8");
  const source = fileURLToPath(new URL("../../shared/darkMode.ts", import.meta.url));
  const { transformWithOxc } = await import("vite");
  return (await transformWithOxc(await readFile(source, "utf8"), source)).code;
}

interface PageServer {
  url: string;
  /** The HTML the page loads next. */
  html: string;
  close(): Promise<void>;
}

/** Serves the template being taken, the templates folder's static/ files and the dark mode module, on localhost. */
async function startPageServer(dir: string, darkMode: string): Promise<PageServer> {
  const pages: PageServer = { url: "", html: "", close: async () => undefined };
  const server = http.createServer(async (req, res) => {
    if (!requestAllowed(req)) {
      res.writeHead(403);
      return res.end();
    }
    const url = new URL(req.url ?? "/", "http://localhost");
    if (url.pathname === "/") {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
      return res.end(pages.html);
    }
    if (url.pathname === DARK_MODE_PATH) {
      res.writeHead(200, { "content-type": "text/javascript; charset=utf-8" });
      return res.end(darkMode);
    }
    if (url.pathname.startsWith("/static/")) {
      let relative: string | undefined;
      try {
        relative = decodeURIComponent(url.pathname.slice("/static/".length));
      } catch {
        relative = undefined;
      }
      const file = relative !== undefined ? inside(path.join(dir, "static"), relative) : undefined;
      if (file && (await sendFile(res, file))) return;
    }
    res.writeHead(404);
    res.end();
  });
  const port = await listenFrom(server, 0, true);
  pages.url = `http://localhost:${port}`;
  pages.close = () =>
    new Promise<void>((resolve) => {
      server.close(() => resolve());
      server.closeAllConnections();
    });
  return pages;
}

// Run in the page, as strings: a test runner's transforms can't reach them.
/**
 * Lazy images load now; resolves with whether images or fonts were still
 * loading after `ms`, and the images that didn't load.
 */
const WAIT_FOR_IMAGES_AND_FONTS = (ms: number) => `(async () => {
  for (const img of Array.from(document.images)) if (img.loading === "lazy") img.loading = "eager";
  const images = Array.from(document.images).filter((img) => !img.complete).map((img) => new Promise((resolve) => {
    img.addEventListener("load", resolve, { once: true });
    img.addEventListener("error", resolve, { once: true });
  }));
  const done = Promise.all([...images, document.fonts.ready]).then(() => false);
  const slow = await Promise.race([done, new Promise((resolve) => setTimeout(() => resolve(true), ${ms}))]);
  const broken = Array.from(document.images).filter((img) => img.complete && img.naturalWidth === 0 && img.getAttribute("src")).map((img) => img.getAttribute("src"));
  return { slow, broken: Array.from(new Set(broken)) };
})()`;

const APPLY_DARK_MODE = (url: string, mode: string) => `import(${JSON.stringify(url)}).then((m) => m.setDarkMode(document, ${JSON.stringify(mode)}))`;

/** A PNG's height, from its header. */
function pngHeight(png: Uint8Array): number {
  return Buffer.from(png.buffer, png.byteOffset, png.byteLength).readUInt32BE(20);
}

export async function takeScreenshots(options: ScreenshotOptions): Promise<ScreenshotResult> {
  const dir = path.resolve(options.dir);
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    throw new UsageError(`The templates folder ${shown(dir)} doesn't exist. Point the command at the folder with your templates: --dir ./emails`);
  }
  if (!options.templates.length) throw new UsageError("Name the templates to take: screenshot welcome.tsx (a folder of templates, or . for all of them).");
  const project = inspectProject(dir);
  if (!project.canRender) throw new UsageError(project.warnings.join("\n"));
  const all = await discoverTemplates(dir);
  const { selected, unknown } = selectTemplates(dir, options.templates, all);
  if (unknown.length) throw new UsageError(unknownTemplatesMessage(unknown, shown(dir), all));
  const variants = options.variants?.length ? options.variants : (["desktop"] as Variant[]);
  const outDir = path.resolve(options.outDir ?? "screenshots");
  assertDistinctOutputs(selected, (template) => variants.map((variant) => screenshotFile(outDir, template.path, variant)));
  const browser = findBrowser(options.browser);
  const timeoutMs = options.timeoutMs ?? 15_000;

  const { default: puppeteer } = await import("puppeteer-core");
  const loader = await createLoader({ project, watch: false, plugins: options.plugins });
  const server = await startPageServer(dir, await darkModeScript());
  const templates: ScreenshotTemplate[] = [];
  let instance: Awaited<ReturnType<typeof puppeteer.launch>> | undefined;
  try {
    try {
      instance = await puppeteer.launch({
        executablePath: browser.path,
        headless: true,
        // Colors as the template sets them, whatever the display's profile; root (a container) needs no sandbox.
        args: ["--hide-scrollbars", "--force-color-profile=srgb", ...(process.getuid?.() === 0 ? ["--no-sandbox"] : [])],
      });
    } catch (error) {
      throw new Error(`Couldn't start ${browser.path}: ${(error as Error).message.split("\n")[0]}. Pick another browser with --browser or CHROME_PATH.`);
    }
    const page = await instance.newPage();
    let loads = 0;
    for (const template of selected) {
      const result = await loader.render(path.join(dir, template.path));
      if (!result.ok) {
        // Its file from here, like the screenshots.
        const error = { ...result.error, file: result.error.file ? shown(path.resolve(project.root, result.error.file)) : undefined };
        templates.push({ path: template.path, ok: false, mode: null, screenshots: [], warnings: [], error });
        continue;
      }
      const entry: ScreenshotTemplate = { path: template.path, ok: true, mode: result.mode, screenshots: [], warnings: [] };
      templates.push(entry);
      const desktop = options.width ?? (result.mode === "document" ? documentPageWidth(result.json) : DESKTOP_WIDTH);
      try {
        for (const variant of variants) {
          const width = variant === "phone" ? PHONE_WIDTH : desktop;
          await page.setViewport({ width, height: variant === "phone" ? 812 : 900, deviceScaleFactor: 1 });
          server.html = result.html;
          let slow = false;
          try {
            await page.goto(`${server.url}/?load=${++loads}`, { waitUntil: "networkidle0", timeout: timeoutMs });
          } catch (error) {
            if ((error as Error).name !== "TimeoutError") throw error;
            slow = true;
          }
          const loaded = (await page.evaluate(WAIT_FOR_IMAGES_AND_FONTS(Math.min(timeoutMs, 10_000)))) as { slow: boolean; broken: string[] };
          const warnings = [
            ...(slow || loaded.slow ? [`Images or fonts were still loading after ${timeoutMs / 1000} s: the ${variant} screenshot may miss some.`] : []),
            ...loaded.broken.map((src) => `The image ${src} didn't load: the screenshot shows it broken.`),
          ];
          for (const warning of warnings) if (!entry.warnings.includes(warning)) entry.warnings.push(warning);
          if (variant === "dark") await page.evaluate(APPLY_DARK_MODE(`${server.url}${DARK_MODE_PATH}`, SCREENSHOT_DARK_MODE));
          const png = await page.screenshot({ type: "png", fullPage: true });
          const file = screenshotFile(outDir, template.path, variant);
          await mkdir(path.dirname(file), { recursive: true });
          await writeFile(file, png);
          const screenshot: Screenshot = { variant, width, height: pngHeight(png), file: shown(file) };
          entry.screenshots.push(screenshot);
          options.onScreenshot?.(template.path, screenshot);
        }
      } catch (error) {
        entry.ok = false;
        entry.error = { message: `Couldn't take the screenshot: ${(error as Error).message.split("\n")[0]}`, phase: "render" };
      }
    }
  } finally {
    await instance?.close().catch(() => undefined);
    await server.close();
    await loader.close();
  }
  return { outDir, browser, templates, failed: templates.filter((t) => !t.ok).length };
}
