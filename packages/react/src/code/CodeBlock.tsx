import React from "react";
import { Html, type HtmlProps } from "@unlayer/react-elements";
import { highlightCode, type HighlightOptions } from "./highlight";
import { collectedHere, NOT_COLLECTED, ROUTED } from "../engine/root-capture";

/** Text children (a string, a template literal, numbers), as written. */
export const textOf = (node: React.ReactNode): string =>
  node == null || typeof node === "boolean" ? "" : Array.isArray(node) ? node.map(textOf).join("") : React.isValidElement<{ children?: React.ReactNode }>(node) ? textOf(node.props.children) : String(node);

export interface CodeBlockProps extends HighlightOptions, Omit<HtmlProps, "html" | "values" | "children" | "padding" | "borderRadius" | "fontSize" | "fontFamily" | "lineHeight"> {
  /** The code (or as `code`). */
  children?: React.ReactNode;
  code?: string;
}

/**
 * CodeBlock - Syntax-highlighted code that email clients show as it looks here: inline styles only, the code's
 * spaces and lines kept (in Outlook too, in a monospace font). It's an HTML block in the design.
 *
 * @example
 * ```tsx
 * <CodeBlock language="ts" theme="dark" lineNumbers>{`const total = items.reduce((sum, item) => sum + item.price, 0);`}</CodeBlock>
 * ```
 */
export function CodeBlock(props: CodeBlockProps): React.ReactElement {
  // (Rendered by react-dom in what a lazy component renders, in a collecting render: given to the collection, which calls
  // it with the render's work, `_own`. See the main entry's engine/root-capture.ts's ROUTED.)
  const collected = collectedHere(CodeBlock, props, (props as { _own?: boolean })._own === true);
  if (collected !== NOT_COLLECTED) return collected as React.ReactElement;
  const { children, code, language, theme, lineNumbers, fontSize, lineHeight, fontFamily, padding, borderRadius, wrap, _own, ...block } = props as CodeBlockProps & { _own?: boolean };
  void _own;
  const html = highlightCode(code ?? textOf(children), { language, theme, lineNumbers, fontSize, lineHeight, fontFamily, padding, borderRadius, wrap });
  return <Html {...(block as Record<string, unknown>)} html={html} />;
}

CodeBlock.displayName = "CodeBlock";
// (It calls no hooks: see utils/create-component.tsx's NO_HOOKS. Where React renders it in what a lazy component renders, it
// asks the collection, see above.)
(CodeBlock as unknown as Record<symbol, boolean>)[Symbol.for("@unlayer/react-elements/no-hooks")] = true;
(CodeBlock as unknown as Record<symbol, boolean>)[ROUTED] = true;
