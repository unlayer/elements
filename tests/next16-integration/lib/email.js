// The email tests/nextjs-integration renders (see its src/lib/email.ts), on Next.js 16 with Cache Components: 0.2.0
// failed the build here, as its render asked crypto.getRandomValues() for a nonce, which a prerender may not read.
import React from "react";
import { ColumnLayouts, Column, Email, Paragraph, Row, Button, UnlayerProvider, renderToHtml, renderToJson } from "@unlayer/react-elements";

const h = React.createElement;

function Welcome({ name }) {
  return h(
    Email,
    null,
    h(Row, null, h(Column, null, h(Paragraph, null, `Hello ${name}`), h(Button, { href: "https://example.com" }, "Get started"))),
    h(Row, { layout: ColumnLayouts.TwoEqual }, h(Column, null, h(Paragraph, null, "Left")), h(Column, null, h(Paragraph, null, "Right")))
  );
}

export function emailCounts() {
  const html = renderToHtml(h(Welcome, { name: "Ada" }));
  const design = renderToJson(h(Welcome, { name: "Ada" }));
  // An <UnlayerProvider> around the template configures it, in the HTML and the design (React Server Components'
  // React has no context: the render functions read its config off the element).
  const provided = h(UnlayerProvider, { config: { textDirection: "rtl" }, children: h(Welcome, { name: "Ada" }) });
  return {
    provider: /<html[^>]* dir="rtl"/.test(renderToHtml(provided)) && renderToJson(provided).body.values.textDirection === "rtl",
    tables: (html.match(/<table/g) ?? []).length,
    text: html.includes("Hello Ada") && html.includes("Right"),
    rows: design.body.rows.length,
    columns: design.body.rows.map((row) => row.columns.length),
  };
}
