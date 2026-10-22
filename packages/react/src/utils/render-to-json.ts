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
  UnlayerConfig,
} from "@unlayer-internal/shared-elements";
import { mergeValues, pxMerged, pxZeros, textJsonToText } from "@unlayer-internal/shared-elements";
// Schema version from the exporters bundle — matches the editor's currentVersion
// at the time the exporters were generated. This ensures renderToJson output is
// recognized as current by the editor, skipping unnecessary migrations.
// Falls back to 24 for older exporters packages that don't export this yet.
import { schemaVersion as _schemaVersion } from "@unlayer/exporters";
const schemaVersion: number = _schemaVersion ?? 24;
import { mapSemanticProps } from "./semantic-props";
import { componentName, getDisplayName, providedConfig, unwrapRoot } from "./unwrap-root";
import { rootName } from "./root-type";
import { rootConfig, rootMode, type RootConfigProps } from "../context/layer-config";
import { BODY_DEFAULTS, ROW_DEFAULTS, COLUMN_DEFAULTS } from "./container-defaults";
import { contentSlotWidth, pinImageSrc, type SlotContext } from "./image-sizing";
import { failedBefore, sayOnce, setRenderConfig, withOwnScope } from "./render-scope";
import { renderBody } from "./render-to-html";
import { collect, KEPT, normalizedChildren, normalizedRoot } from "../model";
import type { Recorded } from "./collect";
import { rtlAlign, textDirectionOf, UNLAYER_CONFIG_KEY } from "./create-component";
import { TAILWIND } from "./tailwind";
import { fontUrlInDesign, safeUrl, urlFamilies } from "./font-design";
import { omits } from "../engine/errors";

/** Layout context threaded down the walk so an image can be sized against the
 *  real column slot (contentWidth × column share, minus paddings/borders). */
type LayoutContext = Pick<
  SlotContext,
  "bodyValues" | "rowValues" | "rowCells" | "columnIndex" | "columnValues"
>;

// ============================================
// Tree helpers (inlined)
// ============================================



/**
 * Unwrap a user wrapper component (e.g. `renderToJson(<MyEmail/>)`) down to
 * its root element: renderToJson walks the element tree, so the wrapper must
 * be called first. What a wrapper throws is thrown as renderToHtml throws it
 * (a RenderError naming it, with its `cause`), as is an async one, which this
 * renderer can't wait for (saying what to do instead).
 */
const unwrapForJson = (element: React.ReactElement, idPrefix?: string): React.ReactElement => unwrapRoot(element, "renderToJson", idPrefix).root;

/** The elements in children (lists flattened): the model's Rows, Columns and blocks (see src/model). */
export function elementsIn(children: React.ReactNode, out: React.ReactElement<any>[] = []): React.ReactElement<any>[] {
  if (Array.isArray(children)) for (const child of children) elementsIn(child, out);
  else if (React.isValidElement(children)) out.push(children);
  return out;
}

/**
 * The element children of a collected (Elements-only) tree; a Row or block whose HTML failed in this render
 * (`onError: "omit"`) left out, as in the HTML.
 */
const collectChildren = (node: React.ReactNode): React.ReactElement<any>[] => elementsIn(node).filter((child) => !failedBefore(child.props._record));

/**
 * Strip internal/base props from an element's props,
 * returning only the semantic props that should be mapped to values.
 */
export function extractSemanticProps(props: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const key of Object.keys(props)) if (!INTERNAL.has(key) && props[key] !== undefined) result[key] = props[key];
  return result;
}

const INTERNAL = new Set("children mode className style index colIndex cells bodyValues rowValues _config _record config previewText fonts lang layout collection".split(" "));

/** A block's props the design doesn't hold (its children are its text: see processItem; `_sanitized`: Markdown's). */
const CODE_ONLY = new Set(["children", "style", "className", "skipInText", "_record", "_sanitized"]);

/** What makes a row or block editable in the editor. */
const EDITABLE = { selectable: true, draggable: true, duplicatable: true, deletable: true, hideable: true };

/** A component's `style`, `className` and `skipInText`, which the design can't hold: said once per render. */
function codeOnly(name: string, props: Record<string, any>): void {
  if (!props.style && !props.className && !props.skipInText) return;
  // (Not a style a <Tailwind>'s classes give, which it says.)
  const keys = [...Object.keys(props.style ?? {}).filter((key) => !props.style[TAILWIND]?.includes(key)).map((key) => `style.${key}`), ...["className", "skipInText"].filter((key) => props[key])];
  if (keys.length) sayOnce(`[Unlayer] ${name} \`${keys.join("`, `")}\` ${keys.length > 1 ? "are" : "is"} kept in HTML but not in the design for the visual editor.`);
}

/** Increment and return counter for a given key. */
export function nextCounter(counters: Record<string, number>, key: string): number {
  counters[key] = (counters[key] || 0) + 1;
  return counters[key];
}

// ============================================
// Tree processors
// ============================================

function processItem(
  element: React.ReactElement,
  counters: Record<string, number>,
  layout: LayoutContext = {},
  /** The id and class base, when not the item's own (markup kept as an HTML block, named after its component). */
  metaName?: string
): DesignContent {
  const componentType = element.type as any;
  const config = componentType[UNLAYER_CONFIG_KEY];

  if (!config && componentType?.[KEPT]) {
    // Markup a component of the user's own rendered in a Column: an HTML block, numbered as the HTML numbers it.
    return processItem(componentType[KEPT], counters, layout, (componentType.displayName || componentType.name || "component").toLowerCase());
  }
  if (!config) {
    const name = componentName(element) || "Unknown";
    throw new Error(
      `[Unlayer] renderToJson: <${name}> is not a recognized Unlayer item component. ` +
        `Only components created with createItemComponent are supported.`
    );
  }

  const { name, defaultValues, propMapper, slug } = config;
  // Paragraph is "text" (the content type whose values.text is plain HTML), which every editor reads; the newer
  // "paragraph" type's Lexical textJson needs specific editor support.
  const contentType = config.contentType ?? (name === "Paragraph" ? "text" : name.toLowerCase());
  // Custom tools use u_content_custom_<slug> as their id/class base
  const metaBase = `u_content_${metaName ?? config.metaName ?? contentType}`;
  const id = `${metaBase}_${nextCounter(counters, metaBase)}`;

  // Map props through the item's own propMapper (but what the design can't hold, said and left out), then merge with
  // defaults, after the base content option every block has, containerPadding.
  const props = element.props as Record<string, any>;
  codeOnly(name, props);
  const given: Record<string, any> = { children: props.children };
  for (const key in props) if (!CODE_ONLY.has(key)) given[key] = props[key];
  const mappedValues = propMapper(given);
  rtlAlign(mappedValues, defaultValues, (layout.bodyValues as { textDirection?: unknown } | undefined)?.textDirection);
  // (Bare zeros in px lengths written `0px`, as the design's schema types them: see pxZeros. A custom tool's values
  // are as it writes them.)
  const values: Record<string, any> = slug ? { containerPadding: "10px", ...mergeValues(defaultValues, mappedValues) } : pxMerged(defaultValues, mappedValues, "", { containerPadding: "10px" });

  // Paragraph maps to "text" content type: its textJson as the HTML the text block holds, which its HTML renders too
  // (see Paragraph.tsx).
  if (contentType === "text" && values.textJson) {
    values.text = textJsonToText(values.textJson);
    delete values.textJson;
  }

  // Its _meta and the editor's flags
  values._meta = { htmlID: id, htmlClassNames: metaBase, ...(values._meta || {}) };
  Object.assign(values, EDITABLE);

  // Convert a fixed (px) image pin to a percent of the column slot using the
  // threaded geometry, so the display width survives the JSON round-trip into an
  // editor. Guarded on `src.autoWidth === false`, so only pinned images change.
  const itemSrc = (values as Record<string, any>).src;
  if (itemSrc && typeof itemSrc === "object" && itemSrc.autoWidth === false) {
    const availableWidth = contentSlotWidth({
      ...layout,
      containerPadding: (values as Record<string, any>).containerPadding,
    });
    (values as Record<string, any>).src = pxZeros(pinImageSrc(itemSrc, availableWidth));
  }

  return slug ? { type: contentType, slug, values } : { type: contentType, values };
}

function processColumn(
  element: React.ReactElement,
  counters: Record<string, number>,
  layout: Omit<LayoutContext, "columnValues"> = {}
): DesignColumn {
  const id = `u_column_${nextCounter(counters, "u_column")}`;

  // Extract semantic props for column values, then merge with defaults
  codeOnly("Column", element.props);
  const semanticProps = extractSemanticProps(element.props);
  const mapped = mapSemanticProps(semanticProps, COLUMN_DEFAULTS, "Column");
  const valuesWithMeta = pxMerged(COLUMN_DEFAULTS, mapped) as Record<string, any>;

  // Add _meta
  valuesWithMeta._meta = { htmlID: id, htmlClassNames: "u_column", ...(valuesWithMeta._meta || {}) };

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
  const id = `u_row_${nextCounter(counters, "u_row")}`;

  // Cells from the layout or cells prop. Default: one equal cell per Column child. Count only <Column> children —
  // any stray non-Column child is warned and skipped below, so including it would make `cells` longer than the
  // column list and distort both the row layout and the column-share math used for image sizing.
  const cells: number[] =
    element.props.layout?.cells ?? element.props.cells ?? Array(Math.max(1, collectChildren(element.props.children).filter((child) => getDisplayName(child) === "Column").length)).fill(1);

  // Extract semantic props for row values, then merge with defaults
  codeOnly("Row", element.props);
  const semanticProps = extractSemanticProps(element.props);
  const mapped = mapSemanticProps(semanticProps, ROW_DEFAULTS, "Row");
  const valuesWithMeta = pxMerged(ROW_DEFAULTS, mapped) as Record<string, any>;

  // Add cells, columns flag, editor flags, and _meta
  valuesWithMeta.columns = valuesWithMeta.columns ?? false;
  valuesWithMeta.cells = pxZeros(cells);
  valuesWithMeta._meta = { htmlID: id, htmlClassNames: "u_row", ...(valuesWithMeta._meta || {}) };
  Object.assign(valuesWithMeta, EDITABLE);

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
        `[Unlayer] renderToJson: <${componentName(child) ?? String(child.type)}> is not a valid Row child. Only <Column> is allowed.`
      );
    }
  }

  return { cells: pxZeros(cells), columns, values: valuesWithMeta };
}

function processBody(
  element: React.ReactElement,
  counters: Record<string, number>,
  /** The mode the root renders in (see rootMode). */
  mode: string,
  /** The config of the <UnlayerProvider>s around the root (see unwrap-root.ts). */
  provided?: Partial<UnlayerConfig>
): DesignBody {
  const id = "u_body";

  // Extract semantic props for body values, then merge with defaults
  codeOnly(getDisplayName(element) ?? "Body", element.props);
  const semanticProps = extractSemanticProps(element.props);
  const mapped = mapSemanticProps(semanticProps, BODY_DEFAULTS, "Body");
  const values = pxMerged(BODY_DEFAULTS, mapped);
  // The direction the HTML has (its `config`, its `textDirection`, the Provider's: see rootConfig), so the editor opens
  // the design as it renders. Only ltr, rtl or auto, as in the HTML (a value from a request could carry anything).
  const direction = textDirectionOf(rootConfig(element.props as RootConfigProps, provided).textDirection);
  if (direction) (values as Record<string, unknown>).textDirection = direction;
  else delete (values as Record<string, unknown>).textDirection;
  // The mode the HTML renders in (email, web or document), which the editor keeps and opens the design in.
  (values as Record<string, unknown>).displayMode = mode;

  // `previewText` is the React alias for the schema's `preheaderText`. It is
  // excluded from the mapped values (it drives the email preview HTML at render
  // time), so thread it into the JSON here so it is preserved in the output.
  const previewText = (element.props as { previewText?: string }).previewText;
  if (previewText !== undefined) {
    (values as Record<string, unknown>).preheaderText = previewText;
  }

  // Add _meta
  const valuesWithMeta = values as Record<string, any>;
  valuesWithMeta._meta = { htmlID: id, htmlClassNames: "u_body", ...(valuesWithMeta._meta || {}) };

  // Process Row children
  const rows: DesignRow[] = [];
  const children = collectChildren(element.props.children);

  for (const child of children) {
    const name = getDisplayName(child);
    if (name === "Row") {
      rows.push(processRow(child, counters, { bodyValues: valuesWithMeta }));
    } else {
      console.warn(
        `[Unlayer] renderToJson: <${componentName(child) ?? String(child.type)}> is not a valid Body child. Only <Row> is allowed.`
      );
    }
  }

  return {
    rows,
    values: valuesWithMeta,
  } as DesignBody;
}

/**
 * A root's `fonts` (stylesheets its HTML links) in the design, as a <Font>'s are: each URL on the design's fonts of
 * the families it names (see urlFamilies), so the editor loads it too. One that names no family the design has a font
 * of is said (its start, for a long one): the HTML loads it, the editor doesn't.
 */
function rootFonts(element: React.ReactElement, name: string, body: DesignBody): void {
  for (const font of (element.props as { fonts?: Array<{ url?: unknown }> }).fonts ?? []) {
    if (!font?.url) continue;
    const url = safeUrl(String(font.url));
    let held = false;
    for (const family of urlFamilies(url)) held = fontUrlInDesign(family, url, body) || held;
    if (!held) sayOnce(`[Unlayer] ${name} \`fonts\` URL ${url.length > 80 ? `${url.slice(0, 79)}…` : url} is kept in HTML but not in the design for the visual editor: it names no family (\`family=\`) that a \`fontFamily\` in the design has. <Font family url default> ("@unlayer/react-elements/font") makes a font the template's in both.`);
  }
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
 * @throws {Error} If the element is not a `<Row>`, or its Columns don't fit its `layout` (it's left out)
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
        `but got <${componentName(element) || "unknown"}>. ` +
        `For full designs, use renderToJson instead.`
    );
  }

  const counters: Record<string, number> = {};
  // A render of its own, as renderToJson's: the same row gives the same ids every time. What's in it is collected.
  return withOwnScope(() => {
    const row = normalizedChildren(element, undefined, "Row").find((c): c is React.ReactElement => React.isValidElement(c));
    // Left out (its Columns don't fit its layout), it's no row.
    if (!row) throw new Error("[Unlayer] renderRowToJson: the Row is left out.");
    return processRow(row, counters);
  });
}

/** renderToJson's options. */
export interface RenderToJsonOptions {
  /** What a part of the template that fails does (see UnlayerConfig's `onError`), over the root's config's. */
  onError?: UnlayerConfig["onError"];
  /** What the template's `useId()`s start with (see UnlayerConfig's `idPrefix`), over the root's config's. */
  idPrefix?: UnlayerConfig["idPrefix"];
}

export function renderToJson(element: React.ReactElement, options?: RenderToJsonOptions): DesignJSON {
  return withOwnScope(() => designJson(element, options));
}

/** renderToJson in the render's scope (the async renderers' too, which collected the template in it). */
export function designJson(element: React.ReactElement, options?: RenderToJsonOptions): DesignJSON {
  // Accept a user wrapper component (e.g. <MyEmail/>) by unwrapping to its root,
  // matching renderToHtml which renders wrappers through React.
  element = unwrapForJson(element, options?.idPrefix);
  // The config of the <UnlayerProvider>s around it (the design keeps its direction), read before it's copied below.
  const provided = providedConfig(element);
  // (Of any copy of Elements: see root-type.ts.)
  const displayName = rootName(element.type);
  // (Email, Page or Document's, read before it's copied below.)
  const mode = rootMode(element, rootConfig(element.props as RootConfigProps, provided));
  // One walk collects the rows and blocks (as the HTML does).
  let heads: Recorded[] = [];
  if (displayName) {
    const config = rootConfig(element.props as RootConfigProps, provided, options);
    const policy = config.onError;
    setRenderConfig(config);
    // Where failed parts are left out (`onError: "omit"`), its body is rendered as its HTML is, so a row or block whose
    // exporter fails is left out of the design too. Otherwise nothing renders its HTML: an exporter that fails
    // fails renderToHtml, which then gives nothing to disagree with.
    if (omits(policy)) renderBody(element, options, "renderToJson");
    // What its content gives the head and the design can't hold (a <Head>'s tags): said.
    heads = collect((element.props as { children?: React.ReactNode }).children, displayName).recorded.filter((r) => r.kind === "head");
    for (const r of heads) if (r.kind === "head" && r.json) sayOnce(r.json);
    element = normalizedRoot(element, mode);
  }

  if (!displayName) {
    throw new Error(
      `[Unlayer] renderToJson: Root element must be <Body>, <Email>, <Page>, or <Document>, ` +
        `but got <${componentName(element) || "unknown"}>. ` +
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
  const body = processBody(element, counters, mode, provided);
  // What its content gives the design (a <Font>'s URL, on the fonts of its family), then its `fonts` prop.
  for (const r of heads) if (r.kind === "head") r.design?.(body);
  rootFonts(element, displayName, body);

  // (Its values are copies, bare zeros in their px lengths written `0px`: see pxMerged.)
  return {
    counters,
    body,
    schemaVersion,
  };
}
