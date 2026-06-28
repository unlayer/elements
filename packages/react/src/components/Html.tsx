import { HtmlExporters, HtmlDefaults } from "@unlayer/exporters";
import type { HtmlValues } from "../types";
import { createItemComponent, type ItemComponentProps } from "../utils/create-component";
import { mapSemanticProps, type SemanticProps } from "../utils/semantic-props";

export interface HtmlProps extends ItemComponentProps<SemanticProps<HtmlValues>> {}

// Defaults from the editor schema
const DEFAULT_VALUES = {
  ...HtmlDefaults,
} as unknown as HtmlValues;

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
  exporters: HtmlExporters,
});

export default Html;
