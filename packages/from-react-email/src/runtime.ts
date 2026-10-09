/**
 * Runtime mode: render a React Email template with sample props and map what
 * it renders onto an Elements tree.
 *
 * The template's logic runs first, so loops and conditions come out as the
 * content they produced. Use this to open a template in the visual editor;
 * use the codemod to migrate source code.
 *
 * This file reads the rendered template into the layout tree (layout.ts lays
 * it out) and maps content blocks (map.ts).
 */

import React from "react";
import { renderToStaticMarkup as reactStaticMarkup } from "react-dom/server";
import { el, fallbackHtml, ReportBuilder, type ConversionReport, type ElementNode } from "@unlayer/convert-core";
import { boxStyle, columnWidth, mergeColumnAndBox, mergeRowAndColumn, noteVerticalAlign, textBox, noteTextBox, wrapPadding } from "./boxes";
import { expand, type Node } from "./expand";
import { layout, type BoxNode, type BoxStyle, type ColumnNode, type Flow } from "./layout";
import {
  buttonBlock,
  dividerBlock,
  headingBlock,
  headingMarginProps,
  imageBlock,
  fontStylesheets,
  hasWidth,
  importedStylesheets,
  inheritedStyle,
  noteAttributes,
  paragraphBlock,
  INHERITED,
  type Block,
  type FontSpec,
  type MapCtx,
  tablesInherit,
} from "./map";
import { addSides, backgroundColor, backgroundImage, boxSides, color, fontFamilyProp, inherit, isHidden, margins, pageColor, phoneOnly, px, shownOnPhones, toPx, ZERO, type Style } from "./styles";
import type { BoxSides } from "@unlayer/convert-core";
import { phoneSides, withPhoneStyles } from "./phone-styles";
import { overInline, phoneRules, stacksOnPhones, stylesheetRules, underInline } from "./tailwind";

/** React's static markup, without the image preload links React 19 adds: an email has no use for them. */
function renderToStaticMarkup(element: React.ReactElement): string {
  return reactStaticMarkup(element).replace(/<link rel="preload" as="image"[^>]*>/g, "");
}

export interface RuntimeResult {
  tree: ElementNode;
  /** Web fonts the template loads, for renderToHtml's `fonts` option. */
  fonts: Array<{ url: string }>;
  report: ConversionReport;
}

type Ctx = MapCtx & {
  /** What the template's leftover classes do on phones (from its <style>), by class. */
  phone?: Map<string, Style>;
};
type Element = Exclude<Node, { kind: "text" }>;

const HOST_CONTENT = new Set(["p", "h1", "h2", "h3", "h4", "h5", "h6", "img", "hr", "a", "ul", "ol"]);
const SKIP = new Set(["Preview", "Font", "Head", "head", "style", "meta", "title", "link", "script"]);
const BOXES = new Set(["Container", "Body", "Html", "Section"]);
const BOX_LIKE = new Set(["Section", "Container"]);
/** React Email components that render a table (placed by its `align` when narrower). */
const TABLES = new Set(["Section", "Container", "Row"]);
const STRUCTURE = new Set(["Row", "Column", "Section", "Container"]);

export async function convertElement(element: React.ReactElement): Promise<RuntimeResult> {
  const report = new ReportBuilder();
  const nodes = await expand(element);

  const fontSpecs: FontSpec[] = [];
  let fontStack: string | undefined;
  const previews: string[] = [];
  walk(nodes, (node) => {
    if (node.kind !== "component") return;
    if (node.name === "Preview") previews.push(textOf(node.children));
    if (node.name === "Font") {
      const url = node.props.webFont?.url;
      if (url && node.props.fontFamily) {
        fontSpecs.push({ family: node.props.fontFamily, url, format: node.props.webFont?.format, weight: node.props.fontWeight, style: node.props.fontStyle });
      }
      const fallback = [].concat(node.props.fallbackFontFamily ?? []).join(", ");
      fontStack ??= [node.props.fontFamily, fallback].filter(Boolean).join(", ");
    }
  });
  const phone = new Map<string, Style>();
  const classes = new Map<string, Style>();
  const classImportant = new Map<string, Set<string>>();
  const phoneImportant = new Map<string, Set<string>>();
  const linked: string[] = [];
  walk(nodes, (node) => {
    if (node.kind === "host" && node.tag === "link" && /stylesheet/i.test(String(node.props.rel ?? "")) && /^https?:/.test(String(node.props.href ?? ""))) {
      linked.push(String(node.props.href));
    }
    if (node.kind !== "host" || node.tag !== "style") return;
    // <Font> inside a rendered <head> arrives as its @font-face rule.
    const css = String(node.props.dangerouslySetInnerHTML?.__html ?? textOf(node.children));
    fontSpecs.push(...fontFaces(css));
    linked.push(...importedStylesheets(css));
    const phoneCss = phoneRules(css);
    for (const [cls, style] of phoneCss.styles) phone.set(cls, { ...phone.get(cls), ...style });
    for (const [cls, names] of phoneCss.important) phoneImportant.set(cls, new Set([...(phoneImportant.get(cls) ?? []), ...names]));
    const rules = stylesheetRules(css);
    for (const [cls, style] of rules.classes) classes.set(cls, { ...classes.get(cls), ...style });
    for (const [cls, names] of rules.important) classImportant.set(cls, new Set([...(classImportant.get(cls) ?? []), ...names]));
    for (const selector of rules.other) report.note("head style rule not converted", selector);
  });

  walk(nodes, (node) => {
    if (node.kind === "text") return;
    const names = String(node.props.className ?? "").split(/\s+/);
    // A head rule on a class is under the element's own style, and under React Email's inline styles
    // (Text's 14px) unless it's !important, as in the browser.
    const component = node.kind === "component" ? nameOf(node) : undefined;
    const strong = (from: Map<string, Set<string>>) => new Set(names.flatMap((name) => [...(from.get(name) ?? [])]));
    const fromHead = underInline(component, Object.assign({}, ...names.map((name) => classes.get(name) ?? {})), strong(classImportant));
    const phoneStrong = strong(phoneImportant);
    const phoneFor = component ? new Map([...phone].map(([cls, rule]) => [cls, underInline(component, rule, phoneStrong)] as const)) : phone;
    node.props = { ...node.props, style: withPhoneStyles({ ...fromHead, ...overInline(node.props.style ?? {}, fromHead, strong(classImportant)) }, names, phoneFor) };
  });

  const body = find(nodes, (n) => n.kind === "component" && n.name === "Body") as Element | undefined;
  const document = find(nodes, (n) => n.kind === "component" && n.name === "Html") as Element | undefined;
  const bodyStyle: Style = (body?.kind === "component" && body.props.style) || {};
  const container = find(body ? children(body) : nodes, (n) => n.kind === "component" && n.name === "Container");
  const containerStyle: Style = (container?.kind === "component" && container.props.style) || {};
  const sizes = [toPx(containerStyle.maxWidth), toPx(containerStyle.width)].filter((n): n is number => !!n && n > 0);
  const contentWidth = sizes.length ? Math.min(...sizes) : 600;

  const rootFont = bodyStyle.fontFamily ?? containerStyle.fontFamily ?? fontStack;
  const rtl = /^rtl$/i.test(String(document?.props.dir ?? ""));
  const ctx: Ctx = { report, inherited: inherit({ fontSize: "16px", ...(rtl ? { rtl } : {}) }, bodyStyle), rootFont, phone };

  const fonts = fontStylesheets(fontSpecs, linked);
  const page = pageColor(bodyStyle, report);
  const rows = layout(flowFrom(body ? children(body) : nodes, ctx), { contentWidth, report, background: backgroundImage(bodyStyle, true) ? undefined : page });
  const rootProps: Record<string, unknown> = {
    backgroundColor: page,
    contentWidth: px(contentWidth),
    fontFamily: rootFont ? fontFamilyProp(String(rootFont)) : undefined,
    textColor: color(bodyStyle.color),
    previewText: previews.join(" ").trim() || undefined,
    fonts: fonts.length ? fonts : undefined,
    textDirection: document?.props.dir,
    lang: document?.props.lang,
  };
  const tree = el("Email", rootProps, rows.length ? rows : [el("Row", {}, [el("Column")])]);
  return { tree, fonts, report: report.finish(tree) };
}

// ============================================
// Structure → the layout tree
// ============================================

/** A box's children → layout flow: boxes, rows and content, in order. */
function flowFrom(nodes: Node[], ctx: Ctx): Flow[] {
  const out: Flow[] = [];
  let loose: Node[] = [];
  const flush = () => {
    out.push(...contentFlow(loose, ctx));
    loose = [];
  };
  for (const node of nodes) {
    if (node.kind === "text") {
      loose.push(node);
      continue;
    }
    const name = nameOf(node);
    if (SKIP.has(name)) continue;
    // Shown only on phones: a block hidden on desktop. A box can't be hidden that way, so it stays HTML.
    if (shownOnPhones(node.props.style ?? {}) && !BOXES.has(name)) node.props = { ...node.props, style: phoneOnly(node.props.style) };
    if (isHidden(node.props.style ?? {})) {
      if (shownOnPhones(node.props.style ?? {})) ctx.report.note("content shown only on phones stays hidden there", name);
      flush();
      out.push({ kind: "content", block: { node: fallbackHtml(kept(renderToStaticMarkup(node.element), ctx), "hidden element"), margin: ZERO, padding: ZERO } });
      continue;
    }
    if (node.kind === "component" && BOXES.has(name)) {
      flush();
      out.push(boxFrom(node, ctx, name));
    } else if (node.kind === "component" && name === "Row") {
      flush();
      out.push(...rowFlow(node, ctx));
    } else if (node.kind === "component" && name === "Column") {
      flush();
      out.push(...rowFlow({ ...node, name: "Row", props: {}, children: [node] }, ctx));
    } else if (node.kind === "host" && !HOST_CONTENT.has(name) && hasComponents(node)) {
      // A plain wrapper (div, table, center) around React Email components.
      flush();
      ctx.report.info("wrapper element treated as a section", name);
      out.push(boxFrom(node, ctx, name));
    } else {
      loose.push(node);
    }
  }
  flush();
  return out;
}

function boxFrom(node: Element, ctx: Ctx, label: string): BoxNode {
  const style: Style = node.props.style ?? {};
  const kids = children(node);
  return {
    kind: "box",
    container: label === "Container",
    label,
    style: boxStyle(style, { fitWidth: () => fitWidth(kids), table: node.kind === "component" && TABLES.has(node.name) ? { align: node.props.align } : undefined }),
    children: flowFrom(kids, { ...ctx, inherited: inherit(ctx.inherited, style) }),
  };
}

/**
 * A React Email Row. Only cells belong in a <tr>: browsers move anything else
 * out, before the row's table, where it stacks, so that's where it goes. One
 * column is a box (it can hold more rows); several make a row.
 */
function rowFlow(node: Element, ctx: Ctx): Flow[] {
  const style: Style = node.props.style ?? {};
  const kids = children(node).filter((n) => !(n.kind === "text" && !n.text.trim()));
  const stray = kids.filter((n) => !isColumn(n));
  if (stray.length) {
    ctx.report.info("content directly in a Row stacked above it");
    const cells = kids.filter(isColumn);
    return [...contentFlow(stray, ctx), ...(cells.length ? rowFlow({ ...node, children: cells }, ctx) : [])];
  }
  if (!kids.length) return [];
  const rowCtx: Ctx = { ...ctx, inherited: inherit(ctx.inherited, style) };
  const columns = kids as Element[];
  if (columns.some((column) => isHidden(column.props.style ?? {}))) {
    return [{ kind: "content", block: { node: fallbackHtml(kept(renderToStaticMarkup(node.element), ctx), "hidden element"), margin: ZERO, padding: ZERO } }];
  }
  if (columns.length === 1) {
    const colStyle = columnStyle(columns[0]);
    return [
      {
        kind: "box",
        label: "Row",
        style: mergeRowAndColumn(boxStyle(style, { table: { align: node.props.align } }), boxStyle(colStyle)),
        children: flowFrom(children(columns[0]), { ...rowCtx, inherited: inherit(rowCtx.inherited, colStyle) }),
      },
    ];
  }
  noteVerticalAlign(columns.map(columnStyle), ctx);
  return [
    {
      kind: "row",
      style: boxStyle(style, { table: { align: node.props.align } }),
      columns: columns.map((col): ColumnNode => {
        const colStyle = columnStyle(col);
        let look = boxStyle(colStyle);
        let content = children(col);
        let inherited = inherit(rowCtx.inherited, colStyle);
        // A column holding one styled box (a card): the box's look goes on the column.
        const kids = content.filter((n) => !(n.kind === "text" && !n.text.trim()));
        const box = kids.length === 1 && kids[0].kind === "component" && BOX_LIKE.has(kids[0].name) ? kids[0] : undefined;
        if (box && !box.children.some((k) => k.kind === "component" && STRUCTURE.has(k.name))) {
          look = mergeColumnAndBox(look, boxStyle(box.props.style));
          content = children(box);
          inherited = inherit(inherited, box.props.style);
        }
        const colCtx: Ctx = { ...rowCtx, inherited };
        return {
          kind: "column",
          style: { ...look, margin: ZERO, width: undefined, align: undefined },
          width: columnWidth(colStyle, col.props.width),
          stacks: stacksOnPhones(String(col.props.className ?? "").split(/\s+/), ctx.phone ?? new Map()),
          blocks: blocksFrom(content, colCtx).map((entry) => {
            if (entry.style) noteTextBox(entry.style, ctx);
            return entry.block;
          }),
        };
      }),
    },
  ];
}

/** A Column's style, with its `align` attribute as text-align. */
function columnStyle(col: Element): Style {
  return { ...(col.props.align ? { textAlign: col.props.align } : {}), ...(col.props.style ?? {}) };
}


/** `width: fit-content` around one row of fixed-width columns: their total width. */
function fitWidth(kids: Node[]): number | undefined {
  const significant = kids.filter((n) => !(n.kind === "text" && !n.text.trim()));
  if (significant.length !== 1 || significant[0].kind === "text") return undefined;
  const only = significant[0];
  const columns = nameOf(only) === "Row" ? children(only).filter(isColumn) : isColumn(only) ? [only] : [];
  if (!columns.length) return undefined;
  const widths = columns.map((c) => (c.kind === "text" ? undefined : columnWidth(columnStyle(c), c.props.width)));
  return widths.every((w): w is number => typeof w === "number") ? widths.reduce((a, b) => a + b, 0) : undefined;
}

// ============================================
// Content
// ============================================

/** Content at box level: blocks, with max-width text in narrow boxes of its own. */
function contentFlow(nodes: Node[], ctx: Ctx): Flow[] {
  return blocksFrom(nodes, ctx).map((entry) =>
    entry.style ? textBox(entry.block, entry.style) : { kind: "content", block: entry.block }
  );
}

/** Children → content blocks (inline runs become one Paragraph). */
function blocksFrom(nodes: Node[], ctx: Ctx): Array<{ block: Block; style?: Style }> {
  const out: Array<{ block: Block; style?: Style }> = [];
  let inlineRun: Node[] = [];
  const flushInline = () => {
    const html = inlineRun.map(htmlOf).join("").trim();
    if (html) out.push({ block: paragraphBlock(html, {}, ctx, ZERO, undefined, INHERITED) });
    inlineRun = [];
  };

  const significant = nodes.filter((n) => !(n.kind === "text" && !n.text.trim()));
  for (const node of nodes) {
    if (node.kind === "text") {
      inlineRun.push(node);
      continue;
    }
    const name = nameOf(node);
    if (SKIP.has(name)) continue;
    // Shown only on phones: a block hidden on desktop. A box can't be hidden that way, so it stays HTML.
    if (shownOnPhones(node.props.style ?? {}) && !BOXES.has(name)) node.props = { ...node.props, style: phoneOnly(node.props.style) };
    if (isHidden(node.props.style ?? {})) {
      if (shownOnPhones(node.props.style ?? {})) ctx.report.note("content shown only on phones stays hidden there", name);
      flushInline();
      out.push({ block: { node: fallbackHtml(kept(renderToStaticMarkup(node.element), ctx), "hidden element"), margin: ZERO, padding: ZERO } });
      continue;
    }
    // Image links and inline images side by side (icon rows, rating stars) flow inline together.
    const at = significant.indexOf(node);
    const imageish = (n: Node | undefined) => !!n && n.kind !== "text" && (isImageLink(n) || isInlineImage(n));
    if (isInline(node) || (imageish(node) && (imageish(significant[at - 1]) || imageish(significant[at + 1])))) {
      inlineRun.push(node);
      continue;
    }
    flushInline();
    const style: Style = node.props.style ?? {};
    const blocks = blockFrom(node, ctx);
    const textual = ["Text", "Heading"].includes(node.kind === "component" ? name : hostAlias(name));
    blocks.forEach((block) => out.push({ block, style: textual && blocks.length === 1 ? style : undefined }));
  }
  flushInline();
  return out;
}

function blockFrom(node: Element, ctx: Ctx): Block[] {
  const style: Style = node.props.style ?? {};
  const name = nameOf(node);

  const kind = node.kind === "component" ? name : hostAlias(name);
  if (["Text", "Heading", "Button", "Img", "Link"].includes(kind)) noteAttributes(Object.keys(node.props), ctx, kind);
  switch (kind) {
    case "Text":
      return [paragraphBlock(innerHtml(node), style, ctx, margins(style, node.kind === "component" ? { top: 16, bottom: 16 } : browserMargin(name, ctx)))];
    case "Heading":
      return [headingFrom(node, style, ctx)];
    case "Button":
      return [buttonBlock(node.props.href, [innerText(node)], style, ctx, node.props.target)];
    case "Img":
      if (!hasWidth(node.props.width, style)) return [unsizedImage(node, ctx)];
      return [imageFrom(node, style, ctx)];
    case "Hr":
      return [dividerBlock(style, ctx)];
    case "Link":
      return [linkBlock(node, style, ctx)];
    case "List":
      // Elements text takes list markup (the editor edits it as a list).
      return [paragraphBlock(renderToStaticMarkup(node.element), {}, ctx, margins(style, browserMargin("p", ctx)))];
    case "Markdown":
      ctx.report.note("markdown kept as HTML in a Paragraph");
      return [paragraphBlock(renderToStaticMarkup(node.element), {}, ctx, ZERO)];
    case "CodeBlock":
    case "CodeInline":
      return [{ node: fallbackHtml(kept(renderToStaticMarkup(node.element), ctx), `code block: ${name}`), margin: ZERO, padding: ZERO }];
    case "Section":
    case "Container": {
      // Inside a column of several: rows can't nest, so the section's content
      // goes in this column, with its padding around it.
      const kids = children(node);
      if (kids.some((k) => k.kind === "component" && ((k.name === "Row" && !soleColumn(k)) || k.name === "Column"))) {
        return [{ node: fallbackHtml(kept(renderToStaticMarkup(node.element), ctx), "nested columns"), margin: ZERO, padding: ZERO }];
      }
      if (backgroundColor(style)) ctx.report.note("nested section background dropped", backgroundColor(style));
      const inside = blocksFrom(kids, { ...ctx, inherited: inherit(ctx.inherited, style) }).map((entry) => entry.block);
      return wrapPadding(inside, boxSides(style, "padding"), ctx, phoneSides(style, "padding", boxSides(style, "padding")), style._phone?.display === "none");
    }
    case "Row": {
      // Inside a column of several, a Row of one Column is a box: its content goes in this column.
      const column = soleColumn(node);
      const nested = column && children(column).some((k) => k.kind === "component" && ["Row", "Column"].includes(k.name));
      if (!column || nested) return [{ node: fallbackHtml(kept(renderToStaticMarkup(node.element), ctx), "nested columns"), margin: ZERO, padding: ZERO }];
      const colStyle: Style = column.props.style ?? {};
      if (backgroundColor({ ...style, ...colStyle })) ctx.report.note("nested section background dropped", backgroundColor({ ...style, ...colStyle }));
      const inside = blocksFrom(children(column), { ...ctx, inherited: inherit(inherit(ctx.inherited, style), colStyle) }).map((entry) => entry.block);
      return wrapPadding(inside, addSides(boxSides(style, "padding"), boxSides(colStyle, "padding")), ctx, style._phone || colStyle._phone ? addSides(phoneSides(style, "padding", boxSides(style, "padding")) ?? boxSides(style, "padding"), phoneSides(colStyle, "padding", boxSides(colStyle, "padding")) ?? boxSides(colStyle, "padding")) : undefined, style._phone?.display === "none" || colStyle._phone?.display === "none");
    }
    default: {
      if (node.kind === "host" && hasComponents(node)) {
        ctx.report.note("wrapper element flattened", name);
        const inside = blocksFrom(children(node), { ...ctx, inherited: inherit(ctx.inherited, style) }).map((entry) => entry.block);
        return wrapPadding(inside, boxSides(style, "padding"), ctx, phoneSides(style, "padding", boxSides(style, "padding")), style._phone?.display === "none");
      }
      return [{ node: fallbackHtml(kept(renderToStaticMarkup(node.element), ctx), `unsupported element: ${name}`), margin: ZERO, padding: ZERO }];
    }
  }
}


/** Inline content that flows with text into one Paragraph. */
function isInline(node: Exclude<Node, { kind: "text" }>): boolean {
  const name = node.kind === "component" ? node.name : node.tag;
  if (node.kind === "host" && ["span", "strong", "b", "em", "i", "br", "small", "u", "code", "sup", "sub"].includes(name)) return true;
  if (name === "CodeInline") return true;
  // A Text set inline (pills, badges side by side) flows with its neighbours.
  if ((name === "Text" || name === "p") && inlineDisplay(node.props.style ?? {})) return true;
  if (name === "Link" || name === "a") {
    const style: Style = node.props.style ?? {};
    const buttonLike = backgroundColor(style) && (style.padding || style.paddingTop || style.paddingLeft);
    const onlyImage = node.children.length === 1 && node.children[0].kind !== "text" && ["Img", "img"].includes(nameOf(node.children[0]));
    return !buttonLike && !onlyImage && style.display !== "block";
  }
  return false;
}

/** A Row's only Column: the Row is just a box around it. */
function soleColumn(row: Exclude<Node, { kind: "text" }>): Element | undefined {
  const kids = children(row).filter((n) => !(n.kind === "text" && !n.text.trim()));
  return kids.length === 1 && kids[0].kind !== "text" && isColumn(kids[0]) ? (kids[0] as Element) : undefined;
}

/** An image set inline (`display: inline-block`): it sits on a line with its neighbours. */
function isInlineImage(node: Exclude<Node, { kind: "text" }>): boolean {
  return ["Img", "img"].includes(nameOf(node)) && inlineDisplay(node.props.style ?? {});
}

function isImageLink(node: Exclude<Node, { kind: "text" }>): boolean {
  const name = nameOf(node);
  if (name !== "Link" && name !== "a") return false;
  const kids = node.children.filter((c) => !(c.kind === "text" && !c.text.trim()));
  return kids.length === 1 && kids[0].kind !== "text" && ["Img", "img"].includes(nameOf(kids[0]));
}

/** Kept markup, in a div with the text styles it inherited in the original. */
function kept(html: string, ctx: Ctx): string {
  const style = inheritedStyle(ctx);
  if (!style) return html;
  const css = Object.entries(style)
    .map(([k, v]) => `${k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}:${v}`)
    .join(";");
  return tablesInherit(`<div style="${css.replace(/"/g, "&quot;")}">${html}</div>`);
}

/** An image without a width: kept as HTML, so it shows at its natural size. */
function unsizedImage(node: Element, ctx: Ctx): Block {
  return { node: fallbackHtml(kept(renderToStaticMarkup(node.element), ctx), "image without a width (its natural size isn't known)"), margin: ZERO, padding: ZERO };
}

/** The web fonts a stylesheet declares with @font-face. */
function fontFaces(css: string): FontSpec[] {
  const out: FontSpec[] = [];
  for (const [, body] of css.matchAll(/@font-face\s*{([^}]*)}/g)) {
    const prop = (name: string) => new RegExp(`${name}\\s*:\\s*([^;]+)`).exec(body)?.[1].trim();
    const family = prop("font-family")?.replace(/^['"]|['"]$/g, "");
    const src = /url\((['"]?)([^'")]+)\1\)(?:\s*format\((['"]?)([^'")]+)\3\))?/.exec(body);
    if (family && src) out.push({ family, url: src[2], format: src[4], weight: prop("font-weight"), style: prop("font-style") });
  }
  return out;
}

/** A table cell: React Email's Column, or a plain <td>. */
function isColumn(node: Node): boolean {
  return (node.kind === "component" && node.name === "Column") || (node.kind === "host" && node.tag === "td");
}

function nameOf(node: Exclude<Node, { kind: "text" }>): string {
  return node.kind === "component" ? node.name : node.tag;
}

function hostAlias(tag: string): string {
  if (tag === "p") return "Text";
  if (tag === "ul" || tag === "ol") return "List";
  if (/^h[1-6]$/.test(tag)) return "Heading";
  if (tag === "img") return "Img";
  if (tag === "hr") return "Hr";
  if (tag === "a") return "Link";
  return tag;
}

function browserMargin(tag: string, ctx: Ctx): Partial<BoxSides> {
  const size = toPx(ctx.inherited.fontSize) ?? 16;
  if (tag === "p") return { top: size, bottom: size };
  return {};
}

function headingFrom(node: Exclude<Node, { kind: "text" }>, style: Style, ctx: Ctx): Block {
  const level = node.kind === "component" ? String(node.props.as ?? "h1") : node.tag;
  const html = innerHtml(node);
  const marginProps = node.kind === "component" ? headingMarginProps(node.props) : {};
  return headingBlock(level, { html, plain: !/[<&]/.test(html) }, style, marginProps, ctx);
}

function imageFrom(node: Exclude<Node, { kind: "text" }>, style: Style, ctx: Ctx, href?: unknown): Block {
  const { src, alt, width, height } = node.props;
  return imageBlock({ src, alt, width, height, href }, style, ctx);
}

/** A Link on its own line: an Image with a link, a Button, or a Paragraph. */
function linkBlock(node: Exclude<Node, { kind: "text" }>, style: Style, ctx: Ctx): Block {
  const [only] = node.children.filter((c) => !(c.kind === "text" && !c.text.trim()));
  if (only && only.kind !== "text" && ["Img", "img"].includes(nameOf(only)) && node.children.length <= 1) {
    if (!hasWidth(only.props.width, only.props.style ?? {})) return unsizedImage(node, ctx);
    return imageFrom(only, only.props.style ?? {}, ctx, node.props.href);
  }
  if (backgroundColor(style) && (style.padding || style.paddingTop || style.paddingLeft)) {
    return buttonBlock(node.props.href, [innerText(node)], style, ctx, node.props.target);
  }
  return paragraphBlock(htmlOf(node), {}, { ...ctx }, ZERO);
}

// ============================================
// Helpers
// ============================================

function children(node: Exclude<Node, { kind: "text" }>): Node[] {
  return node.children;
}

function walk(nodes: Node[], visit: (node: Node) => void): void {
  for (const node of nodes) {
    visit(node);
    if (node.kind !== "text") walk(node.children, visit);
  }
}

function find(nodes: Node[], test: (node: Node) => boolean): Node | undefined {
  for (const node of nodes) {
    if (test(node)) return node;
    if (node.kind !== "text") {
      const found = find(node.children, test);
      if (found) return found;
    }
  }
  return undefined;
}

function hasComponents(node: Node): boolean {
  return find(node.kind === "text" ? [] : node.children, (n) => n.kind === "component") !== undefined;
}

function textOf(nodes: Node[]): string {
  return nodes.map((n) => (n.kind === "text" ? n.text : textOf(n.children))).join("");
}

function htmlOf(node: Node): string {
  if (node.kind === "text") return escapeHtml(node.text);
  // An inline Text is a span in running text (a <p> can't sit inside one).
  if ((nameOf(node) === "Text" || nameOf(node) === "p") && inlineDisplay(node.props.style ?? {})) {
    return renderToStaticMarkup(React.createElement("span", { style: node.props.style }, node.props.children));
  }
  return renderToStaticMarkup(node.element);
}

function inlineDisplay(style: Style): boolean {
  return /^inline(-block)?$/.test(String(style.display ?? "").replace(/\s*!important$/, "").trim());
}

/** The HTML inside an element (its children), as React would render it. */
function innerHtml(node: Exclude<Node, { kind: "text" }>): string {
  return renderToStaticMarkup(React.createElement(React.Fragment, null, node.props.children));
}

function innerText(node: Exclude<Node, { kind: "text" }>): string {
  const html = innerHtml(node);
  return html.replace(/<!--[\s\S]*?-->/g, "").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

