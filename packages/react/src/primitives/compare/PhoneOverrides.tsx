/**
 * main's "Phone Overrides" example (its template, as that story writes it), and the same design
 * written with the new components: phone padding, type and image width, and lines shown on one
 * screen only. A block's padding in main (containerPadding) is the block's own padding here, or a
 * Column around it for an Image and a Button, which have none.
 */
import { Button as MainButton, Column as MainColumn, Email as MainEmail, Heading as MainHeading, Image as MainImage, Paragraph as MainParagraph, Row as MainRow } from "../../index";
import { Button, Column, Email, Heading, Image, Paragraph } from "../index";

const art = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="540" viewBox="0 0 900 540"><rect width="900" height="540" fill="#dce8de"/><circle cx="710" cy="120" r="145" fill="#f3c880"/><path d="M0 420 Q210 140 420 330 T900 300 V540 H0Z" fill="#709681"/><path d="M0 490 Q350 290 620 430 T900 400 V540 H0Z" fill="#355b48"/></svg>'
)}`;

export const main = (
  <MainEmail contentWidth="600px" backgroundColor="#f3f5f1" fontFamily="Arial">
    <MainRow columnsBackgroundColor="#ffffff">
      <MainColumn padding="36px 40px" mobile={{ padding: "24px 20px" }}>
        <MainParagraph containerPadding={0} color="#355b48" fontSize={12} letterSpacing="2px">ELEMENTS · DESIGN PREVIEW</MainParagraph>
        <MainHeading containerPadding="16px 0" fontSize={38} lineHeight="115%" color="#20372a" mobile={{ fontSize: 30, textAlign: "center" }}>Room to read. On every screen.</MainHeading>
        <MainImage src={{ url: art, width: 900, height: 540 }} width="75%" containerPadding="8px 0 20px" mobile={{ autoWidth: true, containerPadding: "4px 0 16px" }} alt="Illustrated green landscape with a warm sun" />
        <MainParagraph containerPadding="0 0 24px" color="#526358" fontSize={16} lineHeight="160%" mobile={{ fontSize: 15, lineHeight: "155%" }}>The same design keeps its desktop layout and adapts its padding, typography and image width for a phone.</MainParagraph>
        <MainButton href="https://github.com/unlayer/elements" backgroundColor="#355b48" color="#ffffff" borderRadius={6} padding="14px 24px" containerPadding={0}>Explore Elements</MainButton>
        <MainParagraph hideOnMobile containerPadding="24px 0 0" fontSize={12} color="#6d7c71">Desktop detail · this line hides on a phone.</MainParagraph>
        <MainParagraph hideOnDesktop containerPadding="20px 0 0" fontSize={12} color="#6d7c71" textAlign="center">Phone detail · more space for the story.</MainParagraph>
      </MainColumn>
    </MainRow>
  </MainEmail>
);

export const next = (
  <Email width={600} style={{ backgroundColor: "#f3f5f1", fontFamily: "Arial" }}>
    <Column style={{ backgroundColor: "#ffffff", padding: [36, 40] }} mobile={{ padding: [24, 20] }}>
      <Paragraph style={{ color: "#355b48", fontSize: 12, letterSpacing: 2, lineHeight: "140%" }}>ELEMENTS · DESIGN PREVIEW</Paragraph>
      <Heading level={1} style={{ padding: [16, 0], fontSize: 38, fontWeight: 400, lineHeight: "115%", color: "#20372a" }} mobile={{ fontSize: 30, textAlign: "center" }}>
        Room to read. On every screen.
      </Heading>
      <Column style={{ padding: [8, 0, 20, 0], alignItems: "center" }} mobile={{ padding: [4, 0, 16, 0] }}>
        <Image src={{ src: art, width: 900, height: 540 }} alt="Illustrated green landscape with a warm sun" style={{ width: "75%" }} mobile={{ width: "100%" }} />
      </Column>
      <Paragraph style={{ padding: [0, 0, 24, 0], color: "#526358", fontSize: 16, lineHeight: "160%" }} mobile={{ fontSize: 15, lineHeight: "155%" }}>
        The same design keeps its desktop layout and adapts its padding, typography and image width for a phone.
      </Paragraph>
      <Column style={{ alignItems: "center" }}>
        <Button href="https://github.com/unlayer/elements" style={{ backgroundColor: "#355b48", color: "#ffffff", borderRadius: 6, padding: "14px 24px" }}>
          Explore Elements
        </Button>
      </Column>
      <Paragraph hidden={{ mobile: true }} style={{ padding: [24, 0, 0, 0], fontSize: 12, color: "#6d7c71", lineHeight: "140%" }}>
        Desktop detail · this line hides on a phone.
      </Paragraph>
      <Paragraph hidden={{ desktop: true }} style={{ padding: [20, 0, 0, 0], fontSize: 12, color: "#6d7c71", textAlign: "center", lineHeight: "140%" }}>
        Phone detail · more space for the story.
      </Paragraph>
    </Column>
  </Email>
);
