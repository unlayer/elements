/**
 * The Saltworks (a fictional gallery on the Essex coast) invites its list to a private view.
 *
 * A poster first: a band of ultramarine across the window, the show's name and its date set
 * huge in Syne, then the artist's drawing (made in code) on salt white below it, as a print
 * would hang. Instrument Sans for the facts. Ultramarine is the only colour; everything else is
 * salt, ink and a grey.
 */
import type { ReactNode } from "react";
import { Button, Column, Email, Heading, Image, LineBreak, Link, Paragraph, Row, Section, Span, Text } from "../../index";

const BLUE = "#1F2BB5";
const BLUE_DOWN = "#17208C";
const SALT = "#F2EFE6";
const INK = "#16161D";
const QUIET = "#5E5D66";
const PALE = "#C9CCF2";
const RULE = "#D9D6CC";

const DISPLAY = "Syne, 'Arial Black', 'Helvetica Neue', Arial, sans-serif";
const SANS = "'Instrument Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif";

const SITE = "https://thesaltworks.example";

const label = { fontSize: 12, fontWeight: 600, letterSpacing: 1.6, textTransform: "uppercase" } as const;

/** A line of the visit's details: what, beside its answer. */
const detail = (name: string, value: ReactNode) => (
  <Row style={{ gap: 24, padding: [14, 0], border: { top: `1px solid ${RULE}` } }} mobile={{ gap: 4 }}>
    <Column style={{ width: 132 }}>
      <Text style={{ ...label, color: QUIET, lineHeight: "24px" }}>{name}</Text>
    </Column>
    <Column>
      <Text style={{ fontSize: 16, lineHeight: "24px" }}>{value}</Text>
    </Column>
  </Row>
);

/** An event in the show's run. */
const event = (date: string, time: string, what: string) => (
  <Row stackOnMobile={false} style={{ gap: 20, padding: [16, 0], border: { top: `1px solid ${RULE}` } }} mobile={{ gap: 14 }}>
    <Column style={{ width: 84 }}>
      <Text style={{ fontFamily: DISPLAY, fontSize: 20, fontWeight: 700, lineHeight: 1.1, color: BLUE }}>
        {date}
        <LineBreak />
        <Span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 400, color: QUIET }}>{time}</Span>
      </Text>
    </Column>
    <Column>
      <Text style={{ fontSize: 16, lineHeight: 1.5 }}>{what}</Text>
    </Column>
  </Row>
);

export const saltworksInvitation = (
  <Email
    width={600}
    lang="en-GB"
    title="Low Water: a private view"
    previewText="Ines Kerr's drawings of the Stour estuary at low tide. Private view on Thursday 20 November, 6 to 9pm."
    fonts={[
      { family: "Syne", src: "https://fonts.gstatic.com/s/syne/v24/8vIH7w4qzmVxm2BL9G78HEY.woff2", format: "woff2", weight: "400 800" },
      { family: "Instrument Sans", src: "https://fonts.gstatic.com/s/instrumentsans/v4/pxiTypc9vsFDm051Uf6KVwgkfoSxQ0GsQv8ToedPibnr0SZe1ZuWi3g.woff2", format: "woff2", weight: "400 700" },
    ]}
    style={{ backgroundColor: SALT, color: INK, fontFamily: SANS, fontSize: 16, lineHeight: 1.6 }}
  >
    {/* The poster */}
    <Section style={{ backgroundColor: BLUE, color: "#FFFFFF", padding: [36, 48, 44], gap: 40 }} mobile={{ padding: [24, 24, 32], gap: 32 }}>
      <Row stackOnMobile={false} style={{ alignItems: "center" }}>
        <Column>
          <Text style={{ ...label, color: "#FFFFFF" }}>
            <Link href={SITE} style={{ color: "#FFFFFF", textDecoration: "none" }}>
              The Saltworks
            </Link>
          </Text>
        </Column>
        <Column>
          <Text style={{ ...label, color: PALE, textAlign: "right" }}>Harwich, Essex</Text>
        </Column>
      </Row>
      <Column style={{ gap: 14 }}>
        <Text style={{ ...label, color: PALE }}>You’re invited to a private view</Text>
        <Heading level={1} style={{ fontFamily: DISPLAY, fontSize: 96, fontWeight: 800, lineHeight: 0.9, letterSpacing: -4 }} mobile={{ fontSize: 64, letterSpacing: -2.5 }}>
          Low
          <LineBreak />
          Water
        </Heading>
        <Text style={{ fontSize: 22, lineHeight: 1.3 }} mobile={{ fontSize: 19 }}>
          New drawings by Ines Kerr
        </Text>
      </Column>
      <Row style={{ alignItems: "end", gap: 20, padding: [20, 0, 0], border: { top: `1px solid ${PALE}` } }} mobile={{ gap: 16 }}>
        <Column style={{ width: 280 }}>
          <Text style={{ fontFamily: DISPLAY, fontSize: 116, fontWeight: 800, lineHeight: 0.8, letterSpacing: -5 }} mobile={{ fontSize: 96, letterSpacing: -4 }}>
            20
          </Text>
        </Column>
        <Column style={{ gap: 2 }}>
          <Text style={{ fontFamily: DISPLAY, fontSize: 26, fontWeight: 700, lineHeight: 1.05 }} mobile={{ fontSize: 24 }}>
            Thursday
            <LineBreak />
            November
          </Text>
          <Text style={{ fontSize: 16, color: PALE }}>
            6 to 9pm, music from 7
          </Text>
        </Column>
      </Row>
    </Section>

    {/* The drawing, hung like a print, with its label */}
    <Section style={{ padding: [48, 48, 0], gap: 12 }} mobile={{ padding: [32, 24, 0], gap: 10 }}>
      <Image
        src={{ src: "gallery/saltworks/low-water.png", width: 1200, height: 680 }}
        alt="A drawing of a mudflat at low tide: dozens of fine blue lines running to the horizon, closer together as they go, with a low sun on the horizon."
        style={{ width: "100%" }}
      />
      <Text style={{ fontSize: 13, lineHeight: 1.5, color: QUIET }}>
        Ines Kerr, <Span style={{ fontStyle: "italic" }}>Low Water (Stour, 6.14am)</Span>, 2026. Ink on paper, 76 × 43 cm.
      </Text>
    </Section>

    {/* About the show, and the visit */}
    <Section style={{ padding: [40, 48, 0], gap: 28 }} mobile={{ padding: [32, 24, 0], gap: 24 }}>
      <Paragraph style={{ fontSize: 19, lineHeight: 1.55 }} mobile={{ fontSize: 17 }}>
        For a year, Ines walked out onto the Stour estuary at every low tide she could reach before work, and drew what the water left behind. These are thirty-one of those drawings, shown
        together for the first time.
      </Paragraph>
      <Column style={{ border: { bottom: `1px solid ${RULE}` } }}>
        {detail("When", "Thursday 20 November, 6 to 9pm")}
        {detail(
          "Where",
          <>
            The Saltworks, 2 Quay Lane
            <LineBreak />
            Harwich CO12 3HH
          </>
        )}
        {detail("Getting here", "Six minutes’ walk from Harwich Town station. The last train to London is at 22:04.")}
        {detail("Access", "Step-free throughout, with an accessible toilet on the ground floor.")}
      </Column>
      <Row style={{ alignItems: "center", gap: 24 }} mobile={{ gap: 16 }}>
        <Button
          href={`${SITE}/low-water/rsvp`}
          style={{ width: 200, backgroundColor: BLUE, color: "#FFFFFF", fontSize: 15, fontWeight: 600, padding: [16, 0], borderRadius: 0 }}
          hover={{ backgroundColor: BLUE_DOWN }}
          mobile={{ width: "100%" }}
        >
          Reply to say you’ll come
        </Button>
        <Text style={{ fontSize: 15 }}>
          <Link href={`${SITE}/low-water/calendar.ics`} style={{ color: INK }}>
            Add it to your calendar
          </Link>
        </Text>
      </Row>
    </Section>

    {/* The run */}
    <Section style={{ padding: [48, 48, 0], gap: 6 }} mobile={{ padding: [40, 24, 0] }}>
      <Text style={{ ...label, color: QUIET, padding: [0, 0, 8] }}>During the show, until 18 January</Text>
      <Column style={{ border: { bottom: `1px solid ${RULE}` } }}>
        {event("22 Nov", "2pm", "Ines in conversation with Dafydd Rees, who has kept the Harwich tide gauge for thirty years.")}
        {event("7 Dec", "10am", "A drawing walk along the estuary at low tide. Bring boots; we’ll bring the paper.")}
        {event("15 Jan", "6pm", "A late opening, and the last chance to see the drawings together.")}
      </Column>
    </Section>

    <Section style={{ padding: [48, 48, 56] }} mobile={{ padding: [40, 24, 44] }}>
      <Text style={{ fontSize: 13, lineHeight: 1.6, color: QUIET }}>
        The Saltworks is open Wednesday to Sunday, 11am to 5pm, and free. You’re getting this because you’re on our list for openings.{" "}
        <Link href={`${SITE}/unsubscribe`} style={{ color: QUIET }}>
          Leave the list
        </Link>
        .
      </Text>
    </Section>
  </Email>
);
