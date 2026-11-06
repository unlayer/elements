/**
 * The builder's design JSON as a template in the new components, from its values alone: the body is the root (the
 * builder's display mode), with its rows (rows.ts) in it, a Document's header and footer around them. Malformed JSON
 * never throws: what can't be read is left out and said.
 */
import type { Child, Json, Node } from "@unlayer-internal/elements-core";
import { BodyDefaults } from "./tool-defaults";
import { color, fontWeight, font, px, serviceTag, type Sides, type Values } from "./read-values";
import type { Context } from "./blocks";
import { readHidden } from "./hide";
import { withoutMalformed } from "./malformed";
import { readRow } from "./rows";
import { sayUnread } from "./unread";

export type DisplayMode = "email" | "web" | "document";

const obj = (value: unknown): Values => (value && typeof value === "object" && !Array.isArray(value) ? (value as Values) : {});
const arr = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const defined = (record: Record<string, Json | undefined>) => Object.fromEntries(Object.entries(record).filter(([, v]) => v !== undefined)) as Record<string, Json>;
/** The strings in a design's value, so many levels down at most: malformed JSON can be any depth. */
const wordsIn = (value: unknown, depth: number): string[] => (typeof value === "string" ? [value] : depth > 0 && value && typeof value === "object" ? Object.values(value).flatMap((held) => wordsIn(held, depth - 1)) : []);
const ROOTS: Record<DisplayMode, string> = { email: "Email", web: "Page", document: "Document" };
/** The page sizes a Document takes. */
const SIZES = new Set(["A3", "A4", "A5", "Letter", "Legal", "Tabloid"]);

export function readDesign(given: unknown, displayMode: DisplayMode | undefined, report: string[], toSafeHtml?: (html: string) => string): Node {
  const design = withoutMalformed(given, report);
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
  sayUnread("body", obj(body.values), undefined, (message) => report.push(`body: ${message}`));
  const context = (where: string): Context => ({
    inherited: { color: (root.style?.color as string | undefined) ?? "#000000", fontFamily: (root.style?.fontFamily as string | undefined) ?? "Arial, Helvetica, sans-serif", fontWeight: (root.style?.fontWeight as number | undefined) ?? 400 },
    mode,
    dir: (root.props?.dir as string | undefined) ?? "ltr",
    safe: (html) => (toSafeHtml ? toSafeHtml(html) : html),
    document: mode === "document",
    say: (message) => report.push(`${where}: ${message}`),
  });
  const children: Child[] = [];
  const place = (list: unknown[], part: string) => list.flatMap((row, r) => readRow(obj(row), `${part}[${r}]`, { context, body: values, document: mode === "document", part: mode === "document" && part !== "rows" }));
  if (mode === "document") {
    const header = place(headers, "headers");
    if (header.length) children.push({ type: "PageHeader", children: header.filter((c) => c.type !== "PageBreak") });
    children.push(...place(rows, "rows"));
    const footer = place(footers, "footers");
    if (footer.length) children.push({ type: "PageFooter", children: footer.filter((c) => c.type !== "PageBreak") });
  } else {
    // Elsewhere the builder draws them as rows, above and below the others.
    children.push(...place(headers, "headers"), ...place(rows, "rows"), ...place(footers, "footers"));
  }
  const all = [...rows, ...headers, ...footers];
  // An older design says it here, which the builder moves to its phone and desktop values when it opens one.
  const items = all.flatMap((row) => [row, ...arr(obj(row).columns).flatMap((column) => [column, ...arr(obj(column).contents)])]).map((item) => obj(obj(item).values));
  if (items.some((held) => held.hideMobile === true || held.hideDesktop === true)) report.push("body: what it hides on phones or on desktop is written as an older design's, which the builder moves when it opens one: left out, so it shows. Open it in the builder and save it first");
  // A web font the builder loads from a stylesheet (a Google Fonts URL); a root's fonts are font files, and a stylesheet
  // toDesign wrote for one of them comes back as that font.
  const ownFonts = new Set(arr(root.props?.fonts).map((face) => obj(face).family));
  const webFonts = [...new Set([values, ...items].map((held) => obj(held.fontFamily)).filter((family) => typeof family.url === "string" && family.url && !ownFonts.has(family.label)).map((family) => String(family.label ?? family.value)))];
  if (webFonts.length) report.push(`body: ${webFonts.join(", ")}: web fonts the builder loads from a stylesheet, which a root doesn't take (its fonts are font files): left out, so text shows in the next font of its stack`);
  const tags = [...new Set(wordsIn(all, 12).flatMap((text) => [...text.matchAll(/\[\[\s*[\w.-]+\s*\]\]/g)].map((match) => match[0])))];
  if (tags.length) report.push(`body: ${tags.join(", ")}: design tags are filled in by the builder, from what it's given: written as they are`);
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
  // The builder's accessibility title, which its export writes as the page's <title>.
  if (typeof values.accessibilityTitle === "string" && values.accessibilityTitle.trim()) props.title = values.accessibilityTitle;
  if (mode === "email" && typeof values.preheaderText === "string" && serviceTag(values.preheaderText)) say("its preview text has an email service's tag, which today's writers keep as written and Elements writes escaped: the service won't fill it in");
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
