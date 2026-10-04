/**
 * @unlayer/from-react-email — convert React Email templates to Unlayer Elements.
 */

import React from "react";
import { render } from "@react-email/components";
import { renderToHtml, renderToJson } from "@unlayer/react-elements";
import {
  compareText,
  treeToDesign,
  treeToHtml,
  treeToTsx,
  type ConversionReport,
  type ElementNode,
  type TextCheck,
} from "@unlayer/convert-core";
import { findTailwindConfig } from "./expand";
import { convertElement } from "./runtime";
import { mergeTagged } from "./merge-tags";

type Template = React.ComponentType<any> & { PreviewProps?: Record<string, unknown> };

export interface RuntimeOptions {
  /** Props to render the template with. Defaults to its `PreviewProps`. */
  props?: Record<string, unknown>;
  /** Name for the generated component. */
  componentName?: string;
  /**
   * Text props become merge tags (`{{user.name}}`) where the template shows
   * them as given, instead of their sample values. On by default; `false`
   * keeps the sample values.
   */
  mergeTags?: boolean;
}

export interface Conversion {
  tree: ElementNode;
  fonts: Array<{ url: string }>;
  report: ConversionReport;
  tsx(): Promise<string>;
  design(): Record<string, any>;
  html(): string;
}

/**
 * Runtime mode: render `Template` with sample props and convert what it
 * renders. Logic (loops, conditions) is flattened into content.
 *
 * The result is checked against the original: `report.missingText` lists
 * any words the original shows that the conversion doesn't (empty when
 * nothing was lost).
 */
export async function convertReactEmail(Template: Template, options: RuntimeOptions = {}): Promise<Conversion> {
  const props = options.props ?? Template.PreviewProps ?? {};
  const element = React.createElement(Template, props);
  const converted = await convertElement(element);
  const { fonts, report } = converted;
  // Checked with the sample values: merge tags stand in for them only where that changes nothing else.
  const check = compareText(await render(element), treeToHtml(converted.tree, { fonts }));
  report.missingText = check.missing;
  report.missingAttributes = check.missingAttributes;
  let tree = converted.tree;
  if (options.mergeTags !== false) {
    const tagged = await mergeTagged(props, converted.tree, async (p) => (await convertElement(React.createElement(Template, p))).tree);
    if (tagged.result) tree = tagged.result;
    if (tagged.used.length) report.info.push({ reason: "text props became merge tags", detail: tagged.used.join(", ") });
    for (const path of tagged.kept) report.info.push({ reason: "text prop kept as its sample value (the template changes or tests it)", detail: path });
  }
  return {
    tree,
    fonts,
    report,
    tsx: () =>
      treeToTsx(tree, {
        componentName: options.componentName ?? "Template",
        header: ["Converted from a React Email template by @unlayer/from-react-email (runtime mode)."],
      }),
    design: () => treeToDesign(tree),
    html: () => treeToHtml(tree, { fonts }),
  };
}

export interface Verification extends TextCheck {
  originalHtml: string;
  convertedHtml: string;
  /** What the visual editor wouldn't get: renderToJson's warnings (e.g. blocks it can't walk). */
  designWarnings: string[];
  /** The design JSON the visual editor opens (`loadDesign`), rendered with the same props. */
  design: Record<string, unknown>;
  /**
   * The same check with each boolean prop flipped, to reach branches the
   * preview props don't take. Only variants that lost something, or where
   * the migrated template fails and the original doesn't, are listed.
   */
  variants: Array<{ change: string; missing: string[]; missingAttributes: string[]; error?: string }>;
}

/**
 * Check a migrated template (codemod output) against the original: render
 * both with the same props and compare the words, links and images they
 * show, and check the design JSON the editor would open. Each boolean prop
 * is also flipped once, to cover branches the preview props don't take.
 * Run it before trusting a migration.
 */
export async function verifyConversion(
  Original: Template,
  Converted: (props: any) => React.ReactElement,
  options: { props?: Record<string, unknown> } = {}
): Promise<Verification> {
  const props = options.props ?? Original.PreviewProps ?? {};
  const originalHtml = await render(React.createElement(Original, props));
  // renderToHtml reads the root (Email) element, so call the component.
  const convertedHtml = renderToHtml(Converted(props));
  const designWarnings: string[] = [];
  const warn = console.warn;
  console.warn = (...args: unknown[]) => void designWarnings.push(args.map(String).join(" "));
  let design: Record<string, unknown>;
  try {
    design = renderToJson(Converted(props)) as unknown as Record<string, unknown>;
  } finally {
    console.warn = warn;
  }

  const variants: Verification["variants"] = [];
  for (const [name, value] of Object.entries(props)) {
    if (typeof value !== "boolean") continue;
    const flipped = { ...props, [name]: !value };
    const change = `${name}: ${!value}`;
    let original: string;
    try {
      original = await render(React.createElement(Original, flipped));
    } catch {
      continue; // the original doesn't render this way either: nothing to compare
    }
    try {
      const check = compareText(original, renderToHtml(Converted(flipped)));
      if (check.missing.length || check.missingAttributes.length) variants.push({ change, missing: check.missing, missingAttributes: check.missingAttributes });
    } catch (error) {
      variants.push({ change, missing: [], missingAttributes: [], error: (error as Error).message.split("\n")[0] });
    }
  }
  return { ...compareText(originalHtml, convertedHtml), originalHtml, convertedHtml, designWarnings, design, variants };
}

/**
 * The design JSON the visual editor opens for a migrated template, with
 * text props as merge tags (`{{user.name}}`) where the template shows them
 * as given. `design` is its design JSON with the sample props.
 */
export async function mergeTagDesign(
  Converted: (props: any) => React.ReactElement,
  props: Record<string, unknown>,
  design: Record<string, unknown>
): Promise<{ design: Record<string, unknown>; used: string[]; kept: string[] }> {
  const warn = console.warn;
  console.warn = () => undefined; // the same warnings as the sample render, already reported
  try {
    const tagged = await mergeTagged(props, design, (p) => renderToJson(Converted(p)) as unknown as Record<string, unknown>);
    return { design: tagged.result ?? design, used: tagged.used, kept: tagged.kept };
  } finally {
    console.warn = warn;
  }
}

/** A template's Tailwind config as it renders (it can be code: plugins, presets), for `convertSource`. */
export async function templateTailwindConfig(Original: Template, props?: Record<string, unknown>): Promise<Record<string, unknown> | undefined> {
  return findTailwindConfig(React.createElement(Original, props ?? Original.PreviewProps ?? {}));
}

export { rebaseImports } from "./imports";
export { mergeTagged, textProps, type TextProp } from "./merge-tags";
export { compareText, htmlWords, type TextCheck } from "@unlayer/convert-core";
export { convertElement } from "./runtime";
export { expand, findTailwindConfig, REACT_EMAIL_COMPONENTS } from "./expand";
export { convertSource, type CodemodOptions, type CodemodResult } from "./codemod";
export type { ModuleLoader } from "./components";
