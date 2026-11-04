import React from "react";
import type { RenderMode, UnlayerConfig, ColumnValues } from "@unlayer-internal/shared-elements";
import type { SemanticProps } from "../utils/semantic-props";
import type { DeviceProps, SizeInput, BorderInput } from "../types";
import { collecting, RECORDS } from "../utils/collect";
import { recordContainer, whileCollecting } from "../utils/record";
import { onItsOwn } from "../compat/render";

/**
 * Column - Single column in a Row layout
 *
 * Must be used inside <Row> component.
 *
 * @example
 * ```tsx
 * <Row cells={[1, 1]}>
 *   <Column>
 *     <Button>Click me</Button>
 *   </Column>
 *   <Column>
 *     <Paragraph>Hello</Paragraph>
 *   </Column>
 * </Row>
 * ```
 */

// The editor hides rows and content on a device, never a column: no hideOnMobile/hideOnDesktop here.
export type ColumnProps = Omit<SemanticProps<ColumnValues>, "padding" | "border" | "borderRadius" | keyof DeviceProps> & Omit<DeviceProps, "hideOnMobile" | "hideOnDesktop"> & {
  children?: React.ReactNode;
  // Internal props (provided by Row)
  index?: number;
  cells?: number[];
  bodyValues?: any;
  rowValues?: any;
  mode?: RenderMode;
  className?: string;
  style?: React.CSSProperties;
  /** Padding — a CSS string ("0 24px", "10px") or a number (px). */
  padding?: SizeInput;
  /** Corner radius — a number (→ px) or CSS string ("8px"). */
  borderRadius?: SizeInput;
  /** Per-side border object (great for hairline dividers). Width fields accept
   *  a number/px string; reuse it as a factored-out const without `as const`. */
  border?: BorderInput;
  /** @internal - Unlayer config threaded from UnlayerProvider via Body/Row */
  _config?: UnlayerConfig;
};

export const Column: React.FC<ColumnProps> = (props) => {
  if (collecting()) return whileCollecting(() => recordContainer("column", props), () => Column(props), "Column");
  return onItsOwn(Column, props);
};

Column.displayName = "Column";
(Column as unknown as Record<symbol, boolean>)[RECORDS] = true;

export default Column;
