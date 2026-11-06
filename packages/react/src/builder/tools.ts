/**
 * A block as the builder's tool for it: its fields written exactly as the builder stores them (over the tool's
 * defaults, design.ts), what the tool has no field for as hidden properties, its place's spacing in its
 * `containerPadding` and its place's alignment in its `textAlign`.
 */
import { linkParts, Menu as MenuDefinition, Social as SocialDefinition, videoParts, type Json, type LinkValue, type Node, type ResolvedNode } from "@unlayer-internal/elements-core";
import { block, type Block } from "./design";
import { hiddenOf, merge } from "./hide";
import { listJson, paragraphJson, runsHtml } from "./runs";
import { intoMarkup } from "./paint";
import { withParagraphMargin } from "./text";
import { builderBorder, builderFont, builderLink, cssLineHeight, cssPx, cssSides, encode, fieldLineHeight, type Values } from "./values";

type Sides = { top: number; right: number; bottom: number; left: number };
type TextAlign = "left" | "center" | "right" | "justify";

/** What a block needs from the template it's in. */
/** What the builder's document mode does with an HTML block. */
export const NOT_IN_DOCUMENTS = "the builder's document mode keeps it but doesn't draw or export it, so what's in it isn't in the builder's PDF";

export interface Place {
  at(path: string): ResolvedNode;
  report: string[];
  put<T extends { values: Values }>(made: T, values?: Values): T;
  sayLeftOut(tool: string, node: Node, path: string, fields: readonly string[]): void;
  locked(node: Node, path: string, why: string, around: Sides): Block;
  stack(node: Node, path: string, around: Sides): Block[];
  /** The text styles a block takes from its parents that the root's don't give it. */
  textAround(path: string): Record<string, Json>;
}

const ZERO: Sides = { top: 0, right: 0, bottom: 0, left: 0 };
const add = (a: Sides, b: Partial<Sides>): Sides => ({ top: a.top + (b.top ?? 0), right: a.right + (b.right ?? 0), bottom: a.bottom + (b.bottom ?? 0), left: a.left + (b.left ?? 0) });
const padding = (node: { style?: Record<string, Json> }): Sides => (node.style?.padding as Sides | undefined) ?? ZERO;
const ALIGN: Record<string, TextAlign> = { start: "left", center: "center", end: "right", stretch: "left" };
/** Where something of its own size sits in a stack: its alignItems, else its text's alignment. */
const alignIn = (stack: ResolvedNode): TextAlign => (stack.style.alignItems ? ALIGN[String(stack.style.alignItems)] : stack.text.textAlign);
const length = (value: Json | undefined) => (value === undefined ? undefined : typeof value === "number" ? cssPx(value) : String(value));

/** A text block with a box of its own: its padding is inside the box, apart from its place's spacing. */
const TEXT_BOX = ["backgroundColor", "border", "borderRadius", "width", "maxWidth"];
const holdsImage = (node: Node): boolean => (node.children ?? []).some((child) => typeof child !== "string" && (child.type === "Image" || holdsImage(child)));
const boxed = (node: Node) => TEXT_BOX.some((key) => node.style?.[key] !== undefined);

/** A block's text styles as the builder's fields, from its node as resolved (inherited ones too). */
function textFields(own: ResolvedNode): Values {
  const text = own.text;
  return {
    fontFamily: builderFont(String(text.fontFamily)),
    fontSize: cssPx(text.fontSize),
    fontWeight: text.fontWeight,
    color: text.color,
    textAlign: text.textAlign,
    lineHeight: fieldLineHeight(text.lineHeightPx / text.fontSize),
    letterSpacing: text.letterSpacing ? cssPx(text.letterSpacing) : "0px",
  };
}

/** Phone text styles the builder has fields for, and the block's phone spacing. */
function phoneText(node: Node, containerPadding?: Sides): Values {
  const m = node.mobile ?? {};
  const out: Values = {};
  if (typeof m.fontSize === "number") out.fontSize = cssPx(m.fontSize);
  if (m.lineHeight !== undefined) out.lineHeight = typeof m.lineHeight === "number" ? fieldLineHeight(m.lineHeight) : cssLineHeight(m.lineHeight);
  if (typeof m.letterSpacing === "number") out.letterSpacing = cssPx(m.letterSpacing);
  if (typeof m.textAlign === "string") out.textAlign = m.textAlign;
  if (containerPadding) out.containerPadding = cssSides(containerPadding);
  return Object.keys(out).length ? { _override: { mobile: out } } : {};
}

/** Inherited text styles a text tool has no field for, where they aren't Elements' own defaults. */
function inheritedHidden(own: ResolvedNode): Record<string, Json> {
  return { ...(own.text.fontStyle !== "normal" ? { fontStyle: own.text.fontStyle } : {}), ...(own.text.textTransform !== "none" ? { textTransform: own.text.textTransform } : {}) };
}

const TEXT_FIELDS = ["fontFamily", "fontSize", "fontWeight", "color", "textAlign", "lineHeight", "letterSpacing"].flatMap((key) => [`style.${key}`, `mobile.${key}`]);

/** The tool a block is in the builder, with `around` its space in its column (its stack's gap, padding). */
export function blockTool(node: Node, path: string, parent: ResolvedNode, around: Sides, place: Place): Block | Block[] {
  const own = place.at(path);
  const id = meta(node.id, TOOLS[node.type]);
  const hiding = { hideOnMobile: node.hidden?.mobile || undefined, hideOnDesktop: node.hidden?.desktop || undefined };
  const lost: string[] = [];
  const said = () => {
    if (lost.length) place.report.push(`${path}: the builder's text holds no ${[...new Set(lost)].join(", ")}: left out`);
  };
  switch (node.type) {
    case "Heading":
    case "Paragraph":
    case "List": {
      if (holdsImage(node)) return place.locked(node, path, "an Image in a run of text isn't something the builder's text holds", around);
      const box = boxed(node);
      const containerPadding = box ? around : add(padding(node), around);
      const tool = node.type === "Heading" ? "heading" : "paragraph";
      place.sayLeftOut(tool, node, path, [...TEXT_FIELDS, "style.padding", "mobile.padding", "props.dir", "props.level", "props.type", "props.start", "style.gap", "style.indent"]);
      const values: Values = {
        ...textFields(own),
        containerPadding: cssSides(containerPadding),
        ...(node.type === "Heading" ? { headingType: `h${own.props.level ?? 1}` } : {}),
        ...(node.props?.dir ? { textDirection: node.props.dir } : {}),
        ...id,
      };
      const phonePadding = !box && node.mobile?.padding ? add(node.mobile.padding as Sides, around) : undefined;
      const extra = merge(phoneText(node, phonePadding), hiddenOf(tool, node, box ? [] : ["style.padding"], inheritedHidden(own)));
      if (node.type === "List") {
        // A list's indent and gap are no part of the builder's rich text: hidden properties.
        const space = { indent: cssPx(typeof node.style?.indent === "number" ? node.style.indent : 24), gap: cssPx(typeof node.style?.gap === "number" ? node.style.gap : 0) };
        const textJson = listJson(node, lost);
        said();
        return place.put(block(tool, hiding), merge(merge(values, extra), { ...space, textJson }));
      }
      const { style, values: rest } = intoMarkup(merge(values, extra));
      const written = tool === "heading" ? { text: style ? `<span style="display:block;${style.replace(/"/g, "'")}">${runsHtml(node, lost)}</span>` : runsHtml(node, lost) } : { textJson: paragraphJson(node, lost, style) };
      said();
      return place.put(block(tool, hiding), { ...rest, ...written });
    }
    case "Button": {
      const style = own.style;
      const { href, target } = linkParts(own.props.href as LinkValue);
      const color = own.text.color;
      const background = (style.backgroundColor as string | undefined) ?? "transparent";
      place.sayLeftOut("button", node, path, [...TEXT_FIELDS.filter((p) => p !== "style.textAlign" && p !== "mobile.textAlign"), "props.href", "style.backgroundColor", "hover.color", "hover.backgroundColor", "style.width", "mobile.width", "style.padding", "mobile.padding", "style.border", "style.borderRadius"]);
      const text = runsHtml(node, lost);
      said();
      // Its colors are the button's own field (buttonColors).
      const { color: _color, ...fields } = textFields(own);
      const values: Values = {
        ...fields,
        textAlign: alignIn(parent),
        href: { name: "web", values: { href: href || "#", target: target ?? "_self" } },
        buttonColors: { color, backgroundColor: background, hoverColor: (own.hover?.color as string | undefined) ?? color, hoverBackgroundColor: (own.hover?.backgroundColor as string | undefined) ?? background },
        size: style.width !== undefined ? { autoWidth: false, width: length(style.width) } : { autoWidth: true, width: "100%" },
        padding: cssSides(padding(own)),
        border: builderBorder(style.border as never),
        borderRadius: style.borderRadius !== undefined ? encode("radius", style.borderRadius) : "0px",
        containerPadding: cssSides(around),
        text,
        ...id,
      };
      // Its phone values: its text's, its padding and its width (its size there).
      const phoneBox: Values = { ...(node.mobile?.padding ? { padding: cssSides(node.mobile.padding as Sides) } : {}), ...(node.mobile?.width !== undefined ? { size: { autoWidth: false, width: length(node.mobile.width) } } : {}) };
      const phone = merge(phoneText({ ...node, mobile: { ...node.mobile, textAlign: undefined } as never }), Object.keys(phoneBox).length ? { _override: { mobile: phoneBox } } : {});
      // Its label's alignment, where it isn't a button's own (centered).
      const inner = own.style.textAlign !== undefined && own.style.textAlign !== "center" ? { buttonTextAlign: own.style.textAlign } : {};
      return place.put(block("button", hiding), merge(merge(values, phone), { ...hiddenOf("button", node, ["style.textAlign"], inheritedHidden(own)), ...inner }));
    }
    case "Image":
    case "Link": {
      // A Link holding only an Image is the builder's image with its link (`action`).
      const linked = node.type === "Link";
      const images = linked ? (node.children ?? []).filter((c): c is Node => typeof c !== "string") : [];
      if (linked && !images.some((child) => child.type === "Image")) {
        // A Link of words on its own: a text block holding it, placed where the Link sits.
        const holder: Node = { type: "Paragraph", children: [node] };
        place.sayLeftOut("paragraph", { type: "Link", style: { ...node.style, color: undefined, textDecoration: undefined } as never, props: {} }, path, ["style.flex"]);
        const textJson = paragraphJson(holder, lost, "");
        said();
        const hiddenHolder = { hideOnMobile: node.hidden?.mobile || undefined, hideOnDesktop: node.hidden?.desktop || undefined };
        return place.put(block("paragraph", hiddenHolder), { ...textFields(parent), textAlign: alignIn(parent), textJson, containerPadding: cssSides(around) });
      }
      if (linked && (images.length !== 1 || (node.children ?? []).some((c) => typeof c === "string" && c.trim()))) {
        return place.locked(node, path, "a Link around more than an Image isn't a tool of the builder's", around);
      }
      const imageNode = linked ? images[0] : node;
      const imagePath = linked ? `${path}.children[${(node.children ?? []).indexOf(imageNode)}]` : path;
      const image = place.at(imagePath);
      if (linked) {
        place.sayLeftOut("image", node, path, ["props.href"]);
        if (node.props?.title !== undefined || node.props?.["aria-label"] !== undefined) place.report.push(`${path}: the builder's image link has no title or label: left out`);
      }
      place.sayLeftOut("image", imageNode, imagePath, ["props.src", "props.alt", "style.width", "mobile.width"]);
      const src = image.props.src as string | { src: string; width?: number; height?: number };
      const parts = typeof src === "string" ? { src } : src;
      if (!parts.width && image.style.width === undefined) place.report.push(`${imagePath}: an image without its size (its src's width and height) takes its own size, and in the builder its column's width`);
      const action = linked ? builderLink(node.props!.href as LinkValue) : { name: "web", values: { href: "", target: "_blank" } };
      const values: Values = {
        src: { url: parts.src, ...(parts.width ? { width: parts.width } : {}), ...(parts.height ? { height: parts.height } : {}), ...imageWidth(image) },
        altText: String(image.props.alt ?? ""),
        action,
        textAlign: alignIn(parent),
        containerPadding: cssSides(around),
        ...meta(imageNode.id ?? node.id, "image"),
      };
      const phone = phoneImage(imageNode);
      const imageHiding = { hideOnMobile: (node.hidden?.mobile || imageNode.hidden?.mobile) || undefined, hideOnDesktop: (node.hidden?.desktop || imageNode.hidden?.desktop) || undefined };
      return place.put(block("image", imageHiding), merge(merge(values, phone ? { _override: { mobile: { src: phone } } } : {}), hiddenOf("image", imageNode)));
    }
    case "Divider": {
      const line = own.style.borderTop as Record<string, Json> | undefined;
      place.sayLeftOut("divider", node, path, ["style.borderTop", "style.width", "mobile.width", "style.padding", "mobile.padding"]);
      const values: Values = {
        border: builderBorder({ top: (line ?? { width: 1, style: "solid", color: "#bbbbbb" }) as never }),
        width: length(own.style.width) ?? "100%",
        textAlign: parent.text.textAlign,
        containerPadding: cssSides(add(padding(node), around)),
        ...id,
      };
      const phone: Values = {};
      if (node.mobile?.width !== undefined) phone.width = length(node.mobile.width);
      if (node.mobile?.padding) phone.containerPadding = cssSides(add(node.mobile.padding as Sides, around));
      return place.put(block("divider", hiding), merge(merge(values, Object.keys(phone).length ? { _override: { mobile: phone } } : {}), hiddenOf("divider", node)));
    }
    case "Menu": {
      // A Menu's own style over its definition's.
      const style = { ...(MenuDefinition.defaultStyle as Record<string, Json>), ...node.style };
      const text = own.text;
      place.sayLeftOut("menu", node, path, ["props.items", "props.separator", "props.layout", "style.color", "style.separatorColor", "style.fontFamily", "style.fontSize", "style.fontWeight", "style.letterSpacing", "style.padding", "style.justifyContent"]);
      const items = ((node.props?.items as Array<{ text: string; href: LinkValue }>) ?? []).map(({ text: words, href }, i) => ({ key: String(i + 1), text: words, link: builderLink(href) }));
      const values: Values = {
        menu: { items },
        separator: (node.props?.separator as string | undefined) ?? "",
        layout: (node.props?.layout as string | undefined) ?? "horizontal",
        linkColor: style.color,
        textColor: style.separatorColor,
        fontFamily: builderFont(String(style.fontFamily ?? text.fontFamily)),
        fontSize: cssPx(Number(style.fontSize ?? text.fontSize)),
        fontWeight: Number(style.fontWeight ?? text.fontWeight),
        letterSpacing: cssPx(Number(style.letterSpacing ?? text.letterSpacing ?? 0)),
        padding: cssSides(style.padding as Sides),
        align: ALIGN[String(style.justifyContent ?? "center")],
        containerPadding: cssSides(around),
        ...id,
      };
      return place.put(block("menu", hiding), merge(values, hiddenOf("menu", node)));
    }
    case "Social": {
      const style = { ...(SocialDefinition.defaultStyle as Record<string, Json>), ...node.style };
      place.sayLeftOut("social", node, path, ["props.icons", "props.iconType", "props.size", "style.gap", "style.justifyContent"]);
      const icons = ((node.props?.icons as Array<{ name: string; href: LinkValue }>) ?? []).map(({ name, href }) => ({ name, url: linkParts(href).href }));
      if ((node.props?.icons as Array<{ href: LinkValue }> | undefined)?.some((icon) => linkParts(icon.href).target)) place.report.push(`${path}: the builder's social icons have no target: left out`);
      const values: Values = {
        icons: { iconType: (node.props?.iconType as string | undefined) ?? "circle", icons },
        iconSize: Number(node.props?.size ?? 32),
        spacing: Number(style.gap ?? 5),
        align: ALIGN[String(style.justifyContent ?? "center")],
        containerPadding: cssSides(around),
        ...id,
      };
      return place.put(block("social", hiding), merge(values, hiddenOf("social", node)));
    }
    case "Video": {
      const url = String(node.props?.src);
      const parts = videoParts(url);
      place.sayLeftOut("video", node, path, ["props.src"]);
      const values: Values = {
        video: parts ? { type: parts.provider, videoId: parts.id, ...(parts.thumbnail ? { thumbnail: parts.thumbnail } : {}), loading: false } : { url },
        // Where a video narrower than its place sits (legacy reads it, centered by default).
        textAlign: alignIn(parent),
        containerPadding: cssSides(around),
        ...id,
      };
      return place.put(block("video", hiding), merge(values, hiddenOf("video", node)));
    }
    case "Html":
      place.sayLeftOut("html", node, path, ["props.html"]);
      if (place.at("root").type === "Document") place.report.push(`${path}: an Html block: ${NOT_IN_DOCUMENTS}`);
      return place.put(block("html", hiding), merge({ html: inText(withParagraphMargin(String(node.props?.html ?? ""), "margin-top:1em;margin-bottom:1em"), place.textAround(path)), containerPadding: cssSides(around), ...id }, hiddenOf("html", node)));
    case "PageBreak":
      return place.put(block("page_break"));
    default:
      // A plain stack (a Column without a box of its own) is its blocks, in the same column.
      if ((node.type === "Column" || node.type === "Section") && !Object.keys(node.style ?? {}).some((key) => !["padding", "gap", "alignItems", ...TEXT_STYLES].includes(key)) && !node.hidden) {
        const phone = Object.keys(node.mobile ?? {});
        if (phone.length) place.report.push(`${path}: the builder has no phone values for a plain ${node.type} (${phone.join(", ")}): left out`);
        return place.stack(node, path, around);
      }
      return place.locked(node, path, `a ${node.type} isn't a tool of the builder's`, around);
  }
}

/** The tool each block is, for its id's class (`u_content_text`). */
/** Markup in the text styles it takes from around it: the builder's HTML block has none of its own, and an edit there leaves them. */
function inText(html: string, text: Record<string, Json>): string {
  const px = (value: Json) => (typeof value === "number" ? `${value}px` : String(value));
  const css = Object.entries(text).flatMap(([key, value]): string[] => {
    if (value === undefined || value === null) return [];
    if (key === "fontSize" || key === "letterSpacing") return [`${key === "fontSize" ? "font-size" : "letter-spacing"}:${px(value)}`];
    const property = ({ color: "color", fontFamily: "font-family", fontWeight: "font-weight", fontStyle: "font-style", lineHeight: "line-height", textAlign: "text-align", textTransform: "text-transform" } as Record<string, string>)[key];
    return property ? [`${property}:${String(value).replace(/"/g, "'")}`] : [];
  });
  return css.length ? `<div style="${css.join(";")}">${html}</div>` : html;
}

const TOOLS: Record<string, string> = { Heading: "heading", Paragraph: "paragraph", List: "paragraph", Button: "button", Image: "image", Link: "image", Divider: "divider", Menu: "menu", Social: "social", Video: "video", Html: "html" };

/** An id the template gives a block, as the builder's (its element's id). */
const meta = (id: string | undefined, tool = "html"): Values => (id ? { _meta: { htmlID: id, htmlClassNames: `u_content_${tool}` } } : {});

const TEXT_STYLES = ["color", "fontFamily", "fontSize", "fontWeight", "fontStyle", "lineHeight", "letterSpacing", "textAlign", "textTransform"];

/** An image's width as the builder's: its share of its place, or as wide as its own size allows. */
function imageWidth(image: ResolvedNode): Values {
  const width = image.style.width;
  if (width === undefined) return { autoWidth: true, maxWidth: "100%" };
  if (typeof width === "string" && width.endsWith("%")) return { autoWidth: false, maxWidth: width };
  const room = image.available ?? image.width ?? 0;
  const drawn = image.width ?? 0;
  return { autoWidth: false, maxWidth: room > 0 ? `${Math.round((drawn / room) * 10000) / 100}%` : "100%" };
}

/** An image's width on phones, as the builder's phone value: its share of its place there. */
function phoneImage(node: Node): Values | undefined {
  const width = node.mobile?.width;
  if (width === undefined) return undefined;
  if (typeof width === "string" && width.endsWith("%")) return width === "100%" ? { autoWidth: true, maxWidth: "100%" } : { autoWidth: false, maxWidth: width };
  return { autoWidth: false, maxWidth: length(width) };
}
