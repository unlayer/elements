/**
 * Oyen (a fictional maker of audio instruments) announces its FR-2 field recorder.
 *
 * Warm drafting paper, near-black ink and one signal orange, used only where the eye should land:
 * the drawing's callouts, the main button, and one closing band. Geist for words, Geist Mono for
 * labels and numbers. A rail of labels at the left and a content column make the grid, and the
 * technical drawing's numbered callouts are the list under it.
 */
import type { ReactNode } from "react";
import { Button, Column, Email, Heading, Image, Link, Paragraph, Row, Section, Table, TableCell, TableRow, Text } from "../../index";

const PAPER = "#F3F1EC";
const INK = "#1A1917";
const QUIET = "#5F5B53";
const RULE = "#D3CEC4";
const SIGNAL = "#FF5B1F";
const SIGNAL_DOWN = "#E8490F";

const SANS = "Geist, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'Geist Mono', SFMono-Regular, Menlo, Consolas, monospace";

const SITE = "https://oyen.example";

const DRAWING =
  "A technical drawing of FR-2 from the front and the side: two capsules at 90 degrees on top, a display, a large dial, and play, stop and record buttons. It is 132 by 68 by 24 millimetres.";

/** Small mono capitals: section labels, metadata, the figure's caption. */
const label = { fontFamily: MONO, fontSize: 12, lineHeight: 1.5, letterSpacing: 1.2, textTransform: "uppercase", color: QUIET } as const;

/** The rail: a part's label at the left, under a rule, and its content beside it (above it on phones). */
const RAIL = 136;
const railed = (name: string, content: ReactNode) => (
  <Row style={{ gap: 24, padding: [14, 0, 0], border: { top: `1px solid ${INK}` } }} mobile={{ gap: 20 }}>
    <Column style={{ width: RAIL }}>
      <Text style={{ ...label, color: INK }}>{name}</Text>
    </Column>
    <Column>{content}</Column>
  </Row>
);

/** One of the drawing's callouts: its number in an orange disc, what it is, and why it matters. */
const callout = (n: number, title: string, body: string) => (
  <Row stackOnMobile={false} style={{ gap: 16, padding: n === 1 ? [0, 0, 20] : [20, 0], border: n === 1 ? undefined : { top: `1px solid ${RULE}` } }}>
    <Column style={{ width: 24 }}>
      <Text style={{ width: 24, backgroundColor: SIGNAL, borderRadius: 12, fontFamily: MONO, fontSize: 12, fontWeight: 500, lineHeight: "24px", textAlign: "center", color: INK }}>{String(n)}</Text>
    </Column>
    <Column style={{ gap: 4 }}>
      <Heading level={3} style={{ fontSize: 17, fontWeight: 600, lineHeight: "24px", letterSpacing: -0.2 }}>
        {title}
      </Heading>
      <Paragraph style={{ fontSize: 15, lineHeight: 1.55, color: QUIET }}>{body}</Paragraph>
    </Column>
  </Row>
);

/** A line of the spec sheet: a mono label, and the value in the text face. */
const spec = (name: string, value: string, first = false) => (
  <TableRow>
    <TableCell style={{ width: 100, verticalAlign: "top", padding: first ? [0, 12, 10, 0] : [10, 12, 10, 0], fontFamily: MONO, fontSize: 12, lineHeight: "21px", letterSpacing: 0.6, textTransform: "uppercase", color: QUIET }}>
      {name}
    </TableCell>
    <TableCell style={{ verticalAlign: "top", padding: first ? [0, 0, 10] : [10, 0] }}>{value}</TableCell>
  </TableRow>
);

export const oyenLaunch = (
  <Email
    width={600}
    lang="en"
    title="FR-2 is here"
    previewText="A pocket recorder with capsules that turn, one dial, and nothing to set. €349, ships 2 December."
    fonts={[
      { family: "Geist", src: "https://fonts.gstatic.com/s/geist/v5/gyByhwUxId8gMEwcGFWNOITd.woff2", format: "woff2", weight: "100 900" },
      { family: "Geist Mono", src: "https://fonts.gstatic.com/s/geistmono/v6/or3nQ6H-1_WfwkMZI_qYFrcdmhHkjko.woff2", format: "woff2", weight: "100 900" },
    ]}
    style={{ backgroundColor: PAPER, color: INK, fontFamily: SANS, fontSize: 16, lineHeight: 1.6 }}
  >
    <Section style={{ padding: [36, 48, 72], gap: 64 }} mobile={{ padding: [28, 24, 56], gap: 48 }}>
      {/* Masthead */}
      <Row stackOnMobile={false} style={{ alignItems: "end", padding: [0, 0, 14], border: { bottom: `1px solid ${INK}` } }}>
        <Column style={{ width: 120 }}>
          <Text style={{ fontSize: 19, fontWeight: 700, letterSpacing: 5, lineHeight: "20px" }}>
            <Link href={SITE} style={{ color: INK, textDecoration: "none" }}>
              OYEN
            </Link>
          </Text>
        </Column>
        <Column>
          <Text style={{ ...label, lineHeight: "18px", textAlign: "right" }}>Dispatch 07 · Nov 2026</Text>
        </Column>
      </Row>

      {/* The announcement */}
      <Column style={{ gap: 28 }} mobile={{ gap: 24 }}>
        <Column style={{ gap: 20 }}>
          <Text style={label}>New instrument — FR-2</Text>
          <Heading level={1} style={{ fontSize: 62, lineHeight: 1, letterSpacing: -2.6, fontWeight: 500 }} mobile={{ fontSize: 44, letterSpacing: -1.8 }}>
            Record the room you’re in.
          </Heading>
        </Column>
        <Paragraph style={{ fontSize: 19, lineHeight: 1.5, maxWidth: 400 }} mobile={{ fontSize: 17 }}>
          FR-2 is a pocket recorder with two capsules that turn, one dial, and nothing to set before you press record.
        </Paragraph>
        <Row style={{ alignItems: "center", gap: 20 }} mobile={{ gap: 14 }}>
          <Button
            href={`${SITE}/fr-2`}
            style={{ width: 184, backgroundColor: SIGNAL, color: INK, fontSize: 15, fontWeight: 600, padding: [16, 0], borderRadius: 2 }}
            hover={{ backgroundColor: SIGNAL_DOWN }}
            mobile={{ width: "100%" }}
          >
            Pre-order FR-2
          </Button>
          <Text style={label}>€349 · Ships 2 December</Text>
        </Row>
      </Column>

      {/* The drawing: the whole plate on a desktop, the two views larger on a phone */}
      <Column style={{ gap: 12 }} mobile={{ gap: 10 }}>
        <Image src={{ src: "gallery/oyen/fr2-drawing.png", width: 1020, height: 900 }} alt={DRAWING} style={{ width: "100%" }} />
        <Text style={label}>Fig. 1 — FR-2, front and side</Text>
      </Column>

      {railed(
        "What’s on it",
        <Column>
          {callout(1, "Capsules that turn", "X/Y for the scene in front of you, A/B for the room around you. A quarter turn sets them, and they stay put.")}
          {callout(2, "A hold switch", "Slide it and the buttons sleep while the recording carries on: thirty hours on a charge, on a card of up to 1 TB.")}
          {callout(3, "One dial", "Headphone level, menus and markers. It clicks once per step, so you can work it by feel in the dark.")}
          {callout(4, "Record, always", "It records in 32-bit float, so there’s no gain to set and nothing to clip. A whisper and a door slam both come home whole.")}
        </Column>
      )}

      {railed(
        "Specifications",
        <Table style={{ fontSize: 14, lineHeight: "21px", rowBorder: `1px solid ${RULE}` }}>
          {spec("Recording", "32-bit float, up to 192 kHz", true)}
          {spec("Capsules", "Two cardioids, X/Y or A/B")}
          {spec("Input", "3.5 mm, line or plug-in power")}
          {spec("Battery", "30 hours, USB-C charging")}
          {spec("Storage", "microSD, up to 1 TB")}
          {spec("Size", "132 × 68 × 24 mm, 186 g")}
        </Table>
      )}

      {railed(
        "From the field",
        <Column style={{ gap: 16 }}>
          <Text style={{ fontSize: 24, lineHeight: 1.32, letterSpacing: -0.6 }} mobile={{ fontSize: 22 }}>
            “I left it on a fence post through nine hours of rain. It kept recording, and so did the birds.”
          </Text>
          <Text style={label}>Maren Achterberg, sound recordist</Text>
        </Column>
      )}
    </Section>

    {/* Closing band */}
    <Section style={{ backgroundColor: SIGNAL, padding: [44, 48, 48] }} mobile={{ padding: [36, 24] }}>
      <Row style={{ alignItems: "end", gap: 24 }} mobile={{ gap: 28 }}>
        <Column style={{ gap: 14 }}>
          <Text style={{ ...label, color: INK }}>First run · 2,000 instruments</Text>
          <Heading level={2} style={{ fontSize: 96, lineHeight: 0.9, letterSpacing: -4.5, fontWeight: 500 }} mobile={{ fontSize: 80, letterSpacing: -3.6 }}>
            €349
          </Heading>
          <Text style={{ fontSize: 15, lineHeight: 1.5 }}>Ships 2 December. Charged when it ships.</Text>
        </Column>
        <Column style={{ width: 168 }} mobile={{ width: "100%" }}>
          <Button
            href={`${SITE}/fr-2`}
            style={{ width: "100%", backgroundColor: INK, color: PAPER, fontSize: 15, fontWeight: 600, padding: [16, 20], borderRadius: 2 }}
            hover={{ backgroundColor: "#3A3833" }}
          >
            Pre-order FR-2
          </Button>
        </Column>
      </Row>
    </Section>

    {/* Footer */}
    <Section style={{ padding: [32, 48, 56] }} mobile={{ padding: [28, 24, 44] }}>
      <Row style={{ gap: 24 }} mobile={{ gap: 12 }}>
        <Column style={{ width: RAIL }}>
          <Text style={{ fontSize: 13, fontWeight: 700, letterSpacing: 4 }}>OYEN</Text>
        </Column>
        <Column style={{ gap: 8 }}>
          <Text style={{ fontSize: 13, lineHeight: 1.6, color: QUIET }}>
            Oyen Instruments AS, Møllergata 9, 0179 Oslo. You’re getting dispatches because you asked for them when you bought an Oyen instrument.
          </Text>
          <Text style={{ fontSize: 13, lineHeight: 1.6, color: QUIET }}>
            <Link href={`${SITE}/dispatch/07`} style={{ color: INK }}>
              View online
            </Link>
            {"  ·  "}
            <Link href={`${SITE}/unsubscribe`} style={{ color: INK }}>
              Unsubscribe
            </Link>
          </Text>
        </Column>
      </Row>
    </Section>
  </Email>
);
