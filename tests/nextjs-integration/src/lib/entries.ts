// Every entry of Elements, rendered where src/lib/email.ts's email is (each route, page and component of the app,
// in each of Next.js's layers and with either bundler): a <Font> and a <Head> tag, Markdown, highlighted code and
// the design as code with the synchronous renderers, and Tailwind classes with the async ones (which load tailwindcss,
// installed with the app, as they run). A bundler that can't load an entry fails the build (webpack checks every name
// a module imports), or the route gives `false` for it.
import React from "react";
import { Column, Email, Paragraph, Row, renderToHtml, renderToJson } from "@unlayer/react-elements";
import { renderToHtml as renderToHtmlAsync } from "@unlayer/react-elements/async";
import { CodeBlock } from "@unlayer/react-elements/code";
import { designToElements } from "@unlayer/react-elements/codegen";
import { Font } from "@unlayer/react-elements/font";
import { Head } from "@unlayer/react-elements/head";
import { Markdown } from "@unlayer/react-elements/markdown";
import { Tailwind } from "@unlayer/react-elements/tailwind";

const h = React.createElement;

// The design is made without the <Head>, whose tags a design can't hold (Elements warns).
const email = (head?: React.ReactNode) =>
  h(
    Email,
    null,
    h(Font, { family: "Inter", url: "https://fonts.googleapis.com/css2?family=Inter", fallback: "Arial, sans-serif", default: true }),
    head,
    h(Row, null, h(Column, null, h(Markdown, null, "# A Markdown heading"), h(CodeBlock, { language: "ts" }, "const total = 1;")))
  );

export function entryChecks() {
  const html = renderToHtml(email(h(Head, null, h("meta", { name: "entries", content: "every entry" }))));
  return {
    font: html.includes("fonts.googleapis.com/css2?family=Inter"),
    head: html.includes('<meta name="entries" content="every entry"'),
    markdown: html.includes("A Markdown heading"),
    code: /<span style="[^"]*color[^"]*">const<\/span>/.test(html),
    codegen: designToElements(renderToJson(email())).code.includes('import { Font } from "@unlayer/react-elements/font"'),
    tailwind: typeof Tailwind === "function",
  };
}

export async function asyncEntryChecks() {
  const tailwind = h(Tailwind, null, h(Email, null, h(Row, null, h(Column, null, h(Paragraph, { className: "text-[#123456]" }, "Tailwind")))));
  return { ...entryChecks(), tailwind: (await renderToHtmlAsync(tailwind)).includes("color: #123456") };
}
