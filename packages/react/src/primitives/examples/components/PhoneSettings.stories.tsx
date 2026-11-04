import type { Meta } from "@storybook/react-vite";
import { argTypes, asEmailAndPage, type Args } from "../../../compat/SideBySide";
import { Button, Column, Heading, Image, Paragraph, Row, Section, Text } from "../../index";
import { BRAND, FONT, INK, landscape, MUTED, WASH } from "./shared";

const meta: Meta<Args> = {
  title: "Components/Phone settings",
  args: { width: "phone" },
  argTypes,
  parameters: {
    docs: {
      description: {
        component:
          "What changes on phones: `mobile={{ }}` has a box's or text's styles there, `hidden={{ }}` leaves it out on one or the other, and a `Row` stacks. These stories open in a phone's window; choose \"desktop\" under width for the same template on a wider one. Each is drawn as an Email and as a Page, from one template; \"Show code\" has it.",
      },
    },
  },
};
export default meta;

const story = asEmailAndPage;

/** `mobile` has a box's or text's styles on phones, and `hidden` leaves it out on one or the other. */
export const TextAndHidden = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24, gap: 12 }}>
      <Heading level={1} style={{ fontSize: 34 }} mobile={{ fontSize: 24, textAlign: "center" }}>Smaller and centered on phones</Heading>
      <Paragraph hidden={{ mobile: true }} style={{ color: MUTED }}>Only on a wider window.</Paragraph>
      <Paragraph hidden={{ desktop: true }} style={{ color: MUTED }}>Only on a phone.</Paragraph>
    </Section>
  </Root>
));

/** One design that keeps its layout on a wider window, and changes its padding, its type and its picture's width for a phone. */
export const WholeDesign = story((Root) => (
  <Root width={600} style={{ backgroundColor: "#F3F5F1", fontFamily: FONT }}>
    <Column style={{ backgroundColor: "#FFFFFF", padding: [36, 40] }} mobile={{ padding: [24, 20] }}>
      <Paragraph style={{ color: "#355B48", fontSize: 12, letterSpacing: 2 }}>DESIGN PREVIEW</Paragraph>
      <Heading level={1} style={{ padding: [16, 0], fontSize: 38, fontWeight: 400, lineHeight: 1.15, color: "#20372A" }} mobile={{ fontSize: 30, textAlign: "center" }}>
        Room to read. On every screen.
      </Heading>
      <Column style={{ padding: [8, 0, 20, 0], alignItems: "center" }} mobile={{ padding: [4, 0, 16, 0] }}>
        <Image src={landscape()} alt="Green hills under a warm sun" style={{ width: "75%" }} mobile={{ width: "100%" }} />
      </Column>
      <Paragraph style={{ padding: [0, 0, 24, 0], color: "#526358", fontSize: 16, lineHeight: 1.6 }} mobile={{ fontSize: 15, lineHeight: 1.55 }}>
        The same design keeps its layout on a wider window, and adapts its padding, its type and its picture's width for a phone.
      </Paragraph>
      <Column style={{ alignItems: "center" }}>
        <Button href="https://example.com" style={{ backgroundColor: "#355B48", borderRadius: 6, padding: [14, 24] }}>Read more</Button>
      </Column>
      <Paragraph hidden={{ mobile: true }} style={{ padding: [24, 0, 0, 0], fontSize: 12, color: "#6D7C71" }}>A wider window's detail: this line is left out on a phone.</Paragraph>
      <Paragraph hidden={{ desktop: true }} style={{ padding: [20, 0, 0, 0], fontSize: 12, color: "#6D7C71", textAlign: "center" }}>A phone's detail: this line is only on a phone.</Paragraph>
    </Column>
  </Root>
));

/** A `Row` stacks on phones, unless `stackOnMobile={false}` keeps it; each child's `mobile` has its own width and box. */
export const RowsOnPhones = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24, gap: 16 }}>
      <Row style={{ gap: 12 }} mobile={{ gap: 4 }}>
        <Column style={{ padding: 16, backgroundColor: WASH }} mobile={{ padding: 8 }}><Text style={{ fontSize: 14 }}>These two stack, closer together.</Text></Column>
        <Column style={{ padding: 16, backgroundColor: WASH }} mobile={{ padding: 8 }}><Text style={{ fontSize: 14 }}>With less padding too.</Text></Column>
      </Row>
      <Row stackOnMobile={false} style={{ gap: 12, alignItems: "center" }}>
        <Column style={{ width: 64 }}><Image src={landscape(64, 64)} alt="Hills under a sun" style={{ borderRadius: 32 }} /></Column>
        <Column><Text style={{ fontSize: 14 }}>A picture and its words stay side by side.</Text></Column>
      </Row>
    </Section>
  </Root>
));

/** A button and a picture take the whole width on phones, and `alignSelf` moves one to another place there. */
export const ButtonsAndImages = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24, gap: 16, alignItems: "start" }}>
      <Image src={landscape(480, 200)} alt="Hills under a sun" style={{ width: 240 }} mobile={{ width: "100%" }} />
      <Button href="https://example.com" style={{ width: 240, backgroundColor: BRAND, borderRadius: 6 }} mobile={{ width: "100%", fontSize: 16, padding: [14, 20] }}>The whole width, and larger</Button>
      <Button href="https://example.com" style={{ backgroundColor: INK, borderRadius: 6 }} mobile={{ alignSelf: "center" }}>On the left, in the center on phones</Button>
    </Section>
  </Root>
));
