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
  ColumnLayouts,
} from "@unlayer/react-elements";

const sansFont = {
  label: "Sans Serif",
  value: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
};

export default function ShippingUpdate(): ReactElement {
  return (
    <Email
      backgroundColor="#f3f4f6"
      textColor="#111827"
      contentAlign="center"
      contentWidth="540px"
      fontFamily={sansFont}
      previewText="Great news! Your order has shipped and is on its way."
    >
      {/* Header */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#111827" padding="20px 40px">
        <Column>
          <Image
            src={{ url: "https://placehold.co/100x24/ffffff/111827?text=PARCEL", width: 100, height: 24 }}
            altText="Parcel"
            textAlign="left"
          />
        </Column>
      </Row>

      {/* Status Banner */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#059669" padding="20px 40px">
        <Column>
          <Heading
            text="📦 Your order has shipped!"
            headingType="h2"
            fontSize="18px"
            fontWeight={700}
            color="#ffffff"
            textAlign="center"
            lineHeight="1.3"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      {/* Tracking Info */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="32px 40px 0px 40px">
        <Column>
          <Paragraph
            html="Estimated delivery"
            fontSize="12px"
            color="#6b7280"
            textAlign="center"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
          <Heading
            text="Thursday, March 6"
            headingType="h1"
            fontSize="24px"
            fontWeight={700}
            color="#111827"
            textAlign="center"
            lineHeight="1.2"
            fontFamily={sansFont}
          />
          <Paragraph
            html="by end of day"
            fontSize="13px"
            color="#9ca3af"
            textAlign="center"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      {/* Progress Bar Visual */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="0px 40px">
        <Column>
          <Image
            src={{ url: "https://placehold.co/460x8/059669/059669?text=+", width: 460, height: 8 }}
            altText="Shipping progress"
            textAlign="center"
          />
        </Column>
      </Row>

      {/* Progress Labels */}
      <Row layout={ColumnLayouts.ThreeEqual} backgroundColor="#ffffff" padding="0px 40px 28px 40px">
        <Column>
          <Paragraph
            html="✓ Confirmed"
            fontSize="11px"
            color="#059669"
            textAlign="left"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
        </Column>
        <Column>
          <Paragraph
            html="✓ Shipped"
            fontSize="11px"
            color="#059669"
            textAlign="center"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
        </Column>
        <Column>
          <Paragraph
            html="Delivered"
            fontSize="11px"
            color="#9ca3af"
            textAlign="right"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      {/* Track Button */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="0px 40px 28px 40px">
        <Column>
          <Button
            text="Track Package"
            buttonColors={{ backgroundColor: "#111827", color: "#ffffff" }}
            padding="14px 32px"
            borderRadius="6px"
            fontSize="14px"
            fontWeight={600}
            textAlign="center"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      {/* Divider */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="0px 40px">
        <Column>
          <Divider
            borderTopWidth="1px"
            borderTopColor="#e5e7eb"
            borderTopStyle="solid"
          />
        </Column>
      </Row>

      {/* Shipping Details */}
      <Row layout={ColumnLayouts.TwoEqual} backgroundColor="#ffffff" padding="24px 40px 0px 40px">
        <Column>
          <Paragraph
            html="SHIPPING TO"
            fontSize="10px"
            color="#9ca3af"
            textAlign="left"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
          <Paragraph
            html="<b>Alex Johnson</b>"
            fontSize="13px"
            color="#111827"
            textAlign="left"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
          <Paragraph
            html={"742 Evergreen Terrace\nSan Francisco, CA 94102"}
            fontSize="13px"
            color="#6b7280"
            textAlign="left"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
        </Column>
        <Column>
          <Paragraph
            html="TRACKING NUMBER"
            fontSize="10px"
            color="#9ca3af"
            textAlign="left"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
          <Paragraph
            html="<b>1Z999AA10123456784</b>"
            fontSize="13px"
            color="#111827"
            textAlign="left"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
          <Paragraph
            html="UPS Ground"
            fontSize="13px"
            color="#6b7280"
            textAlign="left"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      {/* Order Item */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="28px 40px 0px 40px">
        <Column>
          <Divider
            borderTopWidth="1px"
            borderTopColor="#e5e7eb"
            borderTopStyle="solid"
          />
          <Paragraph
            html="ORDER #PRC-8847"
            fontSize="10px"
            color="#9ca3af"
            textAlign="left"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      <Row layout={ColumnLayouts.TwoNarrowWide} backgroundColor="#ffffff" padding="0px 40px 32px 40px">
        <Column>
          <Image
            src={{ url: "https://placehold.co/100x100/f3f4f6/6b7280?text=Item", width: 100, height: 100 }}
            altText="Wireless Headphones"
            textAlign="center"
          />
        </Column>
        <Column>
          <Paragraph
            html="<b>Wireless Headphones Pro</b>"
            fontSize="14px"
            color="#111827"
            textAlign="left"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
          <Paragraph
            html="Midnight Black · Qty: 1"
            fontSize="13px"
            color="#6b7280"
            textAlign="left"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      {/* Footer */}
      <Row layout={ColumnLayouts.OneColumn} padding="24px 40px 40px 40px">
        <Column>
          <Paragraph
            html="Questions about your order? Reply to this email or contact support."
            fontSize="12px"
            color="#9ca3af"
            textAlign="center"
            lineHeight="1.6"
            fontFamily={sansFont}
          />
          <Paragraph
            html="Parcel Co · Austin, TX"
            fontSize="12px"
            color="#9ca3af"
            textAlign="center"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
        </Column>
      </Row>
    </Email>
  );
}
