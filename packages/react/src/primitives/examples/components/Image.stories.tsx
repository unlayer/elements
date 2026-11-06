import type { Meta } from "@storybook/react-vite";
import { args, argTypes, asEmailAndPage, type Args } from "../../../stories/SideBySide";
import { Column, Heading, Image, Link, Paragraph, Row, Section, Text } from "../../index";
import { caption, drawing, MONO_FONT } from "./kit-c";

const meta: Meta<Args> = {
  title: "Components/Image",
  args,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "An image: `src` has the file and its size, `alt` what it shows, `style` the size it's shown at and its shape. Each story is drawn as an Email and as a Page, from one template; \"Show code\" has it.",
      },
    },
  },
};
export default meta;

const story = asEmailAndPage;

/**
 * Greyfold (a fictional woollen mill in the Borders, weaving blankets since 1871).
 *
 * Its pictures are its cloth, drawn in code: a check, a herringbone and a stripe in wool's own
 * colors. Source Serif for the voice, Instrument Sans for the facts, oatmeal and charcoal, and the
 * madder red of the mill's labels where the eye should land.
 */
const OAT = "#EDE6D8";
const CARD = "#FAF7F0";
const INK = "#26231E";
const QUIET = "#6E675B";
const RULE = "#D9D1C1";
const MADDER = "#9E3A2B";

const SERIF = "'Source Serif 4', Georgia, 'Times New Roman', serif";
const SANS = "'Instrument Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif";

const SITE = "https://greyfold.example";

const root = {
  width: 600,
  lang: "en-GB",
  fonts: [
    { family: "Source Serif 4", src: "https://fonts.gstatic.com/s/sourceserif4/v15/vEFI2_tTDB4M7-auWDN0ahZJW1gb8te1Xb7G.woff2", format: "woff2", weight: "200 900" },
    { family: "Instrument Sans", src: "https://fonts.gstatic.com/s/instrumentsans/v4/pxiTypc9vsFDm051Uf6KVwgkfoSxQ0GsQv8ToedPibnr0SZe1ZuWi3g.woff2", format: "woff2", weight: "400 700" },
    MONO_FONT,
  ],
  style: { backgroundColor: OAT, color: INK, fontFamily: SANS, fontSize: 16, lineHeight: 1.55 },
};

const label = { fontSize: 12, fontWeight: 600, letterSpacing: 1.4, textTransform: "uppercase", color: QUIET } as const;
const title = { fontFamily: SERIF, fontWeight: 500, lineHeight: 1.12, letterSpacing: -0.3 } as const;
const note = caption(QUIET);

/** A check: bands of color across and down, the same on both, which is what a loom does. */
const check = (base: string, bands: Array<[at: number, width: number, color: string]>) => {
  const down = bands.map(([at, width, color]) => `<rect x="${at}" width="${width}" height="120" fill="${color}" opacity=".62"/>`).join("");
  const across = bands.map(([at, width, color]) => `<rect y="${at}" width="120" height="${width}" fill="${color}" opacity=".62"/>`).join("");
  return `<pattern id="w" width="120" height="120" patternUnits="userSpaceOnUse"><rect width="120" height="120" fill="${base}"/>${down}${across}</pattern>`;
};

/** A herringbone: thin slants one way, then the other half a step down, column by column. */
const herringbone = (base: string, thread: string) => {
  const left = Array.from({ length: 8 }, (_, i) => `M0 ${i * 8 - 32}L24 ${i * 8 - 8}`).join("");
  const right = Array.from({ length: 8 }, (_, i) => `M48 ${i * 8 - 28}L24 ${i * 8 - 4}`).join("");
  return `<pattern id="w" width="48" height="24" patternUnits="userSpaceOnUse"><rect width="48" height="24" fill="${base}"/><path d="${left}${right}" stroke="${thread}" stroke-width="2.4" fill="none"/></pattern>`;
};

/** A stripe: bands of color down the cloth, repeating. */
const stripe = (base: string, bands: Array<[at: number, width: number, color: string]>) =>
  `<pattern id="w" width="160" height="10" patternUnits="userSpaceOnUse"><rect width="160" height="10" fill="${base}"/>${bands.map(([at, width, color]) => `<rect x="${at}" width="${width}" height="10" fill="${color}"/>`).join("")}</pattern>`;

const CHEVIOT = check("#46533C", [[0, 26, "#23291F"], [60, 12, "#C2933B"], [90, 8, "#D9CFBB"]]);
const HERDWICK = herringbone("#55585A", "#7F8381");
const SOLWAY = stripe("#DCD2BE", [[0, 44, "#3F4B57"], [62, 5, "#9E3A2B"], [84, 16, "#3F4B57"]]);

/** Cloth as a picture: the weave across the whole of it. */
const cloth = (width: number, height: number, weave: string) => drawing(width, height, `<defs>${weave}</defs><rect width="${width}" height="${height}" fill="url(#w)"/>`);

/** A blanket laid out on the table and folded once, with its fringe and the mill's red label. */
const blanket = (weave: string) =>
  drawing(
    480,
    480,
    `<defs>${weave}</defs><rect width="480" height="480" fill="#E0D7C6"/><rect x="78" y="64" width="324" height="336" fill="url(#w)"/><rect x="78" y="196" width="324" height="10" fill="#000" opacity=".22"/><path d="${Array.from({ length: 27 }, (_, i) => `M${84 + i * 12} 400v20`).join("")}" stroke="#6E675B" stroke-width="3"/><rect x="300" y="300" width="74" height="30" fill="#9E3A2B"/><rect x="310" y="313" width="54" height="4" fill="#F3E9DC"/>`
  );

/** The mill's mark: a Cheviot ewe, in a disc of moss. */
const EWE = drawing(
  240,
  240,
  `<rect width="240" height="240" fill="#46533C"/><g fill="#EFE8DA"><circle cx="84" cy="116" r="30"/><circle cx="118" cy="96" r="32"/><circle cx="152" cy="112" r="30"/><circle cx="104" cy="136" r="30"/><circle cx="140" cy="136" r="28"/></g><path d="M96 158v30M142 158v30" stroke="#23291F" stroke-width="9" stroke-linecap="round"/><ellipse cx="178" cy="108" rx="20" ry="25" fill="#23291F"/><path d="M164 92l-14-10M194 92l12-12" stroke="#23291F" stroke-width="8" stroke-linecap="round"/>`
);

/** `src` has the file's size; `style.width` sets the size shown. In a `Link`, the image is the link. */
export const Sizes = story((Root) => (
  <Root {...root}>
    <Section style={{ padding: [36, 24, 44], gap: 20 }} mobile={{ padding: [24, 20, 32], gap: 18 }}>
      <Row stackOnMobile={false} style={{ alignItems: "end" }}>
        <Column>
          <Text style={{ ...title, fontSize: 28, lineHeight: 1 }}>Greyfold</Text>
        </Column>
        <Column>
          <Text style={{ ...label, textAlign: "right" }}>Autumn cloth</Text>
        </Column>
      </Row>
      <Column style={{ gap: 8 }}>
        <Image src={cloth(552, 288, CHEVIOT)} alt="The Cheviot check: moss green crossed with dark bands and a fine gold line" />
        <Text style={note}>No width: its own 552px, never wider than its place</Text>
      </Column>
      <Row style={{ gap: 20 }}>
        <Column style={{ gap: 8 }}>
          <Image src={cloth(266, 180, HERDWICK)} alt="The Herdwick herringbone, in charcoal and grey" style={{ width: "100%", borderRadius: 4 }} />
          <Text style={note}>width: "100%", a share of the row</Text>
        </Column>
        <Column style={{ gap: 8 }}>
          <Link href={`${SITE}/cloth/solway`}>
            <Image src={cloth(400, 270, SOLWAY)} alt="The Solway stripe, slate on oatmeal with a thread of madder red: see the cloth" style={{ width: 200 }} />
          </Link>
          <Text style={note}>width: 200, in a Link: the image is the link</Text>
        </Column>
      </Row>
    </Section>
  </Root>
));

/** A shape, what it is, and how it's written. */
const shaped = (image: JSX.Element, name: string, written: string) => (
  <Column style={{ gap: 12, alignItems: "center", textAlign: "center" }}>
    {image}
    <Column style={{ gap: 2 }}>
      <Text style={{ ...title, fontSize: 19 }}>{name}</Text>
      <Text style={note}>{written}</Text>
    </Column>
  </Column>
);

/** `borderRadius` and `border` shape it: round corners, a circle for a face or a logo, an outline, the top corners only. */
export const Shapes = story((Root) => (
  <Root {...root}>
    <Section style={{ padding: [44, 24, 48], gap: 28 }} mobile={{ padding: [32, 28, 36], gap: 24 }}>
      <Heading level={2} style={{ ...title, fontSize: 32, textAlign: "center" }} mobile={{ fontSize: 28 }}>
        One mill, three cuts
      </Heading>
      <Row style={{ gap: 20 }} mobile={{ gap: 28 }}>
        {shaped(<Image src={cloth(340, 292, CHEVIOT)} alt="A square of the Cheviot check, with round corners" style={{ width: "100%", borderRadius: 12 }} mobile={{ width: 240 }} />, "The swatch", "borderRadius: 12")}
        {shaped(<Image src={EWE} alt="Greyfold's mark, a white Cheviot ewe on moss green, in a circle" style={{ width: 140, borderRadius: 70, border: `3px solid ${CARD}` }} />, "The mark", "borderRadius: 70")}
        {shaped(<Image src={cloth(340, 292, SOLWAY)} alt="A tag of the Solway stripe, with only its top corners round and a thin outline" style={{ width: "100%", borderRadius: [16, 16, 0, 0], border: `1px solid ${QUIET}` }} mobile={{ width: 240 }} />, "The tag", "[16, 16, 0, 0]")}
      </Row>
    </Section>
  </Root>
));

/** A length of cloth where its `Column` puts it, its name and weight in line with it. */
const bolt = (alignItems: "start" | "center" | "end", textAlign: "left" | "center" | "right", weave: string, alt: string, name: string, weight: string) => (
  <Column style={{ alignItems, gap: 10, textAlign }}>
    <Image src={cloth(240, 96, weave)} alt={alt} />
    <Column style={{ gap: 2 }}>
      <Text style={{ ...title, fontSize: 21 }}>{name}, {weight}</Text>
      <Text style={note}>alignItems: "{alignItems}"</Text>
    </Column>
  </Column>
);

/** The stack around an image says where it sits: `alignItems` on a `Column` puts it on the left, in the center or on the right. */
export const Alignment = story((Root) => (
  <Root {...root}>
    <Section style={{ padding: [40, 24, 44], gap: 24 }} mobile={{ padding: [28, 20, 32], gap: 20 }}>
      <Heading level={2} style={{ ...title, fontSize: 32 }} mobile={{ fontSize: 28 }}>
        Three weights, for three kinds of cold
      </Heading>
      {bolt("start", "left", SOLWAY, "The Solway stripe, on the left", "Solway", "280 g, for a spare room")}
      {bolt("center", "center", CHEVIOT, "The Cheviot check, in the center", "Cheviot", "420 g, for most houses")}
      {bolt("end", "right", HERDWICK, "The Herdwick herringbone, on the right", "Herdwick", "610 g, for a bothy")}
    </Section>
  </Root>
));

const card = { gap: 14, padding: 16, backgroundColor: CARD, border: `1px solid ${RULE}`, borderRadius: 6 };

/** An image in a card, as for a product or an article: the `Column` has the box, and `width: "100%"` fills it. */
export const InACard = story((Root) => (
  <Root {...root}>
    <Section style={{ padding: [36, 24, 44] }} mobile={{ padding: [20, 20, 28] }}>
      <Row style={{ gap: 16 }}>
        <Column style={card}>
          <Image src={blanket(CHEVIOT)} alt="The Cheviot blanket, folded once, moss green with gold lines and a red label" style={{ width: "100%", borderRadius: 3 }} />
          <Column style={{ gap: 4 }}>
            <Heading level={3} style={{ ...title, fontSize: 21 }}>The Cheviot blanket</Heading>
            <Paragraph style={{ fontSize: 15, color: QUIET }}>Double, in 420 g lambswool, woven in the Borders. £148</Paragraph>
          </Column>
        </Column>
        <Column style={card}>
          <Link href={`${SITE}/journal/fleece-to-fringe`}>
            <Image src={blanket(HERDWICK)} alt="The Herdwick blanket, folded once: read how it's made" style={{ width: "100%", borderRadius: 3 }} />
          </Link>
          <Column style={{ gap: 4 }}>
            <Heading level={3} style={{ ...title, fontSize: 21 }}>From fleece to fringe</Heading>
            <Paragraph style={{ fontSize: 15, color: QUIET }}>Eleven steps, and the picture is the link to them.</Paragraph>
          </Column>
        </Column>
      </Row>
    </Section>
  </Root>
));

/** `mobile` has its size and its place on phones: choose "phone" under width to see it. */
export const OnPhones = story((Root) => (
  <Root {...root}>
    <Section style={{ padding: [36, 24, 44], gap: 22 }} mobile={{ padding: [24, 20, 32], gap: 18 }}>
      <Column style={{ gap: 6 }}>
        <Text style={label}>The Cheviot check</Text>
        <Heading level={2} style={{ ...title, fontSize: 32 }} mobile={{ fontSize: 28 }}>
          The same cloth, on any window
        </Heading>
      </Column>
      <Column style={{ gap: 8 }}>
        <Image src={cloth(552, 230, CHEVIOT)} alt="The Cheviot check, 240px wide, the whole width on phones" style={{ width: 240 }} mobile={{ width: "100%" }} />
        <Text style={note}>width: 240, the whole width on phones</Text>
      </Column>
      <Column style={{ alignItems: "start", gap: 8 }}>
        <Image src={EWE} alt="Greyfold's mark, on the left, in the center on phones" style={{ width: 96, borderRadius: 48 }} mobile={{ alignSelf: "center" }} />
        <Text style={note} mobile={{ textAlign: "center" }}>
          On the left, in the center on phones
        </Text>
      </Column>
      <Column hidden={{ mobile: true }} style={{ gap: 8 }}>
        <Image src={cloth(552, 110, SOLWAY)} alt="The Solway stripe, a wide strip for a wider window" style={{ width: "100%" }} />
        <Text style={note}>Only on a wider window</Text>
      </Column>
    </Section>
  </Root>
));
