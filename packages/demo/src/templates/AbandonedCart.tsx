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

export default function AbandonedCart(): ReactElement {
  return (
    <Email
      backgroundColor="#ffffff"
      textColor="#1a1a1a"
      contentAlign="center"
      contentWidth="540px"
      fontFamily={sansFont}
      previewText="You left something behind. Complete your order before it sells out."
    >
      {/* Header */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#fafaf9" padding="24px 40px">
        <Column>
          <Image
            src={{ url: "https://placehold.co/120x30/1a1a1a/ffffff?text=FORMA", width: 120, height: 30 }}
            altText="Forma"
            textAlign="center"
          />
        </Column>
      </Row>

      {/* Hero */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#fafaf9" padding="32px 40px 40px 40px">
        <Column>
          <Heading
            text="Still thinking it over?"
            headingType="h1"
            fontSize="28px"
            fontWeight={700}
            color="#1a1a1a"
            textAlign="center"
            lineHeight="1.2"
            fontFamily={sansFont}
          />
          <Paragraph
            html="No rush — your cart is waiting. But these items are popular and stock is limited."
            fontSize="15px"
            color="#71717a"
            textAlign="center"
            lineHeight="1.6"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      {/* Product 1 */}
      <Row layout={ColumnLayouts.TwoNarrowWide} backgroundColor="#ffffff" padding="32px 40px 0px 40px">
        <Column>
          <Image
            src={{ url: "https://placehold.co/140x140/f5f5f4/a8a29e?text=Product", width: 140, height: 140 }}
            altText="Ceramic Desk Lamp"
            textAlign="center"
          />
        </Column>
        <Column>
          <Heading
            text="Ceramic Desk Lamp"
            headingType="h3"
            fontSize="16px"
            fontWeight={600}
            color="#1a1a1a"
            textAlign="left"
            lineHeight="1.3"
            fontFamily={sansFont}
          />
          <Paragraph
            html="Matte White · Medium"
            fontSize="13px"
            color="#a1a1aa"
            textAlign="left"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
          <Heading
            text="$89.00"
            headingType="h3"
            fontSize="16px"
            fontWeight={700}
            color="#1a1a1a"
            textAlign="left"
            lineHeight="1.3"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      {/* Divider between products */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="20px 40px 0px 40px">
        <Column>
          <Divider
            borderTopWidth="1px"
            borderTopColor="#f4f4f5"
            borderTopStyle="solid"
          />
        </Column>
      </Row>

      {/* Product 2 */}
      <Row layout={ColumnLayouts.TwoNarrowWide} backgroundColor="#ffffff" padding="20px 40px 0px 40px">
        <Column>
          <Image
            src={{ url: "https://placehold.co/140x140/f5f5f4/a8a29e?text=Product", width: 140, height: 140 }}
            altText="Linen Throw Pillow"
            textAlign="center"
          />
        </Column>
        <Column>
          <Heading
            text="Linen Throw Pillow"
            headingType="h3"
            fontSize="16px"
            fontWeight={600}
            color="#1a1a1a"
            textAlign="left"
            lineHeight="1.3"
            fontFamily={sansFont}
          />
          <Paragraph
            html="Oatmeal · 20″ × 20″"
            fontSize="13px"
            color="#a1a1aa"
            textAlign="left"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
          <Heading
            text="$45.00"
            headingType="h3"
            fontSize="16px"
            fontWeight={700}
            color="#1a1a1a"
            textAlign="left"
            lineHeight="1.3"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      {/* Total + CTA */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="28px 40px 0px 40px">
        <Column>
          <Divider
            borderTopWidth="1px"
            borderTopColor="#e4e4e7"
            borderTopStyle="solid"
          />
          <Heading
            text="Cart Total: $134.00"
            headingType="h3"
            fontSize="18px"
            fontWeight={700}
            color="#1a1a1a"
            textAlign="center"
            lineHeight="1.3"
            fontFamily={sansFont}
          />
          <Paragraph
            html="Free shipping on orders over $100 ✔️"
            fontSize="13px"
            color="#16a34a"
            textAlign="center"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
          <Button
            text="Complete Your Order"
            buttonColors={{ backgroundColor: "#1a1a1a", color: "#ffffff" }}
            padding="16px 40px"
            borderRadius="6px"
            fontSize="15px"
            fontWeight={600}
            textAlign="center"
            fontFamily={sansFont}
          />
          <Paragraph
            html="Secure checkout · Free returns within 30 days"
            fontSize="12px"
            color="#a1a1aa"
            textAlign="center"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      {/* Social proof */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="32px 40px 40px 40px">
        <Column>
          <Divider
            borderTopWidth="1px"
            borderTopColor="#f4f4f5"
            borderTopStyle="solid"
          />
          <Paragraph
            html="★★★★★ <b>4.9/5</b> from 2,400+ reviews"
            fontSize="14px"
            color="#71717a"
            textAlign="center"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
          <Paragraph
            html='<i>"Beautifully made. The lamp is even better in person."</i> — Emma R.'
            fontSize="13px"
            color="#a1a1aa"
            textAlign="center"
            lineHeight="1.6"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      {/* Footer */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#fafaf9" padding="24px 40px">
        <Column>
          <Paragraph
            html="Forma Home · Brooklyn, NY"
            fontSize="12px"
            color="#a1a1aa"
            textAlign="center"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
        </Column>
      </Row>
    </Email>
  );
}
