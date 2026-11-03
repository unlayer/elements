// Generated from seed 1 by corpus/generator.mjs. Do not edit; rerun `node corpus/sync.mjs`.
import { Page, Row, Column, ColumnLayouts, Heading, Paragraph, Button, Image, Divider, Social, Menu, Video, Html, Table } from "@unlayer/react-elements";
export const T = () => (
  <Page >
    <Row layout={ColumnLayouts.FourEqual} columnsBackgroundColor={"rgba(0, 0, 0, 0.5)"}><Column padding={"5px 10px 15px 20px"} borderTopColor={"#cccccc"}><Divider borderTopWidth={"1px"} borderTopStyle={"solid"} /><Heading textDirection={"ltr"} mobile={{  }}>Title</Heading></Column><Column borderTopStyle={"solid"}><Button lineHeight={"24px"} backgroundColor={"transparent"} fontWeight={"lighter"}>Go</Button></Column><Column ><Paragraph color={"red"} mobile={{ textAlign: "left", lineHeight: 1.5 }}>Words</Paragraph><Menu layout={"vertical"} letterSpacing={"1px"} linkColor={"rgba(0, 0, 0, 0.5)"} align={"right"} /></Column><Column borderRadius={6} backgroundColor={"#123456"}><Button lineHeight={"140%"} padding={"10px 20px"} containerPadding={10}>Go</Button><Paragraph fontWeight={"bold"}>Words</Paragraph></Column></Row>
    <Row layout={ColumnLayouts.Single} ><Column borderRadius={6} backgroundColor={"red"}><Button >Go</Button><Social icons={[{ name: "Facebook", url: "https://facebook.com/acme" }]} /></Column></Row>
  </Page>
);
