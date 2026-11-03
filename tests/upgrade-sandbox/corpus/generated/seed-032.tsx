// Generated from seed 32 by corpus/generator.mjs. Do not edit; rerun `node corpus/sync.mjs`.
import { Email, Row, Column, ColumnLayouts, Heading, Paragraph, Button, Image, Divider, Social, Menu, Video, Html, Table } from "@unlayer/react-elements";
export const T = () => (
  <Email backgroundColor={"red"} textColor={"#123456"}>
    <Row layout={ColumnLayouts.ThreeEqual} noStackMobile={true} columnsBackgroundColor={"red"}><Column borderRadius={6} backgroundColor={"red"}><Social iconType={"circle"} /><Menu linkColor={"red"} separator={"|"} /></Column><Column ><Divider containerPadding={"0px"} borderTopWidth={"1px"} textAlign={"right"} width={300} /></Column><Column ><Button padding={12} href={"mailto:hi@example.test"}>Go</Button></Column></Row>
  </Email>
);
