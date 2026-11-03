/**
 * Each of the builder's tools read back from its values alone, as the codemod writes today's components: its
 * component with the styles its fields give, but those equal to what it would take anyway (its defaults, what it
 * inherits from the root), and its hidden properties; a block whose spacing or alignment is its place's in a `Column`
 * around it with that padding and `alignItems`. Values are read as compat reads them (what legacy, and so the builder,
 * draws), and a tool that isn't one of Elements' is left out, and said.
 */
import { Button as ButtonDefinition, Menu as MenuDefinition, Social as SocialDefinition, type Json, type Node } from "@unlayer-internal/elements-core";
import { ButtonDefaults, DividerDefaults, HeadingDefaults, HtmlDefaults, ImageDefaults, MenuDefaults, ParagraphDefaults, SocialDefaults, TextDefaults, VideoDefaults } from "@unlayer/exporters";
import { givenId, hidden as hiddenOn } from "../compat/lower";
import { parseRuns } from "../compat/runs";
import { color, fontWeight, font, letterSpacing, px, serviceTag, sides, some, webLink, type Values } from "../compat/values";
import { contentSlotWidth } from "../utils/image-sizing";
import { readHidden } from "./hide";
import { alignOf, defined, make, obj, phoneText, placed, str, textStyle, unless, type Context, type Slot } from "./reading";
import { mergeTags, richText } from "./text";
import { textTool } from "./text-tool";
import { readBorder } from "./values";

export type { Context, Slot };

/**
 * A link as Elements', read as compat reads today's (every shape today's writers read: a URL, the builder's
 * `{ name, values, attrs }`, an email's or a phone's link with its URL in `attrs`, `{ url, target }`): its target
 * where it says a new window, the URL alone otherwise. None where it has no URL; where it holds what a link here
 * can't (a class, attributes of its own, a click handler, another target), that's said and it's left out.
 */
function link(value: unknown, say: (message: string) => void, what = "its link"): Json | undefined {
  const read = webLink(value);
  if (read === undefined) say(`${what} ${JSON.stringify(value) ?? String(typeof value)} holds what a link in Elements can't (a class, attributes or a target of its own, a click handler): left out`);
  if (!read) return undefined;
  const href = typeof read === "string" ? read : String((read as { href: unknown }).href);
  const given = obj(value);
  const target = str(obj(given.values).target) || str(obj(given.attrs).target) || ("url" in given ? str(given.target) : undefined);
  return target === "_blank" ? { href, target: "_blank" } : href;
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
  const href = link(values.href, context.say);
  if (!href && webLink(values.href) === null) context.say('its link is empty in the builder: it\'s "#" until one is set');
  const label = parseRuns(richText(values, true, str(values.textDirection) ?? context.dir), { weight: fontWeight(values.fontWeight) ?? 400, links: false, builder: true });
  if (label.left.length) context.say(`its label has what a Button doesn't hold (${[...new Set(label.left)].join(", ")}): left out`);
  tagged(richText(values, true, str(values.textDirection) ?? context.dir), "its label", context.say);
  const node = make("Button", { id: givenId(values), props: { href: href ?? "#", ...hidden.props }, style, mobile: { ...phoneText(values), ...phonePadding(values, "padding"), ...hidden.mobile }, hover, children: mergeTags(label.children, false) });
  return [placed(node, sides(values.containerPadding ?? "10px"), str(values.textAlign) ?? "center", sides(obj(obj(values._override).mobile).containerPadding), { ...hiddenOn(values), ...hidden.hidden })];
}

/** Says where text holds an email service's tag (<%name%>, {% if %}), which Elements writes escaped: the service can't fill it in. */
function tagged(text: string, what: string, say: (message: string) => void): void {
  if (serviceTag(text)) say(`${what} has an email service's tag, which today's writers keep as written and Elements writes escaped: the service won't fill it in`);
}

const phonePadding = (values: Values, key: string) => defined({ padding: sides(obj(obj(values._override).mobile)[key]) });

function image(values: Values, context: Context, slot?: Slot): Node[] {
  const src = obj(values.src);
  const url = str(src.url);
  if (!url) {
    context.say("an image with no URL in the builder: left out");
    return [];
  }
  const hidden = readHidden("image", "Image", values, context.say);
  const asset = typeof src.width === "number" && src.width > 0 && typeof src.height === "number" && src.height > 0 ? { src: url, width: src.width, height: src.height } : url;
  const style = defined({ ...imageWidth(src), ...phoneCap(src, values, slot), ...hidden.style });
  const phone = obj(obj(obj(values._override).mobile).src);
  const mobile = defined({ ...(Object.keys(phone).length ? imageWidth({ ...src, ...phone }) : {}), ...hidden.mobile });
  const alt = str(values.altText) ?? "";
  const node = make("Image", { props: defined({ src: asset, ...(alt ? { alt } : {}), ...hidden.props }), style, mobile });
  const href = link(values.action, context.say);
  const linked = href ? make("Link", { props: { href }, children: [node] }) : node;
  const withId = givenId(values) ? { ...linked, id: givenId(values) } : linked;
  return [placed(withId, sides(values.containerPadding ?? "10px"), str(values.textAlign) ?? "center", sides(obj(obj(values._override).mobile).containerPadding), { ...hiddenOn(values), ...hidden.hidden })];
}

/**
 * Where a row's columns stack, today's image writer keeps an image with a share of its place no wider on phones than
 * that share of its place on desktop (its maximum is in px): the template's maximum, so it's no wider there either.
 */
function phoneCap(src: Values, values: Values, slot: Slot | undefined): Record<string, Json> {
  const share = typeof src.maxWidth === "string" && /^\s*\d*\.?\d+%\s*$/.test(src.maxWidth) ? parseFloat(src.maxWidth) : undefined;
  if (src.autoWidth !== false || share === undefined || !slot || slot.cells.length < 2 || !slot.stacks) return {};
  const border = obj(values.imageBorder);
  const borders = (px(border.borderLeftWidth) ?? 0) + (px(border.borderRightWidth) ?? 0);
  const room = contentSlotWidth({ bodyValues: slot.body, rowValues: slot.row, rowCells: slot.cells, columnIndex: slot.index, columnValues: slot.column, containerPadding: values.containerPadding ?? "10px" }) - borders;
  return room > 0 ? { maxWidth: Math.round(((room * share) / 100) * 100) / 100 } : {};
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
  const items = (Array.isArray(obj(values.menu).items) ? (obj(values.menu).items as unknown[]) : []).map(obj).map((item, i) => ({ text: str(item.text) ?? "", href: link(item.link, context.say, `its item ${i + 1}'s link`), empty: webLink(item.link) === null }));
  if (!items.length || items.some((item) => item.empty)) context.say("a menu item with no link in the builder: it's \"#\" until one is set");
  for (const item of items) tagged(item.text, "a menu item's text", context.say);
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
const READERS = new Map<string, (values: Values, context: Context, slot?: Slot) => Node[]>([
  ["text", (values, context) => textTool("text", values, context)],
  ["paragraph", (values, context) => textTool("text", values, context)],
  ["heading", (values, context) => textTool("heading", values, context)],
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
export function readBlock(type: unknown, values: Values, context: Context, slot?: Slot): Node[] {
  const read = typeof type === "string" ? READERS.get(type) : undefined;
  if (!read) {
    context.say(`a ${typeof type === "string" ? type : "block"} of the builder's has no component in Elements: left out`);
    return [];
  }
  return read({ ...DEFAULTS.get(type as string), ...values }, context, slot);
}
