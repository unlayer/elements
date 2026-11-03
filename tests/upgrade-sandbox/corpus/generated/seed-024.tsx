// Generated from seed 24 by corpus/generator.mjs. Do not edit; rerun `node corpus/sync.mjs`.
import { Email, Row, Column, ColumnLayouts, Heading, Paragraph, Button, Image, Divider, Social, Menu, Video, Html, Table } from "@unlayer/react-elements";
export const T = () => (
  <Email backgroundColor={"#123456"} textColor={"#123456"}>
    <Row layout={ColumnLayouts.ThreeEqual} backgroundColor={""}><Column borderTopColor={"#cccccc"} padding={10}><Menu align={"right"} /></Column><Column ><Image action={{ name: "web", values: { href: "https://example.test/go", target: "_self" } }} src={"https://example.test/i.png"} textAlign={"right"} mobile={{  }} /><Video videoUrl={"https://youtu.be/dQw4w9WgXcQ"} /></Column><Column borderTopWidth={"1px"}><Video videoUrl={"https://youtu.be/dQw4w9WgXcQ"} /><Table  /></Column></Row>
  </Email>
);
