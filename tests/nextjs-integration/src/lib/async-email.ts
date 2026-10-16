// The email src/lib/email.ts renders, its greeting loaded as it renders, through the async renderers: what verify.mjs
// checks comes out as the same email (as many tables as the synchronous renderers give, the same design), from a
// route handler and from an async Server Component. Elements' React isn't react-dom's there, and 0.3.0's async
// renderers gave a web layout and a design without rows, with only a warning.
import React from "react";
import { ColumnLayouts, Column, Email, Paragraph, Row, Button, UnlayerProvider } from "@unlayer/react-elements";
import { renderToHtml, renderToJson } from "@unlayer/react-elements/async";
import { emailCounts } from "@/lib/email";

const h = React.createElement;

async function Greeting({ name }: { name: string }) {
  return h(Paragraph, null, `Hello ${await Promise.resolve(name)}`);
}

function Welcome({ name }: { name: string }) {
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
