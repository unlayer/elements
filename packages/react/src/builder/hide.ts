/**
 * An item's hidden properties: what of a template's node its tool has no field for (manifest.ts), written in its
 * values as the builder's editor for it would write it (values.ts), its phone values in `_override.mobile`. What a
 * node has that's neither written to a field, folded into another value (its place's spacing), nor a hidden property
 * is left out, and said.
 */
import type { Json, Node } from "@unlayer-internal/elements-core";
import { HIDDEN } from "./manifest";
import { decode, encode, kindOf, type Values } from "./values";

/** Values merged: `_override`'s devices key by key. */
export function merge(into: Values, more: Values): Values {
  const out: Values = { ...into };
  for (const [key, value] of Object.entries(more)) {
    if (key === "_override" && out._override && typeof value === "object") {
      const override: Values = { ...out._override };
      for (const [device, values] of Object.entries(value as Values)) override[device] = { ...override[device], ...(values as Values) };
      out._override = override;
    } else out[key] = value;
  }
  return out;
}

/**
 * A node's hidden properties for a tool: each the manifest lists that the node has (its own, or `extra`'s: a text
 * style it inherits), but those in `skip` (written to a field or folded).
 */
export function hiddenOf(tool: string, node: Node, skip: readonly string[] = [], extra: Record<string, Json> = {}): Values {
  const out: Values = {};
  const phone: Values = {};
  for (const { path, key } of HIDDEN[tool] ?? []) {
    if (skip.includes(path)) continue;
    if (path.startsWith("hidden.")) {
      // A column's hiding, which the builder has for rows and blocks only.
      const device = path.slice(7) as "mobile" | "desktop";
      if (node.hidden?.[device]) out._override = merge(out._override ?? {}, { [device]: { [key]: true } });
      continue;
    }
    const [part, name] = [path.slice(0, path.indexOf(".")), path.slice(path.indexOf(".") + 1)];
    const value = part === "props" ? node.props?.[name] : (node.style?.[name] ?? (Object.hasOwn(extra, name) ? extra[name] : undefined));
    const kind = kindOf(node.type, path);
    if (value !== undefined && kind) out[key] = encode(kind.name, value);
    const mobile = part === "style" ? node.mobile?.[name] : undefined;
    if (mobile !== undefined && kind) phone[key] = encode(kind.name, mobile);
  }
  if (Object.keys(phone).length) out._override = merge(out._override ?? {}, { mobile: phone });
  return out;
}

/** What of a node has no place in the builder's design: not a field (`fields`), folded, nor a hidden property of its tool. */
export function leftOut(tool: string, node: Node, fields: readonly string[]): string[] {
  const hidden = new Set((HIDDEN[tool] ?? []).map((entry) => entry.path));
  const out: string[] = [];
  for (const part of ["props", "style", "mobile", "hover"] as const) {
    for (const key of Object.keys(node[part] ?? {})) {
      const path = `${part}.${key}`;
      // A phone value that's hidden on desktop is hidden on phones too.
      // A share of a Row is its column's width (`cells`).
      if (fields.includes(path) || hidden.has(path) || (part === "mobile" && hidden.has(`style.${key}`)) || path === "style.flex") continue;
      out.push(path);
    }
  }
  return out;
}

/** A node's parts that hidden properties set. */
export interface HiddenParts {
  props: Record<string, Json>;
  style: Record<string, Json>;
  mobile: Record<string, Json>;
  hidden: { mobile?: boolean; desktop?: boolean };
}

/**
 * An item's hidden properties read back for a node of `type`: each the manifest lists for its tool, parsed by the
 * kind its component gives it. One that doesn't parse (the design was edited by hand) is left out and said.
 */
export function readHidden(tool: string, type: string, values: Values, say: (message: string) => void): HiddenParts {
  const out: HiddenParts = { props: {}, style: {}, mobile: {}, hidden: {} };
  const phone = (values._override?.mobile ?? {}) as Values;
  for (const { path, key } of HIDDEN[tool] ?? []) {
    if (path.startsWith("hidden.")) {
      const device = path.slice(7) as "mobile" | "desktop";
      if ((values._override?.[device] as Values | undefined)?.[key] === true) out.hidden[device] = true;
      continue;
    }
    const kind = kindOf(type, path);
    const [part, name] = [path.slice(0, path.indexOf(".")), path.slice(path.indexOf(".") + 1)];
    for (const [where, from] of [[part, values], ["mobile", phone]] as const) {
      if (!Object.hasOwn(from, key) || from[key] === undefined || from[key] === null || from[key] === "") continue;
      if (where === "mobile" && part !== "style") continue;
      if (!kind) {
        say(`its ${key} is no ${type}'s: left out`);
        continue;
      }
      const parsed = kind.parse(decode(kind.name, from[key]));
      if (!parsed.ok) {
        say(`its ${key} can't be read (${parsed.message}): left out`);
        continue;
      }
      out[where as "props" | "style" | "mobile"][name] = parsed.value;
    }
  }
  return out;
}
