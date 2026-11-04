/**
 * A template of today's components as the new engine's tree (RFC 0001 step 7): its design lowered (lower.ts), each
 * block in the new components where its tool has moved over and it can be drawn as legacy draws it (blocks/), else a
 * Raw node; a tool that always draws (DRAWN) says what it can't read instead. A Raw node of a custom tool, an Html block or a user's own markup holds that HTML in its box (contentBox),
 * with what its head needs from the blocks themselves: nothing of the closed exporters runs. Any other Raw node holds
 * the HTML its exporter writes and the legacy stylesheet; only those blocks are written by today's exporters.
 */
import React from "react";
import { checkDocument, type Diagnostic } from "@unlayer-internal/elements-core";
import { htmlToPlainText, mergeValues, type UnlayerConfig } from "@unlayer-internal/shared-elements";
import { BODY_DEFAULTS, COLUMN_DEFAULTS, ROW_DEFAULTS } from "../utils/container-defaults";
import { safeMeta, UNLAYER_CONFIG_KEY } from "../utils/create-component";
import { blockWithoutMarkers, KEPT, normalizedRoot } from "../utils/normalize";
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
import { keepServiceTags, serviceTag } from "./values";
import { blockName, givenId, hidden, lowerDesign, Unlowerable, writeBlock, type BlockFrame, type DesignBlock, type Mode, type TreeNode } from "./lower";

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
  /** What's drawn otherwise than a block asks. */
  diagnostics: Diagnostic[];
  /** The email service's tags the tree holds as marks (values.ts), which go back into what's written. */
  tags: string[];
}

/**
 * A template of today's components as the new engine's tree: undefined where its root isn't one of today's (a block
 * on its own, a component that doesn't return one), and what the new engine can't draw as legacy does where its frame
 * (its body, a row, a column) holds that: it renders as today. Called inside a render's scope.
 */
export function lowerTemplate(element: React.ReactElement, config: Partial<UnlayerConfig> | undefined, name: string): Lowered | { unlowered: string } | undefined {
  const root = htmlRoot(element, name);
  if (!ROOT_NAMES.has(getDisplayName(root) ?? "")) return undefined;
  // Another copy of this package's components (a tool that loads templates with one of its own): they collect and
  // render themselves, which this copy's lowering can't read; it renders as today, through them.
  if (!OWN_ROOTS.has(root.type)) return undefined;
  const merged = resolveConfig(root, config);
  const mode = resolveDisplayMode(root, merged) as Mode;
  const outside = outsideTheDesign(normalizedRoot(root));
  if (outside) return { unlowered: outside };
  const design = renderToJson(root) as unknown as { body: Record<string, any> };
  const { blocks: sources, body } = blockSources(root);
  // Blocks that keep today's HTML: their Raw nodes, by their number in the design (rows, their columns, their blocks).
  const raw = new Map<number, TreeNode>();
  const diagnostics: Diagnostic[] = [];
  const tags: string[] = [];
  let next = 0;
  let tree: { root: TreeNode };
  try {
    tree = lowerDesign(design, {
      mode,
      config: merged,
      block: (block, place) => {
        const n = next++;
        const path = `blocks[${n}]`;
        // (Once for each block: a value of a table's is every cell's.)
        const note = (message: string, severity: "warning" | "info" = "warning") => {
          if (!diagnostics.some((d) => d.path === path && d.message === message)) diagnostics.push({ code: "compat/block", severity, message, path });
        };
        const drawn = DRAWN.has(block.type);
        const lowered = !drawn && legacyOnly(block, mode) ? undefined : BLOCKS[block.type]?.(withoutPhone(block, mode), { ...place, source: sources[n]?.values, note, keep: (text) => keepServiceTags(text, tags) });
        const id = lowered ? givenId(block.values ?? {}) : undefined;
        const node = lowered && id ? { ...lowered, id } : lowered;
        if (node && drawn) return drawable(node, mode, note);
        if (node === null || (node && valid(node, mode))) return node;
        const kept: TreeNode = { type: "Raw", props: { html: "" } };
        raw.set(n, kept);
        return kept;
      },
    });
  } catch (error) {
    if (error instanceof Unlowerable) return { unlowered: error.message };
    throw error;
  }
  if (!raw.size) return { root, tree: dropEmpty(tree), mode, config: merged, legacyHead: undefined, diagnostics, tags };
  // Each is written here, once the template is lowered (a template that isn't renders as today, which writes them).
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
  const css = closed.size ? head.css : [ownMarkupCss(mode, body), head.css].filter(Boolean).join("\n");
  for (const [n, node] of raw) {
    const written = html.get(n) ?? "";
    // In a printed document, legacy's text is in the font's own line height ("normal"), where a page's root has 1.5.
    const markup = written && mode === "document" ? `<div style="line-height:normal">${written}</div>` : written;
    node.props = { html: markup, css, text: htmlToPlainText(written) };
  }
  return { root, tree: dropEmpty(tree), mode, config: merged, legacyHead: head, diagnostics, tags };
}

/**
 * What the template holds that its design doesn't, which legacy draws: markup among its rows, text in a row or a
 * column. It renders as today.
 */
function outsideTheDesign(root: React.ReactElement): string | undefined {
  const children = (element: React.ReactElement) => React.Children.toArray((element.props as { children?: React.ReactNode }).children);
  const shown = (child: React.ReactNode) => (typeof child === "string" || typeof child === "number" ? String(child).trim() !== "" : React.isValidElement(child));
  for (const row of children(root)) {
    if (!React.isValidElement(row) || getDisplayName(row) !== "Row") {
      if (shown(row)) return "markup among the rows";
      continue;
    }
    for (const column of children(row)) {
      if (!React.isValidElement(column) || getDisplayName(column) !== "Column") {
        if (shown(column)) return "text or markup in a row";
        continue;
      }
      if (children(column).some((child) => !React.isValidElement(child) && shown(child))) return "text in a column";
    }
  }
  return undefined;
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
function blockSources(root: React.ReactElement): { blocks: BlockSource[]; body: Record<string, any> } {
  const out: BlockSource[] = [];
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
  return { blocks: out, body: bodyValues };
}

/** The tree without Raw nodes that hold nothing (a block that writes nothing in this output). */
function dropEmpty(tree: { root: TreeNode }): { root: TreeNode } {
  const visit = (node: TreeNode): TreeNode => (node.children ? { ...node, children: node.children.filter((c) => typeof c === "string" || c.type !== "Raw" || c.props?.html).map((c) => (typeof c === "string" ? c : visit(c))) } : node);
  return { root: visit(tree.root) };
}
