import React from "react";
import { attribute, escapeHtml, MONOSPACE } from "./highlight";
import { themeOf, type CodeTheme, type CodeThemeName } from "./themes";
import { textOf } from "./CodeBlock";

export interface CodeInlineOptions {
  /** `light` (the default), `dark`, one of highlight.js's (see CodeBlock's `theme`), or a theme of your own: its `inline` colors. */
  theme?: CodeThemeName | CodeTheme;
  /** Its fonts (default: the system's monospace fonts, then Consolas and Courier New). */
  fontFamily?: string;
}

/** Inline code's style: a monospace font a little smaller than the text around it, on the theme's background. */
function styleOf({ theme, fontFamily }: CodeInlineOptions): string {
  const { inline } = themeOf(theme);
  return attribute(`font-family: ${fontFamily ?? MONOSPACE}; font-size: 0.9em; color: ${inline.color}; background-color: ${inline.background}; padding: 1px 4px; border-radius: 4px`);
}

/**
 * Inline code as HTML, for an `html` prop or a Heading's `text`: a `<code>` with inline styles (Outlook shows it
 * in Courier New, without the padding and corners).
 *
 * @example
 * ```tsx
 * <Paragraph html={`Run ${codeInline("npm install")} to start.`} />
 * ```
 */
export function codeInline(code: string, options: CodeInlineOptions = {}): string {
  return `<code style="${styleOf(options)}">${escapeHtml(code)}</code>`;
}

export interface CodeInlineProps extends CodeInlineOptions {
  /** The code (or as `code`). */
  children?: React.ReactNode;
  code?: string;
}

/**
 * CodeInline - Inline code in a Paragraph's, Heading's or Button's text: `<Paragraph>Run <CodeInline>npm install</CodeInline></Paragraph>`.
 * It's the `<code>` `codeInline()` writes, in the HTML and the design.
 */
export function CodeInline(props: CodeInlineProps): React.ReactElement {
  return <span dangerouslySetInnerHTML={{ __html: codeInline(props.code ?? textOf(props.children), props) }} />;
}

CodeInline.displayName = "CodeInline";
