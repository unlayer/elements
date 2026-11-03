// Generated from seed 7 by corpus/generator.mjs. Do not edit; rerun `node corpus/sync.mjs`.
import { Email, Row, Column, ColumnLayouts, Heading, Paragraph, Button, Image, Divider, Social, Menu, Video, Html, Table } from "@unlayer/react-elements";
export const T = () => (
  <Email >
    <Row layout={ColumnLayouts.OneThirdTwoThirds} columnsBackgroundColor={"#123456"}><Column borderTopWidth={"1px"}><Social iconType={"circle"} spacing={"5px"} icons={[{ name: "Facebook", url: "https://facebook.com/acme" }]} /></Column><Column ><Button backgroundColor={""} width={"auto"} color={"rgba(0, 0, 0, 0.5)"}>Go</Button><Heading containerPadding={"5px 10px 15px 20px"} textTransform={"none"} headingType={"h3"} mobile={{  }}>Title</Heading></Column></Row>
    <Row layout={ColumnLayouts.Single} ><Column borderTopWidth={"1px"}><Video videoUrl={"https://youtu.be/dQw4w9WgXcQ"} /><Table  /></Column></Row>
    <Row layout={ColumnLayouts.Single} columnsBackgroundColor={""} hideOnMobile={true}><Column borderTopWidth={"1px"}><Table  /><Social spacing={"5px"} icons={[{ name: "X", url: "https://x.com/acme", target: "_self" }]} align={"right"} /></Column></Row>
  </Email>
);
