// Generated from seed 3 by corpus/generator.mjs. Do not edit; rerun `node corpus/sync.mjs`.
import { Page, Row, Column, ColumnLayouts, Heading, Paragraph, Button, Image, Divider, Social, Menu, Video, Html, Table } from "@unlayer/react-elements";
export const T = () => (
  <Page >
    <Row layout={ColumnLayouts.Single} columnsBackgroundColor={"#123456"} hideOnMobile={true}><Column borderTopWidth={"1px"} backgroundColor={"red"}><Paragraph >Words</Paragraph><Divider textAlign={"left"} containerPadding={"10px"} /></Column></Row>
    <Row layout={ColumnLayouts.FourEqual} noStackMobile={true}><Column borderTopWidth={"1px"} backgroundColor={"red"}><Heading >Title</Heading><Html html={'<table><tr><td>Raw</td></tr></table>'} /></Column><Column ><Social iconSize={32} spacing={"5px"} /></Column><Column borderTopWidth={"1px"}><Divider textAlign={"right"} containerPadding={"0px"} borderTopWidth={"1px"} /><Html html={'<table><tr><td>Raw</td></tr></table>'} /></Column><Column borderTopStyle={"solid"}><Video  /></Column></Row>
  </Page>
);
