/**
 * A MergeTag: the sending service's syntax for the value. The default, `{{name}}`, is text; the options' syntax is
 * written as it is (`<%= name %>`, `{{ name | default: "a & b" }}`), with the name in it escaped for text and for an
 * attribute's value alike.
 */
import { Fragment, h, raw } from "../jsx";
import { escapeAttr } from "../shared/css";
import type { Component } from "./context";

export const MergeTag: Component = ({ node, options }) => {
  const name = node.props.name as string;
  return options.mergeTag ? raw(options.mergeTag(escapeAttr(name))) : <>{`{{${name}}}`}</>;
};
