import { ButtonExporters, ButtonDefaults } from "@unlayer/exporters";
import type { ButtonValues, TextStyleProps, SizeInput } from "../types";
import { createItemComponent, type ItemComponentProps } from "../utils/create-component";
import { mapSemanticProps, type SemanticProps } from "../utils/semantic-props";

/**
 * Button semantic props — agent-friendly text/style types (replacing the loose
 * `any` flat props) plus a CSS-style `width` (number/px pins; "100%" full-width).
 */
type ButtonSemanticProps = Omit<
  SemanticProps<ButtonValues>,
  keyof TextStyleProps | "width"
> &
  TextStyleProps & {
    /** Display width — a number/px pins the button; "100%" makes it full-width. */
    width?: SizeInput;
  };

/**
 * Button Component Props
 * Automatically provides autocomplete for ALL properties (flat and nested)
 */
export interface ButtonProps extends ItemComponentProps<ButtonSemanticProps> {}

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
const Button = createItemComponent<ButtonValues, ButtonSemanticProps>({
  name: "Button",
  defaultValues: DEFAULT_VALUES,
  propMapper: (props) => {
    const mapped = mapSemanticProps(
      props as SemanticProps<ButtonValues>,
      DEFAULT_VALUES,
      "Button"
    );
    // In Unlayer's model a button's display width is size.width, used only when
    // size.autoWidth is false (otherwise the width is auto / content-sized). So a
    // user-provided width sets autoWidth:false. Read the MAPPED size, which
    // already includes the flat prop, the nested prop, AND the `values` escape
    // hatch; mapSemanticProps does not inject the schema default, so a present
    // size.width means the user set it. Honor an explicit autoWidth.
    const size = (mapped as { size?: unknown }).size;
    if (size && typeof size === "object" && !Array.isArray(size)) {
      const s = size as { width?: unknown; autoWidth?: unknown };
      // width accepts a number per SizeInput, but the exporter wants a CSS
      // string — coerce a bare number / unit-less numeric string to px.
      if (typeof s.width === "number") {
        s.width = `${s.width}px`;
      } else if (typeof s.width === "string" && /^\d+(?:\.\d+)?$/.test(s.width.trim())) {
        s.width = `${s.width.trim()}px`;
      }
      if (s.width !== undefined && s.autoWidth === undefined) {
        s.autoWidth = false;
      }
    }
    return mapped;
  },
  displayName: "Button",
  exporters: ButtonExporters,
});

export default Button;
