/**
 * The builder's design JSON as a template in the new components, from its values alone: the body is the root (the
 * builder's display mode), with its rows (rows.ts) in it, a Document's header and footer around them. Malformed JSON
 * never throws: what can't be read is left out and said.
 */
import type { Child, Json, Node } from "@unlayer-internal/elements-core";
import { BodyDefaults } from "@unlayer/exporters";
import { color, fontWeight, font, px, type Sides, type Values } from "../compat/values";
import type { Context } from "./blocks";
import { readHidden } from "./hide";
import { readRow } from "./rows";

export type DisplayMode = "email" | "web" | "document";

const obj = (value: unknown): Values => (value && typeof value === "object" && !Array.isArray(value) ? (value as Values) : {});
const arr = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const defined = (record: Record<string, Json | undefined>) => Object.fromEntries(Object.entries(record).filter(([, v]) => v !== undefined)) as Record<string, Json>;
const ROOTS: Record<DisplayMode, string> = { email: "Email", web: "Page", document: "Document" };
/** The page sizes a Document takes. */
const SIZES = new Set(["A3", "A4", "A5", "Letter", "Legal", "Tabloid"]);

export function readDesign(design: unknown, displayMode: DisplayMode | undefined, report: string[]): Node {
  const body = obj(obj(design).body);
  if (!Object.keys(body).length) report.push("the design has no body: an empty template");
  // A value the body doesn't have is the builder's default, as it gives it.
  const values = { ...BodyDefaults, ...obj(body.values) } as Values;
  const rowsOf = (key: string) => {
    if (body[key] !== undefined && !Array.isArray(body[key])) report.push(`body.${key} isn't a list of rows: left out`);
    return arr(body[key]);
  };
  const rows = rowsOf("rows");
  const headers = rowsOf("headers");
  const footers = rowsOf("footers");
  // A design made in the builder with no mode given is an Email, or a Document where it has a document's parts.
  const breaks = rows.some((row) => arr(obj(row).columns).some((column) => arr(obj(column).contents).some((content) => obj(content).type === "page_break")));
  const mode: DisplayMode = displayMode && Object.hasOwn(ROOTS, displayMode) ? displayMode : headers.length || footers.length || breaks ? "document" : "email";
  const root = rootOf(mode, values, (message) => report.push(`body: ${message}`));
  const context = (where: string): Context => ({
    inherited: { color: (root.style?.color as string | undefined) ?? "#000000", fontFamily: (root.style?.fontFamily as string | undefined) ?? "Arial, Helvetica, sans-serif", fontWeight: (root.style?.fontWeight as number | undefined) ?? 400 },
    document: mode === "document",
    say: (message) => report.push(`${where}: ${message}`),
  });
  const children: Child[] = [];
  const place = (list: unknown[], part: string) => list.flatMap((row, r) => readRow(obj(row), `${part}[${r}]`, { context, body: values, document: mode === "document", part: part !== "rows" }));
  if (mode === "document") {
    const header = place(headers, "headers");
    if (header.length) children.push({ type: "PageHeader", children: header.filter((c) => c.type !== "PageBreak") });
    children.push(...place(rows, "rows"));
    const footer = place(footers, "footers");
    if (footer.length) children.push({ type: "PageFooter", children: footer.filter((c) => c.type !== "PageBreak") });
  } else {
    if (headers.length || footers.length) report.push(`body: a header and a footer are a Document's: left out of a${mode === "email" ? "n Email" : " Page"}`);
    children.push(...place(rows, "rows"));
  }
  return { ...root, children };
}

/** The root, from the body's values. */
function rootOf(mode: DisplayMode, values: Values, say: (message: string) => void): Node {
  const type = ROOTS[mode];
  const hidden = readHidden("body", type, values, say);
  const props: Record<string, Json | undefined> = {};
  if (mode === "email" || mode === "web") {
    const width = px(values.contentWidth);
    props.width = width !== undefined && width !== (mode === "email" ? 600 : 1200) && width >= 200 ? width : undefined;
    if (width !== undefined && width < 200) say(`a content width of ${width}px is narrower than a root's least, 200px: left out`);
  }
  if (mode === "email" && typeof values.preheaderText === "string" && values.preheaderText.trim()) props.previewText = values.preheaderText;
  if (["ltr", "rtl", "auto"].includes(values.textDirection)) props.dir = values.textDirection;
  if (mode === "document") {
    if (SIZES.has(values.documentSize) && values.documentSize !== "A4") props.size = values.documentSize;
    if (values.documentOrientation === "landscape") props.orientation = "landscape";
    // One margin for every side (the builder's preset for the size where it's "auto"), or the template's own sides.
    const preset = values.documentSize === "A5" ? 48 : 96;
    const one = values.documentMargin === "auto" || values.documentMargin === undefined ? preset : px(values.documentMargin);
    const own = hidden.props.margin as Sides | undefined;
    const margin = own && one === Math.max(own.top, own.right, own.bottom, own.left) ? own : one !== undefined ? { top: one, right: one, bottom: one, left: one } : undefined;
    props.margin = margin && !(margin.top === 48 && margin.right === 48 && margin.bottom === 48 && margin.left === 48) ? margin : undefined;
  }
  const { margin: _margin, ...rest } = hidden.props;
  const style = defined({
    backgroundColor: color(values.backgroundColor),
    color: typeof values.textColor === "string" && values.textColor && values.textColor.toLowerCase() !== "#000000" ? values.textColor : undefined,
    fontFamily: font(values.fontFamily) !== "Arial, Helvetica, sans-serif" ? font(values.fontFamily) : undefined,
    fontWeight: fontWeight(values.fontWeight) !== 400 ? fontWeight(values.fontWeight) : undefined,
  });
  const node: Node = { type };
  const allProps = defined({ ...props, ...rest });
  if (Object.keys(allProps).length) node.props = allProps;
  if (Object.keys(style).length) node.style = style;
  return node;
}
