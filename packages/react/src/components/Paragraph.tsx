import { ParagraphDefaults, TextExporters } from "@unlayer/exporters";
import type { AlignAlias, ParagraphValues, TextColorAlias, TextStyleProps } from "../types";
import { textJsonToText, type ValuesInput } from "@unlayer-internal/shared-elements";
import { createItemComponent, type ItemComponentProps } from "../utils/create-component";
import { mapSemanticProps, type SemanticProps } from "../utils/semantic-props";

/**
 * Paragraph semantic props — agent-friendly text/style types (replacing the
 * loose `any` flat props) plus the `text` shorthand (converted to textJson).
 */
type ParagraphSemanticProps = Omit<
  SemanticProps<ParagraphValues>,
  keyof TextStyleProps | "values"
> &
  TextStyleProps &
  AlignAlias &
  TextColorAlias & {
    /** Plain-text content (or use `html` for inline formatting, or children). */
    text?: string;
    /** The builder's values (see `SemanticProps`), with its text as HTML in `text` or `html`. */
    values?: ValuesInput<ParagraphValues & { text: string; html: string }>;
  };

/**
 * Paragraph Component Props
 * Automatically provides autocomplete for ALL properties (flat and nested)
 */
export interface ParagraphProps extends ItemComponentProps<ParagraphSemanticProps> {}

// Defaults from the editor schema, plus React-specific additions
const DEFAULT_VALUES = {
  ...ParagraphDefaults,
  color: "#000000", // Not in schema options but used by renderer
} as unknown as ParagraphValues;

/**
 * The design holds a Paragraph as the builder's text block (see render-to-json.ts), so its HTML is that block's: the
 * text block's exporters, on the HTML its textJson holds there. The editor exports the design as it renders.
 */
const exporters = Object.fromEntries(
  Object.entries(TextExporters).map(([mode, exporter]) => [
    mode,
    (values: Record<string, any>, ...rest: unknown[]) => (exporter as (...args: unknown[]) => string)(values.textJson ? { ...values, text: textJsonToText(values.textJson) } : values, ...rest),
  ])
);

/**
 * Paragraph - Universal SSR/Client Component with Semantic Props API
 *
 * ✅ Semantic flat props (color, fontSize, textAlign, etc.)
 * ✅ Escape hatch: values prop for full control
 * ✅ Works on both server and client
 * ✅ Minimal boilerplate using component factory
 *
 * @example Semantic Props (Recommended)
 * ```tsx
 * <Paragraph color="#555" fontSize="14px" lineHeight="1.6">
 *   Your paragraph content here with <strong>rich text</strong> support
 * </Paragraph>
 * ```
 *
 * @example Full Control via Values
 * ```tsx
 * <Paragraph values={{ textJson: "...", color: "#555" }} />
 * ```
 */
const Paragraph = createItemComponent<ParagraphValues, ParagraphSemanticProps>({
  name: "Paragraph",
  defaultValues: DEFAULT_VALUES,
  propMapper: (props) =>
    mapSemanticProps(props as SemanticProps<ParagraphValues>, DEFAULT_VALUES, "Paragraph"),
  displayName: "Paragraph",
  // `style` and `className` go on its text element.
  at: /<[a-z\d]+ [^>]*v-text-align[^>]*>/,
  exporters,
});

export default Paragraph;
