import { HeadingExporters, HeadingDefaults } from "@unlayer/exporters";
import type { AlignAlias, HeadingValues, TextColorAlias, TextStyleProps, HeadingLevel } from "../types";
import {
  createItemComponent,
  type ItemComponentProps
} from "../utils/create-component";
import { mapSemanticProps, type SemanticProps } from "../utils/semantic-props";

/**
 * Heading semantic props — agent-friendly text/style types (replacing the loose
 * `any` flat props) plus the `level` and `as` aliases and h1–h6 levels.
 */
type HeadingSemanticProps = Omit<
  SemanticProps<HeadingValues>,
  keyof TextStyleProps | "headingType"
> &
  TextStyleProps &
  AlignAlias &
  TextColorAlias & {
    /** Heading level h1–h6. */
    headingType?: HeadingLevel;
    /** Alias of `headingType` (which wins where both are given). */
    level?: HeadingLevel;
    /** Alias of `headingType`, as React Email's `<Heading as="h2">` names it (`headingType` and `level` win over it). */
    as?: HeadingLevel;
    /** Heading text (or use children). */
    text?: string;
  } & HeadingMargins;

/**
 * Margin shortcuts, as React Email's Heading takes them: its `containerPadding` (the space around it), each side not
 * given its default (10px). A number is px. An explicit `containerPadding` wins over them.
 */
export interface HeadingMargins {
  /** All four sides. */
  m?: number | string;
  /** Left and right. */
  mx?: number | string;
  /** Top and bottom. */
  my?: number | string;
  mt?: number | string;
  mr?: number | string;
  mb?: number | string;
  ml?: number | string;
}

/**
 * Heading Component Props
 * Automatically provides autocomplete for ALL properties (flat and nested)
 */
export interface HeadingProps extends ItemComponentProps<HeadingSemanticProps> {}

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
const Heading = createItemComponent<HeadingValues, HeadingSemanticProps>({
  name: "Heading",
  defaultValues: DEFAULT_VALUES,
  // `level` and `as` are `headingType` (see PROP_ALIASES).
  propMapper: (props) => mapSemanticProps(props as SemanticProps<HeadingValues>, DEFAULT_VALUES, "Heading"),
  displayName: "Heading",
  // `style` and `className` go on its text element.
  at: /<[a-z\d]+ [^>]*v-text-align[^>]*>/,
  exporters: HeadingExporters,
});

/**
 * The margin shortcuts (`m`, `mx`, `my`, `mt`, `mr`, `mb`, `ml`: a number in px, or CSS) as the spacing around the
 * heading, its `containerPadding` (sides not given keep 10px), which the design keeps editable. A `containerPadding`
 * given wins.
 */
export function margins({ m, mx, my, mt, mr, mb, ml, ...props }: Record<string, any>): Record<string, any> {
  if (props.containerPadding !== undefined || [m, mx, my, mt, mr, mb, ml].every((v) => v === undefined)) return props;
  const sides = [mt ?? my ?? m, mr ?? mx ?? m, mb ?? my ?? m, ml ?? mx ?? m].map((v) => (typeof v === "number" ? `${v}px` : v ?? "10px"));
  return { ...props, containerPadding: sides.join(" ") };
}

export default Heading;
