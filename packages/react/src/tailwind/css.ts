/**
 * The stylesheet Tailwind's compiler builds, read back: each rule with the at-rules around it (`@media`), the
 * theme's variables (`:root { --color-red-500: … }`) and the initial values of its registered properties
 * (`@property --tw-border-style { initial-value: solid }`). Tailwind writes regular CSS, so this reads what it
 * writes: blocks, strings, brackets, comments, and rules nested in a rule.
 */

export interface Declaration {
  property: string;
  value: string;
  important: boolean;
}

export interface Rule {
  /** The class it's for, unescaped (`max-sm:p-2`), and the selector around it (`:hover`, `:where(` … `)`). */
  token: string;
  before: string;
  after: string;
  /** The at-rules it's in, outermost first (`@media (width < 40rem)`); `@layer` isn't one. */
  at: string[];
  declarations: Declaration[];
  /** Its place in the stylesheet: a later rule wins. */
  order: number;
}

export interface Sheet {
  rules: Rule[];
  vars: Map<string, string>;
  initial: Map<string, string>;
}

interface Block {
  prelude: string;
  body: string;
  children: Block[];
}

/** Where a string or a bracket that starts at `i` ends (just past it). */
export function skip(text: string, i: number): number {
  const open = text[i];
  if (open === '"' || open === "'") {
    for (let j = i + 1; j < text.length; j++) {
      if (text[j] === "\\") j++;
      else if (text[j] === open) return j + 1;
    }
    return text.length;
  }
  let depth = 0;
  for (let j = i; j < text.length; j++) {
    const c = text[j];
    if (c === '"' || c === "'") j = skip(text, j) - 1;
    else if (c === "(") depth++;
    else if (c === ")" && --depth === 0) return j + 1;
  }
  return text.length;
}

/** Splits `text` at `separator` where it isn't in a string or brackets. */
export function split(text: string, separator: string): string[] {
  const out: string[] = [];
  let from = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"' || c === "'" || c === "(") i = skip(text, i) - 1;
    else if (c === separator) {
      out.push(text.slice(from, i));
      from = i + 1;
    }
  }
  out.push(text.slice(from));
  return out;
}

function read(text: string, i: number): { children: Block[]; body: string; end: number } {
  const children: Block[] = [];
  let body = "";
  let buffer = "";
  while (i < text.length) {
    const c = text[i];
    if (c === '"' || c === "'" || c === "(") {
      const end = skip(text, i);
      buffer += text.slice(i, end);
      i = end;
    } else if (c === "{") {
      const inner = read(text, i + 1);
      children.push({ prelude: buffer.trim(), body: inner.body, children: inner.children });
      buffer = "";
      i = inner.end;
    } else if (c === "}") {
      return { children, body: body + buffer, end: i + 1 };
    } else {
      buffer += c;
      if (c === ";") {
        body += buffer;
        buffer = "";
      }
      i++;
    }
  }
  return { children, body: body + buffer, end: i };
}

function declarations(body: string): Declaration[] {
  const out: Declaration[] = [];
  for (const part of split(body, ";")) {
    const colon = part.indexOf(":");
    if (colon <= 0) continue;
    const property = part.slice(0, colon).trim();
    let value = part.slice(colon + 1).trim();
    const important = /!\s*important$/i.test(value);
    if (important) value = value.replace(/\s*!\s*important$/i, "");
    if (property && value) out.push({ property: property.startsWith("--") ? property : property.toLowerCase(), value, important });
  }
  return out;
}

const CLASS = /\.((?:\\[0-9a-fA-F]{1,6}\s?|\\[^\n0-9a-fA-F]|[\w -￿-])+)/;

/** A class name as a selector escapes it, unescaped (`max-sm\:p-2` → `max-sm:p-2`). */
export function unescape(name: string): string {
  return name.replace(/\\([0-9a-fA-F]{1,6})\s?|\\(.)/g, (_, hex: string | undefined, char: string | undefined) => (hex ? String.fromCodePoint(parseInt(hex, 16)) : char!));
}

export function parseSheet(css: string): Sheet {
  const sheet: Sheet = { rules: [], vars: new Map(), initial: new Map() };
  const walk = (blocks: Block[], at: string[], parent?: string) => {
    for (const block of blocks) {
      const { prelude } = block;
      if (/^@layer\b/i.test(prelude)) walk(block.children, at, parent);
      else if (/^@property\b/i.test(prelude)) {
        const initial = declarations(block.body).find((d) => d.property === "initial-value");
        if (initial) sheet.initial.set(prelude.slice(9).trim(), initial.value);
      } else if (prelude.startsWith("@")) {
        // In a rule (`.x { @media … { … } }`), what's in it is that rule's.
        if (parent) add(parent, [...at, prelude], block.body);
        walk(block.children, [...at, prelude], parent);
      } else {
        const selector = parent && prelude.includes("&") ? prelude.replace(/&/g, parent) : parent ? `${parent} ${prelude}` : prelude;
        add(selector, at, block.body);
        walk(block.children, at, selector);
      }
    }
  };
  const add = (selector: string, at: string[], body: string) => {
    const list = declarations(body);
    if (!list.length) return;
    const selectors = split(selector, ",").map((s) => s.trim());
    if (selectors.every((s) => s === ":root" || s === ":host")) {
      for (const d of list) if (d.property.startsWith("--")) sheet.vars.set(d.property, d.value);
      return;
    }
    for (const one of selectors) {
      const match = CLASS.exec(one);
      if (!match) continue;
      sheet.rules.push({
        token: unescape(match[1]),
        before: one.slice(0, match.index),
        after: one.slice(match.index + match[0].length),
        at,
        declarations: list,
        order: sheet.rules.length,
      });
    }
  };
  walk(read(css.replace(/\/\*[\s\S]*?\*\//g, ""), 0).children, []);
  return sheet;
}
