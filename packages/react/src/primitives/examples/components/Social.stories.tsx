/**
 * Dog-ear (a fictional second-hand bookshop in Norwich) tells people where else to find it.
 *
 * Bookshop paper and ink, so the networks' own colors are the only ones on the page; an oxblood band
 * closes the letter. Libre Caslon Text for the voice, Hanken Grotesk for the facts, DM Mono for the
 * captions.
 */
import type { Meta } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { args, argTypes, asEmailAndPage, type Args } from "../../../stories/SideBySide";
import { Column, Heading, Link, Paragraph, Row, Section, Social, Span } from "../../index";

const PAGE = "#FAF6EE";
const INK = "#1E1B18";
const QUIET = "#6B645A";
const RULE = "#E4DCCF";
const OXBLOOD = "#6E2622";
const ON_OXBLOOD = "#E8D5CC";

const SERIF = "'Libre Caslon Text', Georgia, 'Times New Roman', serif";
const SANS = "'Hanken Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'DM Mono', SFMono-Regular, Menlo, Consolas, monospace";

const FONTS = [
  { family: "Libre Caslon Text", src: "https://fonts.gstatic.com/s/librecaslontext/v5/DdT878IGsGw1aF1JU10PUbTvNNaDMfq41-JJHRO0.woff2", format: "woff2", weight: 400 } as const,
  { family: "Libre Caslon Text", src: "https://fonts.gstatic.com/s/librecaslontext/v5/DdT678IGsGw1aF1JU10PUbTvNNaDMfq95-BDGjG2u9s.woff2", format: "woff2", weight: 400, style: "italic" } as const,
  { family: "Hanken Grotesk", src: "https://fonts.gstatic.com/s/hankengrotesk/v12/ieVn2YZDLWuGJpnzaiwFXS9tYtpd59CxCis4.woff2", format: "woff2", weight: "100 900" } as const,
  { family: "DM Mono", src: "https://fonts.gstatic.com/s/dmmono/v16/aFTU7PB1QTsUX8KYthqQBK6PYK0.woff2", format: "woff2", weight: 400 } as const,
];

const PAPER = { backgroundColor: PAGE, color: INK, fontFamily: SANS, fontSize: 16, lineHeight: 1.6 } as const;
const VOICE = { fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, lineHeight: 1.2 } as const;
const CAPTION = { fontFamily: MONO, fontSize: 12, lineHeight: 1.5, color: QUIET } as const;
const LINE = `1px solid ${RULE}`;

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
  { name: "Facebook", href: "https://facebook.com/dogearbooks" },
  { name: "X", href: "https://x.com/dogearbooks" },
  { name: "Instagram", href: "https://instagram.com/dogearbooks" },
  { name: "LinkedIn", href: "https://linkedin.com/company/dogearbooks" },
  { name: "YouTube", href: "https://youtube.com/dogearbooks" },
];

/** A line of the spec: what it shows at the left, and the icons at the right. */
const spec = (caption: string, icons: ReactNode) => (
  <Row stackOnMobile={false} style={{ alignItems: "center", padding: [14, 0], border: { top: LINE } }}>
    <Column>
      <Paragraph style={CAPTION}>{caption}</Paragraph>
    </Column>
    <Column style={{ width: 190 }}>{icons}</Column>
  </Row>
);

/** `iconType` is their shape: circles by default, rounded or squared. */
export const IconTypes = story((Root) => (
  <Root width={560} lang="en-GB" fonts={FONTS} style={PAPER}>
    <Section style={{ padding: [36, 24], gap: 20 }}>
      <Column style={{ gap: 8 }}>
        <Heading level={2} style={{ ...VOICE, fontSize: 30 }}>
          The shop, away from the shop
        </Heading>
        <Paragraph style={{ color: QUIET }}>This week’s finds on Instagram, the Tuesday reading on YouTube, and an argument about the best first line everywhere else.</Paragraph>
      </Column>
      <Column>
        {spec("circle, the default", <Social icons={ICONS} style={{ justifyContent: "end" }} />)}
        {spec('iconType="rounded"', <Social icons={ICONS} iconType="rounded" style={{ justifyContent: "end" }} />)}
        {spec('iconType="squared"', <Social icons={ICONS} iconType="squared" style={{ justifyContent: "end" }} />)}
      </Column>
    </Section>
  </Root>
));

/** `size` is each icon's width and height, and `gap` the space between them; `mobile` has another gap on phones. */
export const Sizes = story((Root) => (
  <Root width={560} lang="en-GB" fonts={FONTS} style={PAPER}>
    <Section style={{ padding: [36, 24], gap: 28, textAlign: "center" }}>
      <Column style={{ gap: 12 }}>
        <Paragraph style={{ ...VOICE, fontSize: 26 }}>Come and find us.</Paragraph>
        <Social icons={ICONS} size={48} style={{ gap: 20 }} mobile={{ gap: 8 }} />
        <Paragraph style={CAPTION}>size: 48 · gap: 20 · on phones, gap: 8</Paragraph>
      </Column>
      <Column style={{ gap: 10, padding: [24, 0, 0], border: { top: LINE } }}>
        <Paragraph style={{ ...VOICE, fontSize: 18 }}>Yours, among the shelves,</Paragraph>
        <Social icons={ICONS} size={32} style={{ gap: 12 }} />
        <Paragraph style={CAPTION}>size: 32 · gap: 12</Paragraph>
      </Column>
      <Column style={{ gap: 8, padding: [24, 0, 0], border: { top: LINE } }}>
        <Paragraph style={{ fontSize: 13, color: QUIET }}>Dog-ear Books, 12 Cooper’s Yard, Norwich</Paragraph>
        <Social icons={ICONS} size={24} style={{ gap: 6 }} />
        <Paragraph style={CAPTION}>size: 24 · gap: 6</Paragraph>
      </Column>
    </Section>
  </Root>
));

/** `justifyContent` puts them on the left, in the center or on the right. */
export const Alignment = story((Root) => (
  <Root width={560} lang="en-GB" fonts={FONTS} style={PAPER}>
    <Section style={{ padding: [32, 24, 12], gap: 10 }}>
      <Paragraph style={{ ...VOICE, fontSize: 20 }}>Yours, Ruth, at the till.</Paragraph>
      <Social icons={ICONS.slice(0, 3)} style={{ justifyContent: "start" }} />
      <Paragraph style={CAPTION}>justifyContent: "start"</Paragraph>
    </Section>
    <Section style={{ padding: [20, 24], gap: 10, textAlign: "center" }}>
      <Paragraph style={{ ...VOICE, fontSize: 20, padding: [20, 0, 0], border: { top: LINE } }}>Come and say hello.</Paragraph>
      <Social icons={ICONS.slice(0, 3)} style={{ justifyContent: "center" }} />
      <Paragraph style={CAPTION}>justifyContent: "center"</Paragraph>
    </Section>
    <Section style={{ padding: [12, 24, 32], gap: 10, textAlign: "right" }}>
      <Paragraph style={{ ...VOICE, fontSize: 20, padding: [20, 0, 0], border: { top: LINE } }}>12 Cooper’s Yard, Norwich.</Paragraph>
      <Social icons={ICONS.slice(0, 3)} style={{ justifyContent: "end" }} />
      <Paragraph style={CAPTION}>justifyContent: "end"</Paragraph>
    </Section>
  </Root>
));

/** An email's footer: small icons, a mail link among them, on a dark band. */
export const Footer = story((Root) => (
  <Root width={560} lang="en-GB" fonts={FONTS} style={PAPER}>
    <Section style={{ padding: [36, 24], gap: 8, textAlign: "center" }}>
      <Heading level={2} style={{ ...VOICE, fontSize: 28 }} mobile={{ fontSize: 24 }}>
        Read anything good lately?
      </Heading>
      <Paragraph style={{ color: QUIET }}>Tell us. We’ll put it in the window.</Paragraph>
    </Section>
    <Section style={{ backgroundColor: OXBLOOD, color: ON_OXBLOOD, padding: [28, 24], gap: 14, textAlign: "center" }}>
      <Social
        icons={[
          { name: "Facebook", href: "https://facebook.com/dogearbooks" },
          { name: "X", href: "https://x.com/dogearbooks" },
          { name: "Instagram", href: "https://instagram.com/dogearbooks" },
          { name: "Email", href: "mailto:hello@dogear.example" },
        ]}
        size={28}
        style={{ gap: 10 }}
      />
      <Paragraph style={{ fontSize: 13, lineHeight: 1.6 }}>
        <Span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 15 }}>Dog-ear Books</Span>
        {", 12 Cooper’s Yard, Norwich NR3 1AB. "}
        <Link href="https://dogear.example/unsubscribe" style={{ color: ON_OXBLOOD }}>
          Unsubscribe
        </Link>
      </Paragraph>
    </Section>
  </Root>
));
