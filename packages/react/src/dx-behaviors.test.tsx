import { describe, it, expect, vi } from "vitest";
import { inTime, within } from "./test-timing";
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
  Email,
  Page,
  Document,
  Menu,
  Social,
  Divider,
  Html,
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
    expect(html(<Paragraph text={"Hi" as any} />)).toMatch(/word-wrap: break-word;">\s*Hi\s*<\/div>/);
  });

  it("Paragraph renders as the editor's text block: its text in no <p>, its line height as given", () => {
    const out = html(<Paragraph>Hi</Paragraph>);
    expect(out).toMatch(/line-height: 140%; text-align: left; word-wrap: break-word;">\s*Hi\s*<\/div>/);
    expect(out).not.toMatch(/<p[\s>]/);
  });

  it("JSX children keep their inline formatting instead of [object Object]", () => {
    const out = html(<Heading>Hi <b>x</b></Heading>);
    expect(out).not.toMatch(/\[object Object\]/);
    expect(out).toMatch(/Hi <b>x<\/b>/);
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

describe("DX: style and className, on the element each component renders", () => {
  const roots = { Email, Page, Document } as const;
  const template = (Root: (typeof roots)[keyof typeof roots]) => (
    <Root style={{ outline: "1px solid red" }} className="root">
      <Row style={{ borderTop: "2px solid #000" }} className="row">
        <Column style={{ verticalAlign: "middle" }} className="col">
          <Paragraph style={{ textTransform: "uppercase", color: "red" }} color="#0000ff" className="lead">Hi</Paragraph>
          <Heading style={{ letterSpacing: 2, lineHeight: 1.2 }} className="title">Head</Heading>
          <Button style={{ boxShadow: "0 1px 2px #000" }} className="cta" href="https://example.com">Go</Button>
          <Image style={{ borderRadius: 8 }} className="pic" src="https://example.com/a.png" />
        </Column>
      </Row>
    </Root>
  );
  /** The element a class name is on, its tag and its style. */
  const on = (out: string, name: string) => {
    const tag = new RegExp(`<([a-z0-9]+) [^>]*class="${name} [^>]*>`).exec(out)!;
    return { tag: tag[1], style: /style="([^"]*)"/.exec(tag[0])![1], classes: /class="([^"]*)"/.exec(tag[0])![1] };
  };

  it("writes its own style after the renderer's in time linear in what the renderer's holds", async () => {
    // The renderer's style lost its trailing spaces and `;`s to `/[\s;]*$/`, which tried again from each of a long run of
    // them a value of a prop wrote (`color`): 100,000 took seconds.
    const timing = await within(1000, () => renderToHtml(<Email><Row><Column><Paragraph color={"#000" + " ".repeat(102400) + "a"} style={{ textTransform: "uppercase" }}>Hi</Paragraph></Column></Row></Email>));
    expect(inTime(timing)).toBe(true);
    const html = timing.result;
    expect(html).toMatch(/word-wrap: break-word;text-transform:uppercase"/);
  });

  it.each(Object.keys(roots) as Array<keyof typeof roots>)("%s: inlined (its own style first), its class names before the renderer's", (mode) => {
    const out = renderToHtml(template(roots[mode]));
    // The root's body (or the wrapper in it, on a web page), the Row's container, the Column's cell.
    expect(on(out, "root")).toMatchObject({ tag: mode === "Page" ? "div" : "body", classes: expect.stringMatching(/^root .*u_body/) });
    expect(on(out, "root").style).toMatch(/[;"]?outline:1px solid red$/);
    expect(on(out, "row").classes).toMatch(/^row u-row\b/);
    expect(on(out, "row").style).toMatch(/border-top:2px solid #000$/);
    expect(on(out, "col").classes).toMatch(/^col u-col\b/);
    expect(on(out, "col").style).toMatch(/vertical-align:middle$/);
    // Text: the element with the text; a prop given wins over the same property in `style`.
    expect(on(out, "lead")).toMatchObject({ tag: "div", style: expect.stringMatching(/color: #0000ff;.*;text-transform:uppercase$/) });
    expect(on(out, "lead").style).not.toContain("color:red");
    expect(on(out, "title")).toMatchObject({ tag: "h1", style: expect.stringMatching(/;letter-spacing:2px;line-height:1.2$/) });
    expect(on(out, "cta")).toMatchObject({ tag: "a", style: expect.stringMatching(/;box-shadow:0 1px 2px #000$/) });
    expect(on(out, "pic")).toMatchObject({ tag: "img", style: expect.stringMatching(/;border-radius:8px$/) });
    expect(out).not.toMatch(/;;/);
  });

  it("leaves out what could end the attribute or the rule, and class names that aren't", () => {
    const out = html(<Paragraph style={{ color: 'red" onclick="x', background: "url(x);}</style>", fontWeight: 700 }} className={'a"b <c>'}>Hi</Paragraph>);
    expect(out).not.toContain('onclick="x');
    expect(out).not.toContain("</style>\"");
    expect(out).toMatch(/class="ab c v-/);
    expect(out).toMatch(/;font-weight:700"/);
  });

  it("keeps a `$` in a value as it is, on a tag without the attribute", () => {
    const out = html(<Html html='<a href="x" title="y">Hi</a>' style={{ fontFamily: "a$'b$&c$$d" }} className="e$$f" />);
    expect(out).toContain(`<div style="font-family:a$'b$&c$$d" class="e$$f"><a href="x" title="y">Hi</a></div>`);
  });

  it("output without them is the same as before", () => {
    const plain = (props: Record<string, unknown>) => html(<Paragraph {...props}>Hi</Paragraph>);
    expect(plain({ style: {}, className: "" })).toBe(plain({}));
    expect(plain({ style: { color: undefined } })).toBe(plain({}));
  });

  it("the design leaves them out, and says so once per render", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const design = renderToJson(template(Email));
      for (let i = 0; i < 2; i++) renderToJson(template(Email));
      const said = warn.mock.calls.map((call) => String(call[0]));
      expect(said.slice(0, 7)).toEqual([
        "[Unlayer] Email `style.outline`, `className` are kept in HTML but not in the design for the visual editor.",
        "[Unlayer] Row `style.borderTop`, `className` are kept in HTML but not in the design for the visual editor.",
        "[Unlayer] Column `style.verticalAlign`, `className` are kept in HTML but not in the design for the visual editor.",
        "[Unlayer] Paragraph `style.textTransform`, `style.color`, `className` are kept in HTML but not in the design for the visual editor.",
        "[Unlayer] Heading `style.letterSpacing`, `style.lineHeight`, `className` are kept in HTML but not in the design for the visual editor.",
        "[Unlayer] Button `style.boxShadow`, `className` are kept in HTML but not in the design for the visual editor.",
        "[Unlayer] Image `style.borderRadius`, `className` are kept in HTML but not in the design for the visual editor.",
      ]);
      // Once per render: three renders, each says it once.
      expect(said).toHaveLength(21);
      const values = JSON.stringify(design);
      expect(values).not.toContain("textTransform");
      expect(values).not.toContain('"lead"');
    } finally {
      warn.mockRestore();
    }
  });
});

describe("DX: what a block can't use is said, not dropped quietly", () => {
  it("a prop a block has no use for (a link's `target` on a block without one)", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      renderToHtml(
        <Body>
          <Row>
            <Column>
              <Paragraph textTransfrom="uppercase" {...({ fontSize: "16px" } as object)}>Hi</Paragraph>
              <Button href="https://example.com" target="_self" buttonColors={{ backgroundColor: "#000" }} onClick={() => {}}>Go</Button>
              <Image src="https://example.com/a.png" alt="A" width={120} height={60} target="_self" />
              <Heading target="_self">Title</Heading>
            </Column>
          </Row>
        </Body>
      );
      expect(warn.mock.calls.map((call) => String(call[0]))).toEqual([
        "[Unlayer] Paragraph ignores the prop `textTransfrom`.",
        "[Unlayer] Button ignores the prop `onClick`.",
        "[Unlayer] Image ignores the prop `height`.",
        "[Unlayer] Heading ignores the prop `target`.",
      ]);
    } finally {
      warn.mockRestore();
    }
  });

  it("a prop a slip away from one it takes: the warning names it", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const slips = { textColour: "#f00", fontsize: "20px", textAling: "left", lineHieght: "140%" };
      renderToHtml(
        <Body>
          <Row>
            <Column>
              <Menu items={[{ text: "Home", href: "https://example.com" }]} {...({ textColour: slips.textColour } as object)} />
              <Paragraph {...({ fontsize: slips.fontsize } as object)}>Hi</Paragraph>
              <Heading {...({ textAling: slips.textAling, lineHieght: slips.lineHieght } as object)}>Title</Heading>
              <Button {...({ backgroundColour: "#000" } as object)}>Go</Button>
            </Column>
          </Row>
        </Body>
      );
      expect(warn.mock.calls.map((call) => String(call[0]))).toEqual([
        "[Unlayer] Menu ignores the prop `textColour`: did you mean `textColor`?",
        "[Unlayer] Paragraph ignores the prop `fontsize`: did you mean `fontSize`?",
        "[Unlayer] Heading ignores the prop `textAling`: did you mean `textAlign`?",
        "[Unlayer] Heading ignores the prop `lineHieght`: did you mean `lineHeight`?",
        "[Unlayer] Button ignores the prop `backgroundColour`: did you mean `backgroundColor`?",
      ]);
    } finally {
      warn.mockRestore();
    }
  });
});

describe("DX: the names authors reach for (CSS's, React Email's) stand for the component's own prop", () => {
  const menuItems = [{ text: "Home", href: "https://example.com" }];
  const json = (el: React.ReactElement) => itemValues(el) as Record<string, any>;

  it("Menu: `color` is its items' color (linked or not), `textAlign` its alignment; its own props win", () => {
    expect(json(<Menu items={menuItems} color="#ff0000" textAlign="center" />)).toMatchObject({ textColor: "#ff0000", linkColor: "#ff0000", align: "center" });
    expect(json(<Menu items={menuItems} color="#ff0000" textColor="#00ff00" textAlign="center" align="right" />)).toMatchObject({ textColor: "#00ff00", linkColor: "#ff0000", align: "right" });
    expect(json(<Menu items={menuItems} color="#ff0000" linkColor="#0000ff" />)).toMatchObject({ textColor: "#ff0000", linkColor: "#0000ff" });
    expect(json(<Menu items={menuItems} color="#ff0000" />)).not.toHaveProperty("color");
    // The same in the HTML: a linked item is in the color too.
    expect(html(<Menu items={menuItems} color="#ff0000" />)).toBe(html(<Menu items={menuItems} textColor="#ff0000" linkColor="#ff0000" />));
    expect(html(<Menu items={menuItems} color="#ff0000" />)).toMatch(/<a [^>]*color: ?#ff0000[^>]*>\s*Home/);
  });

  it("Social: `textAlign` is its alignment", () => {
    const icons = [{ name: "Facebook", url: "https://facebook.com/x" }];
    expect(json(<Social icons={icons} textAlign="right" />)).toMatchObject({ align: "right" });
    expect(html(<Social icons={icons} textAlign="right" />)).toBe(html(<Social icons={icons} align="right" />));
  });

  it("text blocks: `align` is `textAlign`, `textColor` is `color` (a Button's text color)", () => {
    expect(json(<Paragraph align="center" textColor="#333333">Hi</Paragraph>)).toMatchObject({ textAlign: "center", color: "#333333" });
    expect(json(<Heading align="right" textColor="#111111">Hi</Heading>)).toMatchObject({ textAlign: "right", color: "#111111" });
    expect(json(<Button align="left" textColor="#ffffff">Go</Button>)).toMatchObject({ textAlign: "left", buttonColors: { color: "#ffffff" } });
    expect(json(<Paragraph align="center" textAlign="right">Hi</Paragraph>)).toMatchObject({ textAlign: "right" });
    expect(json(<Image src="https://example.com/a.png" align="right" />)).toMatchObject({ textAlign: "right" });
    expect(json(<Divider align="left" />)).toMatchObject({ textAlign: "left" });
    // On a phone too.
    expect(json(<Menu items={menuItems} mobile={{ textAlign: "center" }} />)._override.mobile).toMatchObject({ align: "center" });
  });

  it("Heading: React Email's `as` is its level; `headingType`, then `level`, win over it", () => {
    expect(html(<Heading as="h2">Hi</Heading>)).toMatch(/<h2[ >]/);
    expect(json(<Heading as="h2">Hi</Heading>)).toMatchObject({ headingType: "h2" });
    expect(json(<Heading as="h2">Hi</Heading>)).not.toHaveProperty("as");
    expect(json(<Heading as="h2" level="h3">Hi</Heading>)).toMatchObject({ headingType: "h3" });
    expect(json(<Heading as="h2" level="h3" headingType="h4">Hi</Heading>)).toMatchObject({ headingType: "h4" });
    // A flat prop wins over the `values` escape hatch, as everywhere.
    expect(json(<Heading as="h5" values={{ headingType: "h1" }}>Hi</Heading>)).toMatchObject({ headingType: "h5" });
    expect(html(<Heading as="h2" level="h3">Hi</Heading>)).toBe(html(<Heading headingType="h3">Hi</Heading>));
  });

  it("an alias isn't said to be ignored", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      html(<Menu items={menuItems} color="#ff0000" textAlign="center" />);
      html(<Paragraph align="center" textColor="#333">Hi</Paragraph>);
      html(<Heading as="h2">Hi</Heading>);
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });
});
