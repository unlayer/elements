/**
 * A template of today's components as the new engine's tree (RFC 0001 step 7): its design lowered (lower.ts), each
 * block in the new components where its tool has moved over and it can be drawn as legacy draws it (blocks/), else a
 * Raw node; a tool that always draws (DRAWN) says what it can't read instead, and may write HTML no node holds as a Raw node of its own. A Raw node of a custom tool, an Html block or a user's own markup holds that HTML in its box (contentBox),
 * with what its head needs from the blocks themselves: nothing of the closed exporters runs. Any other Raw node holds
 * the HTML its exporter writes and the legacy stylesheet; only those blocks are written by today's exporters. What the
 * template holds beside its design (markup among its rows, text in a row or a column) is in the tree where legacy draws it.
 */
import React from "react";
import { checkDocument, type Diagnostic } from "@unlayer-internal/elements-core";
import { htmlToPlainText, mergeValues, validateColumnLayout, type UnlayerConfig } from "@unlayer-internal/shared-elements";
import { BODY_DEFAULTS, COLUMN_DEFAULTS, ROW_DEFAULTS } from "../utils/container-defaults";
import { safeMeta, UNLAYER_CONFIG_KEY } from "../utils/create-component";
import { amongRows, blockWithoutMarkers, KEPT, normalizedRoot } from "../utils/normalize";
import { looseText } from "../utils/render-scope";
import { recordingBlockHtml } from "../utils/block-html";
import { extractHeadFromTree, writesOpenHtml } from "../utils/extract-head";
import { renderBody, resolveConfig, resolveDisplayMode } from "../utils/render-to-html";
import { extractSemanticProps, renderToJson } from "../utils/render-to-json";
import { mapSemanticProps } from "../utils/semantic-props";
import { getDisplayName, ROOT_NAMES } from "../utils/unwrap-root";
import { htmlRoot } from "../utils/unwrap-root";
import Body from "../components/Body";
import Document from "../components/Document";
import Email from "../components/Email";
import Page from "../components/Page";
import { BLOCKS, DRAWN } from "./blocks";
import { ownMarkupCss } from "./quirks";
import { deviceValues, keepServiceTags, sides } from "./values";
import { blockName, givenId, lowerDesign, Unlowerable, withGivenId, writeBlock, type BlockFrame, type DesignBlock, type Mode, type OutsideTheDesign, type TreeNode } from "./lower";

/** This copy's root components. */
const OWN_ROOTS = new Set<unknown>([Body, Email, Page, Document]);

export interface Lowered {
  /** The template's root, as it renders (a template component called). */
  root: React.ReactElement;
  /** The template as the new engine's tree. */
  tree: { root: TreeNode };
  mode: Mode;
  config: Partial<UnlayerConfig>;
  /** What the head has for the Raw blocks that need it (custom tools' scripts and tags). */
  legacyHead: { css: string; js: string; tags: string[] } | undefined;
  /** What's drawn otherwise than the template asks, of its frame and its blocks. */
  diagnostics: Diagnostic[];
  /** The email service's tags the tree holds as marks (values.ts), which go back into what's written. */
  tags: string[];
}

/**
 * A template of today's components as the new engine's tree: undefined where its root isn't one of today's (a block
 * on its own, a component that doesn't return one). Called inside a render's scope.
 */
export function lowerTemplate(element: React.ReactElement, config: Partial<UnlayerConfig> | undefined, name: string): Lowered | undefined {
  const root = htmlRoot(element, name);
  if (!ROOT_NAMES.has(getDisplayName(root) ?? "")) return undefined;
  // Another copy of this package's components (a tool that loads templates with one of its own): they collect and
  // render themselves, which this copy's lowering can't read; it renders as today, through them.
  if (!OWN_ROOTS.has(root.type)) return undefined;
  const merged = resolveConfig(root, config);
  const mode = resolveDisplayMode(root, merged) as Mode;
  const design = renderToJson(root) as unknown as { body: Record<string, any> };
  const { blocks: sources, body, rows } = blockSources(root);
  // A Row whose Columns don't fit its layout: today's Body says so and renders without its rows (a mailer that never
  // expected renderToHtml to throw would fail).
  const unfit = layoutThatDoesNotFit(root);
  if (unfit) {
    console.error("Body: Failed to render children:", unfit);
    const { root: empty, diagnostics } = lowerDesign({ body: { ...design.body, rows: [] } }, { mode, config: merged, block: () => null });
    return { root, tree: { root: empty }, mode, config: merged, legacyHead: undefined, diagnostics: [...diagnostics, { code: "compat/layout", severity: "warning", message: `${unfit.message}: the body has no rows`, path: "body.rows" }], tags: [] };
  }
  // Today's Body gives what's among its rows these (a block or a Column there is rendered as it renders it).
  const place = (child: React.ReactElement) => React.cloneElement(child as React.ReactElement<any>, { _config: { ...merged, mode, __ids: {} }, bodyValues: body });
  const outside: OutsideTheDesign = { among: amongRows((root.props as { children?: React.ReactNode }).children, place), rows };
  // Blocks that keep today's HTML: their Raw nodes, by their number in the design (rows, their columns, their blocks).
  const raw = new Map<number, TreeNode>();
  const html = new Map<number, string>();
  const ofBlocks: Diagnostic[] = [];
  const tags: string[] = [];
  let next = 0;
  const { root: lowered, diagnostics: ofFrame } = lowerDesign(design, {
    mode,
    config: merged,
    outside,
    block: (block, place) => {
      const n = next++;
      const path = `blocks[${n}]`;
      // (Once for each block: a value of a table's is every cell's.)
      const note = (message: string, severity: "warning" | "info" = "warning") => {
        if (!ofBlocks.some((d) => d.path === path && d.message === message)) ofBlocks.push({ code: "compat/block", severity, message, path });
      };
      const drawn = DRAWN.has(block.type);
      const shown = drawn ? withoutPhone(block, mode) : onDevices(withoutPhone(block, mode), mode);
      const lowered = blockNode(shown, { ...place, id: sources[n]?.id, source: sources[n]?.values, note, keep: (text, pattern?: RegExp) => keepServiceTags(text, tags, pattern) });
      // The block's own HTML in its box, as its tool writes it (it says what its head needs).
      if (lowered?.type === "Raw") {
        raw.set(n, lowered);
        html.set(n, String(lowered.props?.html ?? ""));
        return lowered;
      }
      const node = lowered ? withGivenId(lowered, givenId(block.values ?? {})) : lowered;
      if (node && drawn) return ownPhone(drawable(node, mode, note), mode);
      if (node === null) return node;
      if (node && valid(node, mode)) return ownPhone(withPhonePadding(stackedCap(node), shown), mode);
      const kept: TreeNode = { type: "Raw", props: { html: "" } };
      raw.set(n, kept);
      return kept;
    },
  });
  const tree = { root: lowered };
  const diagnostics = [...ofFrame, ...ofBlocks];
  if (!raw.size) return { root, tree: dropEmpty(tree), mode, config: merged, legacyHead: undefined, diagnostics, tags };
  // Each is written here, once the template is lowered.
  const closed = new Set<number>();
  const { children } = root.props as { children?: React.ReactNode };
  for (const n of raw.keys()) {
    if (html.has(n)) continue;
    const source = sources[n];
    if (!source || !writesOpenHtml(source.element.type)) closed.add(n);
    else html.set(n, blockWithoutMarkers(children, writeBlock(source.element, source.id, source.frame, mode, { ...merged, mode }) ?? ""));
  }
  if (closed.size) recordingBlockHtml((n) => closed.has(n), (n, written) => html.set(n, written), () => renderBody(root, config, name));
  const head = extractHeadFromTree(root, { displayMode: mode, headConfig: merged.headConfig, open: !closed.size });
  // (A printed document's own markup CSS is on its root.)
  const css = closed.size || mode === "document" ? head.css : [ownMarkupCss(mode, body), head.css].filter(Boolean).join("\n");
  for (const [n, node] of raw) {
    const written = html.get(n) ?? "";
    // In a printed document, legacy's text is in the font's own line height ("normal"), where a page's root has 1.5.
    const markup = written && mode === "document" ? `<div style="line-height:normal">${written}</div>` : written;
    node.props = { html: markup, css: [css, node.props?.css].filter(Boolean).join("\n"), text: htmlToPlainText(written) };
  }
  return { root, tree: dropEmpty(tree), mode, config: merged, legacyHead: head, diagnostics, tags };
}

/** What's wrong with the layout of a Row whose Columns don't fit it. */
function layoutThatDoesNotFit(root: React.ReactElement): Error | undefined {
  for (const row of React.Children.toArray((normalizedRoot(root).props as { children?: React.ReactNode }).children)) {
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

/** A block as its tool lowers it: undefined where it keeps its legacy HTML, null where it draws nothing in this output. */
function blockNode(block: DesignBlock, place: Parameters<(typeof BLOCKS)[string]>[1]): TreeNode | null | undefined {
  try {
    return BLOCKS[block.type]?.(block, place);
  } catch (error) {
    if (error instanceof Unlowerable) return undefined;
    throw error;
  }
}

/** A block's node as the new engine checks it, in a document of its own. */
function documentOf(node: TreeNode, mode: Mode): { root: TreeNode } {
  const written = (n: TreeNode): TreeNode => {
    const { textAs: _, designColumn: __, ...rest } = n;
    return rest.children ? { ...rest, children: rest.children.map((c) => (typeof c === "string" ? c : written(c))) } : rest;
  };
  return { root: { type: mode === "email" ? "Email" : "Page", children: [{ type: "Column", children: [written(node)] }] } };
}

/** Whether a block's node is one the new engine takes (its values of the kinds its component's say): else it keeps its legacy HTML. */
function valid(node: TreeNode, mode: Mode): boolean {
  return !checkDocument(documentOf(node, mode)).diagnostics.some((d) => d.severity === "error");
}

/**
 * A block's node without what the new engine refuses of it (a color it doesn't read), each value said: its component's
 * default is drawn instead. A link it refuses (one that runs a script) is a link to nothing.
 */
function drawable(node: TreeNode, mode: Mode, note: (message: string) => void): TreeNode {
  const document = documentOf(node, mode);
  for (let errors = refused(document); errors.length; errors = refused(document)) {
    for (const error of errors) {
      note(error.message);
      removeAt(document, error.path);
    }
  }
  const drawn = (document.root.children![0] as TreeNode).children![0] as TreeNode;
  return node.textAs ? { ...drawn, textAs: node.textAs } : drawn;
}

const refused = (document: { root: TreeNode }) => checkDocument(document).diagnostics.filter((d) => d.severity === "error");

/** Takes the value at a diagnostic's path (`root.children[0].style.color`) out of a document. */
function removeAt(document: { root: TreeNode }, path: string): void {
  const keys = path.match(/[^.[\]]+/g) ?? [];
  const last = keys.pop();
  let at: any = document;
  for (const key of keys) at = at?.[key];
  if (at === undefined || at === null || last === undefined) throw new Unlowerable(`what the new engine can't read at ${path}`);
  if (last === "href") at.href = { href: "" };
  else if (Array.isArray(at)) at.splice(Number(last), 1);
  else if (last in at) delete at[last];
  else throw new Unlowerable(`what the new engine can't read at ${path}`);
}

/**
 * A block in an email: its phone settings and hiding apply at legacy's phone width (render.ts's hideBelow), while its
 * row's columns stack at the email's width. What belongs to that stacking is on the row and its columns, which aren't
 * marked, or an Image's `compat.stackedMaxWidth`.
 */
const ownPhone = (node: TreeNode, mode: Mode): TreeNode => (mode === "email" && hasPhone(node) ? { ...node, compat: { ...node.compat, ownPhone: true } } : node);
const hasPhone = (node: TreeNode): boolean => !!node.mobile || (node.children ?? []).some((child) => typeof child !== "string" && hasPhone(child));

/** Each tool's keys legacy's stylesheet reads for a device: its padding and these. Tools in DRAWN read their own. */
const DEVICE_KEYS: Record<string, string[]> = { image: ["src", "textAlign"], menu: ["padding", "fontSize"] };

/** A tool not yet in DRAWN: the block as it's drawn on desktop, with the phone settings that come of that. */
function onDevices(block: DesignBlock, mode: Mode): DesignBlock {
  const override = block.values?._override;
  if (!override) return block;
  const { values, phone } = deviceValues(block.values, ["containerPadding", ...(DEVICE_KEYS[block.type] ?? [])], mode);
  return { ...block, values: { ...values, _override: { ...override, mobile: { ...override.mobile, ...phone } } } };
}

/** A tool not yet in DRAWN: its block's padding on phones, where it says none (its box is a Column). */
function withPhonePadding(node: TreeNode, block: DesignBlock): TreeNode {
  const padding = sides(block.values?._override?.mobile?.containerPadding);
  return padding && node.type === "Column" && !node.mobile?.padding ? { ...node, mobile: { ...node.mobile, padding } } : node;
}

/** A tool not yet in DRAWN: an Image's maximum on phones that has no width beside it is the one for where its row stacks. */
function stackedCap(node: TreeNode): TreeNode {
  if (node.type === "Image" && node.mobile?.maxWidth !== undefined && node.mobile.width === undefined) {
    const { maxWidth: stackedMaxWidth, ...mobile } = node.mobile;
    const { mobile: _, ...rest } = node;
    return { ...rest, ...(Object.keys(mobile).length ? { mobile } : {}), compat: { ...node.compat, stackedMaxWidth } };
  }
  return node.children ? { ...node, children: node.children.map((child) => (typeof child === "string" ? child : stackedCap(child))) } : node;
}

/** A block in a printed document, without its phone settings: legacy's document has none. */
function withoutPhone(block: DesignBlock, mode: Mode): DesignBlock {
  if (mode !== "document" || !block.values?._override?.mobile) return block;
  const { mobile: _, ...override } = block.values._override;
  return { ...block, values: { ...block.values, _override: override } };
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
function blockSources(root: React.ReactElement): { blocks: BlockSource[]; body: Record<string, any>; rows: OutsideTheDesign["rows"] } {
  const out: BlockSource[] = [];
  const rows: OutsideTheDesign["rows"] = [];
  // What's in a Row or a Column that isn't one of its children in the design, as today's Row and Column write it.
  const all = (element: React.ReactElement<any>) => React.Children.toArray(element.props.children);
  const isText = (child: React.ReactNode): child is string | number => typeof child === "string" || typeof child === "number";
  const elements = (node: React.ReactNode) => React.Children.toArray(node).filter(React.isValidElement) as Array<React.ReactElement<any>>;
  const counts: Record<string, number> = {};
  const nextId = (prefix: string) => `${prefix}_${(counts[prefix] = (counts[prefix] ?? 0) + 1)}`;
  const mapped = (element: React.ReactElement<any>, defaults: any, name: string) => mapSemanticProps<Record<string, any>>(extractSemanticProps(element.props), defaults, name);
  const collected = normalizedRoot(root);
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
      for (const element of elements(column.props.children)) {
        const type = element.type as any;
        const block = !type?.[UNLAYER_CONFIG_KEY] && type?.[KEPT] ? (type[KEPT] as React.ReactElement<any>) : element;
        const config = (block.type as any)?.[UNLAYER_CONFIG_KEY];
        let values: Record<string, any> | undefined;
        if (config) {
          const { children, ...props } = block.props;
          values = mergeValues(config.defaultValues, config.propMapper({ children, ...props }));
        }
        out.push({ values, element, id: nextId(`u_content_${blockName(type)}`), frame: { colIndex, cells, bodyValues, rowValues, columnValues } });
      }
    });
  }
  return { blocks: out, body: bodyValues, rows };
}

/** The tree without Raw nodes that hold nothing (a block that writes nothing in this output). */
function dropEmpty(tree: { root: TreeNode }): { root: TreeNode } {
  const visit = (node: TreeNode): TreeNode => (node.children ? { ...node, children: node.children.filter((c) => typeof c === "string" || c.type !== "Raw" || c.props?.html).map((c) => (typeof c === "string" ? c : visit(c))) } : node);
  return { root: visit(tree.root) };
}
