// A template without JSX: the tests render it directly with Elements too, to compare.
import { createElement as h } from "react";
import { Email, Row, Column, Heading, Paragraph } from "@unlayer/react-elements";

export default function Plain({ title = "Plain" }) {
  return h(Email, null, h(Row, null, h(Column, null, h(Heading, null, title), h(Paragraph, null, "No JSX here."))));
}

Plain.PreviewProps = { title: "Plain template" };
