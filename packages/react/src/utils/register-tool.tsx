/**
 * registerTool — render the editor's custom tools from code.
 *
 * Accepts the same tool definition object embedders already write for
 * `unlayer.registerTool` (see docs.unlayer.com › Custom Tools) and returns a
 * React component. One definition powers both runtimes:
 *
 * - The Builder uses `label`/`icon`/`options`/`renderer.Viewer`/`validator`
 *   for its panel, canvas, and audit — Elements ignores those.
 * - Elements calls `renderer.exporters[mode](values)` to produce HTML and
 *   collects `renderer.head` css/js like any built-in component, so code
 *   output matches editor exports by construction — it is the same function.
 * - `renderToJson` emits `{ type: "custom", slug: <name>, values }`, the
 *   shape the editor stores, so designs round-trip into the Builder where
 *   the same tool is registered.
 *
 * Sanitization: like editor exports, the tool's HTML output is passed
 * through `toSafeHtml` when one is configured. The default config has NO
 * sanitizer — with untrusted values, configure `toSafeHtml` (same caveat
 * as the `<Html>` component).
 */

import React from "react";
import {
  createItemComponent,
  type BaseItemComponentProps,
} from "./create-component";
import type { RenderMode } from "@unlayer-internal/shared-elements";
import { normalizeLinkValue } from "@unlayer-internal/shared-elements";

/** Exporter: `(values) => html`. Extra args mirror built-in exporters and can be ignored. */
export type ToolExporter = (values: any, ...args: any[]) => string;

/** One property in an options group — Elements reads only the default. */
interface ToolOptionConfig {
  defaultValue?: unknown;
  /** Disabled options contribute no default */
  enabled?: boolean;
  [editorOnly: string]: unknown;
}

/** A property group: `options.<group>.options.<property>` */
interface ToolOptionGroup {
  options?: Record<string, ToolOptionConfig | undefined>;
  [editorOnly: string]: unknown;
}

/**
 * The subset of the `unlayer.registerTool` config Elements reads. Extra
 * editor-only fields (label, icon, Viewer, validator, transformer, ...)
 * are accepted and ignored, so the same object can be passed to both APIs.
 */
export interface ElementsToolConfig {
  /** Unique tool name — becomes the design JSON `slug` */
  name: string;
  /** Initial values for the tool's properties (win over option defaults) */
  values?: Record<string, any>;
  /**
   * Property groups. Real-world tools usually define their defaults here,
   * as each property's `defaultValue` — those seed the initial values,
   * with tool-level `values` taking precedence (the editor's order).
   */
  options?: Record<string, ToolOptionGroup | undefined>;
  renderer: {
    /** Per-mode HTML exporters. `document` falls back to `web`. */
    exporters: Partial<Record<RenderMode, ToolExporter>>;
    /** Optional head contributions collected into the document `<head>` */
    head?: {
      css?: (values: any, ...args: any[]) => string | undefined;
      js?: (values: any, ...args: any[]) => string | undefined;
      tags?: (values: any, ...args: any[]) => string[] | undefined;
    };
    /** Editor-only canvas renderer — ignored by Elements */
    Viewer?: unknown;
  };
  /** React DevTools name (defaults to the tool name) */
  displayName?: string;
  /** Editor-only fields (label, icon, options, validator, ...) — ignored */
  [editorOnly: string]: unknown;
}

/** Props: the tool's values as flat props, plus a `values` escape hatch. */
export type ElementsToolProps = BaseItemComponentProps &
  Record<string, any> & { values?: Record<string, any> };

/**
 * Fold each option group's property `defaultValue`s into initial values,
 * skipping disabled properties — the same seeding the editor performs, so
 * tools that keep `values: {}` and define defaults on their widgets (the
 * common real-world shape) render with those defaults.
 */
function initialValuesFromOptions(
  options: ElementsToolConfig["options"]
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const group of Object.values(options ?? {})) {
    for (const [property, option] of Object.entries(group?.options ?? {})) {
      if (!option || option.enabled === false) continue;
      if (typeof option.defaultValue !== "undefined") {
        result[property] = option.defaultValue;
      }
    }
  }
  return result;
}

/**
 * Wrap an exporter so its output is sanitized when the Unlayer config
 * provides a `toSafeHtml` — mirroring how editor exports treat custom tool
 * HTML. The exporter meta (last argument) carries the exporterConfig.
 */
function withSanitizer(exporter: ToolExporter): ToolExporter {
  return (values: any, ...args: any[]) => {
    // Coerce before sanitizing — exporters may return non-strings, and a
    // configured sanitizer must always receive a string.
    const html = String(exporter(values, ...args) ?? "");
    const meta = args[args.length - 1];
    const toSafeHtml = meta?.exporterConfig?.toSafeHtml;
    return typeof toSafeHtml === "function" ? toSafeHtml(html) : html;
  };
}

/**
 * Exporters receive link-widget values in render shape (`{ url, target }`),
 * exactly as they do in the editor — tools written for the editor read
 * `values.<option>.url`. Options with `widget: "link"` are collected at
 * registration and normalized from the storage shape before each render.
 */
function withLinkNormalization(
  exporter: ToolExporter,
  linkKeys: string[]
): ToolExporter {
  if (linkKeys.length === 0) return exporter;
  return (values: any, ...args: any[]) => {
    const out = { ...values };
    for (const key of linkKeys) {
      const normalized = normalizeLinkValue(out[key]);
      if (normalized !== undefined) out[key] = normalized;
    }
    return exporter(out, ...args);
  };
}

/** Option keys declared with the `link` widget across all groups. */
function linkWidgetKeys(options: ElementsToolConfig["options"]): string[] {
  const keys: string[] = [];
  for (const group of Object.values(options ?? {})) {
    for (const [key, option] of Object.entries(group?.options ?? {})) {
      if (option && option.widget === "link") keys.push(key);
    }
  }
  return keys;
}

/**
 * Create a React component from a custom tool definition — a custom tool
 * is the custom component you create: the same term (and the same config)
 * as the editor's `unlayer.registerTool`, so one definition serves both.
 *
 * @example
 * ```tsx
 * const Countdown = registerTool({
 *   name: "countdown",
 *   values: { endTime: "", digitColor: "#404040" },
 *   renderer: {
 *     exporters: {
 *       web:   (values) => `<div style="color:${values.digitColor}">…</div>`,
 *       email: (values) => `<table role="presentation">…</table>`,
 *     },
 *   },
 * });
 *
 * <Email><Row><Column>
 *   <Countdown endTime="2026-08-01T00:00:00Z" digitColor="#e11d48" />
 * </Column></Row></Email>
 * ```
 */
export function registerTool(
  tool: ElementsToolConfig
): React.FC<ElementsToolProps> {
  if (!tool?.name || typeof tool.name !== "string") {
    throw new Error("[Unlayer] registerTool: `name` is required");
  }
  const exporters = tool.renderer?.exporters;
  if (!exporters || (!exporters.web && !exporters.email)) {
    throw new Error(
      `[Unlayer] registerTool("${tool.name}"): ` +
        "`renderer.exporters` needs at least a `web` or `email` exporter"
    );
  }

  const linkKeys = linkWidgetKeys(tool.options);
  const sanitized: Partial<Record<RenderMode, ToolExporter>> = {};
  for (const mode of ["web", "email", "document"] as RenderMode[]) {
    const exporter = exporters[mode];
    if (exporter) {
      sanitized[mode] = withSanitizer(withLinkNormalization(exporter, linkKeys));
    }
  }
  // Match the editor's fallback: modes without an exporter render via web,
  // and email-only tools use their email exporter everywhere.
  if (!sanitized.web && sanitized.email) sanitized.web = sanitized.email;

  return createItemComponent<Record<string, any>, Record<string, any>>({
    name: tool.name,
    displayName: tool.displayName ?? tool.name,
    // Option-group widget defaults seed the values; tool-level `values`
    // win — the editor's precedence.
    defaultValues: {
      ...initialValuesFromOptions(tool.options),
      ...(tool.values ?? {}),
    },
    // Flat props are the tool's values; `values` is the escape hatch.
    propMapper: ({ children: _children, values, ...rest }) => ({
      ...(values ?? {}),
      ...rest,
    }),
    exporters: sanitized,
    contentType: "custom",
    slug: tool.name,
    metaName: `custom_${tool.name}`,
    head: tool.renderer.head,
  });
}

/** Alias of {@link registerTool}. */
export const registerElementsTool = registerTool;
