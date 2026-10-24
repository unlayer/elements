/**
 * @unlayer/react-elements/tailwind: Tailwind CSS classes on Elements components.
 *
 * Needs `tailwindcss` (4.x), an optional peer dependency: the main entry never loads it.
 */
export { Tailwind, type TailwindConfig, type TailwindHandle, type TailwindProps } from "./Tailwind";
export type { HtmlParts, RenderToHtmlOptions } from "@unlayer/react-elements";
export { loadTailwind, classNameToDeclarations } from "./load";
export type { ClassCondition, ClassDeclaration, ClassDeclarations } from "./declarations";
// The async renderers are the "@unlayer/react-elements/async" entry's: they compile `<Tailwind config>` too.
export { renderToHtml, renderToPlainText, renderToJson, renderToHtmlParts } from "@unlayer/react-elements/async";
