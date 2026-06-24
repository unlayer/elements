import { ParagraphExporters, ParagraphDefaults } from "@unlayer/exporters";
import type { ParagraphValues, TextStyleProps } from "../types";
import { createItemComponent, type ItemComponentProps } from "../utils/create-component";
import { mapSemanticProps, type SemanticProps } from "../utils/semantic-props";

/**
 * Paragraph semantic props — agent-friendly text/style types (replacing the
 * loose `any` flat props) plus the `text` shorthand (converted to textJson).
 */
type ParagraphSemanticProps = Omit<
  SemanticProps<ParagraphValues>,
  keyof TextStyleProps
> &
  TextStyleProps & {
    /** Plain-text content (or use `html` for inline formatting, or children). */
    text?: string;
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
  exporters: ParagraphExporters,
});

export default Paragraph;
