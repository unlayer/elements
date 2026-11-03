// Written from corpus/review.mjs by corpus/sync.mjs. Do not edit.
import { Document, Row, Column, Heading, Paragraph, Button, Image } from "@unlayer/react-elements";
export const T = () => (
  <Document ><Row><Column><Paragraph html="{% if orders > 1 %}Thanks{% endif %}" /><Paragraph html='Hi {{ name | default: "there" }}' /></Column></Row></Document>
);
