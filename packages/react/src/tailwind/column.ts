/**
 * Whether an element is a Column, of any copy of Elements: a render made by another copy's renderers (a package's
 * module and CommonJS builds loaded together, with this <Tailwind> of the other) has that copy's Columns, recorded by
 * the marker every copy's Rows, Columns and blocks carry (see the main entry's utils/collect.ts).
 */
import React from "react";

const RECORDS = Symbol.for("@unlayer/react-elements/records");

export const isColumn = (child: unknown): child is React.ReactElement<Record<PropertyKey, any>> => {
  const type = React.isValidElement(child) ? (child.type as unknown as { displayName?: string } & Record<symbol, unknown>) : undefined;
  return !!type?.[RECORDS] && type.displayName === "Column";
};
