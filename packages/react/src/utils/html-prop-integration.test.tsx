import { describe, it, expect } from "vitest";
import { renderToHtml, Body, Row, Column, Paragraph } from "../index";
import { ColumnLayouts } from "../layouts/ColumnLayouts";

describe("Paragraph html prop integration", () => {
  it("renders bold text via html prop in values", () => {
    const html = renderToHtml(
      <Body mode="web">
        <Row layout={ColumnLayouts.OneColumn}>
          <Column>
            <Paragraph
              values={{
                html: "Hello <b>bold</b> world",
                fontSize: "14px",
              }}
            />
          </Column>
        </Row>
      </Body>
    );
    expect(html).toContain("<b>");
    expect(html).toContain("bold");
    expect(html).toContain("Hello");
    expect(html).toContain("world");
  });

  it("renders italic text via html prop", () => {
    const html = renderToHtml(
      <Body mode="web">
        <Row layout={ColumnLayouts.OneColumn}>
          <Column>
            <Paragraph
              values={{
                html: "Hello <i>italic</i> world",
                fontSize: "14px",
              }}
            />
          </Column>
        </Row>
      </Body>
    );
    expect(html).toContain("<i>");
    expect(html).toContain("italic");
  });

  it("renders links via html prop", () => {
    const html = renderToHtml(
      <Body mode="web">
        <Row layout={ColumnLayouts.OneColumn}>
          <Column>
            <Paragraph
              values={{
                html: 'Click <a href="https://example.com">here</a>',
                fontSize: "14px",
              }}
            />
          </Column>
        </Row>
      </Body>
    );
    expect(html).toContain("href");
    expect(html).toContain("example.com");
    expect(html).toContain("here");
  });

  it("renders mixed formatting via html prop", () => {
    const html = renderToHtml(
      <Body mode="web">
        <Row layout={ColumnLayouts.OneColumn}>
          <Column>
            <Paragraph
              values={{
                html: 'Hello <b>bold</b> and <i>italic</i> and <a href="#">link</a>',
                fontSize: "14px",
              }}
            />
          </Column>
        </Row>
      </Body>
    );
    expect(html).toContain("<b>");
    expect(html).toContain("<i>");
    expect(html).toContain("href");
  });

  it("html prop as top-level semantic prop", () => {
    const html = renderToHtml(
      <Body mode="web">
        <Row layout={ColumnLayouts.OneColumn}>
          <Column>
            <Paragraph html="Hello <b>bold</b> world" fontSize="14px" />
          </Column>
        </Row>
      </Body>
    );
    expect(html).toContain("<b>");
    expect(html).toContain("bold");
  });
});
