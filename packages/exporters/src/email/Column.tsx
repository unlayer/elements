/** A Column: its children stacked down a table, in its box. */
import { h } from "../jsx";
import type { Writer } from "./context";
import { boxed, stackRows } from "./layout";
import { Table } from "./markup";
import { mobileTextOf } from "./styles";

export const writeColumn: Writer = (node, place, context) => {
  const mobile = mobileTextOf(node, place.mobile);
  if (node.style.justify !== undefined && node.style.justify !== "start") {
    context.d.add("email/degraded", "info", "justify on a Column has no effect in email: its children start at the top", `${node.path}.style.justify`, node.id);
  }
  return boxed(node, context, place.fill, (id) => {
    const stack = stackRows(node, context, mobile);
    return (
      <Table id={id} class={stack.className} width="100%">
        {stack.rows}
      </Table>
    );
  });
};
