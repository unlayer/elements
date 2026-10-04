/**
 * Resolve static Tailwind class strings to inline styles with React Email's
 * own <Tailwind> (and so Tailwind's engine and the template's config).
 */

import React from "react";
import { Tailwind } from "@react-email/components";
import { callSuspending } from "./expand";
import type { Style } from "./styles";

export interface ResolvedClasses {
  styles: Map<string, Style>;
  /** Classes Tailwind couldn't inline (hover:, sm:, dark:, …), per string. */
  leftover: Map<string, string[]>;
  /** What leftover classes do on small screens (`mobile:!block` → display: block), by class. */
  phone: Map<string, Style>;
}

export const NO_CLASSES: ResolvedClasses = { styles: new Map(), leftover: new Map(), phone: new Map() };

export async function resolveTailwind(classNames: string[], config?: Record<string, unknown>): Promise<ResolvedClasses> {
  const unique = [...new Set(classNames)];
  const styles = new Map<string, Style>();
  const leftover = new Map<string, string[]>();
  let css = "";
  if (unique.length === 0) return { styles, leftover, phone: new Map() };
  const children = [
    React.createElement("head", { key: "head" }),
    ...unique.map((className, i) => React.createElement("div", { key: i, className, "data-tw": i })),
  ];
  const result = await callSuspending(() => (Tailwind as any)({ children, config }));
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
 * The rules a stylesheet applies on small screens (`max-width` media
 * queries), by class: `.mobile_imprtntblock{@media (max-width:600px){display:block!important}}`
 * (or the unnested form) → mobile_imprtntblock: { display: "block" }.
 */
export function phoneStyles(css: string): Map<string, Style> {
  const out = new Map<string, Style>();
  const add = (cls: string, query: string, body: string) => {
    if (!/max-width|width\s*<|max-device-width/i.test(query) || /min-width|width\s*>/i.test(query)) return;
    const style: Style = { ...(out.get(cls) ?? {}) };
    for (const decl of body.split(";")) {
      const at = decl.indexOf(":");
      if (at < 0) continue;
      const name = decl.slice(0, at).trim().replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
      style[name] = decl.slice(at + 1).replace(/!\s*important/i, "").trim();
    }
    out.set(cls, style);
  };
  // Nested: .cls{@media (…){…}}
  for (const m of css.matchAll(/\.([\w-]+)\s*\{\s*@media\s*([^{]*)\{([^{}]*)\}\s*\}/g)) add(m[1], m[2], m[3]);
  // Classic: @media (…){.a{…}.b{…}}
  for (const m of css.matchAll(/@media\s*([^{]*)\{((?:\s*\.[\w-]+\s*\{[^{}]*\})+)\s*\}/g)) {
    for (const rule of m[2].matchAll(/\.([\w-]+)\s*\{([^{}]*)\}/g)) add(rule[1], m[1], rule[2]);
  }
  return out;
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
