/**
 * Keel (a fictional bank) sends a sign-in code.
 *
 * A security message should look like nothing but itself: a narrow column, the system's own font
 * (it's already on the phone, so nothing loads before the code shows), the code large in DM Mono
 * so no digit can be mistaken for another, and who asked for it. One deep green, for the bank's
 * mark and the way out if it wasn't you.
 */
import { Column, Email, Heading, Link, Text, Row, Section, Span, Table, TableCell, TableRow } from "../../index";

const INK = "#0B0D0C";
const QUIET = "#5A5F5C";
const RULE = "#E2E4E2";
const PANEL = "#F3F4F2";
const GREEN = "#0F5C45";

const SYSTEM = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const MONO = "'DM Mono', SFMono-Regular, Menlo, Consolas, monospace";

const SITE = "https://keel.example";

/** A line of who asked for the code. */
const asked = (name: string, value: string, last = false) => (
  <TableRow>
    <TableCell style={{ width: 96, padding: [10, 12, 10, 0], color: QUIET, verticalAlign: "top", border: last ? undefined : { bottom: `1px solid ${RULE}` } }}>{name}</TableCell>
    <TableCell style={{ padding: [10, 0], verticalAlign: "top", border: last ? undefined : { bottom: `1px solid ${RULE}` } }}>{value}</TableCell>
  </TableRow>
);

export const keelSignInCode = (
  <Email
    width={480}
    lang="en-GB"
    title="Your Keel sign-in code"
    previewText="482 913 is your code to sign in to Keel. It works once, for ten minutes."
    fonts={[{ family: "DM Mono", src: "https://fonts.gstatic.com/s/dmmono/v16/aFTR7PB1QTsUX8KYvumzEYOtbYf-Vlg.woff2", format: "woff2", weight: 500 }]}
    style={{ backgroundColor: "#FFFFFF", color: INK, fontFamily: SYSTEM, fontSize: 16, lineHeight: 1.55 }}
  >
    <Section style={{ padding: [48, 24, 56], gap: 32 }} mobile={{ padding: [32, 24, 40], gap: 28 }}>
      <Text style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.6, lineHeight: 1 }}>
        <Link href={SITE} style={{ color: INK, textDecoration: "none" }}>
          keel<Span style={{ color: GREEN }}>.</Span>
        </Link>
      </Text>

      <Column style={{ gap: 10 }}>
        <Heading level={1} style={{ fontSize: 26, fontWeight: 600, lineHeight: 1.2, letterSpacing: -0.4 }}>
          Your sign-in code
        </Heading>
        <Text style={{ color: QUIET }}>Enter it in the Keel app to finish signing in. It works once, for the next ten minutes.</Text>
      </Column>

      <Column style={{ backgroundColor: PANEL, borderRadius: 10, padding: [26, 28], gap: 6 }} mobile={{ padding: [22, 20] }}>
        <Text style={{ fontFamily: MONO, fontSize: 46, fontWeight: 500, letterSpacing: 10, lineHeight: 1.1 }} mobile={{ fontSize: 40, letterSpacing: 8 }}>
          482 913
        </Text>
        <Text style={{ fontSize: 13, color: QUIET }}>Expires at 06:52 GMT</Text>
      </Column>

      <Column style={{ gap: 8 }}>
        <Text style={{ fontSize: 13, fontWeight: 600, color: QUIET }}>Who asked for it</Text>
        <Table style={{ fontSize: 15, lineHeight: 1.45, border: { top: `1px solid ${RULE}`, bottom: `1px solid ${RULE}` } }}>
          {asked("Device", "Safari on a Mac")}
          {asked("Near", "Lisbon, Portugal")}
          {asked("When", "06:42 GMT, Friday 6 November", true)}
        </Table>
      </Column>

      <Row stackOnMobile={false} style={{ gap: 14, padding: [0, 0, 0, 14], border: { left: `2px solid ${GREEN}` } }}>
        <Column style={{ gap: 6 }}>
          <Text style={{ fontWeight: 600 }}>Not you?</Text>
          <Text style={{ fontSize: 15, color: QUIET }}>
            Don’t share this code with anyone, even someone who says they’re from Keel. Freeze your cards in the app, or call us any time on{" "}
            <Link href="tel:+448081570412" style={{ color: GREEN, fontWeight: 600 }}>
              0808 157 0412
            </Link>
            .
          </Text>
        </Column>
      </Row>

      <Text style={{ fontSize: 13, lineHeight: 1.6, color: QUIET, padding: [24, 0, 0], border: { top: `1px solid ${RULE}` } }}>
        We’ll never ask for this code by phone, email or text. Keel Bank Ltd, 12 Lantern Yard, London E1 6QL.
      </Text>
    </Section>
  </Email>
);
