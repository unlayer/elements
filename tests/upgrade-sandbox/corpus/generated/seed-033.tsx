// Generated from seed 33 by corpus/generator.mjs. Do not edit; rerun `node corpus/sync.mjs`.
import { Page, Row, Column, ColumnLayouts, Heading, Paragraph, Button, Image, Divider, Social, Menu, Video, Html, Table } from "@unlayer/react-elements";
export const T = () => (
  <Page textColor={"#123456"} backgroundColor={"red"}>
    <Row layout={ColumnLayouts.ThreeEqual} padding={"10px 20px"} noStackMobile={true}><Column borderRadius={6} borderTopColor={"#cccccc"}><Html html={'<table><tr><td>Raw</td></tr></table>'} /><Html html={'<table><tr><td>Raw</td></tr></table>'} /></Column><Column borderTopStyle={"solid"}><Divider textAlign={"right"} borderTopColor={"rgba(0, 0, 0, 0.5)"} /><Social  /></Column><Column padding={"10px 20px"}><Paragraph hideOnMobile={true} containerPadding={"0px"} color={"red"} fontWeight={"bold"} mobile={{ lineHeight: "1.5" }}>Words</Paragraph><Divider containerPadding={"0px"} /></Column></Row>
  </Page>
);
