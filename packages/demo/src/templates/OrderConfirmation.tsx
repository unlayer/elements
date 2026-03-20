import type { ReactElement } from "react";
import {
  Email,
  Row,
  Column,
  Paragraph,
  Heading,
  Button,
  Divider,
  Image,
  Table,
  ColumnLayouts,
} from "@unlayer/react-elements";

const sansFont = {
  label: "Sans Serif",
  value: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
};

export default function OrderConfirmation(): ReactElement {
  return (
    <Email
      backgroundColor="#f5f5f7"
      textColor="#1d1d1f"
      contentAlign="center"
      contentWidth="560px"
      fontFamily={sansFont}
      previewText="Your order #A1029384 has been confirmed. Estimated delivery: Mar 8-10."
    >
      {/* Header with logo */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="36px 48px 36px 48px">
        <Column>
          <Image
            src={{ url: "https://placehold.co/120x28/1d1d1f/ffffff?text=STORE", width: 120, height: 28 }}
            altText="Store"
            textAlign="left"
          />
        </Column>
      </Row>

      {/* Green accent bar */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#22c55e" padding="0px">
        <Column>
          <Divider
            borderTopWidth="3px"
            borderTopColor="#22c55e"
            borderTopStyle="solid"
          />
        </Column>
      </Row>

      {/* Confirmation message */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="36px 48px 0px 48px">
        <Column>
          <Heading
            text="Your order is confirmed."
            headingType="h1"
            fontSize="24px"
            fontWeight={600}
            color="#1d1d1f"
            textAlign="left"
            lineHeight="1.3"
            fontFamily={sansFont}
          />
          <Paragraph
            html="Hi Alex, thanks for your purchase. We'll send you a shipping confirmation once your order is on its way."
            fontSize="15px"
            color="#6e6e73"
            textAlign="left"
            lineHeight="1.65"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      {/* Delivery estimate — highlight box */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="0px 48px">
        <Column>
          <Heading
            text="ESTIMATED DELIVERY"
            headingType="h4"
            fontSize="10px"
            fontWeight={700}
            color="#86868b"
            textAlign="left"
            lineHeight="1.4"
            fontFamily={sansFont}
          />
          <Heading
            text="March 8 – 10, 2026"
            headingType="h2"
            fontSize="20px"
            fontWeight={600}
            color="#1d1d1f"
            textAlign="left"
            lineHeight="1.3"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      {/* Divider */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="8px 48px 0px 48px">
        <Column>
          <Divider
            borderTopWidth="1px"
            borderTopColor="#e5e5e7"
            borderTopStyle="solid"
          />
        </Column>
      </Row>

      {/* Order summary heading */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="24px 48px 0px 48px">
        <Column>
          <Heading
            text="ORDER SUMMARY"
            headingType="h4"
            fontSize="10px"
            fontWeight={700}
            color="#86868b"
            textAlign="left"
            lineHeight="1.4"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      {/* Table */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="0px 48px">
        <Column>
          <Table
            headers={["Item", "Qty", "Price"]}
            data={[
              ["Wireless Headphones Pro", "1", "$249.00"],
              ["USB-C Charging Cable (2m)", "2", "$38.00"],
              ["Leather Carrying Case", "1", "$59.00"],
            ]}
          />
        </Column>
      </Row>

      {/* Total */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="0px 48px">
        <Column>
          <Divider
            borderTopWidth="1px"
            borderTopColor="#1d1d1f"
            borderTopStyle="solid"
          />
          <Heading
            text="$346.00"
            headingType="h2"
            fontSize="24px"
            fontWeight={700}
            color="#1d1d1f"
            textAlign="right"
            lineHeight="1.3"
            fontFamily={sansFont}
          />
          <Paragraph
            html="Includes $27.68 tax · Free shipping"
            fontSize="12px"
            color="#86868b"
            textAlign="right"
            lineHeight="1.4"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      {/* Divider */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="0px 48px">
        <Column>
          <Divider
            borderTopWidth="1px"
            borderTopColor="#e5e5e7"
            borderTopStyle="solid"
          />
        </Column>
      </Row>

      {/* Shipping & Order details — two columns */}
      <Row layout={ColumnLayouts.TwoEqual} backgroundColor="#ffffff" padding="24px 48px 0px 48px">
        <Column>
          <Heading
            text="SHIPPING TO"
            headingType="h4"
            fontSize="10px"
            fontWeight={700}
            color="#86868b"
            textAlign="left"
            lineHeight="1.4"
            fontFamily={sansFont}
          />
          <Paragraph
            html="Alex Johnson"
            fontSize="14px"
            color="#1d1d1f"
            textAlign="left"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
          <Paragraph
            html="123 Main Street"
            fontSize="14px"
            color="#6e6e73"
            textAlign="left"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
          <Paragraph
            html="San Francisco, CA 94103"
            fontSize="14px"
            color="#6e6e73"
            textAlign="left"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
        </Column>
        <Column>
          <Heading
            text="ORDER DETAILS"
            headingType="h4"
            fontSize="10px"
            fontWeight={700}
            color="#86868b"
            textAlign="left"
            lineHeight="1.4"
            fontFamily={sansFont}
          />
          <Paragraph
            html="Order #A1029384"
            fontSize="14px"
            color="#1d1d1f"
            textAlign="left"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
          <Paragraph
            html="Placed on March 3, 2026"
            fontSize="14px"
            color="#6e6e73"
            textAlign="left"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
          <Paragraph
            html="Visa ending in 4242"
            fontSize="14px"
            color="#6e6e73"
            textAlign="left"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      {/* CTA */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="8px 48px 40px 48px">
        <Column>
          <Divider
            borderTopWidth="1px"
            borderTopColor="#e5e5e7"
            borderTopStyle="solid"
          />
          <Button
            text="Track Your Order"
            buttonColors={{ backgroundColor: "#0071e3", color: "#ffffff" }}
            padding="14px 32px"
            borderRadius="8px"
            fontSize="14px"
            fontWeight={600}
            textAlign="center"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      {/* Footer */}
      <Row layout={ColumnLayouts.OneColumn} padding="20px 48px 32px 48px">
        <Column>
          <Paragraph
            html="Questions? Contact us at support@store.com"
            fontSize="12px"
            color="#86868b"
            textAlign="center"
            lineHeight="1.6"
            fontFamily={sansFont}
          />
          <Paragraph
            html="Store Inc · 1 Infinite Loop, Cupertino, CA"
            fontSize="12px"
            color="#86868b"
            textAlign="center"
            lineHeight="1.6"
            fontFamily={sansFont}
          />
        </Column>
      </Row>
    </Email>
  );
}
