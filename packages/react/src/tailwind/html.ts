/**
 * Tailwind classes in markup (an Html block's `html`, a Paragraph's): each element's classes as its inline style,
 * as email clients need them, with the same conversions as classes on components (hex colors, pixels). A class
 * Tailwind doesn't know stays (your own stylesheet's); one Tailwind knows leaves the class attribute, inlined, or
 * reported where it can't be (a phone or hover variant needs a stylesheet, and so does what a class sets that a phone
 * or breakpoint variant sets too: the rest of it is inlined). The markup is read as a browser reads it
 * (src/utils/html-tags.ts), and only the class attributes and the styles they give are written again.
 */
import type { ClassCondition, ClassDeclaration, ClassDeclarations } from "./declarations";
import { commentEnd, rawTextEnd, readTag, type Attribute } from "../utils/html-tags";

// Logical sides as in a left-to-right document, and those a right-to-left one changes: email clients read only physical ones.
const SIDES: Record<string, string[]> = { inline: ["left", "right"], block: ["top", "bottom"], "inline-start": ["left"], "inline-end": ["right"], "block-start": ["top"], "block-end": ["bottom"] };
const CORNERS: Record<string, string> = { "start-start": "top-left", "start-end": "top-right", "end-end": "bottom-right", "end-start": "bottom-left" };
const RTL_SIDES: Record<string, string[]> = { "inline-start": ["right"], "inline-end": ["left"] };
const RTL_CORNERS: Record<string, string> = { "start-start": "top-right", "start-end": "top-left", "end-end": "bottom-left", "end-start": "bottom-right" };
/** Elements without an end tag or content: no element after them is in them. */
const VOID = /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/;
/** Elements whose text has no tags in it, to their end tag (`plaintext`: to the end). */
const RAW_TEXT = /^(script|style|textarea|title|xmp|iframe|noembed|noframes|plaintext)$/;

/** A class attribute's names: split where HTML splits them, the references a class name can hold read. */
const NAMES = /[^\t\n\f\r ]+/g;
const decode = (text: string) =>
  text.replace(/&(?:#x([\da-f]+);?|#(\d+);?|(amp|lt|gt|quot|apos);)/gi, (whole, hex?: string, n?: string, name?: string) =>
    name ? ({ amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" } as Record<string, string>)[name.toLowerCase()] : String.fromCodePoint(Math.min(parseInt(hex ?? n!, hex ? 16 : 10), 0x10ffff)) || whole
  );
/** Text in a `"`-quoted value. */
const escape = (text: string) => text.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
/** A value as written, in a `"`-quoted one (its references, which mean the same there, kept). */
const requote = (attribute: Attribute) => (attribute.value ?? "").replace(/"/g, "&quot;");

/** When a declaration that can't be inline applies. */
const WHEN: Record<ClassCondition, string> = { always: "", phone: "on phones only", desktop: "above a screen width only", hover: "on hover" };

const box = (name: (side: string) => string) => ["top", "right", "bottom", "left"].map(name);
/** A shorthand's longhands, in the order its value gives them (its sides: top, right, bottom, left). */
const LONGHANDS: Record<string, string[]> = {
  padding: box((s) => `padding-${s}`),
  margin: box((s) => `margin-${s}`),
  inset: box((s) => s),
  "border-width": box((s) => `border-${s}-width`),
  "border-style": box((s) => `border-${s}-style`),
  "border-color": box((s) => `border-${s}-color`),
  "border-radius": ["top-left", "top-right", "bottom-right", "bottom-left"].map((c) => `border-${c}-radius`),
  "inset-inline": ["inset-inline-start", "inset-inline-end"],
  "inset-block": ["inset-block-start", "inset-block-end"],
  gap: ["row-gap", "column-gap"],
  overflow: ["overflow-x", "overflow-y"],
};
/** Shorthands whose value doesn't give their longhands by place (`1px solid red`): what they set, not split. */
const SETS: Record<string, string[]> = {
  border: ["width", "style", "color"].flatMap((p) => box((s) => `border-${s}-${p}`)),
  ...Object.fromEntries(["top", "right", "bottom", "left"].map((s) => [`border-${s}`, [`border-${s}-width`, `border-${s}-style`, `border-${s}-color`]])),
  background: ["color", "image", "position", "size", "repeat", "attachment", "origin", "clip"].map((p) => `background-${p}`),
};

/**
 * What a property sets, as email clients' sides (an inline start the left, or the right in `rtl`): its longhands, or
 * itself. Two declarations that set one of the same can't both be inline.
 */
function sets(property: string, rtl: boolean): string[] {
  const all = SETS[property] ?? LONGHANDS[property] ?? [property];
  return all.map((p) => {
    const inset = /^inset-(inline|block)-(start|end)$/.exec(p);
    if (!inset) return p;
    return inset[1] === "block" ? (inset[2] === "start" ? "top" : "bottom") : (inset[2] === "start") !== rtl ? "left" : "right";
  });
}

/** A value's parts: between the spaces outside brackets. */
const PARTS = /(?:[^\s()]|\((?:[^()]|\([^()]*\))*\))+/g;

/** A shorthand's value as its longhands' (`1px 2px` is a box's top and bottom, then its sides), or undefined where it doesn't say. */
function spread(property: string, value: string): string[] | undefined {
  const longhands = LONGHANDS[property];
  const parts = value.match(PARTS) ?? [];
  if (!longhands || !parts.length || parts.length > longhands.length || /\/|var\(/.test(value) || value.replace(PARTS, "").trim()) return undefined;
  const [a, b = a, c = a, d = b] = parts as [string, string?, string?, string?];
  return longhands.length === 2 ? [a, b] : [a, b, c, d];
}

/** Names as a list: `a`, `b` and `c`. */
const and = (names: string[]) => names.map((n) => `\`${n}\``).join(", ").replace(/, (?=[^,]*$)/, " and ");

/**
 * A declaration's properties as email clients read them: logical sides as physical ones (`rtl`: on an element that
 * reads right to left, where inline start is the right), `text-decoration-line` as `text-decoration`.
 */
function physical(property: string, rtl: boolean): string[] {
  const side = /^(padding|margin|border)-(inline|block)(-start|-end)?(-width|-style|-color)?$/.exec(property);
  const sides = side && side[2] + (side[3] ?? "");
  if (side) return ((rtl && RTL_SIDES[sides!]) || SIDES[sides!]).map((s) => `${side[1]}-${s}${side[4] ?? ""}`);
  const corner = /^border-(start|end)-(start|end)-radius$/.exec(property);
  const at = corner && `${corner[1]}-${corner[2]}`;
  if (corner) return [`border-${(rtl && RTL_CORNERS[at!]) || CORNERS[at!]}-radius`];
  return [property === "text-decoration-line" ? "text-decoration" : property];
}

/**
 * `html` with Tailwind's classes inlined; `warn` says what isn't. `rtl`: the document reads right to left. An element
 * reads as its own `dir` says (`rtl`, or `ltr` and `auto`, which can't be told here, as left to right), else as the
 * element it's in, else as the document: its logical sides are those. (An element whose end tag is left out, as a
 * `<p>` or `<li>` can be, is taken to hold what follows it up to its parent's end tag.) A tag's first `class` is its
 * class, as a browser reads it (the others are left out once it's rewritten); comments, raw text (`<script>`,
 * `<style>`, `<textarea>`, …) and what isn't a tag stay as they are.
 */
export function inlineClasses(html: string, read: (className: string) => ClassDeclarations, warn: (text: string) => void, rtl = false): string {
  const said = new Set<string>();
  const once = (text: string) => !said.has(text) && (said.add(text), warn(text));
  // The elements open where a tag is, each with whether it reads right to left.
  const open: Array<{ tag: string; rtl: boolean }> = [];
  let out = "";
  // Where the input is written out to.
  let written = 0;
  for (let i = 0; i < html.length; ) {
    const lt = html.indexOf("<", i);
    if (lt < 0) break;
    const comment = commentEnd(html, lt);
    if (comment !== undefined) {
      i = comment;
      continue;
    }
    const tag = readTag(html, lt);
    if (tag === undefined) {
      i = lt + 1;
      continue;
    }
    // (A tag the markup ends in is left as it is.)
    if (!tag) break;
    i = tag.end;
    if (tag.close) {
      // It ends, and what's still open in it (as the browser ends them).
      const at = open.map((e) => e.tag).lastIndexOf(tag.name);
      if (at >= 0) open.length = at;
      continue;
    }
    const first = (name: string) => tag.attributes.find((a) => a.name === name);
    const dir = first("dir")?.value?.trim().toLowerCase();
    const right = dir === "rtl" ? true : dir === "ltr" || dir === "auto" ? false : open.length ? open[open.length - 1].rtl : rtl;
    const rewritten = classes(html.slice(lt, tag.end), tag.attributes, tag.nameEnd, lt, right, read, once);
    if (rewritten !== undefined) {
      out += html.slice(written, lt) + rewritten;
      written = tag.end;
    }
    if (RAW_TEXT.test(tag.name)) i = tag.name === "plaintext" ? html.length : rawTextEnd(html, tag.name, i);
    else if (!VOID.test(tag.name)) open.push({ tag: tag.name, rtl: right });
  }
  return out + html.slice(written);
}

/**
 * A start tag (`text`, at `offset` in the markup) with its classes inlined, or undefined where none are Tailwind's: its
 * first class attribute holds the classes that stay (or goes), its others go, its first style attribute starts with the
 * inlined declarations (or one is added after its attributes). The rest is as written.
 */
function classes(text: string, attributes: Attribute[], nameEnd: number, offset: number, rtl: boolean, read: (className: string) => ClassDeclarations, once: (text: string) => void): string | undefined {
  const list = attributes.filter((a) => a.name === "class");
  const given = [...(list[0]?.value ?? "").matchAll(NAMES)].map((m) => m[0]);
  if (!given.length) return undefined;
  // (A name with a space other than HTML's in it isn't one of Tailwind's.)
  const names = given.map((name) => (/\s/.test(decode(name)) ? undefined : decode(name)));
  const found = read(names.filter((name) => name !== undefined).join(" "));
  const yours = new Set<string>();
  for (const { className: name, reason } of found.ignored) {
    // Not Tailwind's: one of yours, left for your stylesheet.
    if (reason === "Tailwind has no such class") yours.add(name);
    else once(`ignores class \`${name}\` in its markup: ${reason}`);
  }
  const kept = given.filter((_, i) => names[i] === undefined || yours.has(names[i]!));
  if (kept.length === given.length) return undefined;
  // What a class sets on every screen that a phone or breakpoint variant sets on one isn't inline either: it would
  // apply on that screen too (`hidden md:block` would hide the element on every screen). The rest of the class is
  // (`px-4 md:pl-2`: its right padding). (Without hover, an element is as its classes say without `hover:`: those are.)
  const screens = new Map<string, ClassDeclaration>();
  for (const d of found.declarations) if (d.when === "phone" || d.when === "desktop") for (const property of physical(d.property, rtl)) for (const p of sets(property, rtl)) if (!screens.has(p)) screens.set(p, d);
  const css: string[] = [];
  // What's left out of each class, by the variant that sets it (with the part of it that sets, where it's less): said after.
  const left = new Map<string, { d: ClassDeclaration; by: ClassDeclaration; names: string[]; part?: string[] }>();
  const leave = (d: ClassDeclaration, by: ClassDeclaration, names: string[], part?: string[]) => {
    const key = `${d.className} ${by.className} ${part ?? ""}`;
    if (left.has(key)) left.get(key)!.names.push(...names);
    else left.set(key, { d, by, names, part });
  };
  for (const d of found.declarations) {
    if (d.when !== "always") continue;
    const write = (property: string, value: string) => css.push(`${property}: ${value}${d.important ? " !important" : ""}`);
    for (const property of physical(d.property, rtl)) {
      const parts = SETS[property] ?? LONGHANDS[property] ?? [property];
      const by = sets(property, rtl).map((p) => screens.get(p));
      if (!by.some(Boolean)) {
        write(property, d.value);
        continue;
      }
      // Where variants set some of it, the rest is inline, each longhand with its part of the value; where the value
      // doesn't say which part is whose (`1px solid red`), it's left out whole.
      const every = by.every(Boolean);
      const values = every ? undefined : spread(property, d.value);
      parts.forEach((p, i) => values && !by[i] && write(p, values[i]));
      for (const v of new Set(by)) {
        if (!v) continue;
        const names = parts.filter((_, i) => by[i] === v);
        if (names.length === parts.length) leave(d, v, [property]);
        else if (values || every) leave(d, v, names);
        else leave(d, v, [property], names);
      }
    }
  }
  for (const { d, by, names, part } of left.values())
    once(`can't inline \`${d.className}\`'s ${and(names)} in its markup: \`${by.className}\` sets ${part ? `its ${and(part)}` : names.length > 1 ? "them" : "it"} ${WHEN[by.when]}, which needs a stylesheet`);
  for (const d of found.declarations) if (d.when !== "always") once(`can't inline class \`${d.className}\` in its markup: it applies ${WHEN[d.when]}, which needs a stylesheet`);
  // Each edit: what's from `start` to `end` (in the markup) written as `with`.
  const edits: Array<{ start: number; end: number; with: string }> = [];
  // Where an attribute left out starts: with the gap before it, unless the next one starts where it ends (after its
  // quote), which that gap then keeps apart from what's before it.
  const before = (a: Attribute) => {
    const at = attributes.indexOf(a);
    return attributes[at + 1]?.start === a.end ? a.start : at > 0 ? attributes[at - 1].end : nameEnd;
  };
  list.forEach((a, i) => edits.push(i === 0 && kept.length ? { start: a.start, end: a.end, with: `class="${kept.join(" ").replace(/"/g, "&quot;")}"` } : { start: before(a), end: a.end, with: "" }));
  // The element's own style wins over its classes, as in the browser: after them.
  const own = attributes.find((a) => a.name === "style");
  const style = css.map(escape).join("; ");
  if (style) {
    if (own) {
      const value = requote(own).replace(/;\s*$/, "");
      edits.push({ start: own.start, end: own.end, with: `style="${value.trim() ? `${style}; ${value}` : style}"` });
    } else {
      const end = attributes.length ? attributes[attributes.length - 1].end : nameEnd;
      edits.push({ start: end, end, with: ` style="${style}"` });
    }
  }
  edits.sort((a, b) => a.start - b.start || a.end - b.end);
  let tag = "";
  let from = offset;
  for (const edit of edits) {
    tag += text.slice(from - offset, edit.start - offset) + edit.with;
    from = edit.end;
  }
  return tag + text.slice(from - offset);
}
