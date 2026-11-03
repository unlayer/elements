/**
 * What a PDF (a Document's) and an image (a Canvas's) can't show as a template asks, that the page writer's checks
 * don't see: a page's checks are a browser's, and a PDF or an image has no pointer and no player (phone styles are
 * already an error in a Document or a Canvas). Each
 * output's own adds what no single style or prop says, as email/support.ts does for email; the styles and props that
 * declare how a PDF or an image shows them (`support`) join when every one of them does (test/support.test.ts).
 *
 * And content that can't fit: a Document's page and a Canvas are a fixed size, and what doesn't fit is cut off. Text
 * isn't measured yet (RFC 0002), so its height is an estimate from its length and size, and only content that looks
 * clearly taller is said, as an estimate.
 */
import { assetParts, documentPages, Diagnostics, pageBox, toPx, type Asset, type Diagnostic, type ResolvedNode } from "@unlayer-internal/elements-core";

const isNode = (child: ResolvedNode | string): child is ResolvedNode => typeof child !== "string";
const OUTPUT = { pdf: "a PDF", image: "an image" } as const;

/** What a PDF or an image can't show of a template, as warnings that say what it shows instead. */
export function pagedSupport(root: ResolvedNode, output: "pdf" | "image"): Diagnostic[] {
  const d = new Diagnostics();
  const where = OUTPUT[output];
  const visit = (node: ResolvedNode) => {
    if (node.hidden?.desktop && node.hidden?.mobile) return;
    if (node.hover && Object.keys(node.hover).length) {
      d.warning(`${output}/unsupported`, `A hover isn't possible in ${where}: nothing points at it. The ${node.type} shows its own colors`, `${node.path}.hover`, node.id);
    }
    if (node.type === "Video") {
      const shows = output === "pdf" ? "its thumbnail (where its file is given) or its title, linked to it" : "its title";
      d.warning(`${output}/unsupported`, `A Video isn't possible in ${where}: it has no player. It shows ${shows}`, node.path, node.id);
    }
    node.children.filter(isNode).forEach(visit);
  };
  visit(root);
  return d.list;
}

// ─── Fitting ───────────────────────────────────────────────────────────────

/** How much taller than its room content must look before it's said: the estimate is rough. */
const CLEARLY = 1.25;
/** A character's average width, in ems: a little under most Latin text's, so text is never thought longer than it is. */
const CHARACTER = 0.45;

const sides = (value: unknown) => {
  const s = (value ?? {}) as Partial<Record<"top" | "right" | "bottom" | "left", number>>;
  return { top: s.top ?? 0, bottom: s.bottom ?? 0 };
};
const lineWidth = (line: unknown) => (line && typeof line === "object" && typeof (line as { width?: unknown }).width === "number" ? (line as { width: number }).width : 0);
/** The padding and borders above and below a node's content. */
const frame = (node: ResolvedNode) => {
  const padding = sides(node.style.padding);
  const border = (node.style.border ?? {}) as Record<string, unknown>;
  return padding.top + padding.bottom + lineWidth(border.top) + lineWidth(border.bottom) + lineWidth(node.style.borderTop) + lineWidth(node.style.borderBottom);
};
/** The characters a node's text runs hold. */
const characters = (node: ResolvedNode): number =>
  node.children.reduce((sum: number, child) => sum + (typeof child === "string" ? child.length : child.type === "MergeTag" ? String(child.props.name ?? "").length + 4 : characters(child)), 0);
/** Laid out side by side: a Row's children (a Grid's, a Menu's and a Social's, as laid out), a table row's cells, a Layer's on each other. */
const SIDE_BY_SIDE = new Set(["Row", "TableRow", "Layer"]);

/** A node's height, estimated: its text's lines at its width, an image's at its ratio, its children stacked or side by side. */
function heightOf(node: ResolvedNode, available: number): number {
  if (node.hidden?.desktop) return 0;
  const set = toPx(node.style.height, null);
  if (set !== null) return set;
  const width = node.contentWidth ?? node.width ?? available;
  if (node.children.some((child) => typeof child === "string" && child.trim())) {
    const perLine = Math.max(1, Math.floor(width / (node.text.fontSize * CHARACTER)));
    return Math.ceil(characters(node) / perLine) * node.text.lineHeightPx + frame(node);
  }
  if (node.type === "Image" && node.props.src !== undefined) {
    const { width: w, height: h } = assetParts(node.props.src as Asset);
    return (w && h ? ((node.width ?? w) * h) / w : 0) + frame(node);
  }
  const children = node.children.filter(isNode).filter((child) => !child.hidden?.desktop);
  if (SIDE_BY_SIDE.has(node.type)) return Math.max(0, ...children.map((child) => heightOf(child, width))) + frame(node);
  const gap = toPx(node.style.gap, null) ?? 0;
  return children.reduce((sum, child) => sum + heightOf(child, width), 0) + gap * Math.max(0, children.length - 1) + frame(node);
}

/** Content that looks clearly taller than the page or canvas it's on: cut off where it ends. */
export function overflow(root: ResolvedNode): Diagnostic[] {
  const d = new Diagnostics();
  const say = (code: string, height: number, room: number, path: string, what: string) => {
    if (room <= 0 || height <= room * CLEARLY) return;
    d.warning(code, `${what} looks about ${Math.round((height / room) * 100)}% as tall as its room (an estimate: text isn't measured yet). What doesn't fit is cut off`, path);
  };
  if (root.type === "Document") {
    const box = pageBox(root.props);
    const { pages, header, footer } = documentPages(root);
    const room = box.contentHeight - (header ? heightOf(header, box.contentWidth) : 0) - (footer ? heightOf(footer, box.contentWidth) : 0);
    pages.forEach(({ page, children }, i) => {
      const holder = page ?? root;
      const gap = toPx(holder.style.gap, null) ?? 0;
      const height = children.reduce((sum, child) => sum + heightOf(child, box.contentWidth), 0) + gap * Math.max(0, children.length - 1) + (page ? frame(page) : 0);
      say("document/overflow", height, room, page?.path ?? children[0]?.path ?? "root", `Page ${i + 1}'s content (split it with a PageBreak, or into pages)`);
    });
  } else if (root.type === "Canvas") {
    const room = Number(root.props.height) - frame(root);
    say("canvas/overflow", heightOf(root, Number(root.props.width)) - frame(root), room, "root", "The Canvas's content");
  }
  return d.list;
}
