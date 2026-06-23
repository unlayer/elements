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
  propMapper: (props) => {
    const mapped = mapSemanticProps(props, DEFAULT_VALUES, "Button");
    // An explicit width must pin the button width (size.autoWidth:false). With
    // autoWidth:true the Builder auto-sizes the button to its content and drops
    // the set width on selection — same round-trip issue as Image. Skip when the
    // user explicitly chose autoWidth themselves.
    const p = props as {
      width?: unknown;
      autoWidth?: unknown;
      size?: { width?: unknown; autoWidth?: unknown };
    };
    const widthSet = p.width !== undefined || p.size?.width !== undefined;
    const autoWidthSet = p.autoWidth !== undefined || p.size?.autoWidth !== undefined;
    if (widthSet && !autoWidthSet && mapped.size) {
      (mapped.size as { autoWidth?: boolean }).autoWidth = false;
    }
    return mapped;
  },
  displayName: "Button",
  exporters: ButtonExporters,
});

export default Button;
