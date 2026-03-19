import { HeadingExporters, HeadingDefaults } from "@unlayer/exporters";
import type { HeadingValues } from "../types";
import {
  createItemComponent,
  type ItemComponentProps
} from "../utils/create-component";
import { mapSemanticProps, type SemanticProps } from "../utils/semantic-props";


/**
 * Heading Component Props
 * Automatically provides autocomplete for ALL properties (flat and nested)
 */
export interface HeadingProps
  extends ItemComponentProps<SemanticProps<HeadingValues>> {
  level?: "h1" | "h2" | "h3" | "h4";
}

// Defaults from the editor schema, plus React-specific additions
const DEFAULT_VALUES = {
  ...HeadingDefaults,
  color: "#000000",   // Not in schema options but used by renderer
  fontWeight: 400,    // Not in schema options but used by renderer
  text: "Heading",    // React convenience — not in schema
} as unknown as HeadingValues;

/**
 * Heading - Universal SSR/Client Component with Semantic Props API
 *
 * ✅ Semantic flat props (level, color, fontSize, etc.)
 * ✅ Escape hatch: values prop for full control
 * ✅ Works on both server and client
 * ✅ Minimal boilerplate using component factory
 *
 * @example Semantic Props (Recommended)
 * ```tsx
 * <Heading level="h1" color="#222" fontSize="32px">
 *   Welcome
 * </Heading>
 * ```
 *
 * @example Full Control via Values
 * ```tsx
 * <Heading values={{ headingType: "h1", color: "#222" }}>Welcome</Heading>
 * ```
 */
const Heading = createItemComponent<
  HeadingValues,
  SemanticProps<HeadingValues>
>({
  name: "Heading",
  defaultValues: DEFAULT_VALUES,
  propMapper: (props) => {
    const { level, ...rest } = props as SemanticProps<HeadingValues> & { level?: HeadingValues["headingType"] };
    const result = mapSemanticProps(rest as SemanticProps<HeadingValues>, DEFAULT_VALUES, "Heading");
    // Map level prop to headingType
    if (level && !result.headingType) {
      result.headingType = level;
    }
    return result;
  },
  displayName: "Heading",
  exporters: HeadingExporters,
});

export default Heading;
