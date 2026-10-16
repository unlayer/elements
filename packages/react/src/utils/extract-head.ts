/**
 * extractHeadFromTree — Walk a React element tree and collect <head> CSS/JS
 * from the exporters' head functions.
 *
 * Mirrors the editor's extractHead.ts but works with the React element tree
 * instead of the Redux design state. Uses the same pattern as render-to-json.ts
 * to walk Body > Row > Column > Item structure.
 */

import React from "react";
import { collectDeviceStyles, deviceStylesCss, deviceVisibilityCss } from "./device-overrides";
import { heads } from "@unlayer/exporters";
import { mergeValues } from "@unlayer-internal/shared-elements";
import type { RenderMode, HeadConfig } from "@unlayer-internal/shared-elements";
import { mapSemanticProps } from "./semantic-props";
import { UNLAYER_CONFIG_KEY, cssUrl } from "./create-component";
import { BODY_DEFAULTS, ROW_DEFAULTS, COLUMN_DEFAULTS } from "./container-defaults";
import { headTags, KEPT, normalizedRoot } from "./normalize";
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

/** Add _meta fields if not present: the id the HTML gives it (`u_body_1`, `u_row_2`, `u_content_paragraph_3`). */
function ensureMeta(values: any, type: string, index: number = 0): any {
  return {
    ...values,
    _meta: {
      htmlID: `${["body", "row", "column"].includes(type) ? "u" : "u_content"}_${type.toLowerCase()}_${index + 1}`,
      htmlClassNames: `u_content_${type.toLowerCase()}`,
      ...(values._meta || {})
    }
  };
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
  // What its content gives the head (a <Font>), then the rows and blocks as the body rendered them (the same collected render).
  const fonts = headTags((element.props as { children?: React.ReactNode }).children, options.displayMode, getDisplayName(element));
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
  const registry = heads as Record<string, ComponentHead | undefined>;
  let bodyValues: Record<string, any> | undefined;

  /** A head's CSS, JS and tags for the values of the Body, Row, Column or block it's for. */
  const call = (head: ComponentHead | undefined, values: Record<string, any>) => {
    const args: HeadArgs = [values, bodyValues ?? values, { displayMode, isViewer: false, variant: null, type: "rows", headConfig }];
    const css = head?.css?.(...args);
    if (css) styles.push(css);
    const js = head?.js?.(...args);
    if (js) scripts.push(js);
    tags.push(...(head?.tags?.(...args) ?? []));
  };

  /** A container's values (with the id the HTML gives it), its phone and desktop styles, and its head. */
  const container = (node: React.ReactElement<any>, name: "Body" | "Row" | "Column", defaults: Record<string, any>) => {
    const type = name.toLowerCase();
    const mapped = mapSemanticProps(extractSemanticProps(node.props), defaults, name);
    const values = ensureMeta(mergeValues(defaults, mapped), type, name === "Body" ? 0 : nextCounter(counters, `u_${type}`) - 1);
    // (A background image's URL as CSS takes it, as in the body: see cssUrl.)
    cssUrl(values);
    if (name !== "Body") collectDeviceStyles(values, `${type}s` as "rows" | "columns", name, displayMode, deviceStyles);
    call(registry[name], values);
    return values;
  };

  /** The element children of a collected (Elements-only) tree, of one component where it's named. */
  const children = (node: React.ReactElement<any>, name?: string) =>
    React.Children.toArray(node.props.children).filter((child): child is React.ReactElement<any> => React.isValidElement(child) && (!name || getDisplayName(child) === name));

  bodyValues = container(element, "Body", BODY_DEFAULTS);
  for (const row of children(element, "Row")) {
    container(row, "Row", ROW_DEFAULTS);
    for (const column of children(row, "Column")) {
      container(column, "Column", COLUMN_DEFAULTS);
      for (const block of children(column)) {
        const type = block.type as any;
        const config = type[UNLAYER_CONFIG_KEY];
        if (!config) {
          // Markup a component of the user's own rendered in a Column: the HTML numbers it after the component.
          if (type?.[KEPT]) nextCounter(counters, `u_content_${(type.displayName || type.name || "component").toLowerCase()}`);
          continue;
        }
        // Mapped and merged as the HTML and the design do, numbered as they are.
        const contentType = config.metaName ?? config.name.toLowerCase();
        const { _record, ...props } = block.props;
        const values = ensureMeta(mergeValues(config.defaultValues, config.propMapper(props)), contentType, nextCounter(counters, `u_content_${contentType}`) - 1);
        collectDeviceStyles(values, "contents", config.name, displayMode, deviceStyles);
        // The component's own head (custom tools) wins over the registry's.
        call(config.head ?? registry[config.name], values);
      }
    }
  }

  styles.unshift(deviceVisibilityCss(displayMode));
  const overrides = deviceStylesCss(deviceStyles, displayMode);
  if (overrides) styles.push(overrides);

  return {
    css: styles.filter(Boolean).join("\n"),
    js: scripts.filter(Boolean).join("\n"),
    // Each tag once.
    tags: [...new Set([...fonts, ...tags].filter(Boolean))],
  };
}
