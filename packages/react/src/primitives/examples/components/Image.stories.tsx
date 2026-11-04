import type { Meta } from "@storybook/react-vite";
import { args, argTypes, asEmailAndPage, type Args } from "../../../compat/SideBySide";
import { Column, Heading, Image, Link, Paragraph, Row, Section } from "../../index";
import { FONT, INK, LINE, MUTED, picture, WASH } from "./shared";

const meta: Meta<Args> = {
  title: "Components/Image",
  args,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "An image: `src` has the file and its size, `alt` what it shows, `style` the size it's shown at and its shape. Each story is drawn as an Email and as a Page, from one template; \"Show code\" has it.",
      },
    },
  },
};
export default meta;

const story = asEmailAndPage;

/** `src` has the file's size; `style.width` sets the size shown. In a `Link`, the image is the link. */
export const Sizes = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24, gap: 16 }}>
      <Image src={picture("#99D6CF")} alt="As wide as its place" />
      <Row style={{ gap: 16 }}>
        <Column><Image src={picture("#F5C6A5", 240, 160)} alt="A share of the row" style={{ width: "100%", borderRadius: 8 }} /></Column>
        <Column>
          <Link href="https://example.com"><Image src={picture("#C5CAE9", 240, 160)} alt="A linked image" style={{ width: 200 }} /></Link>
        </Column>
      </Row>
    </Section>
  </Root>
));

/** `borderRadius` and `border` shape it: round corners, a circle for a face or a logo, an outline, the top corners only. */
export const Shapes = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24 }}>
      <Row style={{ gap: 16, alignItems: "center" }}>
        <Column><Image src={picture("#99D6CF", 240, 160)} alt="Round corners" style={{ width: "100%", borderRadius: 12 }} /></Column>
        <Column><Image src={picture("#F5C6A5", 120, 120)} alt="A circle" style={{ width: 120, borderRadius: 60, border: "3px solid #E4E7EB" }} /></Column>
        <Column><Image src={picture("#C5CAE9", 240, 160)} alt="The top corners only" style={{ width: "100%", borderRadius: [16, 16, 0, 0], border: LINE }} /></Column>
      </Row>
    </Section>
  </Root>
));

/** The stack around an image says where it sits: `alignItems` on a `Column` puts it on the left, in the center or on the right. */
export const Alignment = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24, gap: 16 }}>
      <Column style={{ alignItems: "start" }}><Image src={picture("#99D6CF", 200, 80)} alt="On the left" /></Column>
      <Column style={{ alignItems: "center" }}><Image src={picture("#F5C6A5", 200, 80)} alt="In the center" /></Column>
      <Column style={{ alignItems: "end" }}><Image src={picture("#C5CAE9", 200, 80)} alt="On the right" /></Column>
    </Section>
  </Root>
));

/** An image in a card, as for a product or an article: the `Column` has the box, and `width: "100%"` fills it. */
export const InACard = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT, backgroundColor: WASH }}>
    <Section style={{ padding: 24 }}>
      <Row style={{ gap: 16 }}>
        <Column style={{ gap: 12, padding: 16, backgroundColor: "#FFFFFF", border: LINE, borderRadius: 12 }}>
          <Image src={picture("#334E68", 400, 400)} alt="Headphones" style={{ width: "100%", borderRadius: 8 }} />
          <Heading level={3} style={{ fontSize: 16 }}>Headphones</Heading>
          <Paragraph style={{ fontSize: 14, color: MUTED }}>$199.00</Paragraph>
        </Column>
        <Column style={{ gap: 12, padding: 16, backgroundColor: "#FFFFFF", border: LINE, borderRadius: 12 }}>
          <Link href="https://example.com/article"><Image src={picture("#829AB1", 400, 400)} alt="An article's picture, linked to it" style={{ width: "100%", borderRadius: 8 }} /></Link>
          <Heading level={3} style={{ fontSize: 16 }}>How it's made</Heading>
          <Paragraph style={{ fontSize: 14, color: MUTED }}>The picture is a link.</Paragraph>
        </Column>
      </Row>
    </Section>
  </Root>
));

/** `mobile` has its size and its place on phones: choose "phone" under width to see it. */
export const OnPhones = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24, gap: 16 }}>
      <Image src={picture("#99D6CF", 600, 200)} alt="240px wide, the whole width on phones" style={{ width: 240 }} mobile={{ width: "100%" }} />
      <Column style={{ alignItems: "start" }}>
        <Image src={picture("#F5C6A5", 160, 80)} alt="On the left, in the center on phones" mobile={{ alignSelf: "center" }} />
      </Column>
      <Image src={picture("#C5CAE9", 600, 120)} alt="Only on a wider window" hidden={{ mobile: true }} style={{ width: "100%" }} />
    </Section>
  </Root>
));
