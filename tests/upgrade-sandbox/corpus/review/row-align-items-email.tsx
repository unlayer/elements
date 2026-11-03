// Written from corpus/review.mjs by corpus/sync.mjs. Do not edit.
import { Email, Row, Column, Heading, Paragraph, Button, Image } from "@unlayer/react-elements";
export const T = () => (
  <Email><Row cells={[1, 1]} values={{ alignItems: "center" } as any}><Column backgroundColor="#eeeeee"><Paragraph>Short</Paragraph></Column><Column><Paragraph html="Long<br>Long<br>Long<br>Long" /></Column></Row></Email>
);
