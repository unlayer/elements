/**
 * Buttons as Oyen (a fictional maker of audio instruments) uses them: drafting paper, near-black
 * ink and one signal orange. Geist for words, Geist Mono for the quiet notes on what each one sets.
 */
import type { Meta } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { args, argTypes, asEmailAndPage, type Args } from "../../../stories/SideBySide";
import { Button, Column, Heading, Image, LineBreak, MergeTag, Paragraph, Row, Section, Text, type ButtonProps, type EmailProps, type SectionProps } from "../../index";

const PAPER = "#F3F1EC";
const INK = "#1A1917";
const QUIET = "#5F5B53";
const RULE = "#D3CEC4";
const TINT = "#E5E0D5";
const SIGNAL = "#FF5B1F";
const SIGNAL_DOWN = "#E8490F";

const SANS = "Geist, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'Geist Mono', SFMono-Regular, Menlo, Consolas, monospace";

const SITE = "https://oyen.example";

const root: Pick<EmailProps, "width" | "fonts" | "style"> = {
  width: 560,
  fonts: [
    { family: "Geist", src: "https://fonts.gstatic.com/s/geist/v5/gyByhwUxId8gMEwcGFWNOITd.woff2", format: "woff2", weight: "100 900" },
    { family: "Geist Mono", src: "https://fonts.gstatic.com/s/geistmono/v6/or3nQ6H-1_WfwkMZI_qYFrcdmhHkjko.woff2", format: "woff2", weight: "100 900" },
  ],
  style: { backgroundColor: PAPER, color: INK, fontFamily: SANS, fontSize: 16, lineHeight: 1.6 },
};

/** Small mono capitals: the masthead's and the sections' labels. */
const label = { fontFamily: MONO, fontSize: 12, lineHeight: 1.5, letterSpacing: 1.2, textTransform: "uppercase", color: QUIET } as const;
/** A quiet mono note on what a button sets. */
const note = { fontFamily: MONO, fontSize: 12, lineHeight: 1.55, color: QUIET } as const;
const big = { style: { fontSize: 44, fontWeight: 500, lineHeight: 1.04, letterSpacing: -1.7 }, mobile: { fontSize: 34, letterSpacing: -1.2 } } as const;
const small = { style: { fontSize: 28, fontWeight: 500, lineHeight: 1.15, letterSpacing: -0.8 }, mobile: { fontSize: 24 } } as const;

/** Oyen's three buttons: the orange one, the ink one and an outline. */
const signal: ButtonProps["style"] = { backgroundColor: SIGNAL, color: INK, fontSize: 15, fontWeight: 600, padding: [15, 26], borderRadius: 2 };
const dark: ButtonProps["style"] = { backgroundColor: INK, color: PAPER, fontSize: 15, fontWeight: 600, padding: [15, 26], borderRadius: 2 };
const outline: ButtonProps["style"] = { backgroundColor: PAPER, color: INK, fontSize: 15, fontWeight: 600, padding: [14, 26], border: `1px solid ${INK}`, borderRadius: 2 };
const fullOnPhones = { width: "100%" } as const;

/** The band each story is drawn in. */
const band = (children: ReactNode, style: SectionProps["style"] = {}) => (
  <Section style={{ padding: [32, 44, 44], gap: 28, ...style }} mobile={{ padding: [24, 24, 32], gap: 24 }}>
    {children}
  </Section>
);

/** Oyen's masthead: its name, and what this page is. */
const masthead = (page: string) => (
  <Row stackOnMobile={false} style={{ padding: [0, 0, 12], border: { bottom: `1px solid ${INK}` } }}>
    <Column style={{ width: 100 }}>
      <Text style={{ fontSize: 16, fontWeight: 700, letterSpacing: 4.5, lineHeight: "18px" }}>OYEN</Text>
    </Column>
    <Column>
      <Text style={{ ...label, lineHeight: "18px", textAlign: "right" }}>{page}</Text>
    </Column>
  </Row>
);

/** A line of a sheet: a button, and a note beside it on what it sets (under it on phones). */
const line = (noted: string, button: ReactNode) => (
  <Row style={{ alignItems: "center", gap: 20, padding: [14, 0], border: { top: `1px solid ${RULE}` } }} mobile={{ gap: 10 }}>
    <Column style={{ width: 236, alignItems: "start" }}>{button}</Column>
    <Column>
      <Text style={note}>{noted}</Text>
    </Column>
  </Row>
);

/** A note over a button, under a rule. */
const measure = (noted: string, button: ReactNode) => (
  <Column style={{ gap: 10, padding: [14, 0, 18], border: { top: `1px solid ${RULE}` }, alignItems: "start" }}>
    <Text style={note}>{noted}</Text>
    {button}
  </Column>
);

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
  <Root {...root}>
    {band(
      <>
        {masthead("Dispatch 07")}
        <Image src={{ src: "gallery/oyen/fr2-drawing.png", width: 1008, height: 640 }} alt="A technical drawing of the FR-2 recorder from the front and the side, with four numbered callouts in orange." style={{ width: "100%" }} />
        <Column style={{ gap: 14 }}>
          <Heading level={2} {...big}>
            Record the room
            <LineBreak />
            you’re in.
          </Heading>
          <Paragraph style={{ fontSize: 17, lineHeight: 1.5, maxWidth: 420 }}>A pocket recorder with two capsules that turn, one dial, and nothing to set before you press record.</Paragraph>
        </Column>
        <Row style={{ gap: 12 }}>
          <Button href={`${SITE}/fr-2`} style={{ ...signal, width: 176, padding: [15, 0] }} hover={{ backgroundColor: SIGNAL_DOWN }} mobile={fullOnPhones}>
            Pre-order FR-2
          </Button>
          <Button href={`${SITE}/fr-2/specifications`} style={{ ...outline, width: 232, padding: [14, 0] }} hover={{ backgroundColor: TINT }} mobile={fullOnPhones}>
            Read the specifications
          </Button>
        </Row>
      </>
    )}
    <Section style={{ backgroundColor: SIGNAL, padding: [32, 44, 36], gap: 16 }} mobile={{ padding: [28, 24, 32] }}>
      <Heading level={3} style={{ fontSize: 22, fontWeight: 500, lineHeight: 1.25, letterSpacing: -0.4, maxWidth: 350 }}>
        Rather hold one first? Forty shops have one on the counter.
      </Heading>
      <Button href={`${SITE}/dealers`} style={{ ...dark, width: 320 }} hover={{ backgroundColor: "#3A3833" }} mobile={fullOnPhones}>
        Find a dealer near you
      </Button>
      <Text style={{ ...note, color: INK }}>width: 320, the whole width on phones</Text>
    </Section>
  </Root>
));

/** `hover` has a button's colors under the pointer, its text's and its background's. */
export const Hover = story((Root) => (
  <Root {...root}>
    {band(
      <>
        {masthead("Your basket")}
        <Column style={{ gap: 14 }}>
          <Heading level={2} {...big}>
            Still on the bench.
          </Heading>
          <Paragraph style={{ fontSize: 17, lineHeight: 1.5, maxWidth: 420 }}>We’ll hold your FR-2 until Friday. After that, what’s left of the first run goes to whoever asks first.</Paragraph>
        </Column>
        <Row stackOnMobile={false} style={{ alignItems: "center", padding: [16, 0], border: { top: `1px solid ${INK}`, bottom: `1px solid ${RULE}` } }}>
          <Column>
            <Text style={{ fontSize: 16, fontWeight: 600 }}>FR-2 field recorder</Text>
            <Text style={note}>Ships 2 December</Text>
          </Column>
          <Column style={{ width: 80 }}>
            <Text style={{ fontFamily: MONO, fontSize: 16, textAlign: "right" }}>€349</Text>
          </Column>
        </Row>
        <Column style={{ gap: 10 }}>
          <Button href={`${SITE}/basket`} style={{ ...signal, width: "100%" }} hover={{ backgroundColor: SIGNAL_DOWN }}>
            Finish your order
          </Button>
          <Button href={`${SITE}/basket/later`} style={{ ...outline, width: "100%" }} hover={{ backgroundColor: INK, color: PAPER }}>
            Save it for later
          </Button>
          <Button href={`${SITE}/basket/add/battery`} style={{ ...signal, width: "100%", backgroundColor: TINT, color: QUIET }} hover={{ color: INK }}>
            Add a spare battery, €19
          </Button>
        </Column>
        <Text style={note}>Point at each: a darker background, an outline that fills in, a darker text.</Text>
      </>
    )}
  </Root>
));

/** With nothing set it has small round corners and the default color; `borderRadius` and `border` shape it from there. */
export const Shapes = story((Root) => (
  <Root {...root}>
    {band(
      <>
        {masthead("Field manual, p. 12")}
        <Heading level={2} {...small}>
          Five shapes, from one link.
        </Heading>
        <Column>
          {line("Nothing set: small round corners, the default color", <Button href={SITE}>Open the shop</Button>)}
          {line("borderRadius: 0", <Button href={SITE} style={{ backgroundColor: INK, borderRadius: 0 }}>Open the shop</Button>)}
          {line("borderRadius: 24, and more padding", <Button href={SITE} style={{ backgroundColor: SIGNAL, color: INK, borderRadius: 24, padding: [12, 28] }}>Open the shop</Button>)}
          {line("border: 2px solid, borderRadius: 8", <Button href={SITE} style={{ backgroundColor: PAPER, color: INK, border: `2px solid ${INK}`, borderRadius: 8 }}>Open the shop</Button>)}
          {line("fontSize: 18, fontWeight: 700", <Button href={SITE} style={{ backgroundColor: INK, fontSize: 18, fontWeight: 700, padding: [16, 36], borderRadius: 8 }}>Open the shop</Button>)}
        </Column>
      </>
    )}
  </Root>
));

/** As wide as its text by default; `width` sets a size or a share of the space, and `mobile` another on phones. */
export const Widths = story((Root) => (
  <Root {...root}>
    {band(
      <>
        {masthead("In the box")}
        <Heading level={2} {...small}>
          Your FR-2 has arrived.
          <LineBreak />
          Now what?
        </Heading>
        <Column>
          {measure(
            "As wide as its text, with nothing set",
            <Button href={`${SITE}/start`} style={dark}>
              Start here
            </Button>
          )}
          {measure(
            "width: 240",
            <Button href={`${SITE}/manual`} style={{ ...dark, width: 240 }}>
              Read the manual
            </Button>
          )}
          {measure(
            'width: "50%", half the space',
            <Button href={`${SITE}/samples`} style={{ ...dark, width: "50%", padding: [15, 8] }}>
              Hear the samples
            </Button>
          )}
          {measure(
            'width: "100%", all of it',
            <Button href={`${SITE}/register`} style={{ ...dark, width: "100%" }}>
              Register your guarantee
            </Button>
          )}
          {measure(
            "width: 240, all of it on phones",
            <Button href={`${SITE}/record`} style={{ ...signal, width: 240 }} hover={{ backgroundColor: SIGNAL_DOWN }} mobile={fullOnPhones}>
              Press record
            </Button>
          )}
        </Column>
      </>
    )}
  </Root>
));

/** The stack around it says where it sits, `alignSelf` where this one does; `textAlign` is where its text sits in it. */
export const Alignment = story((Root) => (
  <Root {...root}>
    {band(
      <>
        {masthead("Dispatch 07 · Nov 2026")}
        <Column style={{ gap: 16, alignItems: "center", textAlign: "center", padding: [12, 0, 4] }}>
          <Heading level={2} {...big}>
            Nine hours of rain,
            <LineBreak />
            on a fence post.
          </Heading>
          <Paragraph style={{ fontSize: 17, lineHeight: 1.5, maxWidth: 400 }}>Maren left her FR-2 running through a night in the Hardanger. This is what it kept.</Paragraph>
        </Column>
      </>
    )}
    <Section style={{ padding: [0, 44, 44], gap: 12, alignItems: "center", textAlign: "center" }} mobile={{ padding: [0, 24, 32] }}>
      <Button href={`${SITE}/dispatch/07`} style={signal} hover={{ backgroundColor: SIGNAL_DOWN }}>
        Read dispatch 07
      </Button>
      <Text style={{ ...note, padding: [0, 0, 16] }}>In the center, as the stack says</Text>
      <Button href={`${SITE}/dispatch/07.pdf`} style={{ ...dark, width: 320, textAlign: "left" }} mobile={fullOnPhones}>
        As a PDF, 2.4 MB
      </Button>
      <Button href={`${SITE}/dispatch/07.mp3`} style={{ ...dark, width: 320, textAlign: "right" }} mobile={fullOnPhones}>
        As audio, 41 minutes
      </Button>
      <Text style={{ ...note, padding: [0, 0, 16] }}>textAlign: "left", and "right"</Text>
      <Button href={`${SITE}/dispatch/06`} style={{ ...outline, alignSelf: "start" }}>
        ← Dispatch 06
      </Button>
      <Button href={`${SITE}/dispatch/08`} style={{ ...outline, alignSelf: "end" }}>
        Dispatch 08 →
      </Button>
      <Text style={note}>alignSelf: "start", and "end"</Text>
    </Section>
  </Root>
));

/** `href` takes a web, mail or phone link, a target, or a merge tag; `title` and `aria-label` say what it does. */
export const Links = story((Root) => (
  <Root {...root}>
    {band(
      <>
        {masthead("Repairs")}
        <Column style={{ gap: 12 }}>
          <Heading level={2} {...small}>
            Your FR-2 is on the bench with Ingrid.
          </Heading>
          <Paragraph style={{ fontSize: 16, lineHeight: 1.5, color: QUIET }}>She’s fitting a new hold switch, and it should be back with you by Friday.</Paragraph>
        </Column>
        <Column>
          {line("A web page, and a title", <Button href={`${SITE}/repairs`} title="How repairs work, on our site" style={{ ...dark, width: "100%" }}>How repairs work</Button>)}
          {line('target: "_blank", aria-label', <Button href={{ href: `${SITE}/manual`, target: "_blank" }} aria-label="Read the manual, in a new window" style={{ ...dark, width: "100%" }}>Read the manual</Button>)}
          {line("mailto:", <Button href="mailto:bench@oyen.example" style={{ ...outline, width: "100%" }}>Write to Ingrid</Button>)}
          {line("tel:", <Button href="tel:+4722000170" style={{ ...outline, width: "100%" }}>Call the workshop</Button>)}
          {line("A merge tag, filled in when it’s sent", <Button href={`${SITE}/repairs/track`} style={{ ...signal, width: "100%", padding: [15, 0] }} hover={{ backgroundColor: SIGNAL_DOWN }}>Track repair <MergeTag name="order_id" /></Button>)}
        </Column>
      </>
    )}
  </Root>
));
