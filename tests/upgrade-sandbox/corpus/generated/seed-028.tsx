// Generated from seed 28 by corpus/generator.mjs. Do not edit; rerun `node corpus/sync.mjs`.
import { Email, Row, Column, ColumnLayouts, Heading, Paragraph, Button, Image, Divider, Social, Menu, Video, Html, Table } from "@unlayer/react-elements";
export const T = () => (
  <Email textColor={"red"} backgroundColor={"#123456"}>
    <Row layout={ColumnLayouts.Single} backgroundColor={""}><Column borderTopWidth={"1px"} borderRadius={6}><Image containerPadding={10} altText={"A photo"} width={300} /></Column></Row>
    <Row layout={ColumnLayouts.OneThirdTwoThirds} columnsBackgroundColor={""} padding={"5px 10px 15px 20px"}><Column backgroundColor={"rgba(0, 0, 0, 0.5)"}><Video  /><Table  /></Column><Column borderRadius={6} backgroundColor={"red"}><Menu letterSpacing={"-0.5px"} layout={"horizontal"} separator={"|"} /><Button fontSize={"18px"} containerPadding={"10px"}>Go</Button></Column></Row>
  </Email>
);
