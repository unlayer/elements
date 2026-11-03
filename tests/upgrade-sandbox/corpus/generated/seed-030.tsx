// Generated from seed 30 by corpus/generator.mjs. Do not edit; rerun `node corpus/sync.mjs`.
import { Page, Row, Column, ColumnLayouts, Heading, Paragraph, Button, Image, Divider, Social, Menu, Video, Html, Table } from "@unlayer/react-elements";
export const T = () => (
  <Page backgroundColor={"#123456"} contentWidth={600}>
    <Row layout={ColumnLayouts.ThreeEqual} backgroundColor={"red"}><Column borderTopWidth={"1px"}><Video videoUrl={"https://vimeo.com/76979871"} /><Button containerPadding={10}>Go</Button></Column><Column padding={"10px 20px"}><Divider  /><Menu align={"center"} layout={"horizontal"} padding={"5px 10px"} separator={"|"} mobile={{  }} /></Column><Column ><Button href={"https://example.test/a"} containerPadding={"5px 10px 15px 20px"}>Go</Button><Table  /></Column></Row>
    <Row layout={ColumnLayouts.Single} hideOnMobile={true} columnsBackgroundColor={"#123456"}><Column padding={"5px 10px 15px 20px"} borderTopWidth={"1px"}><Divider textAlign={"left"} /></Column></Row>
    <Row layout={ColumnLayouts.ThreeEqual} noStackMobile={true}><Column borderRadius={6}><Divider containerPadding={"10px"} /></Column><Column ><Heading hideOnMobile={true} color={"red"}>Title</Heading></Column><Column borderTopWidth={"1px"}><Social  /><Table  /></Column></Row>
  </Page>
);
