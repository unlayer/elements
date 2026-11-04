import type { Meta } from "@storybook/react-vite";
import { args, argTypes, asEmailAndPage, type Args } from "../../../compat/SideBySide";
import { Button, Column, Email, Heading, Paragraph, Section, Video } from "../../index";
import { BRAND, FONT, INK, MUTED, picture, WASH } from "./shared";

const meta: Meta<Args> = {
  title: "Components/Video",
  args,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "A YouTube or Vimeo video: its player on a page, and in an email (which can't play one) its thumbnail, linked to it. Each story is drawn as an Email and as a Page, from one template; \"Show code\" has it.",
      },
    },
  },
};
export default meta;

const story = asEmailAndPage;

/** An email's still for a video, drawn in the page (no network). A page plays the video, and takes no thumbnail. */
const thumbnail = (Root: typeof Email, color: string) => (Root === Email ? picture(color, 512, 288) : undefined);

/** A `Video` is its player on a page and its thumbnail, linked to it, in an email. */
export const YouTube = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24 }}>
      <Video src="https://www.youtube.com/watch?v=dQw4w9WgXcQ" thumbnail={thumbnail(Root, "#334E68")} title="Product tour" />
    </Section>
  </Root>
));

/** A Vimeo video's thumbnail can't be found without the network, so an email needs `thumbnail`. */
export const Vimeo = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24 }}>
      <Video src="https://vimeo.com/76979871" thumbnail={thumbnail(Root, "#486581")} title="A short film" />
    </Section>
  </Root>
));

/** `width` and `maxWidth` set its size, and `mobile` another on phones; the stack around it says where it sits. */
export const Widths = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24, gap: 16, alignItems: "center" }}>
      <Video src="https://www.youtube.com/watch?v=dQw4w9WgXcQ" thumbnail={thumbnail(Root, "#334E68")} title="320px wide, the whole width on phones" style={{ width: 320 }} mobile={{ width: "100%" }} />
      <Video src="https://www.youtube.com/watch?v=dQw4w9WgXcQ" thumbnail={thumbnail(Root, "#627D98")} title="Half the space" style={{ width: "50%" }} />
    </Section>
  </Root>
));

/** A video in the middle of a product launch: a band for the title, the video, and a button to try it. */
export const ProductLaunch = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT, backgroundColor: WASH }}>
    <Section style={{ backgroundColor: INK, color: "#FFFFFF", padding: [40, 32] }}>
      <Heading level={1} style={{ fontSize: 32, textAlign: "center" }}>Introducing Acme 2.0</Heading>
      <Paragraph style={{ fontSize: 16, textAlign: "center", color: "#CBD2D9" }}>The fastest way to build, ship and measure.</Paragraph>
    </Section>
    <Section style={{ backgroundColor: "#FFFFFF", padding: 32, gap: 16 }}>
      <Video src="https://www.youtube.com/watch?v=dQw4w9WgXcQ" thumbnail={thumbnail(Root, "#334E68")} title="See it in 90 seconds" />
      <Paragraph style={{ fontSize: 15, lineHeight: 1.6, color: MUTED }}>Ninety seconds on what changed, and what it means for your team.</Paragraph>
      <Column style={{ alignItems: "center" }}>
        <Button href="https://example.com/try" style={{ backgroundColor: BRAND, padding: [12, 24], borderRadius: 6 }}>Try it free</Button>
      </Column>
    </Section>
  </Root>
));
