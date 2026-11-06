/**
 * Tarn (a fictional pottery in the Pennines) tells a customer their order has shipped.
 *
 * A receipt is calm: one warm white card on stone, Fraunces for the voice, Figtree for the facts,
 * and a celadon green taken from the studio's glaze. Each piece is shown as its glaze, a circle,
 * as a bowl looks from above, instead of a photograph. The parcel's progress is four thin bars.
 */
import { Button, Column, Email, Heading, LineBreak, Link, Paragraph, Row, Section, Span, Text } from "../../index";

const STONE = "#ECE7DF";
const CARD = "#FFFDF9";
const INK = "#2A2522";
const QUIET = "#6E655D";
const RULE = "#E6DFD5";
const CELADON = "#3E6B61";
const CELADON_DOWN = "#2F554D";

const SERIF = "Fraunces, Georgia, 'Times New Roman', serif";
const SANS = "Figtree, 'Helvetica Neue', Helvetica, Arial, sans-serif";

const SITE = "https://tarn.example";

const label = { fontSize: 12, fontWeight: 600, letterSpacing: 1.4, textTransform: "uppercase", color: QUIET } as const;

/** A step of the parcel's journey: a bar, done or not, over its name and date. */
const step = (name: string, date: string, done: boolean) => (
  <Column style={{ gap: 10 }}>
    <Column style={{ height: 4, backgroundColor: done ? CELADON : RULE }} />
    <Text style={{ fontSize: 13, lineHeight: 1.35, color: done ? INK : QUIET, fontWeight: done ? 600 : 400 }} mobile={{ fontSize: 12 }}>
      {name}
      <Span style={{ fontWeight: 400, color: QUIET }}>
        <LineBreak />
        {date}
      </Span>
    </Text>
  </Column>
);

/** A piece in the parcel: its glaze as a circle, what it is, and what it cost. */
const piece = (glaze: string, rim: string, name: string, detail: string, price: string) => (
  <Row stackOnMobile={false} style={{ alignItems: "center", gap: 20, padding: [16, 0], border: { top: `1px solid ${RULE}` } }} mobile={{ gap: 14 }}>
    <Column style={{ width: 48, height: 48, backgroundColor: glaze, borderRadius: 24, border: `1px solid ${rim}` }} />
    <Column style={{ gap: 2 }}>
      <Text style={{ fontFamily: SERIF, fontSize: 18, lineHeight: 1.3 }} mobile={{ fontSize: 16 }}>
        {name}
      </Text>
      <Text style={{ fontSize: 13, color: QUIET }}>{detail}</Text>
    </Column>
    <Column style={{ width: 68 }}>
      <Text style={{ fontSize: 15, textAlign: "right" }}>{price}</Text>
    </Column>
  </Row>
);

/** A line of the totals. */
// The name's line is shorter than the total's, so their baselines meet at the bottom of the row.
const sum = (name: string, amount: string, total = false) => (
  <Row stackOnMobile={false} style={{ alignItems: "end" }}>
    <Column>
      <Text style={{ fontSize: total ? 15 : 14, lineHeight: total ? "19px" : "22px", color: total ? INK : QUIET, fontWeight: total ? 600 : 400 }}>{name}</Text>
    </Column>
    <Column style={{ width: 120 }}>
      <Text style={{ textAlign: "right", fontFamily: total ? SERIF : SANS, fontSize: total ? 24 : 14, lineHeight: total ? "26px" : "22px" }}>{amount}</Text>
    </Column>
  </Row>
);

export const tarnShipped = (
  <Email
    width={600}
    lang="en-GB"
    title="Your Tarn order has shipped"
    previewText="Rowan packed your three pieces this morning. They should reach you on Monday."
    fonts={[
      { family: "Fraunces", src: "https://fonts.gstatic.com/s/fraunces/v38/6NU78FyLNQOQZAnv9bYEvDiIdE9Ea92uemAk_WBq8U_9v0c2Wa0KxC9TeP2Xz5c.woff2", format: "woff2", weight: "100 900" },
      { family: "Fraunces", src: "https://fonts.gstatic.com/s/fraunces/v38/6NU58FyLNQOQZAnv9ZwNjucMHVn85Ni7emAe9lKqZTnbB-gzTK0K1ChjeveQ7ZXk8g.woff2", format: "woff2", weight: "100 900", style: "italic" },
      { family: "Figtree", src: "https://fonts.gstatic.com/s/figtree/v9/_Xms-HUzqDCFdgfMm4S9DaRvzig.woff2", format: "woff2", weight: "300 900" },
    ]}
    style={{ backgroundColor: STONE, color: INK, fontFamily: SANS, fontSize: 16, lineHeight: 1.6 }}
  >
    <Section style={{ padding: [40, 0, 48], gap: 24 }} mobile={{ padding: [20, 12, 32], gap: 20 }}>
      <Row stackOnMobile={false} style={{ alignItems: "end", padding: [0, 8] }} mobile={{ padding: [0, 12] }}>
        <Column>
          <Text style={{ fontFamily: SERIF, fontSize: 30, fontStyle: "italic", lineHeight: 1, letterSpacing: -0.5 }}>
            <Link href={SITE} style={{ color: INK, textDecoration: "none" }}>
              Tarn
            </Link>
          </Text>
        </Column>
        <Column>
          <Text style={{ ...label, textAlign: "right" }}>Order TC-20418</Text>
        </Column>
      </Row>

      <Column style={{ backgroundColor: CARD, borderRadius: 4, padding: [48, 48, 40], gap: 36 }} mobile={{ padding: [32, 22, 28], gap: 28 }}>
        <Column style={{ gap: 16 }}>
          <Text style={label}>Shipped 5 November</Text>
          <Heading level={1} style={{ fontFamily: SERIF, fontSize: 42, fontWeight: 400, lineHeight: 1.08, letterSpacing: -1 }} mobile={{ fontSize: 32, letterSpacing: -0.6 }}>
            Packed in straw,
            <LineBreak />
            and <Span style={{ fontStyle: "italic" }}>on its way</Span>.
          </Heading>
          <Paragraph style={{ fontSize: 17, color: QUIET, maxWidth: 440 }} mobile={{ fontSize: 16 }}>
            Rowan wrapped your three pieces this morning. They’re with Parcelforce now, and should reach you on {"Monday 9\u00a0November"}.
          </Paragraph>
        </Column>

        <Row stackOnMobile={false} style={{ gap: 12 }} mobile={{ gap: 8 }}>
          {step("Ordered", "2 Nov", true)}
          {step("Packed", "5 Nov", true)}
          {step("On its way", "5 Nov", true)}
          {step("Delivered", "Mon 9 Nov", false)}
        </Row>

        <Button
          href={`${SITE}/orders/TC-20418/track`}
          style={{ backgroundColor: CELADON, color: "#FFFFFF", fontSize: 15, fontWeight: 600, padding: [15, 28], borderRadius: 2 }}
          hover={{ backgroundColor: CELADON_DOWN }}
          mobile={{ width: "100%" }}
        >
          Follow your parcel
        </Button>

        <Column>
          <Text style={{ ...label, padding: [0, 0, 12] }}>In the box</Text>
          {piece("#B9D2C6", "#9DB9AC", "Tea bowls, celadon", "A pair, 9 cm across", "£64.00")}
          {piece("#EFEBE2", "#D8D1C4", "Serving bowl, ash\u00a0white", "24 cm across", "£58.00")}
          {piece("#3B2A22", "#2A1D17", "Pouring jug, tenmoku", "Holds 600 ml", "£46.00")}
          <Column style={{ gap: 6, padding: [18, 0, 0], border: { top: `1px solid ${INK}` } }}>
            {sum("Subtotal", "£168.00")}
            {sum("Delivery, tracked", "£7.50")}
            {sum("Paid", "£175.50", true)}
          </Column>
        </Column>

        <Row style={{ gap: 24, padding: [24, 0, 0], border: { top: `1px solid ${RULE}` } }} mobile={{ gap: 20 }}>
          <Column style={{ gap: 6 }}>
            <Text style={label}>Delivering to</Text>
            <Text style={{ fontSize: 15, lineHeight: 1.55 }}>
              Ada Whitlock
              <LineBreak />
              14 Rookery Lane, Didsbury
              <LineBreak />
              Manchester M20 6RG
            </Text>
          </Column>
          <Column style={{ gap: 6 }}>
            <Text style={label}>Paid with</Text>
            <Text style={{ fontSize: 15, lineHeight: 1.55 }}>
              Visa ending 0417
              <LineBreak />
              on 2 November 2026
            </Text>
          </Column>
        </Row>

        <Paragraph style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 16, lineHeight: 1.55, color: QUIET }}>
          Every piece is stoneware, thrown by hand, so yours will differ a little from the ones in the photographs. The bowls are happy in the dishwasher; the jug would rather be washed by hand.
        </Paragraph>
      </Column>

      <Text style={{ fontSize: 13, lineHeight: 1.6, color: QUIET, padding: [0, 8] }} mobile={{ padding: [0, 12] }}>
        Tarn Ceramics, Unit 4, Mytholm Works, Hebden Bridge HX7 6DL. Questions about your order? Reply to this email, or{" "}
        <Link href={`${SITE}/returns`} style={{ color: INK }}>
          read about returns
        </Link>
        .
      </Text>
    </Section>
  </Email>
);
