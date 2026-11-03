// Generated from seed 15 by corpus/generator.mjs. Do not edit; rerun `node corpus/sync.mjs`.
import { Email, Row, Column, ColumnLayouts, Heading, Paragraph, Button, Image, Divider, Social, Menu, Video, Html, Table } from "@unlayer/react-elements";
export const T = () => (
  <Email backgroundColor={"#123456"}>
    <Row layout={ColumnLayouts.OneThirdTwoThirds} noStackMobile={true}><Column padding={10} borderTopWidth={"1px"}><Heading letterSpacing={"1px"} fontWeight={"300"} html={'<span style="line-height:2">Spaced</span>'}>Title</Heading></Column><Column ><Heading fontWeight={"lighter"}>Title</Heading></Column></Row>
  </Email>
);
