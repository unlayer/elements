import { HtmlDefaults } from "../builder/tool-defaults";
import type { HtmlValues } from "../types";
import { createItemComponent, type ItemComponentProps } from "../utils/create-component";
import { mapSemanticProps, type SemanticProps } from "../utils/semantic-props";

export interface HtmlProps extends ItemComponentProps<SemanticProps<HtmlValues>> {}

// Defaults from the editor schema
const DEFAULT_VALUES = {
  ...HtmlDefaults,
} as unknown as HtmlValues;

/** The block's HTML: through the config's sanitizer where it has one (an exporter's last argument carries it). */
const safeHtml = (values: HtmlValues, args: unknown[]): unknown => {
  const toSafeHtml = (args[args.length - 1] as { exporterConfig?: { toSafeHtml?: (html: unknown) => unknown } } | undefined)?.exporterConfig?.toSafeHtml;
  return (toSafeHtml ? toSafeHtml(values.html) : values.html) ?? "";
};

const inDiv = (values: HtmlValues, ...args: unknown[]) => `<div>${safeHtml(values, args)}</div>`;

/** A page's and a printed document's <div> holds the HTML as it is; an email's has it on lines of its own. */
const EXPORTERS = {
  web: inDiv,
  document: inDiv,
  email: (values: HtmlValues, ...args: unknown[]) => `\n  <div>\n    ${safeHtml(values, args)}\n  </div>\n`,
} as Record<"web" | "document" | "email", (...args: any[]) => string>;

/**
 * Html - Universal SSR/Client Component for custom HTML with Automatic Semantic Props
 *
 * ⚠️ Renders the HTML verbatim — it is NOT sanitized by default. Only pass HTML
 * you trust, and make sure it is valid: notably, an inline SVG inside a `url(...)`
 * must be URL-encoded, because a raw `"` inside a double-quoted `style="…"`
 * closes the attribute and the rest leaks out as text. To sanitize (matching the
 * editor's HTML block, which strips scripts/event handlers), pass a `toSafeHtml`
 * function via the `UnlayerProvider` config.
 *
 * @example Flat Props
 * ```tsx
 * <Html html="<div>Custom HTML</div>" />
 * ```
 *
 * @example Full Control
 * ```tsx
 * <Html values={{ html: "<div>Custom HTML</div>" }} />
 * ```
 */
const Html = createItemComponent<HtmlValues, SemanticProps<HtmlValues>>({
  name: "Html",
  defaultValues: DEFAULT_VALUES,
  propMapper: (props) => mapSemanticProps(props, DEFAULT_VALUES, "Html"),
  displayName: "Html",
  exporters: EXPORTERS,
});

export default Html;
