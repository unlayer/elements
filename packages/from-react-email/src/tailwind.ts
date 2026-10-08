/**
 * Resolve static Tailwind class strings to inline styles with React Email's
 * own <Tailwind> (and so Tailwind's engine and the template's config).
 */

import React from "react";
import { Tailwind } from "@react-email/components";
import { callSuspending } from "./expand";
import { boxSides } from "@unlayer/convert-core";
import type { Style } from "./styles";

export interface ResolvedClasses {
  styles: Map<string, Style>;
  /** Classes Tailwind couldn't inline (hover:, sm:, dark:, …), per string. */
  leftover: Map<string, string[]>;
  /** What leftover classes do on small screens (`mobile:!block` → display: block), by class. */
  phone: Map<string, Style>;
}

export const NO_CLASSES: ResolvedClasses = { styles: new Map(), leftover: new Map(), phone: new Map() };

export async function resolveTailwind(classNames: string[], config?: Record<string, unknown>, tailwind: unknown = Tailwind): Promise<ResolvedClasses> {
  const unique = [...new Set(classNames)];
  const styles = new Map<string, Style>();
  const leftover = new Map<string, string[]>();
  let css = "";
  if (unique.length === 0) return { styles, leftover, phone: new Map() };
  const children = [
    React.createElement("head", { key: "head" }),
    ...unique.map((className, i) => React.createElement("div", { key: i, className, "data-tw": i })),
  ];
  const result = await callSuspending(() => (tailwind as any)({ children, config }));
  React.Children.forEach(result as React.ReactNode, (child: any) => {
    if (child?.type === "head") css += textOf(child.props?.children);
    const index = child?.props?.["data-tw"];
    if (index === undefined) return;
    styles.set(unique[index], child.props.style ?? {});
    const rest = String(child.props.className ?? "").split(/\s+/).filter(Boolean);
    if (rest.length) leftover.set(unique[index], rest);
  });
  return { styles, leftover, phone: phoneStyles(css) };
}

/**
 * Whether a media query is for small screens: `max-width: 600px`, or the
 * range syntax (`width <= 480px`, `480px >= width`, as React Email 6 writes
 * it). Anything with a lower bound (`min-width`, `width >= …`) isn't.
 */
export function isPhoneQuery(query: string): boolean {
  const q = query.replace(/\s+/g, "");
  const upper = /max-(?:device-)?width|width<=?|[\d.]+(?:px|em|rem)>=?width/i.test(q);
  const lower = /min-(?:device-)?width|width>=?|[\d.]+(?:px|em|rem)<=?width/i.test(q);
  return upper && !lower;
}

/**
 * The rules a stylesheet applies on small screens (`max-width` media
 * queries), by class: `.mobile_imprtntblock{@media (max-width:600px){display:block!important}}`
 * (or the unnested form) → mobile_imprtntblock: { display: "block" }.
 */
export function phoneStyles(css: string): Map<string, Style> {
  return phoneRules(css).styles;
}

/** `phoneStyles`, and which of each class's phone declarations are `!important`. */
export function phoneRules(css: string): { styles: Map<string, Style>; important: Map<string, Set<string>> } {
  const out = new Map<string, Style>();
  const important = new Map<string, Set<string>>();
  css = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const add = (cls: string, query: string, body: string) => {
    if (!isPhoneQuery(query)) return;
    const style: Style = { ...(out.get(cls) ?? {}) };
    const strong = important.get(cls) ?? new Set<string>();
    for (const decl of body.split(";")) {
      const at = decl.indexOf(":");
      if (at < 0) continue;
      const name = decl.slice(0, at).trim().replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
      style[name] = decl.slice(at + 1).replace(/!\s*important/i, "").trim();
      if (/!\s*important/i.test(decl)) strong.add(name);
    }
    out.set(cls, style);
    important.set(cls, strong);
  };
  // Nested: .cls{@media (…){…}}
  for (const m of css.matchAll(/\.([\w-]+)\s*\{\s*@media\s*([^{]*)\{([^{}]*)\}\s*\}/g)) add(m[1], m[2], m[3]);
  // Classic: @media (…){.a{…}.b{…}}
  for (const m of css.matchAll(/@media\s*([^{]*)\{((?:\s*\.[\w-]+\s*\{[^{}]*\})+)\s*\}/g)) {
    for (const rule of m[2].matchAll(/\.([\w-]+)\s*\{([^{}]*)\}/g)) add(rule[1], m[1], rule[2]);
  }
  return { styles: out, important };
}

/** Styles React Email components set inline themselves (measured): a stylesheet rule can't override them. */
export const INLINE_DEFAULTS: Record<string, string[]> = {
  Text: ["fontSize", "lineHeight", "marginTop", "marginBottom"],
  Link: ["color", "textDecorationLine"],
  Button: ["lineHeight", "textDecoration", "display", "maxWidth"],
  Img: ["display", "outline", "border", "textDecoration"],
  Hr: ["width", "border", "borderTop"],
  Container: ["maxWidth"],
  Row: ["width"],
};

/** A rule's style without what the component's own inline style overrides (unless the rule is `!important`). */
export function underInline(component: string | undefined, rules: Style, important: Set<string>): Style {
  const inline = INLINE_DEFAULTS[component ?? ""] ?? [];
  if (!inline.length) return rules;
  const out: Style = { ...rules };
  if (out.margin !== undefined && !important.has("margin") && inline.some((blocked) => blocked.startsWith("margin"))) {
    // Only the sides the component doesn't set itself keep the rule's margin.
    const sides = boxSides(out, "margin");
    for (const side of ["Top", "Right", "Bottom", "Left"] as const) if (!inline.includes(`margin${side}`)) out[`margin${side}`] ??= `${sides[side.toLowerCase() as "top"]}px`;
    delete out.margin;
  }
  for (const key of Object.keys(out)) if (!important.has(key) && inline.includes(key)) delete out[key];
  return out;
}

/**
 * A head stylesheet's desktop rules on a single class (`.copy{color:#fff}`),
 * by class, and the selectors of the rules that aren't converted: other
 * selectors (tags, ids, combinators, pseudo-classes) and media queries other
 * than phone rules on classes (`phoneStyles` reads those). Imports, web fonts
 * and `*` resets are left to the callers that handle them.
 */
export function stylesheetRules(css: string): { classes: Map<string, Style>; important: Map<string, Set<string>>; other: string[] } {
  const classes = new Map<string, Style>();
  const important = new Map<string, Set<string>>();
  const other: string[] = [];
  const text = css.replace(/\/\*[\s\S]*?\*\//g, "");
  for (let i = 0; i < text.length; ) {
    const open = text.indexOf("{", i);
    if (open < 0) break;
    let close = open + 1;
    for (let depth = 1; close < text.length && depth; close++) depth += text[close] === "{" ? 1 : text[close] === "}" ? -1 : 0;
    const selector = text.slice(i, open).replace(/@import[^;]*;/g, "").trim();
    const body = text.slice(open + 1, close - 1);
    i = close;
    if (/^@font-face$|^\*$/.test(selector)) continue;
    const phone = isPhoneQuery;
    if (selector.startsWith("@media")) {
      const query = selector.slice(6);
      for (const rule of body.matchAll(/([^{}]+)\{[^{}]*\}/g)) if (!(phone(query) && /^\.[\w-]+$/.test(rule[1].trim()))) other.push(`${rule[1].trim()} ${selector}`);
    } else if (/^\.[\w-]+$/.test(selector) && body.includes("{")) {
      const query = /@media\s*([^{]*)\{/.exec(body)?.[1] ?? "";
      if (!phone(query)) other.push(`${selector} @media ${query.trim()}`);
    } else if (/^\.[\w-]+$/.test(selector)) {
      const style: Style = { ...(classes.get(selector.slice(1)) ?? {}) };
      const strong = important.get(selector.slice(1)) ?? new Set<string>();
      for (const decl of body.split(";")) {
        const at = decl.indexOf(":");
        if (at <= 0) continue;
        const name = decl.slice(0, at).trim().replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
        style[name] = decl.slice(at + 1).replace(/!\s*important/i, "").trim();
        if (/!\s*important/i.test(decl)) strong.add(name);
      }
      classes.set(selector.slice(1), style);
      important.set(selector.slice(1), strong);
    } else if (selector) {
      other.push(selector);
    }
  }
  return { classes, important, other };
}

/**
 * Whether a leftover class only makes its element full width on phones: the
 * conversion carries it out by stacking the column there, so it isn't lost.
 */
export function stacksOnly(cls: string, phone: Map<string, Style>): boolean {
  const style = phone.get(cls);
  if (!style || !Object.keys(style).length) return false;
  return Object.entries(style).every(([key, value]) => (key === "display" && value === "block") || ((key === "width" || key === "maxWidth") && value === "100%"));
}

/** Whether classes make an element full width on phones (a column that stacks). */
export function stacksOnPhones(classes: readonly string[], phone: Map<string, Style>): boolean {
  return classes.some((cls) => {
    const style = phone.get(cls);
    return Boolean(style && (style.display === "block" || style.width === "100%"));
  });
}

function textOf(node: unknown): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  const props = (node as { props?: { children?: unknown; dangerouslySetInnerHTML?: { __html?: string } } }).props;
  return props?.dangerouslySetInnerHTML?.__html ?? textOf(props?.children);
}
