// Generated from seed 37 by corpus/generator.mjs. Do not edit; rerun `node corpus/sync.mjs`.
import { Page, Row, Column, ColumnLayouts, Heading, Paragraph, Button, Image, Divider, Social, Menu, Video, Html, Table } from "@unlayer/react-elements";
export const T = () => (
  <Page contentWidth={"600px"}>
    <Row layout={ColumnLayouts.Single} columnsBackgroundColor={"rgba(0, 0, 0, 0.5)"}><Column borderTopStyle={"solid"}><Button containerPadding={"0px"} backgroundColor={"transparent"}>Go</Button><Paragraph fontWeight={"bolder"} letterSpacing={"0.1em"}>Words</Paragraph></Column></Row>
    <Row layout={ColumnLayouts.FourEqual} columnsBackgroundColor={"#123456"}><Column borderTopWidth={"1px"}><Table  /></Column><Column backgroundColor={"red"} borderTopStyle={"solid"}><Html  /></Column><Column ><Heading html={'<span style="line-height:2">Spaced</span>'} fontSize={14}>Title</Heading><Html html={'<table><tr><td>Raw</td></tr></table>'} /></Column><Column padding={"10px 20px"}><Menu separator={"|"} /><Divider containerPadding={"5px 10px 15px 20px"} /></Column></Row>
  </Page>
);
