/**
 * main's "Linear · Product Digest" example, and the same design written with the new components (main's
 * layout read as StripeReceipt.tsx says).
 *
 * One difference is main's: its menu's links and separators are further apart than the new Menu puts them, as
 * MenuLinks.tsx says; `nextAsMain` draws main's menu (mainMenu.tsx), and its content may sit up to 3px from main's (`allowance`).
 */
import { ProductDigest } from "../../examples/ProductDigest.stories";
import { Column, Divider, Email, Heading, Link, Menu, Paragraph, Row, Section } from "../index";
import { mainMenu } from "./mainMenu";

const INK = "#18181B";
const BODY = "#52525B";
const MUTED = "#A1A1AA";
const LINE = "#E4E4E7";
const WHITE = "#FFFFFF";

function feature(title: string, text: string) {
  return (
    <Column style={{ padding: 10, gap: 20 }}>
      <Heading level={2} style={{ fontSize: 20, fontWeight: 600, color: INK, lineHeight: "140%" }}>
        {title}
      </Heading>
      <Paragraph style={{ fontSize: 15, color: BODY, lineHeight: "160%" }}>{text}</Paragraph>
    </Column>
  );
}

export const main = <ProductDigest />;

const ITEMS = [
  { text: "Docs", href: "https://linear.app/docs" },
  { text: "Blog", href: "https://linear.app/blog" },
  { text: "Careers", href: "https://linear.app/careers" },
];

/** The design; `asMain` spaces the menu's links as main does. */
const design = (asMain: boolean) => (
  <Email width={600} style={{ backgroundColor: "#FAFAFA", fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
    <Section style={{ backgroundColor: WHITE, padding: [42, 10, 10, 10] }}>
      <Heading level={3} style={{ fontSize: 18, fontWeight: 700, color: INK, lineHeight: "140%" }}>
        ◆ Linear
      </Heading>
    </Section>

    <Section style={{ backgroundColor: WHITE, padding: [30, 10, 10, 10], gap: 20 }}>
      <Heading level={1} style={{ fontSize: 32, fontWeight: 700, color: INK, lineHeight: "120%" }}>
        Product updates, June 2026
      </Heading>
      <Paragraph style={{ fontSize: 16, color: BODY, lineHeight: "160%" }}>Three improvements shipped this month to make you faster.</Paragraph>
    </Section>

    <Section style={{ backgroundColor: WHITE, padding: [30, 10, 10, 10], gap: 20 }}>
      <Heading level={2} style={{ fontSize: 20, fontWeight: 600, color: INK, lineHeight: "130%" }}>
        Faster command palette
      </Heading>
      <Paragraph style={{ fontSize: 15, color: BODY, lineHeight: "160%" }}>
        The command palette now opens in under 50ms. Read the full <Link href="https://linear.app/changelog">changelog entry</Link> for the details.
      </Paragraph>
    </Section>

    <Section style={{ backgroundColor: WHITE, padding: [12, 0, 8, 0] }}>
      <Row>
        {feature("Sub-issues", "Break work down without leaving the issue view.")}
        {feature("Saved views", "Pin the filters you use every day to the sidebar.")}
      </Row>
    </Section>

    <Section style={{ backgroundColor: WHITE, padding: [26, 10, 10, 10] }}>
      <Divider style={{ borderTop: `1px solid ${LINE}` }} />
    </Section>

    <Section style={{ backgroundColor: WHITE, padding: [26, 10, 18, 10] }}>
      {asMain ? (
        mainMenu({ items: ITEMS, separator: "•" })
      ) : (
        <Menu items={ITEMS} separator="•" />
      )}
    </Section>
    <Section style={{ backgroundColor: WHITE, padding: [10, 10, 46, 10] }}>
      <Paragraph style={{ fontSize: 12, color: MUTED, textAlign: "center", lineHeight: "140%" }}>You&apos;re receiving this because you use Linear.</Paragraph>
    </Section>
  </Email>
);

export const next = design(false);
export const nextAsMain = design(true);
export const quirks = "its menu's links and separators are inline-blocks with a space between each, each separator in a link's padding too, so each is further from the next than the new Menu puts them.";

/** main's menu spaces its links and lines by its font, Elements exactly (MenuLinks.tsx): they may sit up to 3px from main's. */
export const allowance = { x: 3, y: 3 };
