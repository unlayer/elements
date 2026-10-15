/** The preview server's API, as the app uses it. */

export interface TemplateEntry {
  path: string;
  name: string;
}

export interface Meta {
  dir: string;
  root?: string;
  /** A static build (no server): no live updates, no other props, no URL requests. */
  static?: boolean;
  builtAt?: string;
  elementsVersion?: string;
  reactVersion?: string;
  tailwind: boolean;
  warnings: string[];
  /** The Unlayer project the Editor view opens designs in (`--project-id`); none: the editor's defaults. */
  projectId?: number;
}

export interface LogEntry {
  level: "error" | "warn" | "info" | "log";
  message: string;
}

export interface TemplateError {
  message: string;
  file?: string;
  line?: number;
  column?: number;
  frame?: string;
  stack?: string;
  phase: "load" | "render";
}

export type RenderMode = "email" | "web" | "document";

export interface RenderOk {
  ok: true;
  html: string;
  text: string;
  json: unknown;
  jsonError?: string;
  textError?: string;
  mode: RenderMode;
  logs: LogEntry[];
  durationMs: number;
  previewProps?: unknown;
  props?: unknown;
  source: string;
}

export interface RenderFailed {
  ok: false;
  error: TemplateError;
  logs: LogEntry[];
  durationMs: number;
  previewProps?: unknown;
  source?: string;
}

export type RenderResponse = RenderOk | RenderFailed;

export interface CompatIssue {
  feature: string;
  url?: string;
  support: "none" | "partial";
  source: "template" | "elements";
  clients: Array<{ client: string; label: string; support: "none" | "partial"; notes: string[] }>;
  locations: Array<{ block: string; line?: number }>;
  sourceLines?: number[];
}

export type CompatResponse =
  | { applicable: true; issues: CompatIssue[]; templateCount: number; checkedClients: string[]; durationMs: number }
  | { applicable: false; reason: string };

export interface LinkFinding {
  kind: "link" | "image" | "email";
  level: "error" | "warning" | "info";
  url: string;
  message: string;
  block?: string;
  label?: string;
  status?: number;
}

export type LinksResponse =
  | { applicable: true; findings: LinkFinding[]; links: number; images: number; network: boolean; durationMs: number }
  | { applicable: false; reason: string };

/** Whether this is a static build of the preview (see `elements-preview build`). */
export const STATIC = (window as unknown as { __ELEMENTS_PREVIEW_STATIC__?: boolean }).__ELEMENTS_PREVIEW_STATIC__ === true;

/**
 * Where the preview is: the server's address, or the folder a static build is
 * hosted in (its static/ folder sits next to index.html, under any path).
 */
export function previewRoot(): string {
  return STATIC ? new URL("./", window.location.href).href : `${window.location.origin}/`;
}

/** A template's data file in a static build: api/<kind>/<path>.json. */
function staticFile(kind: string, path: string): string {
  return `./api/${kind}/${path.split("/").map(encodeURIComponent).join("/")}.json`;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error ?? `${res.status} ${res.statusText}`);
  return res.json();
}

export const api = STATIC
  ? {
      meta: (): Promise<Meta> => getJson("./api/meta.json"),
      templates: (): Promise<{ templates: TemplateEntry[] }> => getJson("./api/templates.json"),
      render: (path: string): Promise<RenderResponse> => getJson(staticFile("render", path)),
      compat: (path: string): Promise<CompatResponse> => getJson(staticFile("compat", path)),
      links: (path: string): Promise<LinksResponse> => getJson(staticFile("links", path)),
    }
  : {
      meta: (): Promise<Meta> => getJson("/api/meta"),
      templates: (): Promise<{ templates: TemplateEntry[] }> => getJson("/api/templates"),
      render: (path: string, props?: unknown): Promise<RenderResponse> => post("/api/render", { path, props }),
      compat: (path: string, props?: unknown): Promise<CompatResponse> => post("/api/compat", { path, props }),
      links: (path: string, props?: unknown): Promise<LinksResponse> => post("/api/links", { path, props }),
    };
