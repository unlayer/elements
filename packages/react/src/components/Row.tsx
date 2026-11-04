import React from "react";
import type { RenderMode, UnlayerConfig, RowValues } from "@unlayer-internal/shared-elements";
import { validateColumnLayout } from "@unlayer-internal/shared-elements";
import type { ColumnLayout } from "@unlayer-internal/shared-elements";
import type { SemanticProps } from "../utils/semantic-props";
import type { DeviceProps, SizeInput } from "../types";
import { collecting, RECORDS } from "../utils/collect";
import { recordContainer, whileCollecting } from "../utils/record";
import { onItsOwn } from "../compat/render";

/**
 * Row - Container for columns in a layout
 *
 * @example
 * ```tsx
 * <Row cells={[1, 1]}>
 *   <Column><Button>Click me</Button></Column>
 *   <Column><Paragraph>Hello</Paragraph></Column>
 * </Row>
 * ```
 */

export type RowProps = Omit<SemanticProps<RowValues>, "padding" | keyof DeviceProps> & DeviceProps & {
  children?: React.ReactNode;
  layout?: ColumnLayout;
  cells?: number[];
  mode?: RenderMode;
  className?: string;
  style?: React.CSSProperties;
  index?: number;
  bodyValues?: any;
  collection?: string;
  /** Padding — a CSS string ("0 48px", "20px 40px") or a number (px). */
  padding?: SizeInput;
  /** @internal - Unlayer config threaded from UnlayerProvider via Body */
  _config?: UnlayerConfig;
};

function renderRow(props: RowProps): React.ReactElement | null {
  const { layout, children } = props;
  // The Columns as rendered, or as written (a condition's place included, as 0.1.22 counted them): either fits it.
  if (layout) {
    const columns = React.Children.toArray(children).filter((c) => React.isValidElement(c) && /^Column$/.test((c.type as any)?.displayName || (c.type as any)?.name || "")).length;
    if (columns !== layout.expectedColumns) validateColumnLayout(layout, React.Children.count(children));
  }
  return onItsOwn(Row, props);
}

// While a template is collected, a Row records itself (see normalize.tsx); then it renders the collected tree.
const Row: React.FC<RowProps> = (props) =>
  collecting() ? whileCollecting(() => recordContainer("row", props), () => renderRow(props), "Row") : renderRow(props);

Row.displayName = "Row";
(Row as unknown as Record<symbol, boolean>)[RECORDS] = true;

export default Row;
