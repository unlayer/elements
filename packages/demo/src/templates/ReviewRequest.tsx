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
  label: "Cereal",
  value: "'Circular', 'Helvetica Neue', Helvetica, Arial, sans-serif",
};

export default function ReviewRequest(): ReactElement {
  return (
    <Email
      backgroundColor="#ffffff"
      textColor="#222222"
      contentAlign="center"
      contentWidth="560px"
      fontFamily={sansFont}
      previewText="How was your stay at Sunset Villa? Leave a review for Maria."
    >
      {/* Logo */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="32px 48px 24px 48px">
        <Column>
          <Heading
            text="staybnb"
            headingType="h4"
            fontSize="18px"
            fontWeight={700}
            color="#FF385C"
            textAlign="left"
            lineHeight="1"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      {/* Hero image — real Unsplash photo */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="0px 48px">
        <Column>
          <Image
            src={{ url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=464&h=260&fit=crop&auto=format&q=80", width: 464, height: 260 }}
            altText="Sunset Villa, Malibu"
            textAlign="center"
          />
        </Column>
      </Row>

      {/* Trip details strip */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="0px 48px">
        <Column>
          <Paragraph
            html="Feb 24 – 28 · Malibu, California · 4 nights"
            fontSize="13px"
            color="#717171"
            textAlign="center"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="8px 48px 0px 48px">
        <Column>
          <Divider
            borderTopWidth="1px"
            borderTopColor="#ebebeb"
            borderTopStyle="solid"
          />
        </Column>
      </Row>

      {/* Main prompt */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="28px 48px 0px 48px">
        <Column>
          <Heading
            text="How was your stay?"
            headingType="h1"
            fontSize="26px"
            fontWeight={700}
            color="#222222"
            textAlign="left"
            lineHeight="1.25"
            fontFamily={sansFont}
          />
          <Paragraph
            html="Your review matters! Share your honest experience to help future travelers and support your host."
            fontSize="16px"
            color="#484848"
            textAlign="left"
            lineHeight="1.65"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      {/* Host card */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="0px 48px">
        <Column>
          <Image
            src={{ url: "https://placehold.co/56x56/ff385c/ffffff?text=M", width: 56, height: 56 }}
            altText="Maria"
            textAlign="left"
          />
          <Heading
            text="Hosted by Maria"
            headingType="h3"
            fontSize="14px"
            fontWeight={700}
            color="#222222"
            textAlign="left"
            lineHeight="1.4"
            fontFamily={sansFont}
          />
          <Paragraph
            html="Superhost · 4.96 ★ · 214 reviews"
            fontSize="13px"
            color="#717171"
            textAlign="left"
            lineHeight="1.4"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      {/* Star rating prompt */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="0px 48px">
        <Column>
          <Divider
            borderTopWidth="1px"
            borderTopColor="#ebebeb"
            borderTopStyle="solid"
          />
          <Paragraph
            html="Overall experience"
            fontSize="13px"
            color="#717171"
            textAlign="center"
            lineHeight="1.4"
            fontFamily={sansFont}
          />
          <Heading
            text="★ ★ ★ ★ ★"
            headingType="h2"
            fontSize="32px"
            fontWeight={400}
            color="#FF385C"
            textAlign="center"
            lineHeight="1.2"
            fontFamily={sansFont}
          />
          <Divider
            borderTopWidth="1px"
            borderTopColor="#ebebeb"
            borderTopStyle="solid"
          />
        </Column>
      </Row>

      {/* CTA */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="0px 48px 40px 48px">
        <Column>
          <Button
            text="Write a Review"
            buttonColors={{ backgroundColor: "#FF385C", color: "#ffffff" }}
            padding="16px 32px"
            borderRadius="8px"
            fontSize="16px"
            fontWeight={600}
            textAlign="center"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      {/* Deadline notice */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="0px 48px 36px 48px">
        <Column>
          <Paragraph
            html="Reviews must be submitted within 14 days of checkout. Your review will be visible on Maria's listing once she also completes her review of you."
            fontSize="14px"
            color="#717171"
            textAlign="left"
            lineHeight="1.65"
            fontFamily={sansFont}
          />
        </Column>
      </Row>

      {/* Footer divider */}
      <Row layout={ColumnLayouts.OneColumn} padding="0px 48px">
        <Column>
          <Divider
            borderTopWidth="1px"
            borderTopColor="#dddddd"
            borderTopStyle="solid"
          />
        </Column>
      </Row>

      {/* Footer */}
      <Row layout={ColumnLayouts.OneColumn} padding="20px 48px 32px 48px">
        <Column>
          <Paragraph
            html="Sent by StayBnB, Inc. · 888 Brannan St, San Francisco, CA 94103"
            fontSize="12px"
            color="#999999"
            textAlign="left"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
          <Paragraph
            html="This is a notification about your recent trip."
            fontSize="12px"
            color="#999999"
            textAlign="left"
            lineHeight="1.5"
            fontFamily={sansFont}
          />
        </Column>
      </Row>
    </Email>
  );
}
