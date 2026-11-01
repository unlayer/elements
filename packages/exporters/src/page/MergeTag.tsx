/** A MergeTag: the sending service's syntax for the value (`{{name}}` unless the options say otherwise), as text. */
import { Fragment, h } from "../jsx";
import type { Writer } from "./context";

export const writeMergeTag: Writer = (node, _parent, context) => {
  const write = context.options.mergeTag ?? ((name: string) => `{{${name}}}`);
  return <>{write(node.props.name as string)}</>;
};
