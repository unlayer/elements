/** Email markup: layout tables, and colors as Word reads them. */
import type { Json } from "@unlayer-internal/elements-core";
import { h, type Child, type StyleValue } from "../jsx";

/** What every layout table has: no role for screen readers, no spacing, no border. */
export const TABLE = { role: "presentation", cellpadding: "0", cellspacing: "0", border: "0" };

type TableProps = { id?: string; role?: string; class?: string | Array<string | undefined>; phone?: StyleValue; width?: string | number; bgcolor?: string; style?: StyleValue; children?: Child };

/** A layout table (`role` presentation, unless it says otherwise); an author's `id` first. */
export function Table({ children, style, ...attributes }: TableProps) {
  return (
    <table id={attributes.id} {...TABLE} {...attributes} style={style}>
      {children}
    </table>
  );
}

/** A color Word reads as a `bgcolor` attribute (hex only). */
export const bgcolor = (value: Json | undefined) => (typeof value === "string" && /^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(value) ? value : undefined);
