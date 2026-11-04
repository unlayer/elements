import { DividerDefaults } from "../utils/tool-defaults";
import type { DividerValues, BorderInput } from "../types";
import { createItemComponent, type ItemComponentProps } from "../utils/create-component";
import { onItsOwn } from "../compat/render";
import { mapSemanticProps, type SemanticProps } from "../utils/semantic-props";

type DividerSemanticProps = Omit<SemanticProps<DividerValues>, "border"> & {
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
  draw: onItsOwn,
});

export default Divider;
