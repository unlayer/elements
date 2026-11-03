// Generated from seed 9 by corpus/generator.mjs. Do not edit; rerun `node corpus/sync.mjs`.
import { Email, Row, Column, ColumnLayouts, Heading, Paragraph, Button, Image, Divider, Social, Menu, Video, Html, Table } from "@unlayer/react-elements";
export const T = () => (
  <Email contentWidth={"600px"} textColor={"red"}>
    <Row layout={ColumnLayouts.FourEqual} hideOnMobile={true} backgroundColor={"transparent"}><Column ><Menu layout={"vertical"} /><Menu fontSize={"18px"} /></Column><Column borderRadius={6}><Image  /><Button fontWeight={400} textAlign={"right"} mobile={{  }}>Go</Button></Column><Column padding={"5px 10px 15px 20px"}><Social iconSize={32} iconType={"rounded"} spacing={"5px"} /></Column><Column borderTopStyle={"solid"}><Paragraph containerPadding={"5px 10px 15px 20px"} fontFamily={{ label: "Arial", value: "arial,helvetica,sans-serif" }} html={'<span style="line-height:2">Spaced</span>'} fontSize={"18px"} mobile={{ textAlign: "right" }}>Words</Paragraph></Column></Row>
  </Email>
);
