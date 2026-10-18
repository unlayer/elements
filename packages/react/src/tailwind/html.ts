/**
 * Tailwind classes in markup (an Html block's `html`, a Paragraph's): each element's classes as its inline style,
 * as email clients need them, with the same conversions as classes on components (hex colors, pixels). A class
 * Tailwind doesn't know stays (your own stylesheet's); one Tailwind knows leaves the class attribute, inlined, or
 * reported where it can't be (a phone or hover variant needs a stylesheet).
 */
import type { ClassDeclarations } from "./declarations";

const ENTITIES: Record<string, string> = { "&amp;": "&", "&quot;": '"', "&#39;": "'", "&lt;": "<", "&gt;": ">" };

// Logical sides as in a left-to-right document, and those a right-to-left one changes: email clients read only physical ones.
const SIDES: Record<string, string[]> = { inline: ["left", "right"], block: ["top", "bottom"], "inline-start": ["left"], "inline-end": ["right"], "block-start": ["top"], "block-end": ["bottom"] };
const CORNERS: Record<string, string> = { "start-start": "top-left", "start-end": "top-right", "end-end": "bottom-right", "end-start": "bottom-left" };
const RTL_SIDES: Record<string, string[]> = { "inline-start": ["right"], "inline-end": ["left"] };
const RTL_CORNERS: Record<string, string> = { "start-start": "top-right", "start-end": "top-left", "end-end": "bottom-left", "end-start": "bottom-right" };
/** Elements without an end tag or content: no element after them is in them. */
const VOID = /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/i;

/**
 * A declaration as email clients read it: logical sides as physical ones (`rtl`: on an element that reads right to
 * left, where inline start is the right), `text-decoration-line` as `text-decoration`.
 */
function physical(property: string, value: string, rtl: boolean): string[] {
  const side = /^(padding|margin|border)-(inline|block)(-start|-end)?(-width|-style|-color)?$/.exec(property);
  const sides = side && side[2] + (side[3] ?? "");
  if (side) return ((rtl && RTL_SIDES[sides!]) || SIDES[sides!]).map((s) => `${side[1]}-${s}${side[4] ?? ""}: ${value}`);
  const corner = /^border-(start|end)-(start|end)-radius$/.exec(property);
  const at = corner && `${corner[1]}-${corner[2]}`;
  if (corner) return [`border-${(rtl && RTL_CORNERS[at!]) || CORNERS[at!]}-radius: ${value}`];
  return [`${property === "text-decoration-line" ? "text-decoration" : property}: ${value}`];
}

/** A tag's attributes, as the browser reads them: their names, values (undefined: none) and text. */
const attributesOf = (attributes: string) =>
  [...attributes.matchAll(/([^\s"'<>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g)].map((m) => ({ name: m[1], value: m[2] ?? m[3] ?? m[4], text: m[0] }));

/**
 * `html` with Tailwind's classes inlined; `warn` says what isn't. `rtl`: the document reads right to left. An element
 * reads as its own `dir` says (`rtl`, or `ltr` and `auto`, which can't be told here, as left to right), else as the
 * element it's in, else as the document: its logical sides are those. (An element whose end tag is left out, as a
 * `<p>` or `<li>` can be, is taken to hold what follows it up to its parent's end tag.)
 */
export function inlineClasses(html: string, read: (className: string) => ClassDeclarations, warn: (text: string) => void, rtl = false): string {
  const said = new Set<string>();
  const once = (text: string) => !said.has(text) && (said.add(text), warn(text));
  // The elements open where a tag is, each with whether it reads right to left.
  const open: Array<{ tag: string; rtl: boolean }> = [];
  // Comments and what's in a script or style element are left as they are; each start tag with a class is rewritten.
  return html.replace(/<!--[\s\S]*?-->|<(script|style)\b[\s\S]*?<\/\1\s*>|<\/([a-zA-Z][\w:-]*)\s*>|<([a-zA-Z][\w:-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g, (whole, raw: string | undefined, end: string | undefined, tag: string | undefined, attributes: string) => {
    if (raw || (!end && !tag)) return whole;
    if (end) {
      // It ends, and what's still open in it (as the browser ends them).
      const at = open.map((e) => e.tag).lastIndexOf(end.toLowerCase());
      if (at >= 0) open.length = at;
      return whole;
    }
    const classed = /\sclass\s*=/i.test(attributes);
    const list = classed || /\sdir\s*=/i.test(attributes) ? attributesOf(attributes) : [];
    const dir = list.find((a) => a.name.toLowerCase() === "dir")?.value?.trim().toLowerCase();
    const right = dir === "rtl" ? true : dir === "ltr" || dir === "auto" ? false : open.length ? open[open.length - 1].rtl : rtl;
    if (!VOID.test(tag!)) open.push({ tag: tag!.toLowerCase(), rtl: right });
    if (!classed) return whole;
    const at = list.findIndex((a) => a.name.toLowerCase() === "class");
    const className = (list[at].value ?? "").replace(/&(amp|quot|#39|lt|gt);/g, (e) => ENTITIES[e]);
    const found = read(className);
    const kept: string[] = [];
    for (const { className: name, reason } of found.ignored) {
      // Not Tailwind's: one of yours, left for your stylesheet.
      if (reason === "Tailwind has no such class") kept.push(name);
      else once(`ignores class \`${name}\` in its markup: ${reason}`);
    }
    const css: string[] = [];
    for (const d of found.declarations) {
      if (d.when === "always") css.push(...physical(d.property, d.value, right).map((declaration) => `${declaration}${d.important ? " !important" : ""}`));
      else once(`can't inline class \`${d.className}\` in its markup: it applies ${d.when === "phone" ? "on phones only" : d.when === "desktop" ? "above a screen width only" : "on hover"}, which needs a stylesheet`);
    }
    // The element's own style wins over its classes, as in the browser: after them.
    const own = list.find((a) => a.name.toLowerCase() === "style");
    const ownStyle = own?.value?.replace(/&(amp|quot|#39|lt|gt);/g, (e) => ENTITIES[e]).replace(/;\s*$/, "");
    const style = [...css, ...(ownStyle ? [ownStyle] : [])].join("; ");
    const rest = list.filter((a, i) => i !== at && a !== own).map((a) => ` ${a.text}`);
    const escape = (text: string) => text.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
    return `<${tag}${kept.length ? ` class="${escape(kept.join(" "))}"` : ""}${rest.join("")}${style ? ` style="${escape(style)}"` : ""}${/\/\s*$/.test(attributes) ? " /" : ""}>`;
  });
}
