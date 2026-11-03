// Generated from seed 25 by corpus/generator.mjs. Do not edit; rerun `node corpus/sync.mjs`.
import { Page, Row, Column, ColumnLayouts, Heading, Paragraph, Button, Image, Divider, Social, Menu, Video, Html, Table } from "@unlayer/react-elements";
export const T = () => (
  <Page textColor={"red"} backgroundColor={"#123456"}>
    <Row layout={ColumnLayouts.ThreeEqual} noStackMobile={true} hideOnMobile={true}><Column padding={"10px"}><Social  /></Column><Column padding={"10px"} borderTopWidth={"1px"}><Html html={'<table><tr><td>Raw</td></tr></table>'} /><Social  /></Column><Column ><Heading color={""} textAlign={"left"} headingType={"h1"}>Title</Heading><Social align={"left"} spacing={"5px"} /></Column></Row>
    <Row layout={ColumnLayouts.Single} ><Column backgroundColor={"#123456"} padding={"10px 20px"}><Video  /><Button letterSpacing={1}>Go</Button></Column></Row>
  </Page>
);
