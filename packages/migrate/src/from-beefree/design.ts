/**
 * The Unlayer design, built in the shape `renderToJson()` writes it: every row, column and block with the values
 * Elements writes for it (each type's defaults, then what the template sets), its `_meta` ids, and the counters.
 * The tests check these defaults against what renderToJson writes, so the design's TSX (`designToElements()`) is
 * written with only what the template changed.
 */
import type { Design, DesignColumn, DesignContent, DesignRow, Values } from "./types";

/** The editor's design schema version, as `renderToJson()` writes it (`schemaVersion` in `@unlayer/exporters`). */
export const SCHEMA_VERSION = 27;

const LINK_STYLE = { inherit: true, linkColor: "#0000ee", linkHoverColor: "#0000ee", linkUnderline: true, linkHoverUnderline: true };
const WEB_LINK = (href = "", target = "_blank") => ({ name: "web", values: { href, target } });

/** What renderToJson writes for each content type with no props (its own content left out). */
export const CONTENT_DEFAULTS: Record<string, () => Values> = {
  text: () => ({ fontSize: "14px", textAlign: "left", lineHeight: "140%", linkStyle: { ...LINK_STYLE }, color: "#000000" }),
  heading: () => ({ headingType: "h1", fontSize: "22px", textAlign: "left", lineHeight: "140%", linkStyle: { ...LINK_STYLE }, color: "#000000", fontWeight: 400 }),
  button: () => ({
    href: WEB_LINK(),
    buttonColors: { color: "#FFFFFF", backgroundColor: "#0879A1", hoverColor: "#FFFFFF", hoverBackgroundColor: "#0879A1" },
    size: { autoWidth: true, width: "100%" },
    fontSize: "14px",
    lineHeight: "120%",
    textAlign: "center",
    padding: "10px 20px",
    border: {},
    borderRadius: "4px",
  }),
  image: () => ({ textAlign: "center", altText: "", action: WEB_LINK() }),
  divider: () => ({ width: "100%", border: { borderTopWidth: "1px", borderTopStyle: "solid", borderTopColor: "#BBBBBB" }, textAlign: "center" }),
  html: () => ({}),
  menu: () => ({ menu: { items: [] }, fontSize: "14px", textColor: "#444444", linkColor: "#0068A5", align: "center", layout: "horizontal", separator: "", padding: "5px 15px" }),
  social: () => ({ icons: { iconType: "circle", icons: [] }, align: "center", iconSize: 32, spacing: 5 }),
  video: () => ({ video: {} }),
};

const BLOCK_FLAGS = { selectable: true, draggable: true, duplicatable: true, deletable: true, hideable: true };

export const ROW_DEFAULTS = (): Values => ({
  displayCondition: null,
  columns: false,
  _styleGuide: null,
  backgroundColor: "",
  columnsBackgroundColor: "",
  backgroundImage: { url: "", fullWidth: true, repeat: "no-repeat", size: "custom", position: "center" },
  padding: "0px",
  anchor: "",
  noStackMobile: false,
});

export const COLUMN_DEFAULTS = (): Values => ({ backgroundColor: "", padding: "0px", border: {}, borderRadius: "0px" });

export const BODY_DEFAULTS = (): Values => ({
  _styleGuide: null,
  borderRadius: "10px",
  contentAlign: "center",
  contentVerticalAlign: "middle",
  contentWidth: "600px",
  displayMode: "email",
  fontFamily: { label: "Arial", value: "arial,helvetica,sans-serif" },
  textColor: "#000000",
  language: {},
  backgroundColor: "#F7F8F9",
  documentSize: "A4",
  documentOrientation: "portrait",
  documentMargin: "96px",
  preheaderText: "",
  linkStyle: { body: true, linkColor: "#0000ee", linkHoverColor: "#0000ee", linkUnderline: true, linkHoverUnderline: true },
  backgroundImage: { url: "", fullWidth: true, repeat: "no-repeat", size: "custom", position: "center" },
  accessibilityTitle: "",
});

/** Device settings (`_override`), without empty devices; undefined when there are none. */
export function override(mobile: Values, desktop: Values = {}): Values | undefined {
  const out: Values = {};
  if (Object.keys(mobile).length) out.mobile = mobile;
  if (Object.keys(desktop).length) out.desktop = desktop;
  return Object.keys(out).length ? out : undefined;
}

/** Builds a design's nodes, numbering them as renderToJson does (`u_row_1`, `u_content_text_3`). */
export class DesignBuilder {
  readonly counters: Record<string, number> = {};

  private next(kind: string): number {
    this.counters[kind] = (this.counters[kind] ?? 0) + 1;
    return this.counters[kind];
  }

  content(type: string, values: Values, device?: Values): DesignContent {
    const kind = `u_content_${type}`;
    const n = this.next(kind);
    return {
      type,
      values: {
        containerPadding: "10px",
        ...(CONTENT_DEFAULTS[type]?.() ?? {}),
        ...values,
        ...(device ? { _override: device } : {}),
        _meta: { htmlID: `${kind}_${n}`, htmlClassNames: kind },
        ...BLOCK_FLAGS,
      },
    };
  }

  column(contents: DesignContent[], values: Values, device?: Values): DesignColumn {
    const n = this.next("u_column");
    return {
      contents,
      values: {
        ...COLUMN_DEFAULTS(),
        ...values,
        _meta: { htmlID: `u_column_${n}`, htmlClassNames: "u_column" },
        deletable: true,
        locked: false,
        ...(device ? { _override: device } : {}),
      },
    };
  }

  /** A row: its columns must be built first (rows number after them, as their order in the design doesn't matter). */
  row(cells: number[], columns: DesignColumn[], values: Values, device?: Values): DesignRow {
    const n = this.next("u_row");
    return {
      cells,
      columns,
      values: {
        ...ROW_DEFAULTS(),
        ...values,
        _meta: { htmlID: `u_row_${n}`, htmlClassNames: "u_row" },
        ...BLOCK_FLAGS,
        locked: false,
        ...(device ? { _override: device } : {}),
        cells,
      },
    };
  }

  design(rows: DesignRow[], body: Values): Design {
    return {
      counters: { ...this.counters },
      body: { rows, values: { ...BODY_DEFAULTS(), ...body, _meta: { htmlID: "u_body", htmlClassNames: "u_body" } } },
      schemaVersion: SCHEMA_VERSION,
    };
  }
}
