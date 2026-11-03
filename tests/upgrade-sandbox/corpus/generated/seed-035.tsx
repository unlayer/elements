// Generated from seed 35 by corpus/generator.mjs. Do not edit; rerun `node corpus/sync.mjs`.
import { Email, Row, Column, ColumnLayouts, Heading, Paragraph, Button, Image, Divider, Social, Menu, Video, Html, Table } from "@unlayer/react-elements";
export const T = () => (
  <Email textColor={"red"}>
    <Row layout={ColumnLayouts.TwoEqual} columnsBackgroundColor={"transparent"}><Column borderTopColor={"#cccccc"}><Menu fontSize={14} layout={"vertical"} /></Column><Column backgroundColor={"red"}><Divider borderTopStyle={"dotted"} textAlign={"left"} borderTopWidth={"1px"} /><Heading >Title</Heading></Column></Row>
    <Row layout={ColumnLayouts.Single} ><Column ><Paragraph fontWeight={"normal"} fontFamily={"Georgia, serif"}>Words</Paragraph><Heading >Title</Heading></Column></Row>
  </Email>
);
