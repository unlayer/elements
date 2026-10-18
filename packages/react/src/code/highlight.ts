/**
 * Code as HTML an email client shows: highlight.js finds the tokens; each is written with the theme's inline style
 * (no class a stylesheet would have to resolve), in a table with the block's background, in a `<pre>` (which
 * Outlook keeps, spaces and lines included, in a monospace font) or, with line numbers, a row per line.
 */
import core from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import c from "highlight.js/lib/languages/c";
import cpp from "highlight.js/lib/languages/cpp";
import csharp from "highlight.js/lib/languages/csharp";
import css from "highlight.js/lib/languages/css";
import diff from "highlight.js/lib/languages/diff";
import go from "highlight.js/lib/languages/go";
import graphql from "highlight.js/lib/languages/graphql";
import ini from "highlight.js/lib/languages/ini";
import java from "highlight.js/lib/languages/java";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import kotlin from "highlight.js/lib/languages/kotlin";
import markdown from "highlight.js/lib/languages/markdown";
import php from "highlight.js/lib/languages/php";
import plaintext from "highlight.js/lib/languages/plaintext";
import python from "highlight.js/lib/languages/python";
import ruby from "highlight.js/lib/languages/ruby";
import rust from "highlight.js/lib/languages/rust";
import scss from "highlight.js/lib/languages/scss";
import shell from "highlight.js/lib/languages/shell";
import sql from "highlight.js/lib/languages/sql";
import swift from "highlight.js/lib/languages/swift";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import yaml from "highlight.js/lib/languages/yaml";
import type { LanguageFn } from "highlight.js";
import { themeOf, type CodeTheme, type CodeThemeName } from "./themes";

const BUILT_IN: Record<string, LanguageFn> = { bash, c, cpp, csharp, css, diff, go, graphql, ini, java, javascript, json, kotlin, markdown, php, plaintext, python, ruby, rust, scss, shell, sql, swift, typescript, xml, yaml };

/** Elements' own highlight.js, its languages registered the first time it's used (nothing runs when it loads). */
let engine: ReturnType<typeof core.newInstance> | undefined;
const highlighter = () => {
  if (!engine) {
    engine = core.newInstance();
    for (const [name, language] of Object.entries(BUILT_IN)) engine.registerLanguage(name, language);
  }
  return engine;
};

/**
 * Adds a language Elements doesn't build in, as highlight.js defines it:
 * `registerLanguage("elixir", (await import("highlight.js/lib/languages/elixir")).default)`.
 */
export function registerLanguage(name: string, language: LanguageFn): void {
  highlighter().registerLanguage(name, language);
}

/** The languages (and their aliases' targets) code can be highlighted in. */
export const listLanguages = (): string[] => highlighter().listLanguages();

/** The monospace fonts code is shown in: the system's, then Consolas and Courier New (Outlook's). */
export const MONOSPACE = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";

const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
export const escapeHtml = (text: string) => text.replace(/[&<>"]/g, (ch) => ESCAPES[ch]);
/** CSS that can't end the attribute it's written in. */
export const attribute = (css: string) => css.replace(/[<>"]/g, "");

/** The languages said to have no grammar, each once: twenty at most, as a fence's label is whoever writes the Markdown's. */
const warned = new Set<string>();

/** A token's style in a theme: its scope's, or its parent's (`title.function` → `title`). */
function styleOf(theme: CodeTheme, scope: string): string | undefined {
  for (let s = scope; s; s = s.includes(".") ? s.slice(0, s.lastIndexOf(".")) : "") if (theme.tokens[s]) return theme.tokens[s];
  return undefined;
}

/** Each line of code, as HTML: its tokens in spans with the theme's styles (a token over several lines split at each). */
export function highlightLines(code: string, language: string | undefined, theme: CodeTheme, component = "CodeBlock"): string[] {
  const hljs = highlighter();
  let html: string;
  if (language && hljs.getLanguage(language)) html = hljs.highlight(code, { language, ignoreIllegals: true }).value;
  else {
    if (language && !warned.has(language) && warned.size <= 20) {
      warned.add(language);
      console.warn(
        warned.size > 20
          ? `[Unlayer] ${component}: more languages with no grammar are shown without colors, and not said.`
          : `[Unlayer] ${component} has no grammar for \`${language}\`, so it's shown without colors: add one with registerLanguage() from "@unlayer/react-elements/code".`
      );
    }
    html = escapeHtml(code);
  }
  const lines: string[] = [""];
  const open: Array<string | undefined> = [];
  const style = () => open.filter(Boolean).join("; ");
  for (const [token, scopes] of [...html.matchAll(/<span class="([^"]*)">|<\/span>|[^<]+/g)]) {
    if (scopes !== undefined) {
      // highlight.js's classes, `hljs-title function_`: the scope `title.function`.
      open.push(styleOf(theme, scopes.split(" ").map((s) => s.replace(/^hljs-/, "").replace(/_+$/, "")).join(".")));
    } else if (token === "</span>") open.pop();
    else
      token.split("\n").forEach((piece, i) => {
        if (i) lines.push("");
        if (piece) lines[lines.length - 1] += style() ? `<span style="${attribute(style())}">${piece}</span>` : piece;
      });
  }
  return lines;
}

export interface HighlightOptions {
  /** A language highlight.js knows (`ts`, `tsx`, `html`, `bash`, …); without one the code isn't colored. */
  language?: string;
  /** `light` (the default), `dark`, one of highlight.js's (`github-light`, `github-dark`, `one-dark`, `monokai`, `dracula`, `nord`, `solarized-light`, `solarized-dark`), or a theme of your own. */
  theme?: CodeThemeName | CodeTheme;
  /** Numbers each line; a number is the first line's. */
  lineNumbers?: boolean | number;
  /** The code's size (default `13px`). */
  fontSize?: number | string;
  /** Its line height: a ratio of the size (default 1.5), or a length. */
  lineHeight?: number | string;
  /** Its fonts (default: the system's monospace fonts, then Consolas and Courier New). */
  fontFamily?: string;
  /** Space around the code (default `16px`). */
  padding?: number | string;
  /** The block's corners (default `6px`). */
  borderRadius?: number | string;
  /** Long lines wrap (the default), or keep going (they scroll where a client can). */
  wrap?: boolean;
}

const px = (value: number | string) => (typeof value === "number" ? `${value}px` : value);

/** The code as email-safe HTML: inline styles only, the code's spaces and lines kept in every client, Outlook's too. */
export function highlightCode(code: string, options: HighlightOptions = {}): string {
  const theme = themeOf(options.theme);
  const lines = highlightLines(code.replace(/^\r?\n/, "").replace(/\s+$/, "").replace(/\r\n?/g, "\n"), options.language, theme);
  const size = px(options.fontSize ?? 13);
  const ratio = typeof options.lineHeight === "number" ? options.lineHeight : options.lineHeight === undefined ? 1.5 : undefined;
  // In pixels where the size is: Outlook reads no ratio.
  const lineHeight = ratio === undefined ? px(options.lineHeight!) : /^[\d.]+px$/.test(size) ? `${Math.round(parseFloat(size) * ratio)}px` : String(ratio);
  const font = attribute(`font-family: ${options.fontFamily ?? MONOSPACE}; font-size: ${size}; line-height: ${lineHeight}; mso-line-height-rule: exactly`);
  const pre = `margin: 0; padding: 0; ${font}; color: ${theme.color}; white-space: ${options.wrap === false ? "pre; overflow-x: auto" : "pre-wrap"}; word-wrap: break-word; text-align: left; direction: ltr`;
  const box = attribute(`width: 100%; border-collapse: separate; background-color: ${theme.background}; border-radius: ${px(options.borderRadius ?? 6)}${theme.border ? `; border: ${theme.border}` : ""}`);
  const padding = attribute(px(options.padding ?? 16));
  let inner: string;
  if (options.lineNumbers) {
    const first = typeof options.lineNumbers === "number" ? options.lineNumbers : 1;
    const width = String(first + lines.length - 1).length;
    // A row per line, so a number stays beside its line when the line wraps; the numbers aren't in the plain text.
    inner =
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; width: 100%">` +
      lines
        .map(
          (line, i) =>
            `<tr><td data-skip-in-text="true" width="${width * 8 + 12}" nowrap="nowrap" style="${font}; color: ${theme.lineNumbers}; text-align: right; vertical-align: top; padding: 0 12px 0 0; white-space: nowrap; user-select: none">${first + i}</td>` +
            `<td style="vertical-align: top"><pre style="${attribute(pre)}">${line || " "}</pre></td></tr>`
        )
        .join("") +
      `</table>`;
  } else inner = `<pre style="${attribute(pre)}"><code style="${font}">${lines.join("\n")}</code></pre>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${attribute(theme.background)}" style="${box}"><tr><td style="padding: ${padding}">${inner}</td></tr></table>`;
}
