/** The HTML inside text blocks: the stylesheet rules that reach it, written on it, as MJML's page applies them. */

import type { Context } from "./context";
import { mjmlRuntime } from "./runtime";

/**
 * MJML's page gives every `<p>` margins (`p { display:block; margin:13px 0 }` in its head). Elements' page resets them,
 * so text keeps them on its paragraphs.
 */
const MJML_PAGE_CSS = "p { display: block; margin: 13px 0; }";

const START = "<!--unlayer-text-start-->";
const END = "<!--unlayer-text-end-->";
const OWN = "unlayer-text-own";

/** A declaration a rule gives an element. */
export interface Declaration {
  property: string;
  value: string;
  important: boolean;
}

export interface StyledText {
  html: string;
  /** What rules give the text's own box (MJML's `<div>` around it): `!important` ones win over its attributes. */
  own: Declaration[];
  /** What rules give the cell around it (where `css-class` goes), which the text inherits where its box sets nothing. */
  cell: Declaration[];
}

function declarations(style: string | undefined): Declaration[] {
  const out: Declaration[] = [];
  for (const part of (style ?? "").split(";")) {
    const at = part.indexOf(":");
    if (at <= 0) continue;
    const raw = part.slice(at + 1).trim();
    out.push({ property: part.slice(0, at).trim().toLowerCase(), value: raw.replace(/\s*!important$/i, ""), important: /!important$/i.test(raw) });
  }
  return out;
}

const decodeAttribute = (value: string) => value.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");

/**
 * `html` (an `mj-text`'s content) with the rules that apply to it at any width written on it: MJML's own (`p`
 * margins) and the template's `mj-style` (both kinds: `inline` ones MJML writes on it, the others its page applies).
 * `classes`: the `css-class`es of the blocks it's in, outermost first (the text's own last), which selectors like
 * `.footer a` need. Also what the rules give the text's box and the cell around it.
 */
export function styledText(html: string, ctx: Context, classes: string[], box = "div"): StyledText {
  const css = [/<p[\s>]/i.test(html) ? MJML_PAGE_CSS : "", ctx.head.css].filter(Boolean).join("\n");
  if (!css.trim()) return { html, own: [], cell: [] };
  const open = classes.map((c, i) => `<div class="${c.replace(/"/g, "")}" data-unlayer-depth="${i}">`).join("");
  const close = "</div>".repeat(classes.length);
  try {
    const out = mjmlRuntime().juice.inlineContent(`<div>${open}<${box} class="${OWN}">${START}${html}${END}</${box}>${close}</div>`, css, {
      applyWidthAttributes: false,
      applyHeightAttributes: false,
      applyAttributesTableElements: false,
      insertPreservedExtraCss: false,
      preserveMediaQueries: false,
      preserveImportant: true,
      removeStyleTags: false,
    });
    const start = out.indexOf(START);
    const end = out.indexOf(END);
    if (start < 0 || end < start) return { html, own: [], cell: [] };
    const tag = (match: RegExp) => {
      const found = match.exec(out)?.[0] ?? "";
      const style = /\bstyle="([^"]*)"/.exec(found)?.[1];
      return declarations(style === undefined ? undefined : decodeAttribute(style));
    };
    const own = tag(new RegExp(`<${box}[^>]*class="${OWN}"[^>]*>`));
    const cell = classes.length ? tag(new RegExp(`<div[^>]*data-unlayer-depth="${classes.length - 1}"[^>]*>`)) : [];
    return { html: out.slice(start + START.length, end), own, cell };
  } catch {
    return { html, own: [], cell: [] };
  }
}

/** `styledText`'s HTML alone: for HTML with no box of its own to style (a heading's inside). */
export function styledHtml(html: string, ctx: Context, classes: string[]): string {
  return styledText(html, ctx, classes).html;
}

/** Whether HTML has anything a reader sees: not only comments (Outlook's conditional ones too) and whitespace. */
export function visibleHtml(html: string): boolean {
  const rest = html
    .replace(/<!--\[if[\s\S]*?<!\[endif\]-->/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(meta|link|style|script)\b[\s\S]*?(<\/\1>|\/?>)/gi, "")
    .trim();
  return rest.length > 0;
}
