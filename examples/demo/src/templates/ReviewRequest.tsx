import type { ReactElement } from "react";
import {
  Button,
  Column,
  Divider,
  Email,
  Heading,
  Image,
  Text,
  Section,
} from "@hyper-elements/react";

const sansFont = "'Circular', 'Helvetica Neue', Helvetica, Arial, sans-serif";

export default function ReviewRequest(): ReactElement {
  return (
    <Email
      width={560}
      previewText="How was your stay at Sunset Villa? Leave a review for Maria."
      style={{ backgroundColor: "#ffffff", color: "#222222", fontFamily: sansFont }}
    >
      {/* Logo */}
      <Section style={{ backgroundColor: "#ffffff", padding: [32, 0, 24, 0] }}>
        <Heading
          level={4}
          style={{ padding: 10, fontSize: 18, fontWeight: 700, color: "#FF385C", textAlign: "left", lineHeight: 1 }}
        >
          staybnb
        </Heading>
      </Section>

      {/* Hero image — real Unsplash photo */}
      <Section style={{ backgroundColor: "#ffffff" }}>
        <Column style={{ padding: 10, alignItems: "center" }}>
          <Image
            src={{
              src: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=464&h=260&fit=crop&auto=format&q=80",
              width: 464,
              height: 260,
            }}
            alt="Sunset Villa, Malibu"
            style={{ width: 444 }}
          />
        </Column>
      </Section>

      {/* Trip details strip */}
      <Section style={{ backgroundColor: "#ffffff" }}>
        <Text style={{ padding: 10, fontSize: 13, color: "#717171", textAlign: "center", lineHeight: 1.5 }}>
          Feb 24 – 28 · Malibu, California · 4 nights
        </Text>
      </Section>

      <Section style={{ backgroundColor: "#ffffff", padding: [8, 0, 0, 0] }}>
        <Divider style={{ borderTop: "1px solid #ebebeb", padding: 10 }} />
      </Section>

      {/* Main prompt */}
      <Section style={{ backgroundColor: "#ffffff", padding: [28, 0, 0, 0] }}>
        <Heading
          style={{ padding: 10, fontSize: 26, fontWeight: 700, color: "#222222", textAlign: "left", lineHeight: 1.25 }}
        >
          How was your stay?
        </Heading>
        <Text style={{ padding: 10, fontSize: 16, color: "#484848", textAlign: "left", lineHeight: 1.65 }}>
          Your review matters! Share your honest experience to help future travelers and support
          your host.
        </Text>
      </Section>

      {/* Host card */}
      <Section style={{ backgroundColor: "#ffffff" }}>
        <Column style={{ padding: 10, alignItems: "start" }}>
          <Image
            src={{ src: "https://placehold.co/56x56/ff385c/ffffff?text=M", width: 56, height: 56 }}
            alt="Maria"
            style={{ width: 56 }}
          />
        </Column>
        <Heading
          level={3}
          style={{ padding: 10, fontSize: 14, fontWeight: 700, color: "#222222", textAlign: "left", lineHeight: 1.4 }}
        >
          Hosted by Maria
        </Heading>
        <Text style={{ padding: 10, fontSize: 13, color: "#717171", textAlign: "left", lineHeight: 1.4 }}>
          Superhost · 4.96 ★ · 214 reviews
        </Text>
      </Section>

      {/* Star rating prompt */}
      <Section style={{ backgroundColor: "#ffffff" }}>
        <Divider style={{ borderTop: "1px solid #ebebeb", padding: 10 }} />
        <Text style={{ padding: 10, fontSize: 13, color: "#717171", textAlign: "center", lineHeight: 1.4 }}>
          Overall experience
        </Text>
        <Heading
          level={2}
          style={{ padding: 10, fontSize: 32, fontWeight: 400, color: "#FF385C", textAlign: "center", lineHeight: 1.2 }}
        >
          ★ ★ ★ ★ ★
        </Heading>
        <Divider style={{ borderTop: "1px solid #ebebeb", padding: 10 }} />
      </Section>

      {/* CTA */}
      <Section style={{ backgroundColor: "#ffffff", padding: [0, 0, 40, 0] }}>
        <Column style={{ padding: 10, alignItems: "center" }}>
          <Button
            href="#"
            style={{
              backgroundColor: "#FF385C",
              color: "#ffffff",
              fontSize: 16,
              fontWeight: 600,
              padding: "16px 32px",
              borderRadius: 8,
            }}
          >
            Write a Review
          </Button>
        </Column>
      </Section>

      {/* Deadline notice */}
      <Section style={{ backgroundColor: "#ffffff", padding: [0, 0, 36, 0] }}>
        <Text style={{ padding: 10, fontSize: 14, color: "#717171", textAlign: "left", lineHeight: 1.65 }}>
          Reviews must be submitted within 14 days of checkout. Your review will be visible on
          Maria's listing once she also completes her review of you.
        </Text>
      </Section>

      {/* Footer divider */}
      <Section>
        <Divider style={{ borderTop: "1px solid #dddddd", padding: 10 }} />
      </Section>

      {/* Footer */}
      <Section style={{ padding: [20, 0, 32, 0] }}>
        <Text style={{ padding: 10, fontSize: 12, color: "#999999", textAlign: "left", lineHeight: 1.5 }}>
          Sent by StayBnB, Inc. · 888 Brannan St, San Francisco, CA 94103
        </Text>
        <Text style={{ padding: 10, fontSize: 12, color: "#999999", textAlign: "left", lineHeight: 1.5 }}>
          This is a notification about your recent trip.
        </Text>
      </Section>
    </Email>
  );
}
