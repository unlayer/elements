// Generated from seed 38 by corpus/generator.mjs. Do not edit; rerun `node corpus/sync.mjs`.
import { Page, Row, Column, ColumnLayouts, Heading, Paragraph, Button, Image, Divider, Social, Menu, Video, Html, Table } from "@unlayer/react-elements";
export const T = () => (
  <Page contentWidth={"600px"} fontFamily={"Georgia, serif"}>
    <Row layout={ColumnLayouts.Single} columnsBackgroundColor={"red"}><Column padding={"10px 20px"} backgroundColor={"transparent"}><Divider borderTopWidth={2} textAlign={"center"} borderTopColor={"#123456"} /></Column></Row>
    <Row layout={ColumnLayouts.OneThirdTwoThirds} backgroundColor={"#123456"} noStackMobile={true}><Column borderRadius={6} borderTopStyle={"solid"}><Video videoUrl={"https://vimeo.com/76979871"} /><Heading >Title</Heading></Column><Column padding={"10px 20px"} borderTopColor={"#cccccc"}><Image textAlign={"right"} maxWidth={"400px"} containerPadding={"10px"} /></Column></Row>
  </Page>
);
