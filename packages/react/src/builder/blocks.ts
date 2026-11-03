/**
 * Each of the builder's tools read back from its values alone, as the codemod writes today's components: its
 * component with the styles its fields give, but those equal to what it would take anyway (its defaults, what it
 * inherits from the root), and its hidden properties; a block whose spacing or alignment is its place's in a `Column`
 * around it with that padding and `alignItems`. Values are read as compat reads them (what legacy, and so the builder,
 * draws), and a tool that isn't one of Elements' is left out, and said.
 */
import { Button as ButtonDefinition, Heading as HeadingDefinition, Menu as MenuDefinition, Social as SocialDefinition, type Json, type Node } from "@unlayer-internal/elements-core";
import { ButtonDefaults, DividerDefaults, HeadingDefaults, HtmlDefaults, ImageDefaults, MenuDefaults, ParagraphDefaults, SocialDefaults, TextDefaults, VideoDefaults } from "@unlayer/exporters";
import { givenId, hidden as hiddenOn } from "../compat/lower";
import { parseRuns } from "../compat/runs";
import { ALIGN, color, fontWeight, font, letterSpacing, lineHeight as legacyLineHeight, px, sides, some, type Sides, type Values } from "../compat/values";
import { readHidden, type HiddenParts } from "./hide";
import { mergeTags, readText } from "./text";
import { readBorder } from "./values";

/** What a block is read in: the root's text styles (what a block inherits) and where to say what's left out. */
export interface Context {
  inherited: { color: string; fontFamily: string; fontWeight: number };
  document: boolean;
  say(message: string): void;
}

const ZERO: Sides = { top: 0, right: 0, bottom: 0, left: 0 };
const obj = (value: unknown): Values => (value && typeof value === "object" && !Array.isArray(value) ? (value as Values) : {});
const str = (value: unknown) => (typeof value === "string" ? value : undefined);
/** Two values the same, colors in either case ("#BBBBBB" is "#bbbbbb"). */
const same = (a: unknown, b: unknown) => JSON.stringify(a)?.toLowerCase() === JSON.stringify(b)?.toLowerCase();
/** A style set where it isn't what the node takes anyway. */
const unless = (value: Json | undefined, taken: Json | undefined) => (value === undefined || same(value, taken) ? undefined : value);
/** A line height as Elements': a percentage as the multiple it is ("150%" is 1.5), px as it is. */
const lineHeight = (value: unknown): Json | undefined => {
  const read = legacyLineHeight(value);
  return typeof read === "string" && read.endsWith("%") ? Math.round(parseFloat(read) * 100) / 10000 : read;
};
/** The builder's alignment (left, center, right) as Elements' (start, center, end); undefined for anything else. */
const alignOf = (value: unknown) => (typeof value === "string" && Object.hasOwn(ALIGN, value) ? ALIGN[value] : undefined);
const defined = (record: Record<string, Json | undefined>) => Object.fromEntries(Object.entries(record).filter(([, v]) => v !== undefined)) as Record<string, Json>;

/** A node with its parts, empty ones left out. */
function make(type: string, parts: { id?: string; props?: Record<string, Json>; style?: Record<string, Json>; mobile?: Record<string, Json>; hover?: Record<string, Json>; hidden?: { mobile?: boolean; desktop?: boolean }; children?: Node["children"] }): Node {
  const node: Node = { type };
  if (parts.id) node.id = parts.id;
  for (const key of ["props", "style", "mobile", "hover"] as const) if (parts[key] && Object.keys(parts[key]!).length) node[key] = parts[key];
  if (parts.hidden && (parts.hidden.mobile || parts.hidden.desktop)) node.hidden = defined(parts.hidden as never) as never;
  if (parts.children) node.children = parts.children;
  return node;
}

/** Whether hidden properties give a block a box of its own (its padding inside it). */
const boxOf = (hidden: HiddenParts) => ["backgroundColor", "border", "borderRadius", "width", "maxWidth", "padding"].some((key) => key in hidden.style);

/** A block in its place: a Column around it with the place's padding and alignment, where it has either. */
function placed(node: Node, padding: Sides | undefined, align: string | undefined, phonePadding: Sides | undefined, hiddenOn: Node["hidden"]): Node {
  const alignItems = align && align !== "left" ? alignOf(align) : undefined;
  const visible = !hiddenOn || (!hiddenOn.mobile && !hiddenOn.desktop);
  if (!some(padding) && !alignItems && !phonePadding) return visible ? node : { ...node, hidden: { ...node.hidden, ...hiddenOn } };
  return make("Column", { style: defined({ padding: some(padding), alignItems }), mobile: phonePadding ? { padding: phonePadding } : undefined, hidden: hiddenOn, children: [node] });
}

/** A block's text styles from its fields, those it takes anyway left out. */
function textStyle(values: Values, taken: Record<string, Json>, context: Context): Record<string, Json> {
  const size = px(values.fontSize);
  return defined({
    fontFamily: unless(font(values.fontFamily), taken.fontFamily ?? context.inherited.fontFamily),
    fontSize: unless(size, taken.fontSize ?? 16),
    fontWeight: unless(fontWeight(values.fontWeight), taken.fontWeight ?? context.inherited.fontWeight),
    color: unless(color(values.color), taken.color ?? context.inherited.color),
    lineHeight: unless(lineHeight(values.lineHeight), taken.lineHeight ?? 1.5),
    letterSpacing: unless(letterSpacing(values.letterSpacing, size) || undefined, taken.letterSpacing),
    textAlign: unless(str(values.textAlign), taken.textAlign ?? "left"),
  });
}

/** Phone values the builder has fields for (a text's size, line height, alignment, letter spacing). */
function phoneText(values: Values): Record<string, Json> {
  const m = obj(obj(values._override).mobile);
  return defined({ fontSize: px(m.fontSize), lineHeight: lineHeight(m.lineHeight), textAlign: str(m.textAlign), letterSpacing: px(m.letterSpacing) });
}

/** A text or heading tool: a Paragraph or Heading (a `<p>` with margins, or a list, each a block of its own). */
function text(tool: "text" | "heading", values: Values, context: Context): Node[] {
  const level = tool === "heading" ? Number(/^h([1-6])$/.exec(String(values.headingType ?? "h1"))?.[1] ?? 1) : undefined;
  const type = tool === "heading" ? "Heading" : "Paragraph";
  const hidden = readHidden(tool, type, values, context.say);
  const taken: Record<string, Json> = tool === "heading" ? { ...(HeadingDefinition.defaultStyle as Record<string, Json>), ...(HeadingDefinition.defaultStyleBy!.values as Record<string, Record<string, Json>>)[String(level)] } : {};
  const style = { ...textStyle(values, taken, context), ...hidden.style };
  const mobile = { ...phoneText(values), ...hidden.mobile };
  const html = typeof values.text === "string" ? values.text : "";
  const weight = fontWeight(values.fontWeight) ?? (tool === "heading" ? 700 : context.inherited.fontWeight);
  const { parts, left } = readText(html, { weight, pages: context.document });
  const containerPadding = sides(values.containerPadding ?? "10px") ?? ZERO;
  const phonePadding = sides(obj(obj(values._override).mobile).containerPadding);
  const id = givenId(values);
  const props = defined({ ...(level && level !== 1 ? { level } : {}), dir: str(values.textDirection), ...hidden.props });
  const visibility = { ...hiddenOn(values), ...hidden.hidden };
  if (left.length) {
    context.say(`its text has what a ${type} doesn't hold (${[...new Set(left)].join(", ")}): it's an Html block of its markup`);
    return [placed(make("Html", { id, props: { html: markup(html, values) } }), containerPadding, undefined, phonePadding, visibility)];
  }
  const boxed = boxOf(hidden);
  const fontSize = (style.fontSize as number | undefined) ?? (taken.fontSize as number | undefined) ?? 16;
  const nodes = parts.map((part, i) => {
    // A list takes the block's text styles; a heading's part beside one is a Paragraph in its styles.
    const own = part.node.type === "List" ? "List" : type;
    const partStyle = { ...style, ...part.node.style, ...(own === "List" && type === "Heading" ? headingAsText(taken, style) : {}) };
    // The margins between parts collapse into one: the larger, above the part below.
    const above = i === 0 ? part.margin : Math.max(part.margin, parts[i - 1].margin);
    const below = i === parts.length - 1 ? part.margin : 0;
    const space = { top: above * fontSize, bottom: below * fontSize };
    return { node: make(own, { id: i === 0 ? id : undefined, props: own === "List" ? part.node.props : props, style: partStyle, mobile, children: part.node.children }), space };
  });
  if (boxed) {
    // Its box's padding is its own; its place's spacing is a Column's around it.
    return nodes.map(({ node, space }, i) => {
      const around = { ...containerPadding, top: i === 0 ? containerPadding.top + space.top : space.top, bottom: i === nodes.length - 1 ? containerPadding.bottom + space.bottom : 0 };
      return placed(node, around, undefined, phonePadding, visibility);
    });
  }
  return nodes.map(({ node, space }, i) => {
    const padding = some({ ...containerPadding, top: (i === 0 ? containerPadding.top : 0) + space.top, bottom: (i === nodes.length - 1 ? containerPadding.bottom : 0) + space.bottom });
    return make(node.type, { ...node, style: defined({ ...node.style, padding }), mobile: defined({ ...node.mobile, padding: phonePadding }), hidden: visibility });
  });
}

/** A heading's text styles for a list in it (which has no heading defaults of its own). */
const headingAsText = (taken: Record<string, Json>, style: Record<string, Json>) => defined({ fontSize: style.fontSize ?? taken.fontSize, fontWeight: style.fontWeight ?? taken.fontWeight, lineHeight: style.lineHeight ?? taken.lineHeight });

/** A text block's markup with the styles its tool draws it in, for an Html block. */
function markup(html: string, values: Values): string {
  const css = defined({
    "font-family": font(values.fontFamily),
    "font-size": str(values.fontSize),
    "font-weight": values.fontWeight === undefined ? undefined : String(fontWeight(values.fontWeight) ?? ""),
    color: color(values.color),
    "line-height": str(values.lineHeight),
    "text-align": str(values.textAlign),
    "letter-spacing": str(values.letterSpacing),
  });
  const declarations = Object.entries(css).filter(([, v]) => v !== "").map(([k, v]) => `${k}:${String(v).replace(/"/g, "'")}`).join(";");
  return `<div style="${declarations}">${html}</div>`;
}

/** A link as Elements': its target where it's a new window, the URL alone where it opens in its own. */
function link(value: unknown): Json | undefined {
  const values = obj(obj(value).values);
  const href = str(values.href) ?? str(obj(value).url) ?? (typeof value === "string" ? value : undefined);
  if (!href) return undefined;
  return values.target === "_blank" ? { href, target: "_blank" } : href;
}

function button(values: Values, context: Context): Node[] {
  const defaults = ButtonDefinition.defaultStyle as Record<string, Json>;
  const hidden = readHidden("button", "Button", values, context.say);
  const colors = obj(values.buttonColors);
  const base = { color: color(colors.color) ?? "transparent", backgroundColor: color(colors.backgroundColor) ?? "transparent" };
  const size = obj(values.size);
  const width = size.autoWidth === false && size.width !== undefined ? (px(size.width) ?? (typeof size.width === "string" && size.width.trim().endsWith("%") ? size.width.trim() : undefined)) : undefined;
  const style = defined({
    ...textStyle({ ...values, textAlign: undefined, color: undefined }, defaults, context),
    color: unless(base.color, defaults.color),
    backgroundColor: unless(base.backgroundColor, defaults.backgroundColor),
    width,
    padding: unless(sides(values.padding ?? "10px 20px"), defaults.padding),
    border: readBorder(values.border),
    borderRadius: unless(px(values.borderRadius ?? "4px"), defaults.borderRadius),
    ...hidden.style,
  });
  const hover = defined({ color: unless(color(colors.hoverColor), base.color), backgroundColor: unless(color(colors.hoverBackgroundColor), base.backgroundColor) });
  const href = link(values.href);
  if (!href) context.say('its link is empty in the builder: it\'s "#" until one is set');
  const label = parseRuns(typeof values.text === "string" ? values.text : "", { weight: fontWeight(values.fontWeight) ?? 400, links: false, builder: true });
  if (label.left.length) context.say(`its label has what a Button doesn't hold (${[...new Set(label.left)].join(", ")}): left out`);
  const node = make("Button", { id: givenId(values), props: { href: href ?? "#", ...hidden.props }, style, mobile: { ...phoneText(values), ...phonePadding(values, "padding"), ...hidden.mobile }, hover, children: mergeTags(label.children, false) });
  return [placed(node, sides(values.containerPadding ?? "10px"), str(values.textAlign) ?? "center", sides(obj(obj(values._override).mobile).containerPadding), { ...hiddenOn(values), ...hidden.hidden })];
}

const phonePadding = (values: Values, key: string) => defined({ padding: sides(obj(obj(values._override).mobile)[key]) });

function image(values: Values, context: Context): Node[] {
  const src = obj(values.src);
  const url = str(src.url);
  if (!url) {
    context.say("an image with no URL in the builder: left out");
    return [];
  }
  const hidden = readHidden("image", "Image", values, context.say);
  const asset = typeof src.width === "number" && src.width > 0 && typeof src.height === "number" && src.height > 0 ? { src: url, width: src.width, height: src.height } : url;
  const style = defined({ ...imageWidth(src), ...hidden.style });
  const phone = obj(obj(obj(values._override).mobile).src);
  const mobile = defined({ ...(Object.keys(phone).length ? imageWidth({ ...src, ...phone }) : {}), ...hidden.mobile });
  const alt = str(values.altText) ?? "";
  const node = make("Image", { props: defined({ src: asset, ...(alt ? { alt } : {}), ...hidden.props }), style, mobile });
  const href = link(values.action);
  const linked = href ? make("Link", { props: { href }, children: [node] }) : node;
  const withId = givenId(values) ? { ...linked, id: givenId(values) } : linked;
  return [placed(withId, sides(values.containerPadding ?? "10px"), str(values.textAlign) ?? "center", sides(obj(obj(values._override).mobile).containerPadding), { ...hiddenOn(values), ...hidden.hidden })];
}

/** An image's width: none where it takes its own size, else its share of its place. */
function imageWidth(src: Values): Record<string, Json> {
  // (Without its size, the builder draws one as wide as its place, Elements at its own size: toDesign() says so.)
  if (src.autoWidth !== false) return {};
  const given = typeof src.maxWidth === "string" && src.maxWidth.trim().endsWith("%") ? src.maxWidth.trim() : px(src.maxWidth);
  return given === undefined ? {} : { width: given };
}

function divider(values: Values, context: Context): Node[] {
  const hidden = readHidden("divider", "Divider", values, context.say);
  const line = obj(values.border);
  const borderTop = { width: px(line.borderTopWidth) ?? 1, style: str(line.borderTopStyle) ?? "solid", color: str(line.borderTopColor) ?? "#BBBBBB" };
  const width = values.width === undefined || values.width === "100%" ? undefined : (px(values.width) ?? str(values.width));
  const node = make("Divider", {
    id: givenId(values),
    style: defined({ borderTop: unless(borderTop, { width: 1, style: "solid", color: "#bbbbbb" }), width, padding: some(sides(values.containerPadding ?? "10px")), ...hidden.style }),
    mobile: defined({ padding: sides(obj(obj(values._override).mobile).containerPadding), width: px(obj(obj(values._override).mobile).width), ...hidden.mobile }),
    hidden: { ...hiddenOn(values), ...hidden.hidden },
  });
  // A line shorter than its place sits where its parent's text is aligned.
  const align = str(values.textAlign) ?? "center";
  return [width !== undefined && align !== "left" ? make("Column", { style: { textAlign: align }, children: [node] }) : node];
}

function menu(values: Values, context: Context): Node[] {
  const defaults = MenuDefinition.defaultStyle as Record<string, Json>;
  const hidden = readHidden("menu", "Menu", values, context.say);
  const items = (Array.isArray(obj(values.menu).items) ? (obj(values.menu).items as unknown[]) : []).map(obj).map((item) => ({ text: str(item.text) ?? "", href: link(item.link) }));
  if (!items.length || items.some((item) => !item.href)) context.say("a menu item with no link in the builder: it's \"#\" until one is set");
  const size = px(values.fontSize ?? "14px");
  const style = defined({
    color: unless(color(values.linkColor), defaults.color),
    separatorColor: unless(color(values.textColor), defaults.separatorColor),
    fontFamily: unless(font(values.fontFamily), context.inherited.fontFamily),
    fontSize: unless(size, defaults.fontSize),
    fontWeight: unless(fontWeight(values.fontWeight), context.inherited.fontWeight),
    letterSpacing: letterSpacing(values.letterSpacing, size) || undefined,
    padding: unless(sides(values.padding ?? "5px 15px"), defaults.padding),
    justifyContent: unless(alignOf(values.align ?? "center"), defaults.justifyContent),
    ...hidden.style,
  });
  const props = defined({ items: items.map((item) => ({ text: item.text, href: item.href ?? "#" })) as Json, separator: str(values.separator) || undefined, layout: values.layout === "vertical" ? "vertical" : undefined, ...hidden.props });
  const node = make("Menu", { id: givenId(values), props, style, mobile: hidden.mobile });
  return [placed(node, sides(values.containerPadding ?? "10px"), undefined, sides(obj(obj(values._override).mobile).containerPadding), { ...hiddenOn(values), ...hidden.hidden })];
}

function social(values: Values, context: Context): Node[] {
  const defaults = SocialDefinition.defaultStyle as Record<string, Json>;
  const hidden = readHidden("social", "Social", values, context.say);
  const icons = (Array.isArray(obj(values.icons).icons) ? (obj(values.icons).icons as unknown[]) : []).map(obj).filter((icon) => str(icon.name) && /[A-Za-z0-9]/.test(String(icon.name)) && str(icon.url));
  if (!icons.length) {
    context.say("a social block with no icons in the builder: left out");
    return [];
  }
  const iconType = obj(values.icons).iconType;
  const props = defined({ icons: icons.map((icon) => ({ name: String(icon.name), href: String(icon.url) })) as Json, iconType: iconType === "rounded" || iconType === "squared" ? iconType : undefined, size: unless(px(values.iconSize), 32), ...hidden.props });
  const style = defined({ gap: unless(px(values.spacing), defaults.gap), justifyContent: unless(alignOf(values.align ?? "center"), defaults.justifyContent), ...hidden.style });
  const node = make("Social", { id: givenId(values), props, style, mobile: hidden.mobile });
  return [placed(node, sides(values.containerPadding ?? "10px"), undefined, sides(obj(obj(values._override).mobile).containerPadding), { ...hiddenOn(values), ...hidden.hidden })];
}

const VIDEO_URLS: Record<string, (id: string) => string> = { youtube: (id) => `https://www.youtube.com/watch?v=${id}`, vimeo: (id) => `https://vimeo.com/${id}` };

function video(values: Values, context: Context): Node[] {
  const value = obj(values.video);
  const url = typeof value.videoId === "string" && /^[\w-]+$/.test(value.videoId) ? (typeof value.type === "string" && Object.hasOwn(VIDEO_URLS, value.type) ? VIDEO_URLS[value.type](value.videoId) : undefined) : str(value.url);
  if (!url) {
    context.say("a video with no YouTube or Vimeo URL in the builder: left out");
    return [];
  }
  const hidden = readHidden("video", "Video", values, context.say);
  const node = make("Video", { id: givenId(values), props: { src: url, ...hidden.props }, style: hidden.style, mobile: hidden.mobile });
  return [placed(node, sides(values.containerPadding ?? "10px"), str(values.textAlign) ?? "center", sides(obj(obj(values._override).mobile).containerPadding), { ...hiddenOn(values), ...hidden.hidden })];
}

function html(values: Values, context: Context): Node[] {
  const hidden = readHidden("html", "Html", values, context.say);
  const node = make("Html", { id: givenId(values), props: { html: typeof values.html === "string" ? values.html : "", ...hidden.props } });
  return [placed(node, sides(values.containerPadding ?? "10px"), undefined, sides(obj(obj(values._override).mobile).containerPadding), { ...hiddenOn(values), ...hidden.hidden })];
}

/** Each tool's reader. */
const READERS = new Map<string, (values: Values, context: Context) => Node[]>([
  ["text", (values, context) => text("text", values, context)],
  ["paragraph", (values, context) => text("text", values, context)],
  ["heading", (values, context) => text("heading", values, context)],
  ["button", button],
  ["image", image],
  ["divider", divider],
  ["menu", menu],
  ["social", social],
  ["video", video],
  ["html", html],
]);

/** Each tool's defaults, which the builder gives a value its item doesn't have. */
const DEFAULTS = new Map<string, Values>([
  ["text", TextDefaults],
  ["paragraph", ParagraphDefaults],
  ["heading", HeadingDefaults],
  ["button", ButtonDefaults],
  ["image", ImageDefaults],
  ["divider", DividerDefaults],
  ["menu", MenuDefaults],
  ["social", SocialDefaults],
  ["video", VideoDefaults],
  ["html", HtmlDefaults],
]);

/** A builder block as nodes: its component, in a Column for its place where it needs one; none for a tool Elements has no component for. */
export function readBlock(type: unknown, values: Values, context: Context): Node[] {
  const read = typeof type === "string" ? READERS.get(type) : undefined;
  if (!read) {
    context.say(`a ${typeof type === "string" ? type : "block"} of the builder's has no component in Elements: left out`);
    return [];
  }
  return read({ ...DEFAULTS.get(type as string), ...values }, context);
}
