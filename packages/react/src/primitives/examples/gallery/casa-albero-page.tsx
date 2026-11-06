/**
 * Casa Albero (a fictional guesthouse in the hills above Lucca): its landing page.
 *
 * Written for the web: a wide hero with the hills drawn in an arched window (an SVG in a data
 * URI, so nothing to load, and one Image that fits any width), Cormorant Garamond for the voice
 * and Jost for the facts, and the colours of the place: terracotta, olive and the warm white of
 * lime plaster. The rooms are a list, the year is four columns, and booking is a terracotta band.
 * Every Row wraps, so it looks made for every width: there's only a phone's breakpoint to lean on.
 */
import { Button, Column, Heading, Image, Link, Menu, Page, Paragraph, Row, Section } from "../../index";

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
const cypress = (x: number, y: number, height: number, width = height / 5.5) =>
  `<path fill="#3B4824" d="M${x} ${y} C${x - width} ${y - height * 0.35} ${x - width * 0.55} ${y - height * 0.8} ${x} ${y - height} C${x + width * 0.55} ${y - height * 0.8} ${x + width} ${y - height * 0.35} ${x} ${y} Z"/>`;

/** A row of olive trees along a slope. */
const olives = (y: number, from: number, to: number, size: number, rise = 0) =>
  Array.from({ length: Math.floor((to - from) / (size * 3.2)) }, (_, i) => {
    const x = from + i * size * 3.2;
    return `<circle fill="#6F7B3F" cx="${x}" cy="${y - (rise * (x - from)) / (to - from)}" r="${size}"/>`;
  }).join("");

/** The hills through an arched window, 560 wide and 640 tall: an SVG drawn as an Image, so it fits any width. */
const HILLS = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="560" height="640" viewBox="0 0 560 640">
  <clipPath id="arch"><path d="M0 640 H560 V280 A280 280 0 0 0 0 280 Z"/></clipPath>
  <g clip-path="url(#arch)">
    <rect width="560" height="640" fill="#F3DDBF"/>
    <circle cx="384" cy="236" r="54" fill="#E4A23F"/>
    <path fill="#CAC6A0" d="M0 352 C90 318 170 330 250 312 C330 294 420 300 560 330 V640 H0 Z"/>
    <path fill="#A0A66C" d="M0 410 C70 380 150 372 230 388 C320 406 400 368 560 380 V640 H0 Z"/>
    ${olives(420, 300, 540, 5, 30)}
    ${olives(444, 280, 540, 5.5, 26)}
    <!-- The farmhouse and its tower, on the far ridge. -->
    <rect x="128" y="356" width="74" height="36" fill="#EBD3B2"/>
    <polygon points="122,358 165,340 208,358" fill="${TERRACOTTA}"/>
    <rect x="176" y="326" width="24" height="36" fill="#E2C59F"/>
    <polygon points="172,328 188,316 204,328" fill="${TERRACOTTA}"/>
    <rect x="140" y="370" width="8" height="11" fill="#6A4A33"/>
    <rect x="158" y="370" width="8" height="11" fill="#6A4A33"/>
    <rect x="184" y="338" width="7" height="9" fill="#6A4A33"/>
    ${cypress(116, 392, 74)}
    ${cypress(214, 392, 62)}
    ${cypress(228, 394, 46)}
    <path fill="#6E7B3D" d="M0 500 C120 470 230 486 330 470 C430 454 500 470 560 462 V640 H0 Z"/>
    <!-- The white road up from the gate. -->
    <path fill="#EAD9B9" d="M300 640 C292 590 250 560 214 530 C182 504 168 452 166 394 L171 394 C175 448 194 498 226 524 C266 556 314 590 322 640 Z"/>
    ${olives(540, 20, 200, 7, -10)}
    ${olives(566, 0, 190, 8, -12)}
    <path fill="#4B5630" d="M0 590 C140 570 300 600 560 572 V640 H0 Z"/>
    ${cypress(470, 600, 210)}
    ${cypress(512, 604, 168)}
    ${cypress(434, 606, 120)}
  </g>
</svg>`)}`;

/** A room: its name and what it's like, side by side or one over the other as they fit, beside what a night costs and who it sleeps. */
const room = (name: string, what: string, sleeps: string, from: string) => (
  <Row stackOnMobile={false} style={{ alignItems: "start", gap: 32, padding: [22, 0], border: { top: `1px solid ${RULE}` } }} mobile={{ gap: 12 }}>
    <Row style={{ flexWrap: "wrap", gap: 4 }}>
      <Column style={{ width: 372, padding: [0, 32, 0, 0] }} mobile={{ padding: 0 }}>
        <Paragraph style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 600, lineHeight: 1.1 }} mobile={{ fontSize: 25 }}>
          {name}
        </Paragraph>
      </Column>
      <Column style={{ minWidth: 184, padding: [8, 0, 0] }} mobile={{ padding: 0 }}>
        <Paragraph style={{ color: QUIET, lineHeight: 1.5 }} mobile={{ fontSize: 15 }}>
          {what}
        </Paragraph>
      </Column>
    </Row>
    <Column style={{ width: 84, gap: 2 }}>
      <Paragraph style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 500, lineHeight: 1.1, textAlign: "right" }} mobile={{ fontSize: 25 }}>
        {from}
      </Paragraph>
      <Paragraph style={{ fontSize: 13, color: QUIET, textAlign: "right" }}>sleeps {sleeps}</Paragraph>
    </Column>
  </Row>
);

/** A season of the year at the house. */
const season = (name: string, months: string, what: string) => (
  <Column style={{ minWidth: 200, gap: 8, padding: [18, 0, 0], border: { top: `1px solid ${INK}` } }}>
    <Paragraph style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 600, lineHeight: 1 }}>{name}</Paragraph>
    <Paragraph style={{ ...kicker, fontSize: 11, color: QUIET }}>{months}</Paragraph>
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
    {/* Navigation: the name and the links on a line, or on two where they don't fit */}
    <Section style={{ padding: [28, 48] }} mobile={{ padding: [20, 20] }}>
      <Row stackOnMobile={false} style={{ alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <Column style={{ minWidth: 130 }}>
          <Paragraph style={{ fontFamily: SERIF, fontSize: 30, fontStyle: "italic", fontWeight: 500, lineHeight: 1, textAlign: "left" }}>
            <Link href={SITE} style={{ color: INK, textDecoration: "none" }}>
              Casa Albero
            </Link>
          </Paragraph>
        </Column>
        <Row stackOnMobile={false} style={{ flex: "none", alignItems: "center" }}>
          <Menu
            hidden={{ mobile: true }}
            items={[
              { text: "House", href: `${SITE}/house` },
              { text: "Rooms", href: `${SITE}/rooms` },
              { text: "Year", href: `${SITE}/year` },
              { text: "Travel", href: `${SITE}/travel` },
            ]}
            style={{ flex: "none", color: INK, fontSize: 15, fontWeight: 400, padding: [6, 24, 6, 0] }}
          />
          <Button
            href={`${SITE}/book`}
            style={{ flex: "none", backgroundColor: "transparent", color: INK, border: `1px solid ${INK}`, fontSize: 14, fontWeight: 500, padding: [10, 18], borderRadius: 999 }}
            hover={{ backgroundColor: INK, color: PLASTER }}
          >
            Book a stay
          </Button>
        </Row>
      </Row>
    </Section>

    {/* The hero: the words, and the hills through the window */}
    <Section style={{ padding: [24, 48, 88] }} mobile={{ padding: [12, 20, 56] }}>
      <Row style={{ alignItems: "center", flexWrap: "wrap", gap: 72 }} mobile={{ gap: 36 }}>
        <Column style={{ width: 512, gap: 28 }}>
          <Paragraph style={kicker}>A guesthouse in the hills above Lucca</Paragraph>
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
            <Paragraph style={{ fontSize: 16, fontWeight: 400 }}>
              <Link href={`${SITE}/rooms`} style={{ color: INK }}>
                See the rooms
              </Link>
            </Paragraph>
          </Row>
        </Column>
        <Column style={{ flex: 1, minWidth: 280, maxWidth: 520 }}>
          <Image src={HILLS} alt="Hills above Lucca at evening: a farmhouse with a tower, olive groves, a white road and cypresses, framed by an arched window." style={{ width: "100%" }} />
        </Column>
      </Row>
    </Section>

    {/* The house */}
    <Section style={{ backgroundColor: STONE, padding: [96, 48], gap: 20 }} mobile={{ padding: [56, 20] }}>
      <Paragraph style={kicker}>The house</Paragraph>
      <Row style={{ flexWrap: "wrap", gap: 56 }} mobile={{ gap: 24 }}>
        <Column style={{ width: 520 }}>
          <Heading level={2} style={{ fontFamily: SERIF, fontSize: 54, fontWeight: 500, lineHeight: 1.02, letterSpacing: -1 }} mobile={{ fontSize: 40 }}>
            A farmhouse that has fed itself from its own hill since 1780.
          </Heading>
        </Column>
        <Column style={{ minWidth: 280, gap: 18, padding: [8, 0, 0] }} mobile={{ padding: 0 }}>
          <Paragraph>
            The house was built by a family of olive pressers, and the old press is still in the cellar, under the room that now carries its name. We moved here in 2014 with two children and
            no idea how to prune a tree.
          </Paragraph>
          <Paragraph>
            Twelve years on, breakfast is our own bread, our neighbours’ eggs and figs from the wall by the pool; supper, four nights a week, is at one long table for everyone staying.
          </Paragraph>
          <Paragraph style={{ fontFamily: SERIF, fontSize: 24, fontStyle: "italic" }}>Giulia and Tomás</Paragraph>
        </Column>
      </Row>
    </Section>

    {/* The rooms */}
    <Section style={{ padding: [96, 48, 40], gap: 28 }} mobile={{ padding: [56, 20, 24], gap: 20 }}>
      <Column style={{ gap: 12 }}>
        <Paragraph style={kicker}>The rooms</Paragraph>
        <Heading level={2} style={{ fontFamily: SERIF, fontSize: 54, fontWeight: 500, lineHeight: 1, letterSpacing: -1 }} mobile={{ fontSize: 40 }}>
          Six rooms, no two alike
        </Heading>
      </Column>
      <Column style={{ border: { bottom: `1px solid ${INK}` } }}>
        {room("La Torre", "Up the tower’s own stair, with windows on all four sides.", "2", "€320")}
        {room("Il Frantoio", "The old olive press room, vaulted, and cool all summer.", "2 or 3", "€260")}
        {room("La Limonaia", "The lemon house, opening onto the garden and the pool.", "2", "€240")}
        {room("Il Fienile", "The hayloft, under the beams, with a bath by the window.", "2", "€220")}
        {room("La Loggia", "Off the loggia, looking west over the valley to the sea.", "2", "€200")}
        {room("Le Stalle", "The old stables: two rooms, for a family.", "4", "€180")}
      </Column>
      <Paragraph style={{ fontSize: 14, color: QUIET }}>Prices are a night for the room, with breakfast. Supper at the long table is €45 a head, wine from the hill included.</Paragraph>
    </Section>

    {/* The year */}
    <Section style={{ padding: [64, 48, 104], gap: 32 }} mobile={{ padding: [40, 20, 64], gap: 24 }}>
      <Paragraph style={kicker}>The year at the house</Paragraph>
      <Row style={{ flexWrap: "wrap", gap: 32 }} mobile={{ gap: 28 }}>
        {/* Two pairs, so it's four across, two by two or one under another: never three and one. */}
        <Row style={{ minWidth: 280, flexWrap: "wrap", gap: 32 }} mobile={{ gap: 28 }}>
          {season("Spring", "March to May", "Wild asparagus in the hedges, the first swims, and the hills green for a few weeks.")}
          {season("Summer", "June to August", "Long days, the pool, and supper outside under the pergola until the swifts go to bed.")}
        </Row>
        <Row style={{ minWidth: 280, flexWrap: "wrap", gap: 32 }} mobile={{ gap: 28 }}>
          {season("Autumn", "September to November", "The harvest. Pick with us for a morning, and take home a litre of oil from your trees.")}
          {season("Winter", "December to February", "We close in January and February: the house rests, and so do we.")}
        </Row>
      </Row>
    </Section>

    {/* Booking */}
    <Section style={{ backgroundColor: TERRACOTTA, color: PLASTER, padding: [80, 48] }} mobile={{ padding: [56, 20] }}>
      <Row style={{ alignItems: "end", flexWrap: "wrap", gap: 48 }} mobile={{ gap: 28 }}>
        <Column style={{ minWidth: 280, gap: 16 }}>
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
      <Row style={{ alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <Column style={{ minWidth: 280 }}>
          <Paragraph style={{ fontSize: 14, color: QUIET }}>Casa Albero, Via di Vallebuia 14, 55100 Lucca, Italy</Paragraph>
        </Column>
        <Column style={{ flex: "none" }}>
          <Paragraph style={{ fontSize: 14, color: QUIET }}>
            <Link href="mailto:stay@casaalbero.example" style={{ color: INK }}>
              stay@casaalbero.example
            </Link>
            {"  ·  +39 0583 000 412"}
          </Paragraph>
        </Column>
      </Row>
    </Section>
  </Page>
);
