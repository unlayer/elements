/**
 * A template in the new components as today's (the builder's): the step 7 codemod's mapping, the other way. Each
 * component becomes the tool the builder edits it with, with the values that draw it as the new engine does: a
 * Section a full-width row, a Row a row of its children as columns (their shares and gap as the columns' widths and
 * padding), content directly in the root a one-column row, a text block its HTML. What no tool shows (a Layer, an
 * Svg, a Table, a box nested in a column) is an HTML block of the new engine's own markup, and listed.
 */
import { Menu as MenuDefinition, Social as SocialDefinition, type Json, type Node, type ResolvedNode } from "@unlayer-internal/elements-core";
import { prepareTemplate, renderTemplate } from "@unlayer-internal/elements-exporters";
import React from "react";
import { Button, Column, Divider, Email, Heading, Html, Image, Menu, Page, Paragraph, Row, Social, Video } from "../index";
import { collectTemplate } from "../primitives/collect";

type Sides = { top: number; right: number; bottom: number; left: number };
type Props = Record<string, unknown>;

export interface Raised {
  /** The template in today's components. */
  element: React.ReactElement | null;
  /** What the builder can't hold as it is: one line each, with where. */
  report: string[];
}

const px = (n: number) => `${Math.round(n * 100) / 100}px` as Length;
const ZERO: Sides = { top: 0, right: 0, bottom: 0, left: 0 };
const sidesCss = (s: Sides) => `${px(s.top)} ${px(s.right)} ${px(s.bottom)} ${px(s.left)}`;
const add = (a: Sides, b: Partial<Sides>): Sides => ({ top: a.top + (b.top ?? 0), right: a.right + (b.right ?? 0), bottom: a.bottom + (b.bottom ?? 0), left: a.left + (b.left ?? 0) });
const padding = (node: Node | ResolvedNode): Sides => (node.style?.padding as Sides | undefined) ?? ZERO;
const escapeHtml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
type TextAlign = "left" | "center" | "right" | "justify";
type Length = `${number}px`;
const ALIGN: Record<string, TextAlign> = { start: "left", center: "center", end: "right", stretch: "left" };
const STACKS = new Set(["Section", "Column", "DocumentPage"]);

/** A run's style as CSS (a Span's, a Link's). */
function runCss(style: Record<string, Json> | undefined): string {
  if (!style) return "";
  const out: string[] = [];
  const map: Record<string, string> = { color: "color", backgroundColor: "background-color", fontWeight: "font-weight", fontStyle: "font-style", textDecoration: "text-decoration", textTransform: "text-transform" };
  for (const [key, value] of Object.entries(style)) {
    if (value === undefined || value === null) continue;
    if (map[key]) out.push(`${map[key]}:${value}`);
    else if (key === "fontSize" || key === "letterSpacing") out.push(`${key === "fontSize" ? "font-size" : "letter-spacing"}:${px(Number(value))}`);
    else if (key === "fontFamily") out.push(`font-family:${String(value).replace(/"/g, "'")}`);
  }
  return out.join(";");
}

/** A text block's children as the HTML today's text tools take. */
function runsHtml(node: Node): string {
  return (node.children ?? [])
    .map((child) => {
      if (typeof child === "string") return escapeHtml(child);
      const css = runCss(child.style);
      const style = css ? ` style="${css}"` : "";
      switch (child.type) {
        case "LineBreak":
          return "<br>";
        case "MergeTag":
          return `{{${child.props?.name}}}`;
        case "Link":
          return `<a href="${escapeHtml(String(child.props?.href ?? ""))}" target="_blank"${style}>${runsHtml(child)}</a>`;
        default:
          return `<span${style}>${runsHtml(child)}</span>`;
      }
    })
    .join("");
}

export function raise(element: React.ReactElement): Raised {
  const report: string[] = [];
  const { document, diagnostics, components } = collectTemplate(element);
  if (!document || diagnostics.some((d) => d.severity === "error")) return { element: null, report: diagnostics.map((d) => `${d.path}: ${d.message}`) };
  const prepared = prepareTemplate(document, { components });
  if (!prepared.resolved) return { element: null, report: prepared.diagnostics.filter((d) => d.severity === "error").map((d) => `${d.path}: ${d.message}`) };
  const root = document.root;
  const resolvedRoot = prepared.resolved.root;
  if (root.type !== "Email" && root.type !== "Page") {
    return { element: null, report: [`root: the builder edits an Email or a Page, not a ${root.type}`] };
  }
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
  const locked = (node: Node, path: string, why: string, around: Sides): React.ReactElement => {
    report.push(`${path}: ${why}: it's an HTML block of its own markup in the builder (it can be moved, not edited)`);
    const own = at(path);
    const html = renderSubtree(node, own.width ?? own.available ?? Number(resolvedRoot.width), root, components);
    return <Html key={path} html={html} containerPadding={sidesCss(around)} />;
  };

  /** A block in a column, with `around` its space in the column (its stack's gap above it, the column's sides). */
  const block = (node: Node, path: string, parent: ResolvedNode, around: Sides): React.ReactElement | React.ReactElement[] => {
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
            href={String(own.props.href ?? "#")}
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
          >
            {(node.children ?? []).filter((c): c is string => typeof c === "string").join("")}
          </Button>
        );
      }
      case "Image": {
        const src = own.props.src as string | { src: string; width?: number; height?: number };
        const parts = typeof src === "string" ? { src } : src;
        return (
          <Image
            key={path}
            {...hidden}
            src={{ url: parts.src, ...(parts.width ? { width: parts.width } : {}), ...(parts.height ? { height: parts.height } : {}) }}
            alt={String(own.props.alt ?? "")}
            // Its width on desktop as a px pin (today's draw it as their share of the column, as the new engine
            // does); on phones, its share of the column (all of it, or the percentage it says).
            width={own.width !== null ? px(own.width) : undefined}
            mobile={phoneImage(own)}
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
            items={(node.props?.items as Array<{ text: string; href: string }>) ?? []}
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
        const icons = ((node.props?.icons as Array<{ name: string; href: string }>) ?? []).map(({ name, href }) => ({ name, url: href }));
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
        if (STACKS.has(node.type) && !hasBox(node)) return stack(node, path, own, around);
        return locked(node, path, `a ${node.type} isn't a tool of the builder's`, around);
    }
  };

  /** A stack's blocks, its gap above each but the first, its padding around them. */
  const stack = (node: Node, path: string, own: ResolvedNode, around: Sides): React.ReactElement[] => {
    const gap = typeof own.style.gap === "number" ? own.style.gap : 0;
    const pad = add(padding(node), around);
    const children = (node.children ?? []).map((child, i) => ({ child, path: `${path}.children[${i}]` })).filter((c): c is { child: Node; path: string } => typeof c.child !== "string");
    return children.flatMap(({ child, path: childPath }, i) => {
      const first = i === 0;
      const last = i === children.length - 1;
      const space: Sides = { top: (first ? pad.top : gap), right: pad.right, bottom: last ? pad.bottom : 0, left: pad.left };
      return ([] as React.ReactElement[]).concat(block(child, childPath, own, space));
    });
  };

  const hasBox = (node: Node) => ["backgroundColor", "border", "borderRadius", "width", "maxWidth", "height"].some((key) => node.style?.[key] !== undefined);

  /** A row of the builder's for a Row: each child a column, its width and its share of the gap its column's. */
  const row = (node: Node, path: string, band: Props, outer: Sides): React.ReactElement => {
    const own = at(path);
    const gap = typeof own.style.gap === "number" ? own.style.gap : 0;
    const rowPad = add(padding(node), outer);
    const children = (node.children ?? []).map((child, i) => ({ child, path: `${path}.children[${i}]` })).filter((c): c is { child: Node; path: string } => typeof c.child !== "string" && !c.child.hidden?.desktop);
    const n = children.length;
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
      return {
        share,
        element: (
          <Column
            key={childPath}
            padding={sidesCss(columnPadding)}
            backgroundColor={isColumn ? (style.backgroundColor as string | undefined) : undefined}
            {...borders}
            borderRadius={isColumn && typeof style.borderRadius === "number" ? px(style.borderRadius) : undefined}
            mobile={phoneBorder || phonePadding ? { ...(phoneBorder ? { border: legacyBorder(phoneBorder) as never } : {}), ...(phonePadding ? { padding: sidesCss(phonePadding) } : {}) } : undefined}
          >
            {isColumn ? stack(withoutPadding(child), childPath, at(childPath), ZERO) : block(child, childPath, own, ZERO)}
          </Column>
        ),
      };
    });
    return (
      <Row key={path} cells={columns.map((c) => Math.max(1, Math.round(c.share)))} padding={`${px(rowPad.top)} 0px ${px(rowPad.bottom)} 0px`} noStackMobile={node.props?.stackOnMobile === false || undefined} columnsBackgroundColor={own.style.backgroundColor as string | undefined} hideOnMobile={node.hidden?.mobile || undefined} hideOnDesktop={node.hidden?.desktop || undefined} {...band}>
        {columns.map((c) => c.element)}
      </Row>
    );
  };

  /** A one-column row of the builder's holding blocks (content directly in the root, or a Section's). */
  const oneColumn = (blocks: Array<{ child: Node; path: string }>, stackNode: ResolvedNode, band: Props, pad: Sides, key: string): React.ReactElement => {
    const gap = typeof stackNode.style.gap === "number" ? stackNode.style.gap : 0;
    return (
      <Row key={key} cells={[1]} padding="0px" {...band}>
        <Column padding="0px">
          {blocks.flatMap(({ child, path }, i) => {
            const space: Sides = { top: i === 0 ? pad.top : gap, right: pad.right, bottom: i === blocks.length - 1 ? pad.bottom : 0, left: pad.left };
            return ([] as React.ReactElement[]).concat(child.type === "Row" ? locked(child, path, "a Row inside a Section's run of blocks", space) : block(child, path, stackNode, space));
          })}
        </Column>
      </Row>
    );
  };

  /** The root's children, or a Section's: Rows (and Grids) as rows of their own, runs of blocks as one-column rows. */
  const rows = (children: Array<{ child: Node; path: string }>, stackNode: ResolvedNode, band: Props, pad: Sides, keyBase: string): React.ReactElement[] => {
    const out: React.ReactElement[] = [];
    let run: Array<{ child: Node; path: string }> = [];
    const gap = typeof stackNode.style.gap === "number" ? stackNode.style.gap : 0;
    const flush = (last: boolean) => {
      if (!run.length) return;
      const top = out.length === 0 ? pad.top : gap;
      out.push(oneColumn(run, stackNode, band, { ...pad, top, bottom: last ? pad.bottom : 0 }, `${keyBase}.run${out.length}`));
      run = [];
    };
    children.forEach(({ child, path }, i) => {
      const last = i === children.length - 1;
      if (child.type === "Row") {
        flush(false);
        out.push(row(child, path, band, { ...pad, top: out.length === 0 ? pad.top : gap, bottom: last ? pad.bottom : 0 }));
      } else if (child.type === "Grid") {
        // A Grid is the Column of Rows it's laid out as: each of its Rows a row of the builder's.
        flush(false);
        const arranged = at(path);
        const gridGap = typeof arranged.style.gap === "number" ? arranged.style.gap : 0;
        arranged.children.forEach((gridRow, r) => {
          if (typeof gridRow === "string") return;
          out.push(row(nodeOf(gridRow), gridRow.path, band, { ...pad, top: r === 0 ? (out.length === 0 ? pad.top : gap) : gridGap, bottom: 0 }));
        });
      } else run.push({ child, path });
    });
    flush(true);
    return out;
  };

  const sections = (root.children ?? []).map((child, i) => ({ child, path: `root.children[${i}]` })).filter((c): c is { child: Node; path: string } => typeof c.child !== "string");
  const body: React.ReactElement[] = [];
  let loose: Array<{ child: Node; path: string }> = [];
  const flushLoose = () => {
    if (loose.length) body.push(...rows(loose, resolvedRoot, {}, ZERO, `root.loose${body.length}`));
    loose = [];
  };
  for (const { child, path } of sections) {
    if (child.type === "Section") {
      flushLoose();
      const own = at(path);
      const sectionChildren = (child.children ?? []).map((c, i) => ({ child: c, path: `${path}.children[${i}]` })).filter((c): c is { child: Node; path: string } => typeof c.child !== "string");
      body.push(...rows(sectionChildren, own, { backgroundColor: own.style.backgroundColor, ...(child.hidden?.mobile ? { hideOnMobile: true } : {}), ...(child.hidden?.desktop ? { hideOnDesktop: true } : {}) }, padding(child), path));
    } else loose.push({ child, path });
  }
  flushLoose();

  const Root = root.type === "Email" ? Email : Page;
  const style = resolvedRoot.style;
  const text = resolvedRoot.text;
  const raised = (
    <Root
      contentWidth={px(Number(resolvedRoot.width)) as never}
      backgroundColor={style.backgroundColor as string | undefined}
      textColor={text.color}
      fontFamily={{ label: String(text.fontFamily).split(",")[0].replace(/["']/g, "").trim(), value: String(text.fontFamily) }}
      {...(root.type === "Email" && root.props?.previewText ? { previewText: String(root.props.previewText) } : {})}
    >
      {body}
    </Root>
  );
  return { element: raised, report };
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
  const { head, body } = renderTemplate({ root: { type: root.type, props: { width: Math.round(width) }, style: root.style, children: [node] } }, { components: components as never });
  const style = /<style>[\s\S]*?<\/style>/.exec(head)?.[0] ?? "";
  return style + body;
}
