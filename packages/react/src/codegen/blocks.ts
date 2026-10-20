/**
 * A design's content blocks as Elements components: each type's own props first (text, links, images, menu items,
 * icons, table data, a video), then its other values (see props.ts) and device settings (see device.ts).
 */
import { generateHtmlFromTextJson } from "@unlayer-internal/shared-elements";
import { BLOCK_BASE, BLOCK_DEFAULTS, COMPONENT_OF_TYPE } from "./defaults";
import { placeDevice } from "./device";
import { attributes, lostThroughValues, placeValues, Props, withoutMeta } from "./props";
import type { JsxChild } from "./print";
import { withoutRestoredUrl } from "./fonts";
import { blockHtml, plainText } from "./text";
import { contentSlotWidth, pinImageSrc, toPx, type SlotContext } from "../utils/image-sizing";
import { deepEqual, isPlainObject, omit, type Plain } from "./values";
import type { ModuleState } from "./state";
import { dropFixedFlags, warnLost } from "./warnings";
import { editorLink, READ_BACK } from "./links";

export interface BlockContext {
  /** "Row 2, column 1, block 3": where the block is, for warnings. */
  where: string;
  state: ModuleState;
  /** The body's text color, which a text block without its own shows. */
  textColor?: string;
  /** A right-to-left design: a text block without an alignment starts on the right. */
  rtl: boolean;
  /** The block's place (its body, row, cells and column), for an image's width in px. */
  slot: Omit<SlotContext, "containerPadding">;
}

/** Text styles every text block takes as props. */
const TEXT = ["color", "fontFamily", "fontSize", "fontWeight", "letterSpacing", "lineHeight", "textAlign", "linkStyle"];

/** The design keys each component has a flat prop for (beside the ones its own handler writes). */
const TYPED: Record<string, ReadonlySet<string>> = {
  Paragraph: new Set([...TEXT, "containerPadding"]),
  Heading: new Set([...TEXT, "headingType", "containerPadding"]),
  Button: new Set(["buttonColors", "size", "fontFamily", "fontSize", "fontWeight", "letterSpacing", "lineHeight", "textAlign", "padding", "border", "borderRadius", "containerPadding"]),
  Image: new Set(["altText", "action", "textAlign", "containerPadding"]),
  Divider: new Set(["width", "border", "textAlign", "containerPadding"]),
  Html: new Set(["containerPadding"]),
  Menu: new Set(["menu", "fontFamily", "fontSize", "fontWeight", "letterSpacing", "textColor", "linkColor", "align", "layout", "separator", "padding", "containerPadding"]),
  Social: new Set(["align", "iconSize", "spacing", "containerPadding"]),
  // (Only what Table's defaults have: it says it ignores other props, such as `headerColor`, which go in `values`.)
  Table: new Set([
    "border", "stripedRows", "stripedRowsBackgroundColor", "enableHeader", "repeatHeaderOnEachPage", "headerBackgroundColor", "headerFontWeight",
    "headerFontSize", "headerTextAlign", "headerVerticalAlign", "headerPadding", "contentBackgroundColor", "contentFontSize", "contentTextAlign",
    "contentVerticalAlign", "contentLineHeight", "contentPadding", "enableFooter", "repeatFooterOnEachPage", "footerBackgroundColor",
    "footerFontWeight", "footerFontSize", "footerTextAlign", "footerVerticalAlign", "footerPadding", "linkStyle", "containerPadding",
  ]),
  Video: new Set(["containerPadding"]),
  PageBreak: new Set(["color", "containerPadding"]),
};

/** Groups whose changed keys read as flat props. */
const FLATTEN: Record<string, ReadonlySet<string>> = {
  Button: new Set(["buttonColors"]),
  Divider: new Set(["border"]),
};

/** Keys every block has in the builder that no prop sets: kept in `values` when they're not the builder's default. */
const BUILDER_ONLY: Plain = { anchor: "", hideDesktop: false, displayCondition: null, _styleGuide: null, locked: false };

const TEXT_TYPES = new Set(["text", "paragraph", "heading"]);

/** A design block as an element, or a comment where Elements has no component for it. */
export function convertBlock(content: Plain, ctx: BlockContext): JsxChild {
  const type = String(content.type ?? "");
  const component = COMPONENT_OF_TYPE[type];
  if (!component) return withoutComponent(content, type, ctx);
  ctx.state.use(component);

  const props = new Props(component);
  let rest: Plain = isPlainObject(content.values) ? { ...content.values } : {};
  rest = base(rest, props, ctx);

  // The editor's Lexical text (a "paragraph" block, or a text block with only its Lexical JSON): Elements writes a
  // `text` block holding its HTML.
  if ((type === "paragraph" || type === "text") && typeof rest.text !== "string" && typeof rest.textJson === "string") rest.text = generateHtmlFromTextJson(rest.textJson);
  if (type === "paragraph") ctx.state.warn(`${ctx.where}: a "paragraph" block (the editor's Lexical text) becomes a Paragraph, a "text" block with the same HTML.`);
  // `text` is what the builder shows and exports where a block has both.
  if (typeof rest.text === "string") delete rest.textJson;
  // A web font's URL, where its <Font> gives it back (see fonts.ts).
  if (rest.fontFamily !== undefined) rest.fontFamily = withoutRestoredUrl(rest.fontFamily, ctx.state);
  // Without a color of its own, a text block shows the body's: Elements writes a color, so it's that one.
  if (TEXT_TYPES.has(type) && rest.color === undefined && ctx.textColor !== undefined) rest.color = ctx.textColor;

  const defaults: Plain = { ...BLOCK_BASE, ...BLOCK_DEFAULTS[component] };
  // In a right-to-left design Elements aligns a text block that sets no alignment right, where the builder shows
  // it as its default (left): so it's written.
  if (ctx.rtl && defaults.textAlign === "left") {
    defaults.textAlign = "right";
    rest.textAlign ??= "left";
  }
  rest = OWN_PROPS[component]?.(rest, props, defaults, ctx) ?? rest;

  const override = rest._override;
  placeValues(omit(rest, ["_override"]), defaults, props, { typed: TYPED[component], flatten: FLATTEN[component], last: ["containerPadding"] });
  placeDevice(override, props, defaults, "block");
  warnLost(lostThroughValues(props.values, defaults, component), ctx.where, ctx.state);

  return { tag: component, attrs: attributes(props, ctx.state.types), children: props.text !== undefined ? [{ text: props.text }] : [] };
}


/** The keys every block has: its ids (left out), the builder's flags and settings no prop sets. */
function base(values: Plain, props: Props, ctx: BlockContext): Plain {
  const rest = withoutMeta(values, props);
  dropFixedFlags(rest, ctx.where, ctx.state);
  for (const [key, value] of Object.entries(BUILDER_ONLY)) {
    if (key in rest && !deepEqual(rest[key], value)) props.values[key] = rest[key];
    delete rest[key];
  }
  return rest;
}

type OwnProps = (rest: Plain, props: Props, defaults: Plain, ctx: BlockContext) => Plain;

/**
 * A Heading's or Button's text as children where it's plain, else in `text` (HTML); a Paragraph's in `html`, always:
 * a Paragraph's children render as the editor's rich text (in a `<p>`), where the design's text renders as it is.
 */
function textProp(prop: "html" | "text"): OwnProps {
  return (rest, props, defaults) => {
    const { text, ...others } = rest;
    if (typeof text !== "string" || (prop === "text" && text === defaults.text)) return others;
    const plain = prop === "text" ? plainText(text) : undefined;
    if (plain !== undefined) props.text = plain;
    // A Paragraph's empty text is `values.text` (its `html` prop takes none).
    else if (text === "" && prop === "html") props.values.text = "";
    else props.add(prop, text);
    return others;
  };
}

interface Link {
  href: string;
  target: string;
}

/**
 * A link as Elements' components take it: the URL the editor exports for it (an email's `mailto:…`, see links.ts) and
 * where it opens. Undefined where it has more than a URL holds (code it runs, a class), which is said: it's written
 * as the design has it. A link the builder doesn't read back from its URL (a page section's) is said too.
 */
function linkOf(link: unknown, ctx: BlockContext, whose = "its"): Link | undefined {
  const exported = editorLink(link);
  if (!exported) return undefined;
  const action = isPlainObject(link) && typeof link.name === "string" ? link.name : undefined;
  const name = action !== undefined ? `"${action}" link` : "link";
  if ("lost" in exported) {
    ctx.state.warn(`${ctx.where}: ${whose} ${name} has ${exported.lost.map((key) => `\`${key}\``).join(" and ")}, which a URL can't hold, so it's written as the design has it (Elements' HTML doesn't write ${exported.lost.length > 1 ? "them" : "it"} as the builder does).`);
    return undefined;
  }
  if (!exported.kept) ctx.state.warn(`${ctx.where}: ${whose} ${name} is written as the URL the builder exports for it (${exported.url ? `\`${exported.url}\`` : "none"}), which the builder opens as ${action !== undefined && READ_BACK.has(action) ? `its own ${name}` : "a web link"}.`);
  return { href: exported.url, target: exported.target };
}

/** No link: the builder's empty one. */
const noLink = (link: Link) => link.href === "" && link.target === "_blank";

/** A link in the shape the design keeps it: a web link to its URL. */
const webLink = (link: Link) => ({ name: "web", values: { href: link.href, target: link.target } });

const OWN_PROPS: Record<string, OwnProps> = {
  Paragraph: textProp("html"),

  Heading: (rest, props, defaults, ctx) => {
    const { headingType, ...others } = rest;
    if (headingType !== undefined && headingType !== defaults.headingType && /^h[1-6]$/.test(String(headingType))) props.add("headingType", headingType);
    else if (headingType !== undefined) others.headingType = headingType;
    return textProp("text")(others, props, defaults, ctx);
  },

  Button: (rest, props, defaults, ctx) => {
    const { href, ...others } = textProp("text")(rest, props, defaults, ctx);
    if (href !== undefined && !deepEqual(href, defaults.href)) {
      const link = linkOf(href, ctx);
      if (!link) props.add("href", href);
      else if (!noLink(link)) {
        props.add("href", link.href);
        if (link.target !== "_blank") props.add("target", link.target);
      }
    }
    // A fixed width is `width`; other sizes whole (Button reads a `size` with a width and no `autoWidth` as fixed).
    const { size } = others;
    if (size !== undefined && !deepEqual(size, defaults.size)) {
      if (isPlainObject(size) && size.autoWidth === false && size.width !== undefined && Object.keys(size).length === 2) props.add("width", size.width);
      else props.add("size", size);
      delete others.size;
    }
    return others;
  },

  Image: (rest, props, defaults, ctx) => {
    const { src, altText, action, ...others } = rest;
    const available = contentSlotWidth({ ...ctx.slot, containerPadding: rest.containerPadding ?? defaults.containerPadding });
    if (src !== undefined) imageSrc(src, props, defaults.src, available, (text) => ctx.state.warn(`${ctx.where}: ${text}.`));
    if (typeof altText === "string" && altText !== "") props.add("alt", altText);
    else if (altText !== undefined && altText !== "") others.altText = altText;
    // Its link (`action`) is written whole, as a web link to the URL.
    if (action !== undefined && !deepEqual(action, defaults.action)) {
      const link = linkOf(action, ctx);
      if (!link) others.action = action;
      else if (!noLink(link)) others.action = webLink(link);
    }
    return others;
  },

  Html: (rest, props) => {
    const { html, ...others } = rest;
    if (typeof html === "string") props.add("html", html);
    else if (html !== undefined) others.html = html;
    return others;
  },

  Menu: (rest, props, defaults, ctx) => {
    const { menu, ...others } = rest;
    if (menu === undefined || deepEqual(menu, defaults.menu)) return others;
    if (!isPlainObject(menu) || !Array.isArray(menu.items)) {
      others.menu = menu;
      return others;
    }
    const links = menu.items.map((item: unknown, i: number) => (isPlainObject(item) && item.link !== undefined ? linkOf(item.link, ctx, `its item ${i + 1}'s`) : undefined));
    const items = Object.keys(menu).length === 1 ? menuItems(menu.items, links) : undefined;
    if (items) props.add("items", items);
    // The items as the design has them (the editor's keys), each link a web link to its URL.
    else others.menu = { ...menu, items: menu.items.map((item: Plain, i: number) => (links[i] ? { ...item, link: webLink(links[i]) } : item)) };
    return others;
  },

  Social: (rest, props, defaults) => {
    const { icons, ...others } = rest;
    if (icons === undefined || deepEqual(icons, defaults.icons)) return others;
    const shorthand = isPlainObject(icons) && Object.keys(icons).every((key) => key === "iconType" || key === "icons") && Array.isArray(icons.icons) && icons.icons.every((icon: unknown) => isPlainObject(icon) && Object.keys(icon).every((key) => key === "name" || key === "url") && typeof icon.name === "string" && typeof icon.url === "string");
    if (shorthand && ["circle", "rounded", "squared"].includes(icons.iconType)) {
      props.add("icons", icons.icons.map((icon: Plain) => ({ name: icon.name, url: icon.url })));
      if (icons.iconType !== "circle") props.add("iconType", icons.iconType);
    } else props.add("icons", icons);
    return others;
  },

  Table: (rest, props) => {
    const { table, columns, rows, enableHeader, ...others } = rest;
    const shorthand = tableShorthand(table, columns, rows, enableHeader);
    if (shorthand) {
      for (const [name, value] of shorthand.attrs) props.add(name, value);
      if (shorthand.enableHeader !== undefined) others.enableHeader = shorthand.enableHeader;
    } else {
      // The counts would make an empty grid of their own (see Table): with the data, in `values`.
      for (const [key, value] of Object.entries({ table, columns, rows })) if (value !== undefined) props.values[key] = value;
      if (enableHeader !== undefined) others.enableHeader = enableHeader;
    }
    return others;
  },

  Video: (rest, props, defaults) => {
    const { video, ...others } = rest;
    if (video === undefined || deepEqual(video, defaults.video)) return others;
    const url = isPlainObject(video) ? videoUrl(video) : undefined;
    if (url) props.add("videoUrl", url);
    else if (isPlainObject(video)) props.add("video", video);
    else others.video = video;
    return others;
  },
};

/**
 * A fixed width as a percent of the column (`available` px wide) in px, where it's a whole pixel the percent is
 * written from (within 0.05px, as renderToJson writes a px width): Elements renders a px width exactly, a percent
 * as the px it works out to (`31.99px`).
 */
function wholePixels(percent: string, available: number): number | undefined {
  const px = (parseFloat(percent) / 100) * available;
  const whole = Math.round(px);
  return whole > 0 && Math.abs(px - whole) <= 0.05 && pinImageSrc<Plain>({ autoWidth: false, maxWidth: whole }, available).maxWidth === percent ? whole : undefined;
}

/** An image's `src`: a URL string, or its natural size and display width (see Image). */
function imageSrc(src: unknown, props: Props, defaults: Plain, available: number, warn: (text: string) => void): void {
  if (!isPlainObject(src)) {
    if (typeof src === "string") props.add("src", src);
    else props.values.src = src;
    return;
  }
  if (deepEqual(src, defaults)) return;
  const { autoWidth, maxWidth, ...natural } = src;
  const urlOnly = Object.keys(natural).length === 1 && typeof natural.url === "string";
  // Responsive (the builder's automatic width): a URL alone, or its natural size with `autoWidth` (a `width` in
  // `src` alone would pin it).
  if (autoWidth !== false && (maxWidth === undefined || maxWidth === "100%")) props.add("src", urlOnly ? natural.url : { ...natural, autoWidth: true });
  // Pinned to a percent of its column: `width`, in px where that's the whole pixel it was written from.
  else if (autoWidth === false && typeof maxWidth === "string" && /^\d+(\.\d+)?%$/.test(maxWidth) && maxWidth !== "100%") {
    props.add("src", urlOnly ? natural.url : natural);
    props.add("width", wholePixels(maxWidth, available) ?? maxWidth);
  } else if (autoWidth === false && toPx(maxWidth) !== undefined) {
    // A width in px: as it is (it comes back as the percent of its column it is, as the builder keeps a fixed width).
    warn(`its fixed width \`${maxWidth}\` is written as the percent of its column it is`);
    props.add("src", urlOnly ? natural.url : natural);
    props.add("width", toPx(maxWidth));
  } else props.add("src", { ...natural, ...(autoWidth !== undefined ? { autoWidth } : {}), ...(maxWidth !== undefined ? { maxWidth } : {}) });
}

/** Menu items as the `items` shorthand writes them (keys numbered from 1, each a link: `links`), or undefined. */
function menuItems(items: unknown[], links: Array<Link | undefined>): Plain[] | undefined {
  const out: Plain[] = [];
  for (const [i, item] of items.entries()) {
    const link = links[i];
    if (!link || !isPlainObject(item) || item.key !== String(i + 1) || typeof item.text !== "string" || Object.keys(item).some((key) => !["key", "text", "link"].includes(key))) return undefined;
    out.push({ text: item.text, href: link.href, ...(link.target !== "_blank" ? { target: link.target } : {}) });
  }
  return out;
}

/** A table's data as `headers` and `data` (or `columns` × `rows` of empty cells), as Table writes them, or undefined. */
function tableShorthand(table: unknown, columns: unknown, rows: unknown, enableHeader: unknown): { attrs: Array<[string, unknown]>; enableHeader?: unknown } | undefined {
  if (!isPlainObject(table) || Object.keys(table).some((key) => !["headers", "rows", "footers"].includes(key))) return undefined;
  if (typeof columns !== "number" || typeof rows !== "number") return undefined;
  const plainRow = (row: unknown): string[] | undefined =>
    isPlainObject(row) && row.height === 0 && Object.keys(row).length === 2 && Array.isArray(row.cells) && row.cells.every((cell: unknown) => isPlainObject(cell) && cell.width === 0 && typeof cell.text === "string" && Object.keys(cell).length === 2)
      ? row.cells.map((cell: Plain) => cell.text)
      : undefined;
  const headers: unknown[] = Array.isArray(table.headers) ? table.headers : [];
  const data = (Array.isArray(table.rows) ? table.rows : []).map(plainRow);
  if ((Array.isArray(table.footers) && table.footers.length) || headers.length > 1 || data.some((row) => !row) || rows !== data.length) return undefined;
  const cells = data as string[][];
  if (headers.length) {
    const header = plainRow(headers[0]);
    // With `headers` the header row is on, and as many columns as it has.
    if (!header || enableHeader === false || columns !== header.length) return undefined;
    return { attrs: [["headers", header], ["data", cells]] };
  }
  // An empty grid: its size.
  if (cells.length && cells.every((row) => row.length === columns && row.every((cell) => cell === ""))) return { attrs: [["columns", columns], ["rows", rows]], enableHeader };
  return { attrs: [["data", cells], ...(columns !== BLOCK_DEFAULTS.Table.columns ? ([["columns", columns]] as Array<[string, unknown]>) : [])], enableHeader };
}

/** A video's URL, where `videoUrl` gives exactly its values (Elements' own designs; the editor's keep the URL too). */
function videoUrl(video: Plain): string | undefined {
  const { type, videoId, thumbnail, loading = false, ...others } = video;
  if (Object.keys(others).length || loading !== false || typeof videoId !== "string" || !videoId) return undefined;
  if (type === "youtube" && thumbnail === `https://img.youtube.com/vi/${videoId}/0.jpg` && /^[\w-]{11}$/.test(videoId)) return `https://www.youtube.com/watch?v=${videoId}`;
  if (type === "vimeo" && thumbnail === "" && /^\d+$/.test(videoId)) return `https://vimeo.com/${videoId}`;
  return undefined;
}

/** A block Elements has no component for: an Html block of its exported HTML, or a TODO comment. */
function withoutComponent(content: Plain, type: string, ctx: BlockContext): JsxChild {
  const values: Plain = isPlainObject(content.values) ? content.values : {};
  const name = type === "custom" && content.slug ? `custom "${content.slug}"` : `"${type || "untyped"}"`;
  const html = blockHtml(ctx.state.html, values._meta?.htmlID);
  if (html === undefined) {
    ctx.state.warn(`${ctx.where}: a ${name} block has no Elements component and no exported HTML, so it's left out (a TODO comment marks where it was).`);
    return { comment: `TODO: a ${name} block (${ctx.where}) has no Elements component. Pass the design's exported HTML (\`html\` option) to keep it as an <Html> block.` };
  }
  ctx.state.use("Html");
  ctx.state.warn(`${ctx.where}: a ${name} block has no Elements component, so it's kept as an <Html> block with its exported HTML (the builder opens it as HTML).`);
  const props = new Props("Html");
  props.add("html", html);
  const defaults: Plain = { ...BLOCK_BASE, ...BLOCK_DEFAULTS.Html };
  if (values.containerPadding !== undefined && values.containerPadding !== defaults.containerPadding) props.add("containerPadding", values.containerPadding);
  placeDevice(values._override, props, defaults, "block");
  return { tag: "Html", attrs: attributes(props, ctx.state.types), children: [] };
}
