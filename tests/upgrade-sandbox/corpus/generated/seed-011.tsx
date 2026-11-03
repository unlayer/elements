// Generated from seed 11 by corpus/generator.mjs. Do not edit; rerun `node corpus/sync.mjs`.
import { Page, Row, Column, ColumnLayouts, Heading, Paragraph, Button, Image, Divider, Social, Menu, Video, Html, Table } from "@unlayer/react-elements";
export const T = () => (
  <Page textColor={"red"}>
    <Row layout={ColumnLayouts.ThreeEqual} ><Column ><Menu textColor={"rgba(0, 0, 0, 0.5)"} /><Menu mobile={{  }} /></Column><Column borderTopWidth={"1px"}><Social iconSize={"32px"} align={"right"} /></Column><Column ><Button >Go</Button><Table  /></Column></Row>
    <Row layout={ColumnLayouts.Single} backgroundColor={"rgba(0, 0, 0, 0.5)"}><Column borderTopWidth={"1px"} borderTopStyle={"solid"}><Html html={'<table><tr><td>Raw</td></tr></table>'} /></Column></Row>
    <Row layout={ColumnLayouts.OneThirdTwoThirds} ><Column ><Heading textTransform={"none"} textAlign={"center"}>Title</Heading><Heading textAlign={"justify"} letterSpacing={"-0.5px"} color={""} mobile={{  }}>Title</Heading></Column><Column borderTopStyle={"solid"}><Image textAlign={"center"} width={"50%"} action={"https://example.test/go"} /></Column></Row>
  </Page>
);
