import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import Body from "./Body";
import Row from "./Row";
import { Column } from "./Column";
import Paragraph from "./Paragraph";
import Heading from "./Heading";
import Email from "./Email";
import Page from "./Page";
import Document from "./Document";
import { renderToHtml } from "../utils/render-to-html";
import { renderRowToJson, renderToJson } from "../utils/render-to-json";

describe("Row Component", () => {
  it("renders row container with correct ID", () => {
    const { container } = render(
      <Body>
        <Row>
          <Column><Paragraph>Content</Paragraph></Column>
        </Row>
      </Body>
    );
    expect(container.querySelector("#u_row_1")).not.toBeNull();
  });

  it("renders column children inside the row", () => {
    const { container } = render(
      <Body>
        <Row>
          <Column><Paragraph>Row content</Paragraph></Column>
        </Row>
      </Body>
    );
    expect(container.textContent).toContain("Row content");
    expect(container.querySelector("#u_column_1")).not.toBeNull();
  });

  it("applies backgroundColor", () => {
    const { container } = render(
      <Body>
        <Row backgroundColor="#eeeeee">
          <Column><Paragraph>Styled row</Paragraph></Column>
        </Row>
      </Body>
    );
    expect(container.innerHTML).toContain("#eeeeee");
  });

  it("renders responsive CSS with media queries", () => {
    const { container } = render(
      <Body>
        <Row>
          <Column><Paragraph>Responsive</Paragraph></Column>
        </Row>
      </Body>
    );
    const style = container.querySelector("style");
    expect(style).not.toBeNull();
    expect(style!.textContent).toContain("@media");
    expect(style!.textContent).toContain("u-row");
  });

  it("uses table layout in email mode", () => {
    const { container } = render(
      <Body mode="email">
        <Row>
          <Column><Paragraph>Email</Paragraph></Column>
        </Row>
      </Body>
    );
    expect(container.innerHTML).toContain("mso");
    expect(container.querySelector('table[role="presentation"]')).not.toBeNull();
  });

  it("keeps columns side by side on phones with noStackMobile, in both modes", () => {
    for (const mode of ["email", "web"] as const) {
      const { container } = render(
        <Body mode={mode}>
          <Row cells={[1, 1]} noStackMobile>
            <Column><Paragraph>A</Paragraph></Column>
            <Column><Paragraph>B</Paragraph></Column>
          </Row>
        </Body>
      );
      expect(container.querySelector(".u-row.no-stack")).not.toBeNull();
    }
  });

  it("has correct displayName", () => {
    expect(Row.displayName).toBe("Row");
  });
});

describe("Row layout with columns from components", () => {
  it("counts the columns a Fragment or a component gives", async () => {
    const { ColumnLayouts } = await import("../index");
    const Pair = () => (
      <>
        <Column><Paragraph>Left column words</Paragraph></Column>
        <Column><Paragraph>Right column words</Paragraph></Column>
      </>
    );
    const html = renderToHtml(<Email><Row layout={ColumnLayouts.TwoEqual}><Pair /></Row></Email>);
    expect(html).toContain("Left column words");
    expect(html).toContain("Right column words");
  });

  describe("padding: the editor's, around the row, in every mode", () => {
    type Props = Record<string, unknown>;
    const ROOTS = { Email, Page, Document } as const;
    const template = (Root: (typeof ROOTS)[keyof typeof ROOTS], row: Props, columns: Props[] = [{}]) => (
      <Root>
        <Row {...row}>
          {columns.map((props, i) => (
            <Column key={i} {...props}>
              <Paragraph>Words {i}</Paragraph>
            </Column>
          ))}
        </Row>
      </Root>
    );
    const ADVICE = "[Unlayer] Row padding sits outside the row's content background, as in the editor; to inset the content use the Columns' padding.";

    it.each(Object.keys(ROOTS) as Array<keyof typeof ROOTS>)("%s: on the row, its phone padding too; the Columns keep theirs", (mode) => {
      const element = template(ROOTS[mode], { padding: "44px 48px 8px", mobile: { padding: "12px" } }, [{ padding: "4px" }, {}]);
      const { values, columns } = renderToJson(element).body.rows[0];
      expect(values.padding).toBe("44px 48px 8px");
      expect(values._override.mobile.padding).toBe("12px");
      expect(columns.map((c: { values: Record<string, any> }) => [c.values.padding, c.values._override?.mobile?.padding])).toEqual([["4px", undefined], ["0px", undefined]]);
      const html = renderToHtml(element);
      expect(html).toMatch(/<div id="u_row_1" class="[^"]*v-row-padding[^"]*" style="padding: 44px 48px 8px;/);
      expect(html).toMatch(/class="v-col-padding"[^>]*padding: ?4px;/);
      // A document has no phones.
      if (mode !== "Document") expect(html).toContain("#u_row_1.v-row-padding { padding: 12px !important; }");
    });

    it.each(Object.keys(ROOTS) as Array<keyof typeof ROOTS>)("%s: says, once per render, that it's outside a content background", (mode) => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      try {
        const said = (row: Props) => {
          warn.mockClear();
          renderToHtml(template(ROOTS[mode], row, [{}, {}]));
          return warn.mock.calls.map((call) => String(call[0]));
        };
        // A content background: the content-width color, or an image there (not full width).
        expect(said({ padding: 32, columnsBackgroundColor: "#ffffff" })).toEqual([ADVICE]);
        expect(said({ padding: "0 24px", backgroundImage: { url: "https://example.com/a.png", fullWidth: false } })).toEqual([ADVICE]);
        expect(said({ values: { padding: "20px", columnsBackgroundColor: "#fff" } })).toEqual([ADVICE]);
        // None: no padding, a 0 one, a full-width band behind the row, or no background.
        for (const row of [{ columnsBackgroundColor: "#ffffff" }, { padding: "0px", columnsBackgroundColor: "#ffffff" }, { padding: 32, backgroundColor: "#ffffff" }, { padding: 32 }, { padding: 32, columnsBackgroundColor: "transparent" }, { padding: 32, backgroundImage: { url: "https://example.com/a.png", fullWidth: true } }]) {
          expect(said(row)).toEqual([]);
        }
        // Once per render, for every row that has it.
        warn.mockClear();
        renderToHtml(
          <Email>
            <Row padding={16} columnsBackgroundColor="#fff"><Column /></Row>
            <Row padding={16} columnsBackgroundColor="#fff"><Column /></Row>
          </Email>
        );
        expect(warn).toHaveBeenCalledTimes(1);
      } finally {
        warn.mockRestore();
      }
    });

    it("is the same in renderRowToJson", () => {
      const row = renderRowToJson(
        <Row padding={24}>
          <Column><Paragraph>A</Paragraph></Column>
          <Column><Paragraph>B</Paragraph></Column>
        </Row>
      );
      expect(row.values.padding).toBe("24px");
      expect(row.columns.map((c) => c.values.padding)).toEqual(["0px", "0px"]);
    });
  });

  describe("backgroundImage: the editor's defaults where it sets none, in the HTML as in the design", () => {
    const ROOTS = { Email, Page, Document } as const;
    const URL = "https://example.com/bg.png";
    const template = (Root: (typeof ROOTS)[keyof typeof ROOTS], backgroundImage: Record<string, unknown>) => (
      <Root>
        <Row backgroundImage={backgroundImage as never}>
          <Column><Heading>Over the image</Heading></Column>
        </Row>
      </Root>
    );
    /** Where the HTML paints the image: the row's full width (outer) or its content box (inner). */
    const where = (html: string) => [...html.matchAll(/v-row-background-image--(outer|inner)[^"]*" style="[^"]*background-image: url\('([^']*)'\)/g)].map((m) => m[1]);

    it.each(Object.keys(ROOTS) as Array<keyof typeof ROOTS>)("%s: full width unless it says otherwise", (mode) => {
      const Root = ROOTS[mode];
      // Without `fullWidth`: the editor's default, full width, as the design has it.
      const omitted = renderToHtml(template(Root, { url: URL }));
      expect(omitted).toBe(renderToHtml(template(Root, { url: URL, fullWidth: true, repeat: "no-repeat", size: "custom", position: "center" })));
      expect(new Set(where(omitted))).toEqual(new Set(["outer"]));
      expect(renderToJson(template(Root, { url: URL })).body.rows[0].values.backgroundImage).toEqual({ url: URL, fullWidth: true, repeat: "no-repeat", size: "custom", position: "center" });
      // `fullWidth: false`: in the content box, its other settings the editor's defaults too.
      const boxed = renderToHtml(template(Root, { url: URL, fullWidth: false }));
      expect(new Set(where(boxed))).toEqual(new Set(["inner"]));
      expect(boxed).toBe(renderToHtml(template(Root, { url: URL, fullWidth: false, repeat: "no-repeat", size: "custom", position: "center" })));
      expect(renderToJson(template(Root, { url: URL, fullWidth: false })).body.rows[0].values.backgroundImage).toMatchObject({ fullWidth: false, position: "center" });
    });

    it.each(Object.keys(ROOTS) as Array<keyof typeof ROOTS>)("%s: a URL with quotes, brackets or spaces is whole in the CSS, as given in the design", (mode) => {
      const Root = ROOTS[mode];
      const odd = "https://example.com/it's (big) photo.png";
      const encoded = "https://example.com/it%27s%20%28big%29%20photo.png";
      for (const fullWidth of [true, false]) {
        const element = (
          <Root backgroundImage={{ url: odd, fullWidth: true } as never}>
            <Row backgroundImage={{ url: odd, fullWidth }}>
              <Column><Heading>Over the image</Heading></Column>
            </Row>
          </Root>
        );
        const html = renderToHtml(element);
        // Every `url('…')` holds the whole address, its quote, brackets and spaces percent-encoded (a browser's same URL).
        const urls = [...html.matchAll(/url\('([^']*)'\)/g)].map((m) => m[1]);
        expect(urls.length).toBeGreaterThan(0);
        expect(new Set(urls)).toEqual(new Set([encoded]));
        expect(decodeURI(encoded)).toBe(odd);
        expect(html).not.toContain("it's");
        // The row's style attribute is whole: its background image is the image, not cut off.
        const doc = new DOMParser().parseFromString(html, "text/html");
        const boxes = [...doc.querySelectorAll<HTMLElement>("[style*=background-image]")];
        expect(boxes.length).toBeGreaterThan(0);
        for (const box of boxes) expect(box.style.backgroundImage).toContain("it%27s%20%28big%29%20photo.png");
        // The design keeps the URL as given.
        const design = renderToJson(element);
        expect([design.body.values.backgroundImage.url, design.body.rows[0].values.backgroundImage.url]).toEqual([odd, odd]);
      }
    });

    it.each(Object.keys(ROOTS) as Array<keyof typeof ROOTS>)("%s: code generated from the design renders the same HTML", async (mode) => {
      const { designToElements } = await import("../codegen/design-to-elements");
      const { evaluate } = await import("../codegen/test-harness");
      for (const backgroundImage of [{ url: URL }, { url: URL, fullWidth: false }]) {
        const element = template(ROOTS[mode], backgroundImage);
        const design = renderToJson(element);
        const { code } = designToElements(design as never, { displayMode: ({ Email: "email", Page: "web", Document: "document" } as const)[mode] });
        // (The editor's default, full width, isn't written.)
        expect(code.includes("fullWidth")).toBe(backgroundImage.fullWidth === false);
        // The code renders as the design's settings, written out, do (and as the template it came from).
        const html = renderToHtml(React.createElement(evaluate(code)));
        expect(html).toBe(renderToHtml(template(ROOTS[mode], design.body.rows[0].values.backgroundImage as Record<string, unknown>)));
        expect(html).toBe(renderToHtml(element));
      }
    });
  });
});
