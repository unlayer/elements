import React from "react";
import { Email, Paragraph, render } from "../dist/primitives.js";
import { toDesign } from "../dist/builder.js";

const h = React.createElement;
const tree = h(Email, { title: "Browser runtime probe" }, h(Paragraph, null, "Browser runtime probe content"));

globalThis.__HYPER_ELEMENTS_BROWSER_RUNTIME_PROBE__ = render(tree).then(({ html }) => ({
  html,
  rows: toDesign(tree).design.body.rows.length,
  processType: typeof globalThis.process,
}));
