// Generated from seed 18 by corpus/generator.mjs. Do not edit; rerun `node corpus/sync.mjs`.
import { Email, Row, Column, ColumnLayouts, Heading, Paragraph, Button, Image, Divider, Social, Menu, Video, Html, Table } from "@unlayer/react-elements";
export const T = () => (
  <Email textColor={"#123456"}>
    <Row layout={ColumnLayouts.ThreeEqual} noStackMobile={true} hideOnMobile={true}><Column padding={10} borderTopStyle={"solid"}><Button letterSpacing={1} containerPadding={"5px 10px 15px 20px"}>Go</Button><Divider  /></Column><Column ><Paragraph lineHeight={"1.5"} textDirection={"ltr"} letterSpacing={"1px"}>Words</Paragraph><Button textAlign={"center"} fontSize={"18px"} lineHeight={1.5}>Go</Button></Column><Column borderTopStyle={"solid"} padding={"0px"}><Paragraph containerPadding={"10px 20px"} lineHeight={"1.5"} fontWeight={"lighter"} letterSpacing={1}>Words</Paragraph><Image containerPadding={"10px"} /></Column></Row>
    <Row layout={ColumnLayouts.ThreeEqual} noStackMobile={true} backgroundColor={""}><Column borderRadius={6}><Heading >Title</Heading></Column><Column borderRadius={6}><Video videoUrl={"https://youtu.be/dQw4w9WgXcQ"} /></Column><Column borderRadius={6}><Video  /></Column></Row>
    <Row layout={ColumnLayouts.TwoEqual} columnsBackgroundColor={""} padding={10}><Column ><Button mobile={{  }}>Go</Button></Column><Column borderTopStyle={"solid"} backgroundColor={"rgba(0, 0, 0, 0.5)"}><Video videoUrl={"https://vimeo.com/76979871"} /></Column></Row>
  </Email>
);
