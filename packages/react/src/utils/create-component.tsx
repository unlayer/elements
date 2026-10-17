/**
 * Universal Component Factory
 *
 * Eliminates boilerplate by creating components from configuration.
 * This factory handles all the repetitive logic that was duplicated
 * across Button, Heading, Paragraph, etc.
 */

import React from "react";
import { RECORDS } from "./collect";
import type { ExporterName } from "@unlayer/types";

/** Exporter map keyed by display mode. Defined locally until added to @unlayer/types. */
type ItemExporters = Partial<Record<ExporterName, (...args: any[]) => string>>;
import type { RenderMode, UnlayerConfig } from "@unlayer-internal/shared-elements";
import type { ContentValues, DeviceProps, SizeInput } from "../types";
import type { ValuesInput } from "@unlayer-internal/shared-elements";
import { contentSlotWidth, DEFAULT_CONTAINER_PADDING, pinImageSrc, toPx } from "./image-sizing";
import { remember } from "./render-scope";
import {
  mergeValues,
  generateHtmlFromTextJson,
  normalizeValuesForExporter,
  DEFAULT_CONFIG,
  cssValueSafe,
} from "@unlayer-internal/shared-elements";


/**
 * Static property key for the hook-free render function.
 * Column calls this directly instead of the outer component
 * (which uses hooks and would break when called as a plain function).
 */
export const UNLAYER_RENDER_KEY = "__unlayerRender";

/**
 * Static property key for the item's config (name, defaultValues, propMapper).
 * Used by renderToJson to extract values without rendering to HTML.
 */
export const UNLAYER_CONFIG_KEY = "__unlayerItemConfig";

/** On this copy's roots and kept markup: Elements' own components, as its Rows, Columns and blocks are. */
export const OWN = Symbol("@unlayer/react-elements/own");

/**
 * Elements' own components (roots, Rows, Columns, blocks, kept markup), which call no hooks: the engine renders
 * Elements' markup calling them as they are (see the engine's renderStatic).
 */
export const isOwn = (type: unknown): boolean => {
  const t = type as Record<PropertyKey, unknown> | null;
  return !!t && !!(t[OWN] || t[UNLAYER_RENDER_KEY] || t[RECORDS]);
};

/**
 * Base props that all item components support
 */
export interface BaseItemComponentProps extends DeviceProps {
  children?: React.ReactNode;
  /** Class names on the element it renders (a Paragraph's or Heading's text, a Button's link, an Image's img); HTML only. */
  className?: string;
  /** Inline CSS on that element, after the renderer's own (a prop given wins over the same property); HTML only. */
  style?: React.CSSProperties;
  /** The builder's settings every block has (an anchor, a display condition, …), beside its own values. */
  values?: ValuesInput<ContentValues>;
  /** Left out of the plain text (`renderToPlainText`), as a footer or a button often is. */
  skipInText?: boolean;
  mode?: RenderMode;
  /** Padding of the content wrapper around this item — a number (→ px) or a CSS
   *  string ("10px", "16px 24px"). Applied by the containing Column. */
  containerPadding?: SizeInput;

  // Internal props (for advanced use)
  index?: number;
  /** @internal — content id allocated by the containing Column; keeps the
   *  value-level _meta.htmlID unique per instance and aligned with the
   *  wrapper id and head/json numbering. */
  _metaHtmlId?: string;
  colIndex?: number;
  cells?: any[];
  bodyValues?: any;
  rowValues?: any;
  /** @internal - this column's values, threaded by Column for width-aware exporters */
  columnValues?: any;
  /** @internal - Unlayer config threaded from UnlayerProvider */
  _config?: UnlayerConfig;
}

/**
 * Configuration for creating an item component
 */
export interface ItemComponentConfig<TValues, TSemanticProps> {
  /** Component name (e.g., 'Button', 'Heading') */
  name: string;

  /** Default values for the component */
  defaultValues: TValues;

  /** Function to map semantic props to values format */
  propMapper: (
    props: TSemanticProps & { children?: React.ReactNode }
  ) => Partial<TValues>;

  /** Display name for React DevTools */
  displayName?: string;

  /** Per-component exporters map — enables tree-shaking.
   *  Keys are display modes ('web', 'email', 'document'), values are exporter functions. */
  exporters: ItemExporters;

  /** Design-JSON content type override (defaults to the lowercased name).
   *  Custom tools use "custom". */
  contentType?: string;

  /** Custom tool name — emitted as the content's `slug` in design JSON. */
  slug?: string;

  /** Base name for `_meta.htmlID`/`htmlClassNames`, prefixed with
   *  `u_content_` where used (defaults to the lowercased `name`). Custom
   *  tools pass `custom_<slug>`, rendering as `u_content_custom_<slug>`. */
  metaName?: string;

  /** Head contributions (css/js/tags builders) carried by the component
   *  itself instead of looked up in the exporters registry. */
  head?: Record<string, any>;

  /** Skip the content-container wrapper when this component's exporter returns
   *  an empty string for an unsupported mode. */
  omitEmptyOutput?: boolean;

  /** The tag that renders it, which its `style` and `className` go on (see hatch): its first by default. */
  at?: RegExp;
}

/**
 * Props type that combines base props with semantic props
 */
export type ItemComponentProps<TSemanticProps> = BaseItemComponentProps &
  Omit<TSemanticProps, keyof DeviceProps>;

// ============================================
// Internal: rendering helpers (merged from render-component.tsx)
// ============================================

/** A tag's attribute `name` set: `edit` gives its value from the one it has, or it's added as `value`. */
const attr = (tag: string, name: string, value: string, edit: (own: string) => string) =>
  tag.includes(` ${name}="`) ? tag.replace(new RegExp(` ${name}="([^"]*)`), (_, own: string) => ` ${name}="${edit(own)}`) : tag.replace(/^<[\w:-]+/, `$& ${name}="${value}"`);

/**
 * A component's `style` and `className` on the tag that renders it (`at`, in its HTML): the escape hatch for CSS no
 * prop takes. Its declarations go after the tag's own, so they win, except where a prop of the component (`given`)
 * sets the same property: props win. Inline, as email clients need; a value that could end the attribute is left out.
 */
export function hatch(html: string, at: RegExp, style: unknown, className: unknown, given: Record<string, unknown>): string {
  const css = Object.entries(style ?? {})
    .filter(([key, value]) => value != null && value !== "" && given[key] === undefined)
    .map(([key, value]) => `${key.replace(/[A-Z]/g, "-$&").toLowerCase()}:${typeof value == "number" && !/^(lineHeight|fontWeight|opacity|zIndex|flex|order)/.test(key) ? `${value}px` : value}`)
    .filter((d) => cssValueSafe(d) && !/["\\]/.test(d))
    .join(";");
  const names = className ? safeName(className, true) : "";
  if (!css && !names) return html;
  return html.replace(at, (tag) => {
    const named = names ? attr(tag, "class", names, (own) => `${names} ${own}`) : tag;
    return css ? attr(named, "style", css, (own) => `${own.replace(/[\s;]*$/, ";")}${css}`) : named;
  });
}

interface RenderConfig<T = any> {
  type: string;
  values: T;
  mode: RenderMode;
  className?: string;
  style?: React.CSSProperties;
  args?: any[];
  /** Column/body context merged into the exporter `meta` (8th arg). */
  metaContext?: Record<string, any>;
  _config?: UnlayerConfig;
  exporter: Function;
  /** Where its `style` and `className` go, and the props that win over them (see hatch). */
  at?: RegExp;
  given?: Record<string, unknown>;
}

/**
 * Allocate the next unique HTML id for a prefix, scoped to one render.
 * Counters live on the threaded `_config` (`__ids`), which Body resets per
 * render — so renderToHtml produces unique ids (u_row_1, u_row_2, …) like the
 * editor and like renderToJson, instead of resetting per row. Falls back to
 * `${prefix}_1` when rendered standalone (no _config).
 */
export function nextHtmlId(config: any, prefix: string): string {
  if (!config) return `${prefix}_1`;
  const ids: Record<string, number> = (config.__ids ??= {});
  ids[prefix] = (ids[prefix] || 0) + 1;
  return `${prefix}_${ids[prefix]}`;
}

/**
 * An HTML id (or, with `spaces`, a list of class names) that can't end its attribute: all else stays as 0.1.22 wrote
 * it (`סיכום`, `section.2`, `sm:hidden`). The head's CSS escapes the id it selects (see device-overrides.ts).
 */
export function safeName(value: unknown, spaces = false): string {
  const text = String(value ?? "");
  // (Most are ids and class names Elements gives, which hold none of it.)
  if (/^[\w-]*$/.test(text)) return text;
  // Class names apart on lines or by tabs stay apart, as the browser reads them.
  return spaces ? text.replace(/[\t\n\f\r]/g, " ").replace(/["'<>&`\u0000-\u001f\u007f]/g, "") : text.replace(/["'<>&`\s\u0000-\u001f\u007f]/g, "");
}

/**
 * Values with their background image's URL as the editor's exporters can write it, in `url('…')` in a style attribute:
 * what could end either (quotes, brackets, spaces, `<`, `>`, `\`) percent-encoded, as a browser would, the same
 * address (the design keeps it as given). With `defaults`, the image takes them where it sets none.
 */
export function cssUrl(values: Record<string, any>, defaults?: Record<string, any>): void {
  const image = values.backgroundImage;
  if (image) values.backgroundImage = { ...defaults, ...image, url: String(image.url ?? "").replace(/[\t-\r "'()<>\\]/g, escape) };
}

/** A block's or row's `_meta` with its id and class names kept to what they can hold (see `safeName`). */
export const safeMeta = <T extends { htmlID?: unknown; htmlClassNames?: unknown }>(meta: T) => ({ ...meta, htmlID: safeName(meta.htmlID), htmlClassNames: safeName(meta.htmlClassNames, true) });

/** A text block (left-aligned by default) in a right-to-left document starts on the right, unless it's aligned. */
export function rtlAlign(values: Record<string, any>, defaults: Record<string, any>, direction: unknown): void {
  if (textDirectionOf(direction) === "rtl" && values.textAlign === undefined && defaults.textAlign === "left") values.textAlign = "right";
}

/** A direction the `dir` attribute takes (ltr, rtl, auto). Anything else is dropped: it's written into markup. */
export function textDirectionOf(value: unknown): "ltr" | "rtl" | "auto" | undefined {
  const dir = typeof value === "string" ? value.trim().toLowerCase() : "";
  return dir === "ltr" || dir === "rtl" || dir === "auto" ? dir : undefined;
}

/**
 * Render a component by calling its exporter and wrapping the HTML output. An exporter that throws fails the block
 * (the Column rendering it says which, as `onError` says).
 */
function renderComponent<T = any>(config: RenderConfig<T>): JSX.Element {
  const { values, className, style, args = [], _config, exporter, metaContext, at, given } = config;
  // exporterConfig from _config (falls back to defaults)
  const cfg = _config ?? DEFAULT_CONFIG;
  const exporterConfig = { generateHtmlFromTextJson, toSafeHtml: cfg.toSafeHtml, textDirection: textDirectionOf(cfg.textDirection), cdnBaseUrl: cfg.cdnBaseUrl };
  // Item exporters' signature: (values, index, colIndex, cells, bodyValues, rowValues, embeddedValues, meta). Args 2-7
  // are deprecated positional params; the 8th arg is a meta object with all context.
  const html = exporter(values, ...args, undefined, { exporterConfig, mergeTagState: cfg.mergeTagState, ...metaContext });
  // A string, with its `style` and `className` on the tag that renders it
  return <div dangerouslySetInnerHTML={{ __html: hatch(String(html), at ?? /<[a-z][^>]*>/, style, className, given ?? {}) }} />;
}

/**
 * Create an item component (Button, Heading, Paragraph, etc.)
 *
 * This factory eliminates the ~100 lines of boilerplate code that was
 * duplicated across every item component.
 *
 * @example
 * ```tsx
 * const Button = createItemComponent({
 *   name: "Button",
 *   defaultValues: BUTTON_DEFAULTS,
 *   propMapper: mapButtonProps,
 *   displayName: "Button"
 * });
 * ```
 */
export function createItemComponent<
  TValues extends Record<string, any> = any,
  TSemanticProps = any
>(
  config: ItemComponentConfig<TValues, TSemanticProps>
): React.FC<ItemComponentProps<TSemanticProps>> {
  // Inner render function — no hooks, safe to call as a plain function (Column does this)
  function renderFn(
    props: ItemComponentProps<TSemanticProps>
  ): React.ReactElement | null {
    // Base props, then internal props (from the Column), children, and the semantic props.
    const { mode: modeProp, className, style, index = 0, _metaHtmlId, colIndex = 0, cells = [], bodyValues = {}, rowValues = {}, columnValues = {}, _config, _record: _r, children, ...restProps } =
      props as ItemComponentProps<TSemanticProps> & { _record?: unknown };

    // Resolve mode: explicit prop > _config > default
    const mode: RenderMode = modeProp ?? _config?.mode ?? "web";

    // 1. Map semantic props to values format (handles dual API)
    const mappedValues = config.propMapper({ children, ...restProps } as TSemanticProps & { children?: React.ReactNode });

    // A text block in a right-to-left document starts on the right, unless it's aligned (see rtlAlign).
    rtlAlign(mappedValues, config.defaultValues, _config?.textDirection ?? bodyValues.textDirection);

    // 2. Merge with defaults (a built-in block's, which the head reuses: see remember)
    const finalValues = mergeValues(config.defaultValues, mappedValues);
    if (!config.contentType) remember(_r as object | undefined, finalValues);

    // 3. Ensure _meta is present. The Column-allocated id wins so every
    //    instance is unique; the index fallback covers standalone renders.
    const metaName = config.metaName ?? config.name.toLowerCase();
    const meta = {
      htmlID: _metaHtmlId ?? `u_content_${metaName}_${index + 1}`,
      htmlClassNames: `u_content_${metaName}`,
      ...((finalValues as Record<string, any>)._meta || {}),
    };
    // An id or class name given in `values` reaches an attribute and the head's CSS selectors: only what they can hold.
    const valuesWithMeta = { ...finalValues, _meta: safeMeta(meta) };

    // 4. Ensure bodyValues has a contentWidth. Default to the schema-shaped
    //    "500px" (matches BodyDefaults.contentWidth and the exporter's image
    //    fallback width), so a standalone item (no Body) sizes the same as the
    //    editor and the value is a CSS string everywhere it might be consumed.
    const safeBodyValues = { contentWidth: "500px", ...bodyValues };

    // 5. Resolve link/action fields to the exporter's render-value shape.
    //    Skipped on the renderToJson path (which uses propMapper directly)
    //    so JSON output preserves the schema's storage shape.
    const valuesForExporter = normalizeValuesForExporter(valuesWithMeta as Record<string, any>, config.name, mode);

    // 5b. The block's padding, which the design gives every block (10px unless it sets one): the exporters size an
    //     image or a video's thumbnail in the slot it leaves, as the editor does.
    const forExporter = valuesForExporter as Record<string, any>;
    forExporter.containerPadding ??= DEFAULT_CONTAINER_PADDING;
    // 5c. Convert a fixed (px) image pin to the editor's canonical percent now
    //     that the column geometry is known (Column threads columnValues/cells/
    //     bodyValues). Guarded on `src.autoWidth === false`, so only pinned
    //     images are touched; responsive images and non-image blocks pass through.
    const exportSrc = forExporter.src;
    let exporter = (config.exporters[mode] || config.exporters.web)!;
    if (exportSrc && typeof exportSrc === "object" && exportSrc.autoWidth === false) {
      const available = contentSlotWidth({ bodyValues: safeBodyValues, rowValues, rowCells: cells, columnIndex: colIndex, columnValues, containerPadding: forExporter.containerPadding });
      const px = toPx(exportSrc.maxWidth);
      // The percent the design stores (see render-to-json.ts), which the exporter sizes the image by.
      forExporter.src = pinImageSrc(exportSrc, available);
      if (px! < available) {
        // A px width narrower than the slot keeps that px as its max-width (and its width attribute, Outlook's), where
        // the exporter writes the px it works out from the percent (2 decimals): `64px`, not `63.97px`.
        const own = exporter;
        exporter = (...args: any[]) => String(own(...(args as Parameters<typeof own>))).replace(/<img [^>]*max-width: [\d.]+px[^>]*>/g, (tag) => tag.replace(/(max-width: |width=")[\d.]+/g, `$1${px}`));
      }
    }

    // 7. Render using utility (handles all boilerplate)
    // `metaContext`: the 8th arg the exporters actually read: column/body context for width-aware rendering (Image's
    // available-width calc), mirroring the editor.
    const metaContext = { columnIndex: colIndex, columnValues, rowCells: cells, rowValues, bodyValues: safeBodyValues };
    return renderComponent<TValues>({ type: config.name, values: valuesForExporter as TValues, mode, className, style, args: [index, colIndex, cells, safeBodyValues, rowValues], metaContext, _config, exporter, at: config.at, given: restProps as Record<string, unknown> });
  }

  // Outer React component — hook-free, works in both Server and Client Components. A collecting walk records it (see
  // record.tsx); rendered, it's its exporter's HTML.
  const ItemComponent: React.FC<ItemComponentProps<TSemanticProps>> = (props) => renderFn(props);

  // Set display name for React DevTools
  ItemComponent.displayName = config.displayName || config.name;

  // Expose hook-free render for Column to call directly
  (ItemComponent as any)[UNLAYER_RENDER_KEY] = renderFn;
  (ItemComponent as any)[RECORDS] = true;

  // Expose config for renderToJson to extract values without HTML rendering
  (ItemComponent as any)[UNLAYER_CONFIG_KEY] = {
    name: config.name,
    defaultValues: config.defaultValues,
    propMapper: config.propMapper,
    contentType: config.contentType,
    slug: config.slug,
    metaName: config.metaName,
    head: config.head,
    omitEmptyOutput: config.omitEmptyOutput,
  };

  return ItemComponent;
}
