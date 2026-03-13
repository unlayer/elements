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
} from "@unlayer-dev/react-elements";

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
            containerPadding="0"
          />
        </Column>
      </Row>

      {/* Green accent bar */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#22c55e" padding="0">
        <Column>
          <Divider
            borderTopWidth="3px"
            borderTopColor="#22c55e"
            borderTopStyle="solid"
            containerPadding="0"
          />
        </Column>
      </Row>

      {/* Confirmation message */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="36px 48px 0 48px">
        <Column>
          <Heading
            text="Your order is confirmed."
            headingType="h1"
            fontSize="24px"
            fontWeight={600}
            color="#1d1d1f"
            textAlign="left"
            lineHeight="1.3"
            containerPadding="0 0 8px 0"
            fontFamily={sansFont}
          />
          <Paragraph
            text="Hi Alex, thanks for your purchase. We'll send you a shipping confirmation once your order is on its way."
            fontSize="15px"
            color="#6e6e73"
            textAlign="left"
            lineHeight="1.65"
            containerPadding="0 0 32px 0"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      {/* Delivery estimate — highlight box */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="0 48px">
        <Column>
          <Heading
            text="ESTIMATED DELIVERY"
            headingType="h4"
            fontSize="10px"
            fontWeight={700}
            color="#86868b"
            textAlign="left"
            lineHeight="1.4"
            containerPadding="20px 24px 4px 24px"
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
            containerPadding="0 24px 20px 24px"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      {/* Divider */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="8px 48px 0 48px">
        <Column>
          <Divider
            borderTopWidth="1px"
            borderTopColor="#e5e5e7"
            borderTopStyle="solid"
            containerPadding="0"
          />
        </Column>
      </Row>

      {/* Order summary heading */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="24px 48px 0 48px">
        <Column>
          <Heading
            text="ORDER SUMMARY"
            headingType="h4"
            fontSize="10px"
            fontWeight={700}
            color="#86868b"
            textAlign="left"
            lineHeight="1.4"
            containerPadding="0 0 16px 0"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      {/* Table */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="0 48px">
        <Column>
          <Table
            headers={["Item", "Qty", "Price"]}
            data={[
              ["Wireless Headphones Pro", "1", "$249.00"],
              ["USB-C Charging Cable (2m)", "2", "$38.00"],
              ["Leather Carrying Case", "1", "$59.00"],
            ]}
            containerPadding="0 0 4px 0"
          />
        </Column>
      </Row>

      {/* Total */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="0 48px">
        <Column>
          <Divider
            borderTopWidth="1px"
            borderTopColor="#1d1d1f"
            borderTopStyle="solid"
            containerPadding="0 0 12px 0"
          />
          <Heading
            text="$346.00"
            headingType="h2"
            fontSize="24px"
            fontWeight={700}
            color="#1d1d1f"
            textAlign="right"
            lineHeight="1.3"
            containerPadding="0 0 4px 0"
            fontFamily={sansFont}
          />
          <Paragraph
            text="Includes $27.68 tax · Free shipping"
            fontSize="12px"
            color="#86868b"
            textAlign="right"
            lineHeight="1.4"
            containerPadding="0 0 32px 0"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      {/* Divider */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="0 48px">
        <Column>
          <Divider
            borderTopWidth="1px"
            borderTopColor="#e5e5e7"
            borderTopStyle="solid"
            containerPadding="0"
          />
        </Column>
      </Row>

      {/* Shipping & Order details — two columns */}
      <Row layout={ColumnLayouts.TwoEqual} backgroundColor="#ffffff" padding="24px 48px 0 48px">
        <Column>
          <Heading
            text="SHIPPING TO"
            headingType="h4"
            fontSize="10px"
            fontWeight={700}
            color="#86868b"
            textAlign="left"
            lineHeight="1.4"
            containerPadding="0 0 10px 0"
            fontFamily={sansFont}
          />
          <Paragraph
            text="Alex Johnson"
            fontSize="14px"
            color="#1d1d1f"
            textAlign="left"
            lineHeight="1.5"
            containerPadding="0 0 2px 0"
            fontFamily={sansFont}
          />
          <Paragraph
            text="123 Main Street"
            fontSize="14px"
            color="#6e6e73"
            textAlign="left"
            lineHeight="1.5"
            containerPadding="0 0 2px 0"
            fontFamily={sansFont}
          />
          <Paragraph
            text="San Francisco, CA 94103"
            fontSize="14px"
            color="#6e6e73"
            textAlign="left"
            lineHeight="1.5"
            containerPadding="0 0 24px 0"
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
            containerPadding="0 0 10px 0"
            fontFamily={sansFont}
          />
          <Paragraph
            text="Order #A1029384"
            fontSize="14px"
            color="#1d1d1f"
            textAlign="left"
            lineHeight="1.5"
            containerPadding="0 0 2px 0"
            fontFamily={sansFont}
          />
          <Paragraph
            text="Placed on March 3, 2026"
            fontSize="14px"
            color="#6e6e73"
            textAlign="left"
            lineHeight="1.5"
            containerPadding="0 0 2px 0"
            fontFamily={sansFont}
          />
          <Paragraph
            text="Visa ending in 4242"
            fontSize="14px"
            color="#6e6e73"
            textAlign="left"
            lineHeight="1.5"
            containerPadding="0 0 24px 0"
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
            containerPadding="0 0 28px 0"
          />
          <Button
            text="Track Your Order"
            backgroundColor="#0071e3"
            color="#ffffff"
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
            text="Questions? Contact us at support@store.com"
            fontSize="12px"
            color="#86868b"
            textAlign="center"
            lineHeight="1.6"
            containerPadding="0 0 4px 0"
            fontFamily={sansFont}
          />
          <Paragraph
            text="Store Inc · 1 Infinite Loop, Cupertino, CA"
            fontSize="12px"
            color="#86868b"
            textAlign="center"
            lineHeight="1.6"
            containerPadding="0"
            fontFamily={sansFont}
          />
        </Column>
      </Row>
    </Email>
  );
}
