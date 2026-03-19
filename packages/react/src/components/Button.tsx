import { ButtonExporters, ButtonDefaults } from "@unlayer/exporters";
import type { ButtonValues } from "../types";
import { createItemComponent, type ItemComponentProps } from "../utils/create-component";
import { mapSemanticProps, type SemanticProps } from "../utils/semantic-props";


/**
 * Button Component Props
 * Automatically provides autocomplete for ALL properties (flat and nested)
 */
export interface ButtonProps extends ItemComponentProps<SemanticProps<ButtonValues>> {}

// Defaults from the editor schema, plus React-specific additions
const DEFAULT_VALUES = {
  ...ButtonDefaults,
  text: "Button", // React convenience — not in schema
} as unknown as ButtonValues;

/**
 * Button - Universal SSR/Client Component with Automatic Semantic Props
 *
 * ✅ TypeScript provides autocomplete for ALL props (flat and nested)
 * ✅ Works for any nested structure - no configuration needed
 * ✅ Escape hatch: values prop for full control
 * ✅ Works on both server and client
 *
 * @example Flat Props (Simple - most common)
 * ```tsx
 * <Button color="white" backgroundColor="#3b82f6" fontSize="16px">
 *   Click me
 * </Button>
 * ```
 *
 * @example Advanced (per-side borders)
 * ```tsx
 * <Button
 *   backgroundColor="blue"
 *   borderTopColor="red"
 *   borderTopWidth="2px"
 *   borderBottomWidth="0px"
 * >
 *   Click me
 * </Button>
 * ```
 *
 * @example Nested Objects (full control)
 * ```tsx
 * <Button
 *   buttonColors={{ backgroundColor: "#3b82f6", hoverBackgroundColor: "#2563eb" }}
 *   border={{ borderTopWidth: "2px" }}
 * >
 *   Click me
 * </Button>
 * ```
 */
const Button = createItemComponent<ButtonValues, SemanticProps<ButtonValues>>({
  name: "Button",
  defaultValues: DEFAULT_VALUES,
  propMapper: (props) => mapSemanticProps(props, DEFAULT_VALUES, "Button"),
  displayName: "Button",
  exporters: ButtonExporters,
});

export default Button;
