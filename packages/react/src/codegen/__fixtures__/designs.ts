/**
 * Small designs, one setting or block each, written as the editor saves them: codegen's unit tests and its
 * type-check test convert them. `code` lists what the generated code must contain; `warnings`, what it must say;
 * `losses`, the paths that don't come back (none, mostly).
 */
import type { DesignToElementsOptions } from "../design-to-elements";
import type { Plain } from "../values";

export interface DesignCase {
  design: Plain;
  options?: DesignToElementsOptions;
  code: string[];
  warnings?: RegExp[];
  losses?: string[];
  /** Code that must not be there. */
  absent?: string[];
}

interface Layout {
  body?: Plain;
  row?: Plain;
  column?: Plain;
  cells?: number[];
  columns?: Plain[];
  /** A document's header rows. */
  headers?: Plain[];
  /** Top-level keys beside `body`. */
  extra?: Plain;
}

/** A design with one row: `blocks` in its one column (or `columns`, each `{ values, contents }`). */
export function design(blocks: Plain[], { body = {}, row = {}, column = {}, cells, columns, headers, extra = {} }: Layout = {}): Plain {
  const cols = columns ?? [{ values: column, contents: blocks }];
  return {
    counters: {},
    schemaVersion: 27,
    ...extra,
    body: { rows: [{ cells: cells ?? cols.map(() => 1), columns: cols, values: row }], values: body, ...(headers ? { headers } : {}) },
  };
}

const block = (type: string, values: Plain, more: Plain = {}) => ({ type, values, ...more });

export const DESIGNS: Record<string, DesignCase> = {
  // ── Text ──────────────────────────────────────────────────────────────────────────────────────────────────────
  "paragraph: its text in `html`, which renders as the design has it (children would be in a <p>)": {
    design: design([block("text", { text: "Hello there, friend", fontSize: "16px" })]),
    code: ['<Paragraph html="Hello there, friend" fontSize="16px" />'],
  },
  "paragraph: markup in `html`": {
    design: design([block("text", { text: '<p>Hi <strong>you</strong>, see <a href="https://example.com">this</a>.</p>' })]),
    code: [`<Paragraph html='<p>Hi <strong>you</strong>, see <a href="https://example.com">this</a>.</p>' />`],
  },
  "paragraph: entities in an expression (JSX would decode them in a string)": {
    design: design([block("text", { text: "Fish &amp; chips" })]),
    code: ['<Paragraph html={"Fish &amp; chips"} />'],
  },
  "paragraph: empty text": {
    design: design([block("text", { text: "" })]),
    code: ['<Paragraph values={{ text: "" }} />'],
  },
  "paragraph: the body's text color, pinned": {
    design: design([block("text", { text: "Inherits" })], { body: { textColor: "#333333" } }),
    code: ['<Email textColor="#333333">', '<Paragraph html="Inherits" color="#333333" />'],
  },
  "paragraph: link style and font": {
    design: design([block("text", { text: "Styled", fontFamily: { label: "Georgia", value: "georgia,serif" }, linkStyle: { inherit: false, linkColor: "#ff0000", linkHoverColor: "#0000ee", linkUnderline: true, linkHoverUnderline: true } })]),
    code: ['fontFamily={{ label: "Georgia", value: "georgia,serif" }}', 'linkStyle={{ inherit: false, linkColor: "#ff0000" }}'],
  },
  "paragraph: values a prop would change go in `values`": {
    design: design([block("text", { text: "Odd", lineHeight: 1.5, fontWeight: "700", letterSpacing: 2 })]),
    // (As the design has them: the `values` type checks their keys, not what they hold.)
    code: ['values={{ lineHeight: 1.5, fontWeight: "700", letterSpacing: 2 }}'],
  },
  "paragraph: right-to-left design keeps an explicit left alignment": {
    design: design([block("text", { text: "Left", textAlign: "left" }), block("text", { text: "Right", textAlign: "right" })], { body: { textDirection: "rtl" } }),
    code: ['<Email textDirection="rtl">', '<Paragraph html="Left" textAlign="left" />', '<Paragraph html="Right" />'],
  },
  "paragraph: the editor's Lexical paragraph": {
    design: design([block("paragraph", { textJson: '{"root":{"type":"root","children":[{"type":"paragraph","children":[{"type":"text","text":"Lexical","format":1}]}]}}' })]),
    code: ['<Paragraph html=\'<p style="margin: 0px; margin-block-start: 0px; margin-block-end: 0px;"><strong>Lexical</strong></p>\' />'],
    warnings: [/Row 1, column 1, block 1: a "paragraph" block/],
  },
  "heading: level, weight and text": {
    design: design([block("heading", { headingType: "h2", text: "Welcome aboard", fontWeight: 700, fontSize: "30px" })]),
    code: ['<Heading headingType="h2" fontWeight={700} fontSize="30px">', "Welcome aboard"],
  },
  "heading: markup in `text`": {
    design: design([block("heading", { text: "Big <em>news</em>" })]),
    code: ['<Heading text="Big <em>news</em>" />'],
  },
  "heading: textJson beside text is left out": {
    design: design([block("heading", { text: "Kept", textJson: "{}" })]),
    code: ["<Heading>Kept</Heading>"],
    absent: ["textJson"],
  },

  // ── Buttons and links ─────────────────────────────────────────────────────────────────────────────────────────
  "button: link, colors, text": {
    design: design([block("button", { text: "Shop now", href: { name: "web", values: { href: "https://example.com/shop", target: "_self" } }, buttonColors: { color: "#ffffff", backgroundColor: "#111827", hoverColor: "#FFFFFF", hoverBackgroundColor: "#374151" }, borderRadius: "6px" })]),
    code: ['href="https://example.com/shop"', 'target="_self"', 'color="#ffffff"', 'backgroundColor="#111827"', 'hoverBackgroundColor="#374151"', 'borderRadius="6px"', "Shop now"],
    absent: ["hoverColor"],
  },
  "button: an email link": {
    design: design([block("button", { text: "Write to us", href: { name: "email", values: { email: "hi@example.com", subject: "Hello" } } })]),
    code: ['href={{ name: "email", values: { email: "hi@example.com", subject: "Hello" } }}'],
  },
  "button: fixed width": {
    design: design([block("button", { text: "Wide", size: { autoWidth: false, width: "60%" } })]),
    code: ['<Button width="60%">Wide</Button>'],
  },
  "button: automatic width that remembers a width": {
    design: design([block("button", { text: "Auto", size: { autoWidth: true, width: "40%" } })]),
    code: ['size={{ autoWidth: true, width: "40%" }}'],
  },
  "button: border": {
    design: design([block("button", { text: "Outline", border: { borderTopWidth: "2px", borderTopStyle: "solid", borderTopColor: "#111111" } })]),
    code: ['border={{', 'borderTopWidth: "2px"'],
  },

  // ── Images ────────────────────────────────────────────────────────────────────────────────────────────────────
  "image: a URL, automatic width": {
    design: design([block("image", { src: { url: "https://example.com/a.png", autoWidth: true, maxWidth: "100%" }, altText: "A" })]),
    code: ['<Image src="https://example.com/a.png" alt="A" />'],
  },
  "image: natural size, automatic width": {
    design: design([block("image", { src: { url: "https://example.com/a.png", width: 800, height: 400, autoWidth: true, maxWidth: "100%" } })]),
    code: ['src={{', "width: 800", "height: 400", "autoWidth: true"],
  },
  "image: a fixed width that's a whole pixel (45% of 480px)": {
    design: design([block("image", { src: { url: "https://example.com/a.png", width: 800, height: 400, autoWidth: false, maxWidth: "45%" }, textAlign: "left" })]),
    code: ["width={216}", 'textAlign="left"'],
  },
  "image: a fixed width that isn't (70.87% of 480px is 340.18px)": {
    design: design([block("image", { src: { url: "https://example.com/a.png", autoWidth: false, maxWidth: "70.87%" } })]),
    code: ['<Image src="https://example.com/a.png" width="70.87%" />'],
  },
  "image: a link": {
    design: design([block("image", { src: { url: "https://example.com/a.png" }, action: { name: "web", values: { href: "https://example.com", target: "_blank" } } })]),
    code: ['action={{ name: "web", values: { href: "https://example.com", target: "_blank" } }}'],
  },
  "image: a width in px": {
    design: design([block("image", { src: { url: "https://example.com/a.png", autoWidth: false, maxWidth: "200px" } })]),
    code: ['<Image src="https://example.com/a.png" width={200} />'],
    warnings: [/Row 1, column 1, block 1: its fixed width `200px` is written as the percent of its column/],
    losses: ["body.rows[0].columns[0].contents[0].values.src.maxWidth"],
  },

  // ── Other blocks ──────────────────────────────────────────────────────────────────────────────────────────────
  "divider: border and width": {
    design: design([block("divider", { width: "60%", border: { borderTopWidth: "3px", borderTopStyle: "dashed", borderTopColor: "#cccccc" }, textAlign: "left" })]),
    code: ['<Divider width="60%" borderTopWidth="3px" borderTopStyle="dashed" borderTopColor="#cccccc" textAlign="left" />'],
  },
  "html: as given": {
    design: design([block("html", { html: '<table><tr><td class="x">Cell</td></tr></table>', containerPadding: "0px" })]),
    code: ['<Html html=\'<table><tr><td class="x">Cell</td></tr></table>\' containerPadding="0px" />'],
  },
  "menu: items": {
    design: design([block("menu", { menu: { items: [{ key: "1", text: "Docs", link: { name: "web", values: { href: "https://example.com/docs", target: "_blank" } } }, { key: "2", text: "Blog", link: { name: "web", values: { href: "https://example.com/blog", target: "_self" } } }] }, separator: "|", layout: "vertical" })]),
    code: ['{ text: "Docs", href: "https://example.com/docs" }', 'target: "_self"', 'separator="|"', 'layout="vertical"'],
  },
  "menu: an item that isn't a web link": {
    design: design([block("menu", { menu: { items: [{ key: "1", text: "Call", link: { name: "phone", values: { phone: "+15550100" } } }] } })]),
    code: ['menu={{ items: [{ key: "1", text: "Call", link: { name: "phone", values: { phone: "+15550100" } } }] }}'],
  },
  "social: icons": {
    design: design([block("social", { icons: { iconType: "rounded", icons: [{ name: "Facebook", url: "https://facebook.com/acme" }, { name: "X", url: "https://x.com/acme" }] }, iconSize: 24 })]),
    code: ['{ name: "Facebook", url: "https://facebook.com/acme" }', 'iconType="rounded"', "iconSize={24}"],
  },
  "social: an icon set Elements' type doesn't list": {
    design: design([block("social", { icons: { iconType: "circle-black", icons: [{ name: "Facebook", url: "https://facebook.com/acme" }] } })]),
    code: ['iconType: "circle-black"'],
  },
  "table: headers and data": {
    design: design([block("table", { columns: 2, rows: 2, enableHeader: true, table: { headers: [{ cells: [{ text: "Item", width: 0 }, { text: "Price", width: 0 }], height: 0 }], rows: [{ cells: [{ text: "Tea", width: 0 }, { text: "$3", width: 0 }], height: 0 }, { cells: [{ text: "Cake", width: 0 }, { text: "$5", width: 0 }], height: 0 }], footers: [] }, stripedRows: true })]),
    code: ['headers={["Item", "Price"]}', 'data={[', '["Tea", "$3"]', "stripedRows"],
  },
  "table: an empty grid": {
    design: design([block("table", { columns: 3, rows: 2, table: { headers: [], rows: [0, 1].map(() => ({ cells: [0, 1, 2].map(() => ({ text: "", width: 0 })), height: 0 })), footers: [] } })]),
    code: ["<Table columns={3} rows={2} />"],
  },
  "table: footers stay in `values`": {
    design: design([block("table", { columns: 1, rows: 1, table: { headers: [], rows: [{ cells: [{ text: "A", width: 0 }], height: 0 }], footers: [{ cells: [{ text: "Total", width: 0 }], height: 0 }] } })]),
    code: ["values={{", "footers: ["],
    absent: [" as unknown as "],
  },
  "video: the editor's (with its URL)": {
    design: design([block("video", { video: { type: "youtube", videoId: "aqz-KE-bpKQ", thumbnail: "https://img.youtube.com/vi/aqz-KE-bpKQ/0.jpg", loading: false, url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ" } })]),
    code: ['url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ"'],
  },
  "video: Elements' own (a URL gives it all)": {
    design: design([block("video", { video: { type: "vimeo", videoId: "76979871", thumbnail: "", loading: false } })]),
    code: ['<Video videoUrl="https://vimeo.com/76979871" />'],
  },
  "page break: in a document": {
    design: design([block("text", { text: "One" }), block("page_break", { color: "#6b7280" }), block("text", { text: "Two" })]),
    options: { displayMode: "document" },
    code: ["<Document>", "<PageBreak />"],
  },

  // ── Device settings ───────────────────────────────────────────────────────────────────────────────────────────
  "device: phone settings and visibility": {
    design: design([
      block("heading", { text: "Phone", fontSize: "32px", _override: { mobile: { fontSize: "24px", textAlign: "center" }, desktop: { hideDesktop: true } } }),
      block("image", { src: { url: "https://example.com/a.png", autoWidth: false, maxWidth: "50%" }, _override: { mobile: { src: { autoWidth: true } } } }),
      block("button", { text: "Go", _override: { mobile: { size: { autoWidth: false, width: "100%" }, hideMobile: true } } }),
    ]),
    code: ['mobile={{ fontSize: "24px", textAlign: "center" }}', "hideOnDesktop", "mobile={{ autoWidth: true }}", 'mobile={{ width: "100%" }}', "hideOnMobile"],
  },
  "lengths: a bare zero comes back as 0px, as the design's schema types it": {
    design: design([block("text", { text: "Tight", containerPadding: "0 0 12px" }), block("button", { text: "Go", borderRadius: "0", padding: "0 24px" })], { column: { padding: "0 16px" } }),
    code: ['containerPadding="0 0 12px"', 'padding="0 24px"'],
  },
  "device: a setting the props don't have": {
    design: design([block("text", { text: "Odd", _override: { mobile: { color: "#ff0000" } } })]),
    code: ['values={{ _override: { mobile: { color: "#ff0000" } } }}'],
  },
  "device: a phone setting the block's values type doesn't have": {
    design: design([block("divider", { _override: { mobile: { color: "#ff0000" } } })]),
    // (Written as the Divider's values type, which the import names.)
    code: ['{ _override: { mobile: { color: "#ff0000" } } } as unknown as DividerProps["values"]', "Divider, type DividerProps }"],
  },

  // ── Rows and columns ──────────────────────────────────────────────────────────────────────────────────────────
  "row: its padding as the prop (the editor's, around the row)": {
    design: design([block("text", { text: "Padded" })], { row: { padding: "20px 40px", backgroundColor: "#ffffff" } }),
    code: ['<Row layout={ColumnLayouts.OneColumn} padding="20px 40px" backgroundColor="#ffffff">'],
    absent: ["values={{ padding"],
  },
  "row: zero padding is left out": {
    design: design([block("text", { text: "Flat" })], { row: { padding: "0px 0px" } }),
    code: ["<Row layout={ColumnLayouts.OneColumn}>"],
  },
  "row: phone padding, stacking and visibility": {
    design: design([block("text", { text: "A" })], { row: { _override: { mobile: { padding: "8px", noStackMobile: true, hideMobile: true } } }, cells: [1] }),
    code: ["noStackMobile", "hideOnMobile", 'mobile={{ padding: "8px" }}'],
    absent: ["_override"],
  },
  "row: cells no layout has": {
    design: design([], { columns: [{ values: {}, contents: [] }, { values: {}, contents: [] }], cells: [3, 1] }),
    code: ["<Row cells={[3, 1]}>"],
  },
  "row: a background image": {
    design: design([block("text", { text: "Over" })], { row: { backgroundImage: { url: "https://example.com/bg.png", fullWidth: false, repeat: "no-repeat", size: "cover", position: "center" }, columnsBackgroundColor: "#ffffff" } }),
    code: ['backgroundImage={{', 'url: "https://example.com/bg.png"', "fullWidth: false", 'size: "cover"', 'columnsBackgroundColor="#ffffff"'],
  },
  "column: background, border and phone padding": {
    design: design([block("text", { text: "Card" })], { column: { backgroundColor: "#f4f4f5", padding: "24px", borderRadius: "8px", border: { borderTopWidth: "1px", borderTopStyle: "solid", borderTopColor: "#e4e4e7" }, _override: { mobile: { padding: "12px" } } } }),
    code: ['backgroundColor="#f4f4f5"', 'padding="24px"', 'borderRadius="8px"', 'borderTopColor: "#e4e4e7"', 'mobile={{ padding: "12px" }}'],
  },

  // ── The body ──────────────────────────────────────────────────────────────────────────────────────────────────
  "body: email settings": {
    design: design([block("text", { text: "Hi" })], { body: { backgroundColor: "#f0f0f0", contentWidth: "600px", contentAlign: "left", preheaderText: "Your weekly digest", linkStyle: { body: true, linkColor: "#2563eb", linkHoverColor: "#0000ee", linkUnderline: false, linkHoverUnderline: true } } }),
    code: ['backgroundColor="#f0f0f0"', 'contentWidth="600px"', 'contentAlign="left"', 'previewText="Your weekly digest"', 'linkStyle={{ linkColor: "#2563eb", linkUnderline: false }}'],
  },
  "body: a web font, as <Font default>": {
    design: design([block("text", { text: "Inter" })], { body: { fontFamily: { label: "Inter", value: "'Inter', Arial, sans-serif", url: "https://fonts.googleapis.com/css2?family=Inter" } } }),
    code: ['import { Font } from "@unlayer/react-elements/font";', '<Font family="Inter" url="https://fonts.googleapis.com/css2?family=Inter" fallback="Arial, sans-serif" default />'],
    absent: ["fontFamily="],
  },
  "body: the editor's web font, kept as it is and loaded": {
    design: design([block("text", { text: "Montserrat" })], { body: { fontFamily: { label: "Montserrat", value: "'Montserrat',sans-serif", url: "https://fonts.googleapis.com/css?family=Montserrat:400,700", defaultFont: true } } }),
    code: ['<Font family="Montserrat" url="https://fonts.googleapis.com/css?family=Montserrat:400,700" />', "defaultFont: true"],
  },
  "body: a document": {
    design: design([block("text", { text: "Page" })], { body: { documentSize: "Letter", documentOrientation: "landscape", documentMargin: "48px" } }),
    options: { displayMode: "document" },
    code: ['<Document', 'documentSize="Letter"', 'documentOrientation="landscape"', 'values={{ documentMargin: "48px" }}'],
  },
  "body: a popup's settings": {
    design: design([block("text", { text: "Popup" })], { body: { popupWidth: "400px" } }),
    options: { displayMode: "popup" },
    code: ["<Page", 'values={{ popupWidth: "400px" }}'],
    warnings: [/A popup design is written as a <Page>/],
  },
  "body: the display mode the design gives": {
    design: design([block("text", { text: "Web" })], { extra: { displayMode: "web" } }),
    code: ["<Page>"],
  },

  // ── Builder settings and blocks without a component ───────────────────────────────────────────────────────────
  "builder settings: anchor, display condition, locked": {
    design: design([block("text", { text: "VIP", anchor: "vip", locked: true, displayCondition: { type: "vip", label: "VIP", description: "VIPs only", before: "{% if vip %}", after: "{% endif %}" } })]),
    code: ['anchor: "vip"', "locked: true", 'before: "{% if vip %}"'],
    absent: [" as unknown as ", "builderValues"],
  },
  "builder flags renderToJson can't keep": {
    design: design([block("text", { text: "Fixed", selectable: false, deletable: false })], { row: { draggable: false } }),
    code: ['<Paragraph html="Fixed" />'],
    warnings: [/Row 1: `draggable` is false/, /Row 1, column 1, block 1: `selectable`, `deletable` are false/],
    losses: ["body.rows[0].values.draggable", "body.rows[0].columns[0].contents[0].values.selectable", "body.rows[0].columns[0].contents[0].values.deletable"],
  },
  "a custom tool, with the exported HTML": {
    design: design([block("custom", { _meta: { htmlID: "u_content_custom_rating_1", htmlClassNames: "u_content_custom_rating" }, stars: 4, containerPadding: "20px" }, { slug: "rating" })]),
    options: { html: '<div id="u_content_custom_rating_1" class="u_content_custom_rating"><div class="v-container-padding-padding" style="padding: 20px"><div class="stars">★★★★☆</div></div></div>' },
    code: ['<Html html=\'<div class="stars">★★★★☆</div>\' containerPadding="20px" />'],
    warnings: [/Row 1, column 1, block 1: a custom "rating" block has no Elements component, so it's kept as an <Html> block/],
    losses: ["body.rows[0].columns[0].contents[0].type", "body.rows[0].columns[0].contents[0].slug", "body.rows[0].columns[0].contents[0].values.stars", "body.rows[0].columns[0].contents[0].values.html"],
  },
  "a timer without exported HTML": {
    design: design([block("text", { text: "Before" }), block("timer", { countdown: { endTime: "2026-12-31T00:00:00Z" } })]),
    code: ['{/* TODO: a "timer" block (Row 1, column 1, block 2) has no Elements component.'],
    warnings: [/Row 1, column 1, block 2: a "timer" block has no Elements component and no exported HTML/],
    losses: ["body.rows[0].columns[0].contents"],
  },
  "warnings: ids, schema version, document headers": {
    design: design([{ id: "abc", type: "text", values: { text: "Old" } }], { extra: { schemaVersion: 12 }, headers: [{ cells: [1], columns: [], values: {} }] }),
    code: ['<Paragraph html="Old" />'],
    warnings: [/ids aren't kept/, /schema \(version 12\) is older/, /The design's headers/],
    losses: ["body.headers"],
  },
};
