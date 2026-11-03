/**
 * What of an item's values fromDesign() doesn't read, said, as compat fails closed on a value it doesn't read: one that
 * isn't empty, isn't its tool's default (what the builder fills in), and is neither read nor one that draws nothing (the
 * editor's own flags, a popup's settings) draws something the template won't (a row's background image, an anchor, a
 * display condition, a phone value Elements has no place for).
 */
import { BodyDefaults, ColumnDefaults, RowDefaults } from "@unlayer/exporters";
import type { Values } from "../compat/values";
import { HIDDEN } from "./manifest";
import { same } from "./reading";

/** What draws nothing: the editor's own flags, and the earlier adapter's payload (`_elements`). */
const NOTHING = ["_meta", "_styleGuide", "_elements", "selectable", "draggable", "duplicatable", "deletable", "hideable", "locked", "synced", "sync", "suggestions", "ai_banner", "hideDesktop", "hideMobile", "_override"];
const TEXT = ["text", "textJson", "color", "textAlign", "fontFamily", "fontWeight", "fontSize", "lineHeight", "letterSpacing", "linkStyle", "textDirection", "containerPadding"];
const TEXT_PHONE = ["containerPadding", "fontSize", "lineHeight", "textAlign", "letterSpacing", "hideMobile"];

/** The values each reader reads (or that draw nothing), by tool: on desktop, and on phones (`_override.mobile`). */
const READ: Record<string, { values: string[]; phone: string[] }> = {
  body: {
    // A popup's settings (its corners, its content's vertical alignment) draw nothing in an email, a page or a document.
    values: ["textDirection", "contentWidth", "fontFamily", "fontWeight", "textColor", "backgroundColor", "preheaderText", "accessibilityTitle", "documentSize", "documentOrientation", "documentMargin", "contentVerticalAlign", "borderRadius"],
    phone: [],
  },
  row: { values: ["columns", "cells", "backgroundColor", "columnsBackgroundColor", "padding", "noStackMobile", "alignItems"], phone: ["padding", "hideMobile", "noStackMobile"] },
  column: { values: ["backgroundColor", "padding", "border", "borderRadius"], phone: ["padding", "border", "hideMobile"] },
  text: { values: TEXT, phone: TEXT_PHONE },
  heading: { values: [...TEXT, "headingType"], phone: TEXT_PHONE },
  // Its alignment on phones is said where it's read.
  button: { values: [...TEXT, "href", "size", "buttonColors", "border", "padding", "borderRadius", "calculatedWidth", "calculatedHeight"], phone: [...TEXT_PHONE, "padding", "size"] },
  image: { values: ["src", "textAlign", "altText", "action", "containerPadding"], phone: ["containerPadding", "src", "textAlign", "hideMobile"] },
  divider: { values: ["width", "border", "textAlign", "containerPadding"], phone: ["containerPadding", "width", "hideMobile"] },
  menu: { values: ["menu", "linkColor", "padding", "fontFamily", "fontWeight", "textColor", "fontSize", "letterSpacing", "layout", "align", "separator", "containerPadding"], phone: ["containerPadding", "fontSize", "hideMobile"] },
  social: { values: ["icons", "spacing", "align", "iconSize", "containerPadding"], phone: ["containerPadding", "hideMobile"] },
  video: { values: ["video", "textAlign", "containerPadding"], phone: ["containerPadding", "hideMobile"] },
  html: { values: ["html", "containerPadding"], phone: ["containerPadding", "hideMobile"] },
};

/** The builder's defaults for a frame (a tool's are merged in before it's read). */
const FRAMES: Record<string, Values> = { body: BodyDefaults, row: RowDefaults, column: ColumnDefaults };

/** Whether a value draws nothing on its own: none, empty, or an image without its URL. */
function empty(value: unknown): boolean {
  if (value === undefined || value === null || value === "" || value === false) return true;
  if (Array.isArray(value)) return !value.length;
  if (typeof value === "object") {
    const keys = Object.keys(value);
    // A background image without its URL is none.
    return !keys.length || (keys.includes("url") && empty((value as Values).url));
  }
  return false;
}

/** What a value of these is called in a line of the report. */
const WHAT: Record<string, string> = {
  displayCondition: "display condition, which today's writers keep for the email service to apply, isn't read: it's shown to everyone",
  anchor: "anchor isn't read: links to it go nowhere",
  backgroundImage: "background image isn't one Elements draws: left out",
  linkStyle: "link style, the body's own, isn't one Elements draws for every link: left out",
  contentAlign: "content alignment isn't one Elements' root takes: its content is centered",
  language: "translations aren't read: only its own text is",
};

/** Says each value of the item (by its tool, `paragraph` a text's) that isn't read, and draws something. */
export function sayUnread(tool: string, values: Values, defaults: Values | undefined, say: (message: string) => void): void {
  const read = READ[tool === "paragraph" ? "text" : tool];
  if (!read) return;
  const hidden = (HIDDEN[tool === "paragraph" ? "text" : tool] ?? []).map((entry) => entry.key);
  const given = defaults ?? FRAMES[tool] ?? {};
  const known = new Set([...NOTHING, ...read.values, ...hidden]);
  for (const [key, value] of Object.entries(values)) {
    if (known.has(key) || (tool === "body" && key.startsWith("popup")) || empty(value) || (Object.hasOwn(given, key) && same(value, given[key]))) continue;
    say(Object.hasOwn(WHAT, key) ? `its ${WHAT[key]}` : `its ${key} ${JSON.stringify(value) ?? ""} isn't read: left out`);
  }
  const override = values._override && typeof values._override === "object" ? (values._override as Values) : {};
  const phone = override.mobile && typeof override.mobile === "object" ? (override.mobile as Values) : {};
  const phoneKnown = new Set([...read.phone, ...hidden]);
  for (const [key, value] of Object.entries(phone)) {
    if (phoneKnown.has(key) || empty(value) || same(value, values[key])) continue;
    say(`its ${key} on phones ${JSON.stringify(value) ?? ""} isn't read: left out`);
  }
  for (const device of Object.keys(override)) {
    if (device === "mobile" || device === "desktop") continue;
    if (!empty(override[device])) say(`its settings for ${device === "tablet" ? "tablets" : JSON.stringify(device)} aren't read: left out`);
  }
  const desktop = override.desktop && typeof override.desktop === "object" ? Object.keys(override.desktop as Values).filter((key) => key !== "hideDesktop" && !empty((override.desktop as Values)[key])) : [];
  if (desktop.length) say(`its settings for desktop windows (${desktop.join(", ")}) aren't read: left out`);
}
