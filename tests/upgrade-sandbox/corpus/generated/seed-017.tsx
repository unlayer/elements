// Generated from seed 17 by corpus/generator.mjs. Do not edit; rerun `node corpus/sync.mjs`.
import { Page, Row, Column, ColumnLayouts, Heading, Paragraph, Button, Image, Divider, Social, Menu, Video, Html, Table } from "@unlayer/react-elements";
export const T = () => (
  <Page >
    <Row layout={ColumnLayouts.Single} padding={10}><Column ><Button color={"transparent"} borderRadius={4} mobile={{  }}>Go</Button><Menu layout={"horizontal"} fontWeight={"lighter"} fontSize={"14px"} /></Column></Row>
    <Row layout={ColumnLayouts.FourEqual} hideOnMobile={true}><Column ><Menu items={[{ text: "Home", href: "/" }, { text: "Blog", href: "/blog" }]} padding={5} align={"left"} mobile={{ fontSize: "14px", padding: 4 }} /></Column><Column padding={"0px"} borderRadius={6}><Button lineHeight={"24px"} width={"50%"} containerPadding={"10px 20px"} textAlign={"left"}>Go</Button></Column><Column padding={10} borderTopColor={"#cccccc"}><Video videoUrl={"https://vimeo.com/76979871"} /></Column><Column backgroundColor={"transparent"}><Menu  /><Heading fontWeight={"700"} fontFamily={{ label: "Arial", value: "arial,helvetica,sans-serif" }} mobile={{ containerPadding: 10 }}>Title</Heading></Column></Row>
  </Page>
);
