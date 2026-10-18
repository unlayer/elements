// The email tests/nextjs-integration renders with the async renderers (see its src/lib/async-email.ts), on Next.js 16.
import React from "react";
import { ColumnLayouts, Column, Email, Paragraph, Row, Button, UnlayerProvider } from "@unlayer/react-elements";
import { renderToHtml, renderToJson } from "@unlayer/react-elements/async";
import { emailCounts } from "@/lib/email";

const h = React.createElement;

async function Greeting({ name }) {
  return h(Paragraph, null, `Hello ${await Promise.resolve(name)}`);
}

function Welcome({ name }) {
  return h(
    Email,
    null,
    h(Row, null, h(Column, null, h(Greeting, { name }), h(Button, { href: "https://example.com" }, "Get started"))),
    h(Row, { layout: ColumnLayouts.TwoEqual }, h(Column, null, h(Paragraph, null, "Left")), h(Column, null, h(Paragraph, null, "Right")))
  );
}

export async function asyncEmailCounts() {
  const html = await renderToHtml(h(Welcome, { name: "Ada" }));
  const design = await renderToJson(h(Welcome, { name: "Ada" }));
  const provided = h(UnlayerProvider, { config: { textDirection: "rtl" }, children: h(Welcome, { name: "Ada" }) });
  return {
    provider: /<html[^>]* dir="rtl"/.test(await renderToHtml(provided)) && (await renderToJson(provided)).body.values.textDirection === "rtl",
    tables: (html.match(/<table/g) ?? []).length,
    syncTables: emailCounts().tables,
    text: html.includes("Hello Ada") && html.includes("Right"),
    rows: design.body.rows.length,
    columns: design.body.rows.map((row) => row.columns.length),
  };
}
