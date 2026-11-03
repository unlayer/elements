// Written from corpus/review.mjs by corpus/sync.mjs. Do not edit.
import { Page, Row, Column, Heading, Paragraph, Button, Image } from "@unlayer/react-elements";
export const T = () => (
  <Page ><Row><Column><Paragraph html="&copy; 2024 Acme &mdash; all &euro;10 &rsquo;" /><Heading values={{ text: "&copy; x" } as any} /><Button href="https://example.com" values={{ text: "&euro;5" } as any} /></Column></Row></Page>
);
