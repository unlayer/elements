// Generated from seed 20 by corpus/generator.mjs. Do not edit; rerun `node corpus/sync.mjs`.
import { Page, Row, Column, ColumnLayouts, Heading, Paragraph, Button, Image, Divider, Social, Menu, Video, Html, Table } from "@unlayer/react-elements";
export const T = () => (
  <Page textColor={"#123456"}>
    <Row layout={ColumnLayouts.Single} ><Column borderRadius={6}><Paragraph fontFamily={"Georgia, serif"} mobile={{ lineHeight: 1.5 }}>Words</Paragraph></Column></Row>
    <Row layout={ColumnLayouts.TwoEqual} ><Column borderRadius={6}><Table  /><Image  /></Column><Column ><Social  /></Column></Row>
  </Page>
);
