/**
 * Declared differences: content a converter knows it changes, said up front so the check expects it instead of
 * failing on it. Each declaration names exactly what it replaces (this image's alt text, this glyph in this element),
 * so it can't hide anything else: the original's HTML gets the declared changes, then the check compares as usual, and
 * every change made is reported. A declaration that matches nothing changes nothing.
 */

import { parse, type DefaultTreeAdapterMap } from "parse5";

type Node = DefaultTreeAdapterMap["node"];
type Element = DefaultTreeAdapterMap["element"];
type TextNode = DefaultTreeAdapterMap["textNode"];

export type DeclaredDifference =
  /** On images with exactly this `src` and exactly this alt text (`from`, "" for none), the migration writes `to`. */
  | { kind: "alt"; src: string; from: string; to: string; reason: string }
  /** The migration shows this image (`to`) where the original shows `from`, exactly: another picture of the same thing. */
  | { kind: "src"; from: string; to: string; reason: string }
  /** The migration leaves out text that is exactly `text` (trimmed) inside an element with the class `parentClass`. */
  | { kind: "text"; text: string; parentClass: string; reason: string }
  /**
   * The migration shows, at every width, the elements with the class `className` that the original hides at some
   * (a menu folded into a hamburger button on phones): they're shown in the original too (`display: block`).
   */
  | { kind: "shown"; className: string; reason: string }
  /** The migration leaves out the elements with the class `className` (a hamburger button): hidden in the original too. */
  | { kind: "hidden"; className: string; reason: string };

export interface AppliedDifference {
  declaration: DeclaredDifference;
  /** How many places in the original it changed. */
  count: number;
}

const attribute = (element: Element, name: string): string | undefined => element.attrs.find((a) => a.name === name)?.value;
const escapeAttribute = (value: string) => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const classes = (element: Element | undefined): string[] => (element && "attrs" in element ? attribute(element, "class") ?? "" : "").split(/\s+/).filter(Boolean);

/**
 * The original's HTML as the migration is expected to show it, with what each declaration changed. Only the attribute
 * values and text the declarations name are rewritten; the rest of the document is kept byte for byte.
 */
export function applyDeclared(html: string, declared: readonly DeclaredDifference[]): { html: string; applied: AppliedDifference[] } {
  if (!declared.length) return { html, applied: [] };
  const document = parse(html, { sourceCodeLocationInfo: true });
  const edits: Array<{ start: number; end: number; text: string }> = [];
  const counts = declared.map(() => 0);

  const replaceAttribute = (element: Element, name: string, value: string) => {
    const location = element.sourceCodeLocation;
    const at = location?.attrs?.[name];
    if (at) edits.push({ start: at.startOffset, end: at.endOffset, text: `${name}="${escapeAttribute(value)}"` });
    else if (location?.startTag) {
      // `<img` is four characters: the attribute goes right after the tag's name.
      const after = location.startTag.startOffset + 1 + element.tagName.length;
      edits.push({ start: after, end: after, text: ` ${name}="${escapeAttribute(value)}"` });
    } else return false;
    return true;
  };

  const visit = (node: Node): void => {
    if ("tagName" in node && node.tagName === "img") {
      const src = attribute(node, "src") ?? "";
      const alt = attribute(node, "alt") ?? "";
      // One declaration per attribute of an image: the first that names it.
      const altAt = declared.findIndex((d) => d.kind === "alt" && d.src === src && d.from === alt);
      if (altAt >= 0 && replaceAttribute(node, "alt", (declared[altAt] as { to: string }).to)) counts[altAt]++;
      const srcAt = declared.findIndex((d) => d.kind === "src" && d.from === src);
      if (srcAt >= 0 && replaceAttribute(node, "src", (declared[srcAt] as { to: string }).to)) counts[srcAt]++;
    }
    if ("tagName" in node) {
      const at = declared.findIndex((d) => (d.kind === "shown" || d.kind === "hidden") && classes(node).includes(d.className));
      if (at >= 0) {
        const style = attribute(node, "style");
        const display = `${style ? `${style.replace(/;?\s*$/, ";")}` : ""}display:${declared[at].kind === "shown" ? "block" : "none"} !important`;
        if (replaceAttribute(node, "style", display)) counts[at]++;
      }
    }
    if (node.nodeName === "#text") {
      const text = node as TextNode;
      const at = declared.findIndex((d) => d.kind === "text" && text.value.trim() === d.text && classes(text.parentNode as Element).includes(d.parentClass));
      const location = text.sourceCodeLocation;
      if (at >= 0 && location) {
        edits.push({ start: location.startOffset, end: location.endOffset, text: "" });
        counts[at]++;
      }
    }
    for (const child of "childNodes" in node ? node.childNodes : []) visit(child);
    if ("content" in node && node.content) visit(node.content as unknown as Node);
  };
  visit(document as unknown as Node);

  let out = html;
  let last = Infinity;
  for (const edit of edits.sort((a, b) => b.start - a.start)) {
    if (edit.end > last) continue; // overlapping: the first one kept
    out = out.slice(0, edit.start) + edit.text + out.slice(edit.end);
    last = edit.start;
  }
  return { html: out, applied: declared.map((declaration, i) => ({ declaration, count: counts[i] })).filter((a) => a.count > 0) };
}

/** A declared difference as a report lists it: its reason, and what it changed. */
export function describeDeclared(applied: AppliedDifference): { reason: string; detail: string } {
  const { declaration: d, count } = applied;
  const times = count > 1 ? ` (×${count})` : "";
  if (d.kind === "alt") return { reason: d.reason, detail: `alt "${d.from}" → "${d.to}"${times}` };
  if (d.kind === "src") return { reason: d.reason, detail: `${d.from} → ${d.to}${times}` };
  if (d.kind === "shown" || d.kind === "hidden") return { reason: d.reason, detail: `.${d.className}${times}` };
  return { reason: d.reason, detail: `"${d.text}"${times}` };
}
