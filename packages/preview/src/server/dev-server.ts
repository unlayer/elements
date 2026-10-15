/**
 * The preview server: the preview app, an API that lists and renders the
 * templates, live updates when a file changes, and the templates folder's
 * `static/` files.
 *
 * It listens on localhost only and answers only requests addressed to
 * localhost, so a web page can't reach it through another host name (DNS
 * rebinding): it runs the project's code.
 */

import { createHash } from "node:crypto";
import { existsSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import http, { type IncomingMessage, type ServerResponse } from "node:http";
import { inside, json, listenFrom, readBody, requestAllowed, sendFile } from "./http.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createChecks } from "./checks.js";
import { discoverTemplates, resolveTemplatePath, type TemplateEntry } from "./discover.js";
import { createLoader, readSource, type TemplateLoader } from "./loader.js";
import { inspectProject, type ProjectInfo } from "./project.js";

export interface DevServerOptions {
  /** The templates folder. */
  dir: string;
  /** The port to listen on. When it's taken, the next free one is used unless `strictPort` is set. */
  port?: number;
  strictPort?: boolean;
  /** Where the built preview app is (defaults to the one next to this file). */
  uiDir?: string;
  /** More Vite plugins for loading templates (see loadVitePlugins). */
  plugins?: unknown[];
  /** The Unlayer project the Editor view opens designs in (none: the editor's defaults). */
  projectId?: number;
}

export interface DevServer {
  url: string;
  port: number;
  project: ProjectInfo;
  close(): Promise<void>;
}

export function defaultUiDir(): string {
  return fileURLToPath(new URL("./ui/", import.meta.url));
}

export async function startDevServer(options: DevServerOptions): Promise<DevServer> {
  const dir = path.resolve(options.dir);
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    throw new Error(`The templates folder ${dir} doesn't exist. Point the preview at the folder with your templates: --dir ./emails`);
  }
  const uiDir = options.uiDir ?? defaultUiDir();
  const project = inspectProject(dir);
  const loader: TemplateLoader = await createLoader({ project, watch: true, plugins: options.plugins });
  const checks = createChecks(loader, dir);

  let templates: TemplateEntry[] = await discoverTemplates(dir);
  const events = new Set<ServerResponse>();
  const hashes = new Map<string, string>();

  function broadcast(event: string, data: unknown): void {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const res of events) res.write(payload);
  }

  // Changes: forget loaded modules, list templates again when files in the folder come or go, and tell the app.
  let pending: NodeJS.Timeout | undefined;
  const changed = new Set<string>();
  async function onFileEvent(event: string, file: string): Promise<void> {
    if (event === "change") {
      // Editors and macOS send several events for one save: skip those that didn't change the file.
      const content = await readFile(file).catch(() => undefined);
      const hash = content ? createHash("sha1").update(content).digest("hex") : "";
      if (hashes.get(file) === hash) return;
      hashes.set(file, hash);
    } else if (event === "unlink") {
      hashes.delete(file);
    }
    if (file.includes(`${path.sep}node_modules${path.sep}`)) checks.reset();
    changed.add(file);
    clearTimeout(pending);
    pending = setTimeout(async () => {
      const files = [...changed];
      changed.clear();
      loader.invalidate();
      const inDir = files.filter((f) => f.startsWith(dir + path.sep));
      if (inDir.length) templates = await discoverTemplates(dir);
      broadcast("change", {
        files: files.map((f) => path.relative(dir, f)),
        templates,
      });
    }, 40);
  }
  loader.server.watcher.add(dir);
  loader.server.watcher.on("all", (event, file) => {
    void onFileEvent(event, path.resolve(file));
  });

  async function handleApi(req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> {
    if (url.pathname === "/api/meta") {
      return json(res, 200, {
        dir: path.relative(process.cwd(), dir) || ".",
        root: project.root,
        elementsVersion: project.elementsVersion,
        reactVersion: project.reactVersion,
        tailwind: project.tailwind,
        warnings: project.warnings,
        projectId: options.projectId,
      });
    }
    if (url.pathname === "/api/templates") return json(res, 200, { templates });
    if (url.pathname === "/api/events") {
      res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-store", connection: "keep-alive" });
      res.write("retry: 1000\n\n");
      events.add(res);
      const keepAlive = setInterval(() => res.write(": keep-alive\n\n"), 20_000);
      req.on("close", () => {
        clearInterval(keepAlive);
        events.delete(res);
      });
      return;
    }
    if ((url.pathname === "/api/render" || url.pathname === "/api/compat" || url.pathname === "/api/links") && req.method === "POST") {
      let body: { path?: string; props?: unknown };
      try {
        body = (await readBody(req)) as typeof body;
      } catch (error) {
        return json(res, 400, { error: String((error as Error).message) });
      }
      const file = body.path ? resolveTemplatePath(dir, body.path) : undefined;
      if (!file || !templates.some((t) => t.path === body.path)) return json(res, 404, { error: `No template ${body.path}` });
      if (!project.canRender) return json(res, 200, { ok: false, logs: [], durationMs: 0, error: { message: project.warnings.join("\n"), phase: "load" } });
      const result = await loader.render(file, { props: body.props });
      if (url.pathname === "/api/render") {
        return json(res, 200, { ...result, source: await readSource(file) });
      }
      if (!result.ok) return json(res, 200, { applicable: false, reason: "The template doesn't render." });
      if (url.pathname === "/api/links") return json(res, 200, await checks.links(result));
      return json(res, 200, await checks.compat(result, await readSource(file)));
    }
    return json(res, 404, { error: "Not found" });
  }

  const server = http.createServer(async (req, res) => {
    try {
      if (!requestAllowed(req)) {
        res.writeHead(403, { "content-type": "text/plain" });
        return res.end("The preview server only answers requests from localhost.");
      }
      const url = new URL(req.url ?? "/", "http://localhost");
      if (url.pathname.startsWith("/api/")) return await handleApi(req, res, url);
      if (req.method !== "GET" && req.method !== "HEAD") {
        res.writeHead(405);
        return res.end();
      }
      // The templates folder's static/ files, as React Email's preview serves them: <img src="/static/logo.png">.
      if (url.pathname.startsWith("/static/")) {
        const file = inside(path.join(dir, "static"), decodeURIComponent(url.pathname.slice("/static/".length)));
        if (file && (await sendFile(res, file))) return;
        res.writeHead(404, { "content-type": "text/plain" });
        return res.end("Not found");
      }
      const asset = url.pathname !== "/" ? inside(uiDir, decodeURIComponent(url.pathname.slice(1))) : undefined;
      if (asset && (await sendFile(res, asset))) return;
      // Anything else is a page of the app (/preview/<template>).
      if (await sendFile(res, path.join(uiDir, "index.html"))) return;
      res.writeHead(500, { "content-type": "text/plain" });
      res.end("The preview app isn't built. Run the package's build first.");
    } catch (error) {
      if (!res.headersSent) json(res, 500, { error: String((error as Error)?.message ?? error) });
      else res.end();
    }
  });

  let port: number;
  try {
    port = await listenFrom(server, options.port ?? 3000, options.strictPort ?? false);
  } catch (error) {
    // Close the loader too, or its file watcher keeps the process alive.
    await loader.close();
    throw error;
  }

  return {
    url: `http://localhost:${port}`,
    port,
    project,
    async close() {
      clearTimeout(pending);
      for (const res of events) res.end();
      events.clear();
      const closed = new Promise<void>((resolve) => server.close(() => resolve()));
      server.closeAllConnections();
      await closed;
      await loader.close();
    },
  };
}

