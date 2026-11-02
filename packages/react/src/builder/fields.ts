/**
 * The builder's values a template is written with, each with the way back: what a change to it in the builder does to
 * the Elements node. `toDesign()` writes them (through `raise`); `fromDesign()` reads back the ones that changed, and
 * keeps the rest of the node (what the builder has no editor for) as it was.
 *
 * A value that's the sum of the node's own and its place (a block's spacing is its padding and its stack's gap) moves
 * the node's own by the change. A change the node can't hold (a block's own alignment, which a stack sets) is said.
 */
import type { Json, Node } from "@unlayer-internal/elements-core";
import { parseRuns } from "./runs";

export interface Change {
  node: Node;
  /** The value in the builder now, and the one written (undefined for a block made in the builder). */
  now: any;
  was: any;
  /** Says what the builder changed that the template can't hold. */
  say(message: string): void;
}

type Setter = (change: Change) => void;
type Sides = { top: number; right: number; bottom: number; left: number };

const ZERO: Sides = { top: 0, right: 0, bottom: 0, left: 0 };
const num = (value: unknown) => (typeof value === "number" ? value : typeof value === "string" ? parseFloat(value) : NaN);
const sides = (css: unknown): Sides => {
  const [top = 0, right = top, bottom = top, left = right] = String(css ?? "0px").trim().split(/\s+/).map((part) => parseFloat(part) || 0);
  return { top, right, bottom, left };
};
const same = (a: Sides, b: Sides) => a.top === b.top && a.right === b.right && a.bottom === b.bottom && a.left === b.left;

function setStyle(node: Node, key: string, value: Json | undefined) {
  const style = { ...node.style };
  if (value === undefined || value === "" || (typeof value === "number" && Number.isNaN(value))) delete style[key];
  else style[key] = value;
  node.style = style;
}

function setProp(node: Node, key: string, value: Json | undefined) {
  const props = { ...node.props };
  if (value === undefined || value === "") delete props[key];
  else props[key] = value;
  node.props = props;
}

const style = (key: string, read: (now: any) => Json | undefined = (now) => now): Setter => ({ node, now }) => setStyle(node, key, read(now));
const pxStyle = (key: string) => style(key, (now) => num(now));

/** Padding moved by the change in the builder's value (it holds the padding and the place's spacing). */
const paddingBy: Setter = ({ node, now, was }) => {
  const before = was === undefined ? ZERO : sides(was);
  const after = sides(now);
  const own = (node.style?.padding as Sides | undefined) ?? ZERO;
  const moved = { top: own.top + after.top - before.top, right: own.right + after.right - before.right, bottom: own.bottom + after.bottom - before.bottom, left: own.left + after.left - before.left };
  const clamped = { top: Math.max(0, moved.top), right: Math.max(0, moved.right), bottom: Math.max(0, moved.bottom), left: Math.max(0, moved.left) };
  setStyle(node, "padding", same(clamped, ZERO) && !node.style?.padding ? undefined : clamped);
};

/** Padding set to the builder's value (a button's own). */
const paddingTo: Setter = ({ node, now }) => setStyle(node, "padding", sides(now));

/** A border, side by side as the builder writes it (`borderTopWidth`, …), as Elements' border. */
function lines(border: Record<string, string> | undefined): Json | undefined {
  const out: Record<string, Json> = {};
  for (const side of ["Top", "Right", "Bottom", "Left"]) {
    const width = border?.[`border${side}Width`];
    if (width === undefined) continue;
    out[side.toLowerCase()] = { width: num(width), style: border?.[`border${side}Style`] ?? "solid", color: border?.[`border${side}Color`] ?? "#000000" };
  }
  return Object.keys(out).length ? out : undefined;
}

const text: Setter = ({ node, now, say }) => {
  const { children, left } = parseRuns(String(now ?? ""));
  node.children = children;
  if (left.length) say(`its text has markup a text block doesn't hold, left out: ${[...new Set(left)].join(", ")}`);
};

const placedByStack =
  (what: string): Setter =>
  ({ was, say }) => {
    if (was !== undefined) say(`its ${what} changed in the builder; in Elements a block's place is set by what it's in`);
  };

const textStyle: Record<string, Setter> = {
  fontFamily: style("fontFamily", (now) => now?.value),
  fontSize: pxStyle("fontSize"),
  fontWeight: style("fontWeight", (now) => num(now)),
  color: style("color"),
  lineHeight: style("lineHeight", (now) => (String(now).endsWith("%") ? Math.round(num(now)) / 100 : now)),
  letterSpacing: pxStyle("letterSpacing"),
  textTransform: style("textTransform"),
};

/** Shown on phones, or on desktop. */
const hidden =
  (device: "mobile" | "desktop"): Setter =>
  ({ node, now }) => {
    const out = { ...node.hidden, [device]: now === true || undefined };
    if (!out[device]) delete out[device];
    node.hidden = Object.keys(out).length ? out : undefined;
    if (!node.hidden) delete node.hidden;
  };

/** Values under `_override.mobile` (the builder's phone values): hiding on phones, and what's said. */
const phone: Setter = (change) => {
  const now = change.now?.mobile ?? {};
  const was = change.was?.mobile ?? {};
  if (now.hideMobile !== was.hideMobile) hidden("mobile")({ ...change, now: now.hideMobile, was: was.hideMobile });
  const other = Object.keys({ ...now, ...was }).filter((key) => key !== "hideMobile" && JSON.stringify(now[key]) !== JSON.stringify(was[key]));
  if (other.length) change.say(`its phone values changed in the builder (${other.join(", ")}): set them in the template's mobile styles`);
};

const common: Record<string, Setter> = { hideDesktop: hidden("desktop"), _override: phone };

const videoUrl = (video: { type?: string; videoId?: string; url?: string } | undefined) => {
  if (!video?.videoId) return video?.url;
  return video.type === "vimeo" ? `https://vimeo.com/${video.videoId}` : `https://www.youtube.com/watch?v=${video.videoId}`;
};

/** The builder's values that come from a template, by the item they're on (a tool's type for a block). */
export const FIELDS: Record<string, Record<string, Setter>> = {
  body: {
    contentWidth: ({ node, now, was, say }) => {
      if (node.type !== "Document") setProp(node, "width", num(now));
      else if (was !== undefined) say("its content width changed in the builder: a Document's is its page's, less its margins");
    },
    backgroundColor: style("backgroundColor"),
    textColor: style("color"),
    fontFamily: style("fontFamily", (now) => now?.value),
    preheaderText: ({ node, now }) => {
      if (node.type === "Email") setProp(node, "previewText", now);
    },
    documentSize: ({ node, now }) => setProp(node, "size", now === "A4" ? undefined : now),
    documentOrientation: ({ node, now }) => setProp(node, "orientation", now === "portrait" ? undefined : now),
    // One margin for every side: a number of px, or the builder's preset for the size ("auto").
    documentMargin: ({ node, now }) => {
      const preset = (node.props?.size ?? "A4") === "A5" ? 48 : 96;
      const margin = now === "auto" ? preset : num(now);
      setProp(node, "margin", Number.isNaN(margin) ? undefined : { top: margin, right: margin, bottom: margin, left: margin });
    },
  },
  row: {
    padding: ({ node, now, was }) => {
      const before = sides(was);
      const after = sides(now);
      const own = (node.style?.padding as Sides | undefined) ?? ZERO;
      setStyle(node, "padding", { ...own, top: Math.max(0, own.top + after.top - before.top), bottom: Math.max(0, own.bottom + after.bottom - before.bottom) });
    },
    columnsBackgroundColor: style("backgroundColor"),
    noStackMobile: ({ node, now }) => setProp(node, "stackOnMobile", now === true ? false : undefined),
    ...common,
  },
  /** A Section's band: the background of each of its rows. */
  section: { backgroundColor: style("backgroundColor") },
  column: {
    padding: paddingBy,
    backgroundColor: style("backgroundColor"),
    border: style("border", (now) => lines(now)),
    borderRadius: pxStyle("borderRadius"),
    ...common,
  },
  heading: {
    text,
    headingType: ({ node, now }) => setProp(node, "level", Number(String(now).replace(/\D/g, "")) || 1),
    ...textStyle,
    textAlign: style("textAlign"),
    containerPadding: paddingBy,
    ...common,
  },
  text: { text, ...textStyle, textAlign: style("textAlign"), containerPadding: paddingBy, ...common },
  button: {
    text,
    ...textStyle,
    href: ({ node, now }) => setProp(node, "href", now?.values?.href ?? ""),
    buttonColors: ({ node, now, was }) => {
      if (now?.color !== was?.color) setStyle(node, "color", now?.color);
      if (now?.backgroundColor !== was?.backgroundColor) setStyle(node, "backgroundColor", now?.backgroundColor);
      const hover = { ...node.hover };
      if (now?.hoverColor !== was?.hoverColor) hover.color = now?.hoverColor;
      if (now?.hoverBackgroundColor !== was?.hoverBackgroundColor) hover.backgroundColor = now?.hoverBackgroundColor;
      for (const key of Object.keys(hover)) if (hover[key] === undefined) delete hover[key];
      node.hover = Object.keys(hover).length ? hover : undefined;
      if (!node.hover) delete node.hover;
    },
    size: ({ node, now }) => setStyle(node, "width", now?.autoWidth === false && now?.width ? (String(now.width).endsWith("%") ? now.width : num(now.width)) : undefined),
    padding: paddingTo,
    border: style("border", (now) => lines(now)),
    borderRadius: pxStyle("borderRadius"),
    textAlign: placedByStack("alignment"),
    containerPadding: placedByStack("spacing"),
    ...common,
  },
  image: {
    src: ({ node, now, was }) => {
      if (now?.url !== was?.url || now?.width !== was?.width || now?.height !== was?.height) {
        setProp(node, "src", now?.width && now?.height ? { src: now.url, width: now.width, height: now.height } : now?.url);
      }
      if (now?.autoWidth !== was?.autoWidth || now?.maxWidth !== was?.maxWidth) setStyle(node, "width", now?.autoWidth ? "100%" : now?.maxWidth);
    },
    altText: ({ node, now }) => setProp(node, "alt", now ?? ""),
    textAlign: placedByStack("alignment"),
    containerPadding: placedByStack("spacing"),
    ...common,
  },
  divider: {
    border: style("borderTop", (now) => (now?.borderTopWidth ? { width: num(now.borderTopWidth), style: now.borderTopStyle ?? "solid", color: now.borderTopColor ?? "#bbbbbb" } : undefined)),
    width: style("width", (now) => (String(now).endsWith("%") ? now : num(now))),
    textAlign: placedByStack("alignment"),
    containerPadding: paddingBy,
    ...common,
  },
  menu: {
    menu: ({ node, now }) => setProp(node, "items", (now?.items ?? []).map((item: any) => ({ text: String(item.text ?? ""), href: String(item.link?.values?.href ?? "") }))),
    separator: ({ node, now }) => setProp(node, "separator", now),
    layout: ({ node, now }) => setProp(node, "layout", now === "horizontal" ? undefined : now),
    linkColor: style("color"),
    textColor: style("separatorColor"),
    fontFamily: textStyle.fontFamily,
    fontSize: textStyle.fontSize,
    padding: paddingTo,
    align: style("justifyContent", (now) => ({ left: "start", center: "center", right: "end" })[String(now)]),
    containerPadding: placedByStack("spacing"),
    ...common,
  },
  social: {
    icons: ({ node, now }) => {
      setProp(node, "icons", (now?.icons ?? []).map((icon: any) => ({ name: String(icon.name), href: String(icon.url ?? "") })));
      setProp(node, "iconType", now?.iconType === "circle" ? undefined : now?.iconType);
    },
    iconSize: ({ node, now }) => setProp(node, "size", num(now) === 32 ? undefined : num(now)),
    spacing: pxStyle("gap"),
    align: style("justifyContent", (now) => ({ left: "start", center: "center", right: "end" })[String(now)]),
    containerPadding: placedByStack("spacing"),
    ...common,
  },
  video: {
    video: ({ node, now }) => setProp(node, "src", videoUrl(now)),
    containerPadding: placedByStack("spacing"),
    ...common,
  },
  /** A page break has nothing of a template's but its place. */
  page_break: { containerPadding: () => undefined },
  html: {
    html: ({ say }) => say("its HTML changed in the builder, which a block of the template's own markup doesn't take back"),
    containerPadding: placedByStack("spacing"),
    ...common,
  },
};

/** The Elements type a block made in the builder is, by its tool. */
export const NEW_BLOCK: Record<string, string> = { heading: "Heading", text: "Paragraph", button: "Button", image: "Image", divider: "Divider", menu: "Menu", social: "Social", video: "Video", page_break: "PageBreak" };

const TEXT_EDITED = ["style.fontFamily", "style.fontSize", "style.fontWeight", "style.color", "style.lineHeight", "style.letterSpacing", "style.textTransform", "style.textAlign", "style.padding"];

/** What of each component the builder has an editor for, as `props.x`, `style.x` or `hover.x`. */
const EDITED: Record<string, string[]> = {
  Email: ["props.width", "props.previewText", "style.backgroundColor", "style.color", "style.fontFamily"],
  Document: ["props.size", "props.orientation", "props.margin", "style.backgroundColor", "style.color", "style.fontFamily"],
  Page: ["props.width", "style.backgroundColor", "style.color", "style.fontFamily"],
  Section: ["style.backgroundColor", "style.padding", "style.gap"],
  // A Row's border is its columns' in the builder; on phones, theirs.
  Row: ["style.padding", "style.backgroundColor", "style.gap", "style.border", "props.stackOnMobile", "mobile.gap", "mobile.border"],
  Column: ["style.padding", "style.backgroundColor", "style.border", "style.borderRadius", "style.width", "mobile.border"],
  Heading: ["props.level", ...TEXT_EDITED],
  Paragraph: TEXT_EDITED,
  Text: TEXT_EDITED,
  Button: ["props.href", ...TEXT_EDITED, "style.backgroundColor", "style.width", "style.border", "style.borderRadius", "hover.color", "hover.backgroundColor"],
  Image: ["props.src", "props.alt", "style.width", "style.maxWidth"],
  Divider: ["style.borderTop", "style.width", "style.padding"],
  Menu: ["props.items", "props.separator", "props.layout", "style.color", "style.separatorColor", "style.fontFamily", "style.fontSize", "style.padding", "style.justifyContent"],
  Social: ["props.icons", "props.iconType", "props.size", "style.gap", "style.justifyContent"],
  Video: ["props.src"],
};

/** What of a node the builder keeps without an editor for it (it comes back from the design), as `style.x` and so on. */
export function kept(node: { type: string; props?: object; style?: object; mobile?: object; hover?: object }): string[] {
  const edited = new Set(EDITED[node.type] ?? []);
  const out: string[] = [];
  for (const part of ["props", "style", "mobile", "hover"] as const) {
    for (const key of Object.keys(node[part] ?? {})) if (!edited.has(`${part}.${key}`)) out.push(`${part}.${key}`);
  }
  return out;
}
