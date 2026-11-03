// Generated from seed 40 by corpus/generator.mjs. Do not edit; rerun `node corpus/sync.mjs`.
import { Page, Row, Column, ColumnLayouts, Heading, Paragraph, Button, Image, Divider, Social, Menu, Video, Html, Table } from "@unlayer/react-elements";
export const T = () => (
  <Page contentWidth={"600px"} backgroundColor={"red"}>
    <Row layout={ColumnLayouts.Single} ><Column ><Heading lineHeight={1.5} mobile={{ lineHeight: "1.5", containerPadding: "5px 10px 15px 20px" }}>Title</Heading><Social spacing={5} icons={[{ name: "X", url: "https://x.com/acme", target: "_self" }]} /></Column></Row>
    <Row layout={ColumnLayouts.FourEqual} columnsBackgroundColor={"red"}><Column borderTopColor={"#cccccc"}><Heading containerPadding={"0px"} html={'<span style="font-weight:600;color:#123456">Weighted</span> words'}>Title</Heading><Html html={'<table><tr><td>Raw</td></tr></table>'} /></Column><Column ><Divider width={"100%"} borderTopColor={"#123456"} mobile={{  }} /></Column><Column ><Heading textAlign={"center"}>Title</Heading><Video videoUrl={"https://vimeo.com/76979871"} /></Column><Column borderRadius={6}><Heading headingType={"h2"}>Title</Heading></Column></Row>
  </Page>
);
