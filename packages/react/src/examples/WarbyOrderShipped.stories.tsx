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
  Divider,
  Table,
} from "../index";

// Warby-Parker-style "Your order has shipped" email.
// Clean, modern, lots of whitespace. Natural CSS-idiom prop forms.
const INK = "#0F1417";
const MUTED = "#6B7280";
const FAINT = "#9AA0A6";
const LINE = "#E8EAED";
const SOFT = "#F4F5F3";
const ACCENT = "#1A1A1A";

const serif = {
  label: "Serif",
  value: "Georgia, 'Times New Roman', Times, serif",
};
const sans = {
  label: "Sans Serif",
  value:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
};

export function WarbyOrderShipped() {
  return (
    <Email
      backgroundColor="#FBFBF9"
      contentWidth="600px"
      fontFamily={sans}
      textColor={INK}
      previewText="Good news — your order is on its way."
    >
      {/* Brand wordmark */}
      <Row
        layout={ColumnLayouts.OneColumn}
        backgroundColor="#FFFFFF"
        padding="40px 48px 24px 48px"
      >
        <Column>
          <Heading
            headingType="h2"
            fontSize="22px"
            fontWeight={700}
            color={INK}
            fontFamily={serif}
            textAlign="center"
          >
            WARBY PARKER
          </Heading>
        </Column>
      </Row>

      {/* Thin rule under wordmark */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="0 48px">
        <Column>
          <Divider borderTopWidth="1px" borderTopColor={LINE} borderTopStyle="solid" />
        </Column>
      </Row>

      {/* Hero image */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="0">
        <Column>
          <Image
            src="https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&w=1200&q=80"
            altText="A pair of glasses on a clean surface"
            width="600px"
          />
        </Column>
      </Row>

      {/* Confirmation heading */}
      <Row
        layout={ColumnLayouts.OneColumn}
        backgroundColor="#FFFFFF"
        padding="40px 48px 8px 48px"
      >
        <Column>
          <Heading
            headingType="h1"
            fontSize="32px"
            fontWeight={400}
            color={INK}
            fontFamily={serif}
            lineHeight="120%"
            textAlign="center"
          >
            Your order has shipped
          </Heading>
        </Column>
      </Row>

      <Row
        layout={ColumnLayouts.OneColumn}
        backgroundColor="#FFFFFF"
        padding="0 64px 8px 64px"
      >
        <Column>
          <Paragraph
            html="It's on its way, Alex. We'll let you know the moment it arrives. In the meantime, you can follow along below."
            fontSize="15px"
            color={MUTED}
            lineHeight="160%"
            textAlign="center"
          />
        </Column>
      </Row>

      {/* Tracking card: number + carrier */}
      <Row
        layout={ColumnLayouts.OneColumn}
        backgroundColor="#FFFFFF"
        padding="20px 48px 0 48px"
      >
        <Column backgroundColor={SOFT} padding="24px" borderRadius="8px">
          <Paragraph
            html="TRACKING NUMBER"
            fontSize="11px"
            color={FAINT}
            textAlign="center"
          />
          <Heading
            headingType="h3"
            fontSize="20px"
            fontWeight={600}
            color={INK}
            textAlign="center"
          >
            1Z 999 AA1 01 2345 6784
          </Heading>
          <Paragraph
            html="Carrier: <b>UPS Ground</b> &middot; Est. delivery Jun 27"
            fontSize="13px"
            color={MUTED}
            textAlign="center"
          />
        </Column>
      </Row>

      {/* Track package button */}
      <Row
        layout={ColumnLayouts.OneColumn}
        backgroundColor="#FFFFFF"
        padding="24px 48px 8px 48px"
      >
        <Column>
          <Button
            href="https://www.ups.com/track?tracknum=1Z999AA1012345678"
            backgroundColor={ACCENT}
            color="#FFFFFF"
            fontSize="15px"
            fontWeight={600}
            padding="16px 32px"
            borderRadius="4px"
            width="100%"
            textAlign="center"
          >
            Track package
          </Button>
        </Column>
      </Row>

      {/* Order summary heading */}
      <Row
        layout={ColumnLayouts.OneColumn}
        backgroundColor="#FFFFFF"
        padding="32px 48px 4px 48px"
      >
        <Column>
          <Heading
            headingType="h3"
            fontSize="13px"
            fontWeight={700}
            color={INK}
            textAlign="left"
          >
            ORDER #WP-48213
          </Heading>
        </Column>
      </Row>

      {/* Itemized order table */}
      <Row
        layout={ColumnLayouts.OneColumn}
        backgroundColor="#FFFFFF"
        padding="8px 48px 0 48px"
      >
        <Column>
          <Table
            headers={["Item", "Qty", "Price"]}
            data={[
              ["Percey — Whiskey Tortoise", "1", "$145.00"],
              ["Haskell — Crystal", "1", "$95.00"],
              ["Anti-Fog Lens Spray", "2", "$30.00"],
            ]}
          />
        </Column>
      </Row>

      {/* Totals */}
      <Row
        layout={ColumnLayouts.OneColumn}
        backgroundColor="#FFFFFF"
        padding="16px 48px 0 48px"
      >
        <Column>
          <Divider borderTopWidth="1px" borderTopColor={LINE} borderTopStyle="solid" />
        </Column>
      </Row>

      <Row
        layout={ColumnLayouts.TwoEqual}
        backgroundColor="#FFFFFF"
        padding="12px 48px 0 48px"
      >
        <Column>
          <Paragraph html="Subtotal" fontSize="14px" color={MUTED} textAlign="left" />
        </Column>
        <Column>
          <Paragraph html="$270.00" fontSize="14px" color={INK} textAlign="right" />
        </Column>
      </Row>

      <Row
        layout={ColumnLayouts.TwoEqual}
        backgroundColor="#FFFFFF"
        padding="4px 48px 0 48px"
      >
        <Column>
          <Paragraph html="Shipping" fontSize="14px" color={MUTED} textAlign="left" />
        </Column>
        <Column>
          <Paragraph html="Free" fontSize="14px" color={INK} textAlign="right" />
        </Column>
      </Row>

      <Row
        layout={ColumnLayouts.TwoEqual}
        backgroundColor="#FFFFFF"
        padding="8px 48px 24px 48px"
      >
        <Column>
          <Heading headingType="h4" fontSize="15px" fontWeight={700} color={INK} textAlign="left">
            Total
          </Heading>
        </Column>
        <Column>
          <Heading headingType="h4" fontSize="15px" fontWeight={700} color={INK} textAlign="right">
            $270.00
          </Heading>
        </Column>
      </Row>

      {/* Shipping address */}
      <Row
        layout={ColumnLayouts.OneColumn}
        backgroundColor="#FFFFFF"
        padding="0 48px 40px 48px"
      >
        <Column>
          <Divider borderTopWidth="1px" borderTopColor={LINE} borderTopStyle="solid" />
          <Paragraph
            html="<b>Shipping to</b><br/>Alex Rivera<br/>211 Mott Street, Apt 4<br/>New York, NY 10012"
            fontSize="13px"
            color={MUTED}
            lineHeight="170%"
            textAlign="left"
          />
        </Column>
      </Row>

      {/* Footer */}
      <Row
        layout={ColumnLayouts.OneColumn}
        backgroundColor="#FBFBF9"
        padding="32px 48px 8px 48px"
      >
        <Column>
          <Paragraph
            html="Questions about your order? Visit our <a href='https://www.warbyparker.com/help'>Help Center</a> or reply to this email."
            fontSize="13px"
            color={MUTED}
            textAlign="center"
            lineHeight="160%"
          />
        </Column>
      </Row>

      <Row
        layout={ColumnLayouts.OneColumn}
        backgroundColor="#FBFBF9"
        padding="0 48px 40px 48px"
      >
        <Column>
          <Paragraph
            html="Warby Parker &middot; 233 Spring Street, New York, NY 10013"
            fontSize="12px"
            color={FAINT}
            textAlign="center"
          />
          <Paragraph
            html="<a href='#'>Unsubscribe</a> &nbsp;·&nbsp; <a href='#'>Privacy Policy</a>"
            fontSize="12px"
            color={FAINT}
            textAlign="center"
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
