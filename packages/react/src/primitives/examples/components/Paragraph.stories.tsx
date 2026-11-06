import type { Meta } from "@storybook/react-vite";
import { args, argTypes, asEmailAndPage, type Args } from "../../../stories/SideBySide";
import { Column, Divider, Heading, LineBreak, Link, MergeTag, Paragraph, Row, Section, Span } from "../../index";
import { caption, MONO_FONT } from "./kit-c";

const meta: Meta<Args> = {
  title: "Components/Paragraph",
  args,
  argTypes,
  parameters: {
    docs: {
      description: {
        component:
          "Text, from `@unlayer/react-elements`: `Paragraph` and `Text` hold it; inside them `Span` styles a run, `Link` links one, `LineBreak` breaks the line and `MergeTag` is filled in by the sender. Each story is drawn as an Email and as a Page, from one template; \"Show code\" has it.",
      },
    },
  },
};
export default meta;

const story = asEmailAndPage;

/**
 * Tidewrack (a fictional quarterly of writing about the coast, printed in Port Ellis).
 *
 * All type and no pictures: cool sea-grey paper, Cormorant Garamond for the voice, Source Serif for
 * reading, and a lobster red, used once or twice, where the eye should land.
 */
const FOG = "#E9EEEB";
const SHEET = "#F7F9F7";
const INK = "#15211F";
const QUIET = "#5B6966";
const RULE = "#CBD5D1";
const LOBSTER = "#BE3F24";
const SAND = "#F3DDB3";

const DISPLAY = "'Cormorant Garamond', Garamond, Georgia, serif";
const TEXT = "'Source Serif 4', Georgia, 'Times New Roman', serif";

const SITE = "https://tidewrack.example";

const root = {
  width: 600,
  lang: "en-GB",
  fonts: [
    { family: "Cormorant Garamond", src: "https://fonts.gstatic.com/s/cormorantgaramond/v21/co3bmX5slCNuHLi8bLeY9MK7whWMhyjYqXtKky2F7g.woff2", format: "woff2", weight: "300 700" },
    { family: "Cormorant Garamond", src: "https://fonts.gstatic.com/s/cormorantgaramond/v21/co3ZmX5slCNuHLi8bLeY9MK7whWMhyjYrEtImSqn7B6D.woff2", format: "woff2", weight: "300 700", style: "italic" },
    { family: "Source Serif 4", src: "https://fonts.gstatic.com/s/sourceserif4/v15/vEFI2_tTDB4M7-auWDN0ahZJW1gb8te1Xb7G.woff2", format: "woff2", weight: "200 900" },
    { family: "Source Serif 4", src: "https://fonts.gstatic.com/s/sourceserif4/v15/vEFK2_tTDB4M7-auWDN0ahZJW1gewtW_WpzEpMs.woff2", format: "woff2", weight: "200 900", style: "italic" },
    MONO_FONT,
  ],
  style: { backgroundColor: FOG, color: INK, fontFamily: TEXT, fontSize: 17, lineHeight: 1.6 },
};

const sheet = { padding: [44, 48, 48], gap: 16 } as const;
const sheetOnPhones = { padding: [32, 24, 36], gap: 14 } as const;
const label = { fontSize: 12, fontWeight: 600, letterSpacing: 1.6, textTransform: "uppercase", color: LOBSTER } as const;
const voice = { fontFamily: DISPLAY, fontWeight: 500, lineHeight: 1.08, letterSpacing: -0.4 } as const;

/** The quarterly's nameplate, over a rule. */
const masthead = (issue: string) => (
  <Row stackOnMobile={false} style={{ alignItems: "end", padding: [0, 0, 12], border: { bottom: `1px solid ${INK}` } }}>
    <Column>
      <Paragraph style={{ fontFamily: DISPLAY, fontSize: 28, fontStyle: "italic", fontWeight: 600, lineHeight: 1 }}>Tidewrack</Paragraph>
    </Column>
    <Column>
      <Paragraph style={{ ...label, color: QUIET, textAlign: "right" }}>{issue}</Paragraph>
    </Column>
  </Row>
);

/** Headings and text: `Span` styles a run, `Link` links one, `LineBreak` breaks the line, `MergeTag` is filled in by the sender. */
export const Runs = story((Root) => (
  <Root {...root}>
    <Section style={sheet} mobile={sheetOnPhones}>
      {masthead("Renewals")}
      <Heading level={1} style={{ ...voice, fontSize: 46, padding: [20, 0, 0] }} mobile={{ fontSize: 38, padding: [14, 0, 0] }}>
        Hello, <MergeTag name="first_name" />
      </Heading>
      <Heading level={2} style={{ ...voice, fontSize: 24, fontStyle: "italic", color: LOBSTER }} mobile={{ fontSize: 22 }}>
        Your subscription renews soon
      </Heading>
      <Paragraph>
        Your <Span style={{ fontWeight: 700 }}>four issues of Tidewrack</Span> renew on <Span style={{ color: LOBSTER }}>3 March</Span>.
        <LineBreak />
        Read{" "}
        <Link href={`${SITE}/renewal`} style={{ color: LOBSTER }}>
          how renewal works
        </Link>
        , or do nothing, and the post will keep coming.
      </Paragraph>
    </Section>
  </Root>
));

/** A paragraph's size, line height, color and spacing are in `style`, and `maxWidth` holds it to a width. */
export const Styles = story((Root) => (
  <Root {...root}>
    <Section style={{ ...sheet, gap: 18 }} mobile={sheetOnPhones}>
      <Paragraph style={label}>Winter, No. 31</Paragraph>
      <Paragraph style={{ fontFamily: DISPLAY, fontSize: 36, fontWeight: 500, lineHeight: 1.14, letterSpacing: -0.4 }} mobile={{ fontSize: 30 }}>
        The tide takes everything back, twice a day, and asks nobody first.
      </Paragraph>
      <Paragraph style={{ fontSize: 17, lineHeight: 1.7, color: QUIET }}>
        This issue walks one stretch of the coast for a year, from the winter storms that move the shingle to the summer visitors who never notice it has moved. It starts, as most things do in Port Ellis, with a boat that shouldn’t have gone out.
      </Paragraph>
      <Paragraph style={{ fontSize: 14, fontStyle: "italic", color: QUIET }}>Photographs by nobody: we still think words will do.</Paragraph>
      <Paragraph style={{ fontSize: 17, lineHeight: 1.45, maxWidth: 280, padding: [14, 0, 0], border: { top: `2px solid ${LOBSTER}` } }}>Held to 280px by maxWidth, however wide its column.</Paragraph>
    </Section>
  </Root>
));

/** `textAlign` puts the lines on the left, in the center, on the right, or out to both sides. */
export const Alignment = story((Root) => (
  <Root {...root}>
    <Section style={{ padding: [32, 24, 20] }} mobile={{ padding: [12, 12, 12] }}>
      <Column style={{ backgroundColor: SHEET, padding: [40, 44, 40], gap: 18 }} mobile={{ padding: [28, 24, 28], gap: 14 }}>
        <Paragraph style={{ textAlign: "left" }}>Dear reader,</Paragraph>
        <Paragraph style={{ fontFamily: DISPLAY, fontSize: 28, fontStyle: "italic", lineHeight: 1.2, color: LOBSTER, textAlign: "center", padding: [4, 0] }} mobile={{ fontSize: 24 }}>
          The shingle has moved again.
        </Paragraph>
        <Paragraph style={{ textAlign: "justify" }}>
          Every winter we promise to print this issue on time, and every winter the sea has other ideas. This year it took the road to the printer’s for nine days. We waited, as people here do, and went back to work when it had finished.
        </Paragraph>
        <Paragraph style={{ textAlign: "right" }}>
          Ines Harcourt, editor
          <LineBreak />
          <Span style={{ color: QUIET, fontSize: 15 }}>Port Ellis, February</Span>
        </Paragraph>
      </Column>
    </Section>
    <Section style={{ padding: [0, 24, 28] }} mobile={{ padding: [0, 20, 20] }}>
      <Paragraph style={{ ...caption(QUIET), textAlign: "center" }}>textAlign, from the top: "left", "center", "justify", "right"</Paragraph>
    </Section>
  </Root>
));

/** A `Span` styles a run of text: its weight, color and decoration, a highlight behind it, or raised and lowered. */
export const Spans = story((Root) => (
  <Root {...root}>
    <Section style={{ ...sheet, gap: 22 }} mobile={sheetOnPhones}>
      <Paragraph style={{ fontFamily: DISPLAY, fontSize: 32, fontWeight: 500, lineHeight: 1.28 }} mobile={{ fontSize: 26 }}>
        The winter issue is <Span style={{ fontWeight: 700 }}>our longest</Span>, <Span style={{ fontStyle: "italic" }}>mostly true</Span>, <Span style={{ color: LOBSTER }}>printed in red and black</Span>, <Span style={{ textDecoration: "underline" }}>set by hand</Span>, <Span style={{ textDecoration: "line-through" }}>early</Span>{" "}
        <Span style={{ backgroundColor: SAND }}>out on 3 March</Span>.
      </Paragraph>
      <Divider style={{ borderTop: `1px solid ${RULE}` }} />
      <Row style={{ gap: 24, alignItems: "end" }} mobile={{ gap: 18 }}>
        <Column>
          <Paragraph style={{ fontSize: 15, lineHeight: 1.5, color: QUIET }}>
            Tidewrack<Span style={{ verticalAlign: "super", fontSize: 10 }}>®</Span> is printed by a press that counts its CO<Span style={{ verticalAlign: "sub", fontSize: 10 }}>2</Span> and tells us the number.
          </Paragraph>
        </Column>
        <Column style={{ width: 190 }} mobile={{ width: "100%" }}>
          <Paragraph style={{ textAlign: "right" }} mobile={{ textAlign: "left" }}>
            <Span style={{ fontFamily: DISPLAY, fontSize: 44, fontWeight: 600 }}>£36</Span>
            <Span style={{ fontSize: 14, color: QUIET }}> a year</Span>
          </Paragraph>
        </Column>
      </Row>
    </Section>
  </Root>
));

/** A way to link, its note beside it. */
const way = (note: string, link: JSX.Element) => (
  <Row style={{ gap: 20, padding: [13, 0], alignItems: "center", border: { top: `1px solid ${RULE}` } }} mobile={{ gap: 3 }}>
    <Column style={{ width: 200 }} mobile={{ width: "100%" }}>
      <Paragraph style={caption(QUIET)}>{note}</Paragraph>
    </Column>
    <Column>{link}</Column>
  </Row>
);

/** A `Link`'s color and underline are in `style`, its colors under the pointer in `hover`; `href` takes a mail or phone link, or a target. */
export const Links = story((Root) => (
  <Root {...root}>
    <Section style={{ ...sheet, gap: 20 }} mobile={sheetOnPhones}>
      <Heading level={2} style={{ ...voice, fontSize: 38 }} mobile={{ fontSize: 32 }}>
        Where to go from here
      </Heading>
      <Column style={{ border: { bottom: `1px solid ${RULE}` } }}>
        {way("With nothing set", <Paragraph><Link href={`${SITE}/back-issues`}>The back issues, underlined in blue</Link></Paragraph>)}
        {way("In a color", <Paragraph><Link href={`${SITE}/contents`} style={{ color: LOBSTER }}>What’s in No. 31</Link></Paragraph>)}
        {way('hover: underlined', <Paragraph><Link href={`${SITE}/writers`} style={{ color: LOBSTER, textDecoration: "none" }} hover={{ textDecoration: "underline" }}>Write for us, point at this</Link></Paragraph>)}
        {way('hover: highlighted', <Paragraph><Link href={`${SITE}/shop`} style={{ color: LOBSTER }} hover={{ color: "#FFFFFF", backgroundColor: LOBSTER }}>Give a subscription, point at this</Link></Paragraph>)}
        {way("Mail and phone", <Paragraph><Link href="mailto:post@tidewrack.example" title="Write to us" style={{ color: INK }}>Write to us</Link>, or <Link href="tel:+15550100" style={{ color: INK }}>call the office</Link></Paragraph>)}
        {way('target: "_blank"', <Paragraph><Link href={{ href: `${SITE}/terms`, target: "_blank" }} aria-label="Our terms, in a new window" style={{ color: INK }}>Our terms, in a new window</Link></Paragraph>)}
      </Column>
    </Section>
  </Root>
));

/** `Text` is a block with no meaning of its own, and a box like any: here a note, and an address of `LineBreak`s and `MergeTag`s. */
export const TextBlocks = story((Root) => (
  <Root {...root}>
    <Section style={{ ...sheet, gap: 20 }} mobile={sheetOnPhones}>
      {masthead("Winter, No. 31")}
      <Heading level={2} style={{ ...voice, fontSize: 38, padding: [12, 0, 0] }} mobile={{ fontSize: 32, padding: [8, 0, 0] }}>
        No. 31 is in the post
      </Heading>
      <Paragraph style={{ padding: [14, 18], backgroundColor: SHEET, border: { left: `3px solid ${LOBSTER}` }, fontSize: 15, lineHeight: 1.55 }}>
        <Span style={{ fontWeight: 700 }}>Good to know:</Span> it’s a thick one this winter, so it may not fit through a small letterbox.
      </Paragraph>
      <Paragraph style={{ padding: [18, 20], backgroundColor: SHEET, borderRadius: 4, fontSize: 15, lineHeight: 1.6 }}>
        <Span style={{ fontWeight: 700 }}>Sent to</Span>
        <LineBreak />
        <MergeTag name="full_name" />
        <LineBreak />
        <MergeTag name="street" />, <MergeTag name="city" />
      </Paragraph>
    </Section>
  </Root>
));
