// Generated from seed 8 by corpus/generator.mjs. Do not edit; rerun `node corpus/sync.mjs`.
import { Email, Row, Column, ColumnLayouts, Heading, Paragraph, Button, Image, Divider, Social, Menu, Video, Html, Table } from "@unlayer/react-elements";
export const T = () => (
  <Email backgroundColor={"red"}>
    <Row layout={ColumnLayouts.ThreeEqual} ><Column padding={"10px 20px"} backgroundColor={"rgba(0, 0, 0, 0.5)"}><Social icons={[{ name: "X", url: "https://x.com/acme", target: "_self" }]} /></Column><Column backgroundColor={"#123456"}><Divider containerPadding={10} borderTopColor={"red"} width={"100%"} /><Paragraph letterSpacing={"-0.5px"} hideOnMobile={true} textTransform={"none"} containerPadding={"10px"} mobile={{  }}>Words</Paragraph></Column><Column ><Social icons={[{ name: "Facebook", url: "https://facebook.com/acme" }]} spacing={"5px"} /><Button href={"mailto:hi@example.test"} lineHeight={1.5} fontSize={14} width={"200px"}>Go</Button></Column></Row>
    <Row layout={ColumnLayouts.Single} backgroundColor={""}><Column borderTopStyle={"solid"} borderTopWidth={"1px"}><Divider containerPadding={10} /></Column></Row>
  </Email>
);
