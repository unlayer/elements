// Generated from seed 12 by corpus/generator.mjs. Do not edit; rerun `node corpus/sync.mjs`.
import { Email, Row, Column, ColumnLayouts, Heading, Paragraph, Button, Image, Divider, Social, Menu, Video, Html, Table } from "@unlayer/react-elements";
export const T = () => (
  <Email >
    <Row layout={ColumnLayouts.FourEqual} ><Column ><Menu fontSize={"18px"} items={[{ text: "Docs", href: "/docs", target: "_blank" }]} linkColor={"red"} /></Column><Column borderTopStyle={"solid"}><Button textAlign={"center"}>Go</Button><Button >Go</Button></Column><Column ><Button backgroundColor={"transparent"}>Go</Button></Column><Column ><Image width={"50%"} mobile={{  }} /><Social icons={[{ name: "Facebook", url: "https://facebook.com/acme" }]} spacing={5} /></Column></Row>
    <Row layout={ColumnLayouts.TwoEqual} backgroundColor={""}><Column borderRadius={6}><Image width={300} /><Heading >Title</Heading></Column><Column borderTopWidth={"1px"}><Heading containerPadding={"0px"} textDirection={"ltr"}>Title</Heading></Column></Row>
  </Email>
);
