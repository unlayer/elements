import type { Meta, StoryObj } from "@storybook/react";
import {
  Email,
  Row,
  Column,
  ColumnLayouts,
  Heading,
  Paragraph,
  Button,
  Image,
} from "../index";

// Warby-Parker-style "Your order has shipped" email.
// Clean, modern, friendly — navy/blue palette, generous whitespace,
// hairline dividers via the Column bottom border (no <Table> shorthand).
const INK = "#2A2A2A"; // primary text
const MUTED = "#767676"; // secondary text
const NAVY = "#00263A"; // navy accent / wordmark
const BLUE = "#3B5BDB"; // friendly CTA blue
const LINE = "#EBEBEB"; // hairline divider
const BG = "#F6F6F4"; // email background
const CARD = "#FFFFFF"; // content rows

const sans = {
  label: "Sans Serif",
  value:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
};

/**
 * One label/value (or product/price) line, separated by a hairline rule drawn
 * on the Column's bottom border. Called inline as `{lineRow(...)}` — Email only
 * recognizes <Row> children, so this must NOT be used as a <lineRow/> element.
 */
function lineRow(label: string, value: string, last = false) {
  const cell = {
    padding: "14px 0",
    borderBottomWidth: last ? "0px" : "1px",
    borderBottomStyle: "solid",
    borderBottomColor: LINE,
  } as const;
  return (
    <Row layout={ColumnLayouts.TwoEqual} backgroundColor={CARD} padding="0 40px">
      <Column {...cell}>
        <Paragraph html={label} fontSize="14px" color={MUTED} lineHeight="140%" />
      </Column>
      <Column {...cell}>
        <Paragraph
          html={`<b>${value}</b>`}
          fontSize="14px"
          color={INK}
          textAlign="right"
          lineHeight="140%"
        />
      </Column>
    </Row>
  );
}

/**
 * A product line-item: name + variant on the left, bold price on the right,
 * with a small muted sub-label under the name. Hairline via the Column border.
 */
function productRow(name: string, variant: string, price: string, last = false) {
  const cell = {
    padding: "16px 0",
    borderBottomWidth: last ? "0px" : "1px",
    borderBottomStyle: "solid",
    borderBottomColor: LINE,
  } as const;
  return (
    <Row layout={ColumnLayouts.TwoEqual} backgroundColor={CARD} padding="0 40px">
      <Column {...cell}>
        <Paragraph
          html={`<b>${name}</b>`}
          fontSize="15px"
          color={INK}
          lineHeight="150%"
        />
        <Paragraph html={variant} fontSize="13px" color={MUTED} lineHeight="150%" />
      </Column>
      <Column {...cell}>
        <Paragraph
          html={`<b>${price}</b>`}
          fontSize="15px"
          color={INK}
          textAlign="right"
          lineHeight="150%"
        />
      </Column>
    </Row>
  );
}

export function WarbyOrderShipped() {
  return (
    <Email
      backgroundColor={BG}
      contentWidth="600px"
      fontFamily={sans}
      textColor={INK}
      previewText="Good news, Alex — your order is on its way. 📦"
    >
      {/* Brand wordmark */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor={CARD} padding="36px 40px 28px 40px">
        <Column>
          <Heading
            headingType="h2"
            fontSize="20px"
            fontWeight={700}
            color={NAVY}
            letterSpacing="0.18em"
            textAlign="center"
            lineHeight="100%"
          >
            WARBY PARKER
          </Heading>
        </Column>
      </Row>

      {/* Hero lifestyle photo */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor={CARD} padding="0">
        <Column>
          <Image
            src="https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&w=1200&q=80"
            altText="A pair of eyeglasses resting on a clean surface"
            width="100%"
          />
        </Column>
      </Row>

      {/* Eyebrow + headline */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor={CARD} padding="40px 40px 0 40px">
        <Column>
          <Paragraph
            html="SHIPPED"
            fontSize="12px"
            fontWeight={700}
            color={BLUE}
            letterSpacing="0.06em"
            textAlign="center"
            lineHeight="100%"
          />
        </Column>
      </Row>

      <Row layout={ColumnLayouts.OneColumn} backgroundColor={CARD} padding="12px 40px 0 40px">
        <Column>
          <Heading
            headingType="h1"
            fontSize="30px"
            fontWeight={700}
            color={NAVY}
            lineHeight="124%"
            textAlign="center"
          >
            Your order is on its way 📦
          </Heading>
        </Column>
      </Row>

      <Row layout={ColumnLayouts.OneColumn} backgroundColor={CARD} padding="14px 56px 4px 56px">
        <Column>
          <Paragraph
            html="Hi Alex — your new frames have left our lab and are headed your way. We'll email you again the moment they land on your doorstep."
            fontSize="15px"
            color={MUTED}
            lineHeight="164%"
            textAlign="center"
          />
        </Column>
      </Row>

      {/* Tracking summary — eyebrow */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor={CARD} padding="32px 40px 4px 40px">
        <Column>
          <Paragraph
            html="TRACKING DETAILS"
            fontSize="12px"
            fontWeight={700}
            color={MUTED}
            letterSpacing="0.06em"
            lineHeight="100%"
          />
        </Column>
      </Row>

      {/* Tracking detail rows (label / value, hairline divider via Column border) */}
      {lineRow("Carrier", "USPS Priority")}
      {lineRow("Tracking number", "9400 1234 5678 9012 3456")}
      {lineRow("Estimated delivery", "Mon, Jul 8", true)}

      {/* Track package CTA */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor={CARD} padding="28px 40px 4px 40px">
        <Column>
          <Button
            href="https://tools.usps.com/go/TrackConfirmAction?tLabels=94001234567890123456"
            backgroundColor={NAVY}
            color="#FFFFFF"
            fontSize="15px"
            fontWeight={700}
            padding="15px 28px"
            borderRadius="8px"
            width="100%"
            textAlign="center"
          >
            Track package
          </Button>
        </Column>
      </Row>

      {/* In this order — eyebrow */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor={CARD} padding="36px 40px 4px 40px">
        <Column>
          <Paragraph
            html="IN THIS ORDER"
            fontSize="12px"
            fontWeight={700}
            color={MUTED}
            letterSpacing="0.06em"
            lineHeight="100%"
          />
        </Column>
      </Row>

      {/* Product line-items (name + variant / bold price, hairline divider) */}
      {productRow("Percey", "Whiskey Tortoise", "$145")}
      {productRow("Haskell", "Crystal", "$95", true)}

      {/* Order total */}
      {lineRow("Total", "$240", true)}

      {/* Help / footer */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor={CARD} padding="28px 40px 40px 40px">
        <Column>
          <Paragraph
            html="Questions about your order? Our team is here to help — just reply to this email or visit the <a href='https://www.warbyparker.com/help' style='color:#3B5BDB;'>Help Center</a>."
            fontSize="14px"
            color={MUTED}
            lineHeight="164%"
            textAlign="center"
          />
        </Column>
      </Row>

      <Row layout={ColumnLayouts.OneColumn} backgroundColor={BG} padding="28px 40px 8px 40px">
        <Column>
          <Paragraph
            html="Warby Parker · 233 Spring Street, New York, NY 10013"
            fontSize="12px"
            color={MUTED}
            textAlign="center"
            lineHeight="160%"
          />
        </Column>
      </Row>

      <Row layout={ColumnLayouts.OneColumn} backgroundColor={BG} padding="0 40px 36px 40px">
        <Column>
          <Paragraph
            html="<a href='#' style='color:#767676;'>Unsubscribe</a> &nbsp;·&nbsp; <a href='#' style='color:#767676;'>Privacy Policy</a>"
            fontSize="12px"
            color={MUTED}
            textAlign="center"
            lineHeight="160%"
          />
        </Column>
      </Row>
    </Email>
  );
}

const meta: Meta<typeof WarbyOrderShipped> = {
  title: "Agent Examples/Warby Parker · Order Shipped",
  component: WarbyOrderShipped,
};

export default meta;

type Story = StoryObj<typeof WarbyOrderShipped>;

export const Default: Story = {};
