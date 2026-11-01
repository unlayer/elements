// main's examples/NikeDrop.stories.tsx, migrated by @unlayer/migrate's codemod (packages/migrate/src/legacy): generated, don't edit.
// Regenerate: UPDATE_LEGACY_EXAMPLES=1 pnpm --filter @unlayer/migrate test legacy-examples
import { Button, Column, Email, Heading, Image, Paragraph, Section, Social } from "../index";

// Reconstructed from the "fresh agent" Nike build — verbatim natural forms:
// full-width hero src string + width="100%", oversized fontSize="48px"
// fontWeight={800}, Social icons shorthand.
const BLACK = "#111111";
const WHITE = "#FFFFFF";
const helv = {
  label: "Helvetica",
  value: "'Helvetica Neue', Helvetica, Arial, sans-serif",
};

export function NikeDrop() {
  return (
    <Email width={600} style={{ backgroundColor: BLACK, color: "#000000", fontFamily: helv.value }}>
      {/* Brand */}
      <Section style={{ backgroundColor: BLACK, padding: [28, 0, 4, 0] }}>
        <Heading
          level={3}
          style={{
            padding: 10,
            fontSize: 22,
            fontWeight: 800,
            color: WHITE,
            textAlign: "center",
            lineHeight: "140%",
          }}
        >
          NIKE
        </Heading>
      </Section>

      {/* Hero */}
      <Section style={{ backgroundColor: BLACK, padding: [8, 0, 0, 0] }}>
        <Column style={{ padding: 10, alignItems: "center" }}>
          <Image
            src={"https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&q=80"}
            alt="New sneaker drop"
          />
        </Column>
      </Section>

      {/* Headline */}
      <Section style={{ backgroundColor: BLACK, padding: [28, 0, 0, 0] }}>
        <Heading
          style={{
            padding: 10,
            fontSize: 48,
            fontWeight: 800,
            color: WHITE,
            textAlign: "center",
            lineHeight: "105%",
          }}
        >
          JUST DROPPED
        </Heading>
        <Paragraph
          style={{
            padding: 10,
            fontSize: 17,
            color: "#B3B3B3",
            textAlign: "center",
            lineHeight: "150%",
          }}
        >
          The Air Max 2026. Limited stock. Move fast.
        </Paragraph>
      </Section>

      {/* CTA */}
      <Section style={{ backgroundColor: BLACK, padding: [20, 0, 36, 0] }}>
        <Column style={{ padding: 10, alignItems: "center" }}>
          <Button
            href="https://nike.com/launch"
            style={{
              backgroundColor: WHITE,
              color: BLACK,
              fontSize: 18,
              fontWeight: 700,
              padding: "16px 40px",
              borderRadius: 40,
            }}
          >
            Shop now
          </Button>
        </Column>
      </Section>

      {/* Social footer */}
      <Section style={{ backgroundColor: BLACK, padding: [8, 0, 40, 0] }}>
        <Column style={{ padding: 10 }}>
          <Social
            icons={[
              { name: "Instagram", href: "https://instagram.com/nike" },
              { name: "Twitter", href: "https://twitter.com/nike" },
              { name: "Facebook", href: "https://facebook.com/nike" },
            ]}
            iconType="circle"
            size={36}
            style={{ gap: 12, justifyContent: "center" }}
          />
        </Column>
      </Section>
    </Email>
  );
}
