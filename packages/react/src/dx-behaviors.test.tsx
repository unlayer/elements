import { describe, it, expect } from "vitest";
import React from "react";
import {
  renderToHtml,
  renderToJson,
  Body,
  Row,
  Column,
  Image,
  Heading,
  Paragraph,
  Button,
  Table,
} from "./index";

/**
 * Runtime regression coverage for the agent-friendly DX layer: every "natural"
 * authoring form must render to the right thing. These guard against silent
 * regressions in the CSS-idiom normalization, image sizing, and the shorthand
 * mappings.
 */

const html = (el: React.ReactElement) =>
  renderToHtml(
    <Body mode="web">
      <Row>
        <Column>{el}</Column>
      </Row>
    </Body>
  );

const itemValues = (el: React.ReactElement) =>
  (renderToJson(
    <Body>
      <Row>
        <Column>{el}</Column>
      </Row>
    </Body>
  ) as any).body.rows[0].columns[0].contents[0].values;

const columnValues = (el: React.ReactElement) =>
  (renderToJson(
    <Body>
      <Row>{el}</Row>
    </Body>
  ) as any).body.rows[0].columns[0].values;

describe("DX: image sizing (a fixed width pins to the editor's canonical percent)", () => {
  // Default Body contentWidth is 500px; minus the 10px×2 default container
  // padding the content slot is 480px, so a 300px pin → 300/480 = 62.5%.
  it("a numeric width pins (autoWidth:false + percent of the content slot)", () => {
    const src = itemValues(<Image src="u" width={300 as any} />).src;
    expect(src.autoWidth).toBe(false);
    expect(src.maxWidth).toBe("62.5%");
  });

  it("a px-string width pins identically to the numeric form", () => {
    const src = itemValues(<Image src="u" width={"300px" as any} />).src;
    expect(src.autoWidth).toBe(false);
    expect(src.maxWidth).toBe("62.5%");
  });

  it("a percent width is a fixed display size (autoWidth:false + maxWidth percent)", () => {
    const src = itemValues(<Image src="u" width={"50%" as any} />).src;
    expect(src.autoWidth).toBe(false);
    expect(src.maxWidth).toBe("50%");
  });

  it("width '100%' is responsive (autoWidth:true)", () => {
    expect(itemValues(<Image src="u" width={"100%" as any} />).src.autoWidth).toBe(true);
  });

  it("no width stays responsive", () => {
    expect(itemValues(<Image src="u" />).src.autoWidth).toBe(true);
  });

  it("a percent maxWidth is a fixed display size, keeping the natural width", () => {
    const src = itemValues(
      <Image src={{ url: "u", width: 1600, maxWidth: "50%" } as any} />
    ).src;
    expect(src.autoWidth).toBe(false);
    expect(src.maxWidth).toBe("50%");
    expect(src.width).toBe(1600);
  });

  it("string src renders an <img>", () => {
    expect(html(<Image src="https://x/a.png" />)).toMatch(/<img[^>]*src="https:\/\/x\/a\.png"/);
  });

  it("a px maxWidth pins as a percent of the content slot", () => {
    const src = itemValues(<Image src="u" maxWidth={300} />).src;
    expect(src.autoWidth).toBe(false);
    expect(src.maxWidth).toBe("62.5%");
  });

  // Guards the column-overflow regression: an object-src width inside a narrow
  // multi-column row pins (display intent) but clamps to 100% — so it fills the
  // column responsively via a percent, never a fixed px that overflows.
  it("a dimensioned image in a multi-column row pins but clamps to 100% (no overflow)", () => {
    const json: any = renderToJson(
      <Body>
        <Row cells={[1, 1, 1]}>
          <Column><Image src={{ url: "u", width: 400, height: 260 } as any} /></Column>
          <Column><Image src={{ url: "u", width: 400, height: 260 } as any} /></Column>
          <Column><Image src={{ url: "u", width: 400, height: 260 } as any} /></Column>
        </Row>
      </Body>
    );
    const src = json.body.rows[0].columns[0].contents[0].values.src;
    expect(src.autoWidth).toBe(false);
    expect(src.maxWidth).toBe("100%");
    expect(src.width).toBe(400);
  });
});

describe("DX: button sizing", () => {
  it("numeric width gets a px unit (200 → '200px') and pins", () => {
    const size = itemValues(<Button width={200}>Go</Button>).size;
    expect(size.width).toBe("200px");
    expect(size.autoWidth).toBe(false);
  });

  it("width '100%' is honored as a string", () => {
    expect(itemValues(<Button width="100%">Go</Button>).size.width).toBe("100%");
  });
});

describe("DX: font / CSS-idiom normalization", () => {
  it("fontFamily string applies the font (not blank)", () => {
    expect(html(<Heading fontFamily={"Georgia" as any}>x</Heading>)).toMatch(
      /font-family: ?Georgia/
    );
  });

  it("fontSize number gets a px unit", () => {
    expect(html(<Heading fontSize={28 as any}>x</Heading>)).toMatch(/font-size: ?28px/);
  });

  it("numeric-string fontWeight becomes a number", () => {
    expect(itemValues(<Heading fontWeight={"700" as any}>x</Heading>).fontWeight).toBe(700);
  });

  it("number lineHeight is stringified", () => {
    expect(html(<Paragraph lineHeight={1.4 as any}>x</Paragraph>)).toMatch(/line-height: ?1\.4/);
  });

  it("letterSpacing accepts em and a bare number (→px)", () => {
    expect(html(<Heading letterSpacing={"-0.01em" as any}>x</Heading>)).toMatch(
      /letter-spacing: ?-0\.01em/
    );
    expect(html(<Heading letterSpacing={2 as any}>x</Heading>)).toMatch(/letter-spacing: ?2px/);
  });
});

describe("DX: text components", () => {
  it("Heading level alias maps to the right tag", () => {
    expect(html(<Heading level={"h1" as any}>x</Heading>)).toMatch(/<h1/);
  });

  it("Heading renders h5/h6", () => {
    expect(html(<Heading headingType={"h5" as any}>x</Heading>)).toMatch(/<h5/);
  });

  it("Paragraph text shorthand renders", () => {
    expect(html(<Paragraph text={"Hi" as any} />)).toMatch(/<p>Hi<\/p>/);
  });

  it("JSX children flatten to text instead of [object Object]", () => {
    const out = html(<Heading>Hi <b>x</b></Heading>);
    expect(out).not.toMatch(/\[object Object\]/);
    expect(out).toMatch(/Hi x/);
  });
});

describe("DX: shorthands and JSON output", () => {
  it("Table columns/rows renders a grid instead of crashing", () => {
    const out = html(<Table columns={2} rows={2} />);
    expect(out).not.toMatch(/failed to render/i);
    expect((out.match(/<t[hd][\s>]/g) || []).length).toBeGreaterThan(0);
  });

  it("Table headers/data shorthand still renders cells", () => {
    const out = html(<Table headers={["A", "B"]} data={[["1", "2"]]} />);
    expect((out.match(/<t[hd][\s>]/g) || []).length).toBeGreaterThanOrEqual(3);
  });

  it("Column flat border props apply", () => {
    const border = (columnValues(
      <Column borderTopWidth={"2px" as any} borderTopColor={"#000" as any}>
        <Paragraph>x</Paragraph>
      </Column>
    ) as any).border;
    expect(border?.borderTopWidth).toBe("2px");
    expect(border?.borderTopColor).toBe("#000");
  });

  it("borderless column stays clean (no stray border)", () => {
    const border = (columnValues(
      <Column>
        <Paragraph>x</Paragraph>
      </Column>
    ) as any).border;
    expect(border?.borderTopWidth).toBeUndefined();
  });

  it("previewText maps to preheaderText in renderToJson", () => {
    const json = renderToJson(
      <Body previewText={"Hello inbox" as any}>
        <Row>
          <Column>
            <Paragraph>x</Paragraph>
          </Column>
        </Row>
      </Body>
    ) as any;
    expect(json.body.values.preheaderText).toBe("Hello inbox");
  });

  it("multi-value padding with a bare 0 renders", () => {
    const out = renderToHtml(
      <Body mode="web">
        <Row padding={"0 40px" as any}>
          <Column>
            <Paragraph>x</Paragraph>
          </Column>
        </Row>
      </Body>
    );
    expect(out).not.toMatch(/failed to render/i);
    expect(out).toMatch(/40px/);
  });

  // containerPadding (the item's content-wrapper padding) is a typed input now,
  // and a bare number is treated as px — same as the other size props.
  describe("containerPadding", () => {
    it("a numeric containerPadding renders as px on the content wrapper", () => {
      expect(html(<Paragraph html="x" containerPadding={14} />)).toMatch(/padding:\s*14px/);
    });

    it("a string containerPadding passes through", () => {
      expect(html(<Paragraph html="x" containerPadding="16px 24px" />)).toContain("16px 24px");
    });

    it("a numeric and the equivalent px-string render identically", () => {
      const a = html(<Paragraph html="x" containerPadding={14} />);
      const b = html(<Paragraph html="x" containerPadding="14px" />);
      expect(a).toBe(b);
    });
  });
});
