// A template in the new components (@unlayer/react-elements/primitives) rendered on the server with render(): what
// verify.mjs checks comes out as an email (tables) with its words in the HTML and the plain text.
import React from "react";
import { Button, Column, Email, Heading, Row, Text, render } from "@unlayer/react-elements/primitives";

const h = React.createElement;

const welcome = (name) =>
  h(
    Email,
    null,
    h(Heading, null, `Hello ${name}`),
    h(Row, null, h(Column, null, h(Text, null, "Left")), h(Column, null, h(Text, null, "Right"))),
    h(Button, { href: "https://example.com" }, "Get started")
  );

export async function primitiveCounts() {
  const { html, text } = await render(welcome("Ada"));
  return {
    tables: (html.match(/<table/g) ?? []).length,
    text: html.includes("Hello Ada") && html.includes("Right") && text.includes("Get started"),
  };
}
