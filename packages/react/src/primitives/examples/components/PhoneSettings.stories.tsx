/**
 * Hollin (a fictional network of mountain huts) writes to walkers, who mostly read it on a phone,
 * on the way up.
 *
 * Snow paper, pine ink and one marigold, the color of a lit hut window, kept for the button and the
 * route. Young Serif for the voice, Manrope for the facts, DM Mono for the captions.
 */
import type { Meta } from "@storybook/react-vite";
import { argTypes, asEmailAndPage, type Args } from "../../../stories/SideBySide";
import { Button, Column, Heading, Image, Text, Row, Section } from "../../index";
import { drawing } from "./kit-d";

const SNOW = "#F5F2EB";
const PINE = "#1F3A33";
const QUIET = "#5A6A64";
const RULE = "#D9D5CA";
const WASH = "#E9E6DC";
const MARIGOLD = "#E3A32B";
const MARIGOLD_DOWN = "#CF9220";

const SERIF = "'Young Serif', Georgia, 'Times New Roman', serif";
const SANS = "Manrope, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'DM Mono', SFMono-Regular, Menlo, Consolas, monospace";

const FONTS = [
  { family: "Young Serif", src: "https://fonts.gstatic.com/s/youngserif/v2/3qTpojO2nS2VtkB3KtkQZ1t93kY6ah7E.woff2", format: "woff2", weight: 400 } as const,
  { family: "Manrope", src: "https://fonts.gstatic.com/s/manrope/v23/xn7gYHE41ni1AdIRggexSvfedN4.woff2", format: "woff2", weight: "200 800" } as const,
  { family: "DM Mono", src: "https://fonts.gstatic.com/s/dmmono/v16/aFTU7PB1QTsUX8KYthqQBK6PYK0.woff2", format: "woff2", weight: 400 } as const,
];

const PAPER = { backgroundColor: SNOW, color: PINE, fontFamily: SANS, fontSize: 16, lineHeight: 1.55 } as const;
const VOICE = { fontFamily: SERIF, fontWeight: 400, lineHeight: 1.12 } as const;
const CAPTION = { fontFamily: MONO, fontSize: 12, lineHeight: 1.5, color: QUIET } as const;
const LABEL = { fontSize: 12, fontWeight: 700, letterSpacing: 1.4, textTransform: "uppercase", color: QUIET } as const;

const SITE = "https://hollin.example";

/** Three ridges under a marigold sun, and a hut with its window lit. Square crops make the thumbnail. */
const RIDGES = `<rect width="900" height="360" fill="#DCE2D9"/><circle cx="668" cy="112" r="44" fill="${MARIGOLD}"/><path d="M0 226 140 128 240 190 360 88 490 200 610 138 760 232 900 168V360H0z" fill="#A9B8AE"/><path d="M0 292 170 190 300 270 450 168 620 282 760 210 900 272V360H0z" fill="#5E7A6C"/><path d="M0 346 260 256 520 322 900 262V360H0z" fill="${PINE}"/><path d="M556 312l28-24 28 24v26h-56z" fill="${SNOW}"/><rect x="576" y="314" width="14" height="14" fill="${MARIGOLD}"/>`;
const RIDGE_VIEW = drawing(900, 360, RIDGES);
const HUT_THUMBNAIL = drawing(128, 128, `<g transform="scale(1.4) translate(-538 -265)">${RIDGES}</g>`);

/** A route on contour lines: where you start, where the hut is, and the dashed way between them. */
const ROUTE_CARD = drawing(
  480,
  240,
  `<rect width="480" height="240" fill="#E5E8DF"/><g fill="none" stroke="#BCC6BA" stroke-width="1.5"><path d="M-20 214C70 170 120 226 210 188S360 150 500 196"/><path d="M-20 172C60 128 130 188 214 146S366 104 500 150"/><path d="M-20 128C56 88 140 144 220 102S372 58 500 106"/><path d="M-20 84C70 52 146 100 226 62S376 20 500 62"/><path d="M-20 40C72 16 150 56 232 24S380-14 500 20"/></g><path d="M56 206C110 190 118 150 178 140S244 96 298 92 372 60 420 46" fill="none" stroke="${MARIGOLD}" stroke-width="4" stroke-dasharray="2 9" stroke-linecap="round"/><circle cx="56" cy="206" r="7" fill="${PINE}"/><path d="M420 30l15 12v15h-30V42z" fill="${PINE}"/>`
);

const meta: Meta<Args> = {
  title: "Components/Phone settings",
  args: { width: "phone" },
  argTypes,
  parameters: {
    docs: {
      description: {
        component:
          "What changes on phones: `mobile={{ }}` has a box's or text's styles there, `hidden={{ }}` leaves it out on one or the other, and a `Row` stacks. These stories open in a phone's window; choose \"desktop\" under width for the same template on a wider one. Each is drawn as an Email and as a Page, from one template; \"Show code\" has it.",
      },
    },
  },
};
export default meta;

const story = asEmailAndPage;

/** `mobile` has a box's or text's styles on phones, and `hidden` leaves it out on one or the other. */
export const TextAndHidden = story((Root) => (
  <Root width={560} lang="en-GB" fonts={FONTS} style={PAPER}>
    <Section style={{ padding: [40, 24], gap: 14 }}>
      <Text style={LABEL} mobile={{ textAlign: "center" }}>
        Stickle Hut · Saturday 14 November
      </Text>
      <Heading level={1} style={{ ...VOICE, fontSize: 46 }} mobile={{ fontSize: 32, textAlign: "center" }}>
        Your bunk is booked.
      </Heading>
      <Text hidden={{ mobile: true }} style={{ fontSize: 17, color: QUIET }}>
        Print this and put it in your pack. There’s no signal at the hut, and the warden checks you in from a paper list.
      </Text>
      <Text hidden={{ desktop: true }} style={{ fontSize: 16, color: QUIET, textAlign: "center" }}>
        Take a screenshot before you set off. There’s no signal at the hut, and the warden checks you in from a paper list.
      </Text>
      <Text style={CAPTION} mobile={{ textAlign: "center" }}>
        hidden: one line for each screen
      </Text>
    </Section>
  </Root>
));

/** One design that keeps its layout on a wider window, and changes its padding, its type and its picture's width for a phone. */
export const WholeDesign = story((Root) => (
  <Root width={600} lang="en-GB" fonts={FONTS} style={PAPER}>
    <Column style={{ padding: [36, 40], gap: 18 }} mobile={{ padding: [24, 20], gap: 14 }}>
      <Text style={LABEL} mobile={{ textAlign: "center" }}>
        The Friday walk-in
      </Text>
      <Heading level={1} style={{ ...VOICE, fontSize: 42 }} mobile={{ fontSize: 30, textAlign: "center" }}>
        Three huts you can reach before dark.
      </Heading>
      <Column style={{ alignItems: "center" }}>
        <Image src={RIDGE_VIEW} alt="Three green ridges under a low sun, and a small white hut with its window lit" style={{ width: "75%" }} mobile={{ width: "100%" }} />
      </Column>
      <Text style={{ fontSize: 17, lineHeight: 1.6 }} mobile={{ fontSize: 15, lineHeight: 1.55 }}>
        All three are under two hours from a station, and all three still have bunks for this weekend. Leave work at four, and the stove’s lit by seven.
      </Text>
      <Column style={{ alignItems: "center" }}>
        <Button href={`${SITE}/this-weekend`} style={{ backgroundColor: MARIGOLD, color: PINE, fontSize: 15, fontWeight: 700, padding: [14, 28], borderRadius: 2 }} hover={{ backgroundColor: MARIGOLD_DOWN }}>
          See this weekend’s bunks
        </Button>
      </Column>
      <Text hidden={{ mobile: true }} style={{ fontSize: 13, color: QUIET, textAlign: "center" }}>
        Send this to your phone: the route cards work without signal.
      </Text>
      <Text hidden={{ desktop: true }} style={{ fontSize: 13, color: QUIET, textAlign: "center" }}>
        Keep this one: the route cards work without signal.
      </Text>
    </Column>
  </Root>
));

/** A thing to pack, in a box of its own. */
const packing = (name: string, why: string) => (
  <Column style={{ padding: [18, 20], gap: 4, backgroundColor: WASH }} mobile={{ padding: [12, 16], gap: 2 }}>
    <Text style={{ ...VOICE, fontSize: 19 }}>{name}</Text>
    <Text style={{ fontSize: 14, color: QUIET }}>{why}</Text>
  </Column>
);

/** A `Row` stacks on phones, unless `stackOnMobile={false}` keeps it; each child's `mobile` has its own width and box. */
export const RowsOnPhones = story((Root) => (
  <Root width={560} lang="en-GB" fonts={FONTS} style={PAPER}>
    <Section style={{ padding: [32, 24], gap: 18 }}>
      <Heading level={2} style={{ ...VOICE, fontSize: 30 }}>
        What to bring
      </Heading>
      <Row style={{ gap: 12 }} mobile={{ gap: 4 }}>
        {packing("A sleeping bag liner", "There are blankets on the bunks.")}
        {packing("A head torch", "Lights out at ten. The path is dark.")}
      </Row>
      <Text style={CAPTION}>These two stack, closer together, with less padding.</Text>
      <Row stackOnMobile={false} style={{ gap: 14, alignItems: "center", padding: [16, 0, 0], border: { top: `1px solid ${RULE}` } }}>
        <Column style={{ width: 64 }}>
          <Image src={HUT_THUMBNAIL} alt="Stickle Hut, small and white under the ridge" style={{ width: 64, borderRadius: 32 }} />
        </Column>
        <Column>
          <Text style={{ fontWeight: 700 }}>Stickle Hut sleeps fourteen.</Text>
          <Text style={{ fontSize: 14, color: QUIET }}>The stove’s lit by four. (A picture and its words stay side by side.)</Text>
        </Column>
      </Row>
    </Section>
  </Root>
));

/** A button and a picture take the whole width on phones, and `alignSelf` moves one to another place there. */
export const ButtonsAndImages = story((Root) => (
  <Root width={560} lang="en-GB" fonts={FONTS} style={PAPER}>
    <Section style={{ padding: [32, 24], gap: 16, alignItems: "start" }}>
      <Heading level={2} style={{ ...VOICE, fontSize: 30 }}>
        Your route up
      </Heading>
      <Image src={ROUTE_CARD} alt="A route card: a dashed line climbing across the contours from the road to the hut" style={{ width: 240 }} mobile={{ width: "100%" }} />
      <Text style={CAPTION}>6.2 km · 410 m of climb · about 2 h 10</Text>
      <Button href={`${SITE}/routes/stickle.gpx`} style={{ width: 240, backgroundColor: MARIGOLD, color: PINE, fontSize: 14, fontWeight: 700, padding: [12, 16], borderRadius: 2 }} hover={{ backgroundColor: MARIGOLD_DOWN }} mobile={{ width: "100%", fontSize: 16, padding: [14, 20] }}>
        Download the route
      </Button>
      <Button href={`${SITE}/bookings/8841/dates`} style={{ backgroundColor: PINE, color: SNOW, fontSize: 14, fontWeight: 600, padding: [12, 20], borderRadius: 2 }} hover={{ backgroundColor: "#2C4D44" }} mobile={{ alignSelf: "center" }}>
        Change my dates
      </Button>
    </Section>
  </Root>
));
