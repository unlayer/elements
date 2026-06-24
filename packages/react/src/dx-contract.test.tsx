import { describe, it, expect } from "vitest";
import { renderToHtml, Email, Row, Column, Image, Heading, Paragraph, Button } from "./index";

/**
 * DX contract: the forms an author (human or AI) naturally writes must
 * type-check, and clear garbage must be rejected. The `@ts-expect-error` lines
 * are the real assertions — `tsc` fails the build if a "should-pass" form starts
 * erroring (the directive becomes unused) or a "should-fail" form stops erroring.
 * vitest only runs a render smoke; the type guarantees come from `tsc`.
 */

// ── Should type-check: the natural forms ─────────────────────────────────────
export function NaturalForms() {
  return (
    <Email>
      <Row>
        <Column>
          {/* Image: string src + CSS-style sizing */}
          <Image src="https://x/a.png" alt="a" />
          <Image src="https://x/a.png" width="300px" />
          <Image src="https://x/a.png" width={300} />
          <Image src="https://x/a.png" maxWidth="50%" />
          <Image src={{ url: "https://x/a.png", width: 300 }} />
          <Image src={{ url: "https://x/a.png", width: "300px", maxWidth: "50%" }} />

          {/* Heading: level alias, h1–h6, text, CSS-idiom fonts */}
          <Heading level="h1">Hi</Heading>
          <Heading level="h6" headingType="h5">Hi</Heading>
          <Heading text="Hi" fontSize="28px" />
          <Heading fontSize={28} fontWeight={700} fontFamily="Arial" color="#fff">Hi</Heading>
          <Heading fontWeight="700">Hi</Heading>
          <Heading fontWeight="bold" fontFamily={{ label: "Arial", value: "arial,sans-serif" }}>Hi</Heading>

          {/* Paragraph: text/html/children, numeric fontSize, numeric lineHeight */}
          <Paragraph text="Plain" />
          <Paragraph html="Rich <b>bold</b>" />
          <Paragraph fontSize={14} lineHeight={1.4} fontFamily="Georgia">Hi</Paragraph>

          {/* Button: CSS-style width, string fontWeight, string href */}
          <Button width="200px" href="https://x">Go</Button>
          <Button width={200}>Go</Button>
          <Button width="100%" fontWeight={700}>Go</Button>
        </Column>
      </Row>
    </Email>
  );
}

// ── Should be rejected: clear garbage ────────────────────────────────────────
export function GarbageForms() {
  return (
    <Email>
      <Row>
        <Column>
          {/* @ts-expect-error number is not a valid image src */}
          <Image src={123} />
          {/* @ts-expect-error fontFamily must be a string or { label, value } */}
          <Heading fontFamily={123}>Hi</Heading>
          {/* @ts-expect-error h9 is not a heading level */}
          <Heading level="h9">Hi</Heading>
          {/* @ts-expect-error fontWeight cannot be an arbitrary word */}
          <Heading fontWeight="heavyish">Hi</Heading>
        </Column>
      </Row>
    </Email>
  );
}

describe("dx-contract", () => {
  it("natural forms render to real HTML without the error fallback", () => {
    const out = renderToHtml(<NaturalForms />);
    expect(out.length).toBeGreaterThan(0);
    expect(out).not.toMatch(/failed to render/i);
  });
});
