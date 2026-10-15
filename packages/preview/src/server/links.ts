/**
 * Checks the links and images in a rendered email: what's wrong in the HTML
 * itself (a link that goes nowhere, a relative URL, an image without alt text,
 * a size Gmail clips) and, unless asked not to, whether each URL answers.
 */

import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { Parser } from "htmlparser2";

export type FindingLevel = "error" | "warning" | "info";

export interface LinkFinding {
  kind: "link" | "image" | "email";
  level: FindingLevel;
  /** The link or image URL (empty for the email as a whole). */
  url: string;
  message: string;
  /** The Elements block it's in: "Button 1", "Image 2". */
  block?: string;
  /** The link's text or the image's alt text. */
  label?: string;
  status?: number;
}

export interface LinkReport {
  findings: LinkFinding[];
  links: number;
  images: number;
  /** Whether URLs were requested (false: only the HTML was checked). */
  network: boolean;
  durationMs: number;
}

export interface LinkCheckOptions {
  /** The templates folder, to check /static/ files. */
  dir: string;
  /** Request each URL (default true). */
  network?: boolean;
  timeoutMs?: number;
  fetch?: typeof fetch;
}

/** Gmail clips messages whose HTML is larger than this, hiding the rest behind "View entire message". */
export const GMAIL_CLIP_BYTES = 102 * 1024;
const LARGE_IMAGE_BYTES = 1024 * 1024;

const BLOCK_ID = /^u_(content_([a-z]+)|column|row)_(\d+)$/;

interface Found {
  kind: "link" | "image";
  url: string;
  block?: string;
  label?: string;
  alt?: string | null;
  width?: string;
  height?: string;
}

function blockName(id: RegExpExecArray): string {
  const kind = id[2] ?? id[1];
  const names: Record<string, string> = { text: "Paragraph", column: "Column", row: "Row" };
  return `${names[kind] ?? kind.charAt(0).toUpperCase() + kind.slice(1)} ${id[3]}`;
}

/** Every link and image in the HTML, with the block it's in. Conditional comments (Outlook-only copies) are skipped. */
export function extractLinks(html: string): Found[] {
  const found: Found[] = [];
  const blocks: Array<{ name: string; label: string }> = [];
  let link: Found | undefined;
  let linkDepth = 0;
  const parser = new Parser(
    {
      onopentag(name, attributes) {
        const id = attributes.id ? BLOCK_ID.exec(attributes.id) : null;
        blocks.push({ name, label: id ? blockName(id) : blocks[blocks.length - 1]?.label ?? "" });
        const block = blocks[blocks.length - 1].label || undefined;
        if (name === "a" && attributes.href !== undefined) {
          link = { kind: "link", url: attributes.href.trim(), block, label: "" };
          linkDepth = blocks.length;
          found.push(link);
        } else if (name === "a") {
          found.push({ kind: "link", url: "", block, label: "" });
        }
        if (name === "img") {
          found.push({ kind: "image", url: (attributes.src ?? "").trim(), block, alt: attributes.alt ?? null, width: attributes.width, height: attributes.height });
        }
      },
      ontext(text) {
        if (link) link.label = `${link.label ?? ""}${text}`.replace(/\s+/g, " ");
      },
      onclosetag(name) {
        if (name === "a" && link && blocks.length === linkDepth) link = undefined;
        blocks.pop();
      },
    },
    { decodeEntities: true }
  );
  parser.write(html);
  parser.end();
  for (const f of found) f.label = f.label?.trim() || undefined;
  return found;
}

const PRIVATE_HOST = /^(localhost|127\.\d+\.\d+\.\d+|0\.0\.0\.0|\[::1\]|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|[^.]+\.local)$/i;

/** Hosts reserved for examples (RFC 2606, RFC 6761): a template's placeholder, not a link to check. */
const PLACEHOLDER_HOST = /(^|\.)(example\.(com|net|org)|[^.]+\.(example|test|invalid))$/i;

export function isPlaceholderUrl(url: string): boolean {
  try {
    return PLACEHOLDER_HOST.test(new URL(url).hostname);
  } catch {
    return false;
  }
}

/** What's wrong with a URL from the HTML alone. */
function staticFindings(item: Found, dir: string): LinkFinding[] {
  const base = { kind: item.kind, url: item.url, block: item.block, label: item.kind === "image" ? item.alt ?? undefined : item.label };
  const out: LinkFinding[] = [];
  const url = item.url;
  // Merge tags and placeholders an email service fills in ({{url}}, *|UNSUB|*, %recipient.url%).
  if (/\{\{|\}\}|\*\||\|\*|%[a-z_.]+%|\[\[/i.test(url)) {
    return [{ ...base, level: "info", message: "A merge tag: filled in when the email is sent, so not checked." }];
  }
  // Not requested (see checkLinks), but still checked for what the HTML alone shows.
  if (isPlaceholderUrl(url)) {
    out.push({ ...base, level: "warning", message: "A placeholder address (reserved for examples): replace it with the real URL before you send." });
  }
  if (item.kind === "link") {
    if (url === "" || url === "#") return [{ ...base, level: "error", message: "This link goes nowhere: give it a URL." }];
    if (/^javascript:/i.test(url)) return [{ ...base, level: "error", message: "Email clients don't run javascript: links." }];
    if (/^mailto:/i.test(url)) {
      if (!/^mailto:[^@\s]+@[^@\s]+\.[^@\s]+/i.test(url)) out.push({ ...base, level: "error", message: "This mailto: link has no valid address." });
      return out;
    }
    if (/^(tel|sms):/i.test(url)) return out;
  } else {
    if (url === "") return [{ ...base, level: "error", message: "This image has no src." }];
    if (/^data:/i.test(url)) out.push({ ...base, level: "warning", message: "Images embedded as data: URLs are blocked by Gmail and Outlook.com: host the image and link it." });
    if (/\.svg(\?|#|$)/i.test(url) || /^data:image\/svg/i.test(url)) out.push({ ...base, level: "warning", message: "Gmail and Outlook don't show SVG images: use PNG or JPEG." });
    if (item.alt === null || item.alt === undefined) {
      out.push({ ...base, level: "warning", message: "No alt text: it's what readers see while images are blocked, and what screen readers read." });
    } else if (item.alt.trim() === "") {
      // Elements writes alt="" for an Image without alt, so this is how a missing one shows up.
      out.push({ ...base, level: "info", message: "Empty alt text: right for a decorative image. Otherwise describe it (alt=\"…\"): it's what readers see while images are blocked." });
    }
    if (url.startsWith("/static/")) {
      const file = path.join(dir, "static", decodeURIComponent(url.slice("/static/".length).split(/[?#]/)[0]));
      if (!existsSync(file)) out.push({ ...base, level: "error", message: `There's no ${path.join("static", url.slice("/static/".length))} in the templates folder.` });
      else {
        const size = statSync(file).size;
        if (size > LARGE_IMAGE_BYTES) out.push({ ...base, level: "warning", message: `A large image (${(size / 1024 / 1024).toFixed(1)} MB): it loads slowly on phones.` });
      }
      out.push({ ...base, level: "info", message: "Only the preview serves /static/ files: host the image and use its full URL in the emails you send." });
      return out;
    }
  }
  if (/^data:/i.test(url)) return out;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(url)) {
    out.push({ ...base, level: "error", message: "A relative URL: email has no page to resolve it against. Use a full URL (https://…)." });
    return out;
  }
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return [...out, { ...base, level: "error", message: "This URL isn't valid." }];
  }
  if (PRIVATE_HOST.test(parsed.hostname)) out.push({ ...base, level: "error", message: `It points to ${parsed.hostname}, which readers can't reach.` });
  else if (parsed.protocol === "http:") out.push({ ...base, level: "warning", message: "Not HTTPS: some clients warn about it or block the image." });
  return out;
}

interface UrlResult {
  status?: number;
  contentType?: string;
  size?: number;
  finalUrl?: string;
  error?: string;
}

async function request(url: string, doFetch: typeof fetch, timeoutMs: number): Promise<UrlResult> {
  const attempt = async (method: "HEAD" | "GET"): Promise<Response> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await doFetch(url, { method, redirect: "follow", signal: controller.signal, headers: { "user-agent": "elements-preview link check" } });
    } finally {
      clearTimeout(timer);
    }
  };
  try {
    let res = await attempt("HEAD");
    // Some servers don't answer HEAD: ask for the page itself.
    if (res.status === 405 || res.status === 501 || res.status === 403) res = await attempt("GET");
    const length = res.headers.get("content-length");
    // A GET's body isn't needed.
    await res.body?.cancel().catch(() => undefined);
    return { status: res.status, contentType: res.headers.get("content-type") ?? undefined, size: length ? Number(length) : undefined, finalUrl: res.url };
  } catch (error) {
    const err = error as Error & { cause?: { code?: string } };
    if (err.name === "AbortError") return { error: `No answer in ${timeoutMs / 1000} seconds.` };
    return { error: err.cause?.code === "ENOTFOUND" ? "The host doesn't exist." : `Couldn't connect (${err.cause?.code ?? err.message}).` };
  }
}

/** Runs `fn` on each item, at most `limit` at a time. */
async function eachLimited<T>(items: T[], limit: number, fn: (item: T) => Promise<void>): Promise<void> {
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) await fn(items[next++]);
    })
  );
}

export async function checkLinks(html: string, options: LinkCheckOptions): Promise<LinkReport> {
  const started = performance.now();
  const items = extractLinks(html);
  const findings: LinkFinding[] = [];
  const bytes = Buffer.byteLength(html, "utf8");
  if (bytes > GMAIL_CLIP_BYTES) {
    findings.push({
      kind: "email",
      level: "warning",
      url: "",
      message: `The HTML is ${(bytes / 1024).toFixed(0)} KB: Gmail clips emails over 102 KB, hiding the rest (often the unsubscribe link) behind "View entire message".`,
    });
  }
  const toRequest = new Map<string, Found[]>();
  for (const item of items) {
    const found = staticFindings(item, options.dir);
    findings.push(...found);
    const skip = found.some((f) => f.level === "error" || f.level === "info") || isPlaceholderUrl(item.url);
    if (!skip && /^https?:/i.test(item.url)) toRequest.set(item.url, [...(toRequest.get(item.url) ?? []), item]);
  }
  const network = options.network !== false;
  if (network) {
    const doFetch = options.fetch ?? fetch;
    await eachLimited([...toRequest.keys()], 8, async (url) => {
      const result = await request(url, doFetch, options.timeoutMs ?? 6000);
      for (const item of toRequest.get(url)!) {
        const base = { kind: item.kind, url, block: item.block, label: item.kind === "image" ? item.alt ?? undefined : item.label, status: result.status };
        if (result.error) findings.push({ ...base, level: "error", message: result.error });
        else if (result.status !== undefined && result.status >= 400) findings.push({ ...base, level: "error", message: `It answers ${result.status}.` });
        else if (item.kind === "image" && result.contentType && !result.contentType.startsWith("image/")) {
          findings.push({ ...base, level: "error", message: `It isn't an image (${result.contentType.split(";")[0]}).` });
        } else if (item.kind === "image" && result.size !== undefined && result.size > LARGE_IMAGE_BYTES) {
          findings.push({ ...base, level: "warning", message: `A large image (${(result.size / 1024 / 1024).toFixed(1)} MB): it loads slowly on phones.` });
        }
        if (result.finalUrl && result.finalUrl !== url && !result.error && (result.status ?? 0) < 400) {
          findings.push({ ...base, level: "info", message: `It redirects to ${result.finalUrl}.` });
        }
      }
    });
  }
  const order: Record<FindingLevel, number> = { error: 0, warning: 1, info: 2 };
  findings.sort((a, b) => order[a.level] - order[b.level]);
  return {
    findings,
    links: items.filter((i) => i.kind === "link").length,
    images: items.filter((i) => i.kind === "image").length,
    network,
    durationMs: Math.round(performance.now() - started),
  };
}
