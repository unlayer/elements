// Generated from seed 23 by corpus/generator.mjs. Do not edit; rerun `node corpus/sync.mjs`.
import { Email, Row, Column, ColumnLayouts, Heading, Paragraph, Button, Image, Divider, Social, Menu, Video, Html, Table } from "@unlayer/react-elements";
export const T = () => (
  <Email >
    <Row layout={ColumnLayouts.TwoEqual} columnsBackgroundColor={""}><Column ><Social align={"left"} spacing={5} icons={[{ name: "X", url: "https://x.com/acme", target: "_self" }]} /></Column><Column borderTopColor={"#cccccc"}><Menu layout={"vertical"} separator={"|"} /></Column></Row>
    <Row layout={ColumnLayouts.OneThirdTwoThirds} noStackMobile={true} padding={"5px 10px 15px 20px"}><Column borderRadius={6} borderTopColor={"#cccccc"}><Image containerPadding={"0px"} textAlign={"center"} /></Column><Column padding={"10px"} borderTopColor={"#cccccc"}><Html html={'<table><tr><td>Raw</td></tr></table>'} /><Image src={"https://example.test/i.png"} mobile={{ autoWidth: true }} /></Column></Row>
  </Email>
);
