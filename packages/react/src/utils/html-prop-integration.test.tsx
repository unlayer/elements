import { describe, it, expect } from "vitest";
import { Body, Row, Column, Paragraph, renderToHtml } from "../index";
import { ColumnLayouts } from "../layouts/ColumnLayouts";

/** The <p> a Paragraph is: its html prop as elements, not as text with its tags in it. */
function paragraph(props: Record<string, unknown>, mode: "web" | "email" = "web"): HTMLElement {
  const html = renderToHtml(
    <Body mode={mode}>
      <Row layout={ColumnLayouts.OneColumn}>
        <Column>
          <Paragraph {...props} />
        </Column>
      </Row>
    </Body>
  );
  return new DOMParser().parseFromString(html, "text/html").querySelector("p")!;
}

describe("Paragraph html prop integration", () => {
  it("renders bold text via html prop in values", () => {
    const p = paragraph({ values: { html: "Hello <b>bold</b> world", fontSize: "14px" } });
    expect(p.textContent).toBe("Hello bold world");
    expect(p.querySelector<HTMLElement>('[style*="font-weight:700"]')?.textContent).toBe("bold");
  });

  it("renders italic text via html prop", () => {
    const p = paragraph({ values: { html: "Hello <i>italic</i> world", fontSize: "14px" } });
    expect(p.textContent).toBe("Hello italic world");
    expect(p.querySelector<HTMLElement>('[style*="font-style:italic"]')?.textContent).toBe("italic");
  });

  it("renders links via html prop", () => {
    const p = paragraph({ values: { html: 'Click <a href="https://example.com">here</a>', fontSize: "14px" } });
    expect(p.textContent).toBe("Click here");
    expect(p.querySelector('a[href="https://example.com"]')?.textContent).toBe("here");
  });

  it("renders mixed formatting via html prop", () => {
    const p = paragraph({ values: { html: 'Hello <b>bold</b> and <i>italic</i> and <a href="#">link</a>', fontSize: "14px" } });
    expect(p.textContent).toBe("Hello bold and italic and link");
    expect(p.querySelector('[style*="font-weight:700"]')?.textContent).toBe("bold");
    expect(p.querySelector('[style*="font-style:italic"]')?.textContent).toBe("italic");
    expect(p.querySelector('a[href="#"]')?.textContent).toBe("link");
  });

  it("html prop as top-level semantic prop, in an email too, with the block's own values", () => {
    for (const mode of ["web", "email"] as const) {
      const p = paragraph({ html: "Hello <b>bold</b> world", fontSize: "23px" }, mode);
      expect(p.textContent).toBe("Hello bold world");
      expect(p.querySelector('[style*="font-weight:700"]')?.textContent).toBe("bold");
      expect(p.getAttribute("style")).toContain("font-size:23px");
    }
  });
});
