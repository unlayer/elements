// A template in the new components (@unlayer/react-elements) rendered on the server with render(), and
// taken to the builder's design with toDesign() (@unlayer/react-elements/builder): what verify.mjs checks comes out as
// an email (tables) with its words in the HTML and the plain text, and a design with its rows.
import React from "react";
import { Button, Column, Email, Heading, Row, Paragraph, render } from "@unlayer/react-elements";
import { toDesign } from "@unlayer/react-elements/builder";

const h = React.createElement;

const welcome = (name) =>
  h(
    Email,
    null,
    h(Heading, null, `Hello ${name}`),
    h(Row, null, h(Column, null, h(Paragraph, null, "Left")), h(Column, null, h(Paragraph, null, "Right"))),
    h(Button, { href: "https://example.com" }, "Get started")
  );

export async function primitiveCounts() {
  const { html, text } = await render(welcome("Ada"));
  const { design } = toDesign(welcome("Ada"));
  return {
    tables: (html.match(/<table/g) ?? []).length,
    text: html.includes("Hello Ada") && html.includes("Right") && text.includes("Get started"),
    rows: design.body.rows.length,
  };
}
