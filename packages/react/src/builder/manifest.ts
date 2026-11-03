/**
 * Every key toDesign() writes in a builder item's values, by tool: the builder's own (its fields, which it shows and
 * edits, from @unlayer/types and the designs it saves), and the hidden properties: a style or prop of the template
 * that the tool has no field for, kept in the item's values under its Elements name and drawn by Elements, with no
 * editor in the builder until it gets one. A hidden key is prefixed only where the tool already uses the name for
 * something else, and says why. A test holds toDesign()'s output to this list, so a new key, or a collision, is a
 * reviewed change here.
 *
 * Phone values go in `_override.mobile` under the same keys as on desktop. A block's share of a Row (`flex`) is its
 * column's width in the builder (`cells`), never hidden.
 */

/** A hidden property: the template's path it holds, its key in the item's values, and why it's prefixed, where it is. */
export interface Hidden {
  path: string;
  key: string;
  prefixed?: string;
}

const own = (...paths: string[]): Hidden[] => paths.map((path) => ({ path, key: path.slice(path.indexOf(".") + 1) }));

/** A text block's box and the text styles its tool has no field for. */
const TEXT_BOX = own("style.fontStyle", "style.textTransform", "style.textDecoration", "style.backgroundColor", "style.border", "style.borderRadius", "style.width", "style.maxWidth", "style.padding");

export const HIDDEN: Readonly<Record<string, readonly Hidden[]>> = {
  // The root's title is the builder's accessibility title (accessibilityTitle), a field; its `language` holds a design's
  // translations, not the language its text is in, so a root's `lang` is hidden.
  body: own("props.lang", "props.fonts", "props.description", "props.margin"),
  // A Section's border, the part of it around this row; the rest of a Row's box.
  row: [
    { path: "style.border", key: "sectionBorder", prefixed: "today's image writer takes a row's border as room its columns lose; a Section's is around its band" },
    ...own("style.borderRadius", "style.width", "style.minWidth", "style.maxWidth", "style.height", "style.overflow", "style.justifyContent", "style.flexWrap"),
  ],
  column: [...own("style.justifyContent", "style.minWidth", "style.maxWidth", "style.height", "style.overflow"), { path: "hidden.desktop", key: "hideDesktop" }, { path: "hidden.mobile", key: "hideMobile" }],
  text: TEXT_BOX,
  heading: TEXT_BOX,
  button: [
    { path: "style.textAlign", key: "buttonTextAlign", prefixed: "the button's textAlign places the button; the Button's aligns its label" },
    ...own("style.fontStyle", "style.textTransform", "style.textDecoration", "style.maxWidth", "props.title", "props.aria-label"),
  ],
  image: [
    { path: "style.border", key: "imageBorder", prefixed: "today's image writer takes an image's border as room the image loses, and draws none" },
    ...own("props.title", "style.maxWidth", "style.height", "style.borderRadius"),
  ],
  divider: [],
  menu: own("style.lineHeight", "style.textTransform"),
  social: [],
  video: own("props.thumbnail", "props.title", "style.width", "style.maxWidth"),
  html: own("props.text"),
  page_break: [],
};

/** What every content item has in the builder. */
const CONTENT = ["containerPadding", "anchor", "displayCondition", "_styleGuide", "_meta", "selectable", "draggable", "duplicatable", "deletable", "hideable", "locked", "hideDesktop", "hideMobile", "_override", "synced", "suggestions", "ai_banner"];

/** The builder's own keys, by tool (its fields, and what it writes for its own use). */
export const BUILDER_KEYS: Readonly<Record<string, readonly string[]>> = {
  body: [
    "_styleGuide", "contentWidth", "contentAlign", "contentVerticalAlign", "fontFamily", "fontWeight", "textColor", "backgroundColor", "backgroundImage", "preheaderText", "linkStyle", "language",
    "accessibilityTitle", "textDirection", "borderRadius", "documentSize", "documentOrientation", "documentMargin", "_meta",
    "popupPosition", "popupDisplayDelay", "popupWidth", "popupHeight", "popupBackgroundColor", "popupBackgroundImage", "popupOverlay_backgroundColor", "popupCloseButton_position",
    "popupCloseButton_backgroundColor", "popupCloseButton_iconColor", "popupCloseButton_borderRadius", "popupCloseButton_margin", "popupCloseButton_action",
  ],
  row: [
    "displayCondition", "columns", "_styleGuide", "backgroundColor", "columnsBackgroundColor", "backgroundImage", "padding", "anchor", "noStackMobile", "alignItems", "_meta", "selectable", "draggable",
    "duplicatable", "deletable", "hideable", "locked", "hideDesktop", "hideMobile", "_override", "cells", "sync",
    // Not a field, but today's image writer reads it (see sectionBorder).
    "border",
  ],
  column: ["backgroundColor", "padding", "border", "borderRadius", "_meta", "deletable", "locked", "_override"],
  text: [...CONTENT, "text", "textJson", "color", "textAlign", "fontFamily", "fontWeight", "fontSize", "lineHeight", "letterSpacing", "linkStyle", "textDirection"],
  heading: [...CONTENT, "text", "textJson", "color", "textAlign", "fontFamily", "fontWeight", "fontSize", "lineHeight", "letterSpacing", "linkStyle", "textDirection", "headingType"],
  button: [...CONTENT, "text", "textJson", "href", "size", "fontFamily", "fontWeight", "buttonColors", "fontSize", "lineHeight", "letterSpacing", "border", "padding", "textAlign", "borderRadius", "textDirection"],
  // An image's border isn't a field, but today's image writer reads it (see imageBorder).
  image: [...CONTENT, "src", "textAlign", "altText", "action", "border"],
  divider: [...CONTENT, "width", "border", "textAlign"],
  menu: [...CONTENT, "menu", "linkColor", "padding", "fontFamily", "fontWeight", "textColor", "fontSize", "letterSpacing", "layout", "align", "separator"],
  social: [...CONTENT, "icons", "spacing", "align", "iconSize"],
  // A video's alignment isn't in @unlayer/types, but legacy reads it (and centers one without it).
  video: [...CONTENT, "video", "href", "textAlign"],
  html: [...CONTENT, "html"],
  page_break: [...CONTENT, "color"],
};

/** The phone values the builder has (in `_override.mobile`), by tool. */
export const BUILDER_PHONE_KEYS: Readonly<Record<string, readonly string[]>> = {
  body: [],
  row: ["padding", "hideMobile", "noStackMobile", "backgroundColor", "columnsBackgroundColor"],
  column: ["padding", "border", "backgroundColor"],
  text: ["containerPadding", "fontSize", "lineHeight", "textAlign", "letterSpacing", "hideMobile"],
  heading: ["containerPadding", "fontSize", "lineHeight", "textAlign", "letterSpacing", "hideMobile"],
  button: ["containerPadding", "fontSize", "lineHeight", "textAlign", "padding", "letterSpacing", "size", "hideMobile"],
  image: ["containerPadding", "src", "textAlign", "hideMobile"],
  divider: ["containerPadding", "width", "textAlign", "hideMobile"],
  menu: ["containerPadding", "fontSize", "padding", "align", "layout", "hideMobile"],
  social: ["containerPadding", "iconSize", "spacing", "align", "hideMobile"],
  video: ["containerPadding", "textAlign", "hideMobile"],
  html: ["containerPadding", "hideMobile"],
  page_break: ["hideMobile"],
};

/** A tool's hidden property for a template path, where it has one. */
export function hiddenKey(tool: string, path: string): Hidden | undefined {
  return (HIDDEN[tool] ?? []).find((entry) => entry.path === path);
}
