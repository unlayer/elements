/**
 * `mj-head`: what the design keeps of it (preview text, web fonts), the CSS the text blocks take inline, and what's
 * only reported (a breakpoint, CSS for other widths or states, attributes MJML adds to its output).
 */

import { decodeHtmlEntities } from "@unlayer/convert-core";
import type { MjmlNode, Note } from "./types";

/** The web fonts MJML links by default when a font stack names them (mjml-core's `fonts` option). */
const MJML_FONTS: Record<string, string> = {
  "Open Sans": "https://fonts.googleapis.com/css?family=Open+Sans:300,400,500,700",
  "Droid Sans": "https://fonts.googleapis.com/css?family=Droid+Sans:300,400,500,700",
  Lato: "https://fonts.googleapis.com/css?family=Lato:300,400,500,700",
  Roboto: "https://fonts.googleapis.com/css?family=Roboto:300,400,500,700",
  Ubuntu: "https://fonts.googleapis.com/css?family=Ubuntu:300,400,500,700",
};

export interface HeadInfo {
  title?: string;
  preview?: string;
  /** Web fonts by family name: MJML's defaults and the template's `mj-font`s. */
  fonts: Record<string, string>;
  /** `mj-breakpoint`'s width, when set. */
  breakpoint?: string;
  /** CSS rules that apply at any width (both `mj-style` kinds): what text blocks take inline. */
  css: string;
  /** Rules for other widths, states or media (`@media`, `:hover`): the selectors, for the report. */
  conditional: Array<{ condition: string; css: string }>;
}

/** CSS split into its rules: top-level at-rules (with their blocks) and plain rules. */
export function cssRules(css: string): Array<{ at?: string; text: string }> {
  const out: Array<{ at?: string; text: string }> = [];
  const source = css.replace(/\/\*[\s\S]*?\*\//g, "");
  let i = 0;
  while (i < source.length) {
    const open = source.indexOf("{", i);
    if (open < 0) break;
    const prelude = source.slice(i, open).trim();
    let depth = 1;
    let j = open + 1;
    for (; j < source.length && depth > 0; j++) {
      if (source[j] === "{") depth++;
      else if (source[j] === "}") depth--;
    }
    const text = source.slice(i, j).trim();
    if (prelude) out.push(prelude.startsWith("@") ? { at: prelude, text } : { text });
    i = j;
  }
  return out;
}

export function readHead(head: MjmlNode | undefined, notes: { warnings: Note[]; info: Note[] }): HeadInfo {
  const info: HeadInfo = { fonts: { ...MJML_FONTS }, css: "", conditional: [] };
  const css: string[] = [];
  const addCss = (text: string) => {
    for (const rule of cssRules(text)) {
      if (rule.at && /^@media\b/i.test(rule.at)) info.conditional.push({ condition: rule.at, css: rule.text });
      else if (rule.at) continue; // @font-face, @import, @supports: not inlined
      else if (/:(hover|active|focus|visited|target|checked)\b|::?(before|after|selection)\b/i.test(rule.text.slice(0, rule.text.indexOf("{")))) info.conditional.push({ condition: "state", css: rule.text });
      else css.push(rule.text);
    }
  };
  for (const child of head?.children ?? []) {
    const content = (child.content ?? "").trim();
    switch (child.tagName) {
      case "mj-title":
        info.title = content;
        break;
      case "mj-preview":
        info.preview = content;
        break;
      case "mj-font": {
        const name = String(child.attributes?.name ?? "");
        const href = decodeHtmlEntities(String(child.attributes?.href ?? ""));
        if (name && href) info.fonts[name] = href;
        break;
      }
      case "mj-breakpoint":
        info.breakpoint = String(child.attributes?.width ?? "");
        break;
      case "mj-style":
        addCss(content);
        break;
      case "mj-raw": {
        // Head markup: <meta>, <link> and <style>. Styles are read as mj-style; the rest isn't content.
        // Not Outlook's own (`<!--[if mso]><style>…<![endif]-->`): comments go first (what's revealed to other clients stays).
        for (const style of content.replace(/<!--[\s\S]*?-->/g, "").matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) addCss(style[1]);
        const rest = content.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "").replace(/<!--[\s\S]*?-->/g, "").trim();
        if (rest) notes.info.push({ reason: "head markup not kept (Elements writes its own head)", detail: rest.replace(/\s+/g, " ").slice(0, 80) });
        break;
      }
      case "mj-html-attributes":
        notes.warnings.push({ reason: "mj-html-attributes not kept (attributes MJML adds to its HTML output)" });
        break;
      default:
        break;
    }
  }
  info.css = css.join("\n");
  return info;
}

/** The web font a stack shows (its first family), when MJML links one for it. */
export function webFont(stack: string, fonts: Record<string, string>): string | undefined {
  const first = (stack.split(",")[0] ?? "").trim().replace(/^["']|["']$/g, "");
  return fonts[first];
}
