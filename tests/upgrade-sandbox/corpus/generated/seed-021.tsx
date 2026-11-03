// Generated from seed 21 by corpus/generator.mjs. Do not edit; rerun `node corpus/sync.mjs`.
import { Email, Row, Column, ColumnLayouts, Heading, Paragraph, Button, Image, Divider, Social, Menu, Video, Html, Table } from "@unlayer/react-elements";
export const T = () => (
  <Email backgroundColor={"#123456"}>
    <Row layout={ColumnLayouts.FourEqual} backgroundColor={""} hideOnMobile={true}><Column borderTopWidth={"1px"} borderTopColor={"#cccccc"}><Menu items={[{ text: "Docs", href: "/docs", target: "_blank" }]} mobile={{ padding: 4 }} /></Column><Column padding={"10px 20px"}><Heading hideOnMobile={true} textTransform={"none"} lineHeight={"1.5"}>Title</Heading></Column><Column ><Divider textAlign={"center"} /><Image containerPadding={"5px 10px 15px 20px"} action={"https://example.test/go"} maxWidth={"100%"} src={undefined} /></Column><Column padding={"10px"} borderTopStyle={"solid"}><Heading mobile={{ containerPadding: "10px" }}>Title</Heading></Column></Row>
    <Row layout={ColumnLayouts.TwoEqual} ><Column ><Video videoUrl={"https://youtu.be/dQw4w9WgXcQ"} /></Column><Column padding={"10px"} backgroundColor={"rgba(0, 0, 0, 0.5)"}><Heading headingType={"h2"} textAlign={"right"}>Title</Heading></Column></Row>
  </Email>
);
