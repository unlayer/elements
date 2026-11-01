/**
 * A laid-out Document as react-pdf's components: a Page for each of its pages (the paper's size, the margins as
 * padding, its header, content and footer, nothing flowing onto the next), and each block as react-pdf draws it, at
 * the width the resolver gave it, so the PDF is laid out as the print HTML is.
 */
import { Document as PdfDocument, Image as PdfImage, Link as PdfLink, Page as PdfPage, Text as PdfText, View } from "@react-pdf/renderer";
import { assetParts, documentPages, pageBox, videoParts, type Asset, type BorderSide, type ResolvedNode } from "@unlayer-internal/elements-core";
import type { ReactElement, ReactNode } from "react";
import { alignSelf, borderStyle, boxStyle, flex, pt, runStyle, textStyle, type PdfStyle } from "./styles";

export interface WriteContext {
  /** Font families registered with react-pdf, lowercased. */
  fonts: ReadonlySet<string>;
  /** An image's source as react-pdf loads it without the network (a data URI), or undefined where there's none. */
  image(src: string): string | undefined;
  /** When the PDF says it was made. */
  date: Date;
}

const shown = (node: ResolvedNode) => !node.hidden?.desktop;
const nodes = (node: ResolvedNode) => node.children.filter((child): child is ResolvedNode => typeof child !== "string" && shown(child));

export function writeDocument(root: ResolvedNode, context: WriteContext): ReactElement {
  const box = pageBox(root.props);
  const { pages, header, footer } = documentPages(root);
  const total = pages.length;
  const write = new Writer(context);
  return (
    <PdfDocument title={root.props.title as string | undefined} language={root.props.lang as string | undefined} creationDate={context.date} modificationDate={context.date} producer="Unlayer Elements" creator="Unlayer Elements">
      {pages.map(({ page, children }, index) => {
        write.page = { number: index + 1, total };
        const content = page ?? root;
        return (
          <PdfPage
            key={index}
            size={[pt(box.width), pt(box.height)]}
            style={{
              paddingTop: pt(box.margin.top),
              paddingRight: pt(box.margin.right),
              paddingBottom: pt(box.margin.bottom),
              paddingLeft: pt(box.margin.left),
              backgroundColor: (page?.style.backgroundColor ?? root.style.backgroundColor) as string | undefined,
              flexDirection: "column",
            }}
          >
            {/* The page's box inside its margins, which nothing leaves: what doesn't fit is cut, as in print HTML, not moved on. */}
            <View wrap={false} style={{ height: pt(box.contentHeight), overflow: "hidden", flexDirection: "column" }}>
              {header && write.block(header, root)}
              <View style={{ flexGrow: 1, flexShrink: 1, flexDirection: "column", overflow: "hidden", ...gap(content) }}>{children.filter(shown).map((child, i) => write.block(child, content, i))}</View>
              {footer && write.block(footer, root)}
            </View>
          </PdfPage>
        );
      })}
    </PdfDocument>
  );
}

const gap = (node: ResolvedNode): PdfStyle => (typeof node.style.gap === "number" ? { gap: pt(node.style.gap) } : {});

class Writer {
  page = { number: 1, total: 1 };

  constructor(private readonly context: WriteContext) {}

  /** A block in a stack (or a Row, `row`), at the width the resolver gave it. */
  block(node: ResolvedNode, parent: ResolvedNode, key?: number, row = false): ReactNode {
    const placed: PdfStyle = row
      ? { width: node.width !== null ? pt(node.width) : undefined, flexShrink: 0, flexGrow: 0, alignSelf: node.definition.sizing === "shrink" ? flex(parent.style.alignItems ?? "start") : undefined }
      : { alignSelf: alignSelf(node, parent), width: node.width !== null && (node.style.width !== undefined || node.style.maxWidth !== undefined || node.definition.sizing === "shrink") ? pt(node.width) : undefined };
    switch (node.type) {
      case "Text":
      case "Paragraph":
      case "Heading":
        return (
          <PdfText key={key} style={{ ...textStyle(node, this.context.fonts), ...boxStyle(node), ...placed }}>
            {this.runs(node)}
          </PdfText>
        );
      case "Button":
        return this.button(node, placed, key);
      case "Image":
        return this.image(node, placed, key);
      case "Link":
        return (
          <PdfLink key={key} src={String(node.props.href ?? "")} style={{ ...placed, textDecoration: "none" }}>
            {nodes(node).map((child, i) => this.block(child, node, i))}
          </PdfLink>
        );
      case "Divider": {
        const line = node.style.borderTop as BorderSide | undefined;
        return (
          <View key={key} style={{ ...boxStyle(node), ...placed, width: node.width !== null ? pt(node.width) : undefined }}>
            <View style={borderStyle(line ? { top: line } : undefined)} />
          </View>
        );
      }
      case "Row":
        return (
          <View key={key} style={{ ...boxStyle(node), ...placed, flexDirection: "row", ...gap(node), alignItems: flex(node.style.alignItems ?? "start"), justifyContent: flex(node.style.justifyContent) }}>
            {nodes(node).map((child, i) => this.block(child, node, i, true))}
          </View>
        );
      case "Layer":
        return this.layer(node, placed, key);
      case "List":
        return this.list(node, placed, key);
      case "Table":
        return this.table(node, placed, key);
      case "Video":
        return this.video(node, placed, key);
      default:
        // A stack: a Section, a Column, a page's header or footer.
        return (
          <View key={key} style={{ ...boxStyle(node), ...placed, flexDirection: "column", ...gap(node), justifyContent: flex(node.style.justifyContent) }}>
            {nodes(node).map((child, i) => this.block(child, node, i))}
          </View>
        );
    }
  }

  /** A block of text's children: its words and runs (Span, Link, a line break, a merge tag, a page number). */
  runs(node: ResolvedNode): ReactNode[] {
    return node.children.map((child, i) => {
      if (typeof child === "string") return child;
      if (!shown(child)) return null;
      switch (child.type) {
        case "LineBreak":
          return "\n";
        case "MergeTag":
          return `{{${child.props.name}}}`;
        case "PageNumber":
          return String(child.props.total ? this.page.total : this.page.number);
        case "Link":
          return (
            <PdfLink key={i} src={String(child.props.href ?? "")} style={runStyle(child, this.context.fonts)}>
              {this.runs(child)}
            </PdfLink>
          );
        case "Image":
          return this.image(child, {}, i);
        default:
          return (
            <PdfText key={i} style={runStyle(child, this.context.fonts)}>
              {this.runs(child)}
            </PdfText>
          );
      }
    });
  }

  button(node: ResolvedNode, placed: PdfStyle, key?: number): ReactNode {
    return (
      <PdfLink key={key} src={String(node.props.href ?? "")} style={{ ...placed, textDecoration: "none" }}>
        <View style={{ ...boxStyle(node), width: node.width !== null ? pt(node.width) : undefined }}>
          <PdfText style={{ ...textStyle(node, this.context.fonts), textAlign: "center" }}>{this.runs(node)}</PdfText>
        </View>
      </PdfLink>
    );
  }

  image(node: ResolvedNode, placed: PdfStyle, key?: number, cover?: number): ReactNode {
    const { src, width, height } = assetParts(node.props.src as Asset);
    const source = this.context.image(src);
    if (!source) return null;
    const drawn = node.width ?? width;
    const style: PdfStyle = { ...placed, ...boxStyle(node), width: drawn !== undefined && drawn !== null ? pt(drawn) : undefined };
    if (cover !== undefined) Object.assign(style, { width: "100%", height: pt(cover), objectFit: "cover" });
    else if (typeof node.style.height !== "number" && drawn && width && height) style.height = pt((drawn * height) / width);
    return <PdfImage key={key} src={source} style={style} />;
  }

  /** A Layer: its first child in place, the others over it, each in the Layer's whole box, placed by its alignment. */
  layer(node: ResolvedNode, placed: PdfStyle, key?: number): ReactNode {
    const [base, ...over] = nodes(node);
    const height = typeof node.style.height === "number" ? node.style.height : undefined;
    return (
      <View key={key} style={{ ...boxStyle(node), ...placed, position: "relative", overflow: node.style.borderRadius !== undefined ? "hidden" : undefined }}>
        {base && (base.type === "Image" && height !== undefined ? this.image(base, {}, undefined, height) : this.block(base, node))}
        {over.map((child, i) => (
          <View key={i} style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, flexDirection: "column", justifyContent: flex(node.style.alignItems ?? "start"), alignItems: flex(node.style.justifyItems ?? "stretch") }}>
            {this.block(child, node)}
          </View>
        ))}
      </View>
    );
  }

  list(node: ResolvedNode, placed: PdfStyle, key?: number): ReactNode {
    const indent = typeof node.style.indent === "number" ? node.style.indent : 24;
    const items = nodes(node);
    const start = Number(node.props.start ?? 1);
    return (
      <View key={key} style={{ ...boxStyle(node), ...placed, flexDirection: "column", ...gap(node) }}>
        {items.map((item, i) => (
          <View key={i} style={{ flexDirection: "row" }}>
            <PdfText style={{ ...textStyle(item, this.context.fonts), width: pt(indent), textAlign: "left" }}>{node.props.type === "number" ? `${start + i}.` : "•"}</PdfText>
            <View style={{ flexGrow: 1, flexShrink: 1, flexDirection: "column" }}>
              <PdfText style={textStyle(item, this.context.fonts)}>{this.runs({ ...item, children: item.children.filter((c) => typeof c === "string" || c.type !== "List") })}</PdfText>
              {nodes(item)
                .filter((c) => c.type === "List")
                .map((nested, j) => this.list(nested, {}, j))}
            </View>
          </View>
        ))}
      </View>
    );
  }

  table(node: ResolvedNode, placed: PdfStyle, key?: number): ReactNode {
    const columns = node.columns ?? null;
    const cellPadding = node.style.cellPadding as { top: number; right: number; bottom: number; left: number } | undefined;
    const rowBorder = node.style.rowBorder as BorderSide | undefined;
    const rows = nodes(node);
    return (
      <View key={key} style={{ ...boxStyle(node), ...placed, flexDirection: "column" }}>
        {rows.map((row, r) => {
          let column = 0;
          return (
            <View key={r} style={{ flexDirection: "row", ...(r < rows.length - 1 && rowBorder ? borderStyle({ bottom: rowBorder }) : {}) }}>
              {nodes(row).map((cell, c) => {
                const span = Math.max(1, Number(cell.props.colSpan ?? 1));
                const width = columns ? columns.slice(column, column + span).reduce((sum, w) => sum + w, 0) : undefined;
                column += span;
                const padding = cellPadding ? { paddingTop: pt(cellPadding.top), paddingRight: pt(cellPadding.right), paddingBottom: pt(cellPadding.bottom), paddingLeft: pt(cellPadding.left) } : {};
                return (
                  <View key={c} style={{ ...padding, ...boxStyle(cell), width: width !== undefined ? pt(width) : undefined, flexGrow: width === undefined ? 1 : 0 }}>
                    <PdfText style={{ ...textStyle(cell, this.context.fonts), ...(row.props.header ? { fontWeight: 700 } : {}) }}>{this.runs(cell)}</PdfText>
                  </View>
                );
              })}
            </View>
          );
        })}
      </View>
    );
  }

  /** A Video: its thumbnail linked to it where its bytes are given, else a link with its title. */
  video(node: ResolvedNode, placed: PdfStyle, key?: number): ReactNode {
    const src = String(node.props.src);
    const thumbnail = node.props.thumbnail ? assetParts(node.props.thumbnail as Asset).src : videoParts(src)?.thumbnail;
    const image = thumbnail ? this.context.image(thumbnail) : undefined;
    return (
      <PdfLink key={key} src={src} style={{ ...placed, textDecoration: "none" }}>
        {image ? (
          <PdfImage src={image} style={{ width: node.width !== null ? pt(node.width) : undefined }} />
        ) : (
          <PdfText style={textStyle(node, this.context.fonts)}>{String(node.props.title ?? "Video")}</PdfText>
        )}
      </PdfLink>
    );
  }
}

