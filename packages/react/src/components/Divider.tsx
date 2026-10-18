import { DividerExporters, DividerDefaults } from "@unlayer/exporters";
import { divider } from "../exporters/divider";
import type { AlignAlias, DividerValues, BorderInput } from "../types";
import { createItemComponent, type ItemComponentProps } from "../utils/create-component";
import { mapSemanticProps, type SemanticProps } from "../utils/semantic-props";

type DividerSemanticProps = Omit<SemanticProps<DividerValues>, "border"> & AlignAlias & {
  /** Per-side border object (width fields accept a number/px string). */
  border?: BorderInput;
};

export interface DividerProps extends ItemComponentProps<DividerSemanticProps> {}

// Defaults from the editor schema
const DEFAULT_VALUES = {
  ...DividerDefaults,
} as unknown as DividerValues;

/**
 * Divider - Universal SSR/Client Component with Automatic Semantic Props
 *
 * @example Flat Props
 * ```tsx
 * <Divider borderTopWidth="2px" borderTopColor="#ccc" width="80%" />
 * ```
 *
 * @example Full Control
 * ```tsx
 * <Divider values={{
 *   border: { borderTopWidth: "2px", borderTopColor: "#ccc" },
 *   width: "80%"
 * }} />
 * ```
 */
const Divider = createItemComponent<DividerValues, DividerSemanticProps>({
  name: "Divider",
  defaultValues: DEFAULT_VALUES,
  propMapper: (props) => mapSemanticProps(props as SemanticProps<DividerValues>, DEFAULT_VALUES, "Divider"),
  displayName: "Divider",
  // The web and document HTML without react-dom (see exporters/markup.ts).
  exporters: { ...DividerExporters, web: divider, document: divider },
});

export default Divider;
