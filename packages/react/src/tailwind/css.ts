/**
 * The stylesheet Tailwind's compiler builds, read back: each rule with the at-rules around it (`@media`), the
 * theme's variables (`:root { --color-red-500: … }`) and the initial values of its registered properties
 * (`@property --tw-border-style { initial-value: solid }`). Tailwind writes regular CSS, so this reads what it
 * writes as CSS reads it: blocks, escapes, strings, brackets, comments, and rules nested in a rule. What one rule
 * holds doesn't change how the next reads, unless it runs to the end (a bracket, a string or a comment left open:
 * the sheet isn't `clean` then).
 */

export interface Declaration {
  property: string;
  value: string;
  important: boolean;
}

export interface Rule {
  /**
   * The class it's for, unescaped (`max-sm:p-2`), and the selector around it (`:hover`, `:where(` … `)`, a variant's
   * `.group:hover `). Tailwind writes each class's rules in a rule of its own (`.max-sm\:p-2 { … }`), its variants'
   * selectors nested in it: the class is that rule's, wherever it is in the selector.
   */
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
  /** Whether it read as written: nothing left open at its end (a block, a bracket, a string, a comment), nothing closed that wasn't. */
  clean: boolean;
}

interface Block {
  prelude: string;
  body: string;
  children: Block[];
}

const CLOSE: Record<string, string> = { "(": ")", "[": "]", "{": "}" };

/**
 * Where what starts at `i` ends (just past it), as CSS reads it: an escape (`\(`), a string (to its quote, or to the
 * line's end, where CSS ends one left open), a comment, or a bracket (to the one that closes it, whatever is in it; a
 * closing one of another kind is a character there). What runs to the end of `text` is said to `open`.
 */
function end(text: string, i: number, open?: () => void): number {
  const c = text[i];
  if (c === "\\") return Math.min(i + 2, text.length);
  if (c === '"' || c === "'") {
    for (let j = i + 1; j < text.length; j++) {
      if (text[j] === "\\") j++;
      else if (text[j] === c) return j + 1;
      else if (text[j] === "\n") return open?.(), j;
    }
  } else if (c === "/" && text[i + 1] === "*") {
    const close = text.indexOf("*/", i + 2);
    if (close >= 0) return close + 2;
  } else if (CLOSE[c]) {
    for (let j = i + 1; j < text.length; ) {
      if (text[j] === CLOSE[c]) return j + 1;
      j = starts(text, j) ? end(text, j, open) : j + 1;
    }
  } else return i + 1;
  open?.();
  return text.length;
}

/** Whether what's at `i` is an escape, a string, a comment or a bracket (see `end`). */
const starts = (text: string, i: number) => text[i] === "\\" || text[i] === '"' || text[i] === "'" || !!CLOSE[text[i]] || (text[i] === "/" && text[i + 1] === "*");

/** Where a string or a bracket that starts at `i` ends (just past it): see `end`. */
export const skip = (text: string, i: number): number => end(text, i);

/** Splits `text` at `separator` where it isn't in an escape, a string, a comment or brackets. */
export function split(text: string, separator: string): string[] {
  const out: string[] = [];
  let from = 0;
  for (let i = 0; i < text.length; ) {
    if (starts(text, i)) i = end(text, i);
    else if (text[i++] === separator) {
      out.push(text.slice(from, i - 1));
      from = i;
    }
  }
  out.push(text.slice(from));
  return out;
}

/** CSS without its comments (as CSS reads them: not in a string or an escape). */
function uncommented(text: string, open: () => void): string {
  let out = "";
  for (let i = 0; i < text.length; ) {
    const at = i;
    if (text[i] === "/" && text[i + 1] === "*") i = end(text, i, open);
    else {
      i = text[i] === "\\" || text[i] === '"' || text[i] === "'" ? end(text, i, open) : i + 1;
      out += text.slice(at, i);
    }
  }
  return out;
}

/** The blocks from `i`, to the `}` that closes them (`top`: to the end). What isn't closed, or closes nothing, is said to `open`. */
function read(text: string, i: number, open: () => void, top = false): { children: Block[]; body: string; end: number } {
  const children: Block[] = [];
  let body = "";
  let buffer = "";
  while (i < text.length) {
    const c = text[i];
    if (c === "{") {
      const inner = read(text, i + 1, open);
      children.push({ prelude: buffer.trim(), body: inner.body, children: inner.children });
      buffer = "";
      i = inner.end;
    } else if (c === "}") {
      if (!top) return { children, body: body + buffer, end: i + 1 };
      open();
      i++;
    } else if (starts(text, i)) {
      const to = end(text, i, open);
      buffer += text.slice(i, to);
      i = to;
    } else {
      buffer += c;
      if (c === ";") {
        body += buffer;
        buffer = "";
      }
      i++;
    }
  }
  if (!top) open();
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

const CLASS = /\.((?:\\[0-9a-fA-F]{1,6}\s?|\\[^\n0-9a-fA-F]|[\w -￿-])+)/g;

/** A class name as a selector escapes it, unescaped (`max-sm\:p-2` → `max-sm:p-2`). */
export function unescape(name: string): string {
  return name.replace(/\\([0-9a-fA-F]{1,6})\s?|\\(.)/g, (_, hex: string | undefined, char: string | undefined) => (hex ? String.fromCodePoint(parseInt(hex, 16)) : char!));
}

export function parseSheet(css: string): Sheet {
  const sheet: Sheet = { rules: [], vars: new Map(), initial: new Map(), clean: true };
  const open = () => void (sheet.clean = false);
  // (`owner`: the class of the rule a nested one is in, where that rule is for one class.)
  const walk = (blocks: Block[], at: string[], parent?: string, owner?: string) => {
    for (const block of blocks) {
      const { prelude } = block;
      if (/^@layer\b/i.test(prelude)) walk(block.children, at, parent, owner);
      else if (/^@property\b/i.test(prelude)) {
        const initial = declarations(block.body).find((d) => d.property === "initial-value");
        if (initial) sheet.initial.set(prelude.slice(9).trim(), initial.value);
      } else if (prelude.startsWith("@")) {
        // In a rule (`.x { @media … { … } }`), what's in it is that rule's.
        if (parent) add(parent, [...at, prelude], block.body, owner);
        walk(block.children, [...at, prelude], parent, owner);
      } else {
        const selector = parent && prelude.includes("&") ? prelude.replace(/&/g, parent) : parent ? `${parent} ${prelude}` : prelude;
        const own = parent ? owner : [...prelude.matchAll(CLASS)].find((m) => m[0] === prelude)?.[1];
        add(selector, at, block.body, own);
        walk(block.children, at, selector, own);
      }
    }
  };
  const add = (selector: string, at: string[], body: string, owner?: string) => {
    const list = declarations(body);
    if (!list.length) return;
    const selectors = split(selector, ",").map((s) => s.trim());
    if (selectors.every((s) => s === ":root" || s === ":host")) {
      for (const d of list) if (d.property.startsWith("--")) sheet.vars.set(d.property, d.value);
      return;
    }
    for (const one of selectors) {
      // Its class: the one its rule is for, else the first.
      const classes = [...one.matchAll(CLASS)];
      const match = classes.find((m) => m[1] === owner) ?? classes[0];
      if (!match) continue;
      sheet.rules.push({
        token: unescape(match[1]),
        before: one.slice(0, match.index!),
        after: one.slice(match.index! + match[0].length),
        at,
        declarations: list,
        order: sheet.rules.length,
      });
    }
  };
  walk(read(uncommented(css, open), 0, open, true).children, []);
  return sheet;
}
