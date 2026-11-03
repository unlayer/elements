// Generated from seed 6 by corpus/generator.mjs. Do not edit; rerun `node corpus/sync.mjs`.
import { Page, Row, Column, ColumnLayouts, Heading, Paragraph, Button, Image, Divider, Social, Menu, Video, Html, Table } from "@unlayer/react-elements";
export const T = () => (
  <Page >
    <Row layout={ColumnLayouts.TwoEqual} columnsBackgroundColor={"rgba(0, 0, 0, 0.5)"}><Column backgroundColor={"#123456"}><Table  /><Button fontSize={14} href={"https://example.test/a"} borderRadius={"4px"} fontWeight={"bold"} mobile={{ textAlign: "left" }}>Go</Button></Column><Column borderRadius={6}><Table  /><Button backgroundColor={"red"}>Go</Button></Column></Row>
    <Row layout={ColumnLayouts.FourEqual} ><Column borderRadius={6}><Button borderRadius={4} fontWeight={"bold"} letterSpacing={1} color={"red"} mobile={{  }}>Go</Button><Button width={"50%"} mobile={{ lineHeight: 1.5, fontSize: "14px" }}>Go</Button></Column><Column ><Menu layout={"vertical"} mobile={{  }} /></Column><Column borderTopColor={"#cccccc"}><Paragraph textAlign={"right"} fontWeight={700}>Words</Paragraph><Heading >Title</Heading></Column><Column ><Social spacing={5} iconType={"rounded"} iconSize={32} /><Paragraph >Words</Paragraph></Column></Row>
  </Page>
);
