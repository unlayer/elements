/**
 * A laid-out Canvas as the elements Satori draws: flexbox boxes at the widths the resolver gave them (as every other
 * output), text in the font a stack names that's given (else the first given), images from their bytes, an Svg's
 * shapes as SVG. Satori lays the boxes out (Yoga) and draws the text as paths.
 */
import { assetParts, fontStack, type Asset, type Border, type BorderSide, type Radius, type ResolvedNode } from "@unlayer-internal/elements-core";
import { createElement, isValidElement, type CSSProperties, type ReactElement, type ReactNode } from "react";

export interface WriteContext {
  /** The font families given, lowercased, and the first (what a stack without one of them is drawn in). */
  fonts: ReadonlySet<string>;
  fallback: string;
  /** An image's source as Satori loads it without the network (a data URI), or undefined where there's none. */
  image(src: string): string | undefined;
}

type Style = CSSProperties & Record<string, unknown>;

const shown = (node: ResolvedNode) => !node.hidden?.desktop;
const nodes = (node: ResolvedNode) => node.children.filter((child): child is ResolvedNode => typeof child !== "string" && shown(child));
const px = (value: number) => `${Math.round(value * 100) / 100}px`;
type Sides = { top: number; right: number; bottom: number; left: number };

const FLEX: Record<string, string> = { start: "flex-start", center: "center", end: "flex-end", stretch: "stretch", "space-between": "space-between" };
const flex = (value: unknown) => (typeof value === "string" ? FLEX[value] : undefined);

/** The tree without styles left undefined (Satori reads every key it's given) and empty children. */
function clean(node: ReactNode): ReactNode {
  if (Array.isArray(node)) return node.map(clean);
  if (!isValidElement(node)) return node;
  const { style, children, ...props } = (node as ReactElement<{ style?: Style; children?: ReactNode }>).props;
  const kept = style && Object.fromEntries(Object.entries(style).filter(([, value]) => value !== undefined && value !== null));
  const list = ([] as ReactNode[]).concat(children ?? []).filter((child) => child !== null && child !== undefined && child !== false).map(clean);
  return createElement(node.type as string, { ...props, key: node.key, ...(kept ? { style: kept } : {}) }, ...list);
}

export function writeCanvas(root: ResolvedNode, context: WriteContext): ReactNode {
  return clean(canvas(root, context));
}

function canvas(root: ResolvedNode, context: WriteContext): ReactNode {
  const write = new Writer(context);
  return createElement(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        width: px(Number(root.props.width)),
        height: px(Number(root.props.height)),
        overflow: "hidden",
        justifyContent: flex(root.style.justifyContent),
        ...write.box(root),
        ...write.text(root),
        ...gap(root),
      },
    },
    ...nodes(root).map((child, i) => write.block(child, root, i))
  );
}

const gap = (node: ResolvedNode): Style => (typeof node.style.gap === "number" ? { gap: px(node.style.gap) } : {});

class Writer {
  constructor(private readonly context: WriteContext) {}

  /** The family Satori draws a stack in: the first given in it, else the first given. */
  family(stack: string): string {
    return fontStack(stack).find((family) => this.context.fonts.has(family.toLowerCase())) ?? this.context.fallback;
  }

  text(node: ResolvedNode): Style {
    const text = node.text;
    return {
      color: text.color,
      fontFamily: this.family(String(text.fontFamily)),
      fontSize: px(text.fontSize),
      fontWeight: text.fontWeight as CSSProperties["fontWeight"],
      fontStyle: text.fontStyle,
      lineHeight: px(text.lineHeightPx),
      letterSpacing: text.letterSpacing ? px(text.letterSpacing) : undefined,
      textAlign: text.textAlign,
      textTransform: text.textTransform === "none" ? undefined : text.textTransform,
    };
  }

  box(node: ResolvedNode): Style {
    const style = node.style;
    const out: Style = {};
    const padding = style.padding as Sides | undefined;
    if (padding) out.padding = `${px(padding.top)} ${px(padding.right)} ${px(padding.bottom)} ${px(padding.left)}`;
    if (typeof style.backgroundColor === "string") out.backgroundColor = style.backgroundColor;
    const border = style.border as Border | undefined;
    for (const side of ["top", "right", "bottom", "left"] as const) {
      const line = border?.[side];
      if (line) out[`border${side[0].toUpperCase()}${side.slice(1)}`] = line.style === "none" ? "none" : `${px(line.width)} ${line.style} ${line.color}`;
    }
    const radius = style.borderRadius as Radius | undefined;
    if (typeof radius === "number") out.borderRadius = px(radius);
    else if (radius) out.borderRadius = `${px(radius.topLeft)} ${px(radius.topRight)} ${px(radius.bottomRight)} ${px(radius.bottomLeft)}`;
    if (typeof style.height === "number") out.height = px(style.height);
    if (style.overflow === "hidden") out.overflow = "hidden";
    return out;
  }

  /** Where a child of its own size sits across a stack, as in the other outputs. */
  alignSelf(child: ResolvedNode, stack: ResolvedNode): string | undefined {
    const sized = child.style.width !== undefined || child.style.maxWidth !== undefined;
    if (child.type === "Divider" || (child.definition.sizing !== "shrink" && !sized)) return undefined;
    const align = stack.style.alignItems as string | undefined;
    if (align === "stretch") return undefined;
    if (align) return flex(align);
    return { left: "flex-start", justify: "flex-start", center: "center", right: "flex-end" }[stack.text.textAlign];
  }

  block(node: ResolvedNode, parent: ResolvedNode, key?: number, row = false): ReactNode {
    const width = node.width !== null ? px(node.width) : undefined;
    const placed: Style = row
      ? { width, flexShrink: 0, flexGrow: 0, alignSelf: node.definition.sizing === "shrink" ? flex(parent.style.alignItems ?? "start") : undefined }
      : { alignSelf: this.alignSelf(node, parent), width: node.style.width !== undefined || node.style.maxWidth !== undefined || node.definition.sizing === "shrink" ? width : undefined };
    switch (node.type) {
      case "Text":
      case "Paragraph":
      case "Heading":
        return this.paragraph(node, { ...placed, ...this.box(node) }, key);
      case "Button":
        return createElement(
          "div",
          { key, style: { display: "flex", justifyContent: "center", ...placed, ...this.box(node), width } },
          this.paragraph(node, { textAlign: "center" })
        );
      case "Image":
        return this.image(node, placed, key);
      case "Divider": {
        const line = node.style.borderTop as BorderSide | undefined;
        return createElement(
          "div",
          { key, style: { display: "flex", ...this.box(node), ...placed, width } },
          createElement("div", { style: { display: "flex", flexGrow: 1, borderTop: line ? `${px(line.width)} ${line.style} ${line.color}` : undefined } })
        );
      }
      case "Row":
        return createElement(
          "div",
          { key, style: { display: "flex", flexDirection: "row", ...this.box(node), ...placed, ...gap(node), alignItems: flex(node.style.alignItems ?? "start"), justifyContent: flex(node.style.justifyContent) } },
          ...nodes(node).map((child, i) => this.block(child, node, i, true))
        );
      case "Layer":
        return this.layer(node, placed, key);
      case "Svg":
        return this.svg(node, placed, key);
      case "Link":
        // A Link of words (a Menu's links too) is a block of text; one holding an Image, that image.
        if (node.children.some((child) => typeof child === "string" || child.definition.categories.includes("inline"))) return this.paragraph(node, { ...placed, ...this.box(node) }, key);
        return createElement(
          "div",
          { key, style: { display: "flex", flexDirection: "column", ...placed } },
          ...nodes(node).map((child, i) => this.block(child, node, i))
        );
      case "List":
        return this.list(node, placed, key);
      case "Table":
        return this.table(node, placed, key);
      case "Video":
        // An image can't play a video: its title, as an email or a PDF without its thumbnail shows it.
        return createElement("div", { key, style: { display: "flex", ...this.text(node), ...this.box(node), ...placed } }, String(node.props.title ?? "Video"));
      case "Section":
      case "Column":
        return createElement(
          "div",
          { key, style: { display: "flex", flexDirection: "column", ...this.box(node), ...placed, ...gap(node), justifyContent: flex(node.style.justifyContent) } },
          ...nodes(node).map((child, i) => this.block(child, node, i))
        );
      default:
        // Every block a Canvas takes is a case above (a test checks): one without a case fails rather than disappears.
        throw new Error(`[Elements] The image writer draws no ${node.type}`);
    }
  }

  /** A List: each item a marker (its number, or a bullet) beside its text, a List in it under the text. */
  list(node: ResolvedNode, placed: Style, key?: number): ReactNode {
    const indent = typeof node.style.indent === "number" ? node.style.indent : 24;
    const start = Number(node.props.start ?? 1);
    return createElement(
      "div",
      { key, style: { display: "flex", flexDirection: "column", ...this.box(node), ...placed, ...gap(node) } },
      ...nodes(node).map((item, i) =>
        createElement(
          "div",
          { key: i, style: { display: "flex", flexDirection: "row" } },
          createElement("div", { style: { display: "flex", ...this.text(item), width: px(indent), flexShrink: 0, textAlign: "left" } }, node.props.type === "number" ? `${start + i}.` : "•"),
          createElement("div", { style: { display: "flex", flexDirection: "column", flexGrow: 1, flexShrink: 1 } }, ...this.itemParts(item))
        )
      )
    );
  }

  /** A list item's text and the Lists in it, in their order: each run of text a paragraph, each List under it. */
  itemParts(item: ResolvedNode): ReactNode[] {
    const parts: ReactNode[] = [];
    let text: ResolvedNode["children"] = [];
    const flush = () => {
      if (text.some((child) => typeof child !== "string" || child.trim() !== "")) parts.push(this.paragraph({ ...item, children: text }, {}, parts.length));
      text = [];
    };
    for (const child of item.children) {
      if (typeof child !== "string" && child.type === "List") {
        flush();
        if (shown(child)) parts.push(this.list(child, {}, parts.length));
      } else text.push(child);
    }
    flush();
    return parts;
  }

  /** A Table: its rows one under another, each cell at its columns' width (a header row's text bold). */
  table(node: ResolvedNode, placed: Style, key?: number): ReactNode {
    const columns = node.columns ?? null;
    const cellPadding = node.style.cellPadding as Sides | undefined;
    const rowBorder = node.style.rowBorder as BorderSide | undefined;
    const rows = nodes(node);
    return createElement(
      "div",
      { key, style: { display: "flex", flexDirection: "column", ...this.box(node), ...placed } },
      ...rows.map((row, r) => {
        let column = 0;
        const line = r < rows.length - 1 && rowBorder ? `${px(rowBorder.width)} ${rowBorder.style} ${rowBorder.color}` : undefined;
        return createElement(
          "div",
          { key: r, style: { display: "flex", flexDirection: "row", ...this.box(row), borderBottom: line } },
          ...nodes(row).map((cell, c) => {
            const span = Math.max(1, Number(cell.props.colSpan ?? 1));
            const width = columns ? columns.slice(column, column + span).reduce((sum, w) => sum + w, 0) : undefined;
            column += span;
            const padding = cellPadding ? `${px(cellPadding.top)} ${px(cellPadding.right)} ${px(cellPadding.bottom)} ${px(cellPadding.left)}` : undefined;
            return createElement(
              "div",
              { key: c, style: { display: "flex", flexDirection: "column", padding, ...this.box(cell), width: width !== undefined ? px(width) : undefined, flexGrow: width === undefined ? 1 : 0, flexShrink: 0 } },
              this.paragraph(cell, row.props.header ? { fontWeight: 700 } : {})
            );
          })
        );
      })
    );
  }

  /** A block of text: its runs, a line break starting a new line. */
  paragraph(node: ResolvedNode, style: Style, key?: number): ReactNode {
    const breaks = node.children.some((child) => typeof child !== "string" && child.type === "LineBreak");
    return createElement("div", { key, style: { display: "flex", flexWrap: "wrap", ...this.text(node), ...style, whiteSpace: breaks ? "pre-wrap" : undefined } }, ...this.runs(node));
  }

  runs(node: ResolvedNode): ReactNode[] {
    return node.children.map((child, i) => {
      if (typeof child === "string") return child;
      if (!shown(child)) return null;
      switch (child.type) {
        case "LineBreak":
          return "\n";
        case "MergeTag":
          return `{{${child.props.name}}}`;
        case "Image":
          return this.image(child, {}, i);
        default: {
          const style: Style = { ...this.text(child), textAlign: undefined };
          if (child.style.textDecoration !== undefined) style.textDecoration = String(child.style.textDecoration);
          if (typeof child.style.backgroundColor === "string") style.backgroundColor = child.style.backgroundColor;
          return createElement("span", { key: i, style }, ...this.runs(child));
        }
      }
    });
  }

  image(node: ResolvedNode, placed: Style, key?: number, cover?: number): ReactNode {
    const { src, width, height } = assetParts(node.props.src as Asset);
    const source = this.context.image(src);
    if (!source) return null;
    const drawn = node.width ?? width;
    const style: Style = { ...placed, ...this.box(node) };
    if (cover !== undefined) Object.assign(style, { width: "100%", height: px(cover), objectFit: "cover" });
    else if (drawn && width && height) Object.assign(style, { width: px(drawn), height: typeof node.style.height === "number" ? px(node.style.height) : px((drawn * height) / width) });
    return createElement("img", { key, src: source, alt: String(node.props.alt ?? ""), style });
  }

  /** A Layer: its first child in place, the others over it, each in the Layer's whole box, placed by its alignment. */
  layer(node: ResolvedNode, placed: Style, key?: number): ReactNode {
    const [base, ...over] = nodes(node);
    const height = typeof node.style.height === "number" ? node.style.height : undefined;
    return createElement(
      "div",
      { key, style: { display: "flex", position: "relative", ...this.box(node), ...placed, overflow: node.style.borderRadius !== undefined ? "hidden" : undefined } },
      base && (base.type === "Image" && height !== undefined ? this.image(base, {}, undefined, height) : this.block(base, node)),
      ...over.map((child, i) =>
        createElement(
          "div",
          { key: i, style: { display: "flex", flexDirection: "column", position: "absolute", top: 0, right: 0, bottom: 0, left: 0, justifyContent: flex(node.style.alignItems ?? "start"), alignItems: flex(node.style.justifyItems ?? "stretch") } },
          this.block(child, node)
        )
      )
    );
  }

  /** An Svg as SVG, its shapes in its viewBox's units. */
  svg(node: ResolvedNode, placed: Style, key?: number): ReactNode {
    const { width, height, viewBox } = node.props as { width: number; height: number; viewBox?: string };
    const paint = (value: unknown) => (value === "transparent" ? "none" : (value as string | undefined));
    const TAGS: Record<string, string> = { Rect: "rect", Circle: "circle", Ellipse: "ellipse", Line: "line", Polygon: "polygon", Path: "path" };
    const shapes = nodes(node).map((shape, i) =>
      createElement(TAGS[shape.type], {
        key: i,
        ...shape.props,
        fill: paint(shape.style.fill),
        stroke: paint(shape.style.stroke),
        strokeWidth: shape.style.strokeWidth,
        opacity: shape.style.opacity,
      })
    );
    const drawing = createElement("svg", { width, height, viewBox: viewBox ?? `0 0 ${width} ${height}`, xmlns: "http://www.w3.org/2000/svg" }, ...shapes);
    return createElement("div", { key, style: { display: "flex", ...this.box(node), ...placed, width: undefined } }, drawing);
  }
}
