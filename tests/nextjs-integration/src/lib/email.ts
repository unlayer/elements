// An email rendered on the server with renderToHtml and renderToJson: what verify.mjs checks comes out as an
// email (tables, not a web layout) with its design, from a route handler and from a Server Component.
import React from "react";
import { ColumnLayouts, Column, Email, Paragraph, Row, Button, UnlayerProvider, renderToHtml, renderToJson } from "@unlayer/react-elements";
import { entryChecks } from "@/lib/entries";

const h = React.createElement;

function Welcome({ name }: { name: string }) {
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
    entries: entryChecks(),
  };
}
