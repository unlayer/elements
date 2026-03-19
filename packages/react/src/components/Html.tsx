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
