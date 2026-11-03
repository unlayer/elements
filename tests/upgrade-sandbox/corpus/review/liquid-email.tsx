// Written from corpus/review.mjs by corpus/sync.mjs. Do not edit.
import { Email, Row, Column, Heading, Paragraph, Button, Image } from "@unlayer/react-elements";
export const T = () => (
  <Email ><Row><Column><Paragraph html="{% if orders > 1 %}Thanks{% endif %}" /><Paragraph html='Hi {{ name | default: "there" }}' /></Column></Row></Email>
);
