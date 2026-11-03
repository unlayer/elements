/**
 * A laid-out Document as pages to draw (model.ts): a page for each of its pages (the paper's size, the margins, its
 * header, content and footer, nothing flowing onto the next), and each block as a box, a block of text, an image, a
 * link or a drawing, at the width the resolver gave it, so the PDF is laid out as the print HTML is. No engine is
 * named here: an engine's adapter draws what this writes (react-pdf.tsx).
 */
import { assetParts, documentPages, linkParts, pageBox, videoParts, type Asset, type BorderSide, type LinkValue, type ResolvedNode } from "@unlayer-internal/elements-core";
import type { Block, DrawnDocument, Font, Page, Picture, Run, Shape, Style } from "./model";
import { alignSelf, borderStyle, boxStyle, flex, pt, runStyle, textStyle } from "./styles";

export interface WriteContext {
  /** The families whose files are given, lowercased (what a stack's text is drawn in where it names one). */
  families: ReadonlySet<string>;
  /** The files of those families. */
  fonts: Font[];
  /** An image's source as a data URI (nothing is fetched), or undefined where there's none. */
  image(src: string): string | undefined;
  /** When the PDF says it was made. */
  date: Date;
}

/** A Video's thumbnail: its own, else a YouTube video's (derived from its URL), or undefined (a Vimeo video's isn't). */
export const thumbnailOf = (video: ResolvedNode): string | undefined =>
  video.props.thumbnail ? assetParts(video.props.thumbnail as Asset).src : videoParts(String(video.props.src))?.thumbnail;

const shown = (node: ResolvedNode) => !node.hidden?.desktop;
const nodes = (node: ResolvedNode) => node.children.filter((child): child is ResolvedNode => typeof child !== "string" && shown(child));
const present = <T>(items: Array<T | undefined>): T[] => items.filter((item): item is T => item !== undefined);

export function writeDocument(root: ResolvedNode, context: WriteContext): DrawnDocument {
  const box = pageBox(root.props);
  const { pages, header, footer } = documentPages(root);
  const total = pages.length;
  const write = new Writer(context);
  return {
    title: root.props.title as string | undefined,
    lang: root.props.lang as string | undefined,
    date: context.date,
    fonts: context.fonts,
    pages: pages.map(({ page, children }, index): Page => {
      write.page = { number: index + 1, total };
      const content = page ?? root;
      return {
        width: pt(box.width),
        height: pt(box.height),
        margin: { top: pt(box.margin.top), right: pt(box.margin.right), bottom: pt(box.margin.bottom), left: pt(box.margin.left) },
        // Paper is white: a page with no background of its own paints one, as a viewer may show a page left
        // transparent as black (in dark mode), under text that's dark.
        background: (page?.style.backgroundColor ?? root.style.backgroundColor ?? "#ffffff") as string,
        contentHeight: pt(box.contentHeight),
        header: header && write.block(header, root),
        content: present(children.filter(shown).map((child) => write.block(child, content))),
        gap: typeof content.style.gap === "number" ? pt(content.style.gap) : undefined,
        footer: footer && write.block(footer, root),
      };
    }),
  };
}

const gap = (node: ResolvedNode): Style => (typeof node.style.gap === "number" ? { gap: pt(node.style.gap) } : {});

class Writer {
  page = { number: 1, total: 1 };

  constructor(private readonly context: WriteContext) {}

  /** A block in a stack (or a Row, `row`), at the width the resolver gave it. */
  block(node: ResolvedNode, parent: ResolvedNode, row = false): Block | undefined {
    const placed: Style = row
      ? { width: node.width !== null ? pt(node.width) : undefined, flexShrink: 0, flexGrow: 0, alignSelf: node.definition.sizing === "shrink" ? flex(parent.style.alignItems ?? "start") : undefined }
      : { alignSelf: alignSelf(node, parent), width: node.width !== null && (node.style.width !== undefined || node.style.maxWidth !== undefined || node.definition.sizing === "shrink") ? pt(node.width) : undefined };
    const families = this.context.families;
    switch (node.type) {
      case "Text":
      case "Paragraph":
      case "Heading":
        return { kind: "text", style: { ...textStyle(node, families), ...boxStyle(node), ...placed }, runs: this.runs(node) };
      case "Button":
        return {
          kind: "link",
          href: linkParts(node.props.href as LinkValue).href,
          style: { ...placed, textDecoration: "none" },
          children: [{ kind: "box", style: { ...boxStyle(node), width: node.width !== null ? pt(node.width) : undefined }, children: [{ kind: "text", style: { ...textStyle(node, families), textAlign: "center" }, runs: this.runs(node) }] }],
        };
      case "Image":
        return this.image(node, placed);
      case "Link": {
        // A Link of words (a Menu's links too) is a run of text; one holding an Image, that image.
        const words = node.children.some((child) => typeof child === "string" || child.definition.categories.includes("inline"));
        return {
          kind: "link",
          href: linkParts(node.props.href as LinkValue).href,
          style: { ...placed, textDecoration: "none" },
          children: words ? [{ kind: "text", style: textStyle(node, families), runs: this.runs(node) }] : present(nodes(node).map((child) => this.block(child, node))),
        };
      }
      case "Divider": {
        const line = node.style.borderTop as BorderSide | undefined;
        return { kind: "box", style: { ...boxStyle(node), ...placed, width: node.width !== null ? pt(node.width) : undefined }, children: [{ kind: "box", style: borderStyle(line ? { top: line } : undefined), children: [] }] };
      }
      case "Row":
        return {
          kind: "box",
          style: { ...boxStyle(node), ...placed, flexDirection: "row", ...gap(node), alignItems: flex(node.style.alignItems ?? "start"), justifyContent: flex(node.style.justifyContent) },
          children: present(nodes(node).map((child) => this.block(child, node, true))),
        };
      case "Layer":
        return this.layer(node, placed);
      case "List":
        return this.list(node, placed);
      case "Table":
        return this.table(node, placed);
      case "Video":
        return this.video(node, placed);
      case "Svg":
        return this.svg(node, placed);
      case "Section":
      case "Column":
      case "PageHeader":
      case "PageFooter":
        return { kind: "box", style: { ...boxStyle(node), ...placed, flexDirection: "column", ...gap(node), justifyContent: flex(node.style.justifyContent) }, children: present(nodes(node).map((child) => this.block(child, node))) };
      default:
        // Every block a Document takes is a case above (a test checks): one without a case fails rather than disappears.
        throw new Error(`[Elements] The PDF writer draws no ${node.type}`);
    }
  }

  /** A block of text's children: its words and runs (Span, Link, a line break, a merge tag, a page number). */
  runs(node: ResolvedNode): Run[] {
    return present(
      node.children.map((child): Run | undefined => {
        if (typeof child === "string") return child;
        if (!shown(child)) return undefined;
        switch (child.type) {
          case "LineBreak":
            return "\n";
          case "MergeTag":
            return `{{${child.props.name}}}`;
          case "PageNumber":
            return String(child.props.total ? this.page.total : this.page.number);
          case "Link":
            return { kind: "link", href: linkParts(child.props.href as LinkValue).href, style: runStyle(child, this.context.families), runs: this.runs(child) };
          case "Image": {
            // In a line, an image the PDF can't draw is its alt text.
            const image = this.image(child, {});
            return image.kind === "image" ? image : String(child.props.alt ?? "");
          }
          default:
            return { kind: "span", style: runStyle(child, this.context.families), runs: this.runs(child) };
        }
      })
    );
  }

  /** An Image; one the PDF can't draw (an SVG), its alt text in a box of its size, as a browser shows one it can't. */
  image(node: ResolvedNode, placed: Style, cover?: number): Picture | Block {
    const { src, width, height } = assetParts(node.props.src as Asset);
    const drawn = node.width ?? width;
    const style: Style = { ...placed, ...boxStyle(node), width: drawn !== undefined && drawn !== null ? pt(drawn) : undefined };
    if (cover !== undefined) Object.assign(style, { width: "100%", height: pt(cover), objectFit: "cover" });
    else if (typeof node.style.height !== "number" && drawn && width && height) style.height = pt((drawn * height) / width);
    const source = this.context.image(src);
    if (source) return { kind: "image", src: source, style };
    const alt = String(node.props.alt ?? "");
    return { kind: "box", style: { ...style, objectFit: undefined, overflow: "hidden" }, children: alt ? [{ kind: "text", style: textStyle(node, this.context.families), runs: [alt] }] : [] };
  }

  /** A Layer: its first child in place, the others over it, each in the Layer's whole box, placed by its alignment. */
  layer(node: ResolvedNode, placed: Style): Block {
    const [base, ...over] = nodes(node);
    const height = typeof node.style.height === "number" ? node.style.height : undefined;
    const under = base && (base.type === "Image" && height !== undefined ? this.image(base, {}, height) : this.block(base, node));
    return {
      kind: "box",
      style: { ...boxStyle(node), ...placed, position: "relative", overflow: node.style.borderRadius !== undefined ? "hidden" : undefined },
      children: present([
        under,
        ...over.map((child): Block => ({
          kind: "box",
          style: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, flexDirection: "column", justifyContent: flex(node.style.alignItems ?? "start"), alignItems: flex(node.style.justifyItems ?? "stretch") },
          children: present([this.block(child, node)]),
        })),
      ]),
    };
  }

  list(node: ResolvedNode, placed: Style): Block {
    const indent = typeof node.style.indent === "number" ? node.style.indent : 24;
    const start = Number(node.props.start ?? 1);
    return {
      kind: "box",
      style: { ...boxStyle(node), ...placed, flexDirection: "column", ...gap(node) },
      children: nodes(node).map((item, i): Block => ({
        kind: "box",
        style: { flexDirection: "row" },
        children: [
          { kind: "text", style: { ...textStyle(item, this.context.families), width: pt(indent), textAlign: "left" }, runs: [node.props.type === "number" ? `${start + i}.` : "•"] },
          { kind: "box", style: { flexGrow: 1, flexShrink: 1, flexDirection: "column" }, children: this.itemParts(item) },
        ],
      })),
    };
  }

  /** A list item's text and the Lists in it, in their order: each run of text a paragraph, each List under it. */
  itemParts(item: ResolvedNode): Block[] {
    const parts: Block[] = [];
    let text: ResolvedNode["children"] = [];
    const flush = () => {
      if (text.some((child) => typeof child !== "string" || child.trim() !== "")) parts.push({ kind: "text", style: textStyle(item, this.context.families), runs: this.runs({ ...item, children: text }) });
      text = [];
    };
    for (const child of item.children) {
      if (typeof child !== "string" && child.type === "List") {
        flush();
        if (shown(child)) parts.push(this.list(child, {}));
      } else text.push(child);
    }
    flush();
    return parts;
  }

  table(node: ResolvedNode, placed: Style): Block {
    const columns = node.columns ?? null;
    const cellPadding = node.style.cellPadding as { top: number; right: number; bottom: number; left: number } | undefined;
    const rowBorder = node.style.rowBorder as BorderSide | undefined;
    const rows = nodes(node);
    return {
      kind: "box",
      style: { ...boxStyle(node), ...placed, flexDirection: "column" },
      children: rows.map((row, r): Block => {
        let column = 0;
        return {
          kind: "box",
          style: { flexDirection: "row", ...boxStyle(row), ...(r < rows.length - 1 && rowBorder ? borderStyle({ bottom: rowBorder }) : {}) },
          children: nodes(row).map((cell): Block => {
            const span = Math.max(1, Number(cell.props.colSpan ?? 1));
            const width = columns ? columns.slice(column, column + span).reduce((sum, w) => sum + w, 0) : undefined;
            column += span;
            const padding = cellPadding ? { paddingTop: pt(cellPadding.top), paddingRight: pt(cellPadding.right), paddingBottom: pt(cellPadding.bottom), paddingLeft: pt(cellPadding.left) } : {};
            return {
              kind: "box",
              style: { ...padding, ...boxStyle(cell), width: width !== undefined ? pt(width) : undefined, flexGrow: width === undefined ? 1 : 0 },
              children: [{ kind: "text", style: { ...textStyle(cell, this.context.families), ...(row.props.header ? { fontWeight: 700 } : {}) }, runs: this.runs(cell) }],
            };
          }),
        };
      }),
    };
  }

  /** An Svg: its box in points, its shapes in its viewBox's units. */
  svg(node: ResolvedNode, placed: Style): Block {
    const { width, height, viewBox } = node.props as { width: number; height: number; viewBox?: string };
    const paint = (value: unknown) => (value === "transparent" ? "none" : (value as string | undefined));
    const KINDS: Record<string, Shape["kind"]> = { Rect: "rect", Circle: "circle", Ellipse: "ellipse", Line: "line", Polygon: "polygon", Path: "path" };
    const shapes = nodes(node)
      .filter((shape) => KINDS[shape.type])
      .map((shape): Shape => ({
        kind: KINDS[shape.type],
        attributes: { ...(shape.props as Record<string, string | number>), fill: paint(shape.style.fill), stroke: paint(shape.style.stroke), strokeWidth: shape.style.strokeWidth as number | undefined, opacity: shape.style.opacity as number | undefined },
      }));
    return {
      kind: "box",
      style: { ...boxStyle(node), ...placed, width: undefined },
      children: [{ kind: "drawing", width: pt(width), height: pt(height), viewBox: viewBox ?? `0 0 ${width} ${height}`, style: {}, shapes }],
    };
  }

  /** A Video: its thumbnail linked to it where its bytes are given, else a link with its title. */
  video(node: ResolvedNode, placed: Style): Block {
    const src = String(node.props.src);
    const thumbnail = thumbnailOf(node);
    const image = thumbnail ? this.context.image(thumbnail) : undefined;
    return {
      kind: "link",
      href: src,
      style: { ...placed, textDecoration: "none" },
      children: [image ? { kind: "image", src: image, style: { width: node.width !== null ? pt(node.width) : undefined } } : { kind: "text", style: textStyle(node, this.context.families), runs: [String(node.props.title ?? "Video")] }],
    };
  }
}
