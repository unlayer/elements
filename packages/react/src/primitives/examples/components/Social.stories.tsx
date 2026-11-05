import type { Meta } from "@storybook/react-vite";
import { args, argTypes, asEmailAndPage, type Args } from "../../../stories/SideBySide";
import { Paragraph, Section, Social } from "../../index";
import { FONT, INK, MUTED } from "./shared";

const meta: Meta<Args> = {
  title: "Components/Social",
  args,
  argTypes,
  parameters: {
    docs: {
      description: {
        component:
          "Links to social profiles: `icons` has each network's `name` and the `href` of its profile, and each icon is the network's own, by that name. Each story is drawn as an Email and as a Page, from one template; \"Show code\" has it. The icons are files on Unlayer's CDN, so they need the network to show.",
      },
    },
  },
};
export default meta;

const story = asEmailAndPage;

const ICONS = [
  { name: "Facebook", href: "https://facebook.com/acme" },
  { name: "X", href: "https://x.com/acme" },
  { name: "Instagram", href: "https://instagram.com/acme" },
  { name: "LinkedIn", href: "https://linkedin.com/company/acme" },
  { name: "YouTube", href: "https://youtube.com/acme" },
];

/** `iconType` is their shape: circles by default, rounded or squared. */
export const IconTypes = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24, gap: 20 }}>
      <Social icons={ICONS} />
      <Social icons={ICONS} iconType="rounded" />
      <Social icons={ICONS} iconType="squared" />
    </Section>
  </Root>
));

/** `size` is each icon's width and height, and `gap` the space between them; `mobile` has another gap on phones. */
export const Sizes = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24, gap: 20 }}>
      <Social icons={ICONS} size={24} style={{ gap: 6 }} />
      <Social icons={ICONS} size={32} style={{ gap: 12 }} />
      <Social icons={ICONS} size={48} style={{ gap: 20 }} mobile={{ gap: 8 }} />
    </Section>
  </Root>
));

/** `justifyContent` puts them on the left, in the center or on the right. */
export const Alignment = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24, gap: 20 }}>
      <Social icons={ICONS.slice(0, 3)} style={{ justifyContent: "start" }} />
      <Social icons={ICONS.slice(0, 3)} style={{ justifyContent: "center" }} />
      <Social icons={ICONS.slice(0, 3)} style={{ justifyContent: "end" }} />
    </Section>
  </Root>
));

/** An email's footer: small icons, a mail link among them, on a dark band. */
export const Footer = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ backgroundColor: INK, padding: 24, gap: 12 }}>
      <Social
        icons={[
          { name: "Facebook", href: "https://facebook.com/acme" },
          { name: "X", href: "https://x.com/acme" },
          { name: "Instagram", href: "https://instagram.com/acme" },
          { name: "Email", href: "mailto:hello@example.com" },
        ]}
        size={28}
        style={{ gap: 8 }}
      />
      <Paragraph style={{ fontSize: 12, color: "#CBD2D9", textAlign: "center" }}>Follow along, or write to us.</Paragraph>
    </Section>
    <Section style={{ padding: 16 }}>
      <Paragraph style={{ fontSize: 12, color: MUTED, textAlign: "center" }}>Acme Inc., 1 Market St, San Francisco</Paragraph>
    </Section>
  </Root>
));
