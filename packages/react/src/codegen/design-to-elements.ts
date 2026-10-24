/**
 * designToElements: an Unlayer design (the JSON the editor saves) as Elements code, a `.tsx` module whose
 * component renders back to the same design with `renderToJson()`. Pure: no React rendering and no Node APIs,
 * so it runs in a browser as well as in a CLI.
 */
import { schemaVersion as _schemaVersion } from "@unlayer/exporters";
import { convertBlock } from "./blocks";
import { convertBody, convertColumn, convertRow, type RootName } from "./containers";
import { printModule, type JsxChild, type JsxElement } from "./print";
import { restoredFonts, webFonts } from "./fonts";
import { ModuleState } from "./state";
import { componentIdentifier, isPlainObject, type Plain } from "./values";

const SCHEMA_VERSION: number = _schemaVersion ?? 24;

export type DisplayMode = "email" | "web" | "document" | "popup";

export interface DesignToElementsOptions {
  /**
   * Which root to write: `email` (`<Email>`), `web` (`<Page>`) or `document` (`<Document>`). Defaults to the design's
   * own `displayMode` where it has one, else `email`. A `popup` design is written as a `<Page>`.
   */
  displayMode?: DisplayMode;
  /** The generated component's name (`export default function Template()`). */
  componentName?: string;
  /**
   * The design's exported HTML (the editor's `exportHtml()`), for blocks Elements has no component for (custom
   * tools, forms, timers, carousels): each is kept as an `<Html>` block with its HTML. Without it they're TODO comments.
   */
  html?: string;
}

export interface DesignToElementsResult {
  /** The `.tsx` module: imports, and the component as its default export. */
  code: string;
  /** What didn't convert as it is, each naming its row and column. */
  warnings: string[];
}

const ROOTS: Record<string, RootName> = { email: "Email", web: "Page", popup: "Page", document: "Document" };

/** The design from what was given: a design object, its JSON text. */
function readDesign(input: unknown): Plain {
  let value = input;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch (cause) {
      throw Object.assign(new Error("[Unlayer] designToElements: the design isn't valid JSON."), { cause });
    }
  }
  if (!isPlainObject(value) || !isPlainObject(value.body) || !Array.isArray(value.body.rows)) {
    throw new Error("[Unlayer] designToElements: expected an Unlayer design, an object with `body.rows` (the editor's `saveDesign()`).");
  }
  return value;
}

/**
 * Convert an Unlayer design into Elements code.
 *
 * @param design - The design: the editor's `saveDesign()` JSON, as an object or as its text.
 * @param options - The root (`displayMode`), the component's name, and the design's exported HTML.
 * @returns The `.tsx` module, and what didn't convert as it is (each warning names its row and column).
 * @throws If `design` isn't an Unlayer design (no `body.rows`).
 *
 * @example
 * ```ts
 * import { designToElements } from "@unlayer/react-elements/codegen";
 *
 * const { code, warnings } = designToElements(design, { componentName: "Welcome" });
 * await writeFile("Welcome.tsx", code);
 * ```
 */
export function designToElements(design: unknown, options: DesignToElementsOptions = {}): DesignToElementsResult {
  const input = readDesign(design);
  const body: Plain = input.body;
  const bodyValues: Plain = isPlainObject(body.values) ? body.values : {};
  const state = new ModuleState(options.html);

  const mode = options.displayMode ?? input.displayMode ?? bodyValues.displayMode ?? "email";
  const root = ROOTS[mode] ?? "Email";
  if (!ROOTS[mode]) state.warn(`The display mode "${mode}" isn't one Elements has: the template is an <Email>.`);
  if (mode === "popup") state.warn("A popup design is written as a <Page>: Elements renders no popup (the design keeps its popup settings).");
  if (typeof input.schemaVersion === "number" && input.schemaVersion !== SCHEMA_VERSION) {
    state.warn(
      input.schemaVersion > SCHEMA_VERSION
        ? `The design's schema (version ${input.schemaVersion}) is newer than this Elements' (${SCHEMA_VERSION}): settings added since may not convert.`
        : `The design's schema (version ${input.schemaVersion}) is older than this Elements' (${SCHEMA_VERSION}), which renderToJson writes: open and save it in the editor first, so it's migrated.`
    );
  }
  for (const part of ["headers", "footers"]) {
    if (Array.isArray(body[part]) && body[part].length) state.warn(`The design's ${part} (a document's, ${body[part].length} row${body[part].length > 1 ? "s" : ""}) have no Elements component and are left out.`);
  }
  if (hasIds(body)) state.warn("Row, column and block ids aren't kept: renderToJson writes none, and the editor gives new ones.");

  const fontsUsed = webFonts(body);
  state.restoredFonts = restoredFonts(fontsUsed);
  const { attrs, fonts } = convertBody(bodyValues, root, state);
  const textColor = typeof bodyValues.textColor === "string" ? bodyValues.textColor : undefined;
  const rtl = String(bodyValues.textDirection ?? "").trim().toLowerCase() === "rtl";

  const used = { Row: false, Column: false, ColumnLayouts: false };
  const rows: JsxChild[] = body.rows.map((row: unknown, r: number): JsxChild => {
    const where = `Row ${r + 1}`;
    if (!isPlainObject(row)) {
      state.warn(`${where} isn't a row, so it's left out.`);
      return { comment: `TODO: ${where} isn't a row in the design.` };
    }
    const columns: unknown[] = Array.isArray(row.columns) ? row.columns : [];
    const cells: number[] = Array.isArray(row.cells) && row.cells.length ? row.cells : Array(Math.max(1, columns.length)).fill(1);
    if (columns.length !== cells.length) state.warn(`${where} has ${columns.length} column${columns.length === 1 ? "" : "s"} and ${cells.length} cell${cells.length === 1 ? "" : "s"}: its cells are kept as they are.`);
    const converted = convertRow(row, cells, columns.length, where, state);
    used.Row = true;
    used.ColumnLayouts ||= converted.layout;
    used.Column ||= columns.length > 0;
    const children = columns.map((column, c): JsxChild => {
      const at = `${where}, column ${c + 1}`;
      const values: Plain = isPlainObject(column) ? column : {};
      const contents: unknown[] = Array.isArray(values.contents) ? values.contents : [];
      // Where its blocks are, for an image's width in px (see image-sizing.ts).
      const slot = { bodyValues, rowValues: isPlainObject(row.values) ? row.values : {}, rowCells: cells, columnIndex: c, columnValues: isPlainObject(values.values) ? values.values : {} };
      const blocks = contents.map((content, b) => (isPlainObject(content) ? convertBlock(content, { where: `${at}, block ${b + 1}`, state, textColor, rtl, slot }) : { comment: `TODO: ${at}, block ${b + 1} isn't a block in the design.` }));
      return { tag: "Column", attrs: convertColumn(values, at, state), children: blocks };
    });
    return { tag: "Row", attrs: converted.attrs, children };
  });

  // Web fonts: a <Font> each, which loads it (the root's own as `default`), from "@unlayer/react-elements/font".
  for (const [url, family] of fontsUsed) if (!fonts.some((font) => font.url === url)) fonts.push({ family, url });
  const fontElements: JsxElement[] = fonts.map((font) => ({
    tag: "Font",
    attrs: [
      { name: "family", value: font.family },
      { name: "url", value: font.url },
      ...(font.fallback !== undefined ? [{ name: "fallback", value: font.fallback }] : []),
      ...(font.default ? [{ name: "default", value: true }] : []),
    ],
    children: [],
  }));

  const containers = (["Row", "Column", "ColumnLayouts"] as const).filter((name) => used[name]);
  // (A props type where the module writes `values` as it: see props.ts.)
  const types = [...state.types].sort().map((type) => `type ${type}`);
  const imports = [{ from: "@unlayer/react-elements", names: [root, ...containers, ...[...state.components].sort(), ...types] }];
  if (fontElements.length) imports.push({ from: "@unlayer/react-elements/font", names: ["Font"] });

  // A name of its own, not one the module imports or declares (`Email` is `EmailTemplate`).
  let componentName = componentIdentifier(options.componentName);
  if (imports.some(({ names }) => names.some((name) => name.replace(/^type /, "") === componentName))) componentName += "Template";
  const code = printModule({
    imports,
    componentName,
    root: { tag: root, attrs, children: [...fontElements, ...rows] },
  });
  return { code, warnings: state.warnings };
}

/** Whether a design's rows, columns or blocks have ids of their own (the editor's newer designs do). */
function hasIds(body: Plain): boolean {
  const list = (value: unknown): Plain[] => (Array.isArray(value) ? value.filter(isPlainObject) : []);
  const rows = list(body.rows);
  const columns = rows.flatMap((row) => list(row.columns));
  const blocks = columns.flatMap((column) => list(column.contents));
  return [...rows, ...columns, ...blocks].some((node) => node.id !== undefined);
}
