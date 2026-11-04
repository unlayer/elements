import type { Meta } from "@storybook/react-vite";
import { args, argTypes, asEmailAndPage, type Args } from "../../../compat/SideBySide";
import { Menu, Paragraph, Section, Social } from "../../index";
import { BRAND, FONT, INK, MUTED, WASH } from "./shared";

const meta: Meta<Args> = {
  title: "Components/Menu",
  args,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "A line of links, or links down a column: `items` has each link's `text` and `href`, `style` their look. Each story is drawn as an Email and as a Page, from one template; \"Show code\" has it.",
      },
    },
  },
};
export default meta;

const story = asEmailAndPage;

const ITEMS = [
  { text: "Home", href: "https://example.com" },
  { text: "About", href: "https://example.com/about" },
  { text: "Services", href: "https://example.com/services" },
  { text: "Contact", href: "https://example.com/contact" },
];

/** `Menu` for a line of links, `Social` for profiles' icons. */
export const WithSocialIcons = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24, gap: 20, alignItems: "center" }}>
      <Menu items={[{ text: "Pricing", href: "https://example.com/pricing" }, { text: "Docs", href: "https://example.com/docs" }, { text: "Blog", href: "https://example.com/blog" }]} separator="·" style={{ fontSize: 14, color: BRAND, padding: [4, 8] }} />
      <Social icons={[{ name: "x", href: "https://x.com/acme" }, { name: "instagram", href: "https://instagram.com/acme" }, { name: "youtube", href: "https://youtube.com/acme" }]} iconType="circle" size={32} style={{ gap: 12 }} />
    </Section>
  </Root>
));

/** With nothing set, and with a `separator` between the links, in a color of its own (phones show none). */
export const Separators = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24, gap: 20 }}>
      <Menu items={ITEMS} />
      <Menu items={ITEMS} separator="|" />
      <Menu items={ITEMS} separator="/" style={{ color: BRAND, separatorColor: "#9AA5B1" }} />
    </Section>
  </Root>
));

/** `layout="vertical"` puts the links down a column. */
export const Vertical = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24 }}>
      <Menu items={ITEMS} layout="vertical" style={{ fontSize: 15, color: BRAND, padding: [6, 0], justifyContent: "start" }} />
    </Section>
  </Root>
));

/** `justifyContent` puts the links on the left, in the center or on the right. */
export const Alignment = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24, gap: 16 }}>
      <Menu items={ITEMS} style={{ justifyContent: "start", padding: [4, 16, 4, 0] }} />
      <Menu items={ITEMS} style={{ justifyContent: "center" }} />
      <Menu items={ITEMS} style={{ justifyContent: "end", padding: [4, 0, 4, 16] }} />
    </Section>
  </Root>
));

/** A site's navigation: light, bold capitals on a dark band. */
export const NavigationBar = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ backgroundColor: INK, padding: [8, 16] }}>
      <Menu items={ITEMS} style={{ color: "#FFFFFF", fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", padding: [12, 16] }} />
    </Section>
    <Section style={{ padding: 24 }}>
      <Paragraph style={{ fontSize: 15, color: MUTED }}>The page starts here.</Paragraph>
    </Section>
  </Root>
));

/** An email's footer: small links, a quiet separator, the address under them. */
export const FooterLinks = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ backgroundColor: WASH, padding: 24, gap: 12 }}>
      <Menu
        items={[
          { text: "Unsubscribe", href: "https://example.com/unsubscribe" },
          { text: "Preferences", href: "https://example.com/preferences" },
          { text: "Privacy", href: "https://example.com/privacy" },
        ]}
        separator="|"
        style={{ fontSize: 12, color: MUTED, separatorColor: "#CBD2D9", padding: [2, 10] }}
      />
      <Paragraph style={{ fontSize: 12, color: MUTED, textAlign: "center" }}>Acme Inc., 1 Market St, San Francisco</Paragraph>
    </Section>
  </Root>
));
