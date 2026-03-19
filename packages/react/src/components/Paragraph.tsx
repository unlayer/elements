import { ParagraphExporters, ParagraphDefaults } from "@unlayer/exporters";
import type { ParagraphValues } from "../types";
import { createItemComponent, type ItemComponentProps } from "../utils/create-component";
import { mapSemanticProps, type SemanticProps } from "../utils/semantic-props";

/**
 * Paragraph Component Props
 * Automatically provides autocomplete for ALL properties (flat and nested)
 */
export interface ParagraphProps extends ItemComponentProps<SemanticProps<ParagraphValues>> {}

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
const Paragraph = createItemComponent<ParagraphValues, SemanticProps<ParagraphValues>>({
  name: "Paragraph",
  defaultValues: DEFAULT_VALUES,
  propMapper: (props) => mapSemanticProps(props, DEFAULT_VALUES, "Paragraph"),
  displayName: "Paragraph",
  exporters: ParagraphExporters,
});

export default Paragraph;
