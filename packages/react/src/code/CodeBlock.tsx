import React from "react";
import { Html, type HtmlProps } from "@unlayer/react-elements";
import { highlightCode, type HighlightOptions } from "./highlight";

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
export function CodeBlock({ children, code, language, theme, lineNumbers, fontSize, lineHeight, fontFamily, padding, borderRadius, wrap, ...block }: CodeBlockProps): React.ReactElement {
  const html = highlightCode(code ?? textOf(children), { language, theme, lineNumbers, fontSize, lineHeight, fontFamily, padding, borderRadius, wrap });
  return <Html {...(block as Record<string, unknown>)} html={html} />;
}

CodeBlock.displayName = "CodeBlock";
