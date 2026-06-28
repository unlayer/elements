/**
 * renderToJson — Convert a React element tree to Unlayer's DesignJSON format.
 *
 * Walks the React element tree statically via React.Children and extracts
 * values at each level. No HTML rendering is performed.
 *
 * Produces the { body: { rows, values }, counters, schemaVersion } structure
 * that the Unlayer editor uses, enabling round-tripping: build with React
 * components → export as JSON → load into the Unlayer editor.
 */

import React from "react";
import type {
  DesignJSON,
  DesignBody,
  DesignRow,
  DesignColumn,
  DesignContent,
} from "@unlayer-internal/shared-elements";
import { mergeValues } from "@unlayer-internal/shared-elements";
// Schema version from the exporters bundle — matches the editor's currentVersion
// at the time the exporters were generated. This ensures renderToJson output is
// recognized as current by the editor, skipping unnecessary migrations.
// Falls back to 24 for older exporters packages that don't export this yet.
import { schemaVersion as _schemaVersion } from "@unlayer/exporters";
const schemaVersion: number = _schemaVersion ?? 24;
import { mapSemanticProps } from "./semantic-props";
import { UNLAYER_CONFIG_KEY } from "./create-component";
import { BODY_DEFAULTS, ROW_DEFAULTS, COLUMN_DEFAULTS } from "./container-defaults";
import { contentSlotWidth, pinImageSrc, type SlotContext } from "./image-sizing";

/** Layout context threaded down the walk so an image can be sized against the
 *  real column slot (contentWidth × column share, minus paddings/borders). */
type LayoutContext = Pick<
  SlotContext,
  "bodyValues" | "rowValues" | "rowCells" | "columnIndex" | "columnValues"
>;

// ============================================
// Tree helpers (inlined)
// ============================================

/** Get the displayName of a React element's component type. */
function getDisplayName(element: React.ReactElement): string | undefined {
  const type = element.type as any;
  return type?.displayName || type?.name;
}

/** The root components renderToJson understands. */
const VALID_ROOTS = new Set(["Body", "Email", "Page", "Document"]);

/**
 * Unwrap a user wrapper component down to the underlying root element.
 * `renderToHtml` renders wrappers through React; `renderToJson` walks the element
 * tree, so a custom component that *returns* <Email>/<Body>/<Page>/<Document>
 * (e.g. `renderToJson(<MyEmail/>)`) must be invoked first. Only plain function
 * components are unwrapped — anything else (class / forwardRef / memo) falls
 * through to the clear root-type error.
 */
function unwrapRoot(element: React.ReactElement): React.ReactElement {
  let current = element;
  for (let depth = 0; depth < 10; depth++) {
    const name = getDisplayName(current);
    if (name && VALID_ROOTS.has(name)) break;
    const type = current.type as any;
    const isPlainFunctionComponent =
      typeof type === "function" && !type.prototype?.isReactComponent;
    if (!isPlainFunctionComponent) break;
    // Invoking the wrapper can throw (e.g. it uses React hooks, which aren't
    // valid when called outside React's render). Turn that into an actionable
    // message instead of a bare "Invalid hook call".
    let produced: unknown;
    try {
      produced = type({ ...(current.props as Record<string, unknown>) });
    } catch (cause) {
      const detail = cause instanceof Error ? cause.message : String(cause);
      throw new Error(
        `[Unlayer] renderToJson: could not unwrap <${name || "wrapper"}>. A wrapper must ` +
          `be a plain component that synchronously returns a root (<Email>, <Page>, ` +
          `<Document>, or <Body>) and uses no React hooks. Pass the root element directly — ` +
          `e.g. renderToJson(<Email>…</Email>). (${detail})`
      );
    }
    if (!React.isValidElement(produced)) break;
    current = produced;
  }
  return current;
}

/** Collect valid React element children from a node. */
function collectChildren(node: React.ReactNode): React.ReactElement[] {
  const result: React.ReactElement[] = [];
  React.Children.forEach(node, (child) => {
    if (React.isValidElement(child)) {
      result.push(child);
    }
  });
  return result;
}

/**
 * Strip internal/base props from an element's props,
 * returning only the semantic props that should be mapped to values.
 */
function extractSemanticProps(
  props: Record<string, any>,
  extraKeys: string[] = []
): Record<string, any> {
  const internalKeys = new Set([
    "children",
    "mode",
    "className",
    "style",
    "index",
    "colIndex",
    "cells",
    "bodyValues",
    "rowValues",
    "_config",
    "config",
    "previewText",
    "layout",
    "collection",
    ...extraKeys,
  ]);

  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(props)) {
    if (!internalKeys.has(key) && value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

/** Increment and return counter for a given key. */
function nextCounter(counters: Record<string, number>, key: string): number {
  counters[key] = (counters[key] || 0) + 1;
  return counters[key];
}

// ============================================
// Helpers
// ============================================

/** Map component displayName to Unlayer content type.
 *  Paragraph maps to "text" (the legacy content type that uses plain HTML
 *  values.text) for universal editor compatibility. The newer "paragraph"
 *  content type uses Lexical textJson which requires specific editor support.
 */
function toContentType(displayName: string): string {
  if (displayName === "Paragraph") return "text";
  return displayName.toLowerCase();
}

/** Generate a unique ID like "u_row_1", "u_content_button_2" */
function makeId(prefix: string, counter: number): string {
  return `${prefix}_${counter}`;
}

/**
 * Extract plain text/HTML from a textJson string without needing a DOM.
 * Handles both Lexical JSON format and the __html passthrough format.
 */
function extractTextFromTextJson(textJson: string): string {
  try {
    const parsed = JSON.parse(textJson);

    // __html passthrough (from htmlToTextJson)
    if (parsed.__html) return parsed.__html;

    // Lexical JSON — walk the tree and extract text content
    const root = parsed?.root;
    if (!root?.children) return "";

    const paragraphs: string[] = [];
    for (const paragraph of root.children) {
      if (!paragraph?.children) continue;
      const parts: string[] = [];
      for (const node of paragraph.children) {
        if (node?.text) parts.push(node.text);
      }
      paragraphs.push(parts.join(""));
    }
    return paragraphs.join("\n");
  } catch {
    return "";
  }
}

// ============================================
// Tree processors
// ============================================

function processItem(
  element: React.ReactElement,
  counters: Record<string, number>,
  layout: LayoutContext = {}
): DesignContent {
  const componentType = element.type as any;
  const config = componentType[UNLAYER_CONFIG_KEY];

  if (!config) {
    const name = getDisplayName(element) || "Unknown";
    throw new Error(
      `[Unlayer] renderToJson: <${name}> is not a recognized Unlayer item component. ` +
        `Only components created with createItemComponent are supported.`
    );
  }

  const { name, defaultValues, propMapper } = config;
  const contentType = toContentType(name);
  const count = nextCounter(counters, `u_content_${contentType}`);
  const id = makeId(`u_content_${contentType}`, count);

  // Map props through the item's own propMapper, then merge with defaults
  const { children, ...restProps } = element.props;
  const mappedValues = propMapper({ children, ...restProps });
  const finalValues = mergeValues(defaultValues, mappedValues);

  // Paragraph maps to "text" content type — convert textJson to plain text/HTML.
  // Extract text directly from the Lexical JSON structure (no DOM needed).
  if (contentType === "text" && finalValues.textJson) {
    finalValues.text = extractTextFromTextJson(finalValues.textJson);
    delete finalValues.textJson;
  }

  // Add containerPadding (base content option) and _meta
  const values = {
    containerPadding: "10px",
    ...finalValues,
    _meta: {
      htmlID: id,
      htmlClassNames: `u_content_${contentType}`,
      ...(finalValues._meta || {}),
    },
    selectable: true,
    draggable: true,
    duplicatable: true,
    deletable: true,
    hideable: true,
  };

  // Convert a fixed (px) image pin to a percent of the column slot using the
  // threaded geometry, so the display width survives the JSON round-trip into an
  // editor. Guarded on `src.autoWidth === false`, so only pinned images change.
  const itemSrc = (values as Record<string, any>).src;
  if (itemSrc && typeof itemSrc === "object" && itemSrc.autoWidth === false) {
    const availableWidth = contentSlotWidth({
      ...layout,
      containerPadding: (values as Record<string, any>).containerPadding,
    });
    (values as Record<string, any>).src = pinImageSrc(itemSrc, availableWidth);
  }

  return { type: contentType, values };
}

function processColumn(
  element: React.ReactElement,
  counters: Record<string, number>,
  layout: Omit<LayoutContext, "columnValues"> = {}
): DesignColumn {
  const count = nextCounter(counters, "u_column");
  const id = makeId("u_column", count);

  // Extract semantic props for column values, then merge with defaults
  const semanticProps = extractSemanticProps(element.props);
  const mapped = mapSemanticProps(semanticProps, COLUMN_DEFAULTS, "Column");
  const values = mergeValues(COLUMN_DEFAULTS, mapped);

  // Add _meta
  const valuesWithMeta = {
    ...values,
    _meta: {
      htmlID: id,
      htmlClassNames: "u_column",
      ...(values._meta || {}),
    },
  };

  // Process item children
  const contents: DesignContent[] = [];
  const children = collectChildren(element.props.children);

  const itemLayout: LayoutContext = { ...layout, columnValues: valuesWithMeta };
  for (const child of children) {
    contents.push(processItem(child, counters, itemLayout));
  }

  return { contents, values: valuesWithMeta };
}

function processRow(
  element: React.ReactElement,
  counters: Record<string, number>,
  parentLayout: Pick<LayoutContext, "bodyValues"> = {}
): DesignRow {
  const count = nextCounter(counters, "u_row");
  const id = makeId("u_row", count);

  // Determine cells from layout or cells prop
  const { layout, cells: propsCells } = element.props;
  let cells: number[];
  if (layout) {
    cells = layout.cells;
  } else if (propsCells) {
    cells = propsCells;
  } else {
    // Default: one equal cell per Column child. Count only <Column> children —
    // any stray non-Column child is warned and skipped below, so including it
    // would make `cells` longer than the column list and distort both the row
    // layout and the column-share math used for image sizing.
    const columnCount = Math.max(
      1,
      collectChildren(element.props.children).filter(
        (child) => getDisplayName(child) === "Column"
      ).length
    );
    cells = Array(columnCount).fill(1);
  }

  // Extract semantic props for row values, then merge with defaults
  const semanticProps = extractSemanticProps(element.props, ["layout"]);
  const mapped = mapSemanticProps(semanticProps, ROW_DEFAULTS, "Row");
  const values = mergeValues(ROW_DEFAULTS, mapped);

  // Add cells, columns flag, editor flags, and _meta
  const valuesWithMeta = {
    ...values,
    columns: values.columns ?? false,
    cells,
    _meta: {
      htmlID: id,
      htmlClassNames: "u_row",
      ...(values._meta || {}),
    },
    selectable: true,
    draggable: true,
    duplicatable: true,
    deletable: true,
    hideable: true,
  };

  // Process Column children
  const columns: DesignColumn[] = [];
  const children = collectChildren(element.props.children);

  const columnLayout: Omit<LayoutContext, "columnValues"> = {
    bodyValues: parentLayout.bodyValues,
    rowValues: valuesWithMeta,
    rowCells: cells,
  };
  let columnIndex = 0;
  for (const child of children) {
    const name = getDisplayName(child);
    if (name === "Column") {
      columns.push(
        processColumn(child, counters, { ...columnLayout, columnIndex })
      );
      columnIndex += 1;
    } else {
      console.warn(
        `[Unlayer] renderToJson: <${name}> is not a valid Row child. Only <Column> is allowed.`
      );
    }
  }

  return { cells, columns, values: valuesWithMeta };
}

function processBody(
  element: React.ReactElement,
  counters: Record<string, number>
): DesignBody {
  const id = "u_body";

  // Extract semantic props for body values, then merge with defaults
  const semanticProps = extractSemanticProps(element.props);
  const mapped = mapSemanticProps(semanticProps, BODY_DEFAULTS, "Body");
  const values = mergeValues(BODY_DEFAULTS, mapped);

  // `previewText` is the React alias for the schema's `preheaderText`. It is
  // excluded from the mapped values (it drives the email preview HTML at render
  // time), so thread it into the JSON here so it is preserved in the output.
  const previewText = (element.props as { previewText?: string }).previewText;
  if (previewText !== undefined) {
    (values as Record<string, unknown>).preheaderText = previewText;
  }

  // Add _meta
  const valuesWithMeta = {
    ...values,
    _meta: {
      htmlID: id,
      htmlClassNames: "u_body",
      ...(values._meta || {}),
    },
  };

  // Process Row children
  const rows: DesignRow[] = [];
  const children = collectChildren(element.props.children);

  for (const child of children) {
    const name = getDisplayName(child);
    if (name === "Row") {
      rows.push(processRow(child, counters, { bodyValues: valuesWithMeta }));
    } else {
      console.warn(
        `[Unlayer] renderToJson: <${name}> is not a valid Body child. Only <Row> is allowed.`
      );
    }
  }

  return {
    rows,
    values: valuesWithMeta,
  } as DesignBody;
}

// ============================================
// Public API
// ============================================

/**
 * Convert a React element tree to Unlayer's DesignJSON format.
 *
 * The root element must be a `<Body>`, `<Email>`, `<Page>`, or `<Document>`.
 * The tree is walked statically — no HTML rendering is performed.
 *
 * @param element - A React element tree with Body > Row > Column > Item structure
 * @returns DesignJSON object compatible with the Unlayer editor
 * @throws {Error} If the root element is not a recognized container component
 *
 * @example
 * ```tsx
 * import { renderToJson, Body, Row, Column, Paragraph } from "@unlayer/react-elements";
 *
 * const design = renderToJson(
 *   <Body backgroundColor="#ffffff" contentWidth="600px">
 *     <Row>
 *       <Column>
 *         <Paragraph>Hello World</Paragraph>
 *       </Column>
 *     </Row>
 *   </Body>
 * );
 * ```
 */
/**
 * Convert a single `<Row>` element to Unlayer's row JSON format.
 *
 * Use this when targeting a Block Editor, which works with individual rows
 * rather than full design JSON. For full designs, use `renderToJson` instead.
 *
 * @param element - A React element tree with Row > Column > Item structure
 * @returns A DesignRow object compatible with the Unlayer block editor
 * @throws {Error} If the element is not a `<Row>`
 *
 * @example
 * ```tsx
 * import { renderRowToJson, Row, Column, Paragraph } from "@unlayer/react-elements";
 *
 * const row = renderRowToJson(
 *   <Row>
 *     <Column>
 *       <Paragraph>Hello World</Paragraph>
 *     </Column>
 *   </Row>
 * );
 * ```
 */
export function renderRowToJson(element: React.ReactElement): DesignRow {
  const displayName = getDisplayName(element);

  if (displayName !== "Row") {
    throw new Error(
      `[Unlayer] renderRowToJson: Element must be <Row>, ` +
        `but got <${displayName || "unknown"}>. ` +
        `For full designs, use renderToJson instead.`
    );
  }

  const counters: Record<string, number> = {};
  return processRow(element, counters);
}

export function renderToJson(element: React.ReactElement): DesignJSON {
  // Accept a user wrapper component (e.g. <MyEmail/>) by unwrapping to its root,
  // matching renderToHtml which renders wrappers through React.
  element = unwrapRoot(element);
  const displayName = getDisplayName(element);

  if (!displayName || !VALID_ROOTS.has(displayName)) {
    throw new Error(
      `[Unlayer] renderToJson: Root element must be <Body>, <Email>, <Page>, or <Document>, ` +
        `but got <${displayName || "unknown"}>. ` +
        `Wrap your content: <Body><Row><Column>...</Column></Row></Body>`
    );
  }

  // Email/Page/Document are thin wrappers around Body — for JSON purposes,
  // we treat them identically: extract props directly from the wrapper element.
  // The wrapper's own render function would re-render as Body, but we don't
  // call render — we just walk the element tree.

  // For Email/Page/Document, the children and semantic props are on the
  // wrapper element directly, same as Body.
  const counters: Record<string, number> = {};
  const body = processBody(element, counters);

  return {
    counters,
    body,
    schemaVersion,
  };
}
