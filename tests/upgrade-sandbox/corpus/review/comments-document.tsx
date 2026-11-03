// Written from corpus/review.mjs by corpus/sync.mjs. Do not edit.
import { Document, Row, Column, Heading, Paragraph, Button, Image } from "@unlayer/react-elements";
export const T = () => (
  <Document ><Row><Column><Paragraph html="Hello <!-- note to self --> world" /><Paragraph html="a<?php echo 1 ?>b" /></Column></Row></Document>
);
