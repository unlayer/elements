/**
 * A template of today's components as the new engine's tree (RFC 0001 step 7): its design lowered (lower.ts), each
 * block in the new components where its tool has moved over and it can be drawn as legacy draws it (blocks/), else a
 * Raw node. A Raw node of a custom tool, an Html block or a user's own markup holds that HTML in its box (contentBox),
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
import { BLOCKS } from "./blocks";
import { ownMarkupCss } from "./quirks";
import { serviceTag } from "./values";
import { blockName, givenId, hidden, lowerDesign, Unlowerable, withGivenId, writeBlock, type BlockFrame, type DesignBlock, type Mode, type OutsideTheDesign, type TreeNode } from "./lower";

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
  /** What it says of the template's frame. */
  diagnostics: Diagnostic[];
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
    return { root, tree: { root: empty }, mode, config: merged, legacyHead: undefined, diagnostics: [...diagnostics, { code: "compat/layout", severity: "warning", message: `${unfit.message}: the body has no rows`, path: "body.rows" }] };
  }
  // Today's Body gives what's among its rows these (a block or a Column there is rendered as it renders it).
  const place = (child: React.ReactElement) => React.cloneElement(child as React.ReactElement<any>, { _config: { ...merged, mode, __ids: {} }, bodyValues: body });
  const outside: OutsideTheDesign = { among: amongRows((root.props as { children?: React.ReactNode }).children, place), rows };
  // Blocks that keep today's HTML: their Raw nodes, by their number in the design (rows, their columns, their blocks).
  const raw = new Map<number, TreeNode>();
  let next = 0;
  const { root: lowered, diagnostics } = lowerDesign(design, {
    mode,
    config: merged,
    outside,
    block: (block, place) => {
      const n = next++;
      const node = blockNode(block, mode, { ...place, source: sources[n]?.values });
      if (node === null || (node && valid(node, mode))) return node;
      const kept: TreeNode = { type: "Raw", props: { html: "" } };
      raw.set(n, kept);
      return kept;
    },
  });
  const tree = { root: lowered };
  if (!raw.size) return { root, tree: dropEmpty(tree), mode, config: merged, legacyHead: undefined, diagnostics };
  // Each is written here, once the template is lowered.
  const html = new Map<number, string>();
  const closed = new Set<number>();
  const { children } = root.props as { children?: React.ReactNode };
  for (const n of raw.keys()) {
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
    node.props = { html: markup, css, text: htmlToPlainText(written) };
  }
  return { root, tree: dropEmpty(tree), mode, config: merged, legacyHead: head, diagnostics };
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
function blockNode(block: DesignBlock, mode: Mode, place: Parameters<(typeof BLOCKS)[string]>[1]): TreeNode | null | undefined {
  try {
    const lowered = legacyOnly(block, mode) ? undefined : BLOCKS[block.type]?.(withoutPhone(block, mode), place);
    return lowered ? withGivenId(lowered, givenId(block.values ?? {})) : lowered;
  } catch (error) {
    if (error instanceof Unlowerable) return undefined;
    throw error;
  }
}

/** Whether a block's node is one the new engine takes (its values of the kinds its component's say): else it keeps its legacy HTML. */
function valid(node: TreeNode, mode: Mode): boolean {
  const written = (n: TreeNode): TreeNode => {
    const { textAs: _, designColumn: __, ...rest } = n;
    return rest.children ? { ...rest, children: rest.children.map((c) => (typeof c === "string" ? c : written(c))) } : rest;
  };
  const document = { root: { type: mode === "email" ? "Email" : "Page", children: [{ type: "Column", children: [written(node)] }] } };
  return !checkDocument(document).diagnostics.some((d) => d.severity === "error");
}

/**
 * Whether a block keeps its legacy HTML whatever its tool: one holding an email service's <%name%> tag, one with
 * settings for desktop windows, which legacy applies above 480px, or in an email one with settings for phones or
 * hidden on either, which legacy applies on either side of 480px where the new email's phone styles start at its width
 * (its markup hides it as legacy does).
 */
function legacyOnly(block: DesignBlock, mode: Mode): boolean {
  // An email service's tag (in text, a link), which legacy writes as it is for the service to fill in.
  if (strings(block.values).some(serviceTag)) return true;
  const override = block.values?._override ?? {};
  if (Object.keys(override.desktop ?? {}).some((key) => key !== "hideDesktop")) return true;
  // Settings for a tablet's width, which legacy applies there.
  if (Object.keys(override.tablet ?? {}).length) return true;
  return mode === "email" && (Object.keys(override.mobile ?? {}).some((key) => key !== "hideMobile") || !!hidden(block.values ?? {}));
}

/** Every string in a block's values, however deep. */
function strings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (value && typeof value === "object") return Object.values(value).flatMap(strings);
  return [];
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
