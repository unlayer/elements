// Generated from seed 34 by corpus/generator.mjs. Do not edit; rerun `node corpus/sync.mjs`.
import { Page, Row, Column, ColumnLayouts, Heading, Paragraph, Button, Image, Divider, Social, Menu, Video, Html, Table } from "@unlayer/react-elements";
export const T = () => (
  <Page contentWidth={600}>
    <Row layout={ColumnLayouts.ThreeEqual} hideOnMobile={true} backgroundColor={""}><Column padding={"10px"} borderRadius={6}><Paragraph >Words</Paragraph></Column><Column borderTopWidth={"1px"} padding={"10px"}><Table  /></Column><Column ><Social iconSize={32} /></Column></Row>
    <Row layout={ColumnLayouts.ThreeEqual} noStackMobile={true}><Column borderTopColor={"#cccccc"}><Table  /></Column><Column borderTopWidth={"1px"} padding={"5px 10px 15px 20px"}><Video videoUrl={"https://youtu.be/dQw4w9WgXcQ"} /></Column><Column backgroundColor={""} borderTopWidth={"1px"}><Image altText={"A photo"} /></Column></Row>
    <Row layout={ColumnLayouts.TwoEqual} noStackMobile={true}><Column borderTopStyle={"solid"}><Video videoUrl={"https://youtu.be/dQw4w9WgXcQ"} /></Column><Column padding={10}><Button fontWeight={650} lineHeight={"24px"}>Go</Button><Table  /></Column></Row>
  </Page>
);
