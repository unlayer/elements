/**
 * `build`: the preview as static files to share, e.g. with teammates who
 * review emails without running the project. Every template is rendered with
 * its PreviewProps and checked (compatibility, and links and images as far as
 * the HTML shows), and the app reads those results instead of a server. Host
 * the folder anywhere (any static host, any path), or run `start`.
 *
 * What a static preview can't do: render with other props, update live, or
 * request the URLs in the emails.
 */

import { existsSync, statSync } from "node:fs";
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { createChecks } from "./checks.js";
import { defaultUiDir } from "./dev-server.js";
import { discoverTemplates } from "./discover.js";
import { inside, listenFrom, requestAllowed, sendFile } from "./http.js";
import { createLoader, readSource } from "./loader.js";
import { inspectProject } from "./project.js";
import type { TemplateError } from "./errors.js";

export interface BuildOptions {
  dir: string;
  /** Default: `.elements-preview`. */
  outDir?: string;
  uiDir?: string;
  /** Vite plugins for loading templates (see LoaderOptions.plugins). */
  plugins?: unknown[];
  /** The Unlayer project the Editor view opens designs in (none: the editor's defaults). */
  projectId?: number;
}

export interface BuildResult {
  outDir: string;
  templates: number;
  failed: Array<{ template: string; error: TemplateError }>;
}

/** Where a template's data goes: its path as folders, so any static host serves it. */
function dataFile(outDir: string, kind: string, template: string): string {
  return path.join(outDir, "api", kind, ...template.split("/")) + ".json";
}

async function writeJson(file: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(value));
}

/** /static/ URLs relative to the page, so the build works under any path. */
function relativeStatic(html: string): string {
  return html.replace(/(\s(?:src|href|background)=["'])\/static\//g, "$1./static/").replace(/url\((["']?)\/static\//g, "url($1./static/");
}

export async function buildPreview(options: BuildOptions): Promise<BuildResult> {
  const dir = path.resolve(options.dir);
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    throw new Error(`The templates folder ${dir} doesn't exist. Point the build at the folder with your templates: --dir ./emails`);
  }
  const outDir = path.resolve(options.outDir ?? ".elements-preview");
  if (dir === outDir || dir.startsWith(outDir + path.sep)) throw new Error(`The output folder ${outDir} holds the templates. Pick another one: --outDir .elements-preview`);
  const uiDir = options.uiDir ?? defaultUiDir();
  if (!existsSync(path.join(uiDir, "index.html"))) throw new Error("The preview app isn't built. Run the package's build first.");
  const project = inspectProject(dir);
  if (!project.canRender) throw new Error(project.warnings.join("\n"));

  const templates = await discoverTemplates(dir);
  const loader = await createLoader({ project, watch: false, plugins: options.plugins });
  const checks = createChecks(loader, dir);
  const failed: BuildResult["failed"] = [];
  try {
    await mkdir(outDir, { recursive: true });
    // The app, with relative asset paths and a flag that tells it to read the files written here.
    await cp(uiDir, outDir, { recursive: true });
    const index = (await readFile(path.join(uiDir, "index.html"), "utf8"))
      .replace(/(src|href)="\/assets\//g, '$1="./assets/')
      .replace("</head>", '  <script>window.__ELEMENTS_PREVIEW_STATIC__ = true;</script>\n  </head>');
    await writeFile(path.join(outDir, "index.html"), index);

    await writeJson(path.join(outDir, "api", "meta.json"), {
      dir: path.relative(project.root, dir) || ".",
      elementsVersion: project.elementsVersion,
      reactVersion: project.reactVersion,
      tailwind: project.tailwind,
      warnings: project.warnings,
      projectId: options.projectId,
      static: true,
      builtAt: new Date().toISOString(),
    });
    await writeJson(path.join(outDir, "api", "templates.json"), { templates });

    for (const template of templates) {
      const file = path.join(dir, template.path);
      const source = await readSource(file);
      const result = await loader.render(file);
      if (!result.ok) {
        failed.push({ template: template.path, error: result.error });
        await writeJson(dataFile(outDir, "render", template.path), { ...result, source });
        continue;
      }
      await writeJson(dataFile(outDir, "render", template.path), { ...result, html: relativeStatic(result.html), source });
      await writeJson(dataFile(outDir, "compat", template.path), await checks.compat(result, source));
      await writeJson(dataFile(outDir, "links", template.path), await checks.links(result, { network: false }));
    }
    const staticDir = path.join(dir, "static");
    if (existsSync(staticDir)) await cp(staticDir, path.join(outDir, "static"), { recursive: true });
  } finally {
    await loader.close();
  }
  return { outDir, templates: templates.length, failed };
}

export interface StaticServer {
  url: string;
  close(): Promise<void>;
}

/** `start`: serves a build on localhost. */
export async function startStaticServer(options: { outDir?: string; port?: number; strictPort?: boolean }): Promise<StaticServer> {
  const outDir = path.resolve(options.outDir ?? ".elements-preview");
  if (!existsSync(path.join(outDir, "index.html")) || !existsSync(path.join(outDir, "api", "meta.json"))) {
    throw new Error(`There's no preview build in ${outDir}. Build one first: ${process.env.ELEMENTS_PREVIEW_COMMAND || "elements-preview"} build`);
  }
  const server = http.createServer(async (req, res) => {
    if (!requestAllowed(req)) {
      res.writeHead(403, { "content-type": "text/plain" });
      return res.end("This preview only answers requests from localhost.");
    }
    const url = new URL(req.url ?? "/", "http://localhost");
    let relative: string;
    try {
      relative = decodeURIComponent(url.pathname).replace(/^\/+/, "") || "index.html";
    } catch {
      res.writeHead(400);
      return res.end();
    }
    const file = inside(outDir, relative);
    if (file && (await sendFile(res, file))) return;
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("Not found");
  });
  const port = await listenFrom(server, options.port ?? 3000, options.strictPort ?? false);
  return {
    url: `http://localhost:${port}`,
    close: () =>
      new Promise<void>((resolve) => {
        server.close(() => resolve());
        server.closeAllConnections();
      }),
  };
}
