/**
 * extractHeadFromTree — Walk a React element tree and collect <head> CSS/JS
 * from the exporters' head functions.
 *
 * Mirrors the editor's extractHead.ts but works with the React element tree
 * instead of the Redux design state. Uses the same pattern as render-to-json.ts
 * to walk Body > Row > Column > Item structure.
 */

import React from "react";
import { heads } from "@unlayer/exporters";
import { mergeValues } from "@unlayer-internal/shared-elements";
import type { RenderMode, HeadConfig } from "@unlayer-internal/shared-elements";
import { mapSemanticProps } from "./semantic-props";
import { UNLAYER_CONFIG_KEY } from "./create-component";
import { BODY_DEFAULTS, ROW_DEFAULTS, COLUMN_DEFAULTS } from "./container-defaults";

/** Args every head builder receives: (values, bodyValues, meta). */
type HeadArgs = [Record<string, any>, Record<string, any>, Record<string, any>];

/**
 * Local type for a component's head contributions — the optional css/js/tags
 * builders this file invokes to collect the <head> CSS/JS/tags.
 */
type ComponentHead = {
  css?: (...args: HeadArgs) => string | undefined;
  js?: (...args: HeadArgs) => string | undefined;
  tags?: (...args: HeadArgs) => string[] | undefined;
};

// ============================================
// Inlined helpers
// ============================================

/** Add _meta fields if not present. */
function ensureMeta(values: any, type: string, index: number = 0): any {
  return {
    ...values,
    _meta: {
      htmlID: `u_content_${type.toLowerCase()}_${index + 1}`,
      htmlClassNames: `u_content_${type.toLowerCase()}`,
      ...(values._meta || {})
    }
  };
}

/** Get the displayName of a React element's component type. */
function getDisplayName(element: React.ReactElement): string | undefined {
  const type = element.type as any;
  return type?.displayName || type?.name;
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
// Types
// ============================================

export interface ExtractHeadResult {
  /** Combined CSS from all head functions */
  css: string;
  /** Combined JS from all head functions */
  js: string;
  /** Unique HTML tags (meta, link, etc.) from all head functions */
  tags: string[];
}

export interface ExtractHeadOptions {
  /** Display mode for rendering */
  displayMode: RenderMode;
  /** Optional head config for feature flags and initial values */
  headConfig?: HeadConfig;
}

/**
 * Call a head's css/js/tags functions and collect the results.
 */
function callHead(
  head: ComponentHead | undefined,
  values: Record<string, any>,
  bodyValues: Record<string, any>,
  displayMode: RenderMode,
  headConfig: HeadConfig,
  styles: string[],
  scripts: string[],
  tags: string[]
): void {
  if (!head) return;

  const headArgs: [Record<string, any>, Record<string, any>, Record<string, any>] = [
    values,
    bodyValues,
    {
      displayMode,
      isViewer: false,
      variant: null,
      type: "rows",
      headConfig,
    },
  ];

  const css = head.css?.(...headArgs);
  if (css) styles.push(css);

  const js = head.js?.(...headArgs);
  if (js) scripts.push(js);

  const headTags = head.tags?.(...headArgs);
  if (headTags) tags.push(...headTags);
}

// ============================================
// Tree walkers
// ============================================

function walkItem(
  element: React.ReactElement,
  bodyValues: Record<string, any>,
  displayMode: RenderMode,
  headConfig: HeadConfig,
  counters: Record<string, number>,
  styles: string[],
  scripts: string[],
  tags: string[]
): void {
  const componentType = element.type as any;
  const config = componentType[UNLAYER_CONFIG_KEY];
  if (!config) return;

  const { name, defaultValues, propMapper } = config;

  // Map and merge values (same as render-to-json and create-component)
  const { children, ...restProps } = element.props;
  const mappedValues = propMapper({ children, ...restProps });
  const finalValues = mergeValues(defaultValues, mappedValues);

  // Track component index (same counter pattern as render-to-json.ts)
  const contentType = name.toLowerCase();
  const count = nextCounter(counters, `u_content_${contentType}`);
  const valuesWithMeta = ensureMeta(finalValues, contentType, count - 1);

  // Look up head by component name
  const head = (heads as Record<string, ComponentHead | undefined>)[name];
  callHead(head, valuesWithMeta, bodyValues, displayMode, headConfig, styles, scripts, tags);

}

function walkColumn(
  element: React.ReactElement,
  bodyValues: Record<string, any>,
  rowValues: Record<string, any>,
  displayMode: RenderMode,
  headConfig: HeadConfig,
  counters: Record<string, number>,
  styles: string[],
  scripts: string[],
  tags: string[]
): void {
  // Column head
  const semanticProps = extractSemanticProps(element.props);
  const mapped = mapSemanticProps(semanticProps, COLUMN_DEFAULTS, "Column");
  const count = nextCounter(counters, "u_column");
  const columnValues = ensureMeta(mergeValues(COLUMN_DEFAULTS, mapped), "column", count - 1);

  const columnHead = (heads as Record<string, ComponentHead | undefined>)["Column"];
  callHead(columnHead, columnValues, bodyValues, displayMode, headConfig, styles, scripts, tags);

  // Walk item children
  const children = collectChildren(element.props.children);
  for (const child of children) {
    walkItem(child, bodyValues, displayMode, headConfig, counters, styles, scripts, tags);
  }
}

function walkRow(
  element: React.ReactElement,
  bodyValues: Record<string, any>,
  displayMode: RenderMode,
  headConfig: HeadConfig,
  counters: Record<string, number>,
  styles: string[],
  scripts: string[],
  tags: string[]
): void {
  // Row head
  const semanticProps = extractSemanticProps(element.props, ["layout"]);
  const mapped = mapSemanticProps(semanticProps, ROW_DEFAULTS, "Row");
  const count = nextCounter(counters, "u_row");
  const rowValues = ensureMeta(mergeValues(ROW_DEFAULTS, mapped), "row", count - 1);

  const rowHead = (heads as Record<string, ComponentHead | undefined>)["Row"];
  callHead(rowHead, rowValues, bodyValues, displayMode, headConfig, styles, scripts, tags);

  // Walk column children
  const children = collectChildren(element.props.children);
  for (const child of children) {
    const name = getDisplayName(child);
    if (name === "Column") {
      walkColumn(child, bodyValues, rowValues, displayMode, headConfig, counters, styles, scripts, tags);
    }
  }
}

// ============================================
// Public API
// ============================================

/**
 * Extract head CSS/JS/tags from a React element tree.
 *
 * Walks the tree statically (same approach as renderToJson) and calls
 * each component's head function from @unlayer/exporters.
 *
 * @param element - Root element (Body, Email, Page, or Document)
 * @param options - Display mode and optional head config
 * @returns Combined CSS, JS, and tags from all head functions
 */
export function extractHeadFromTree(
  element: React.ReactElement,
  options: ExtractHeadOptions
): ExtractHeadResult {
  const { displayMode } = options;
  const headConfig: HeadConfig = {
    hasFeature: options.headConfig?.hasFeature ?? (() => false),
    getInitialValues: options.headConfig?.getInitialValues ?? (() => ({})),
  };

  const styles: string[] = [];
  const scripts: string[] = [];
  const tags: string[] = [];
  const counters: Record<string, number> = {};

  // Extract body values
  const semanticProps = extractSemanticProps(element.props);
  const mapped = mapSemanticProps(semanticProps, BODY_DEFAULTS, "Body");
  const bodyValues = ensureMeta(mergeValues(BODY_DEFAULTS, mapped), "body", 0);

  // Body head
  const bodyHead = (heads as Record<string, ComponentHead | undefined>)["Body"];
  callHead(bodyHead, bodyValues, bodyValues, displayMode, headConfig, styles, scripts, tags);

  // Walk rows
  const children = collectChildren(element.props.children);
  for (const child of children) {
    const name = getDisplayName(child);
    if (name === "Row") {
      walkRow(child, bodyValues, displayMode, headConfig, counters, styles, scripts, tags);
    }
  }

  // Deduplicate tags
  const uniqueTags = [...new Set(tags.filter(Boolean))];

  return {
    css: styles.filter(Boolean).join("\n"),
    js: scripts.filter(Boolean).join("\n"),
    tags: uniqueTags,
  };
}
