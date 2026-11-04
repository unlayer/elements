/**
 * extractHeadFromTree: what a template's blocks of open HTML (a custom tool's, an Html block's, markup kept from a
 * component of the user's) need in `<head>`: their own head functions' CSS, JS and tags, and their settings for a device.
 * The new engine writes what its own blocks need (hover, phone settings) with them. Walks the same collected template
 * as the render (Body > Row > Column > Item).
 */

import React from "react";
import { collectDeviceStyles, deviceStylesCss, deviceVisibilityCss } from "./device-overrides";
import { mergeValues } from "@unlayer-internal/shared-elements";
import type { RenderMode, HeadConfig } from "@unlayer-internal/shared-elements";
import { mapSemanticProps } from "./semantic-props";
import { UNLAYER_CONFIG_KEY } from "./create-component";
import { BODY_DEFAULTS } from "./container-defaults";
import { KEPT, normalizedRoot } from "./normalize";
import { getDisplayName } from "./unwrap-root";
import { extractSemanticProps, nextCounter } from "./render-to-json";

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
      htmlID: `${["row", "column"].includes(type) ? "u" : "u_content"}_${type.toLowerCase()}_${index + 1}`,
      htmlClassNames: `u_content_${type.toLowerCase()}`,
      ...(values._meta || {})
    }
  };
}


/** The element children of a collected (Elements-only) tree. */
const collectChildren = (node: React.ReactNode): React.ReactElement[] => React.Children.toArray(node).filter(React.isValidElement);

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

/** A block whose HTML is the user's own (a custom tool's exporter, an Html block, markup kept from a component of theirs). */
function writesOpenHtml(type: any): boolean {
  const config = type?.[UNLAYER_CONFIG_KEY];
  return config ? config.contentType === "custom" || config.name === "Html" : !!type?.[KEPT];
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
  tags: string[],
  deviceStyles: Record<string, string[]>
): void {
  const componentType = element.type as any;
  const config = componentType[UNLAYER_CONFIG_KEY];
  if (!config) {
    // Markup a component of the user's own rendered in a Column: the HTML numbers it after the component.
    if (componentType?.[KEPT]) nextCounter(counters, `u_content_${(componentType.displayName || componentType.name || "component").toLowerCase()}`);
    return;
  }

  const { name, defaultValues, propMapper } = config;

  // Track component index (same counter pattern as render-to-json.ts)
  const contentType = config.metaName ?? name.toLowerCase();
  const count = nextCounter(counters, `u_content_${contentType}`);
  // A block a new component draws writes none of the classes these select.
  if (!writesOpenHtml(componentType)) return;

  // Map and merge values (same as render-to-json and create-component)
  const { children, ...restProps } = element.props;
  const mappedValues = propMapper({ children, ...restProps });
  const finalValues = mergeValues(defaultValues, mappedValues);
  const valuesWithMeta = ensureMeta(finalValues, contentType, count - 1);

  collectDeviceStyles(valuesWithMeta, "contents", name, displayMode, deviceStyles);

  callHead(config.head as ComponentHead | undefined, valuesWithMeta, bodyValues, displayMode, headConfig, styles, scripts, tags);
}

// ============================================
// Public API
// ============================================

/**
 * Extract head CSS/JS/tags from a React element tree.
 *
 * @param element - Root element (Body, Email, Page, or Document)
 * @param options - Display mode and optional head config
 * @returns Combined CSS, JS, and tags from all head functions
 */
export function extractHeadFromTree(
  element: React.ReactElement,
  options: ExtractHeadOptions
): ExtractHeadResult {
  // The rows and blocks as the body rendered them (the same collected render).
  element = normalizedRoot(element);
  const { displayMode } = options;
  const headConfig: HeadConfig = {
    hasFeature: options.headConfig?.hasFeature ?? (() => false),
    getInitialValues: options.headConfig?.getInitialValues ?? (() => ({})),
  };

  const styles: string[] = [];
  const scripts: string[] = [];
  const tags: string[] = [];
  const counters: Record<string, number> = {};
  const deviceStyles: Record<string, string[]> = {};

  // Extract body values
  const semanticProps = extractSemanticProps(element.props);
  const mapped = mapSemanticProps(semanticProps, BODY_DEFAULTS, "Body");
  const bodyValues = ensureMeta(mergeValues(BODY_DEFAULTS, mapped), "body", 0);

  // Walk rows
  const children = collectChildren(element.props.children);
  const named = (parents: React.ReactElement[], name: string) => parents.filter((c) => getDisplayName(c) === name).flatMap((c) => collectChildren((c.props as { children?: React.ReactNode }).children));
  for (const block of named(named(children, "Row"), "Column")) walkItem(block, bodyValues, displayMode, headConfig, counters, styles, scripts, tags, deviceStyles);

  styles.unshift(deviceVisibilityCss(displayMode));
  const overrides = deviceStylesCss(deviceStyles, displayMode);
  if (overrides) styles.push(overrides);

  // Deduplicate tags
  const uniqueTags = [...new Set(tags.filter(Boolean))];

  return {
    css: styles.filter(Boolean).join("\n"),
    js: scripts.filter(Boolean).join("\n"),
    tags: uniqueTags,
  };
}
