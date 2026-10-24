/**
 * Blocks kept as they are: what MJML compiles a subtree to, cut out of a document of its own. The subtree keeps every
 * attribute the cascade gave it (written on it, so it compiles the same outside its section), and the template's head
 * (styles, fonts, breakpoint), so the HTML is what the original renders there. Its CSS (the component's own, the
 * template's `mj-style` rules it uses) comes with it in a `<style>`.
 */

import type { Resolved } from "./attributes";
import { mjmlRuntime } from "./runtime";
import type { MjmlNode } from "./types";

const START = "unlayer-mjml-fragment-start";
const END = "unlayer-mjml-fragment-end";

/** The subtree as MJML's JSON with its resolved attributes written on it (no `mj-class` left to resolve). */
export function explicit(node: Resolved): MjmlNode {
  const attributes: Record<string, string> = {};
  // Written back as MJML reads them (the cascade decoded them: see attributes.ts).
  const encode = (value: string) => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  for (const name of node.given) if (name !== "mj-class" && node.attrs[name] !== undefined) attributes[name] = encode(node.attrs[name]);
  return {
    tagName: node.tag,
    attributes,
    ...(node.content ? { content: node.content } : {}),
    children: node.children.map(explicit),
  };
}

/** The template's head for a fragment: what changes how it renders, without its title and preview text. */
function fragmentHead(head: MjmlNode | undefined): MjmlNode {
  const keep = new Set(["mj-style", "mj-font", "mj-breakpoint", "mj-html-attributes"]);
  return { tagName: "mj-head", attributes: {}, children: (head?.children ?? []).filter((c) => keep.has(c.tagName)) };
}

const marker = (text: string): MjmlNode => ({ tagName: "mj-raw", attributes: {}, content: `<!--${text}-->` });

/** The CSS rules MJML writes for every document (resets): a fragment's page has its own. */
const BOILERPLATE = /#outlook a \{|\.mj-outlook-group-fix|-webkit-text-size-adjust:100%|table\.mj-full-width-mobile/;

/** The `<style>` blocks of a compiled document that the fragment needs (not MJML's resets, nor Outlook's). */
function fragmentStyles(html: string): string {
  const head = html.slice(0, html.search(/<body[\s>]/i) + 1 || html.length);
  const styles: string[] = [];
  for (const match of head.matchAll(/<style\b([^>]*)>([\s\S]*?)<\/style>/gi)) {
    const css = match[2].trim();
    if (!css || BOILERPLATE.test(css)) continue;
    // Column widths: Elements lays out its own columns; a kept section has its own classes, which these style.
    styles.push(`<style${match[1]}>${css}</style>`);
  }
  // Outlook-only blocks (`<!--[if mso]>…<style>`) aren't kept: they're cut with the head.
  return styles.join("");
}

/** What's between the markers in `html`. */
function between(html: string): string | undefined {
  const start = html.indexOf(`<!--${START}-->`);
  const end = html.indexOf(`<!--${END}-->`);
  if (start < 0 || end < start) return undefined;
  return html.slice(start + START.length + 7, end).trim();
}

/**
 * A block (in a column `width` px wide inside, its padding included): the column's row MJML writes for it, as a table
 * of its own, with the CSS it needs.
 */
/** What a fragment's compile needs from the template: its root, head, and the CSS that applies at any width. */
export interface FragmentContext {
  root: MjmlNode;
  headNode?: MjmlNode;
  head: { css: string };
}

/**
 * The fragment as it shows in MJML's page, inside Elements': the template's rules that apply at any width written on
 * it (Elements' page has rules of its own for links and cells, which would win over a stylesheet's), then the colors
 * tables and cells inherit there (see `pinColors`).
 */
export function asShown(html: string, ctx: FragmentContext): string {
  let out = html;
  if (ctx.head.css.trim()) {
    try {
      out = mjmlRuntime().juice.inlineContent(html, ctx.head.css, {
        applyWidthAttributes: false,
        applyHeightAttributes: false,
        applyAttributesTableElements: false,
        insertPreservedExtraCss: false,
        preserveMediaQueries: false,
        preserveImportant: true,
        removeStyleTags: false,
      });
    } catch {
      out = html;
    }
  }
  return pinColors(out);
}

/**
 * A block (in a column `width` px wide inside, its padding included): the column's row MJML writes for it, as a table
 * of its own, with the CSS it needs.
 */
export async function blockHtml(node: Resolved, width: number, ctx: FragmentContext): Promise<string> {
  const body: MjmlNode = {
    tagName: "mj-body",
    attributes: { width: `${Math.max(1, Math.round(width))}px` },
    children: [
      {
        tagName: "mj-section",
        attributes: { padding: "0px" },
        children: [{ tagName: "mj-column", attributes: { padding: "0px", width: "100%" }, children: [marker(START), explicit(node), marker(END)] }],
      },
    ],
  };
  const html = await compile(ctx.root, ctx.headNode, body);
  const rows = between(html);
  if (rows === undefined) throw new Error(`MJML didn't render <${node.tag}>`);
  return `${fragmentStyles(html)}${asShown(`<table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"><tbody>${rows}</tbody></table>`, ctx)}`;
}

/** A body-level element (a section, a hero, raw HTML) in a body `width` px wide, with the CSS it needs. */
export async function sectionHtml(node: Resolved, width: number, ctx: FragmentContext): Promise<string> {
  const body: MjmlNode = {
    tagName: "mj-body",
    attributes: { width: `${Math.max(1, Math.round(width))}px` },
    children: [marker(START), explicit(node), marker(END)],
  };
  const html = await compile(ctx.root, ctx.headNode, body);
  const part = between(html);
  if (part === undefined) throw new Error(`MJML didn't render <${node.tag}>`);
  return `${fragmentStyles(html)}${asShown(inBodyWrapper(part, ctx.root), ctx)}`;
}

/** HTML as MJML's page has it in the body: inside its wrapper, whose language and direction it takes (`dir="auto"`). */
export function inBodyWrapper(html: string, root: MjmlNode): string {
  const attribute = (value: unknown) => String(value).replace(/"/g, "&quot;");
  return `<div lang="${attribute(root.attributes?.lang ?? "und")}" dir="${attribute(root.attributes?.dir ?? "auto")}">${html}</div>`;
}

const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);

/**
 * Elements' page colors every table and cell as its text color (`table, td { color: … }`, as the editor's export
 * does), where MJML's let them inherit: a table or cell without a color of its own gets the one it inherits in the
 * fragment, written on it. `inherited`: the color around the fragment, when it isn't the page's.
 */
export function pinColors(html: string, inherited?: string): string {
  const stack: Array<{ tag: string; color?: string }> = [];
  const current = () => {
    for (let i = stack.length - 1; i >= 0; i--) if (stack[i].color) return stack[i].color;
    return inherited;
  };
  return html.replace(/<!--[\s\S]*?-->|<\/?([a-zA-Z][\w:-]*)\b([^>]*)>/g, (tag, name: string | undefined, rest: string) => {
    if (!name) return tag;
    const lower = name.toLowerCase();
    if (tag.startsWith("</")) {
      const at = stack.map((s) => s.tag).lastIndexOf(lower);
      if (at >= 0) stack.length = at;
      return tag;
    }
    const style = /\bstyle\s*=\s*("([^"]*)"|'([^']*)')/i.exec(rest);
    const css = style ? style[2] ?? style[3] ?? "" : "";
    const own = /(?:^|;)\s*color\s*:\s*([^;]+)/i.exec(css)?.[1]?.trim();
    let out = tag;
    if (!own && (lower === "table" || lower === "td") && current()) {
      const color = current()!.replace(/"/g, "'");
      out = style ? tag.replace(style[0], `style="${css.replace(/;?\s*$/, ";")}color:${color};"`.replace('style=";color', 'style="color')) : tag.replace(/^<([a-zA-Z][\w:-]*)/, `<$1 style="color:${color};"`);
    }
    if (!VOID.has(lower) && !/\/\s*>$/.test(tag)) stack.push({ tag: lower, color: own ?? (out !== tag ? current() : undefined) });
    return out;
  });
}

async function compile(root: MjmlNode, head: MjmlNode | undefined, body: MjmlNode): Promise<string> {
  const document: MjmlNode = { tagName: "mjml", attributes: { ...root.attributes }, children: [fragmentHead(head), body] };
  const { html } = await mjmlRuntime().mjml2html(document, { validationLevel: "skip" });
  return html;
}

/** MJML's HTML for the whole template: the reference the migration is checked against. */
export async function referenceHtml(document: MjmlNode): Promise<{ html: string; errors: string[] }> {
  const { html, errors } = await mjmlRuntime().mjml2html(document, { validationLevel: "soft" });
  return { html, errors: (errors ?? []).map((e) => e.formattedMessage ?? e.message ?? String(e)) };
}
