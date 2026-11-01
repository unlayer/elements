/**
 * Web HTML from a resolved document: one element per node, its styles
 * inline, flexbox for the root, Rows and Columns. The only stylesheet is
 * what inline styles can't do: phone overrides, hiding, hover, and fonts.
 */
import { assetParts, linkParts, type Asset, type Json, type LinkValue, type ResolvedDocument, type ResolvedNode, type ResolvedText } from "@unlayer-internal/elements-core";
import { Stylesheet } from "./classes";
import { attrs, border, css, escapeText, insets, length, px, radius, styleAttr, textDeclarations, textValue, type Declarations } from "./css";

export interface WebOptions {
  /** How a merge tag is written (default `{{name}}`). */
  mergeTag?: (name: string) => string;
  /** What every class name in the stylesheet starts with (default "e"), for HTML embedded where other CSS is. */
  classPrefix?: string;
}

export interface WebHtml {
  /** The whole document, from `<!DOCTYPE html>`. */
  html: string;
  /** What goes in `<head>`: meta tags, the title, the stylesheet. */
  head: string;
  /** What goes in `<body>`. */
  body: string;
  /** The `<body>`'s own style (the window's background), for a page that embeds `body`. */
  bodyStyle: string;
}

/** Below this width a Page is on a phone. */
export const WEB_PHONE_WIDTH = 480;
const PHONE = `@media (max-width: ${WEB_PHONE_WIDTH}px)`;
const DESKTOP = `@media (min-width: ${WEB_PHONE_WIDTH + 1}px)`;

interface Context {
  options: WebOptions;
  sheet: Stylesheet;
  fonts: Map<string, string>;
}

const FLEX_ALIGN: Record<string, string> = { start: "flex-start", center: "center", end: "flex-end", stretch: "stretch" };
const TEXT_ALIGN: Record<string, string> = { left: "flex-start", justify: "flex-start", center: "center", right: "flex-end" };
const JUSTIFY: Record<string, string> = { start: "flex-start", center: "center", end: "flex-end", between: "space-between" };

export function renderWeb(resolved: ResolvedDocument, options: WebOptions = {}): WebHtml {
  const root = resolved.root;
  const context: Context = { options, sheet: new Stylesheet(options.classPrefix), fonts: new Map() };
  collectFonts(root, context);
  const body = renderRoot(root, context);

  const stylesheet = [...context.fonts.values(), context.sheet.css(PHONE, DESKTOP)].join("");
  const head = [
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    typeof root.props.title === "string" ? `<title>${escapeText(root.props.title)}</title>` : "",
    typeof root.props.description === "string" ? `<meta${attrs({ name: "description", content: root.props.description })}>` : "",
    stylesheet ? `<style>${stylesheet}</style>` : "",
  ].join("");
  const bodyStyle = css([
    ["margin", "0"],
    ["background-color", root.style.backgroundColor as string | undefined],
  ]);
  const html = `<!DOCTYPE html><html${attrs({ lang: root.props.lang as string | undefined, dir: root.props.dir as string | undefined })}><head>${head}</head><body${styleAttr([["margin", "0"], ["background-color", root.style.backgroundColor as string | undefined]])}>${body}</body></html>`;
  return { html, head, body, bodyStyle };
}

// ─── Layouts ────────────────────────────────────────────────────────────────

const isNode = (child: ResolvedNode | string): child is ResolvedNode => typeof child !== "string";

function renderRoot(root: ResolvedNode, context: Context): string {
  const width = px(root.width ?? 0);
  const stack = (): Declarations => [
    ["display", "flex"],
    ["flex-direction", "column"],
    ["gap", length(root.style.gap)],
  ];
  const nodes = root.children.filter(isNode);
  const content = (children: ResolvedNode[]) => children.map((child) => render(child, root, context, alignSelf(child, root))).join("");
  if (!nodes.some((node) => node.type === "Section")) {
    return `<main${styleAttr([["max-width", width], ["margin", "0 auto"], ...stack(), ...textDeclarations(root.text, undefined)])}>${content(nodes)}</main>`;
  }
  // Sections span the window: the other children are kept to the content width, in runs between them.
  const parts: string[] = [];
  let run: ResolvedNode[] = [];
  const flush = () => {
    if (run.length) parts.push(`<div${styleAttr([["width", "100%"], ["max-width", width], ["margin", "0 auto"], ...stack()])}>${content(run)}</div>`);
    run = [];
  };
  for (const node of nodes) {
    if (node.type === "Section") {
      flush();
      parts.push(render(node, root, context, []));
    } else run.push(node);
  }
  flush();
  return `<main${styleAttr([...stack(), ...textDeclarations(root.text, undefined)])}>${parts.join("")}</main>`;
}

/**
 * Where a child sits across a stack (root, Section, Column): one that fills
 * the width (a Text, a Row) fills it; one with its own size (a Button, an
 * Image, a box with a width) sits where the stack's `align` says, else where
 * its text alignment says, as in email.
 */
function alignSelf(child: ResolvedNode, stack: ResolvedNode): Declarations {
  if (child.type === "Divider") return [];
  const sized = child.style.width !== undefined || child.style.maxWidth !== undefined;
  if (child.definition.sizing !== "shrink" && !sized) return [];
  const align = stack.style.align as string | undefined;
  if (align === "stretch") return [];
  // A box that fills the width up to a maximum still fills it: placed, not shrunk to its content.
  const fill: Declarations = child.definition.sizing === "stretch" && child.style.width === undefined ? [["width", "100%"]] : [];
  return [["align-self", align ? FLEX_ALIGN[align] : TEXT_ALIGN[stack.text.textAlign]], ...fill];
}

/** A Row's child: its width as a flex basis, or its share of what's left. */
function rowPlacement(child: ResolvedNode, row: ResolvedNode): Declarations {
  const out: Declarations = [];
  const width = length(child.style.width);
  if (width !== undefined) out.push(["flex", `0 1 ${width}`]);
  else if (child.style.flex === "none" || child.style.flex === 0) out.push(["flex", "0 0 auto"]);
  else out.push(["flex", `${typeof child.style.flex === "number" ? child.style.flex : 1} 1 0%`]);
  if (child.style.minWidth === undefined) out.push(["min-width", "0"]);
  // Content with its own size keeps it, not the Row's height.
  if (child.definition.sizing === "shrink" && child.type !== "Link") out.push(["align-self", FLEX_ALIGN[(row.style.align as string) ?? "start"]]);
  return out;
}

function box(node: ResolvedNode, withWidth = true): Declarations {
  const { style } = node;
  const framed = style.padding !== undefined || style.border !== undefined;
  return [
    ...(framed || (withWidth && style.width !== undefined) ? ([["box-sizing", "border-box"]] as Declarations) : []),
    ...(withWidth ? ([["width", length(style.width)]] as Declarations) : []),
    ["min-width", length(style.minWidth)],
    ["max-width", length(style.maxWidth)],
    ["height", length(style.height)],
    ["padding", insets(style.padding)],
    ["background-color", style.backgroundColor as string | undefined],
    ...border(style.border),
    ["border-radius", radius(style.borderRadius)],
    ["overflow", style.overflow === "hidden" ? "hidden" : undefined],
  ];
}

function stackOf(node: ResolvedNode): Declarations {
  return [
    ["display", "flex"],
    ["flex-direction", "column"],
    ["gap", length(node.style.gap)],
    ["justify-content", node.style.justify ? JUSTIFY[node.style.justify as string] : undefined],
  ];
}

// ─── Nodes ──────────────────────────────────────────────────────────────────

/** `placement`: what the parent's layout adds (a Row's flex, a stack's align-self). */
function render(node: ResolvedNode, parent: ResolvedNode, context: Context, placement: Declarations): string {
  const id = node.id;
  const classes = classesFor(node, context);
  const text = (always: ReadonlyArray<keyof ResolvedText> = []) => textDeclarations(node.text, parent.text, always);
  const inRow = parent.type === "Row";
  const children = () => node.children.filter(isNode);

  switch (node.type) {
    case "Section": {
      const padding = (node.style.padding as { top: number; right: number; bottom: number; left: number } | undefined) ?? { top: 0, right: 0, bottom: 0, left: 0 };
      const content = parent.width ?? 0;
      // Its content stays at the root's width, centered, however wide the window is.
      const inline = (side: number) => `max(${px(side)}, calc((100% - ${px(content)}) / 2 + ${px(side)}))`;
      const style = styleAttr([
        ...stackOf(node),
        ["padding", `${px(padding.top)} ${inline(padding.right)} ${px(padding.bottom)} ${inline(padding.left)}`],
        ["background-color", node.style.backgroundColor as string | undefined],
        ...border(node.style.border),
        ...text(),
      ]);
      const inner = children()
        .map((child) => render(child, node, context, alignSelf(child, node)))
        .join("");
      return `<section${attrs({ id, class: classes })}${style}>${inner}</section>`;
    }
    case "Row": {
      const wrap = node.style.wrap;
      const style = styleAttr([
        ...placement,
        ["display", "flex"],
        ["gap", length(node.style.gap)],
        ["align-items", node.style.align ? FLEX_ALIGN[node.style.align as string] : undefined],
        ["justify-content", node.style.justify ? JUSTIFY[node.style.justify as string] : undefined],
        ["flex-wrap", wrap === "wrap" ? "wrap" : undefined],
        ...box(node, !inRow),
        ...text(),
      ]);
      const inner = children()
        .map((child) => render(child, node, context, rowPlacement(child, node)))
        .join("");
      return `<div${attrs({ id, class: classes })}${style}>${inner}</div>`;
    }
    case "Column": {
      const style = styleAttr([...placement, ...stackOf(node), ...box(node, !inRow), ...text()]);
      const inner = children()
        .map((child) => render(child, node, context, alignSelf(child, node)))
        .join("");
      return `<div${attrs({ id, class: classes })}${style}>${inner}</div>`;
    }
    case "Text":
    case "Paragraph":
    case "Heading": {
      const tag = node.type === "Text" ? "div" : node.type === "Paragraph" ? "p" : `h${node.props.level}`;
      const style = styleAttr([
        ...placement,
        ...(tag === "div" ? [] : ([["margin", "0"]] as Declarations)),
        ...text(node.type === "Heading" ? ["fontSize", "fontWeight"] : []),
        ["text-decoration", node.style.textDecoration as string | undefined],
        ...box(node, !inRow),
      ]);
      return `<${tag}${attrs({ id, class: classes })}${style}>${inline(node, context)}</${tag}>`;
    }
    case "Span": {
      const style = styleAttr([...text(), ["text-decoration", node.style.textDecoration as string | undefined], ["background-color", node.style.backgroundColor as string | undefined]]);
      return `<span${attrs({ id, class: classes })}${style ? `${style}` : ""}>${inline(node, context)}</span>`;
    }
    case "Link": {
      const { href, target } = linkParts(node.props.href as LinkValue);
      const style = styleAttr([
        ...placement,
        ...text(["color"]),
        ["text-decoration", node.style.textDecoration as string | undefined],
        ["background-color", node.style.backgroundColor as string | undefined],
      ]);
      return `<a${attrs({ id, class: classes, href, target, rel: target === "_blank" ? "noopener noreferrer" : undefined })}${style}>${inline(node, context)}</a>`;
    }
    case "Button": {
      const { href, target } = linkParts(node.props.href as LinkValue);
      const style = styleAttr([
        ...placement,
        ["display", "inline-block"],
        ["text-decoration", "none"],
        ...text(["color"]),
        ...box(node, !inRow),
      ]);
      return `<a${attrs({ id, class: classes, href, target, rel: target === "_blank" ? "noopener noreferrer" : undefined })}${style}>${inline(node, context)}</a>`;
    }
    case "Image": {
      const { src } = assetParts(node.props.src as Asset);
      const percent = typeof node.style.width === "string";
      const style = styleAttr([
        ...placement,
        ["display", "block"],
        ["max-width", length(node.style.maxWidth) ?? "100%"],
        ["width", inRow ? undefined : length(node.style.width)],
        ["height", length(node.style.height) ?? "auto"],
        ...border(node.style.border),
        ["border-radius", radius(node.style.borderRadius)],
      ]);
      const width = !percent && node.width !== null ? node.width : undefined;
      return `<img${attrs({ id, class: classes, src, alt: (node.props.alt as string) ?? "", width })}${style}>`;
    }
    case "Divider": {
      const align = parent.text.textAlign;
      const line: Declarations = [
        ["margin", align === "center" ? "0 auto" : align === "right" ? "0 0 0 auto" : "0"],
        ["border", "0"],
        ["border-top", `${px(node.style.thickness as number)} ${node.style.lineStyle} ${node.style.color}`],
        ["width", length(node.style.width)],
      ];
      if (node.style.padding === undefined) return `<hr${attrs({ id, class: classes })}${styleAttr([...placement, ...line])}>`;
      return `<div${attrs({ id, class: classes })}${styleAttr([...placement, ["box-sizing", "border-box"], ["padding", insets(node.style.padding)]])}><hr${styleAttr(line)}></div>`;
    }
    case "LineBreak":
      return "<br>";
    case "MergeTag":
      return escapeText((context.options.mergeTag ?? ((name: string) => `{{${name}}}`))(node.props.name as string));
    default:
      throw new Error(`[Elements] The web exporter can't render a ${node.type}`);
  }
}

function inline(node: ResolvedNode, context: Context): string {
  return node.children.map((child) => (typeof child === "string" ? escapeText(child) : render(child, node, context, []))).join("");
}

// ─── What inline styles can't do: phones, hiding, hover ─────────────────────

const OVERRIDE: Record<string, (value: Json) => Declarations> = {
  width: (v) => [["width", length(v)]],
  maxWidth: (v) => [["max-width", length(v)]],
  padding: (v) => [["padding", insets(v)]],
  border: (v) => border(v),
  gap: (v) => [["gap", length(v)]],
  backgroundColor: (v) => [["background-color", v as string]],
  textDecoration: (v) => [["text-decoration", v as string]],
};

function declarationsOf(values: Record<string, Json>): Declarations {
  const out: Declarations = [];
  for (const [key, value] of Object.entries(values)) {
    const textual = textValue(key, value);
    if (textual !== undefined) out.push([key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`), textual]);
    else if (OVERRIDE[key]) out.push(...OVERRIDE[key](value));
  }
  return out;
}

/** The classes of the stylesheet's rules for the node (phone styles, hiding, hover, stacking), if any. */
function classesFor(node: ResolvedNode, context: Context): string | undefined {
  const { sheet } = context;
  const classes: string[] = [];
  if (node.mobile) {
    // A Divider's length is its line's.
    const { width, ...rest } = node.mobile;
    if (Object.keys(rest).length) classes.push(sheet.classFor("phone", `&{${css(declarationsOf(rest), true)}}`));
    const line = node.type === "Divider" && node.style.padding !== undefined ? ">hr" : "";
    if (width !== undefined) classes.push(sheet.classFor("phone", `&${line}{${css(declarationsOf({ width }), true)}}`));
  }
  if (node.hidden?.mobile) classes.push(sheet.classFor("phone", "&{display:none!important}"));
  if (node.hidden?.desktop) classes.push(sheet.classFor("desktop", "&{display:none!important}"));
  if (node.hover) classes.push(sheet.classFor("all", `&:hover{${css(declarationsOf(node.hover), true)}}`));
  if (node.type === "Row" && node.style.wrap === "stack") {
    classes.push(
      sheet.classFor("phone", "&{flex-direction:column!important;align-items:stretch!important}&>*{flex:0 0 auto!important;width:auto!important;max-width:100%!important;align-self:stretch!important}")
    );
  }
  return classes.length ? classes.join(" ") : undefined;
}

/** A CSS string, with what could end it or the stylesheet escaped. */
const cssString = (value: string) => `"${value.replace(/[\\"\n\r<>]/g, (c) => `\\${c.charCodeAt(0).toString(16)} `)}"`;

function collectFonts(node: ResolvedNode, context: Context): void {
  const family = node.text.fontFamily;
  if (typeof family === "object" && family.src) {
    const key = `${family.name}\n${family.src}`;
    if (!context.fonts.has(key)) {
      context.fonts.set(key, `@font-face{font-family:${cssString(family.name)};src:url(${cssString(family.src)});font-display:swap}`);
    }
  }
  for (const child of node.children) if (typeof child !== "string") collectFonts(child, context);
}
