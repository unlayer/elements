/**
 * How `<Head>` and `<Font>` give the document's head what they give it: a template's collecting walk records their
 * entry (`HEAD_ENTRY`, see the main entry's record.tsx) where it finds them; rendered, they render nothing.
 */
import type React from "react";

/** The main entry's (src/utils/collect.ts): one key for every copy of Elements. */
const HEAD_ENTRY = Symbol.for("@unlayer/react-elements/head-entry");

/** `component` made a head entry: what `entry(props)` gives is recorded for the head, and it renders nothing. */
export function headEntry<P>(component: (props: P) => React.ReactElement | null, entry: (props: P) => unknown): void {
  (component as unknown as Record<symbol, unknown>)[HEAD_ENTRY] = entry;
}
