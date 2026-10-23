/**
 * Tailwind classes in markup (an Html block's `html`, a Paragraph's): each element's classes as its inline style,
 * as email clients need them, with the same conversions as classes on components (hex colors, pixels). A class
 * Tailwind doesn't know stays (your own stylesheet's); one Tailwind knows leaves the class attribute, inlined, or
 * reported where it can't be (a phone or hover variant needs a stylesheet; so does whether the element shows, where
 * a phone or breakpoint variant changes it). The markup is read as a browser reads it
 * (src/utils/html-tags.ts), and only the class attributes and the styles they give are written again.
 */
import type { ClassCondition, ClassDeclaration, ClassDeclarations, DeclarationReader } from "./declarations";
import { commentEnd, rawTextEnd, readTag, type Attribute, type Tag } from "../utils/html-tags";

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

/** What shows or hides an element: not inline where a screen variant changes it (see `classes`). */
const SHOWN = /^(display|visibility)$/;
/** When a declaration that can't be inline applies. */
const WHEN: Record<ClassCondition, string> = { always: "", phone: "on phones only", desktop: "above a screen width only", hover: "on hover" };

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
 * Each tag in `html` as a browser reads it, with where it starts (`lt`): comments, raw text (`<script>`, `<style>`,
 * `<textarea>`, …) and what isn't a tag passed over, up to a tag the markup ends in (left as it is).
 */
function tags(html: string, visit: (tag: Tag, lt: number) => void): void {
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
    if (!tag) break;
    i = tag.end;
    visit(tag, lt);
    if (!tag.close && RAW_TEXT.test(tag.name)) i = tag.name === "plaintext" ? html.length : rawTextEnd(html, tag.name, i);
  }
}

/** A class attribute's names, as written. */
const namesOf = (value: string | undefined) => [...(value ?? "").matchAll(NAMES)].map((m) => m[0]);
/** A name as Tailwind reads it, its references decoded; undefined where that has a space other than HTML's in it (none of Tailwind's). */
const tailwindName = (name: string) => {
  const read = decode(name);
  return /\s/.test(read) ? undefined : read;
};

/** The class names in `html`, each tag's (its first class attribute's), as inlineClasses reads them: to read them all at once. */
export function classNamesIn(html: string): string[] {
  const out: string[] = [];
  tags(html, (tag) => {
    if (tag.close) return;
    for (const name of namesOf(tag.attributes.find((a) => a.name === "class")?.value)) {
      const read = tailwindName(name);
      if (read !== undefined) out.push(read);
    }
  });
  return out;
}

/**
 * `html` with Tailwind's classes inlined; `warn` says what isn't. `rtl`: the document reads right to left. An element
 * reads as its own `dir` says (`rtl`, or `ltr` and `auto`, which can't be told here, as left to right), else as the
 * element it's in, else as the document: its logical sides are those. (An element whose end tag is left out, as a
 * `<p>` or `<li>` can be, is taken to hold what follows it up to its parent's end tag.) A tag's first `class` is its
 * class, as a browser reads it (the others are left out once it's rewritten); comments, raw text (`<script>`,
 * `<style>`, `<textarea>`, …) and what isn't a tag stay as they are. `unsafe`: CSS sanitized markup can't have (see
 * src/markdown/sanitize.ts), each declaration that is left out and said.
 *
 * Its classes are read at once first (`read.prepare`, where the reader has one): Tailwind builds its whole stylesheet
 * again for each class it hasn't built, so classes read one tag at a time would take the square of their number.
 */
export function inlineClasses(html: string, read: ((className: string) => ClassDeclarations) | DeclarationReader, warn: (text: string) => void, rtl = false, unsafe?: (css: string) => boolean): string {
  ("prepare" in read ? read.prepare : read)(classNamesIn(html).join(" "));
  const said = new Set<string>();
  const once = (text: string) => !said.has(text) && (said.add(text), warn(text));
  // The elements open where a tag is, each with whether it reads right to left, and where each name's are among them:
  // an end tag ends the last of its name and what's open in it, each element once.
  const open: Array<{ tag: string; rtl: boolean }> = [];
  const at = new Map<string, number[]>();
  let out = "";
  // Where the input is written out to.
  let written = 0;
  tags(html, (tag, lt) => {
    if (tag.close) {
      // It ends, and what's still open in it (as the browser ends them).
      const places = at.get(tag.name);
      if (places?.length) for (const end = places[places.length - 1]; open.length > end; ) at.get(open.pop()!.tag)!.pop();
      return;
    }
    const first = (name: string) => tag.attributes.find((a) => a.name === name);
    const dir = first("dir")?.value?.trim().toLowerCase();
    const right = dir === "rtl" ? true : dir === "ltr" || dir === "auto" ? false : open.length ? open[open.length - 1].rtl : rtl;
    const rewritten = classes(html.slice(lt, tag.end), tag.attributes, tag.nameEnd, lt, right, read, once, unsafe);
    if (rewritten !== undefined) {
      out += html.slice(written, lt) + rewritten;
      written = tag.end;
    }
    if (!RAW_TEXT.test(tag.name) && !VOID.test(tag.name)) {
      const places = at.get(tag.name) ?? (at.set(tag.name, []), at.get(tag.name)!);
      places.push(open.length);
      open.push({ tag: tag.name, rtl: right });
    }
  });
  return out + html.slice(written);
}

/**
 * A start tag (`text`, at `offset` in the markup) with its classes inlined, or undefined where none are Tailwind's: its
 * first class attribute holds the classes that stay (or goes), its others go, its first style attribute starts with the
 * inlined declarations (or one is added after its attributes). The rest is as written.
 */
function classes(text: string, attributes: Attribute[], nameEnd: number, offset: number, rtl: boolean, read: (className: string) => ClassDeclarations, once: (text: string) => void, unsafe?: (css: string) => boolean): string | undefined {
  const first = attributes.findIndex((a) => a.name === "class");
  const given = namesOf(attributes[first]?.value);
  if (!given.length) return undefined;
  const names = given.map(tailwindName);
  const found = read(names.filter((name) => name !== undefined).join(" "));
  const yours = new Set<string>();
  for (const { className: name, reason } of found.ignored) {
    // Not Tailwind's: one of yours, left for your stylesheet.
    if (reason === "Tailwind has no such class") yours.add(name);
    else once(`ignores class \`${name}\` in its markup: ${reason}`);
  }
  const kept = given.filter((_, i) => names[i] === undefined || yours.has(names[i]!));
  if (kept.length === given.length) return undefined;
  // What shows or hides the element on every screen (`display`, `visibility`), where a phone or breakpoint variant
  // changes it on one, isn't inline: it would apply on that screen too (`hidden md:block` would hide the element on
  // every screen), and shown everywhere is the safer mistake. Any other class is inline as it is on every screen, the
  // variant said (`px-4 md:pl-2` is `px-4`'s padding). (Without hover, an element is as its classes say without
  // `hover:`: those are inline.)
  const screens = new Map<string, ClassDeclaration>();
  for (const d of found.declarations) if ((d.when === "phone" || d.when === "desktop") && SHOWN.test(d.property) && !screens.has(d.property)) screens.set(d.property, d);
  const shown = (d: ClassDeclaration) => (d.when === "always" ? screens.get(d.property) : undefined);
  for (const d of found.declarations) {
    const by = shown(d);
    if (by) once(`can't inline \`${d.className}\`'s \`${d.property}\` in its markup: \`${by.className}\` sets it ${WHEN[by.when]}, which needs a stylesheet`);
  }
  const css: string[] = [];
  for (const d of found.declarations) {
    if (d.when !== "always") once(`can't inline class \`${d.className}\` in its markup: it applies ${WHEN[d.when]}, which needs a stylesheet`);
    else if (!shown(d))
      for (const property of physical(d.property, rtl)) {
        const declaration = `${property}: ${d.value}${d.important ? " !important" : ""}`;
        if (!unsafe?.(declaration)) css.push(declaration);
        else once(`can't inline \`${d.className}\`'s \`${property}\` in its markup: it could load or run something, which Markdown's sanitized HTML doesn't allow`);
      }
  }
  // Each edit: what's from `start` to `end` (in the markup) written as `with`.
  const edits: Array<{ start: number; end: number; with: string }> = [];
  // Where an attribute left out (the `at`th) starts: with the gap before it, unless the next one starts where it ends
  // (after its quote), which that gap then keeps apart from what's before it.
  const before = (a: Attribute, at: number) => (attributes[at + 1]?.start === a.end ? a.start : at > 0 ? attributes[at - 1].end : nameEnd);
  attributes.forEach((a, at) => {
    if (a.name === "class") edits.push(at === first && kept.length ? { start: a.start, end: a.end, with: `class="${kept.join(" ").replace(/"/g, "&quot;")}"` } : { start: before(a, at), end: a.end, with: "" });
  });
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
