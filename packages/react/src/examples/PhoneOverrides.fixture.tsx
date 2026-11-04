import type { Meta, StoryObj } from "@storybook/react";
import { Email, Row, Column, Heading, Paragraph, Image, Button, renderToHtmlParts } from "../index";

const art = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="900" height="540" viewBox="0 0 900 540"><rect width="900" height="540" fill="#dce8de"/><circle cx="710" cy="120" r="145" fill="#f3c880"/><path d="M0 420 Q210 140 420 330 T900 300 V540 H0Z" fill="#709681"/><path d="M0 490 Q350 290 620 430 T900 400 V540 H0Z" fill="#355b48"/></svg>')}`;

function PhoneOverrides() {
  const parts = renderToHtmlParts(
    <Email contentWidth="600px" backgroundColor="#f3f5f1" fontFamily="Arial">
      <Row columnsBackgroundColor="#ffffff">
        <Column padding="36px 40px" mobile={{ padding: "24px 20px" }}>
          <Paragraph containerPadding={0} color="#355b48" fontSize={12} letterSpacing="2px">ELEMENTS · DESIGN PREVIEW</Paragraph>
          <Heading containerPadding="16px 0" fontSize={38} lineHeight="115%" color="#20372a" mobile={{ fontSize: 30, textAlign: "center" }}>Room to read. On every screen.</Heading>
          <Image src={{ url: art, width: 900, height: 540 }} width="75%" containerPadding="8px 0 20px" mobile={{ autoWidth: true, containerPadding: "4px 0 16px" }} alt="Illustrated green landscape with a warm sun" />
          <Paragraph containerPadding="0 0 24px" color="#526358" fontSize={16} lineHeight="160%" mobile={{ fontSize: 15, lineHeight: "155%" }}>The same design keeps its desktop layout and adapts its padding, typography and image width for a phone.</Paragraph>
          <Button href="https://github.com/unlayer/elements" backgroundColor="#355b48" color="#ffffff" borderRadius={6} padding="14px 24px" containerPadding={0}>Explore Elements</Button>
          <Paragraph hideOnMobile containerPadding="24px 0 0" fontSize={12} color="#6d7c71">Desktop detail · this line hides on a phone.</Paragraph>
          <Paragraph hideOnDesktop containerPadding="20px 0 0" fontSize={12} color="#6d7c71" textAlign="center">Phone detail · more space for the story.</Paragraph>
        </Column>
      </Row>
    </Email>
  );
  return <div dangerouslySetInnerHTML={{ __html: parts.head + parts.body }} />;
}

export default { title: "Examples/Phone Overrides", component: PhoneOverrides } satisfies Meta<typeof PhoneOverrides>;
export const Default: StoryObj<typeof PhoneOverrides> = {};
