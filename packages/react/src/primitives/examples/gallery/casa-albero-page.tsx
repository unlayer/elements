/**
 * Casa Albero (a fictional guesthouse in the hills above Lucca): its landing page.
 *
 * Written for the web: a wide hero with the hills drawn in an arched window (Svg shapes, so no
 * image to load), Cormorant Garamond for the voice and Jost for the facts, and the colours of
 * the place: terracotta, olive and the warm white of lime plaster. The rooms are a table, the
 * year is four columns, and booking is a terracotta band.
 */
import { cloneElement } from "react";
import { Button, Circle, Column, Grid, Heading, Link, Menu, Page, Paragraph, Path, Polygon, Rect, Row, Section, Svg, Text } from "../../index";

const PLASTER = "#FBF7F0";
const STONE = "#F2EADD";
const INK = "#2B2420";
const QUIET = "#6C625A";
const RULE = "#E4DACB";
const TERRACOTTA = "#A9472A";
const TERRACOTTA_DOWN = "#8C3A21";

const SERIF = "'Cormorant Garamond', Garamond, Georgia, serif";
const SANS = "Jost, Futura, 'Century Gothic', 'Helvetica Neue', Arial, sans-serif";

const SITE = "https://casaalbero.example";

const kicker = { fontSize: 13, fontWeight: 500, letterSpacing: 2, textTransform: "uppercase", color: TERRACOTTA } as const;

/** A cypress: a tall flame of dark green, its foot at x, y. */
const cypress = (x: number, y: number, height: number, width = height / 5.5) => (
  <Path d={`M${x} ${y} C${x - width} ${y - height * 0.35} ${x - width * 0.55} ${y - height * 0.8} ${x} ${y - height} C${x + width * 0.55} ${y - height * 0.8} ${x + width} ${y - height * 0.35} ${x} ${y} Z`} style={{ fill: "#3B4824" }} />
);

/** A row of olive trees along a slope. */
const olives = (y: number, from: number, to: number, size: number, rise = 0) =>
  Array.from({ length: Math.floor((to - from) / (size * 3.2)) }, (_, i) => {
    const x = from + i * size * 3.2;
    return <Circle key={`${y}-${i}`} cx={x} cy={y - (rise * (x - from)) / (to - from)} r={size} style={{ fill: "#6F7B3F" }} />;
  });

/** The hills, drawn in an arched window 560 wide and 640 tall: the shapes, for a desktop's Svg and a phone's. */
const hills = [
  <Rect width={560} height={640} style={{ fill: "#F3DDBF" }} />,
  <Circle cx={384} cy={236} r={54} style={{ fill: "#E4A23F" }} />,
  <Path d="M0 352 C90 318 170 330 250 312 C330 294 420 300 560 330 V640 H0 Z" style={{ fill: "#CAC6A0" }} />,
  <Path d="M0 410 C70 380 150 372 230 388 C320 406 400 368 560 380 V640 H0 Z" style={{ fill: "#A0A66C" }} />,
  ...olives(420, 300, 540, 5, 30),
  ...olives(444, 280, 540, 5.5, 26),
  // The farmhouse and its tower, on the far ridge.
  <Rect x={128} y={356} width={74} height={36} style={{ fill: "#EBD3B2" }} />,
  <Polygon points="122,358 165,340 208,358" style={{ fill: TERRACOTTA }} />,
  <Rect x={176} y={326} width={24} height={36} style={{ fill: "#E2C59F" }} />,
  <Polygon points="172,328 188,316 204,328" style={{ fill: TERRACOTTA }} />,
  <Rect x={140} y={370} width={8} height={11} style={{ fill: "#6A4A33" }} />,
  <Rect x={158} y={370} width={8} height={11} style={{ fill: "#6A4A33" }} />,
  <Rect x={184} y={338} width={7} height={9} style={{ fill: "#6A4A33" }} />,
  cypress(116, 392, 74),
  cypress(214, 392, 62),
  cypress(228, 394, 46),
  <Path d="M0 500 C120 470 230 486 330 470 C430 454 500 470 560 462 V640 H0 Z" style={{ fill: "#6E7B3D" }} />,
  // The white road up from the gate.
  <Path d="M300 640 C292 590 250 560 214 530 C182 504 168 452 166 394 L171 394 C175 448 194 498 226 524 C266 556 314 590 322 640 Z" style={{ fill: "#EAD9B9" }} />,
  ...olives(540, 20, 200, 7, -10),
  ...olives(566, 0, 190, 8, -12),
  <Path d="M0 590 C140 570 300 600 560 572 V640 H0 Z" style={{ fill: "#4B5630" }} />,
  cypress(470, 600, 210),
  cypress(512, 604, 168),
  cypress(434, 606, 120),
  // The window: the plaster around the arch, drawn over the hills (the arch turns the other way, so it's a hole).
  <Path d="M-1 -1 H561 V641 H-1 Z M0 640 H560 V280 A280 280 0 0 0 0 280 Z" style={{ fill: PLASTER }} />,
];

const window = (width: number, height: number) => (
  <Svg width={width} height={height} viewBox="0 0 560 640" title="Hills above Lucca at evening: a farmhouse with a tower, olive groves, a white road and cypresses, framed by an arched window.">
    {hills.map((shape, index) => cloneElement(shape, { key: index }))}
  </Svg>
);

/** A room: its name and what it's like, beside what a night costs and who it sleeps (on phones too). */
const room = (name: string, what: string, sleeps: string, from: string) => (
  <Row stackOnMobile={false} style={{ alignItems: "start", gap: 32, padding: [22, 0], border: { top: `1px solid ${RULE}` } }} mobile={{ gap: 16 }}>
    <Column style={{ width: 300 }} hidden={{ mobile: true }}>
      <Text style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 600, lineHeight: 1.1 }}>{name}</Text>
    </Column>
    <Column style={{ gap: 4, padding: [8, 0, 0] }} mobile={{ padding: 0 }}>
      <Text hidden={{ desktop: true }} style={{ fontFamily: SERIF, fontSize: 25, fontWeight: 600, lineHeight: 1.1 }}>
        {name}
      </Text>
      <Text style={{ color: QUIET, lineHeight: 1.5 }} mobile={{ fontSize: 15 }}>
        {what}
      </Text>
    </Column>
    <Column style={{ width: 120, gap: 2 }} mobile={{ width: 84 }}>
      <Text style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 500, lineHeight: 1.1, textAlign: "right" }} mobile={{ fontSize: 25 }}>
        {from}
      </Text>
      <Text style={{ fontSize: 13, color: QUIET, textAlign: "right" }}>sleeps {sleeps}</Text>
    </Column>
  </Row>
);

/** A season of the year at the house. */
const season = (name: string, months: string, what: string) => (
  <Column style={{ gap: 8, padding: [18, 0, 0], border: { top: `1px solid ${INK}` } }}>
    <Text style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 600, lineHeight: 1 }}>{name}</Text>
    <Text style={{ ...kicker, fontSize: 11, color: QUIET }}>{months}</Text>
    <Paragraph style={{ fontSize: 16, lineHeight: 1.55 }}>{what}</Paragraph>
  </Column>
);

export const casaAlberoPage = (
  <Page
    width={1200}
    lang="en"
    title="Casa Albero, a guesthouse above Lucca"
    description="Six rooms in a stone farmhouse above Lucca, a long table under the pergola, and forty hectares of olives harvested by hand."
    fonts={[
      { family: "Cormorant Garamond", src: "https://fonts.gstatic.com/s/cormorantgaramond/v21/co3bmX5slCNuHLi8bLeY9MK7whWMhyjYqXtKky2F7g.woff2", format: "woff2", weight: "300 700" },
      { family: "Cormorant Garamond", src: "https://fonts.gstatic.com/s/cormorantgaramond/v21/co3ZmX5slCNuHLi8bLeY9MK7whWMhyjYrEtImSqn7B6D.woff2", format: "woff2", weight: "300 700", style: "italic" },
      { family: "Jost", src: "https://fonts.gstatic.com/s/jost/v20/92zatBhPNqw73oTd4jQmfxI.woff2", format: "woff2", weight: "100 900" },
    ]}
    style={{ backgroundColor: PLASTER, color: INK, fontFamily: SANS, fontSize: 17, fontWeight: 300, lineHeight: 1.6 }}
  >
    {/* Navigation */}
    <Section style={{ padding: [28, 48] }} mobile={{ padding: [20, 20] }}>
      <Row stackOnMobile={false} style={{ alignItems: "center", gap: 24 }}>
        <Column style={{ width: 220 }}>
          <Text style={{ fontFamily: SERIF, fontSize: 30, fontStyle: "italic", fontWeight: 500, lineHeight: 1 }}>
            <Link href={SITE} style={{ color: INK, textDecoration: "none" }}>
              Casa Albero
            </Link>
          </Text>
        </Column>
        <Menu
          hidden={{ mobile: true }}
          items={[
            { text: "The house", href: `${SITE}/house` },
            { text: "Rooms", href: `${SITE}/rooms` },
            { text: "The year", href: `${SITE}/year` },
            { text: "Getting here", href: `${SITE}/travel` },
          ]}
          style={{ color: INK, fontSize: 15, fontWeight: 400, padding: [6, 14], justifyContent: "end" }}
        />
        <Button
          href={`${SITE}/book`}
          style={{ flex: "none", backgroundColor: "transparent", color: INK, border: `1px solid ${INK}`, fontSize: 14, fontWeight: 500, padding: [10, 18], borderRadius: 999 }}
          hover={{ backgroundColor: INK, color: PLASTER }}
        >
          Book a stay
        </Button>
      </Row>
    </Section>

    {/* The hero: the words, and the hills through the window */}
    <Section style={{ padding: [24, 48, 88] }} mobile={{ padding: [12, 20, 56] }}>
      <Row style={{ alignItems: "center", gap: 72 }} mobile={{ gap: 36 }}>
        <Column style={{ gap: 28 }}>
          <Text style={kicker}>A guesthouse in the hills above Lucca</Text>
          <Heading level={1} style={{ fontFamily: SERIF, fontSize: 92, fontWeight: 500, lineHeight: 0.92, letterSpacing: -2 }} mobile={{ fontSize: 58, letterSpacing: -1 }}>
            Stay where the olives grow.
          </Heading>
          <Paragraph style={{ fontSize: 20, lineHeight: 1.55, maxWidth: 470 }} mobile={{ fontSize: 18 }}>
            Six rooms in a stone farmhouse, a long table under the pergola, and forty hectares of olives that we pick by hand each November. Twenty minutes from Lucca, and a long way from
            anywhere.
          </Paragraph>
          <Row stackOnMobile={false} style={{ alignItems: "center", gap: 28 }}>
            <Button
              href={`${SITE}/book`}
              style={{ flex: "none", backgroundColor: TERRACOTTA, color: "#FFFFFF", fontSize: 16, fontWeight: 500, padding: [16, 30], borderRadius: 999 }}
              hover={{ backgroundColor: TERRACOTTA_DOWN }}
            >
              Book a stay
            </Button>
            <Text style={{ fontSize: 16, fontWeight: 400 }}>
              <Link href={`${SITE}/rooms`} style={{ color: INK }}>
                See the rooms
              </Link>
            </Text>
          </Row>
        </Column>
        <Column style={{ width: 520 }} hidden={{ mobile: true }}>
          {window(520, 594)}
        </Column>
        <Column hidden={{ desktop: true }}>{window(350, 400)}</Column>
      </Row>
    </Section>

    {/* The house */}
    <Section style={{ backgroundColor: STONE, padding: [96, 48] }} mobile={{ padding: [56, 20] }}>
      <Row style={{ gap: 72 }} mobile={{ gap: 24 }}>
        <Column style={{ gap: 20 }}>
          <Text style={kicker}>The house</Text>
          <Heading level={2} style={{ fontFamily: SERIF, fontSize: 54, fontWeight: 500, lineHeight: 1.02, letterSpacing: -1 }} mobile={{ fontSize: 40 }}>
            A farmhouse that has fed itself from its own hill since 1780.
          </Heading>
        </Column>
        <Column style={{ gap: 18, padding: [40, 0, 0] }} mobile={{ padding: 0 }}>
          <Paragraph>
            The house was built by a family of olive pressers, and the old press is still in the cellar, under the room that now carries its name. We moved here in 2014 with two children and
            no idea how to prune a tree.
          </Paragraph>
          <Paragraph>
            Twelve years on, breakfast is our own bread, our neighbours’ eggs and figs from the wall by the pool; supper, four nights a week, is at one long table for everyone staying.
          </Paragraph>
          <Text style={{ fontFamily: SERIF, fontSize: 24, fontStyle: "italic" }}>Giulia and Tomás</Text>
        </Column>
      </Row>
    </Section>

    {/* The rooms */}
    <Section style={{ padding: [96, 48, 40], gap: 28 }} mobile={{ padding: [56, 20, 24], gap: 20 }}>
      <Row stackOnMobile={false} style={{ alignItems: "end" }}>
        <Column style={{ gap: 12 }}>
          <Text style={kicker}>The rooms</Text>
          <Heading level={2} style={{ fontFamily: SERIF, fontSize: 54, fontWeight: 500, lineHeight: 1, letterSpacing: -1 }} mobile={{ fontSize: 40 }}>
            Six rooms, no two alike
          </Heading>
        </Column>
      </Row>
      <Column style={{ border: { bottom: `1px solid ${INK}` } }}>
        {room("La Torre", "Up the tower’s own stair, with windows on all four sides.", "2", "€320")}
        {room("Il Frantoio", "The old olive press room, vaulted, and cool all summer.", "2 or 3", "€260")}
        {room("La Limonaia", "The lemon house, opening onto the garden and the pool.", "2", "€240")}
        {room("Il Fienile", "The hayloft, under the beams, with a bath by the window.", "2", "€220")}
        {room("La Loggia", "Off the loggia, looking west over the valley to the sea.", "2", "€200")}
        {room("Le Stalle", "The old stables: two rooms, for a family.", "4", "€180")}
      </Column>
      <Text style={{ fontSize: 14, color: QUIET }}>Prices are a night for the room, with breakfast. Supper at the long table is €45 a head, wine from the hill included.</Text>
    </Section>

    {/* The year */}
    <Section style={{ padding: [64, 48, 104], gap: 32 }} mobile={{ padding: [40, 20, 64], gap: 24 }}>
      <Text style={kicker}>The year at the house</Text>
      <Grid columns={4} style={{ gap: 32, rowGap: 32 }} mobile={{ gap: 28 }}>
        {season("Spring", "March to May", "Wild asparagus in the hedges, the first swims, and the hills green for a few weeks.")}
        {season("Summer", "June to August", "Long days, the pool, and supper outside under the pergola until the swifts go to bed.")}
        {season("Autumn", "September to November", "The harvest. Pick with us for a morning, and take home a litre of oil from your trees.")}
        {season("Winter", "December to February", "We close in January and February: the house rests, and so do we.")}
      </Grid>
    </Section>

    {/* Booking */}
    <Section style={{ backgroundColor: TERRACOTTA, color: PLASTER, padding: [80, 48] }} mobile={{ padding: [56, 20] }}>
      <Row style={{ alignItems: "end", gap: 48 }} mobile={{ gap: 28 }}>
        <Column style={{ gap: 16 }}>
          <Heading level={2} style={{ fontFamily: SERIF, fontSize: 60, fontWeight: 500, lineHeight: 1, letterSpacing: -1 }} mobile={{ fontSize: 42 }}>
            The harvest weeks are filling up.
          </Heading>
          <Paragraph style={{ fontSize: 18, maxWidth: 560 }}>From €180 a night, with breakfast. Free to cancel until thirty days before you come.</Paragraph>
        </Column>
        <Column style={{ width: 240 }} mobile={{ width: "100%" }}>
          <Button
            href={`${SITE}/book`}
            style={{ width: "100%", backgroundColor: PLASTER, color: TERRACOTTA, fontSize: 17, fontWeight: 500, padding: [18, 24], borderRadius: 999 }}
            hover={{ backgroundColor: "#FFFFFF" }}
          >
            Book a stay
          </Button>
        </Column>
      </Row>
    </Section>

    {/* Footer */}
    <Section style={{ padding: [40, 48, 48] }} mobile={{ padding: [32, 20, 40] }}>
      <Row style={{ alignItems: "center", gap: 24 }} mobile={{ gap: 8 }}>
        <Column>
          <Text style={{ fontSize: 14, color: QUIET }}>Casa Albero, Via di Vallebuia 14, 55100 Lucca, Italy</Text>
        </Column>
        <Column>
          <Text style={{ fontSize: 14, color: QUIET, textAlign: "right" }} mobile={{ textAlign: "left" }}>
            <Link href="mailto:stay@casaalbero.example" style={{ color: INK }}>
              stay@casaalbero.example
            </Link>
            {"  ·  +39 0583 000 412"}
          </Text>
        </Column>
      </Row>
    </Section>
  </Page>
);
