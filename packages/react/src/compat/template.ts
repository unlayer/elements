/**
 * A template of today's components as the new engine's tree (RFC 0001 step 7): its design lowered (lower.ts), each
 * block in the new components where its tool has moved over and it can be drawn as legacy draws it (blocks/), else a
 * Raw node with the HTML its exporter writes and the legacy stylesheet. Only those blocks are written by today's
 * exporters.
 */
import React from "react";
import { checkDocument } from "@unlayer-internal/elements-core";
import { htmlToPlainText, mergeValues, type UnlayerConfig } from "@unlayer-internal/shared-elements";
import { UNLAYER_CONFIG_KEY } from "../utils/create-component";
import { KEPT, normalizedRoot } from "../utils/normalize";
import { recordingBlockHtml } from "../utils/block-html";
import { extractHeadFromTree } from "../utils/extract-head";
import { renderBody, resolveConfig, resolveDisplayMode } from "../utils/render-to-html";
import { renderToJson } from "../utils/render-to-json";
import { getDisplayName, ROOT_NAMES } from "../utils/unwrap-root";
import { htmlRoot } from "../utils/unwrap-root";
import { BLOCKS } from "./blocks";
import { givenId, hidden, lowerDesign, Unlowerable, type DesignBlock, type Mode, type TreeNode } from "./lower";

export interface Lowered {
  /** The template's root, as it renders (a template component called). */
  root: React.ReactElement;
  /** The template as the new engine's tree. */
  tree: { root: TreeNode };
  mode: Mode;
  config: Partial<UnlayerConfig>;
  /** What today's head functions add to the head (custom tools' scripts and tags), for the Raw blocks that need it. */
  legacyHead: { css: string; js: string; tags: string[] } | undefined;
}

/**
 * A template of today's components as the new engine's tree: undefined where its root isn't one of today's (a block
 * on its own, a component that doesn't return one), and what the new engine can't draw as legacy does where its frame
 * (its body, a row, a column) holds that: it renders as today. Called inside a render's scope.
 */
export function lowerTemplate(element: React.ReactElement, config: Partial<UnlayerConfig> | undefined, name: string): Lowered | { unlowered: string } | undefined {
  const root = htmlRoot(element, name);
  if (!ROOT_NAMES.has(getDisplayName(root) ?? "")) return undefined;
  const merged = resolveConfig(root, config);
  const mode = resolveDisplayMode(root, merged) as Mode;
  const outside = outsideTheDesign(normalizedRoot(root));
  if (outside) return { unlowered: outside };
  const design = renderToJson(root) as unknown as { body: Record<string, any> };
  const sources = blockSources(root);
  // Blocks that keep today's HTML: their Raw nodes, by their number in the design (rows, their columns, their blocks).
  const raw = new Map<number, TreeNode>();
  let next = 0;
  let tree: { root: TreeNode };
  try {
    tree = lowerDesign(design, {
      mode,
      config: merged,
      block: (block, place) => {
        const n = next++;
        const lowered = legacyOnly(block, mode) ? undefined : BLOCKS[block.type]?.(withoutPhone(block, mode), { ...place, source: sources[n] });
        const id = lowered ? givenId(block.values ?? {}) : undefined;
        const node = lowered && id ? { ...lowered, id } : lowered;
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
  if (!raw.size) return { root, tree: dropEmpty(tree), mode, config: merged, legacyHead: undefined };
  const html = new Map<number, string>();
  recordingBlockHtml((n) => raw.has(n), (n, written) => html.set(n, written), () => renderBody(root, config, name));
  const head = extractHeadFromTree(root, { displayMode: mode, headConfig: merged.headConfig });
  for (const [n, node] of raw) {
    const written = html.get(n) ?? "";
    // In a printed document, legacy's text is in the font's own line height ("normal"), where a page's root has 1.5.
    const markup = written && mode === "document" ? `<div style="line-height:normal">${written}</div>` : written;
    node.props = { html: markup, css: head.css, text: htmlToPlainText(written) };
  }
  return { root, tree: dropEmpty(tree), mode, config: merged, legacyHead: head };
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
  // An email service's <%name%> tag (in text, a link), which legacy writes as it is for the service to fill in.
  if (JSON.stringify(block.values ?? {}).includes("<%")) return true;
  const override = block.values?._override ?? {};
  if (Object.keys(override.desktop ?? {}).some((key) => key !== "hideDesktop")) return true;
  return mode === "email" && (Object.keys(override.mobile ?? {}).some((key) => key !== "hideMobile") || !!hidden(block.values ?? {}));
}

/** A block in a printed document, without its phone settings: legacy's document has none. */
function withoutPhone(block: DesignBlock, mode: Mode): DesignBlock {
  if (mode !== "document" || !block.values?._override?.mobile) return block;
  const { mobile: _, ...override } = block.values._override;
  return { ...block, values: { ...block.values, _override: override } };
}

/**
 * Each block's values as its exporter gets them (its props mapped, its defaults in), in the design's order: rows, their
 * columns, their blocks, as renderToJson walks the same collected template.
 */
function blockSources(root: React.ReactElement): Array<Record<string, any> | undefined> {
  const out: Array<Record<string, any> | undefined> = [];
  const elements = (node: React.ReactNode) => React.Children.toArray(node).filter(React.isValidElement) as Array<React.ReactElement<any>>;
  for (const row of elements(normalizedRoot(root).props.children)) {
    if (getDisplayName(row) !== "Row") continue;
    for (const column of elements(row.props.children)) {
      if (getDisplayName(column) !== "Column") continue;
      for (const child of elements(column.props.children)) {
        const type = child.type as any;
        const block = !type?.[UNLAYER_CONFIG_KEY] && type?.[KEPT] ? (type[KEPT] as React.ReactElement<any>) : child;
        const config = (block.type as any)?.[UNLAYER_CONFIG_KEY];
        if (!config) {
          out.push(undefined);
          continue;
        }
        const { children, ...props } = block.props;
        out.push(mergeValues(config.defaultValues, config.propMapper({ children, ...props })));
      }
    }
  }
  return out;
}

/** The tree without Raw nodes that hold nothing (a block that writes nothing in this output). */
function dropEmpty(tree: { root: TreeNode }): { root: TreeNode } {
  const visit = (node: TreeNode): TreeNode => (node.children ? { ...node, children: node.children.filter((c) => typeof c === "string" || c.type !== "Raw" || c.props?.html).map((c) => (typeof c === "string" ? c : visit(c))) } : node);
  return { root: visit(tree.root) };
}
