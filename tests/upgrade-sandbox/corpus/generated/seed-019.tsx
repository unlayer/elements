// Generated from seed 19 by corpus/generator.mjs. Do not edit; rerun `node corpus/sync.mjs`.
import { Email, Row, Column, ColumnLayouts, Heading, Paragraph, Button, Image, Divider, Social, Menu, Video, Html, Table } from "@unlayer/react-elements";
export const T = () => (
  <Email >
    <Row layout={ColumnLayouts.OneThirdTwoThirds} columnsBackgroundColor={"red"} padding={"10px"}><Column padding={"5px 10px 15px 20px"} borderTopStyle={"solid"}><Paragraph fontFamily={"Georgia, serif"} mobile={{  }}>Words</Paragraph><Social align={"center"} icons={[{ name: "Facebook", url: "https://facebook.com/acme" }]} /></Column><Column padding={10}><Button containerPadding={"10px 20px"} width={"50%"} textAlign={"left"}>Go</Button><Table  /></Column></Row>
    <Row layout={ColumnLayouts.FourEqual} columnsBackgroundColor={"transparent"}><Column ><Social align={"center"} iconType={"circle"} /></Column><Column borderTopStyle={"solid"} borderRadius={6}><Divider  /></Column><Column padding={"10px 20px"} backgroundColor={"#123456"}><Menu separator={"|"} fontWeight={"bold"} fontSize={14} mobile={{ padding: 4 }} /></Column><Column ><Social icons={[{ name: "Facebook", url: "https://facebook.com/acme" }]} align={"right"} /></Column></Row>
  </Email>
);
