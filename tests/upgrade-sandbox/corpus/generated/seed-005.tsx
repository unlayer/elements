// Generated from seed 5 by corpus/generator.mjs. Do not edit; rerun `node corpus/sync.mjs`.
import { Page, Row, Column, ColumnLayouts, Heading, Paragraph, Button, Image, Divider, Social, Menu, Video, Html, Table } from "@unlayer/react-elements";
export const T = () => (
  <Page contentWidth={"600px"}>
    <Row layout={ColumnLayouts.OneThirdTwoThirds} backgroundColor={"transparent"}><Column borderRadius={6}><Video videoUrl={"https://youtu.be/dQw4w9WgXcQ"} /><Button padding={"10px 20px"} href={"mailto:hi@example.test"} backgroundColor={"red"} mobile={{ textAlign: "left" }}>Go</Button></Column><Column ><Image containerPadding={"10px"} width={300} /><Video videoUrl={"https://vimeo.com/76979871"} /></Column></Row>
    <Row layout={ColumnLayouts.OneThirdTwoThirds} ><Column ><Image containerPadding={"10px"} mobile={{ autoWidth: true }} /><Image width={"300px"} src={"https://example.test/i.png"} textAlign={"center"} mobile={{ autoWidth: true, maxWidth: "100%" }} /></Column><Column borderRadius={6}><Table  /><Video videoUrl={"https://youtu.be/dQw4w9WgXcQ"} /></Column></Row>
  </Page>
);
