/**
 * Larch (a fictional maker of steel bicycles in the Tyrol) shows its films.
 *
 * Graphite and a warm chalk, with one brake-cable red for what to press. Hanken Grotesk at a heavy
 * weight, tightly set, for the words, and DM Mono for the captions. An email can't play a video, so
 * each one's thumbnail is a still drawn in code, with the play button drawn into it.
 */
import type { Meta } from "@storybook/react-vite";
import { args, argTypes, asEmailAndPage, type Args } from "../../../stories/SideBySide";
import { Button, Column, Email, Heading, Paragraph, Row, Section, Video } from "../../index";
import { drawing } from "./kit-d";

const CHALK = "#F2F0EB";
const GRAPHITE = "#191A1C";
const STEEL = "#3A3D41";
const QUIET = "#6A6C6E";
const ON_DARK = "#B9B9B4";
const RULE = "#D9D6CE";
const RED = "#C8402A";
const RED_DOWN = "#AD3522";

const SANS = "'Hanken Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'DM Mono', SFMono-Regular, Menlo, Consolas, monospace";

const FONTS = [
  { family: "Hanken Grotesk", src: "https://fonts.gstatic.com/s/hankengrotesk/v12/ieVn2YZDLWuGJpnzaiwFXS9tYtpd59CxCis4.woff2", format: "woff2", weight: "100 900" } as const,
  { family: "DM Mono", src: "https://fonts.gstatic.com/s/dmmono/v16/aFTU7PB1QTsUX8KYthqQBK6PYK0.woff2", format: "woff2", weight: 400 } as const,
];

const PAPER = { backgroundColor: CHALK, color: GRAPHITE, fontFamily: SANS, fontSize: 16, lineHeight: 1.55 } as const;
const TITLE = { fontWeight: 700, lineHeight: 1.05, letterSpacing: -0.8 } as const;
const CAPTION = { fontFamily: MONO, fontSize: 12, lineHeight: 1.5, color: QUIET } as const;

const SITE = "https://larch.example";
const FILM = "https://www.youtube.com/watch?v=aqz-KE-bpKQ";

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

/** A bicycle in profile: two wheels and a steel frame. */
const BICYCLE = (x: number, y: number, color: string) => `<g transform="translate(${x} ${y})" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><circle cx="0" cy="0" r="46"/><circle cx="150" cy="0" r="46"/><path d="M0 0 46-62H124L68 0H0L34-82M124-62 150 0M124-62 118-86H98M34-82H14"/></g>`;
const PLAY = `<circle cx="256" cy="144" r="30" fill="${RED}"/><path d="M247 129v30l24-15z" fill="#FFFFFF"/>`;

/** An email's still for a video, drawn in the page (no network). A page plays the video, and takes no thumbnail. */
const thumbnail = (Root: typeof Email, scene: string) => (Root === Email ? drawing(512, 288, scene + PLAY) : undefined);

/** The frame shop: a bicycle on a dark bench. */
const WORKSHOP = `<rect width="512" height="288" fill="${GRAPHITE}"/><rect y="226" width="512" height="62" fill="#26282B"/>${BICYCLE(180, 180, "#D9D6CE")}`;
/** A road over a pass at first light. */
const PASS = `<rect width="512" height="288" fill="#DCCFB8"/><circle cx="372" cy="94" r="34" fill="#E8B48A"/><path d="M0 170 92 92 170 150 268 62 372 160 452 110 512 148V288H0z" fill="#8A8F8C"/><path d="M0 226 140 150 262 222 392 158 512 216V288H0z" fill="${STEEL}"/><path d="M0 288C120 262 220 262 512 240V256C280 270 170 274 72 288z" fill="#DCCFB8"/>`;
/** A workbench under a window: three tubes waiting to be a frame. */
const BENCH = `<rect width="512" height="288" fill="${STEEL}"/><rect x="330" y="30" width="130" height="150" fill="#D9D6CE"/><path d="M395 30v150M330 105h130" stroke="${STEEL}" stroke-width="5"/><rect y="214" width="512" height="74" fill="${GRAPHITE}"/><path d="M60 204H310M80 188H280M60 172H240" stroke="#B9B9B4" stroke-width="7" stroke-linecap="round"/>`;

/** The name at the top of a letter, and how long the film is. */
const masthead = (right: string) => (
  <Row stackOnMobile={false} style={{ alignItems: "end" }}>
    <Column>
      <Paragraph style={{ fontSize: 18, fontWeight: 800, letterSpacing: 3, lineHeight: 1.2 }}>LARCH</Paragraph>
    </Column>
    <Column>
      <Paragraph style={{ ...CAPTION, textAlign: "right" }}>{right}</Paragraph>
    </Column>
  </Row>
);

/** A `Video` is its player on a page and its thumbnail, linked to it, in an email. */
export const YouTube = story((Root) => (
  <Root width={560} lang="en-GB" fonts={FONTS} style={PAPER}>
    <Section style={{ padding: [32, 24], gap: 18 }}>
      {masthead("Workshop film · 1:30")}
      <Video src={FILM} thumbnail={thumbnail(Root, WORKSHOP)} title="Inside the Larch frame shop" />
      <Column style={{ gap: 6 }}>
        <Heading level={2} style={{ ...TITLE, fontSize: 28 }} mobile={{ fontSize: 24 }}>
          Forty-one hours, one frame.
        </Heading>
        <Paragraph style={{ color: QUIET }}>Anna brazes every Larch by hand. Here’s a whole one, in ninety seconds.</Paragraph>
      </Column>
    </Section>
  </Root>
));

/** A Vimeo video's thumbnail can't be found without the network, so an email needs `thumbnail`. */
export const Vimeo = story((Root) => (
  <Root width={560} lang="en-GB" fonts={FONTS} style={PAPER}>
    <Section style={{ padding: [32, 24], gap: 18 }}>
      {masthead("A short film · 4:12")}
      <Video src="https://vimeo.com/76979871" thumbnail={thumbnail(Root, PASS)} title="Over the Brenner, slowly" />
      <Column style={{ gap: 6 }}>
        <Heading level={2} style={{ ...TITLE, fontSize: 28 }} mobile={{ fontSize: 24 }}>
          Over the Brenner, slowly.
        </Heading>
        <Paragraph style={{ color: QUIET }}>Two friends, one pass, and a thermos that didn’t make it.</Paragraph>
      </Column>
    </Section>
  </Root>
));

/** `width` and `maxWidth` set its size, and `mobile` another on phones; the stack around it says where it sits. */
export const Widths = story((Root) => (
  <Root width={560} lang="en-GB" fonts={FONTS} style={PAPER}>
    <Section style={{ padding: [32, 24], gap: 12, alignItems: "center" }}>
      <Video src={FILM} thumbnail={thumbnail(Root, BENCH)} title="Cutting the tubes" style={{ width: 320 }} mobile={{ width: "100%" }} />
      <Paragraph style={{ ...CAPTION, textAlign: "center" }}>width: 320, the whole width on phones</Paragraph>
      <Video src={FILM} thumbnail={thumbnail(Root, PASS)} title="The first ride" style={{ width: "50%" }} />
      <Paragraph style={{ ...CAPTION, textAlign: "center" }}>width: "50%", half the space</Paragraph>
    </Section>
  </Root>
));

/** A video in the middle of a product launch: a band for the title, the video, and a button to try it. */
export const ProductLaunch = story((Root) => (
  <Root width={560} lang="en-GB" fonts={FONTS} style={PAPER}>
    <Section style={{ backgroundColor: GRAPHITE, color: CHALK, padding: [44, 32, 40], gap: 10 }} mobile={{ padding: [32, 24] }}>
      <Paragraph style={{ ...CAPTION, color: ON_DARK }}>New for 2027 · Frame no. 2</Paragraph>
      <Heading level={1} style={{ ...TITLE, fontSize: 56, letterSpacing: -1.6 }} mobile={{ fontSize: 42 }}>
        The Tern 2.
      </Heading>
      <Paragraph style={{ fontSize: 17, color: ON_DARK }}>Four hundred grams lighter, and it still fits a mudguard.</Paragraph>
    </Section>
    <Section style={{ padding: [32, 32, 44], gap: 18 }} mobile={{ padding: [24, 24, 36] }}>
      <Video src={FILM} thumbnail={thumbnail(Root, WORKSHOP)} title="See the Tern 2 in 90 seconds" />
      <Paragraph style={{ fontSize: 16, color: QUIET }}>Ninety seconds on what changed in the tubes, and what it means on a long climb.</Paragraph>
      <Column style={{ alignItems: "center", padding: [8, 0, 0], border: { top: `1px solid ${RULE}` } }}>
        <Button href={`${SITE}/tern-2`} style={{ backgroundColor: RED, color: "#FFFFFF", fontSize: 15, fontWeight: 700, padding: [14, 28], borderRadius: 2 }} hover={{ backgroundColor: RED_DOWN }} mobile={{ width: "100%" }}>
          Book a test ride
        </Button>
      </Column>
    </Section>
  </Root>
));
