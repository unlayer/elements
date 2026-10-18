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
import { renderToHtml } from "./render-to-html";
import { RenderError } from "@unlayer-internal/shared-elements";
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

    expect(design).toHaveProperty("schemaVersion", 27);
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

    expect(design.schemaVersion).toBe(27);
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

    expect(design.schemaVersion).toBe(27);
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

    expect(design.schemaVersion).toBe(27);
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

  it("throws what a wrapper throws as renderToHtml does (a RenderError naming it), and says what to do for an async one", () => {
    const cause = new Error("no data");
    const Boom = (): React.ReactElement => {
      throw cause;
    };
    for (const render of [() => renderToJson(<Boom />), () => renderToHtml(<Boom />)]) {
      expect(render).toThrow(RenderError);
      expect(render).toThrow(/^\[Unlayer\] no data \(in <Boom>\)$/);
    }
    expect(() => renderToJson(<Boom />)).toThrow(expect.objectContaining({ component: "Boom", cause }));
    const Later = async () => <Email />;
    expect(() => renderToJson(<Later />)).toThrow(
      `[Unlayer] renderToJson: could not unwrap <Later>. Pass the root element (<Email>…</Email>), or a function component that returns one. (async and suspending templates need "@unlayer/react-elements/async"'s renderers, or their data loaded first and passed as props)`
    );
  });

  it("unwraps a wrapper that uses hooks, also while the app is rendering", () => {
    const { render: mount } = require("@testing-library/react") as typeof import("@testing-library/react");
    const WithHooks = () => {
      const [title] = React.useState("Hooked");
      React.useId();
      return (
        <Email>
          <Row layout={ColumnLayouts.OneColumn}>
            <Column>
              <Heading>{title}</Heading>
            </Column>
          </Row>
        </Email>
      );
    };
    const App = ({ n }: { n: number }) => {
      const [count] = React.useState(n);
      const rows = React.useMemo(() => renderToJson(<WithHooks />).body.rows.length, [n]);
      return <output>{`${count}:${rows}`}</output>;
    };
    const { rerender, container } = mount(<App n={1} />);
    rerender(<App n={2} />);
    expect(container.querySelector("output")?.textContent).toBe("1:1");
    expect(JSON.stringify(renderToJson(<WithHooks />))).toContain("Hooked");
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

describe("renderToJson with markup React rejects in a Column", () => {
  const email = (
    <Email><Row><Column>
      <Paragraph>Before the rule</Paragraph>
      {React.createElement("hr", { style: "border-top:1px solid #eee" } as never)}
      <Paragraph>After the rule</Paragraph>
    </Column></Row></Email>
  );

  it("fails, naming it", () => {
    expect(() => renderToJson(email)).toThrow(/^\[Unlayer\] The `style` prop expects a mapping .* \(in <hr> at Row 1 › Column 1 › hr\)$/);
  });

  it("with onError: \"omit\", leaves it out, with a message, and keeps the blocks around it", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const design = renderToJson(email, { onError: "omit" });
      const text = JSON.stringify(design.body.rows[0].columns[0].contents.map((c: any) => c.type));
      expect(text).toBe('["text","text"]');
      expect(error.mock.calls.map((call) => String(call[0]))).toEqual([expect.stringMatching(/^\[Unlayer\] Left out: The `style` prop .*\(in <hr> at Row 1 › Column 1 › hr\)$/)]);
    } finally {
      error.mockRestore();
    }
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

describe("renderToJson fonts prop", () => {
  const INTER = "https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap";
  const PAIR = "https://fonts.googleapis.com/css?family=Open+Sans:400,700|Lora";

  it("puts each URL on the design's fonts of the families it names, as a <Font> does, so the editor loads them", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      // As the CLI starters write it: the root's font is the stylesheet's family.
      const design = renderToJson(
        <Email fonts={[{ url: INTER }, { url: PAIR }]} fontFamily={{ label: "Inter", value: "Inter, 'Helvetica Neue', Arial, sans-serif" }}>
          <Row>
            <Column>
              <Heading fontFamily="'Open Sans', Arial, sans-serif">Hello</Heading>
              <Paragraph fontFamily={{ label: "Lora", value: "Lora, serif", url: "https://example.com/own.css" }}>Its own</Paragraph>
              <Paragraph fontFamily="Georgia, serif">Another family</Paragraph>
            </Column>
          </Row>
        </Email>
      ) as any;
      expect(design.body.values.fontFamily).toEqual({ label: "Inter", value: "Inter, 'Helvetica Neue', Arial, sans-serif", url: INTER });
      const [heading, own, other] = design.body.rows[0].columns[0].contents.map((c: any) => c.values.fontFamily);
      expect(heading.url).toBe(PAIR);
      // A font with its own URL keeps it; another family takes none.
      expect(own.url).toBe("https://example.com/own.css");
      expect(other.url).toBeUndefined();
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });

  it("says, once a render, a URL the design can't hold: one naming no family a font in it has, or no family at all", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const tree = (
        <Email fonts={[{ url: "https://fonts.googleapis.com/css2?family=Inter" }, { url: "https://cdn.example.com/brand.css" }, { url: "https://cdn.example.com/brand.css" }]}>
          <Row>
            <Column>
              <Paragraph>Hello</Paragraph>
            </Column>
          </Row>
        </Email>
      );
      const design = renderToJson(tree);
      expect(JSON.stringify(design)).not.toContain("fonts.googleapis.com");
      const said = warn.mock.calls.map((c) => String(c[0]));
      expect(said).toEqual([
        expect.stringMatching(/^\[Unlayer\] Email `fonts` URL https:\/\/fonts\.googleapis\.com\/css2\?family=Inter is kept in HTML but not in the design/),
        expect.stringMatching(/^\[Unlayer\] Email `fonts` URL https:\/\/cdn\.example\.com\/brand\.css is kept in HTML but not in the design/),
      ]);
      // The HTML links them all the same.
      expect(renderToHtml(tree)).toContain('href="https://cdn.example.com/brand.css"');
    } finally {
      warn.mockRestore();
    }
  });

  it("reads the families of a data: stylesheet's @font-face rules (as @unlayer/migrate writes a font file)", () => {
    const css = "@font-face{font-family:'Brand Sans';src:url('https://cdn.example.com/brand.woff2') format('woff2');font-weight:400;font-style:normal}";
    const url = `data:text/css,${encodeURIComponent(css)}`;
    const design = renderToJson(
      <Email fonts={[{ url }]} fontFamily="'Brand Sans', Arial, sans-serif">
        <Row>
          <Column>
            <Paragraph>Hello</Paragraph>
          </Column>
        </Row>
      </Email>
    ) as any;
    expect(decodeURIComponent(design.body.values.fontFamily.url)).toBe(`data:text/css,${css}`);
  });

  it("leaves a <Font>'s URL where it put it", () => {
    const design = renderToJson(
      <Email fonts={[{ url: INTER }]} fontFamily={{ label: "Inter", value: "Inter, sans-serif", url: "https://example.com/inter.css" }}>
        <Row>
          <Column>
            <Paragraph>Hello</Paragraph>
          </Column>
        </Row>
      </Email>
    ) as any;
    expect(design.body.values.fontFamily.url).toBe("https://example.com/inter.css");
  });
});

describe("renderToJson displayMode", () => {
  const content = <Row><Column><Paragraph>Hi</Paragraph></Column></Row>;
  it.each([
    ["Email", <Email>{content}</Email>, "email"],
    ["Page", <Page>{content}</Page>, "web"],
    ["Document", <Document>{content}</Document>, "document"],
    ["Body with a mode", <Body mode="email">{content}</Body>, "email"],
    ["Body with none", <Body>{content}</Body>, "web"],
  ] as const)("writes the mode the HTML renders in on the body: %s", (_, tree, mode) => {
    expect((renderToJson(tree).body.values as any).displayMode).toBe(mode);
  });

  it("is the root's, over one given in its values", () => {
    expect((renderToJson(<Email values={{ displayMode: "web" } as any}>{content}</Email>).body.values as any).displayMode).toBe("email");
  });
});

describe("renderToJson lengths", () => {
  // The design's schema types paddings, radii and border widths as px lengths: `0` is written `0px` there.
  const one = (block: React.ReactElement, row: Record<string, unknown> = {}, column: Record<string, unknown> = {}) =>
    renderToJson(
      <Email>
        <Row {...row}>
          <Column {...column}>{block}</Column>
        </Row>
      </Email>
    ) as any;
  const blockOf = (design: any) => design.body.rows[0].columns[0].contents[0].values;

  it("writes a bare zero in a px length as 0px: containerPadding=\"0 0 12px\"", () => {
    expect(blockOf(one(<Paragraph containerPadding="0 0 12px">Hi</Paragraph>)).containerPadding).toBe("0px 0px 12px");
    expect(blockOf(one(<Paragraph containerPadding="0">Hi</Paragraph>)).containerPadding).toBe("0px");
  });

  it("in every length a design holds, in each of its forms", () => {
    const design = one(
      <Button padding="0 24px" borderRadius="0" border={{ borderTopWidth: "0", borderTopStyle: "solid" }} mobile={{ padding: "0 12px 0" }}>Go</Button>,
      { values: { padding: "0 0 8px 0" } },
      { padding: "0 16px", borderRadius: "0 4px", border: { borderLeftWidth: "0" } }
    );
    const button = blockOf(design);
    expect(button).toMatchObject({ padding: "0px 24px", borderRadius: "0px", border: { borderTopWidth: "0px", borderTopStyle: "solid" } });
    expect(button._override.mobile.padding).toBe("0px 12px 0px");
    expect(design.body.rows[0].values.padding).toBe("0px 0px 8px 0px");
    expect(design.body.rows[0].columns[0].values).toMatchObject({ padding: "0px 16px", borderRadius: "0px 4px", border: { borderLeftWidth: "0px" } });
  });

  it("in the body's margins too: documentMargin, popupCloseButton_margin", () => {
    const body = renderToJson(<Document values={{ documentMargin: "0 0 12px", popupCloseButton_margin: "0" } as never}><Row><Column><Paragraph>Hi</Paragraph></Column></Row></Document>).body.values as any;
    expect(body).toMatchObject({ documentMargin: "0px 0px 12px", popupCloseButton_margin: "0px" });
  });

  it("leaves a length in another unit as it is, and the HTML as it was", () => {
    expect(blockOf(one(<Paragraph containerPadding="1em 0">Hi</Paragraph>)).containerPadding).toBe("1em 0");
    expect(blockOf(one(<Paragraph containerPadding="0 auto">Hi</Paragraph>)).containerPadding).toBe("0 auto");
    expect(blockOf(one(<Paragraph containerPadding="0px 8px">Hi</Paragraph>)).containerPadding).toBe("0px 8px");
    // Text that isn't a length isn't touched.
    expect(blockOf(one(<Paragraph>0</Paragraph>)).text).toBe("0");
    // The HTML writes the padding as given.
    expect(renderToHtml(<Email><Row><Column><Paragraph containerPadding="0 0 12px">Hi</Paragraph></Column></Row></Email>)).toMatch(/padding: ?0 0 12px/);
  });
});

/**
 * Text given as text shows as typed in the HTML, and in the editor that opens the design: the design's `text` is HTML,
 * so text is escaped there as it is in the HTML. What's given as HTML stays HTML in both.
 */
describe("renderToJson: text shows in the editor as in the HTML", () => {
  const typed = 'Use <b>bold</b> & <img src=x onerror="alert(1)"> &amp; <%name%>';
  /** What a browser (and the editor's canvas) shows of an element: its text (spaces collapsed), and whether it holds elements. */
  const seen = (at: Element) => ({ text: at.textContent!.replace(/\s+/g, " ").trim(), elements: at.querySelectorAll("b, img").length });
  /** The block's text as the email shows it, and as the editor shows the design's (its `text` is HTML). */
  const both = (Root: React.FC<any>, block: React.ReactElement) => {
    const tree = <Root><Row><Column>{block}</Column></Row></Root>;
    const page = new DOMParser().parseFromString(renderToHtml(tree), "text/html");
    const design = document.createElement("div");
    design.innerHTML = (renderToJson(tree).body.rows[0].columns[0].contents[0].values as any).text;
    return { html: seen(page.querySelector("[id^='u_content_']")!), design: seen(design) };
  };

  it.each([["Email", Email], ["Page", Page], ["Document", Document]] as const)("a Paragraph's `text` and string children are text in both (%s)", (_, Root) => {
    for (const block of [<Paragraph text={typed} />, <Paragraph>{typed}</Paragraph>]) {
      const { html, design } = both(Root, block);
      expect(html).toEqual({ text: typed, elements: 0 });
      expect(design).toEqual(html);
    }
    const values = renderToJson(<Root><Row><Column><Paragraph text={typed} /></Column></Row></Root>).body.rows[0].columns[0].contents[0].values as any;
    expect(values.text).toBe('Use &lt;b&gt;bold&lt;/b&gt; &amp; &lt;img src=x onerror="alert(1)"&gt; &amp;amp; &lt;%name%&gt;');
    expect(values.textJson).toBeUndefined();
    // Plain words are written as before.
    expect((renderToJson(<Root><Row><Column><Paragraph text="Hello there" /></Column></Row></Root>).body.rows[0].columns[0].contents[0].values as any).text).toBe("Hello there");
  });

  it.each([["Email", Email], ["Page", Page], ["Document", Document]] as const)("a Paragraph's `html`, Heading's and Button's `text` stay HTML in both, their children text (%s)", (_, Root) => {
    const html = "Use <b>bold</b> &amp; more";
    expect(both(Root, <Paragraph html={html} />)).toEqual({ html: { text: "Use bold & more", elements: 1 }, design: { text: "Use bold & more", elements: 1 } });
    expect((renderToJson(<Root><Row><Column><Paragraph html={html} /></Column></Row></Root>).body.rows[0].columns[0].contents[0].values as any).text).toBe(html);
    for (const block of [<Heading text={html} />, <Button href="https://example.com" text={html} />]) {
      const { html: shownInHtml, design } = both(Root, block);
      expect(shownInHtml).toEqual({ text: "Use bold & more", elements: 1 });
      expect(design).toEqual(shownInHtml);
    }
    for (const block of [<Heading>{typed}</Heading>, <Button href="https://example.com">{typed}</Button>]) {
      const { html: shownInHtml, design } = both(Root, block);
      expect(shownInHtml).toEqual({ text: typed, elements: 0 });
      expect(design).toEqual(shownInHtml);
    }
  });
});
