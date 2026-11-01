/**
 * main's "Nike · Sneaker Drop" example, and the same design written with the new components (main's layout
 * read as StripeReceipt.tsx says; its Social as composed.tsx writes it).
 */
import { NikeDrop } from "../../examples/NikeDrop.stories";
import { Button, Email, Heading, Image, Paragraph, Section } from "../index";
import { social } from "./composed";

const BLACK = "#111111";
const WHITE = "#FFFFFF";

export const main = <NikeDrop />;

export const next = (
  <Email width={600} style={{ backgroundColor: BLACK, fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
    <Section style={{ backgroundColor: BLACK, padding: [38, 10, 14, 10] }}>
      <Heading level={3} style={{ fontSize: 22, fontWeight: 800, color: WHITE, textAlign: "center", lineHeight: "140%" }}>
        NIKE
      </Heading>
    </Section>

    <Section style={{ backgroundColor: BLACK, padding: [18, 10, 10, 10] }}>
      <Image src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&q=80" alt="New sneaker drop" style={{ width: "100%" }} />
    </Section>

    <Section style={{ backgroundColor: BLACK, padding: [38, 10, 10, 10], gap: 20 }}>
      <Heading level={1} style={{ fontSize: 48, fontWeight: 800, color: WHITE, textAlign: "center", lineHeight: "105%" }}>
        JUST DROPPED
      </Heading>
      <Paragraph style={{ fontSize: 17, color: "#B3B3B3", textAlign: "center", lineHeight: "150%" }}>The Air Max 2026. Limited stock. Move fast.</Paragraph>
    </Section>

    <Section style={{ backgroundColor: BLACK, padding: [30, 10, 46, 10], alignItems: "center" }}>
      <Button href="https://nike.com/launch" style={{ backgroundColor: WHITE, color: BLACK, fontSize: 18, fontWeight: 700, padding: "16px 40px", borderRadius: 40 }}>
        Shop now
      </Button>
    </Section>

    <Section style={{ backgroundColor: BLACK, padding: [18, 10, 50, 10] }}>
      {social(
        [
          { name: "Instagram", url: "https://instagram.com/nike" },
          { name: "Twitter", url: "https://twitter.com/nike" },
          { name: "Facebook", url: "https://facebook.com/nike" },
        ],
        { type: "circle", size: 36 }
      )}
    </Section>
  </Email>
);
