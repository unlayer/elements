/**
 * What the checks found, in one list and with one meaning for the preview's
 * Checks drawer and for `elements-preview check`:
 *
 * - "error": to fix. The template doesn't render, a block is left out, the
 *   design JSON can't be made (it won't open in the Unlayer editor), or a link
 *   or image is broken;
 * - "warning": to check. Elements and React warnings, no plain text, CSS some
 *   email clients don't support, a placeholder or http: URL, Gmail clipping;
 * - "info": a note.
 *
 * Shared by the preview app and the server, so it imports nothing and takes
 * the API's shapes structurally.
 */

export type FindingLevel = "error" | "warning" | "info";

export type FindingKind =
  /** The template doesn't compile or throws, or Elements left a block out because it failed. */
  | "render"
  /** A warning from Elements or React, or about the project. */
  | "warning"
  /** Other console output while rendering. */
  | "log"
  /** The design JSON couldn't be made: it won't open in the Unlayer editor. */
  | "design"
  /** The plain text couldn't be made. */
  | "text"
  /** CSS or HTML the template brings in that some email clients don't support. */
  | "client"
  | "link"
  | "image"
  /** The HTML is over Gmail's clipping size. */
  | "size";

export interface FindingClient {
  /** caniemail's id: `outlook.windows`. */
  client: string;
  /** `Outlook (Windows)`. */
  label: string;
  support: "none" | "partial";
}

export interface Finding {
  kind: FindingKind;
  level: FindingLevel;
  message: string;
  /** The Elements block it's in: `Button 1`, `Html 2` (several, comma-separated, for a client finding). */
  block?: string;
  /** For a render error: the file it points at, relative to the project. */
  file?: string;
  /** For a render error, the line in `file`; for a client finding, the template's first line that likely brings it in. */
  line?: number;
  column?: number;
  /** For a client finding: every template line that likely brings it in. */
  lines?: number[];
  /** For a render error: the lines around it. */
  frame?: string;
  /** The link or image URL; for a client finding, the feature's page on caniemail.com. */
  url?: string;
  /** The link's text or the image's alt text. */
  label?: string;
  /** The HTTP status a URL answered with. */
  status?: number;
  /** For a client finding: caniemail's name for the feature (`display:flex`). */
  feature?: string;
  /** For a client finding: "none" when some clients ignore it entirely, "partial" when they only partly support it. */
  support?: "none" | "partial";
  clients?: FindingClient[];
}

interface LogInput {
  level: "error" | "warn" | "info" | "log";
  message: string;
}

/** A render, as the loader returns it and the API sends it. */
export type RenderInput =
  | { ok: true; jsonError?: string; textError?: string; logs: LogInput[] }
  | {
      ok: false;
      error: { message: string; file?: string; line?: number; column?: number; frame?: string; phase: "load" | "render" };
      logs: LogInput[];
    };

interface CompatIssueInput {
  feature: string;
  url?: string;
  support: "none" | "partial";
  source: "template" | "elements";
  clients: Array<{ client: string; label: string; support: "none" | "partial" }>;
  locations: Array<{ block: string; line?: number }>;
  sourceLines?: number[];
}

export type CompatInput = { applicable: true; issues: CompatIssueInput[] } | { applicable: false; reason: string };

interface LinkFindingInput {
  kind: "link" | "image" | "email";
  level: FindingLevel;
  url: string;
  message: string;
  block?: string;
  label?: string;
  status?: number;
}

export type LinksInput = { applicable: true; findings: LinkFindingInput[] } | { applicable: false; reason: string };

const LOG_LEVEL: Record<LogInput["level"], FindingLevel> = { error: "error", warn: "warning", info: "info", log: "info" };

/**
 * What rendering reported: the project's warnings, a render error, no design
 * JSON or plain text, and what Elements and React wrote to the console (an
 * error there means Elements left a block out).
 */
export function renderingFindings(result: RenderInput | undefined, projectWarnings: string[] = []): Finding[] {
  const findings: Finding[] = projectWarnings.map((message) => ({ kind: "warning", level: "warning", message }));
  if (!result) return findings;
  if (!result.ok) {
    const { message, file, line, column, frame } = result.error;
    findings.push({ kind: "render", level: "error", message, file, line, column, frame });
  } else {
    if (result.jsonError) findings.push({ kind: "design", level: "error", message: `No design JSON, so it won't open in the Unlayer editor: ${result.jsonError}` });
    if (result.textError) findings.push({ kind: "text", level: "warning", message: `No plain text version: ${result.textError}` });
  }
  for (const log of result.logs) {
    findings.push({ kind: log.level === "error" ? "render" : log.level === "warn" ? "warning" : "log", level: LOG_LEVEL[log.level], message: log.message });
  }
  return findings;
}

/** "Gmail, Outlook and Yahoo Mail": the client families, from labels such as "Outlook (Windows)". */
function families(clients: FindingClient[]): string {
  const names = [...new Set(clients.map((c) => c.label.replace(/ \(.*\)$/, "")))];
  return names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names.join("");
}

function clientMessage(issue: CompatIssueInput): string {
  const none = issue.clients.filter((c) => c.support === "none");
  const partial = issue.clients.filter((c) => c.support === "partial");
  const count = (list: FindingClient[]) => `${list.length} ${list.length === 1 ? "client" : "clients"}`;
  const parts = [
    none.length ? `isn't supported in ${families(none)} (${count(none)})` : "",
    partial.length ? `${none.length ? "and only partly in" : "is only partly supported in"} ${families(partial)} (${count(partial)})` : "",
  ].filter(Boolean);
  return `\`${issue.feature}\` ${parts.join(" ")}: remove it or add a fallback.`;
}

/**
 * Email client compatibility: what the template brings in that some clients
 * don't support. What Elements' own HTML uses, with its fallbacks, isn't listed.
 */
export function clientFindings(compat: CompatInput | undefined): Finding[] {
  if (!compat?.applicable) return [];
  return compat.issues
    .filter((issue) => issue.source === "template")
    .map((issue) => ({
      kind: "client" as const,
      level: "warning" as const,
      message: clientMessage(issue),
      block: [...new Set(issue.locations.map((l) => l.block))].join(", ") || undefined,
      line: issue.sourceLines?.[0],
      lines: issue.sourceLines?.length ? issue.sourceLines : undefined,
      url: issue.url,
      feature: issue.feature,
      support: issue.support,
      clients: issue.clients.map(({ client, label, support }) => ({ client, label, support })),
    }));
}

/** Links and images, and Gmail's clipping size. */
export function linkFindings(links: LinksInput | undefined): Finding[] {
  if (!links?.applicable) return [];
  return links.findings.map((f) => ({
    kind: f.kind === "email" ? "size" : f.kind,
    level: f.level,
    message: f.message,
    block: f.block,
    url: f.url || undefined,
    label: f.label,
    status: f.status,
  }));
}

export interface GroupedFindings {
  toFix: Finding[];
  toCheck: Finding[];
  notes: Finding[];
}

export function groupFindings(findings: Finding[]): GroupedFindings {
  return {
    toFix: findings.filter((f) => f.level === "error"),
    toCheck: findings.filter((f) => f.level === "warning"),
    notes: findings.filter((f) => f.level === "info"),
  };
}
