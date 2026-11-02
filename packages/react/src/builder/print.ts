/**
 * A template's tree as JSX source in the new components, and as an element to render: what fromDesign() gives back.
 * Text runs are written on one line (JSX keeps spaces there); blocks one under another.
 */
import type { Child, Node } from "@unlayer-internal/elements-core";
import React from "react";
import * as primitives from "../primitives/components";

const PRIMITIVE = primitives.PRIMITIVE;

/** Each primitive's component, by its type. */
const COMPONENTS = new Map<string, React.ComponentType<any>>();
for (const value of Object.values(primitives)) {
  const type = typeof value === "function" ? (value as unknown as Record<symbol, string>)[PRIMITIVE] : undefined;
  if (type) COMPONENTS.set(type, value as React.ComponentType<any>);
}
COMPONENTS.set("DocumentPage", primitives.Document.Page);

/** The JSX name of a type. */
const tagName = (type: string) => (type === "DocumentPage" ? "Document.Page" : type);

/** The props of a node as its component takes them. */
function propsOf(node: Node): Record<string, unknown> {
  return {
    ...(node.id !== undefined ? { id: node.id } : {}),
    ...node.props,
    ...(node.style && Object.keys(node.style).length ? { style: node.style } : {}),
    ...(node.mobile ? { mobile: node.mobile } : {}),
    ...(node.hover ? { hover: node.hover } : {}),
    ...(node.hidden ? { hidden: node.hidden } : {}),
    ...(node.compat ? { compat: node.compat } : {}),
  };
}

/** The tree as an element. A component of the template's own needs passing in `components`, by its name. */
export function toElement(node: Node, components: Record<string, React.ComponentType<any>> = {}, key?: number): React.ReactElement {
  const component = COMPONENTS.get(node.type) ?? components[node.type];
  if (!component) throw new Error(`[Elements] fromDesign: <${node.type}> is a component of the template's own: pass it in the components option`);
  const children = (node.children ?? []).map((child, i) => (typeof child === "string" ? child : toElement(child, components, i)));
  return React.createElement(component, { ...propsOf(node), key }, ...children);
}

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

/** A value as JavaScript source: objects with bare keys where they can be. */
function js(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(js).join(", ")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value).filter(([, v]) => v !== undefined);
    return entries.length ? `{ ${entries.map(([k, v]) => `${IDENTIFIER.test(k) ? k : JSON.stringify(k)}: ${js(v)}`).join(", ")} }` : "{}";
  }
  return JSON.stringify(value);
}

function attribute(name: string, value: unknown): string {
  if (value === true) return name;
  if (typeof value === "string" && /^[^"&\n\\{}]*$/.test(value)) return `${name}="${value}"`;
  return `${name}={${js(value)}}`;
}

/**
 * Text as JSX children: as it is where JSX keeps it so, else a string expression. On a line of its own JSX drops the
 * spaces at its ends; among runs on one line it keeps them.
 */
function text(value: string, flat: boolean): string {
  const kept = /^[^{}<>&\n]+$/.test(value) && (flat ? /\S/.test(value) : !/^\s|\s$/.test(value) && !/\s{2,}/.test(value));
  return kept ? value : `{${JSON.stringify(value)}}`;
}

/** Whether a node holds a run of text (written on one line). */
const inline = (node: Node) => (node.children ?? []).some((child) => typeof child === "string" || ["Span", "Link", "LineBreak", "MergeTag"].includes(child.type));

function element(node: Node, indent: string, flat: boolean): string {
  const name = tagName(node.type);
  const attributes = Object.entries(propsOf(node)).map(([key, value]) => ` ${attribute(key, value)}`).join("");
  const children: Child[] = node.children ?? [];
  if (!children.length) return `<${name}${attributes} />`;
  if (flat || inline(node)) return `<${name}${attributes}>${children.map((child) => (typeof child === "string" ? text(child, true) : element(child, indent, true))).join("")}</${name}>`;
  const inner = `${indent}  `;
  return `<${name}${attributes}>\n${children.map((child) => `${inner}${typeof child === "string" ? text(child, false) : element(child, inner, false)}`).join("\n")}\n${indent}</${name}>`;
}

/** The tree as a module: the components it uses imported, a component returning it. */
export function printTemplate(root: Node, name = "Template"): string {
  const used = new Set<string>();
  const own = new Set<string>();
  const visit = (node: Node) => {
    const base = node.type === "DocumentPage" ? "Document" : node.type;
    (COMPONENTS.has(node.type) ? used : own).add(base);
    for (const child of node.children ?? []) if (typeof child !== "string") visit(child);
  };
  visit(root);
  const imports = [`import { ${[...used].sort().join(", ")} } from "@unlayer/react-elements/primitives";`];
  if (own.size) imports.push(`// The template's own components: ${[...own].sort().join(", ")} (import them from where they're defined).`);
  return `${imports.join("\n")}\n\nexport default function ${name}() {\n  return (\n    ${element(root, "    ", false)}\n  );\n}\n`;
}
