import React from "react";
import { Column, Email, Paragraph, Row, renderToHtml } from "../dist/index.js";

const tree = React.createElement(
  Email,
  null,
  React.createElement(
    Row,
    null,
    React.createElement(
      Column,
      null,
      React.createElement(Paragraph, null, "Browser runtime probe content"),
    ),
  ),
);

globalThis.__UNLAYER_ELEMENTS_BROWSER_RUNTIME_PROBE__ = {
  html: renderToHtml(tree, {
    mode: "email",
    title: "Browser runtime probe",
  }),
  processType: typeof globalThis.process,
};
