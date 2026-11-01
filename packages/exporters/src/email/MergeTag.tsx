/** A MergeTag: the sending service's syntax for the value (`{{name}}` unless the options say otherwise), as text. */
import { Fragment, h } from "../jsx";
import type { Component } from "./context";

export const MergeTag: Component = ({ node, options }) => <>{(options.mergeTag ?? ((name: string) => `{{${name}}}`))(node.props.name as string)}</>;
