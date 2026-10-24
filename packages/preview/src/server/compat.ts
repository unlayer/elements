/**
 * Email client compatibility: the HTML and CSS a rendered email uses that
 * email clients don't support, from caniemail.com's data (the `caniemail`
 * package).
 *
 * Elements' own email HTML deliberately uses CSS some clients ignore, with
 * fallbacks for them (media queries for phones, Outlook conditionals). Checked
 * raw, every email lists those, so each finding is sorted:
 *
 * - "template": something this template brought in: anything inside an `Html`
 *   block, and features Elements' own HTML doesn't use (a web font, a
 *   background image, CSS from a prop value);
 * - "elements": a feature Elements' own HTML also uses, found outside `Html`
 *   blocks: handled by Elements, listed for reference.
 *
 * What Elements uses is measured, not listed by hand: a reference email with
 * every block is rendered with the project's Elements and checked the same way.
 */

import { caniemail, rawData } from "caniemail";
import { Parser } from "htmlparser2";

/** An issue as caniemail reports it (its type isn't exported from the package root). */
interface FeatureIssue {
  notes: string[];
  title: string;
  position?: { start: { line: number; column: number }; end: { line: number; column: number } };
  support: string;
}

export interface ClientGroup {
  id: string;
  label: string;
  clients: string[];
}

/** The clients checked, by family. */
export const CLIENT_GROUPS: ClientGroup[] = [
  { id: "gmail", label: "Gmail", clients: ["gmail.desktop-webmail", "gmail.ios", "gmail.android", "gmail.mobile-webmail"] },
  { id: "outlook", label: "Outlook", clients: ["outlook.windows", "outlook.windows-mail", "outlook.macos", "outlook.outlook-com", "outlook.ios", "outlook.android"] },
  { id: "apple-mail", label: "Apple Mail", clients: ["apple-mail.macos", "apple-mail.ios"] },
  { id: "yahoo", label: "Yahoo Mail", clients: ["yahoo.desktop-webmail", "yahoo.ios", "yahoo.android"] },
  { id: "samsung-email", label: "Samsung Email", clients: ["samsung-email.android"] },
  { id: "thunderbird", label: "Thunderbird", clients: ["thunderbird.macos", "thunderbird.windows"] },
];

const PLATFORM_LABELS: Record<string, string> = {
  "desktop-webmail": "web",
  "mobile-webmail": "mobile web",
  ios: "iOS",
  android: "Android",
  macos: "macOS",
  windows: "Windows",
  "windows-mail": "Windows Mail",
  "outlook-com": "Outlook.com",
};

export function clientLabel(client: string): string {
  const [family, platform] = client.split(".");
  const group = CLIENT_GROUPS.find((g) => g.clients.includes(client));
  return `${group?.label ?? family} (${PLATFORM_LABELS[platform] ?? platform})`;
}

export interface IssueLocation {
  /** The Elements block the CSS is on: "Button 2", "Column 1", "Row 3"; "Head styles" for a <style> rule. */
  block: string;
  /** Line in the rendered HTML. */
  line?: number;
}

export interface CompatIssue {
  feature: string;
  url?: string;
  /** "none" anywhere it's flagged beats "partial". */
  support: "none" | "partial";
  source: "template" | "elements";
  clients: Array<{ client: string; label: string; support: "none" | "partial"; notes: string[] }>;
  locations: IssueLocation[];
  /** Lines of the template's source that likely bring it in (see sourceLines). */
  sourceLines?: number[];
}

export interface CompatReport {
  issues: CompatIssue[];
  /** How many issues are the template's own. */
  templateCount: number;
  checkedClients: string[];
  durationMs: number;
}

const FEATURE_URLS = new Map<string, string>(
  ((rawData as { data?: Array<{ title: string; url: string }> }).data ?? []).map((f) => [f.title, f.url])
);

const BLOCK_ID = /^u_(content_([a-z]+)|column|row|body)_(\d+)$/;

interface Region {
  start: number;
  end: number;
  label: string;
  html: boolean;
}

function blockLabel(match: RegExpExecArray): string {
  const kind = match[2] ?? match[1];
  const label: Record<string, string> = { column: "Column", row: "Row", body: "Body", text: "Paragraph" };
  return `${label[kind] ?? kind.charAt(0).toUpperCase() + kind.slice(1)} ${match[3]}`;
}

/**
 * Each element with an Elements block id, by its character range in the HTML,
 * and inside each `Html` block the HTML the template wrote: Elements wraps it
 * in its own markup (a table cell with padding, then a plain `<div>`), and only
 * what's in that `<div>` is the template's.
 */
function blockRegions(html: string): Region[] {
  const regions: Region[] = [];
  const stack: Array<{ name: string; start: number; id?: RegExpExecArray; userContent?: string }> = [];
  // The label of the Html block whose wrapper <div> is next, if any.
  let awaitingUserDiv: string | undefined;
  const parser = new Parser(
    {
      onopentag(name, attributes) {
        const id = attributes.id ? BLOCK_ID.exec(attributes.id) ?? undefined : undefined;
        let userContent: string | undefined;
        if (id?.[2] === "html") awaitingUserDiv = blockLabel(id);
        else if (awaitingUserDiv && name === "div" && Object.keys(attributes).length === 0) {
          userContent = awaitingUserDiv;
          awaitingUserDiv = undefined;
        }
        stack.push({ name, start: userContent ? parser.endIndex + 1 : parser.startIndex, id, userContent });
      },
      onclosetag(name) {
        for (let i = stack.length - 1; i >= 0; i--) {
          if (stack[i].name !== name) continue;
          const [open] = stack.splice(i, 1);
          if (open.id) regions.push({ start: open.start, end: parser.endIndex, label: blockLabel(open.id), html: false });
          if (open.userContent) regions.push({ start: open.start, end: parser.startIndex, label: open.userContent, html: true });
          break;
        }
      },
    },
    { decodeEntities: false }
  );
  parser.write(html);
  parser.end();
  return regions;
}

function lineOffsets(html: string): number[] {
  const offsets = [0];
  for (let i = 0; i < html.length; i++) if (html[i] === "\n") offsets.push(i + 1);
  return offsets;
}

function locate(issue: FeatureIssue, regions: Region[], lines: number[]): { location: IssueLocation; inHtmlBlock: boolean } {
  const start = issue.position?.start;
  if (!start) return { location: { block: "Head styles" }, inHtmlBlock: false };
  const offset = (lines[start.line - 1] ?? 0) + Math.max(0, start.column - 1);
  let inner: Region | undefined;
  for (const region of regions) {
    if (offset < region.start || offset > region.end) continue;
    if (!inner || region.end - region.start < inner.end - inner.start) inner = region;
  }
  const inHtmlBlock = regions.some((r) => r.html && offset >= r.start && offset <= r.end);
  return { location: { block: inner?.label ?? "Head styles", line: start.line }, inHtmlBlock };
}

interface Finding {
  client: string;
  type: "error" | "warning";
  issue: FeatureIssue;
}

/** Every finding for `html`, one client at a time (the package throws for some clients' data). */
function check(html: string, clients: string[]): Finding[] {
  const findings: Finding[] = [];
  for (const client of clients) {
    let result;
    try {
      result = caniemail({ clients: [client as never], html });
    } catch {
      continue;
    }
    for (const [type, map] of [["error", result.issues.errors], ["warning", result.issues.warnings]] as const) {
      for (const [, issues] of map) for (const issue of issues) findings.push({ client, type, issue });
    }
  }
  return findings;
}

const ALL_CLIENTS = CLIENT_GROUPS.flatMap((g) => g.clients);

/** The features Elements' own email HTML uses, per client, from a reference email. */
export function baselineFeatures(referenceHtml: string, clients = ALL_CLIENTS): Set<string> {
  return new Set(check(referenceHtml, clients).map((f) => `${f.client}|${f.issue.title}`));
}

export function checkCompatibility(html: string, baseline: Set<string>, clients = ALL_CLIENTS): CompatReport {
  const started = performance.now();
  const regions = blockRegions(html);
  const lines = lineOffsets(html);
  const byKey = new Map<string, CompatIssue>();
  for (const { client, issue } of check(html, clients)) {
    const { location, inHtmlBlock } = locate(issue, regions, lines);
    const source = inHtmlBlock || !baseline.has(`${client}|${issue.title}`) ? "template" : "elements";
    const key = `${source}|${issue.title}`;
    let entry = byKey.get(key);
    if (!entry) {
      entry = { feature: issue.title, url: FEATURE_URLS.get(issue.title), support: "partial", source, clients: [], locations: [] };
      byKey.set(key, entry);
    }
    const support = issue.support === "none" ? "none" : "partial";
    if (support === "none") entry.support = "none";
    const existing = entry.clients.find((c) => c.client === client);
    if (existing) {
      if (support === "none") existing.support = "none";
      for (const note of issue.notes) if (!existing.notes.includes(note)) existing.notes.push(note);
    } else {
      entry.clients.push({ client, label: clientLabel(client), support, notes: [...issue.notes] });
    }
    if (!entry.locations.some((l) => l.block === location.block && l.line === location.line)) entry.locations.push(location);
  }
  const issues = [...byKey.values()].sort(
    (a, b) =>
      (a.source === b.source ? 0 : a.source === "template" ? -1 : 1) ||
      (a.support === b.support ? 0 : a.support === "none" ? -1 : 1) ||
      b.clients.length - a.clients.length ||
      a.feature.localeCompare(b.feature)
  );
  for (const issue of issues) issue.locations.sort((a, b) => (a.line ?? 0) - (b.line ?? 0));
  return {
    issues,
    templateCount: issues.filter((i) => i.source === "template").length,
    checkedClients: clients,
    durationMs: Math.round(performance.now() - started),
  };
}

const camel = (name: string) => name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());

/**
 * What to look for in a template's source for a caniemail feature: its CSS
 * property in both spellings (`background-image`, `backgroundImage`), a
 * property:value pair's value (`display:flex` → `flex`), or an HTML element or
 * attribute (`<body> element` → `<body`, `role attribute` → `role=`).
 */
export function featureTokens(feature: string): string[] {
  const tokens = new Set<string>();
  for (const part of feature.split(/,\s*/)) {
    const element = /^<([a-z0-9-]+)>/i.exec(part);
    const attribute = /^([a-z-]+) attribute$/i.exec(part);
    if (element) tokens.add(`<${element[1]}`);
    else if (attribute) tokens.add(`${attribute[1]}=`);
    else {
      const [property, value] = part.replace(/ (property|function|unit|values?)$/i, "").split(":").map((x) => x.trim());
      if (/^[a-z-]+$/i.test(property) && property.length > 2) {
        tokens.add(property);
        tokens.add(camel(property));
      }
      if (value && /^[a-z-]+$/i.test(value)) tokens.add(value);
      if (part.startsWith("@")) tokens.add(part.split(" ")[0]);
    }
  }
  return [...tokens];
}

/** The 1-based lines of `source` that mention a feature (at most `limit`), skipping import lines. */
export function sourceLines(feature: string, source: string, limit = 5): number[] {
  const tokens = featureTokens(feature);
  if (!tokens.length || !source) return [];
  const escaped = tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp(`(^|[^a-zA-Z0-9-])(${escaped.join("|")})(?![a-zA-Z0-9])`, "i");
  const lines: number[] = [];
  source.split(/\r?\n/).forEach((line, i) => {
    if (lines.length < limit && !/^\s*(import|export \* from)\b/.test(line) && pattern.test(line)) lines.push(i + 1);
  });
  return lines;
}
