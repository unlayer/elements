/**
 * What a reader gets from a template, for tests that take one to the builder and back: each block a reader sees (text,
 * a button, an image, a line, a video, markup) in order, with its box (where it starts across the content and how wide
 * it is, from the resolver's widths), the space above it since the block before, its words and each run's resolved
 * style, its link and target, the background behind it and its own box's paint and borders. Not the tree: a Section
 * of two Rows and two Sections draw the same, and read the same here.
 */
import type { Insets, Json, ResolvedNode } from "@unlayer-internal/elements-core";
import type React from "react";
import { prepare } from "../../primitives/render";
import { linesOf } from "../columns";

export interface Seen {
  kind: string;
  /** Its box: left edge across the content, and width (the resolver's; null where it takes its own size, unknown). */
  x: number;
  width: number | null;
  /** The space above it since the last block above (paddings, borders, gaps). */
  above: number;
  /** Its words and runs, each with its resolved style and link. */
  runs?: Array<{ text: string; style: Record<string, Json>; link?: Json }>;
  /** What else a reader gets from it: an image's source and text, a button's colors, a line, a link. */
  own: Record<string, Json>;
  /** The color behind it. */
  behind: string;
  /** Where it's hidden. */
  hidden?: { mobile?: boolean; desktop?: boolean };
}

const ZERO: Insets = { top: 0, right: 0, bottom: 0, left: 0 };
const pad = (node: ResolvedNode): Insets => (node.style.padding as Insets | undefined) ?? ZERO;
const line = (node: ResolvedNode, side: "top" | "right" | "bottom" | "left") => ((node.style.border as Record<string, { width: number } | undefined> | undefined)?.[side]?.width ?? 0);
const LEAVES = new Set(["Paragraph", "Paragraph", "Heading", "Button", "Image", "Divider", "Video", "List", "Table", "Html", "Svg", "Layer"]);
/** What the builder holds as markup (an HTML block): its box is read, not what's in it. */
const MARKUP = new Set(["Table", "Html", "Svg", "Layer"]);
/** A link as a reader follows it: where it goes, and whether it opens a new window. */
const follow = (value: Json | undefined): Json | undefined => {
  if (value === undefined) return undefined;
  const { href, target } = typeof value === "string" ? { href: value, target: undefined } : (value as { href: string; target?: string });
  return target === "_blank" ? { href, target } : { href };
};
/** What a Column can have that isn't lines, and makes it a box of its own. */
const OTHER_LOOK = ["backgroundColor", "borderRadius", "width", "minWidth", "maxWidth", "height", "overflow", "justifyContent"];
const STACKS = new Set(["Email", "Page", "Document", "Canvas", "Section", "Column", "DocumentPage", "PageHeader", "PageFooter"]);
const round = (n: number) => Math.round(n * 10) / 10;
/** A Divider's line length: its width in px, or its share of the room inside its padding. */
const lengthOf = (node: ResolvedNode, room: number): number => {
  const width = node.style.width ?? "100%";
  return typeof width === "number" ? width : typeof width === "string" && width.endsWith("%") ? (room * parseFloat(width)) / 100 : parseFloat(String(width)) || room;
};

/** The text styles a reader sees on a run: its node's as resolved (its own over what it inherits). */
function runStyle(node: ResolvedNode, own: Record<string, Json>): Record<string, Json> {
  const t = node.text;
  return { color: t.color, fontFamily: t.fontFamily, fontSize: t.fontSize, lineHeight: round(t.lineHeightPx), fontWeight: t.fontWeight, fontStyle: t.fontStyle, letterSpacing: t.letterSpacing, textAlign: t.textAlign, textTransform: t.textTransform, ...own };
}

/** Styles a run takes from what's around it that aren't inherited text styles: a decoration, a background, raising, a link. */
const AROUND = ["textDecoration", "backgroundColor", "verticalAlign"];

function runs(node: ResolvedNode, self = false): Seen["runs"] {
  const out: NonNullable<Seen["runs"]> = [];
  // Words after a list in a list item start a line.
  let listEnded = false;
  const line = () => {
    if (listEnded) out.push({ text: "\n", style: {} });
    listEnded = false;
  };
  const visit = (n: ResolvedNode, around: Record<string, Json>) => {
    // A line break that ends a block's text starts no line (as `<p>a<br></p>` shows one).
    const shown = n.children.filter((c) => typeof c !== "string" || c);
    const last = shown[shown.length - 1];
    const children = shown.length > 1 && typeof last !== "string" && last?.type === "LineBreak" ? shown.slice(0, -1) : shown;
    for (const child of children) {
      if (typeof child === "string") {
        line();
        out.push({ text: child, style: runStyle(n, around) });
        continue;
      }
      if (child.hidden?.desktop) continue;
      const own: Record<string, Json> = { ...around };
      for (const key of AROUND) if (child.style[key] !== undefined) own[key] = child.style[key];
      if (child.type === "Link") own.link = follow(child.props.href as Json)!;
      if (child.type !== "ListItem" && child.type !== "List") line();
      if (child.type === "LineBreak") out.push({ text: "\n", style: {} });
      else if (child.type === "MergeTag") out.push({ text: `{{${child.props.name}}}`, style: runStyle(n, around) });
      else if (child.type === "PageNumber") out.push({ text: child.props.total ? "{{page_count}}" : "{{page_number}}", style: runStyle(n, around) });
      else if (child.type === "ListItem" || child.type === "List") {
        listEnded = false;
        out.push({ text: "\n", style: {} });
        visit(child, around);
        listEnded = child.type === "List";
      } else visit(child, own);
    }
  };
  // A Link of words on its own: its words in its style, linked.
  if (self) visit({ ...node, children: [node] } as ResolvedNode, {});
  else visit(node, {});
  // Words side by side in one style are one run however they're split.
  const merged: NonNullable<Seen["runs"]> = [];
  for (const run of out) {
    const last = merged[merged.length - 1];
    if (last && JSON.stringify(last.style) === JSON.stringify(run.style)) last.text += run.text;
    else merged.push({ ...run });
  }
  return merged;
}

/** What a reader gets from a template, block by block. */
export function seen(element: React.ReactElement, { markup = new Set<string>() }: { markup?: ReadonlySet<string> } = {}): Seen[] {
  const { root, diagnostics } = prepare(element);
  if (!root) throw new Error(`[test] the template doesn't lay out: ${diagnostics.filter((d) => d.severity === "error").map((d) => d.message).join("; ")}`);
  const out: Seen[] = [];
  let pending = 0;
  /** Where a child of its own size sits in a stack: its alignItems, else its text alignment. */
  const offset = (child: ResolvedNode, stack: ResolvedNode, room: number) => {
    const width = child.width;
    if (width === null || width >= room - 0.5) return 0;
    const align = (stack.style.alignItems as string | undefined) ?? { left: "start", justify: "start", center: "center", right: "end" }[stack.text.textAlign];
    if (child.type === "Divider") return 0;
    if (child.definition.sizing !== "shrink" && child.style.width === undefined && child.style.maxWidth === undefined) return 0;
    return align === "center" ? (room - width) / 2 : align === "end" ? room - width : 0;
  };
  const walk = (node: ResolvedNode, x: number, room: number, behind: string, hidden: Seen["hidden"] | undefined, parent: ResolvedNode) => {
    // What a reader gets on desktop: a block hidden there isn't.
    if (node.hidden?.desktop) return;
    const here = { ...hidden, ...node.hidden };
    const paint = (node.style.backgroundColor as string | undefined) ?? behind;
    const visible = here.mobile || here.desktop ? { hidden: here } : {};
    // A column of the builder's that only keeps space has an invisible line in it.
    if (node.type === "Divider" && (node.style.borderTop as { color?: string } | undefined)?.color === "transparent") return;
    // What the builder holds as an HTML block of its markup (`markup`, the paths toDesign() said) is read as one.
    const locked = markup.has(node.path);
    const linkOfWords = node.type === "Link" && !node.children.some((c) => typeof c !== "string" && c.type === "Image");
    if (locked || LEAVES.has(node.type) || node.type === "Link") {
      const p = pad(node);
      const own: Record<string, Json> = {};
      for (const key of ["backgroundColor", "border", "borderRadius", "padding", "borderTop"]) if (node.style[key] !== undefined) own[key] = node.style[key];
      if (node.type === "Button") {
        own.href = follow(node.props.href as Json)!;
        if (node.hover) own.hover = node.hover;
      }
      if (node.type === "Link" && !linkOfWords && !locked) {
        const image = node.children.find((c): c is ResolvedNode => typeof c !== "string" && c.type === "Image")!;
        own.href = follow(node.props.href as Json)!;
        Object.assign(own, { src: image.props.src, alt: image.props.alt ?? "", imageWidth: image.width === null ? null : round(image.width) });
      }
      if (node.type === "Image") Object.assign(own, { src: node.props.src, alt: node.props.alt ?? "" });
      if (node.type === "Video") own.src = node.props.src;
      const opaque = locked || MARKUP.has(node.type);
      if (opaque) for (const key of Object.keys(own)) delete own[key];
      if (node.type === "List") own.list = [node.props.type ?? "bullet", node.style.indent ?? 24, node.style.gap ?? 0];
      // A text block's padding is where its words start, inside its box: compared as space, not as its own.
      delete own.padding;
      const boxed = !opaque && (own.backgroundColor !== undefined || own.border !== undefined);
      // A line's length is its own, its padding around it, placed by its parent's text alignment.
      const lineWidth = node.type === "Divider" ? lengthOf(node, room - p.left - p.right) : null;
      const lineAt = node.type === "Divider" && lineWidth !== null ? ({ center: (room - p.left - p.right - lineWidth) / 2, right: room - p.left - p.right - lineWidth } as Record<string, number>)[parent.text.textAlign] ?? 0 : 0;
      out.push({
        kind: node.type === "Paragraph" || linkOfWords ? "Paragraph" : opaque ? "Markup" : node.type,
        x: round(x + lineAt + (boxed ? 0 : p.left + line(node, "left"))),
        // A Link of words on its own wraps where its place does.
        width: linkOfWords ? round(room) : lineWidth !== null ? round(lineWidth) : node.width === null ? null : round(node.width - (boxed ? 0 : p.left + p.right + line(node, "left") + line(node, "right"))),
        above: round(pending + (boxed ? 0 : p.top + line(node, "top"))),
        ...(!opaque && (["Paragraph", "Paragraph", "Heading", "Button", "List"].includes(node.type) || linkOfWords) ? { runs: runs(node, linkOfWords) } : {}),
        own,
        behind,
        ...visible,
      });
      pending = boxed ? 0 : p.bottom + line(node, "bottom");
      if (boxed) out[out.length - 1].own.inset = [p.top, p.right, p.bottom, p.left] as Json;
      return;
    }
    const p = pad(node);
    const inner = { x: x + p.left + line(node, "left"), room: (node.width ?? room) - p.left - p.right - line(node, "left") - line(node, "right") };
    // Lines above and below a Row, or a Column with no other look, are what a reader gets from a Divider in their place.
    const lines = node.type === "Row" || (node.type === "Column" && !OTHER_LOOK.some((key) => node.style[key] !== undefined) && !node.hidden) ? linesOf(node.style.border) : undefined;
    const drawLine = (border: Json) => {
      out.push({ kind: "Divider", x: round(x), width: round(node.width ?? room), above: round(pending), own: { borderTop: border }, behind, ...visible });
      pending = 0;
    };
    if (lines?.top) drawLine(lines.top);
    pending += p.top + (lines ? 0 : line(node, "top"));
    const gap = typeof node.style.gap === "number" ? node.style.gap : 0;
    const children = node.children.filter((c): c is ResolvedNode => typeof c !== "string" && !c.hidden?.desktop);
    if (STACKS.has(node.type)) {
      children.forEach((child, i) => {
        if (i) pending += gap;
        walk(child, inner.x + offset(child, node, inner.room), child.type === "Divider" ? inner.room : (child.width ?? inner.room), paint, here, node);
      });
    } else {
      // Side by side: each child starts where the row does; after it, the most any of them leaves below.
      const start = pending;
      let after = 0;
      let left = inner.x;
      for (const child of children) {
        pending = start;
        walk(child, left, child.width ?? inner.room, paint, here, node);
        after = Math.max(after, pending);
        left += (child.width ?? 0) + gap;
      }
      pending = after;
    }
    pending += p.bottom + (lines ? 0 : line(node, "bottom"));
    if (lines?.bottom) drawLine(lines.bottom);
  };
  walk(root, 0, root.width ?? 0, (root.style.backgroundColor as string | undefined) ?? "#ffffff", undefined, root);
  return out;
}
