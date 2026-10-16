/**
 * The values parity.test.ts gives each block's exporter: what the editor and Elements give them (links in the link
 * editor's shape, icon sets, borders, markup) and past that (empty, null, numbers where text goes, markup and quotes
 * in every text, `javascript:` URLs, React's own attribute names in a link's custom attributes). Every combination of
 * the values that shape each block's HTML, then more combinations drawn by a seeded generator.
 */
import { LINKS, TEXTS } from "./test-corpus";

type Values = Record<string, any>;

/** A seeded generator (mulberry32): the same values on every run. */
function random(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T>(next: () => number, list: readonly T[]): T => list[Math.floor(next() * list.length)];

/** Every combination of the lists' values, one per key. */
function combinations(lists: Record<string, readonly unknown[]>): Values[] {
  return Object.entries(lists).reduce<Values[]>((all, [key, list]) => all.flatMap((values) => list.map((value) => (value === undefined ? { ...values } : { ...values, [key]: value }))), [{}]);
}

const ODD = [undefined, null, "", 0, 1, -1, 2.5, NaN, true, false, " 5 ", 10n] as const;
const ALIGNS = ["left", "center", "right", "justify", "", undefined, '"><x>'] as const;

// ---------- Divider ----------

const BORDER_STYLES = ["solid", "dashed", "dotted", "double", "none"];
const BORDERS = [
  undefined,
  null,
  "",
  "2px dashed #ff0000",
  {},
  ...BORDER_STYLES.flatMap((style) => ["1px", "3px", "10px", 2].map((width) => ({ borderTopWidth: width, borderTopStyle: style, borderTopColor: "#BBBBBB" }))),
  { borderTopWidth: "1px" },
  { borderTopColor: "rgba(0, 0, 0, 0.5)", borderTopStyle: "solid" },
  { borderTopWidth: "2px", borderTopStyle: "solid", borderTopColor: '"><x-pwn>' },
  { borderTopWidth: 0, borderTopStyle: "", borderTopColor: null },
  { lineHeight: 3, width: "10px", display: "block", height: 4, borderTopWidth: "1px" },
  { "--rule-color": " #ccc ", msTransform: "none", WebkitLineClamp: 2, scale: 2, zIndex: 1, opacity: 0, flex: NaN, aspectRatio: 1.5 },
  { borderTop: "1px solid #000", borderBottom: { a: 1 }, 0: "zero", "a-b": [1, 2] },
  5,
  true,
];

/** CSS properties a border can carry into the rule's style (React writes numbers in px but for its unitless ones), and values. */
const STYLE_NAMES = ["borderTopWidth", "borderTopStyle", "borderTopColor", "borderTop", "width", "display", "lineHeight", "height", "verticalAlign", "--custom", "msTransform", "MozOpacity", "OFlex", "WebkitLineClamp", "WebkitBoxFlex", "scale", "aspectRatio", "zIndex", "opacity", "fontWeight", "0", "a-b"];
const STYLE_VALUES = ["1px", "solid", "#BBBBBB", "rgb(1, 2, 3)", 0, 1, 2, -3, 2.5, NaN, Infinity, "", " 3px ", "<&\"'>", null, true, [1, 2], { a: 1 }];

export function dividerValues(): Values[] {
  const all = combinations({ width: ["100%", "50%", "33.33%", "240px", "", undefined, 0, 80, null], textAlign: ALIGNS, border: BORDERS });
  // Each property with each value, in a border.
  for (const name of STYLE_NAMES) for (const value of STYLE_VALUES) all.push({ width: "100%", textAlign: "center", border: { borderTopWidth: "1px", [name]: value } });
  const next = random(1);
  for (let i = 0; i < 1500; i++) all.push({ width: pick(next, [...ODD, "60%", "1px"]), textAlign: pick(next, ALIGNS), border: pick(next, [...BORDERS, ...ODD]) });
  return all;
}

// ---------- Html ----------

const MARKUP = [
  ...TEXTS,
  "<p>Hello <strong>world</strong></p>",
  '<table role="presentation"><tr><td style="color:#333">Cell</td></tr></table>',
  '<a href="https://example.com/?a=1&b=2" target="_blank">Link</a>',
  "<script>alert(1)</script><p>after</p>",
  '<link rel="preload" as="image" href="https://example.com/a.png"><p>preload</p>',
  '<link rel="preload" as="image" href="https://example.com/a.png" /><link rel="stylesheet" href="x.css">',
  "<!-- comment --><p>x</p><!--[if mso]><table><![endif]-->",
  '<img src="https://example.com/a.png" alt="A &amp; B">',
  "<p>Hi {{first_name}}, *|FNAME|*</p>",
  '<p dir="rtl">مرحبا <b>بالعالم</b></p>',
  ...ODD,
  { a: 1 },
  ["<i>a</i>", "b"],
];

/** The block's config (the 8th argument): none, or `toSafeHtml` of each kind. */
const HTML_META = [
  undefined,
  {},
  { exporterConfig: {} },
  { exporterConfig: { toSafeHtml: (html: string) => html } },
  { exporterConfig: { toSafeHtml: (html: string) => `${html}`.replace(/<script[\s\S]*?<\/script>/g, "") } },
  { exporterConfig: { toSafeHtml: () => undefined } },
  { exporterConfig: { toSafeHtml: () => 7 } },
  { exporterConfig: { toSafeHtml: null } },
];

export function htmlCases(): [Values, unknown][] {
  return MARKUP.flatMap((html) => HTML_META.map((meta): [Values, unknown] => [{ html }, meta]));
}

// ---------- Menu ----------

/** Custom attributes of a link: names React writes as given, renames, writes as booleans or leaves out, and values of each kind. */
const ATTRIBUTE_NAMES = ["data-track", "data-onclick-encoded", "aria-hidden", "rel", "title", "id", "class", "className", "style", "href", "target", "onClick", "onmouseover", "tabIndex", "htmlFor", "hidden", "download", "is", "children", "dangerouslySetInnerHTML", "key", "ref", "rowSpan", "cols", "contentEditable", "allowFullScreen", "inert", "checked", "autoFocus", "src", "action", "xlinkHref", "strokeWidth", "transformOrigin", "crossOrigin", "x y", "1abc", "__proto__", "constructor", "defaultValue", "value"];
const ATTRIBUTE_VALUES = [...ODD, "javascript:alert(1)", "<&\"'>", "  sp  ", "noopener", "YWxlcnQoMSk=", { a: 1 }, [1, 2], () => 1, { __html: "<b>i</b>" }];

function customAttrs(next: () => number): Values {
  const attrs: Values = {};
  for (let i = Math.floor(next() * 4); i > 0; i--) Object.defineProperty(attrs, pick(next, ATTRIBUTE_NAMES), { value: pick(next, ATTRIBUTE_VALUES), enumerable: true, writable: true, configurable: true });
  return attrs;
}

/** Links as the link editor gives them (`{ url, target, onClick, class, customAttrs }`), and none. */
const LINK_SHAPES: unknown[] = [
  undefined,
  null,
  "https://example.com/",
  ...LINKS.map((url) => ({ url, target: "_blank" })),
  ...["_self", "_parent", "_top", "", undefined, null].map((target) => ({ url: "https://example.com/t", target })),
  { url: "https://example.com/attrs", customAttrs: { "data-track": "menu", rel: "noopener noreferrer", title: 'Say "hi"' } },
  { url: "", customAttrs: { "data-empty": "", rel: " " } },
  { url: "", customAttrs: { a: 5 } },
  { url: "https://example.com/click", onClick: "track('menu', \"home\"); return true;", class: "menu-link primary" },
  { url: "", onClick: "openChat()" },
  { url: "", onClick: "é ✓ \ud800" },
  { url: "https://example.com/", customAttrs: "ab" },
  { url: "https://example.com/", customAttrs: { "data-onclick-encoded": "YWxlcnQoMSk=" } },
  { url: "https://example.com/", customAttrs: { "data-onclick-encoded": "!!not base64" } },
  { url: "https://example.com/", customAttrs: { is: "x-link", className: "c", onClick: "x()", hidden: true } },
];

const ITEM_TEXTS = [...TEXTS, 0, 7, null, undefined, ["a", 1, null, ["b"]]];

export function menuValues(): Values[] {
  const all: Values[] = [];
  const item = (text: unknown, link: unknown) => ({ key: "1", text, link });
  // Each text, each link, in a menu of each layout with separators.
  for (const layout of ["horizontal", "vertical", undefined])
    for (const separator of ["|", "", "•", "<b>/</b>", undefined])
      for (const [i, link] of LINK_SHAPES.entries()) all.push({ menu: { items: [item(ITEM_TEXTS[i % ITEM_TEXTS.length], link), item("Second", LINK_SHAPES[(i + 1) % LINK_SHAPES.length]), null] }, layout, separator });
  for (const text of ITEM_TEXTS) all.push({ menu: { items: [item(text, { url: `https://example.com/${text}` }), item(text, undefined)] }, separator: text, layout: "horizontal" });
  // Each custom attribute name with each value, on a link.
  for (const name of ATTRIBUTE_NAMES)
    for (const value of ATTRIBUTE_VALUES) {
      const customAttrs = Object.defineProperty({}, name, { value, enumerable: true, writable: true, configurable: true });
      all.push({ menu: { items: [item("Home", { url: "https://example.com/", customAttrs }), item("Empty", { url: "", customAttrs })] }, layout: "horizontal" });
    }
  // The style values, each combination.
  for (const values of combinations({
    align: ["left", "center", "right", undefined],
    fontFamily: [{ label: "Arial", value: "arial,helvetica,sans-serif" }, { value: "'Open Sans', sans-serif" }, undefined, "Georgia"],
    fontWeight: [400, 700, "bold", undefined],
    letterSpacing: ["0px", "1px", undefined],
  }))
    all.push({ ...values, menu: { items: [item("Home", { url: "https://example.com/" }), item("About", undefined)] }, layout: "horizontal", separator: "|", padding: "5px 15px", fontSize: "14px", linkColor: "#0068A5", textColor: "#444444" });
  // Empty menus, and no menu.
  for (const menu of [undefined, null, {}, { items: undefined }, { items: null }, { items: [] }, { items: [null, undefined] }, { items: "x" }]) all.push({ menu });
  const next = random(2);
  for (let i = 0; i < 2500; i++) {
    const items = Array.from({ length: Math.floor(next() * 5) }, () => (next() < 0.07 ? null : item(next() < 0.85 ? pick(next, ITEM_TEXTS) : pick(next, ODD), next() < 0.7 ? pick(next, LINK_SHAPES) : { url: pick(next, LINKS), target: pick(next, ["_blank", "_self", undefined]), onClick: next() < 0.2 ? pick(next, ["x()", "", undefined]) : undefined, class: next() < 0.2 ? "c" : undefined, customAttrs: next() < 0.4 ? customAttrs(next) : undefined })));
    all.push({
      menu: { items },
      separator: pick(next, ["|", "", "•", undefined, 0, "<i>-</i>"]),
      layout: pick(next, ["horizontal", "vertical", undefined, "grid"]),
      align: pick(next, ALIGNS),
      padding: pick(next, ["5px 15px", "0px", 4, 0, undefined, " 3px "]),
      fontSize: pick(next, ["14px", 14, 0, undefined, NaN]),
      fontWeight: pick(next, [400, 700, "bold", undefined, 0]),
      fontFamily: pick(next, [{ value: "arial" }, undefined, {}, "Georgia"]),
      letterSpacing: pick(next, ["1px", 2, undefined, "", 0]),
      linkColor: pick(next, ["#0068A5", undefined, "", "rgb(1, 2, 3)"]),
      textColor: pick(next, ["#444444", undefined, "", "<x>"]),
    });
  }
  return all;
}

// ---------- Social ----------

const ICON_NAMES = ["Facebook", "X", "Twitter", "Instagram", "LinkedIn", "YouTube", "Pinterest", "TikTok", "WhatsApp", "Email", "Custom", "", '"><x>', "Ünï", 5, undefined];
const ICON_TYPES = ["circle", "rounded", "squared", "circle-black", "circle-white", "rounded-black", "squared-black", "", undefined];
const ICON_URLS = [...LINKS, "hi@example.com", undefined, 5, ["mailto"]];
const SOCIAL_META = [undefined, {}, { exporterConfig: {} }, { exporterConfig: { cdnBaseUrl: "https://cdn.tools.unlayer.com" } }, { exporterConfig: { cdnBaseUrl: "https://cdn.example.com/a" } }, { exporterConfig: { cdnBaseUrl: '"><x>' } }];
const CUSTOM_ICONS = { data: { customIcons: [{ name: "Custom", icons: { circle: "https://example.com/c.png", rounded: "" } }, { name: "Facebook", icons: { circle: "https://example.com/fb.png" } }, null] } };

export function socialCases(): [Values, unknown][] {
  const all: [Values, unknown][] = [];
  // (An icon without a name or image throws in both, as the exporters read its name for its image.)
  const icons = ICON_NAMES.filter((name) => typeof name === "string").map((name, i) => ({ name, url: ICON_URLS[i % ICON_URLS.length] }));
  // Each icon set, size, spacing and alignment, with each icon.
  for (const values of combinations({ iconType: ICON_TYPES, iconSize: [32, 16, 48, "40", 0, undefined, NaN], spacing: [5, 0, 10, undefined], align: ["left", "center", "right", undefined] }))
    all.push([{ icons: { iconType: values.iconType, icons }, iconSize: values.iconSize, spacing: values.spacing, align: values.align }, SOCIAL_META[all.length % SOCIAL_META.length]]);
  for (const url of ICON_URLS) for (const name of ICON_NAMES) if (name !== undefined || url) all.push([{ icons: { iconType: "circle", icons: [{ name, url }, { name: "X", url, imgUrl: "https://example.com/x.png" }] }, iconSize: 32, spacing: 5, align: "center" }, undefined]);
  for (const meta of SOCIAL_META) {
    all.push([{ icons: { iconType: "circle", icons: [] }, iconSize: 32, align: "left" }, meta]);
    all.push([{ icons: { iconType: "circle", icons: [{ name: "Custom", url: "https://example.com/" }, { name: "Facebook", url: "https://example.com/" }, null], editor: CUSTOM_ICONS }, iconSize: 24, spacing: 4, align: "right" }, meta]);
  }
  for (const group of [undefined, {}, { icons: null }, { icons: "x" }, { iconType: "circle" }, { editor: {} }, { editor: { data: {} }, icons: [{ name: "Facebook" }] }]) all.push([{ icons: group, iconSize: 32 }, undefined]);
  const next = random(3);
  for (let i = 0; i < 2500; i++) {
    const set = Array.from({ length: Math.floor(next() * 5) }, () => (next() < 0.06 ? pick(next, [null, undefined, 0, ""]) : { name: pick(next, ICON_NAMES), url: pick(next, ICON_URLS), ...(next() < 0.15 ? { imgUrl: pick(next, ["https://example.com/i.png", "", "javascript:x", '"><x>']) } : {}) }));
    all.push([
      { icons: { iconType: pick(next, ICON_TYPES), icons: set, ...(next() < 0.15 ? { editor: CUSTOM_ICONS } : {}) }, iconSize: pick(next, [32, 16, 0, "40", undefined, NaN, 2.5, true]), spacing: pick(next, [5, 0, 10, "8", undefined, -1]), align: pick(next, ALIGNS) },
      pick(next, SOCIAL_META),
    ]);
  }
  return all;
}
