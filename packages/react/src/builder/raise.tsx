/**
 * A template in the new components as today's (the builder's): the step 7 codemod's mapping, the other way. Each
 * component becomes the tool the builder edits it with, with the values that draw it as the new engine does: a
 * Section a full-width row, a Row a row of its children as columns (their shares and gap as the columns' widths and
 * padding), content directly in the root a one-column row, a text block its HTML. What no tool shows (a Layer, an
 * Svg, a Table, a box nested in a column) is an HTML block of the new engine's own markup, and listed.
 *
 * Each element it makes is paired with what it was made from (`payloads`), which toDesign() keeps in the design.
 */
import { linkParts, Menu as MenuDefinition, Social as SocialDefinition, type Json, type LinkValue, type Node, type ResolvedNode } from "@unlayer-internal/elements-core";
import { prepareTemplate, renderTemplate } from "@unlayer-internal/elements-exporters";
import React from "react";
import { Button, Column, Divider, Document, Email, Heading, Html, Image, Menu, Page, PageBreak, Paragraph, Row, Social, Video } from "../index";
import { collectTemplate } from "../primitives/collect";
import { kept } from "./fields";
import { runsHtml } from "./runs";
import { bare, PAYLOAD_VERSION, type Group, type Payload } from "./payload";

type Sides = { top: number; right: number; bottom: number; left: number };
type Props = Record<string, unknown>;

export interface Raised {
  /** The template in today's components. */
  element: React.ReactElement | null;
  /** What the builder can't hold as it is: one line each, with where. */
  report: string[];
  /** What each element (the root, a row, a column, a block) was made from. */
  payloads: WeakMap<object, Payload>;
  /** A Document's header and footer, as rows of their own (the builder's `headers` and `footers`). */
  headers?: React.ReactElement[];
  footers?: React.ReactElement[];
}

/** A row's place in the template: the Section, and the Grid, it's a row of. */
type RowGroup = { sec?: Group; grid?: Group };

const px = (n: number) => `${Math.round(n * 100) / 100}px` as Length;
const ZERO: Sides = { top: 0, right: 0, bottom: 0, left: 0 };
const sidesCss = (s: Sides) => `${px(s.top)} ${px(s.right)} ${px(s.bottom)} ${px(s.left)}`;
const add = (a: Sides, b: Partial<Sides>): Sides => ({ top: a.top + (b.top ?? 0), right: a.right + (b.right ?? 0), bottom: a.bottom + (b.bottom ?? 0), left: a.left + (b.left ?? 0) });
const padding = (node: Node | ResolvedNode): Sides => (node.style?.padding as Sides | undefined) ?? ZERO;
type TextAlign = "left" | "center" | "right" | "justify";
type Length = `${number}px`;
const ALIGN: Record<string, TextAlign> = { start: "left", center: "center", end: "right", stretch: "left" };
const STACKS = new Set(["Section", "Column", "DocumentPage"]);

export function raise(element: React.ReactElement): Raised {
  const report: string[] = [];
  const payloads = new WeakMap<object, Payload>();
  const { document, diagnostics, components } = collectTemplate(element);
  if (!document || diagnostics.some((d) => d.severity === "error")) return { element: null, report: diagnostics.map((d) => `${d.path}: ${d.message}`), payloads };
  const prepared = prepareTemplate(document, { components });
  if (!prepared.resolved) return { element: null, report: prepared.diagnostics.filter((d) => d.severity === "error").map((d) => `${d.path}: ${d.message}`), payloads };
  const root = document.root;
  const resolvedRoot = prepared.resolved.root;
  if (root.type !== "Email" && root.type !== "Page" && root.type !== "Document") {
    return { element: null, report: [`root: the builder edits an Email, a Page or a Document, not a ${root.type}`], payloads };
  }
  /** The element, paired with what it was made from. */
  const tag = (made: React.ReactElement, payload: Omit<Payload, "v">): React.ReactElement => {
    payloads.set(made, { v: PAYLOAD_VERSION, ...payload });
    return made;
  };
  const wrapped = (wraps: Group[]) => (wraps.length ? { wrap: wraps } : {});
  /** What of a node the design keeps with no editor in the builder yet, said. */
  const noteKept = (node: Node, path: string) => {
    const extra = kept(node);
    if (extra.length) report.push(`${path}: kept in the design, with no editor in the builder yet: ${extra.join(", ")}`);
  };
  // The resolved node where each node of the template is (a component made of others is replaced in place).
  const resolved = new Map<string, ResolvedNode>();
  const index = (node: ResolvedNode) => {
    resolved.set(node.path, node);
    for (const child of node.children) if (typeof child !== "string") index(child);
  };
  index(resolvedRoot);
  const at = (path: string) => resolved.get(path)!;

  /** Today's alignment of something of its own size in a stack: its alignItems, else its text's. */
  const alignIn = (stack: ResolvedNode): TextAlign => (stack.style.alignItems ? ALIGN[String(stack.style.alignItems)] : stack.text.textAlign);

  /** Where a node can't be a tool: the new engine's own markup for it, in an HTML block. */
  const locked = (node: Node, path: string, why: string, around: Sides, wraps: Group[] = []): React.ReactElement => {
    report.push(`${path}: ${why}: it's an HTML block of its own markup in the builder (it can be moved, not edited)`);
    notePageNumbers(node, path);
    const own = at(path);
    const html = renderSubtree(node, own.width ?? own.available ?? Number(resolvedRoot.width), root, components);
    return tag(<Html key={path} html={html} containerPadding={sidesCss(around)} />, { node, locked: true, ...wrapped(wraps) });
  };

  /** A block in a column, with `around` its space in the column (its stack's gap above it, the column's sides). */
  const block = (node: Node, path: string, parent: ResolvedNode, around: Sides, wraps: Group[] = []): React.ReactElement | React.ReactElement[] => {
    const made = tool(node, path, parent, around, wraps);
    if (Array.isArray(made) || payloads.has(made)) return made;
    noteKept(node, path);
    notePageNumbers(node, path);
    return tag(made, { node, ...wrapped(wraps) });
  };

  const notePageNumbers = (node: Node, path: string) => {
    if (JSON.stringify(node.children ?? []).includes('"type":"PageNumber"')) report.push(`${path}: the builder has no page numbers yet: they're written as {{page_number}} and {{page_count}}`);
  };

  /** The tool a block is in the builder. */
  const tool = (node: Node, path: string, parent: ResolvedNode, around: Sides, wraps: Group[]): React.ReactElement | React.ReactElement[] => {
    const own = at(path);
    const text = own.text;
    const font = { label: String(text.fontFamily).split(",")[0].replace(/["']/g, "").trim(), value: String(text.fontFamily) };
    const textProps = (): Props => ({
      fontFamily: font,
      fontSize: px(text.fontSize),
      fontWeight: text.fontWeight,
      color: text.color,
      textAlign: text.textAlign,
      lineHeight: `${Math.round((text.lineHeightPx / text.fontSize) * 10000) / 100}%`,
      letterSpacing: text.letterSpacing ? px(text.letterSpacing) : undefined,
      textTransform: text.textTransform === "none" ? undefined : text.textTransform,
    });
    const hidden = { hideOnMobile: node.hidden?.mobile || undefined, hideOnDesktop: node.hidden?.desktop || undefined };
    const container = sidesCss(add(padding(node), around));
    switch (node.type) {
      case "Heading":
        return <Heading key={path} {...hidden} headingType={`h${own.props.level ?? 1}` as never} text={runsHtml(node)} {...textProps()} containerPadding={container} />;
      case "Text":
      case "Paragraph":
        return <Paragraph key={path} {...hidden} html={runsHtml(node)} {...textProps()} containerPadding={container} />;
      case "Button": {
        const style = own.style;
        return (
          <Button
            key={path}
            {...hidden}
            href={linkParts(own.props.href as LinkValue).href || "#"}
            {...textProps()}
            textAlign={alignIn(parent)}
            backgroundColor={style.backgroundColor as string | undefined}
            hoverColor={own.hover?.color as string | undefined}
            hoverBackgroundColor={own.hover?.backgroundColor as string | undefined}
            {...legacyBorder((style.border as Lines | undefined) ?? {})}
            padding={sidesCss(padding(own))}
            borderRadius={typeof style.borderRadius === "number" ? px(style.borderRadius) : undefined}
            width={style.width !== undefined ? ((typeof style.width === "number" ? px(style.width) : String(style.width)) as Length) : undefined}
            containerPadding={sidesCss(around)}
            text={runsHtml(node)}
          />
        );
      }
      case "Image":
      case "Link": {
        // A Link holding only an Image is the builder's image with its link (`action`).
        const linked = node.type === "Link";
        const image = linked ? (node.children ?? []).filter((c): c is Node => typeof c !== "string") : [];
        if (linked && (image.length !== 1 || image[0].type !== "Image" || (node.children ?? []).some((c) => typeof c === "string" && c.trim()))) {
          return locked(node, path, "a Link isn't a tool of the builder's", around, wraps);
        }
        const img = linked ? at(`${path}.children[${(node.children ?? []).indexOf(image[0])}]`) : own;
        const src = img.props.src as string | { src: string; width?: number; height?: number };
        const parts = typeof src === "string" ? { src } : src;
        const imageOwn = img;
        return (
          <Image
            key={path}
            {...hidden}
            action={{ name: "web", values: { href: linked ? linkParts(own.props.href as LinkValue).href : "", target: "_blank" } }}
            src={{ url: parts.src, ...(parts.width ? { width: parts.width } : {}), ...(parts.height ? { height: parts.height } : {}) }}
            alt={String(imageOwn.props.alt ?? "")}
            // Its width on desktop as a px pin (today's draw it as their share of the column, as the new engine
            // does); on phones, its share of the column (all of it, or the percentage it says).
            width={imageOwn.width !== null ? px(imageOwn.width) : undefined}
            mobile={phoneImage(imageOwn)}
            textAlign={alignIn(parent)}
            containerPadding={sidesCss(around)}
          />
        );
      }
      case "Divider": {
        const line = own.style.borderTop as { width: number; style: string; color: string } | undefined;
        const width = own.style.width;
        return (
          <Divider
            key={path}
            {...hidden}
            borderTopWidth={px(line?.width ?? 1)}
            borderTopStyle={line?.style ?? "solid"}
            borderTopColor={line?.color ?? "#BBBBBB"}
            width={(width === undefined ? "100%" : typeof width === "number" ? px(width) : String(width)) as Length}
            textAlign={alignIn(parent)}
            containerPadding={container}
          />
        );
      }
      case "Menu": {
        // A Menu is the Row of Links it's laid out as: its own style is the template's, over its definition's.
        const style = { ...(MenuDefinition.defaultStyle as Record<string, Json>), ...node.style };
        const pad = style.padding as Sides;
        return (
          <Menu
            key={path}
            {...hidden}
            items={((node.props?.items as Array<{ text: string; href: LinkValue }>) ?? []).map(({ text, href }) => ({ text, href: linkParts(href).href }))}
            separator={(node.props?.separator as string | undefined) ?? ""}
            layout={(node.props?.layout as "horizontal" | "vertical" | undefined) ?? "horizontal"}
            linkColor={style.color as string}
            textColor={style.separatorColor as string}
            fontFamily={font}
            fontSize={px(Number(style.fontSize ?? text.fontSize))}
            padding={sidesCss(pad)}
            align={ALIGN[String(style.justifyContent ?? "center")] as never}
            containerPadding={sidesCss(around)}
          />
        );
      }
      case "Social": {
        const style = { ...(SocialDefinition.defaultStyle as Record<string, Json>), ...node.style };
        const icons = ((node.props?.icons as Array<{ name: string; href: LinkValue }>) ?? []).map(({ name, href }) => ({ name, url: linkParts(href).href }));
        return (
          <Social
            key={path}
            {...hidden}
            icons={icons}
            iconType={(node.props?.iconType as "circle" | "rounded" | "squared" | undefined) ?? "circle"}
            iconSize={px(Number(node.props?.size ?? 32))}
            spacing={px(Number(style.gap ?? 5))}
            align={ALIGN[String(style.justifyContent ?? "center")] as never}
            containerPadding={sidesCss(around)}
          />
        );
      }
      case "Video":
        return <Video key={path} {...hidden} videoUrl={String(node.props?.src)} containerPadding={sidesCss(around)} />;
      default:
        // A plain stack (a Column without a box of its own) is its blocks, in the same column.
        if (STACKS.has(node.type) && !hasBox(node)) return stack(node, path, own, around, [...wraps, { key: path, node: bare(node) }]);
        return locked(node, path, `a ${node.type} isn't a tool of the builder's`, around, wraps);
    }
  };

  /** A stack's blocks, its gap above each but the first, its padding around them. */
  const stack = (node: Node, path: string, own: ResolvedNode, around: Sides, wraps: Group[] = []): React.ReactElement[] => {
    const gap = typeof own.style.gap === "number" ? own.style.gap : 0;
    const pad = add(padding(node), around);
    const children = (node.children ?? []).map((child, i) => ({ child, path: `${path}.children[${i}]` })).filter((c): c is { child: Node; path: string } => typeof c.child !== "string");
    return children.flatMap(({ child, path: childPath }, i) => {
      const first = i === 0;
      const last = i === children.length - 1;
      const space: Sides = { top: (first ? pad.top : gap), right: pad.right, bottom: last ? pad.bottom : 0, left: pad.left };
      return ([] as React.ReactElement[]).concat(block(child, childPath, own, space, wraps));
    });
  };

  const hasBox = (node: Node) => ["backgroundColor", "border", "borderRadius", "width", "maxWidth", "height"].some((key) => node.style?.[key] !== undefined);

  /** A row of the builder's for a Row: each child a column, its width and its share of the gap its column's. */
  const row = (node: Node, path: string, band: Props, outer: Sides, group: RowGroup, cellsOf?: Node): React.ReactElement => {
    const own = at(path);
    const gap = typeof own.style.gap === "number" ? own.style.gap : 0;
    const rowPad = add(padding(node), outer);
    const all = (node.children ?? []).map((child, i) => ({ child, path: `${path}.children[${i}]` })).filter((c): c is { child: Node; path: string } => typeof c.child !== "string");
    const children = all.filter((c) => !c.child.hidden?.desktop);
    // A child hidden on desktop has no column of the builder's (its columns show on every device): kept, at its place.
    const hiddenOnDesktop = all.flatMap((c, index) => (c.child.hidden?.desktop ? [{ index, node: c.child }] : []));
    for (const { node: child } of hiddenOnDesktop) report.push(`${path}: a ${child.type} hidden on desktop has no column of its own in the builder: kept in the design, not shown there`);
    const n = children.length;
    if (!cellsOf) noteKept(bare(node), path);
    const columns = children.map(({ child, path: childPath }, i) => {
      const width = at(childPath).width ?? 0;
      // The Row's top and bottom padding is the builder's row's; its sides and its gap, the columns' own.
      const halves: Sides = { top: 0, bottom: 0, left: i > 0 ? gap / 2 : rowPad.left, right: i < n - 1 ? gap / 2 : rowPad.right };
      const share = width + halves.left + halves.right;
      const isColumn = child.type === "Column";
      const style = child.style ?? {};
      // The Row's own border is its columns' in the builder, which stretches them to the row's height: top and
      // bottom on each, its sides on the first and last. The column's own over it.
      const rowBorder = (own.style.border as Lines | undefined) ?? {};
      const fromRow: Lines = { top: rowBorder.top, bottom: rowBorder.bottom, ...(i === 0 ? { left: rowBorder.left } : {}), ...(i === n - 1 ? { right: rowBorder.right } : {}) };
      const borders = legacyBorder({ ...fromRow, ...((isColumn ? style.border : undefined) as Lines | undefined) });
      const phoneBorder = isColumn ? (child.mobile?.border as Lines | undefined) : undefined;
      const columnPadding = isColumn ? add(padding(child), halves) : halves;
      // Where the columns stack on phones, each is as wide as the row (its sides only the Row's), the phone gap above
      // all but the first.
      const stacks = node.props?.stackOnMobile !== false;
      const phoneGap = typeof own.mobile?.gap === "number" ? own.mobile.gap : gap;
      const phonePadding = stacks ? add(isColumn ? padding(child) : ZERO, { left: rowPad.left, right: rowPad.right, top: i > 0 ? phoneGap : 0 }) : undefined;
      // A Column is its own column; a Grid's cell is only where its item is; a block a column of its own size.
      const columnPayload: Omit<Payload, "v"> = cellsOf ? {} : isColumn ? { node: bare(child) } : { direct: true };
      if (isColumn && !cellsOf) noteKept(bare(child), childPath);
      return {
        share,
        element: tag(
          <Column
            key={childPath}
            padding={sidesCss(columnPadding)}
            backgroundColor={isColumn ? (style.backgroundColor as string | undefined) : undefined}
            {...borders}
            borderRadius={isColumn && typeof style.borderRadius === "number" ? px(style.borderRadius) : undefined}
            mobile={phoneBorder || phonePadding ? { ...(phoneBorder ? { border: legacyBorder(phoneBorder) as never } : {}), ...(phonePadding ? { padding: sidesCss(phonePadding) } : {}) } : undefined}
          >
            {isColumn ? stack(withoutPadding(child), childPath, at(childPath), ZERO) : block(child, childPath, own, ZERO)}
          </Column>,
          columnPayload
        ),
      };
    });
    return tag(
      <Row key={path} cells={columns.map((c) => Math.max(1, Math.round(c.share)))} padding={`${px(rowPad.top)} 0px ${px(rowPad.bottom)} 0px`} noStackMobile={node.props?.stackOnMobile === false || undefined} columnsBackgroundColor={own.style.backgroundColor as string | undefined} hideOnMobile={node.hidden?.mobile || undefined} hideOnDesktop={node.hidden?.desktop || undefined} {...band}>
        {columns.map((c) => c.element)}
      </Row>,
      { ...(cellsOf ? {} : { node: bare(node) }), ...group, ...(hiddenOnDesktop.length ? { kept: hiddenOnDesktop } : {}) }
    );
  };

  /** A one-column row of the builder's holding blocks (content directly in the root, or a Section's). */
  const oneColumn = (blocks: Array<{ child: Node; path: string }>, stackNode: ResolvedNode, band: Props, pad: Sides, key: string, group: RowGroup): React.ReactElement => {
    const gap = typeof stackNode.style.gap === "number" ? stackNode.style.gap : 0;
    return tag(
      <Row key={key} cells={[1]} padding="0px" {...band}>
        {tag(
          <Column padding="0px">
            {blocks.flatMap(({ child, path }, i) => {
              const space: Sides = { top: i === 0 ? pad.top : gap, right: pad.right, bottom: i === blocks.length - 1 ? pad.bottom : 0, left: pad.left };
              return ([] as React.ReactElement[]).concat(child.type === "Row" ? locked(child, path, "a Row inside a Section's run of blocks", space) : block(child, path, stackNode, space));
            })}
          </Column>,
          { run: true }
        )}
      </Row>,
      { run: true, ...group }
    );
  };

  /** The root's children, or a Section's: Rows (and Grids) as rows of their own, runs of blocks as one-column rows. */
  const rows = (children: Array<{ child: Node; path: string }>, stackNode: ResolvedNode, band: Props, pad: Sides, keyBase: string, group: RowGroup = {}): React.ReactElement[] => {
    const out: React.ReactElement[] = [];
    let run: Array<{ child: Node; path: string }> = [];
    const gap = typeof stackNode.style.gap === "number" ? stackNode.style.gap : 0;
    const flush = (last: boolean) => {
      if (!run.length) return;
      const top = out.length === 0 ? pad.top : gap;
      out.push(oneColumn(run, stackNode, band, { ...pad, top, bottom: last ? pad.bottom : 0 }, `${keyBase}.run${out.length}`, group));
      run = [];
    };
    children.forEach(({ child, path }, i) => {
      const last = i === children.length - 1;
      if (child.type === "Row") {
        flush(false);
        out.push(row(child, path, band, { ...pad, top: out.length === 0 ? pad.top : gap, bottom: last ? pad.bottom : 0 }, group));
      } else if (child.type === "Grid") {
        // A Grid is the Column of Rows it's laid out as: each of its Rows a row of the builder's, each cell a column
        // holding the Grid's child there.
        flush(false);
        const arranged = at(path);
        const gridGap = typeof arranged.style.gap === "number" ? arranged.style.gap : 0;
        const items = (child.children ?? []).filter((item): item is Node => typeof item !== "string");
        let next = 0;
        arranged.children.forEach((gridRow, r) => {
          if (typeof gridRow === "string") return;
          const shape = nodeOf(gridRow);
          const cells = (shape.children ?? []).map((cell) => (typeof cell !== "string" && cell.children?.length ? { ...cell, children: [items[next++]] } : cell));
          out.push(row({ ...shape, children: cells }, gridRow.path, band, { ...pad, top: r === 0 ? (out.length === 0 ? pad.top : gap) : gridGap, bottom: 0 }, { ...group, grid: { key: path, node: bare(child) } }, shape));
        });
      } else run.push({ child, path });
    });
    flush(true);
    return out;
  };

  const sections = (root.children ?? []).map((child, i) => ({ child, path: `root.children[${i}]` })).filter((c): c is { child: Node; path: string } => typeof c.child !== "string");
  const body: React.ReactElement[] = [];
  const headers: React.ReactElement[] = [];
  const footers: React.ReactElement[] = [];
  let loose: Array<{ child: Node; path: string }> = [];
  const flushLoose = () => {
    if (loose.length) body.push(...rows(loose, resolvedRoot, {}, ZERO, `root.loose${body.length}`));
    loose = [];
  };
  const childrenOf = (node: Node, path: string) => (node.children ?? []).map((c, i) => ({ child: c, path: `${path}.children[${i}]` })).filter((c): c is { child: Node; path: string } => typeof c.child !== "string");
  /** A page break of the builder's, in a row of its own: one of the template's, or one that's only where a page starts. */
  const pageBreak = (path: string, node: Node, implied: boolean) =>
    tag(<Row key={`${path}.break`} cells={[1]} padding="0px">{tag(<Column padding="0px">{tag(<PageBreak key={path} />, { node, ...(implied ? { implied: true } : {}) })}</Column>, { run: true })}</Row>, { run: true });
  // In a Document, a page break goes where a page starts or ends (the builder breaks at each, the template's own too).
  let last: "page" | "break" | "other" | null = null;
  const breakBefore = (path: string) => {
    if (last && last !== "break") body.push(pageBreak(path, { type: "PageBreak" }, true));
  };
  for (const [i, { child, path }] of sections.entries()) {
    if (child.type === "Section") {
      flushLoose();
      if (last === "page") breakBefore(path);
      last = "other";
      const own = at(path);
      noteKept(bare(child), path);
      const band = { backgroundColor: own.style.backgroundColor, ...(child.hidden?.mobile ? { hideOnMobile: true } : {}), ...(child.hidden?.desktop ? { hideOnDesktop: true } : {}) };
      const group = { sec: { key: path, node: bare(child) } };
      const sectionRows = rows(childrenOf(child, path), own, band, padding(child), path, group);
      // An empty Section (a band of space) is a row with nothing in it.
      body.push(...(sectionRows.length ? sectionRows : [oneColumn([], own, band, padding(child), `${path}.empty`, group)]));
    } else if (child.type === "DocumentPage") {
      // A page is its rows (a blank one, a row with nothing in it), a page break before it where something comes before it.
      flushLoose();
      breakBefore(path);
      last = "page";
      noteKept(bare(child), path);
      const group = { sec: { key: path, node: bare(child) } };
      const pageRows = rows(childrenOf(child, path), at(path), {}, ZERO, path, group);
      body.push(...(pageRows.length ? pageRows : [oneColumn([], at(path), {}, ZERO, `${path}.blank`, group)]));
    } else if (child.type === "PageBreak") {
      flushLoose();
      const content = sections.slice(i + 1).some((c) => c.child.type !== "PageHeader" && c.child.type !== "PageFooter" && c.child.type !== "PageBreak");
      if (last === null || !content) report.push(`${path}: a page break with nothing before or after it is no page in Elements, and a blank page in the builder`);
      body.push(pageBreak(path, child, false));
      last = "break";
    } else if (child.type === "PageHeader" || child.type === "PageFooter") {
      noteKept(bare(child), path);
      (child.type === "PageHeader" ? headers : footers).push(...rows(childrenOf(child, path), at(path), {}, ZERO, path, { sec: { key: path, node: bare(child) } }));
    } else {
      if (last === "page") breakBefore(path);
      last = "other";
      loose.push({ child, path });
    }
  }
  flushLoose();

  noteKept(bare(root), "root");
  const style = resolvedRoot.style;
  const text = resolvedRoot.text;
  const common = {
    contentWidth: px(Number(resolvedRoot.width)) as never,
    backgroundColor: style.backgroundColor as string | undefined,
    textColor: text.color,
    fontFamily: { label: String(text.fontFamily).split(",")[0].replace(/["']/g, "").trim(), value: String(text.fontFamily) },
  };
  const raised =
    root.type === "Document"
      ? tag(
          <Document {...common} documentSize={(root.props?.size as never) ?? "A4"} documentOrientation={(root.props?.orientation as never) ?? "portrait"}>
            {body}
          </Document>,
          { node: bare(root) }
        )
      : tag(
          React.createElement(root.type === "Email" ? Email : Page, { ...common, ...(root.type === "Email" && root.props?.previewText ? { previewText: String(root.props.previewText) } : {}) }, body),
          { node: bare(root) }
        );
  if (root.type === "Document") return { element: raised, report, payloads, headers, footers };
  return { element: raised, report, payloads };
}

/** A phone's column, about: what tells a percentage's width from its cap on a phone. */
const PHONE_COLUMN = 300;

/**
 * An image's width on phones as today's override: all of its column, or its share (a percentage), or its px cap where
 * that's what a phone draws (the share of a phone's column wider than the cap). One override holds one width.
 */
function phoneImage(own: ResolvedNode): Record<string, unknown> | undefined {
  const width = own.style.width;
  if (width === "100%") return { autoWidth: true };
  if (typeof width !== "string" || !width.endsWith("%")) return undefined;
  const cap = typeof own.style.maxWidth === "number" ? own.style.maxWidth : undefined;
  if (cap !== undefined && cap < (parseFloat(width) / 100) * PHONE_COLUMN) return { autoWidth: false, maxWidth: px(cap) };
  return { autoWidth: false, maxWidth: width };
}

type Line = { width: number; style: string; color: string };
type Lines = Partial<Record<"top" | "right" | "bottom" | "left", Line>>;

/** A border, side by side, as today's props (`borderBottomWidth`, …). */
function legacyBorder(lines: Lines): Props {
  const out: Props = {};
  for (const side of ["top", "right", "bottom", "left"] as const) {
    const line = lines[side];
    if (!line) continue;
    const name = side[0].toUpperCase() + side.slice(1);
    Object.assign(out, { [`border${name}Width`]: line.style === "none" ? "0px" : px(line.width), [`border${name}Style`]: line.style === "none" ? "solid" : line.style, [`border${name}Color`]: line.color });
  }
  return out;
}

/** A Column's node without its padding (its column's, in the builder). */
function withoutPadding(node: Node): Node {
  const { padding: _padding, ...style } = node.style ?? {};
  return { ...node, style };
}

/** A resolved node as a template node (a Grid's arranged Rows, which the template doesn't have). */
function nodeOf(node: ResolvedNode): Node {
  return {
    type: node.type,
    ...(node.id ? { id: node.id } : {}),
    props: node.props,
    style: node.style,
    ...(node.hidden ? { hidden: node.hidden } : {}),
    children: node.children.map((child) => (typeof child === "string" ? child : nodeOf(child))),
  };
}

/** A node drawn on its own by the new engine, at its width, in the root's output: its HTML, with its stylesheet. */
function renderSubtree(node: Node, width: number, root: Node, components: unknown): string {
  // Drawn at its width in a page at least as wide as a root can be (a Document's block as a page's), the root's text
  // styles around it.
  const drawn = Math.round(width);
  // A Document's page numbers as the builder's tokens, which a Page can hold.
  const tokens = (node: Node): Node =>
    node.type === "PageNumber" ? { type: "MergeTag", props: { name: node.props?.total ? "page_count" : "page_number" } } : node.children ? { ...node, children: node.children.map((child) => (typeof child === "string" ? child : tokens(child))) } : node;
  const own = tokens(node);
  const page: Node = { type: root.type === "Email" ? "Email" : "Page", props: { width: Math.max(200, drawn) }, style: root.style, children: [drawn < 200 ? { type: "Column", style: { width: drawn }, children: [own] } : own] };
  const { head, body } = renderTemplate({ root: page }, { components: components as never });
  const style = /<style>[\s\S]*?<\/style>/.exec(head)?.[0] ?? "";
  return style + body;
}
