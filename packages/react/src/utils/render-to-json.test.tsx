import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToJson, renderRowToJson } from "./render-to-json";
import Body from "../components/Body";
import Row from "../components/Row";
import Column from "../components/Column";
import Paragraph from "../components/Paragraph";
import Button from "../components/Button";
import Heading from "../components/Heading";
import Image from "../components/Image";
import Divider from "../components/Divider";
import Email from "../components/Email";
import Page from "../components/Page";
import Document from "../components/Document";
import { ColumnLayouts } from "../layouts/ColumnLayouts";

describe("renderToJson", () => {
  it("produces a valid DesignJSON structure", () => {
    const design = renderToJson(
      <Body>
        <Row>
          <Column>
            <Paragraph>Hello</Paragraph>
          </Column>
        </Row>
      </Body>
    );

    expect(design).toHaveProperty("schemaVersion", 24);
    expect(design).toHaveProperty("counters");
    expect(design).toHaveProperty("body");
    expect(design.body).toHaveProperty("rows");
    expect(design.body).toHaveProperty("values");
  });

  it("tracks counters for rows, columns, and items", () => {
    const design = renderToJson(
      <Body>
        <Row>
          <Column>
            <Paragraph>One</Paragraph>
            <Button>Two</Button>
          </Column>
        </Row>
        <Row>
          <Column>
            <Paragraph>Three</Paragraph>
          </Column>
        </Row>
      </Body>
    );

    expect(design.counters.u_row).toBe(2);
    expect(design.counters.u_column).toBe(2);
    expect(design.counters.u_content_text).toBe(2);
    expect(design.counters.u_content_button).toBe(1);
  });

  it("maps Paragraph to type 'text'", () => {
    const design = renderToJson(
      <Body>
        <Row>
          <Column>
            <Paragraph>Hello</Paragraph>
          </Column>
        </Row>
      </Body>
    );

    const content = design.body.rows[0].columns[0].contents[0];
    expect(content.type).toBe("text");
    // Should have text (HTML), not textJson
    expect(content.values.text).toBeDefined();
    expect(content.values.textJson).toBeUndefined();
  });

  it("maps other components to lowercase type", () => {
    const design = renderToJson(
      <Body>
        <Row>
          <Column>
            <Button>Click</Button>
            <Heading>Title</Heading>
          </Column>
        </Row>
      </Body>
    );

    const contents = design.body.rows[0].columns[0].contents;
    expect(contents[0].type).toBe("button");
    expect(contents[1].type).toBe("heading");
  });

  it("extracts body semantic props into values", () => {
    const design = renderToJson(
      <Body backgroundColor="#ffffff" contentWidth="600px">
        <Row>
          <Column>
            <Paragraph>Test</Paragraph>
          </Column>
        </Row>
      </Body>
    );

    expect(design.body.values.backgroundColor).toBe("#ffffff");
    expect(design.body.values.contentWidth).toBe("600px");
  });

  it("extracts row semantic props into values", () => {
    const design = renderToJson(
      <Body>
        <Row backgroundColor="#eeeeee" padding="10px">
          <Column>
            <Paragraph>Test</Paragraph>
          </Column>
        </Row>
      </Body>
    );

    const rowValues = design.body.rows[0].values;
    expect(rowValues.backgroundColor).toBe("#eeeeee");
    expect(rowValues.padding).toBe("10px");
  });

  it("extracts column semantic props into values", () => {
    const design = renderToJson(
      <Body>
        <Row>
          <Column padding="20px" backgroundColor="#dddddd">
            <Paragraph>Test</Paragraph>
          </Column>
        </Row>
      </Body>
    );

    const colValues = design.body.rows[0].columns[0].values;
    expect(colValues.padding).toBe("20px");
    expect(colValues.backgroundColor).toBe("#dddddd");
  });

  it("extracts item semantic props via propMapper", () => {
    const design = renderToJson(
      <Body>
        <Row>
          <Column>
            <Button fontSize="20px">Click me</Button>
          </Column>
        </Row>
      </Body>
    );

    const itemValues = design.body.rows[0].columns[0].contents[0].values;
    expect(itemValues.fontSize).toBe("20px");
    expect(itemValues.text).toBe("Click me");
  });

  it("generates unique IDs via _meta.htmlID", () => {
    const design = renderToJson(
      <Body>
        <Row>
          <Column>
            <Paragraph>A</Paragraph>
            <Button>B</Button>
          </Column>
          <Column>
            <Paragraph>C</Paragraph>
          </Column>
        </Row>
        <Row>
          <Column>
            <Paragraph>D</Paragraph>
          </Column>
        </Row>
      </Body>
    );

    // Collect all htmlIDs from _meta
    const ids: string[] = [design.body.values._meta.htmlID];
    for (const row of design.body.rows) {
      ids.push(row.values._meta.htmlID);
      for (const col of row.columns) {
        ids.push(col.values._meta.htmlID);
        for (const content of col.contents) {
          ids.push(content.values._meta.htmlID);
        }
      }
    }

    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("uses layout prop to determine cells array", () => {
    const design = renderToJson(
      <Body>
        <Row layout={ColumnLayouts.TwoEqual}>
          <Column>
            <Paragraph>Left</Paragraph>
          </Column>
          <Column>
            <Paragraph>Right</Paragraph>
          </Column>
        </Row>
      </Body>
    );

    expect(design.body.rows[0].cells).toEqual([1, 1]);
  });

  it("uses cells prop directly when provided", () => {
    const design = renderToJson(
      <Body>
        <Row cells={[2, 1]}>
          <Column>
            <Paragraph>Wide</Paragraph>
          </Column>
          <Column>
            <Paragraph>Narrow</Paragraph>
          </Column>
        </Row>
      </Body>
    );

    expect(design.body.rows[0].cells).toEqual([2, 1]);
  });

  it("defaults cells to [1] per Column child", () => {
    const design = renderToJson(
      <Body>
        <Row>
          <Column>
            <Paragraph>One</Paragraph>
          </Column>
          <Column>
            <Paragraph>Two</Paragraph>
          </Column>
          <Column>
            <Paragraph>Three</Paragraph>
          </Column>
        </Row>
      </Body>
    );

    expect(design.body.rows[0].cells).toEqual([1, 1, 1]);
  });

  it("works with Email wrapper", () => {
    const design = renderToJson(
      <Email>
        <Row>
          <Column>
            <Paragraph>Email content</Paragraph>
          </Column>
        </Row>
      </Email>
    );

    expect(design.schemaVersion).toBe(24);
    expect(design.body.rows).toHaveLength(1);
  });

  it("works with Page wrapper", () => {
    const design = renderToJson(
      <Page>
        <Row>
          <Column>
            <Paragraph>Page content</Paragraph>
          </Column>
        </Row>
      </Page>
    );

    expect(design.schemaVersion).toBe(24);
    expect(design.body.rows).toHaveLength(1);
  });

  it("works with Document wrapper", () => {
    const design = renderToJson(
      <Document>
        <Row>
          <Column>
            <Paragraph>Document content</Paragraph>
          </Column>
        </Row>
      </Document>
    );

    expect(design.schemaVersion).toBe(24);
    expect(design.body.rows).toHaveLength(1);
  });

  it("supports values escape hatch on Body", () => {
    const design = renderToJson(
      <Body values={{ backgroundColor: "#000000", contentWidth: "800px" }}>
        <Row>
          <Column>
            <Paragraph>Test</Paragraph>
          </Column>
        </Row>
      </Body>
    );

    expect(design.body.values.backgroundColor).toBe("#000000");
    expect(design.body.values.contentWidth).toBe("800px");
  });

  it("throws on non-Body root element", () => {
    expect(() =>
      renderToJson(<Paragraph>Not a body</Paragraph>)
    ).toThrow("Root element must be <Body>");
  });

  it("unwraps a user wrapper component down to its root (parity with renderToHtml)", () => {
    const MyEmail = () => (
      <Email contentWidth="600px">
        <Row layout={ColumnLayouts.OneColumn}>
          <Column>
            <Heading>Wrapped</Heading>
          </Column>
        </Row>
      </Email>
    );
    const design = renderToJson(<MyEmail />);
    expect(design.body.rows.length).toBe(1);
    expect(design.body.rows[0].columns.length).toBe(1);
  });

  it("still throws when a wrapper does not resolve to a valid root", () => {
    const NotARoot = () => <Paragraph>nope</Paragraph>;
    expect(() => renderToJson(<NotARoot />)).toThrow("Root element must be <Body>");
  });

  it("rethrows an actionable error when a wrapper throws while unwrapping", () => {
    const Boom = (): React.ReactElement => {
      throw new Error("invalid hook call");
    };
    expect(() => renderToJson(<Boom />)).toThrow("could not unwrap");
  });

  it("generates _meta at all levels", () => {
    const design = renderToJson(
      <Body>
        <Row>
          <Column>
            <Paragraph>Test</Paragraph>
          </Column>
        </Row>
      </Body>
    );

    // Body _meta
    expect(design.body.values._meta).toBeDefined();
    expect(design.body.values._meta.htmlID).toBe("u_body");
    expect(design.body.values._meta.htmlClassNames).toBe("u_body");

    // Row _meta
    const rowMeta = design.body.rows[0].values._meta;
    expect(rowMeta).toBeDefined();
    expect(rowMeta.htmlID).toBe("u_row_1");
    expect(rowMeta.htmlClassNames).toBe("u_row");

    // Column _meta
    const colMeta = design.body.rows[0].columns[0].values._meta;
    expect(colMeta).toBeDefined();
    expect(colMeta.htmlID).toBe("u_column_1");
    expect(colMeta.htmlClassNames).toBe("u_column");

    // Item _meta
    const itemMeta = design.body.rows[0].columns[0].contents[0].values._meta;
    expect(itemMeta).toBeDefined();
    expect(itemMeta.htmlID).toBe("u_content_text_1");
    expect(itemMeta.htmlClassNames).toBe("u_content_text");
  });

  it("merges default values with user-provided values for items", () => {
    const design = renderToJson(
      <Body>
        <Row>
          <Column>
            <Button fontSize="24px">Big Button</Button>
          </Column>
        </Row>
      </Body>
    );

    const buttonValues = design.body.rows[0].columns[0].contents[0].values;

    // User-provided value
    expect(buttonValues.fontSize).toBe("24px");
    // Default value preserved
    expect(buttonValues.borderRadius).toBe("4px");
    expect(buttonValues.textAlign).toBe("center");
    // Children mapped to text
    expect(buttonValues.text).toBe("Big Button");
  });

  it("handles multiple items in a single column", () => {
    const design = renderToJson(
      <Body>
        <Row>
          <Column>
            <Heading>Title</Heading>
            <Paragraph>Body text</Paragraph>
            <Button>CTA</Button>
            <Divider />
          </Column>
        </Row>
      </Body>
    );

    const contents = design.body.rows[0].columns[0].contents;
    expect(contents).toHaveLength(4);
    expect(contents[0].type).toBe("heading");
    expect(contents[1].type).toBe("text");
    expect(contents[2].type).toBe("button");
    expect(contents[3].type).toBe("divider");
  });

  it("preserves row cells in values", () => {
    const design = renderToJson(
      <Body>
        <Row cells={[1, 2, 1]}>
          <Column><Paragraph>A</Paragraph></Column>
          <Column><Paragraph>B</Paragraph></Column>
          <Column><Paragraph>C</Paragraph></Column>
        </Row>
      </Body>
    );

    expect(design.body.rows[0].cells).toEqual([1, 2, 1]);
    expect(design.body.rows[0].values.cells).toEqual([1, 2, 1]);
  });

  it("handles empty body with no rows", () => {
    const design = renderToJson(<Body />);

    expect(design.body.rows).toEqual([]);
    expect(design.counters).toEqual({});
  });

  it("preserves Email wrapper semantic props", () => {
    const design = renderToJson(
      <Email backgroundColor="#000" contentWidth="700px">
        <Row>
          <Column>
            <Paragraph>Dark email</Paragraph>
          </Column>
        </Row>
      </Email>
    );

    expect(design.body.values.backgroundColor).toBe("#000");
    expect(design.body.values.contentWidth).toBe("700px");
  });

  it("includes containerPadding and editor flags on items", () => {
    const design = renderToJson(
      <Body>
        <Row>
          <Column>
            <Paragraph>Test</Paragraph>
          </Column>
        </Row>
      </Body>
    );

    const itemValues = design.body.rows[0].columns[0].contents[0].values;
    expect(itemValues.containerPadding).toBe("10px");
    expect(itemValues.selectable).toBe(true);
    expect(itemValues.draggable).toBe(true);
    expect(itemValues.deletable).toBe(true);
  });

  it("includes columns flag on row values", () => {
    const design = renderToJson(
      <Body>
        <Row>
          <Column>
            <Paragraph>Test</Paragraph>
          </Column>
        </Row>
      </Body>
    );

    expect(design.body.rows[0].values.columns).toBe(false);
  });

  it("warns when non-Column child is in Row", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const design = renderToJson(
      <Body>
        <Row>
          <Paragraph>Wrong child</Paragraph>
        </Row>
      </Body>
    );

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("is not a valid Row child")
    );
    // Row produces zero columns since none were valid
    expect(design.body.rows[0].columns).toHaveLength(0);

    warnSpy.mockRestore();
  });

  it("warns when non-Row child is in Body", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const design = renderToJson(
      <Body>
        <Paragraph>Wrong child</Paragraph>
      </Body>
    );

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("is not a valid Body child")
    );
    // Body produces zero rows since none were valid
    expect(design.body.rows).toHaveLength(0);

    warnSpy.mockRestore();
  });
});

describe("renderRowToJson", () => {
  it("produces a valid DesignRow structure", () => {
    const row = renderRowToJson(
      <Row>
        <Column>
          <Paragraph>Hello</Paragraph>
        </Column>
      </Row>
    );

    expect(row).toHaveProperty("cells");
    expect(row).toHaveProperty("columns");
    expect(row).toHaveProperty("values");
    expect(row.columns).toHaveLength(1);
    expect(row.columns[0].contents[0].type).toBe("text");
  });

  it("throws on non-Row element", () => {
    expect(() =>
      renderRowToJson(<Paragraph>Not a row</Paragraph>)
    ).toThrow("Element must be <Row>");
  });

  it("handles cells and layout props", () => {
    const row = renderRowToJson(
      <Row layout={ColumnLayouts.TwoEqual}>
        <Column>
          <Paragraph>Left</Paragraph>
        </Column>
        <Column>
          <Paragraph>Right</Paragraph>
        </Column>
      </Row>
    );

    expect(row.cells).toEqual([1, 1]);
    expect(row.columns).toHaveLength(2);
  });

  it("includes _meta and editor flags", () => {
    const row = renderRowToJson(
      <Row>
        <Column>
          <Paragraph>Test</Paragraph>
        </Column>
      </Row>
    );

    expect(row.values._meta.htmlID).toBe("u_row_1");
    expect(row.values.selectable).toBe(true);
    expect(row.values.draggable).toBe(true);
  });

  it("processes multiple columns and items", () => {
    const row = renderRowToJson(
      <Row cells={[2, 1]}>
        <Column>
          <Heading>Title</Heading>
          <Paragraph>Body</Paragraph>
        </Column>
        <Column>
          <Button>CTA</Button>
        </Column>
      </Row>
    );

    expect(row.cells).toEqual([2, 1]);
    expect(row.columns[0].contents).toHaveLength(2);
    expect(row.columns[1].contents).toHaveLength(1);
    expect(row.columns[0].contents[0].type).toBe("heading");
    expect(row.columns[1].contents[0].type).toBe("button");
  });
});
