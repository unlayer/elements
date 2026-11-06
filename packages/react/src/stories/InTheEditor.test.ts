/** The frame of what the builder draws: without what it only keeps, and with the fonts it loads. */
import { createElement } from "react";
import { expect, it } from "vitest";
import { fromDesign, toDesign } from "../builder";
import { Email, render, Section, Text } from "../primitives";
import { withoutHidden } from "./InTheEditor";

const FACE = { family: "Geist", src: "https://fonts.example/geist.woff2", format: "woff2", weight: "100 900" };
const template = createElement(
  Email,
  { fonts: [FACE], style: { fontFamily: "Geist, Arial, sans-serif" } },
  createElement(Section, null, createElement(Text, { style: { fontStyle: "italic" }, mobile: { maxWidth: 200 } }, "Words"))
);

it("leaves out what the builder only keeps (a phone value in a hidden property), and keeps its fonts and what its markup draws", async () => {
  const { element } = fromDesign(withoutHidden(toDesign(template).design), { displayMode: "email" });
  const { html } = await render(element);
  expect(html).not.toContain("max-width:200px");
  expect(html).toContain("font-style:italic");
  expect(html).toContain(FACE.src);
});
