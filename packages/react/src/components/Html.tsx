import React from "react";
import { HtmlExporters, HtmlDefaults } from "@unlayer/exporters";
import type { HtmlValues } from "../types";
import { createItemComponent, type ItemComponentProps } from "../utils/create-component";
import { mapSemanticProps, type SemanticProps } from "../utils/semantic-props";

export interface HtmlProps extends ItemComponentProps<SemanticProps<HtmlValues>> {}

// Defaults from the editor schema — minus the editor's "<strong>Hello,
// world!</strong>" placeholder: demo copy must never ship in production
// output, so an <Html> with no content renders nothing.
const DEFAULT_VALUES = {
  ...HtmlDefaults,
  html: "",
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
  propMapper: (props) => {
    const { children, ...rest } = props;
    const mapped: Partial<HtmlValues> = mapSemanticProps(
      rest as SemanticProps<HtmlValues>,
      DEFAULT_VALUES,
      "Html"
    );
    // String children are the HTML source (the exporter reads `values.html`,
    // not `text`). An explicit `html` prop or `values.html` wins.
    if (children !== undefined && !(mapped as Record<string, any>).html) {
      const parts = React.Children.toArray(children);
      if (parts.every((p) => typeof p === "string" || typeof p === "number")) {
        (mapped as Record<string, any>).html = parts.join("");
      } else {
        console.warn(
          "[Unlayer] <Html> children must be a raw HTML string — React " +
            "elements are ignored. Pass the markup as a string child or via " +
            'the `html` prop: <Html html="<div>…</div>" />.'
        );
      }
    }
    return mapped;
  },
  displayName: "Html",
  exporters: HtmlExporters,
});

export default Html;
