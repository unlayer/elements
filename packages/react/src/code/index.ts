/**
 * @unlayer/react-elements/code: syntax-highlighted code (CodeBlock) and inline code (CodeInline) for email, web
 * pages and documents. highlight.js, which finds the tokens, is built into this entry: the main one never loads it.
 */
/*! Includes highlight.js (BSD-3-Clause License, Copyright (c) 2006, Ivan Sagalaev): see THIRD_PARTY_LICENSES.md */
export { CodeBlock, type CodeBlockProps } from "./CodeBlock";
export { CodeInline, codeInline, type CodeInlineProps, type CodeInlineOptions } from "./CodeInline";
export { highlightCode, registerLanguage, listLanguages, type HighlightOptions } from "./highlight";
export { codeThemes, type CodeTheme, type CodeThemeName } from "./themes";
