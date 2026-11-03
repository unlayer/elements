// Written from corpus/review.mjs by corpus/sync.mjs. Do not edit.
import { Email, Row, Column, Heading, Paragraph, Button, Image } from "@unlayer/react-elements";
export const T = () => (
  <Email ><Row><Column><Paragraph values={{ hideDesktop: true } as any}>Shown on desktop</Paragraph><Paragraph values={{ hideMobile: true } as any}>Shown on phones</Paragraph></Column></Row></Email>
);
