/**
 * A template of today's components as the new engine's tree (RFC 0001 step 7): its design lowered (lower.ts), each
 * block in the new components, by its tool (blocks/). What the new engine can't read of a block is said instead, and a
 * tool may write HTML no node holds as a Raw node of its own. A Raw node of a custom tool, an Html block or a user's own
 * markup holds that HTML in its box (contentBox), with what its head needs from the blocks themselves. What the template
 * holds beside its design (markup among its rows, text in a row or a column) is in the tree where legacy draws it.
 */
import React from "react";
import { checkDocument, type Diagnostic } from "@unlayer-internal/elements-core";
import { Stylesheet } from "@unlayer-internal/elements-exporters";
import { DEFAULT_CONFIG, htmlToPlainText, mergeValues, validateColumnLayout, type RenderMode, type UnlayerConfig } from "@unlayer-internal/shared-elements";
import { BODY_DEFAULTS, COLUMN_DEFAULTS, ROW_DEFAULTS } from "../utils/container-defaults";
import { safeMeta, textDirectionOf, UNLAYER_CONFIG_KEY } from "../utils/create-component";
import { amongRows, blockWithoutMarkers, drawnRoot, KEPT } from "../utils/normalize";
import { looseText } from "../utils/render-scope";
import { renderToStaticMarkup } from "../utils/server-renderer";
import { extractHeadFromTree } from "../utils/extract-head";
import { collectedDesign, extractSemanticProps, type Strays } from "../utils/render-to-json";
import { mapSemanticProps } from "../utils/semantic-props";
import { callIsolated, getDisplayName, htmlRoot, isElementsType, MARKUP_ADVICE, ROOT_NAMES } from "../utils/unwrap-root";
import { ROOT } from "../utils/collect";
import Body from "../components/Body";
import Column from "../components/Column";
import Row from "../components/Row";
import { BLOCKS } from "./blocks";
import { ownMarkupCss } from "./quirks";
import { keepServiceTags } from "./values";
import { blockName, givenId, lowerDesign, withGivenId, writeBlock, type BlockFrame, type DesignBlock, type Mode, type OutsideTheDesign, type TreeNode } from "./lower";

/** Whether a type is a root component the new engine reads (see ROOT): this copy's, or the same package's in another build. */
const isReadableRoot = (type: unknown) => !!(type as Record<symbol, unknown> | null)?.[ROOT];

// Email/Page/Document lock their render mode internally (they render <Body mode="...">), so the top-level element's own
// props never carry it. Each wrapper's mode, so the document always matches what the body rendered as.
const MODE_BY_WRAPPER: Record<string, RenderMode> = { Email: "email", Page: "web", Document: "document" };

/** A template's direction follows its root props; explicit renderer options still win. */
function resolveConfig(element: React.ReactElement, config?: Partial<UnlayerConfig>): UnlayerConfig {
  const props = element.props as { textDirection?: string; values?: { textDirection?: string } };
  const textDirection = textDirectionOf(props.textDirection ?? props.values?.textDirection);
  return { ...DEFAULT_CONFIG, ...(textDirection !== undefined ? { textDirection } : {}), ...config };
}

/** A tree's output: its wrapper's (Email, Page, Document), then an explicit `mode` prop (Body), then the config's. */
function resolveDisplayMode(element: React.ReactElement, merged: Partial<UnlayerConfig>): RenderMode {
  return MODE_BY_WRAPPER[getDisplayName(element) ?? ""] ?? (element.props as { mode?: RenderMode }).mode ?? merged.mode ?? "web";
}

/** Where a template is drawn, when it's not a document of its own. */
export interface InReact {
  /** Rendered by React into a page of someone else's (a root's or a piece's own render): the page's margin and background are theirs, and its class names can't meet another's. */
  embedded?: boolean;
  /** A Row, Column or block on its own, its markup alone. */
  piece?: boolean;
  /** What its body would have given a piece on its own (its `bodyValues`). */
  body?: Record<string, any>;
}

export interface Lowered {
  /** The template's root, as it renders (a template component called; for a piece on its own, the root it's given). */
  root: React.ReactElement;
  /** A piece on its own: its host <div> (its className and style) is its own markup, in a document too. */
  bare: boolean;
  /** The template as the new engine's tree. */
  tree: { root: TreeNode };
  mode: Mode;
  config: Partial<UnlayerConfig>;
  /** What the head has for the Raw blocks that need it (custom tools' scripts and tags). */
  head: { css: string; js: string; tags: string[] } | undefined;
  /** What's drawn otherwise than the template asks, of its frame and its blocks. */
  diagnostics: Diagnostic[];
  /** The email service's tags the tree holds as marks (values.ts), which go back into what's written. */
  tags: string[];
}

/** What a render says of what's among a template's rows and in its Rows: markup among the rows is drawn (0.2.1 says nothing of it). */
const STRAYS: Strays = {
  inBody: () => {},
  inRow: (name) => console.warn(`Row: <${name}> is not a valid Row child. Only <Column> components can be direct children of <Row>. Wrap it in a <Column>: <Row><Column><${name} /></Column></Row>`),
};

/**
 * A template's root: what its element comes to, for a piece on its own (a Row, a Column, a block, what a component
 * returns that isn't a root) a root around it. Says why where it can't be drawn: markup isn't a template, and a root of
 * an older copy of this package can't be read by this one.
 */
function templateRoot(element: React.ReactElement, name: string, config: Partial<UnlayerConfig> | undefined, inReact: InReact): { root: React.ReactElement; given?: boolean; wide?: boolean } {
  const found = htmlRoot(element, name) as React.ReactElement<any>;
  const display = getDisplayName(found) ?? "";
  if (ROOT_NAMES.has(display)) {
    if (isReadableRoot(found.type)) return { root: found, given: true };
    // A function of the user's own named after a root, around a real one, is called like any template.
    const type = found.type as unknown as { (props: unknown): unknown; prototype?: { isReactComponent?: unknown } };
    const inside = typeof type === "function" && !type.prototype?.isReactComponent ? callIsolated(() => type({ ...found.props })) : undefined;
    if (React.isValidElement(inside) && isReadableRoot(inside.type)) return { root: inside, given: true };
    throw new Error(`[Unlayer] ${name}: this <${display}> is from another copy of @unlayer/react-elements, older than 0.3, which this one can't read. Install one version of it (\`npm ls @unlayer/react-elements\` shows a duplicate install).`);
  }
  if (typeof found.type === "string") throw new Error(`[Unlayer] ${name}: <${found.type}> isn't a template: its root is an <Email>, <Page>, <Document> or <Body>. ${MARKUP_ADVICE}`);
  // What it's in has its own background, where it's in something.
  const { className, style } = found.props;
  const body = (values?: Record<string, unknown>) => ({ mode: found.props.mode ?? config?.mode, className, style, values: { ...inReact.body, ...(inReact.piece ? { backgroundColor: "" } : {}), ...values } });
  // (Its className and style are on the root's host <div>, as what's rendered on its own has them.)
  if (display === "Row") return { root: React.createElement(Body, body(), React.cloneElement(found, { className: undefined, style: undefined })) };
  // A Column or block on its own is where it's put, not in a content width of its own.
  const alone = (content: React.ReactNode, values?: Record<string, unknown>) => ({ root: React.createElement(Body, body({ contentAlign: "left", ...values }), React.createElement(Row, found.props.cells ? { cells: found.props.cells } : null, content)), wide: true });
  if (display === "Column") return alone(found);
  // A block has no box of its own (a Column gives it its padding), and it's in the font of what it's in.
  if (isElementsType(found.type)) return alone(React.createElement(Column, null, React.cloneElement(found, { containerPadding: "0px" })), { fontFamily: { label: "", value: "" } });
  // What holds neither (nothing, Rows in a list or a provider).
  return { root: React.createElement(Body, body(), found) };
}

/**
 * What's in a render's frame class names, in a page of someone else's: named after what it draws, so another render on
 * the page has its own, and the same rules where it's the same. (A custom tool's value that isn't JSON, a React element
 * of a client render, has none: its frame's classes are as a document's.)
 */
function frameNames(mode: Mode, design: unknown): string | undefined {
  try {
    return new Stylesheet("f").classFor("all", JSON.stringify([mode, design]));
  } catch {
    return undefined;
  }
}

/**
 * A template of today's components as the new engine's tree, or says why it can't be: see `templateRoot`. Called inside
 * a render's scope.
 */
export function lowerTemplate(element: React.ReactElement, config: Partial<UnlayerConfig> | undefined, name: string, inReact: InReact = {}): Lowered {
  const { root, given, wide } = templateRoot(element, name, config, inReact);
  const merged = resolveConfig(root, config);
  const mode = resolveDisplayMode(root, merged) as Mode;
  const collected = drawnRoot(root);
  const design = collectedDesign(collected, STRAYS) as unknown as { body: Record<string, any> };
  const names = inReact.embedded ? frameNames(mode, design) : undefined;
  const shape = { embedded: inReact.embedded, wide, names };
  const { blocks: sources, body, rows, notDrawn } = blockSources(collected);
  // A Row whose Columns don't fit its layout: today's Body says so and renders without its rows (a mailer that never
  // expected renderToHtml to throw would fail).
  const unfit = layoutThatDoesNotFit(collected);
  if (unfit) {
    console.error("Body: Failed to render children:", unfit);
    const { root: empty, diagnostics } = lowerDesign({ body: { ...design.body, rows: [] } }, { mode, config: merged, ...shape, block: () => null });
    return { root, bare: !given, tree: { root: empty }, mode, config: merged, head: undefined, diagnostics: [...diagnostics, { code: "compat/layout", severity: "warning", message: `${unfit.message}: the body has no rows`, path: "body.rows" }], tags: [] };
  }
  // Today's Body gives what's among its rows these (a block or a Column there is rendered as it renders it).
  const place = (child: React.ReactElement) => React.cloneElement(child as React.ReactElement<any>, { _config: { ...merged, mode }, bodyValues: body });
  const outside: OutsideTheDesign = { among: amongRows((root.props as { children?: React.ReactNode }).children, place), rows };
  // Blocks that keep today's HTML: their Raw nodes, by their number in the design (rows, their columns, their blocks).
  const raw = new Map<number, TreeNode>();
  const html = new Map<number, string>();
  const ofBlocks: Diagnostic[] = notDrawn.map((message) => ({ code: "compat/block", severity: "warning", message, path: "body.rows" }));
  // (renderToHtmlParts and a React render have a host for them: a whole document doesn't.)
  if (given && name === "renderToHtml" && ownMarkupProps(root)) ofBlocks.push({ code: "compat/frame", severity: "warning", message: `A root's ${ownMarkupProps(root)} draws nothing in a whole document: renderToHtmlParts() writes it on the host <div> around the body.`, path: "body" });
  const tags: string[] = [];
  let next = 0;
  const { root: lowered, diagnostics: ofFrame } = lowerDesign(design, {
    mode,
    config: merged,
    ...shape,
    outside,
    block: (block, place) => {
      const n = next++;
      const path = `blocks[${n}]`;
      // (Once for each block: a value of a table's is every cell's.)
      const note = (message: string, severity: "warning" | "info" = "warning") => {
        if (!ofBlocks.some((d) => d.path === path && d.message === message)) ofBlocks.push({ code: "compat/block", severity, message, path });
      };
      // A custom tool, an Html block or a user's own markup: its own HTML in its box, written below.
      const lower = BLOCKS[block.type];
      if (!lower) {
        const kept: TreeNode = { type: "Raw", props: { html: "" } };
        raw.set(n, kept);
        return kept;
      }
      const lowered = lower(withoutPhone(block, mode), { ...place, id: sources[n]?.id, source: sources[n]?.values, note, keep: (text, pattern) => keepServiceTags(text, tags, pattern) });
      if (lowered === null) return null;
      // The block's own HTML in its box, as its tool writes it (it says what its head needs).
      if (lowered.type === "Raw") {
        raw.set(n, lowered);
        html.set(n, String(lowered.props?.html ?? ""));
        return lowered;
      }
      const drawn = drawable(withGivenId(lowered, givenId(block.values ?? {})), mode, note);
      return drawn && ownPhone(drawn, mode);
    },
  });
  const tree = { root: lowered };
  const diagnostics = [...ofFrame, ...ofBlocks];
  if (!raw.size) return { root, bare: !given, tree: dropEmpty(tree), mode, config: merged, head: undefined, diagnostics, tags };
  // Each is written here, once the template is lowered.
  const { children } = root.props as { children?: React.ReactNode };
  for (const n of raw.keys()) {
    if (html.has(n)) continue;
    const source = sources[n];
    const written = writeBlock(source.element, source.id, source.frame, mode, { ...merged, mode });
    html.set(n, blockWithoutMarkers(children, written?.html ?? ""));
    // A Row or Column in a Column reads as it does on its own.
    if (written?.text !== undefined) raw.get(n)!.textAs = { type: "Raw", props: { html: written.text } };
  }
  const head = extractHeadFromTree(root, {
    displayMode: mode,
    headConfig: merged.headConfig,
    dropped: (id, key, value, on) => diagnostics.push({ code: "compat/block", severity: "warning", message: `A block's ${key} on ${on === "mobile" ? "phones" : "desktop"} ${JSON.stringify(value)} can't be written in CSS, so it isn't drawn`, path: id }),
  });
  // (A printed document's own markup CSS is on its root.)
  const css = mode === "document" ? head.css : [ownMarkupCss(mode, body), head.css].filter(Boolean).join("\n");
  let drawn = false;
  for (const [n, node] of raw) {
    const written = html.get(n) ?? "";
    drawn ||= !!written;
    // In a printed document, legacy's text is in the font's own line height ("normal"), where a page's root has 1.5.
    const markup = written && mode === "document" ? `<div style="line-height:normal">${written}</div>` : written;
    node.props = { html: markup, ...(node.props?.css ? { css: node.props.css } : {}), text: htmlToPlainText(written) };
  }
  // What they all need is in the document once, where one of them is drawn: on the root, before each one's own rules.
  if (drawn && css) lowered.compat = { ...lowered.compat, css: [lowered.compat?.css, css].filter(Boolean).join("\n") };
  return { root, bare: !given, tree: dropEmpty(tree), mode, config: merged, head, diagnostics, tags };
}

/** What's wrong with the layout of a Row whose Columns don't fit it. */
function layoutThatDoesNotFit(collected: React.ReactElement): Error | undefined {
  for (const row of React.Children.toArray((collected.props as { children?: React.ReactNode }).children)) {
    if (!React.isValidElement(row) || getDisplayName(row) !== "Row") continue;
    const { layout, children } = row.props as { layout?: Parameters<typeof validateColumnLayout>[0]; children?: React.ReactNode };
    if (!layout) continue;
    try {
      validateColumnLayout(layout, React.Children.count(children));
    } catch (error) {
      return error as Error;
    }
  }
  return undefined;
}

/** A node as the new engine writes it: what's only for the plain text left out. */
export function forWriting(node: TreeNode): TreeNode {
  const { textAs: _, designColumn: __, ...rest } = node;
  return rest.children ? { ...rest, children: rest.children.map((c) => (typeof c === "string" ? c : forWriting(c))) } : rest;
}

/** A block's node as the new engine checks it, in a document of its own. */
const documentOf = (node: TreeNode, mode: Mode): { root: TreeNode } => ({ root: { type: mode === "email" ? "Email" : "Page", children: [{ type: "Column", children: [forWriting(node)] }] } });

/**
 * A block's node without what the new engine refuses of it (a color it doesn't read), each value said: its component's
 * default is drawn instead. A link it refuses (one that runs a script) is a link to nothing. Null where what it refuses
 * isn't a value to take out: the block draws nothing, which is said.
 */
function drawable(node: TreeNode, mode: Mode, note: (message: string) => void): TreeNode | null {
  const document = documentOf(node, mode);
  for (let errors = refused(document); errors.length; errors = refused(document)) {
    // (From the last: taking a child out moves those after it.)
    for (const error of errors.reverse()) {
      note(error.message);
      if (!takeOut(document, error.path)) return null;
    }
  }
  const drawn = (document.root.children![0] as TreeNode).children![0] as TreeNode;
  return node.textAs ? { ...drawn, textAs: node.textAs } : drawn;
}

const refused = (document: { root: TreeNode }) => checkDocument(document).diagnostics.filter((d) => d.severity === "error");

/**
 * Takes the value at a diagnostic's path (`root.children[0].style.color`) out of a tree; false where it isn't one. A link
 * is a link to nothing, which it needs one to be drawn.
 */
export function takeOut(tree: { root: TreeNode }, path: string): boolean {
  const keys = path.match(/[^.[\]]+/g) ?? [];
  const last = keys.pop();
  let at: any = tree;
  for (const key of keys) at = at?.[key];
  if (at === undefined || at === null || typeof at !== "object" || last === undefined) return false;
  if (last === "href") at.href = { href: "" };
  else if (Array.isArray(at)) at.splice(Number(last), 1);
  else if (last in at) delete at[last];
  else return false;
  return true;
}

/**
 * A block in an email: its phone settings and hiding apply at legacy's phone width (render.ts's hideBelow), while its
 * row's columns stack at the email's width. What belongs to that stacking is on the row and its columns, which aren't
 * marked, or an Image's `compat.stackedMaxWidth`.
 */
const ownPhone = (node: TreeNode, mode: Mode): TreeNode => (mode === "email" && hasPhone(node) ? { ...node, compat: { ...node.compat, ownPhone: true } } : node);
const hasPhone = (node: TreeNode): boolean => !!node.mobile || (node.children ?? []).some((child) => typeof child !== "string" && hasPhone(child));

/** A block in a printed document, without its phone settings: legacy's document has none. */
function withoutPhone(block: DesignBlock, mode: Mode): DesignBlock {
  if (mode !== "document" || !block.values?._override?.mobile) return block;
  const { mobile: _, ...override } = block.values._override;
  return { ...block, values: { ...block.values, _override: override } };
}

/** Which of a component's className and style it's given, in words. */
function ownMarkupProps(element: React.ReactElement<any>): string | undefined {
  return [element.props.className ? "className" : "", element.props.style ? "style" : ""].filter(Boolean).join(" and ") || undefined;
}

/** A Row's className and style as legacy writes them: on a <div> around it, whose start and end are returned. Undefined where it has neither. */
function aroundRow(row: React.ReactElement<any>): [string, string] | undefined {
  const { className, style } = row.props;
  if (!className && !style) return undefined;
  const MARK = "\uE002";
  return renderToStaticMarkup(React.createElement("div", { className, style, dangerouslySetInnerHTML: { __html: MARK } })).split(MARK) as [string, string];
}

/** A block of the template, as a Column gives it to its exporter. */
interface BlockSource {
  /** Its values as its exporter gets them (its props mapped, its defaults in); undefined where it has no tool. */
  values?: Record<string, any>;
  /** The block, as collected. */
  element: React.ReactElement<any>;
  /** Its id, numbered as a render numbers them. */
  id: string;
  frame: BlockFrame;
}

/**
 * Each block of the template, in the design's order (rows, their columns, their blocks, as renderToJson walks the same
 * collected template), and the body's values.
 */
function blockSources(collected: React.ReactElement<any>): { blocks: BlockSource[]; body: Record<string, any>; rows: OutsideTheDesign["rows"]; notDrawn: string[] } {
  const out: BlockSource[] = [];
  const notDrawn: string[] = [];
  // Legacy draws a Column's and a block's className and style only where it's rendered on its own.
  const said = (element: React.ReactElement<any>, name: string) => {
    const own = ownMarkupProps(element);
    if (own) notDrawn.push(`A <${name}>'s ${own} draws nothing in a template: it's written only where the <${name}> is rendered on its own.`);
  };
  const rows: OutsideTheDesign["rows"] = [];
  // What's in a Row or a Column that isn't one of its children in the design, as today's Row and Column write it.
  const all = (element: React.ReactElement<any>) => React.Children.toArray(element.props.children);
  const isText = (child: React.ReactNode): child is string | number => typeof child === "string" || typeof child === "number";
  const elements = (node: React.ReactNode) => React.Children.toArray(node).filter(React.isValidElement) as Array<React.ReactElement<any>>;
  const counts: Record<string, number> = {};
  const nextId = (prefix: string) => `${prefix}_${(counts[prefix] = (counts[prefix] ?? 0) + 1)}`;
  const mapped = (element: React.ReactElement<any>, defaults: any, name: string) => mapSemanticProps<Record<string, any>>(extractSemanticProps(element.props), defaults, name);
  const bodyValues = mergeValues<Record<string, any>>(BODY_DEFAULTS as Record<string, any>, mapped(collected, BODY_DEFAULTS, "Body"));
  for (const row of elements(collected.props.children)) {
    if (getDisplayName(row) !== "Row") continue;
    const columns = elements(row.props.children).filter((column) => getDisplayName(column) === "Column");
    const cells: number[] = row.props.layout?.cells ?? row.props.cells ?? Array(Math.max(1, columns.length)).fill(1);
    const ownRow = mapped(row, ROW_DEFAULTS, "Row");
    const rowValues = { ...ownRow, cells, _meta: safeMeta({ htmlID: nextId("u_row"), htmlClassNames: "u_row", ...ownRow._meta }) };
    const rowText = [""];
    for (const child of all(row)) {
      if (isText(child)) rowText[rowText.length - 1] += looseText(child, "Row");
      else if (React.isValidElement(child) && getDisplayName(child) === "Column") rowText.push("");
    }
    rows.push({
      values: ownRow,
      around: aroundRow(row),
      text: rowText.map((text) => (text.trim() ? text : "")),
      columns: columns.map((column) => {
        const texts = [""];
        for (const child of all(column)) {
          if (isText(child)) texts[texts.length - 1] += looseText(child, "Column");
          else if (React.isValidElement(child)) texts.push("");
        }
        return texts.map((text) => (text.trim() ? text : ""));
      }),
    });
    columns.forEach((column, colIndex) => {
      const ownColumn = mapped(column, COLUMN_DEFAULTS, "Column");
      const columnValues = { ...ownColumn, _meta: safeMeta({ htmlID: nextId("u_column"), htmlClassNames: "u_column", ...ownColumn._meta }) };
      said(column, "Column");
      for (const element of elements(column.props.children)) {
        const type = element.type as any;
        const block = !type?.[UNLAYER_CONFIG_KEY] && type?.[KEPT] ? (type[KEPT] as React.ReactElement<any>) : element;
        const config = (block.type as any)?.[UNLAYER_CONFIG_KEY];
        let values: Record<string, any> | undefined;
        if (config) {
          const { children, ...props } = block.props;
          values = mergeValues(config.defaultValues, config.propMapper({ children, ...props }));
          // (A custom tool's props are its own values.)
          if (config.contentType !== "custom") said(block, getDisplayName(block) ?? "block");
        }
        out.push({ values, element, id: nextId(`u_content_${blockName(type)}`), frame: { colIndex, cells, bodyValues, rowValues, columnValues } });
      }
    });
  }
  return { blocks: out, body: bodyValues, rows, notDrawn };
}

/** The tree without Raw nodes that hold nothing (a block that writes nothing in this output). */
function dropEmpty(tree: { root: TreeNode }): { root: TreeNode } {
  const visit = (node: TreeNode): TreeNode => (node.children ? { ...node, children: node.children.filter((c) => typeof c === "string" || c.type !== "Raw" || c.props?.html).map((c) => (typeof c === "string" ? c : visit(c))) } : node);
  return { root: visit(tree.root) };
}
