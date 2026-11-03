// Generated from seed 31 by corpus/generator.mjs. Do not edit; rerun `node corpus/sync.mjs`.
import { Page, Row, Column, ColumnLayouts, Heading, Paragraph, Button, Image, Divider, Social, Menu, Video, Html, Table } from "@unlayer/react-elements";
export const T = () => (
  <Page textColor={"#123456"} backgroundColor={"#123456"}>
    <Row layout={ColumnLayouts.FourEqual} ><Column borderTopStyle={"solid"} borderTopColor={"#cccccc"}><Video  /></Column><Column borderTopColor={"#cccccc"} padding={"0px"}><Video videoUrl={"https://vimeo.com/76979871"} /><Paragraph letterSpacing={"1px"} textTransform={"none"} html={'<span style="line-height:2">Spaced</span>'}>Words</Paragraph></Column><Column padding={"10px"} borderTopWidth={"1px"}><Heading fontSize={"14px"} headingType={"h3"}>Title</Heading><Html html={'<table><tr><td>Raw</td></tr></table>'} /></Column><Column borderRadius={6} padding={"5px 10px 15px 20px"}><Html html={'<table><tr><td>Raw</td></tr></table>'} /></Column></Row>
  </Page>
);
