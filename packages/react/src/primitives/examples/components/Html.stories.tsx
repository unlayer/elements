import type { Meta } from "@storybook/react-vite";
import { args, argTypes, asEmailAndPage, type Args } from "../../../stories/SideBySide";
import { Column, Heading, Html, Section, Paragraph } from "../../index";
import { caption, MONO_FONT } from "./kit-c";

const meta: Meta<Args> = {
  title: "Components/Html",
  args,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Markup written as it is, for what no component says: nothing in it is checked or escaped, so only markup you trust. Each story is drawn as an Email and as a Page, from one template; \"Show code\" has it.",
      },
    },
  },
};
export default meta;

const story = asEmailAndPage;

/**
 * Endpaper (a fictional reading journal that writes to you on Sunday evenings).
 *
 * Quiet like a library at closing time: cream paper, Newsreader for the books, Hanken Grotesk for
 * the numbers, and the oxblood of an old cloth binding where the eye should land.
 */
const PAPER = "#F6F1E7";
const SHEET = "#FFFCF6";
const INK = "#231F1B";
const QUIET = "#70675B";
const RULE = "#E4DBCB";
const OXBLOOD = "#7C2A24";

const SERIF = "Newsreader, Georgia, 'Times New Roman', serif";
const SANS = "'Hanken Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif";

const root = {
  width: 600,
  lang: "en-GB",
  fonts: [
    { family: "Newsreader", src: "https://fonts.gstatic.com/s/newsreader/v26/cY9AfjOCX1hbuyalUrK4397yjIJFJpc.woff2", format: "woff2", weight: "200 800" },
    { family: "Newsreader", src: "https://fonts.gstatic.com/s/newsreader/v26/cY9CfjOCX1hbuyalUrK439vCjohCBJWxZA.woff2", format: "woff2", weight: "200 800", style: "italic" },
    { family: "Hanken Grotesk", src: "https://fonts.gstatic.com/s/hankengrotesk/v12/ieVn2YZDLWuGJpnzaiwFXS9tYtpd59CxCis4.woff2", format: "woff2", weight: "100 900" },
    MONO_FONT,
  ],
  style: { backgroundColor: PAPER, color: INK, fontFamily: SANS, fontSize: 16, lineHeight: 1.55 },
};

const label = { fontSize: 12, fontWeight: 600, letterSpacing: 1.4, textTransform: "uppercase", color: QUIET } as const;

/** Nothing around it styles what an email's markup holds, so the markup says its own font. */
const SERIF_TYPE = `font-family:Newsreader,Georgia,'Times New Roman',serif;color:${INK}`;
const SANS_TYPE = `font-family:'Hanken Grotesk','Helvetica Neue',Helvetica,Arial,sans-serif;color:${INK}`;

/** `Html` is markup written as it is, for what no component says. */
export const YourOwnHtml = story((Root) => (
  <Root {...root}>
    <Section style={{ padding: [44, 32, 48], gap: 18 }} mobile={{ padding: [32, 24, 36], gap: 16 }}>
      <Paragraph style={label}>Your highlight of the week</Paragraph>
      <Html
        html={`<div>
  <blockquote style="${SERIF_TYPE};margin:0;padding:0 0 0 20px;border-left:2px solid ${OXBLOOD};font-size:27px;line-height:1.3">
    The river keeps <mark style="background:#EFD9B9;color:inherit;padding:0 3px">no diary</mark> of the bridges it has outlived.
  </blockquote>
  <p style="${SANS_TYPE};margin:14px 0 0 22px;font-size:14px;line-height:1.5;color:${QUIET}"><cite style="font-style:italic">The Salt Road</cite>, page 212. Saved on Tuesday at 23:40.</p>
</div>`}
      />
      <Paragraph style={{ ...caption(QUIET), padding: [6, 0, 0] }}>{"<blockquote>, <mark>, <cite>: written as they are, nothing in them checked"}</Paragraph>
    </Section>
  </Root>
));

/** A card with a gradient and a shadow, which `style` doesn't have. */
export const GradientCard = story((Root) => (
  <Root {...root}>
    <Section style={{ padding: [44, 32, 52], gap: 18 }} mobile={{ padding: [28, 20, 36] }}>
      <Html
        html={`<div style="${SERIF_TYPE};padding:40px 36px 36px;border-radius:6px;color:#FBF2E4;background:linear-gradient(155deg,#5F1D1A 0%,#8E3A28 62%,#B4623A 100%);box-shadow:0 22px 34px -22px rgba(62,20,14,.75)">
  <div style="${SANS_TYPE};color:#EBCBAA;font-size:12px;font-weight:600;letter-spacing:1.4px;text-transform:uppercase">Your year in books</div>
  <div style="margin:18px 0 10px;font-size:92px;line-height:.95;letter-spacing:-3px">41</div>
  <div style="font-size:23px;line-height:1.28;font-style:italic">books finished, and the longest was the one you nearly gave up on.</div>
</div>`}
      />
      <Paragraph style={caption(QUIET)}>A gradient and a shadow, written as CSS</Paragraph>
    </Section>
  </Root>
));

/** A book on the nightstand: its title, how far in, and a thin bar of that length. */
const bar = (title: string, percent: number, color: string) => `<div style="margin:0 0 20px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td style="${SERIF_TYPE};padding:0 0 7px;font-size:19px;line-height:1.25">${title}</td>
    <td align="right" style="${SANS_TYPE};padding:0 0 7px 12px;font-size:14px;color:${QUIET}">${percent}%</td>
  </tr></table>
  <div style="height:4px;background:${RULE};font-size:0;line-height:0"><div style="width:${percent}%;height:4px;background:${color}"></div></div>
</div>`;

/** Progress bars, next to a heading that's a component: `Html` is one block among others. */
export const ProgressBars = story((Root) => (
  <Root {...root}>
    <Section style={{ padding: [40, 24, 44] }} mobile={{ padding: [20, 12, 28] }}>
      <Column style={{ backgroundColor: SHEET, borderRadius: 4, padding: [36, 36, 16], gap: 24 }} mobile={{ padding: [28, 22, 8], gap: 20 }}>
        <Heading level={2} style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 400, lineHeight: 1.1, letterSpacing: -0.4 }} mobile={{ fontSize: 28 }}>
          On your nightstand
        </Heading>
        <Html html={`<div>${bar("The Salt Road", 82, OXBLOOD)}${bar("Winter Orchards", 46, OXBLOOD)}${bar("A Short History of Rope", 12, OXBLOOD)}</div>`} />
      </Column>
    </Section>
  </Root>
));

/** One figure of the reader's year, as a cell of markup every mail client reads. */
const figure = (value: string, what: string, shaded: boolean) =>
  `<td width="33%" valign="top" style="padding:22px 4px 20px;${shaded ? `background:${SHEET};` : ""}"><div style="${SERIF_TYPE};font-size:30px;line-height:1.1;letter-spacing:-.5px">${value}</div><div style="${SANS_TYPE};margin-top:6px;font-size:13px;line-height:1.3;color:${QUIET}">${what}</div></td>`;

const SO_FAR = "41 books, 11,208 pages, 63 nights in a row";

/** A table of figures in markup every mail client reads: `text` says what it reads as in the plain-text version. */
export const PlainTextVersion = story((Root) => (
  <Root {...root}>
    <Section style={{ padding: [44, 32, 48], gap: 20 }} mobile={{ padding: [28, 20, 36], gap: 16 }}>
      <Heading level={2} style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 400, lineHeight: 1.1, letterSpacing: -0.4 }} mobile={{ fontSize: 28 }}>
        Your year, so far
      </Heading>
      <Html
        text={SO_FAR}
        html={`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="text-align:center;border-top:1px solid ${INK};border-bottom:1px solid ${RULE}"><tr>${figure("41", "books", true)}${figure("11,208", "pages", false)}${figure("63", "nights in a row", true)}</tr></table>`}
      />
      <Paragraph style={caption(QUIET)}>text: "{SO_FAR}"</Paragraph>
    </Section>
  </Root>
));
