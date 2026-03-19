import { DividerExporters, DividerDefaults } from "@unlayer/exporters";
import type { DividerValues } from "../types";
import { createItemComponent, type ItemComponentProps } from "../utils/create-component";
import { mapSemanticProps, type SemanticProps } from "../utils/semantic-props";

export interface DividerProps extends ItemComponentProps<SemanticProps<DividerValues>> {}

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
const Divider = createItemComponent<DividerValues, SemanticProps<DividerValues>>({
  name: "Divider",
  defaultValues: DEFAULT_VALUES,
  propMapper: (props) => mapSemanticProps(props, DEFAULT_VALUES, "Divider"),
  displayName: "Divider",
  exporters: DividerExporters,
});

export default Divider;
