/** HTTP helpers the preview servers share: file types, files inside a folder, and localhost-only requests. */

import { statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import type { IncomingMessage, Server, ServerResponse } from "node:http";
import path from "node:path";

export const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".pdf": "application/pdf",
  ".txt": "text/plain; charset=utf-8",
};

export const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

export function json(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  res.end(JSON.stringify(body));
}

/** A file inside `root`, or undefined for paths that leave it. */
export function inside(root: string, relative: string): string | undefined {
  const file = path.resolve(root, `.${path.sep}${relative}`);
  return file.startsWith(path.resolve(root) + path.sep) ? file : undefined;
}

export async function sendFile(res: ServerResponse, file: string): Promise<boolean> {
  try {
    if (!statSync(file).isFile()) return false;
    const body = await readFile(file);
    res.writeHead(200, { "content-type": MIME[path.extname(file).toLowerCase()] ?? "application/octet-stream", "cache-control": "no-store" });
    res.end(body);
    return true;
  } catch {
    return false;
  }
}

export async function readBody(req: IncomingMessage, limit = 2_000_000): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > limit) throw new Error("Request body too large");
    chunks.push(chunk as Buffer);
  }
  const text = Buffer.concat(chunks).toString("utf8");
  return text ? JSON.parse(text) : {};
}

function hostName(host: string): string {
  return (host.startsWith("[") ? host.slice(0, host.indexOf("]") + 1) : host.split(":")[0]).toLowerCase();
}

/**
 * Whether a request is addressed to localhost (Host) and, when a browser sends
 * one, comes from a localhost page (Origin): other web pages can't use the API.
 */
export function requestAllowed(req: IncomingMessage): boolean {
  const host = req.headers.host;
  if (!host || !LOCAL_HOSTS.has(hostName(host))) return false;
  const origin = req.headers.origin;
  if (origin === undefined) return true;
  try {
    // An opaque origin ("null") throws here, and is refused.
    return LOCAL_HOSTS.has(hostName(new URL(origin).host));
  } catch {
    return false;
  }
}

function listen(server: Server, port: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const onError = (error: Error) => {
      server.off("listening", onListening);
      reject(error);
    };
    const onListening = () => {
      server.off("error", onError);
      resolve((server.address() as { port: number }).port);
    };
    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(port, "localhost");
  });
}

/** Listens on `first`, or (unless `strict`) the next free port after it; resolves with the port. */
export async function listenFrom(server: Server, first: number, strict: boolean): Promise<number> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await listen(server, first + attempt);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === "EADDRINUSE" && !strict && first !== 0 && attempt < 20) continue;
      throw code === "EADDRINUSE" ? new Error(`Port ${first + attempt} is in use. Pick another one: --port ${first + attempt + 1}`) : error;
    }
  }
}
