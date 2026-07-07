/**
 * Pre-launch hardening contracts:
 * - Fragments are transparent to the render/json/head walkers
 * - UnlayerProvider config actually drives rendering (prop still wins)
 * - renderToHtml fails loudly by default; onError: "render-fallback" opts out
 * - <Row cells> is validated against the column count
 * - Column warns about (instead of silently dropping) unsupported children
 *   and renders memo/forwardRef-wrapped Unlayer components
 */
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToHtml, renderToHtmlParts } from "./utils/render-to-html";
import { renderToJson } from "./utils/render-to-json";
import { UnlayerProvider } from "./context/UnlayerProvider";
import Email from "./components/Email";
import Body from "./components/Body";
import Row from "./components/Row";
import Column from "./components/Column";
import Button from "./components/Button";
import Paragraph from "./components/Paragraph";

const paragraphRow = (
  <Row>
    <Column>
      <Paragraph>x</Paragraph>
    </Column>
  </Row>
);

describe("Fragments are transparent", () => {
  it("a Fragment-wrapped Row renders in the Email's mode with its contentWidth", () => {
    const direct = renderToHtml(
      <Email contentWidth="600px">{paragraphRow}</Email>
    );
    const wrapped = renderToHtml(
      <Email contentWidth="600px">
        <>{paragraphRow}</>
      </Email>
    );
    // Same email markup: the 600px content width reaches the row either way.
    expect(direct).toContain("max-width: 620px");
    expect(wrapped).toContain("max-width: 620px");
    expect(wrapped).not.toContain("max-width: 480px");
  });

  it("renderToJson sees rows behind a Fragment", () => {
    const json = renderToJson(
      <Email>
        <>{paragraphRow}</>
      </Email>
    );
    expect(json.body.rows).toHaveLength(1);
  });

  it("head extraction sees rows behind a Fragment", () => {
    const direct = renderToHtmlParts(<Email>{paragraphRow}</Email>);
    const wrapped = renderToHtmlParts(
      <Email>
        <>{paragraphRow}</>
      </Email>
    );
    expect(wrapped.css).toBe(direct.css);
  });

  it("a Fragment-wrapped Column still counts for the row layout", () => {
    const html = renderToHtml(
      <Email>
        <Row>
          <>
            <Column>
              <Paragraph>a</Paragraph>
            </Column>
            <Column>
              <Paragraph>b</Paragraph>
            </Column>
          </>
        </Row>
      </Email>
    );
    expect(html).not.toContain("NaN");
  });
});

describe("UnlayerProvider drives rendering", () => {
  it("provider mode=email produces email markup from a plain Body", () => {
    const html = renderToHtml(
      <UnlayerProvider config={{ mode: "email" }}>
        <Body>{paragraphRow}</Body>
      </UnlayerProvider>
    );
    // Email output is table-based with MSO conditionals; web output is not.
    expect(html).toContain("mso");
    expect(html).toContain("<!DOCTYPE HTML PUBLIC");
  });

  it("an explicit config prop wins over the provider", () => {
    const html = renderToHtml(
      <UnlayerProvider config={{ mode: "email" }}>
        <Body config={{ mode: "web" }}>{paragraphRow}</Body>
      </UnlayerProvider>
    );
    expect(html).toMatch(/<!doctype html>/i);
    expect(html).not.toContain("OfficeDocumentSettings");
  });

  it("renderToHtml options win over the provider", () => {
    const html = renderToHtml(
      <UnlayerProvider config={{ mode: "email" }}>
        <Body>{paragraphRow}</Body>
      </UnlayerProvider>,
      { mode: "web" }
    );
    expect(html).toMatch(/<!doctype html>/i);
    expect(html).not.toContain("OfficeDocumentSettings");
  });

  it("head extraction works through a provider root", () => {
    const direct = renderToHtmlParts(<Email>{paragraphRow}</Email>);
    const throughProvider = renderToHtmlParts(
      <UnlayerProvider config={{}}>
        <Email>{paragraphRow}</Email>
      </UnlayerProvider>
    );
    expect(throughProvider.css).toBe(direct.css);
  });
});

describe("error handling", () => {
  const Boom = () => {
    throw new Error("boom");
  };

  it("renderToHtml throws by default when a child fails", () => {
    expect(() =>
      renderToHtml(
        <Email>
          <Row>
            <Column>
              <Boom />
            </Column>
          </Row>
        </Email>
      )
    ).toThrow(/boom/);
  });

  it("onError: render-fallback keeps sibling blocks and omits only the failing one", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const html = renderToHtml(
      <Email>
        <Row>
          <Column>
            <Paragraph>before</Paragraph>
            <Boom />
            <Paragraph>after</Paragraph>
          </Column>
        </Row>
      </Email>,
      { onError: "render-fallback" }
    );
    expect(html).toContain("before");
    expect(html).toContain("after");
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("a cells/column-count mismatch throws a clear error", () => {
    expect(() =>
      renderToHtml(
        <Email>
          <Row cells={[1, 1]}>
            <Column><Paragraph>a</Paragraph></Column>
            <Column><Paragraph>b</Paragraph></Column>
            <Column><Paragraph>c</Paragraph></Column>
          </Row>
        </Email>
      )
    ).toThrow(/cells/);
  });

  it("non-positive cell spans throw a clear error", () => {
    expect(() =>
      renderToHtml(
        <Email>
          <Row cells={[0, 0]}>
            <Column><Paragraph>a</Paragraph></Column>
            <Column><Paragraph>b</Paragraph></Column>
          </Row>
        </Email>
      )
    ).toThrow(/positive/);
  });
});

describe("Column child handling", () => {
  it("warns when a host element child is skipped", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    renderToHtml(
      <Email>
        <Row>
          <Column>
            <div>raw div</div>
            <Paragraph>kept</Paragraph>
          </Column>
        </Row>
      </Email>,
      { onError: "render-fallback" }
    );
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("<div>"));
    warn.mockRestore();
  });

  it("renders a React.memo-wrapped Unlayer component", () => {
    const MemoButton = React.memo(Button);
    const html = renderToHtml(
      <Email>
        <Row>
          <Column>
            <MemoButton href="https://example.com">Wrapped</MemoButton>
          </Column>
        </Row>
      </Email>
    );
    expect(html).toContain("Wrapped");
    expect(html).toContain("https://example.com");
  });
});
