// Generated from seed 16 by corpus/generator.mjs. Do not edit; rerun `node corpus/sync.mjs`.
import { Page, Row, Column, ColumnLayouts, Heading, Paragraph, Button, Image, Divider, Social, Menu, Video, Html, Table } from "@unlayer/react-elements";
export const T = () => (
  <Page >
    <Row layout={ColumnLayouts.TwoEqual} noStackMobile={true} columnsBackgroundColor={"rgba(0, 0, 0, 0.5)"}><Column backgroundColor={""}><Paragraph textAlign={"left"} letterSpacing={"1px"} fontFamily={{ label: "Arial", value: "arial,helvetica,sans-serif" }} color={"rgba(0, 0, 0, 0.5)"}>Words</Paragraph><Paragraph letterSpacing={"-0.5px"} textDirection={"ltr"} fontFamily={{ label: "Arial", value: "arial,helvetica,sans-serif" }}>Words</Paragraph></Column><Column ><Html  /></Column></Row>
    <Row layout={ColumnLayouts.OneThirdTwoThirds} padding={"5px 10px 15px 20px"}><Column borderTopWidth={"1px"} borderTopColor={"#cccccc"}><Paragraph textDirection={"rtl"} mobile={{  }}>Words</Paragraph><Button padding={"10px 20px"}>Go</Button></Column><Column ><Divider width={300} mobile={{  }} /></Column></Row>
    <Row layout={ColumnLayouts.ThreeEqual} noStackMobile={true}><Column borderRadius={6}><Social iconType={"rounded"} spacing={5} iconSize={"32px"} /></Column><Column ><Video videoUrl={"https://youtu.be/dQw4w9WgXcQ"} /><Paragraph hideOnMobile={true} fontSize={14} html={'<b>Bold</b> and <i>italic</i>'} mobile={{ lineHeight: 1.5, containerPadding: "10px" }}>Words</Paragraph></Column><Column backgroundColor={"rgba(0, 0, 0, 0.5)"} borderTopStyle={"solid"}><Image action={"https://example.test/go"} altText={"A photo"} /><Button backgroundColor={"rgba(0, 0, 0, 0.5)"}>Go</Button></Column></Row>
  </Page>
);
