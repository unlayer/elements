// Generated from seed 26 by corpus/generator.mjs. Do not edit; rerun `node corpus/sync.mjs`.
import { Page, Row, Column, ColumnLayouts, Heading, Paragraph, Button, Image, Divider, Social, Menu, Video, Html, Table } from "@unlayer/react-elements";
export const T = () => (
  <Page textColor={"#123456"} fontFamily={{ label: "Arial", value: "arial,helvetica,sans-serif" }}>
    <Row layout={ColumnLayouts.OneThirdTwoThirds} hideOnMobile={true}><Column borderRadius={6} backgroundColor={""}><Html  /><Menu fontWeight={400} fontSize={14} /></Column><Column padding={"5px 10px 15px 20px"}><Menu items={[{ text: "Home", href: "/", target: "_self" }]} textColor={"#123456"} /><Html html={'<table><tr><td>Raw</td></tr></table>'} /></Column></Row>
    <Row layout={ColumnLayouts.ThreeEqual} ><Column borderTopColor={"#cccccc"} borderTopStyle={"solid"}><Video videoUrl={"https://youtu.be/dQw4w9WgXcQ"} /></Column><Column backgroundColor={"#123456"}><Button href={"mailto:hi@example.test"} color={"transparent"} containerPadding={"10px"}>Go</Button><Divider borderTopColor={"rgba(0, 0, 0, 0.5)"} containerPadding={"5px 10px 15px 20px"} /></Column><Column borderTopStyle={"solid"}><Html html={'<table><tr><td>Raw</td></tr></table>'} /><Video videoUrl={"https://vimeo.com/76979871"} /></Column></Row>
    <Row layout={ColumnLayouts.OneThirdTwoThirds} backgroundColor={"red"} columnsBackgroundColor={"rgba(0, 0, 0, 0.5)"}><Column ><Social icons={[{ name: "X", url: "https://x.com/acme", target: "_self" }]} /></Column><Column borderTopStyle={"solid"}><Button width={"auto"} borderRadius={4}>Go</Button><Table  /></Column></Row>
  </Page>
);
