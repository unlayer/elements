// Written from corpus/review.mjs by corpus/sync.mjs. Do not edit.
import { Document, Row, Column, Heading, Paragraph, Button, Image } from "@unlayer/react-elements";
export const T = () => (
  <Document ><Row><Column><Heading values={{ text: 'H <span style="font-size:60px">BIG</span>' } as any} /><Paragraph html='a <span style="font-size:28px">BIG</span> b' /></Column></Row></Document>
);
