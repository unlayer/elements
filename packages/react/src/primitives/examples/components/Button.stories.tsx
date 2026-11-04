import type { Meta } from "@storybook/react-vite";
import { args, argTypes, asEmailAndPage, type Args } from "../../../compat/SideBySide";
import { Button, MergeTag, Section } from "../../index";
import { BRAND, FONT, INK } from "./shared";

const meta: Meta<Args> = {
  title: "Components/Button",
  args,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "A link drawn as a button: its box and text in `style`, its colors under the pointer in `hover`, its size on phones in `mobile`. Each story is drawn as an Email and as a Page, from one template; \"Show code\" has it.",
      },
    },
  },
};
export default meta;

const story = asEmailAndPage;

/** A button's box and text in `style`, its colors under the pointer in `hover`, its size on phones in `mobile`. */
export const Styles = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24, gap: 16, alignItems: "start" }}>
      <Button href="https://example.com" style={{ backgroundColor: BRAND, color: "#FFFFFF", padding: [12, 24], borderRadius: 6 }} hover={{ backgroundColor: "#115E59" }}>Start free trial</Button>
      <Button href="https://example.com" style={{ backgroundColor: "#FFFFFF", color: BRAND, padding: [12, 24], border: `1px solid ${BRAND}`, borderRadius: 6 }}>See pricing</Button>
      <Button href="https://example.com" style={{ width: 320, backgroundColor: INK, color: "#FFFFFF", padding: [12, 24] }} mobile={{ width: "100%" }}>320px wide, the whole width on phones</Button>
    </Section>
  </Root>
));

/** `hover` has a button's colors under the pointer, its text's and its background's. */
export const Hover = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24, gap: 16, alignItems: "start" }}>
      <Button href="https://example.com" style={{ backgroundColor: BRAND }} hover={{ backgroundColor: "#115E59" }}>A darker background</Button>
      <Button href="https://example.com" style={{ backgroundColor: "#FFFFFF", color: BRAND, border: `1px solid ${BRAND}` }} hover={{ backgroundColor: BRAND, color: "#FFFFFF" }}>Filled in under the pointer</Button>
      <Button href="https://example.com" style={{ backgroundColor: "#FEF3C7", color: "#92400E" }} hover={{ color: "#451A03" }}>A darker text</Button>
    </Section>
  </Root>
));

/** With nothing set it has small round corners and the default color; `borderRadius` and `border` shape it from there. */
export const Shapes = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24, gap: 16, alignItems: "start" }}>
      <Button href="https://example.com">With nothing set</Button>
      <Button href="https://example.com" style={{ backgroundColor: INK, borderRadius: 0 }}>Square corners</Button>
      <Button href="https://example.com" style={{ backgroundColor: BRAND, borderRadius: 24, padding: [12, 28] }}>A pill</Button>
      <Button href="https://example.com" style={{ backgroundColor: "#FFFFFF", color: INK, border: `2px solid ${INK}`, borderRadius: 8 }}>A heavy outline</Button>
      <Button href="https://example.com" style={{ backgroundColor: BRAND, fontSize: 18, fontWeight: 700, padding: [16, 36], borderRadius: 8 }}>Larger, in bold</Button>
    </Section>
  </Root>
));

/** As wide as its text by default; `width` sets a size or a share of the space, and `mobile` another on phones. */
export const Widths = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24, gap: 16, alignItems: "start" }}>
      <Button href="https://example.com" style={{ backgroundColor: BRAND }}>As wide as its text</Button>
      <Button href="https://example.com" style={{ width: 240, backgroundColor: BRAND }}>240px wide</Button>
      <Button href="https://example.com" style={{ width: "50%", backgroundColor: BRAND }}>Half the space</Button>
      <Button href="https://example.com" style={{ width: "100%", backgroundColor: BRAND }}>All the space</Button>
      <Button href="https://example.com" style={{ width: 240, backgroundColor: INK }} mobile={{ width: "100%" }}>240px wide, all of it on phones</Button>
    </Section>
  </Root>
));

/** The stack around it says where it sits, `alignSelf` where this one does; `textAlign` is where its text sits in it. */
export const Alignment = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24, gap: 16, alignItems: "center" }}>
      <Button href="https://example.com" style={{ backgroundColor: BRAND }}>In the center, as the stack says</Button>
      <Button href="https://example.com" style={{ backgroundColor: INK, alignSelf: "start" }}>On the left</Button>
      <Button href="https://example.com" style={{ backgroundColor: INK, alignSelf: "end" }}>On the right</Button>
      <Button href="https://example.com" style={{ backgroundColor: BRAND, width: 320, textAlign: "left" }}>Its text on the left</Button>
      <Button href="https://example.com" style={{ backgroundColor: BRAND, width: 320, textAlign: "right" }}>Its text on the right</Button>
    </Section>
  </Root>
));

/** `href` takes a web, mail or phone link, a target, or a merge tag; `title` and `aria-label` say what it does. */
export const Links = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24, gap: 16, alignItems: "start" }}>
      <Button href="https://example.com" title="Opens our site" style={{ backgroundColor: BRAND }}>A web page</Button>
      <Button href={{ href: "https://example.com/pricing", target: "_blank" }} aria-label="See pricing, in a new window" style={{ backgroundColor: BRAND }}>In a new window</Button>
      <Button href="mailto:hello@example.com" style={{ backgroundColor: INK }}>Write to us</Button>
      <Button href="tel:+15550100" style={{ backgroundColor: INK }}>Call us</Button>
      <Button href="https://example.com/orders" style={{ backgroundColor: BRAND }}>Track order <MergeTag name="order_id" /></Button>
    </Section>
  </Root>
));
