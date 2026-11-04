import { describe, expect, it } from "vitest";
import React, { createContext, forwardRef, Fragment, memo, Suspense, useContext, useId, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Button, Canvas, Circle, Column, Divider, Document, ElementsError, Html, Rect, Svg, PageBreak, PageFooter, PageHeader, PageNumber, Email, Grid, Heading, Image, LineBreak, Link, List, ListItem, MergeTag, Menu, outline, Page, Paragraph, render, Row, Section, Social, Span, Table, TableCell, TableRow, Text, validate, Video } from "./index";
import { collectTemplate } from "./collect";
import * as primitives from "./index";
import { Email as LegacyEmail, Paragraph as LegacyParagraph, Row as LegacyRow, Column as LegacyColumn, renderToHtml } from "../index";

const tree = (element: React.ReactElement) => collectTemplate(element).document;

const welcome = (
  <Page width={640} title="Welcome" style={{ backgroundColor: "#F4F4F4", gap: 16 }}>
    <Section style={{ backgroundColor: "#111111", padding: 24 }}>
      <Image src={{ src: "https://example.com/logo.png", width: 120 }} alt="Logo" />
    </Section>
    <Heading level={2}>Welcome</Heading>
    <Paragraph style={{ fontSize: 14 }}>
      Hi <MergeTag name="first_name" />, read <Link href="https://example.com/docs">the docs</Link>.
    </Paragraph>
    <Row style={{ gap: 20 }}>
      <Column style={{ width: "40%" }}>
        <Text>Left</Text>
      </Column>
      <Column>
        <Button id="cta" href="https://example.com" hover={{ backgroundColor: "#000" }}>
          Get started
        </Button>
      </Column>
    </Row>
    <Divider />
  </Page>
);

describe("render()", () => {
  it("renders a Page to web HTML and plain text, as a promise", async () => {
    const result = render(welcome);
    expect(result).toBeInstanceOf(Promise);
    const { html, text, diagnostics } = await result;
    expect(diagnostics).toEqual([]);
    expect(html.startsWith("<!DOCTYPE html>")).toBe(true);
    expect(html).toContain("<title>Welcome</title>");
    expect(html).toContain('<h2 style="margin:0;font-size:24px;font-weight:700;line-height:1.25">Welcome</h2>');
    expect(html).toMatch(/<a id="cta" class="e[0-9a-z]{5}" href="https:\/\/example.com"/);
    expect(text).toBe("[Logo]\n\nWELCOME\n\nHi {{first_name}}, read the docs (https://example.com/docs).\n\nLeft\n\nGet started (https://example.com)\n\n---");
  });

  it("writes a large heading's words in capitals in plain text, its merge tags and its links' URLs as written", async () => {
    const { text } = await render(
      <Email>
        <Heading level={1}>
          Thanks, <MergeTag name="first_name" />: <Link href="https://example.com/Orders/AbC">your order</Link>
        </Heading>
        <Heading level={2}>
          <Link href="https://example.com/Docs">https://example.com/Docs</Link>
        </Heading>
        <Heading level={1}>
          <Link href="https://example.com/Home">
            <Image src={{ src: "https://example.com/logo.png", width: 120, height: 40 }} alt="Acme logo" />
          </Link>
        </Heading>
      </Email>
    );
    expect(text).toBe("THANKS, {{first_name}}: YOUR ORDER (https://example.com/Orders/AbC)\n\nhttps://example.com/Docs\n\n[ACME LOGO] (https://example.com/Home)");
  });

  it("takes no compat from a template, directly or in a custom component: it's for today's components' lowering, and holds markup and CSS", async () => {
    const compat = (value: Record<string, unknown>) => ({ compat: value }) as object;
    const template = (
      <Email {...compat({ css: "body{color:red}", previewHtml: "<script>1</script>" })}>
        <Section {...compat({ background: { url: "https://example.com/x.png" } })}>
          <Paragraph {...compat({ className: "from-template" })}>Words</Paragraph>
        </Section>
      </Email>
    );
    const { html, diagnostics } = await render(template);
    for (const held of ["body{color:red}", "<script>1</script>", "from-template", "https://example.com/x.png"]) expect(html).not.toContain(held);
    expect(diagnostics.filter((d) => d.code === "jsx/compat")).toHaveLength(3);
    expect(primitives.validate(template).diagnostics.map((d) => d.code)).toContain("jsx/compat");
    expect(tree(template)?.root.compat).toBeUndefined();
    // An id only `compat.anyId` lets through stays refused.
    expect(primitives.validate(<Email><Paragraph {...compat({ anyId: true })} id="odd id">Words</Paragraph></Email>).diagnostics.map((d) => d.code)).toContain("id/invalid");
    const Custom = primitives.component({ type: "acme.Own", label: "Own", props: {}, render: () => <Paragraph {...compat({ className: "from-custom" })}>Custom</Paragraph> });
    await expect(render(<Email><Custom /></Email>)).rejects.toThrow("compat isn't a prop of a template");
  });

  it("rejects with the template's problems", async () => {
    // @ts-expect-error a Button needs an href
    const missing = <Page><Button>Go</Button></Page>;
    await expect(render(missing)).rejects.toThrow(ElementsError);
    await expect(render(missing)).rejects.toThrow(/root.children\[0\].props.href/);
    await expect(render(<Page><Row>loose</Row></Page>)).rejects.toThrow(/Text can't go straight in a Row/);
  });

  it("renders a Social in JSX as its icons, each linked, in email and on a page, and validates its icons", async () => {
    const icons = [{ name: "Instagram", href: "https://instagram.com/acme" }];
    const email = await render(<Email><Social icons={icons} iconType="squared" size={24} /></Email>);
    expect(email.html).toMatch(/<a href="https:\/\/instagram.com\/acme" target="_blank"[^>]*title="Instagram"[^>]*><img src="https:\/\/cdn.tools.unlayer.com\/social\/icons\/squared\/instagram.png" alt="Instagram" width="24"/);
    const page = await render(<Page><Social icons={icons} /></Page>);
    expect(page.html).toContain('src="https://cdn.tools.unlayer.com/social/icons/circle/instagram.png"');
    // @ts-expect-error: an icon has a name and an href
    expect(validate(<Email><Social icons={[{ name: "X", url: "https://x.com" }]} /></Email>).valid).toBe(false);
  });

  it("renders a Menu in JSX as its links with its separator between them, hidden on phones, in email and on a page", async () => {
    const items = [
      { text: "Docs", href: "https://example.com/docs" },
      { text: "Blog", href: "https://example.com/blog" },
    ];
    const { html, text } = await render(<Email><Menu items={items} separator="|" style={{ color: "#2563EB" }} /></Email>);
    expect(html.match(/<a href="https:\/\/example.com\/(docs|blog)"[^>]*style="color:#2563eb;/g)).toHaveLength(2);
    // The separator in a box of its own, hidden on phones by its class; in plain text, on the links' line.
    expect(html).toMatch(/<div class="[^"]+"[^>]*>(<[^>]+>)*\|/);
    expect(text).toBe("Docs (https://example.com/docs) | Blog (https://example.com/blog)");
    const page = await render(<Page><Menu items={items} layout="vertical" /></Page>);
    expect(page.html).not.toContain("|");
    expect(page.html.indexOf(">Docs<")).toBeLessThan(page.html.indexOf(">Blog<"));
  });

  it("renders a Video in JSX as its linked thumbnail in email and its player on a page, and checks its link", async () => {
    const src = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
    const email = await render(<Email><Video src={src} title="Launch" /></Email>);
    expect(email.html).toContain('<a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" title="Launch"><img src="https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg"');
    expect((await render(<Page><Video src={src} /></Page>)).html).toContain('<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"');
    expect(validate(<Email><Video src="https://example.com/movie.mp4" /></Email>).diagnostics.map((d) => d.path)).toEqual(["root.children[0].props.src"]);
  });

  it("renders a Grid in JSX as its children in columns of equal width, in email and on a page", async () => {
    const cards = ["One", "Two", "Three"].map((word) => <Text key={word} id={`card-${word}`}>{word}</Text>);
    const email = await render(<Email width={600}><Grid columns={2} style={{ gap: 20 }}>{cards}</Grid></Email>);
    // Two Rows: two cells of 290px, then one and an empty cell that keeps its width (not drawn on phones).
    expect(email.html.match(/width="290"/g)?.length).toBeGreaterThanOrEqual(4);
    expect(email.html).toContain('id="card-Three"');
    expect(email.text).toBe("One\n\nTwo\n\nThree");
    const page = await render(<Page width={600}><Grid columns={3}>{cards}</Grid></Page>);
    expect(page.html.indexOf("card-One")).toBeLessThan(page.html.indexOf("card-Three"));
    // @ts-expect-error: columns is a number of columns
    expect(validate(<Email><Grid columns="3">{cards}</Grid></Email>).valid).toBe(false);
  });

  it("renders a Document in JSX to print HTML: its pages, a header and footer on each, numbered", async () => {
    const { html, text } = await render(
      <Document size="A5" title="Report">
        <PageHeader>
          <Text>Quarterly report</Text>
        </PageHeader>
        <Heading>Summary</Heading>
        <PageBreak />
        <Document.Page style={{ backgroundColor: "#fafafa" }}>
          <Text>Appendix</Text>
        </Document.Page>
        <PageFooter>
          <Text style={{ textAlign: "right" }}>
            <PageNumber /> / <PageNumber total />
          </Text>
        </PageFooter>
      </Document>
    );
    expect(html).toContain("@page{size:A5 portrait;margin:0}");
    expect(html.match(/class="elements-page"/g)).toHaveLength(2);
    expect(html).toContain("1 / 2");
    expect(html).toContain("2 / 2");
    expect(text).toBe("SUMMARY\n\nAppendix");
  });

  it("renders a Canvas in JSX as a box of its size, and an Svg's shapes as inline SVG", async () => {
    const { html } = await render(
      <Canvas width={600} height={315} style={{ backgroundColor: "#0f172a", padding: 40 }}>
        <Svg width={120} height={60} title="Logo">
          <Rect width={120} height={60} rx={8} style={{ fill: "#6366f1" }} />
          <Circle cx={30} cy={30} r={20} style={{ fill: "transparent", stroke: "#ffffff", strokeWidth: 4 }} />
        </Svg>
      </Canvas>
    );
    expect(html).toContain('<main style="width:600px;height:315px;overflow:hidden;');
    expect(html).toContain('<circle cx="30" cy="30" r="20" fill="none" stroke="#ffffff" stroke-width="4"></circle>');
    // @ts-expect-error: a Circle's radius is a number
    expect(validate(<Canvas><Svg width={10} height={10}><Circle r="big" /></Svg></Canvas>).valid).toBe(false);
  });

  it("has no component for Raw, the node importers make for markup they bring in", () => {
    expect(Object.keys(primitives)).not.toContain("Raw");
  });

  it("takes JSX only", async () => {
    await expect(render({ root: { type: "Page" } } as never)).rejects.toThrow(TypeError);
  });

  it("renders an <Email> to email HTML: tables, widths in px, Outlook's markup in conditional comments", async () => {
    const { html, text, diagnostics } = await render(
      <Email previewText="Your order" style={{ gap: 16 }}>
        <Heading>Thanks</Heading>
        <Row style={{ gap: 20 }}>
          <Column><Text>Left</Text></Column>
          <Column><Text>Right</Text></Column>
        </Row>
        <Button href="https://example.com">Track it</Button>
      </Email>
    );
    expect(html).toContain("<o:PixelsPerInch>96</o:PixelsPerInch>");
    expect(html).toContain("Your order");
    expect(html).toContain('<!--[if mso]><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td width="290" valign="top" style="width:290px"><![endif]-->');
    expect(html).toContain("mso-padding-alt:10px 20px");
    expect(html).not.toMatch(/display:flex/);
    expect(text).toBe("THANKS\n\nLeft\n\nRight\n\nTrack it (https://example.com)");
    expect(diagnostics).toEqual([]);
  });

  it("renders lists and tables written in JSX, in email and on a page", async () => {
    const template = (Root: typeof Email | typeof Page) => (
      <Root>
        <List type="number">
          <ListItem>
            First <Span style={{ fontWeight: 700 }}>step</Span>
          </ListItem>
          <ListItem>Second</ListItem>
        </List>
        <Table style={{ cellPadding: [8, 12], rowBorder: "1px solid #eeeeee" }}>
          <TableRow header>
            <TableCell style={{ width: "60%" }}>Item</TableCell>
            <TableCell style={{ textAlign: "right" }}>Price</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Notebook</TableCell>
            <TableCell style={{ textAlign: "right" }}>$12</TableCell>
          </TableRow>
        </Table>
      </Root>
    );
    const email = await render(template(Email));
    expect(email.html).toContain('<table role="list"');
    expect(email.html).toContain("<thead>");
    expect(email.text).toBe("1. First step\n2. Second\n\nItem | Price\nNotebook | $12");
    const page = await render(template(Page));
    expect(page.html).toContain("<ol ");
    expect(page.html).toContain('<th scope="col"');
    expect(page.text).toBe(email.text);
    // A ListItem goes in a List, a TableCell in a TableRow.
    expect(validate(<Email><ListItem>loose</ListItem></Email>).valid).toBe(false);
  });

  it("is the same every time for the same template", async () => {
    expect((await render(welcome)).html).toBe((await render(welcome)).html);
  });

  it("leaves the main entry's rendering as it was, before and after", async () => {
    const legacy = () =>
      renderToHtml(
        <LegacyEmail>
          <LegacyRow>
            <LegacyColumn>
              <LegacyParagraph>Hello</LegacyParagraph>
            </LegacyColumn>
          </LegacyRow>
        </LegacyEmail>
      );
    const before = legacy();
    await render(welcome);
    expect(legacy()).toBe(before);
    expect(before).toContain("Hello");
  });

  it("says how to use a component rendered outside render()", () => {
    expect(() => renderToStaticMarkup(<Page />)).toThrow(/render\(\)/);
  });
});

describe("outline()", () => {
  it("lays the template out as text: each block under what holds it, its width, its words and links", () => {
    expect(outline(welcome)).toBe(
      [
        "Page 640px: background #f4f4f4",
        "  Section 640px: background #111111",
        "    Image 120px [Logo] https://example.com/logo.png",
        "  Heading h2 640px \"Welcome\"",
        "  Paragraph 640px \"Hi {{first_name}}, read the docs (https://example.com/docs).\"",
        "  Row 640px: 2 side by side, stacked on phones",
        "    Column 256px",
        "      Text 256px \"Left\"",
        "    Column 364px",
        "      Button: background #0879a1 \"Get started\" → https://example.com",
        "  Divider 640px",
      ].join("\n")
    );
  });

  it("says which blocks show on one only, and lays a Grid out as its rows, side by side on phones where it says so", () => {
    const lines = outline(
      <Email>
        <Text hidden={{ mobile: true }}>Wide screens</Text>
        <Grid columns={3} stackOnMobile={false}>
          <Text>a</Text>
          <Text>b</Text>
          <Text>c</Text>
        </Grid>
      </Email>
    ).split("\n");
    expect(lines[1]).toBe('  Text 600px: desktop only "Wide screens"');
    expect(lines.slice(2, 4)).toEqual(["  Column 600px", "    Row 600px: 3 side by side"]);
  });

  it("shows a video's title and link, an Svg's shapes, what shows on phones only, and a Document's pages and header", () => {
    expect(
      outline(
        <Page>
          <Text hidden={{ desktop: true }}>Phones</Text>
          <Video src="https://www.youtube.com/watch?v=dQw4w9WgXcQ" title="Launch" />
          <Menu items={[{ text: "Home", href: "https://x.test/" }, { text: "Blog", href: "https://x.test/blog" }]} />
          <Svg width={20} height={10}>
            <Rect width={20} height={10} />
            <Circle cx={5} cy={5} r={4} />
          </Svg>
        </Page>
      ).split("\n")
    ).toEqual([
      "Page 1200px",
      '  Text 1200px: phones only "Phones"',
      '  Video 1200px "Launch" https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      "  Row 1200px: 2 side by side",
      '    Text "Home (https://x.test/)"',
      '    Text "Blog (https://x.test/blog)"',
      "  Svg 20px (2 shapes)",
    ]);
    expect(
      outline(
        <Document>
          <PageHeader>
            <Text>Acme</Text>
          </PageHeader>
          <Document.Page>
            <Text>One</Text>
          </Document.Page>
        </Document>
      ).split("\n")
    ).toEqual(["Document 698px", "  PageHeader 698px", '    Text 698px "Acme"', "  Document.Page 698px", '    Text 698px "One"']);
  });

  it("throws a problem found laying the template out, with what it is", () => {
    expect(() =>
      outline(
        <Email>
          <Svg width={10} height={10}>
            <Rect width={10} height={10} />
          </Svg>
        </Email>
      )
    ).toThrow(/A Svg can't be rendered to email/);
  });

  it("throws the template's problems, as render() does", () => {
    // @ts-expect-error a Button needs an href
    const invalid = <Button>Go</Button>;
    expect(() => outline(<Email>{invalid}</Email>)).toThrow(ElementsError);
  });
});

describe("validate()", () => {
  it("lists problems with their paths, without throwing", () => {
    // @ts-expect-error a Button needs an href; Text takes no margin
    const result = validate(<Page><Button>Go</Button><Text style={{ margin: 4 }}>x</Text></Page>);
    expect(result.valid).toBe(false);
    expect(result.diagnostics.map((d) => [d.code, d.path])).toEqual([
      ["prop/required", "root.children[0].props.href"],
      ["style/unknown", "root.children[1].style.margin"],
    ]);
    expect(result.diagnostics[1].message).toMatch(/gap/);
    expect(validate(welcome)).toEqual({ valid: true, diagnostics: [] });
  });

  it("takes an Html block's markup as JSX, written as React writes it, in an email and on a page", async () => {
    for (const Root of [Email, Page]) {
      const { html, diagnostics } = await render(
        <Root>
          <Html>
            <div style={{ color: "#123456" }}>Tom &amp; <b>Jerry</b></div>
          </Html>
        </Root>
      );
      expect(diagnostics.filter((d) => d.severity === "error")).toEqual([]);
      expect(html).toContain('<div style="color:#123456">Tom &amp; <b>Jerry</b></div>');
    }
    // @ts-expect-error: no markup at all
    expect(validate(<Email><Html /></Email>).valid).toBe(false);
    // What's in it is markup: a component of a template has nowhere to go in it.
    expect(validate(<Email><Html><Text>x</Text></Html></Email>).valid).toBe(false);
  });

  it("draws an image at its width on phones, in place of a share of its column on desktop", async () => {
    const { html } = await render(<Email><Image src={{ src: "https://example.com/a.png", width: 96, height: 30 }} alt="" style={{ width: "16%", maxWidth: 96 }} mobile={{ width: 96 }} /></Email>);
    const rule = /@media[^{]*\{([^}]*\{[^}]*\})\}/.exec(html)?.[1];
    expect(rule).toContain("width:96px!important");
    expect(rule).toMatch(/[{;]width:96px!important/);
  });

  it("holds a box's padding inside its height in an email, as on a page", async () => {
    const { html } = await render(<Email><Column style={{ height: 80, padding: 12 }}><Text>x</Text></Column></Email>);
    expect(html).toMatch(/<td[^>]*height="80"[^>]*style="[^"]*height:56px/);
  });

  it("keeps a Column's own width on phones beside one that shares a Row, as on a page", async () => {
    const { html } = await render(
      <Email>
        <Row stackOnMobile={false}>
          <Column style={{ width: 64 }}><Text>a</Text></Column>
          <Column><Text>b</Text></Column>
        </Row>
      </Email>
    );
    expect(/@media[^{]*\{([\s\S]*?)\}\s*<\/style>/.exec(html)?.[1] ?? "").toContain("width:auto!important");
    expect(html).toMatch(/<td[^>]*width="64"/);
  });

  it("places a short Divider by its parent's alignItems, in an email and on a page", async () => {
    const email = await render(<Email><Column style={{ alignItems: "center" }}><Divider style={{ width: 80 }} /></Column></Email>);
    expect(email.html).toMatch(/<td align="center"[^>]*>\s*<table[^>]*max-width:80px/);
    const page = await render(<Page><Column style={{ alignItems: "end" }}><Divider style={{ width: 80 }} /></Column></Page>);
    expect(page.html).toMatch(/<hr[^>]*margin:0 0 0 auto/);
  });

  it("keeps a Table column's px beside columns that take what's left; with none to take it, every column is a share", async () => {
    const mixed = (Root: typeof Email) => <Root width={560}><Table><TableRow><TableCell>Item</TableCell><TableCell style={{ width: 80 }}>$136.00</TableCell></TableRow></Table></Root>;
    for (const Root of [Email, Page]) {
      const { html } = await render(mixed(Root as typeof Email));
      expect(html).toMatch(/<col[^>]*style="width:auto"/);
      expect(html).toMatch(/<col[^>]*style="width:80px"/);
    }
    const all = await render(<Email width={560}><Table><TableRow><TableCell style={{ width: 300 }}>Item</TableCell><TableCell style={{ width: 100 }}>$136.00</TableCell></TableRow></Table></Email>);
    expect(all.html).toMatch(/<col[^>]*style="width:75%"/);
  });

  it("gives an Html block the text around it in an email too, as on a page", async () => {
    const { html } = await render(<Email style={{ color: "#123456", fontFamily: "Georgia, serif" }}><Html html="<p>x</p>" /></Email>);
    const around = /<div[^>]*style="([^"]*)"[^>]*><p>x<\/p>/.exec(html)?.[1];
    expect(around).toContain("color:#123456");
    expect(around).toContain("font-family:Georgia, serif");
  });

  it("reports HTML that isn't a component, and what isn't one root", () => {
    expect(validate(<Page><Text><b>bold</b></Text></Page>).diagnostics.map((d) => d.code)).toEqual(["jsx/markup"]);
    expect(validate(<Page><Text><b>bold</b></Text></Page>).diagnostics[0].message).toMatch(/use the primitives .*\. Every component: @unlayer\/react-elements\/PRIMITIVES\.md$/);
    expect(validate(<div />).diagnostics.map((d) => d.code)).toEqual(["jsx/markup", "jsx/root"]);
    expect(validate(<><Page /><Page /></>).diagnostics.map((d) => d.code)).toEqual(["jsx/root"]);
  });

  it("says a component that's async or suspends can't be rendered yet, rather than writing its fallback", async () => {
    // (React 18's types don't take an async component; React 19's do.) It rejects: it's never called, so nothing goes unhandled.
    const Price = (async () => {
      throw new Error("price service down");
    }) as unknown as React.FC;
    const Pending = React.lazy(() => new Promise<{ default: React.ComponentType }>(() => {}));
    // One inside a component of the user's own is called by React, which fails on it.
    const Later = (async () => <Text>later</Text>) as unknown as React.FC;
    const Wrapper = () => <Later />;
    const templates = [
      <Email>
        <Price />
      </Email>,
      <Email>
        <Suspense fallback="Loading…">
          <Pending />
        </Suspense>
      </Email>,
      <Email>
        <Pending />
      </Email>,
      <Email>
        <Wrapper />
      </Email>,
    ];
    for (const template of templates) {
      // Only that: the fallback isn't read (as text in an Email, it would be an error of its own).
      expect(validate(template).diagnostics.map((d) => d.code)).toEqual(["jsx/async"]);
      await expect(render(template)).rejects.toThrow(/async or suspends/);
    }
    // A Suspense whose content is ready is its content.
    const ready = await render(
      <Email>
        <Suspense fallback={<Text>loading</Text>}>
          <Text>ready</Text>
        </Suspense>
      </Email>
    );
    expect(ready.text).toBe("ready");
  });

  it("says what a component inside <Suspense> threw, and what else is wrong beside a component that suspends", () => {
    const Boom = (): React.ReactElement => {
      throw new Error("price missing");
    };
    const thrown = validate(
      <Email>
        <Suspense fallback={<Text>loading</Text>}>
          <Boom />
        </Suspense>
      </Email>
    ).diagnostics;
    expect(thrown).toMatchObject([{ code: "jsx/error", message: "A component inside <Suspense> threw: price missing" }]);
    const Pending = React.lazy(() => new Promise<{ default: React.ComponentType }>(() => {}));
    const twoRoots = (
      <>
        <Email>
          <Suspense fallback={null}>
            <Pending />
          </Suspense>
        </Email>
        <Page />
      </>
    );
    expect(validate(twoRoots).diagnostics.map((d) => d.code)).toEqual(["jsx/async", "jsx/root"]);
    // A rejecting async component in React's own wrappers isn't called either; one called inside a component of
    // the user's in a <Suspense> is said to be async, not to have thrown; several are said once; a root that
    // suspended entirely isn't also said to be missing.
    const Rejects = (async () => {
      throw new Error("down");
    }) as unknown as React.FC;
    const Theme = createContext("light");
    const Later = (async () => <Text>later</Text>) as unknown as React.FC;
    const Wrapper = () => <Later />;
    const asyncOnly = [
      <Email>
        <Suspense fallback={null}>
          <Rejects />
        </Suspense>
      </Email>,
      <Email>
        <React.StrictMode>
          <Theme.Provider value="dark">
            <Rejects />
          </Theme.Provider>
        </React.StrictMode>
      </Email>,
      <Email>
        <Suspense fallback={null}>
          <Wrapper />
        </Suspense>
      </Email>,
      <Email>
        <Suspense fallback={null}>
          <Pending />
        </Suspense>
        <Suspense fallback={null}>
          <Pending />
        </Suspense>
      </Email>,
      <Suspense fallback={null}>
        <Email>
          <Pending />
        </Email>
      </Suspense>,
    ];
    for (const template of asyncOnly) expect(validate(template).diagnostics.map((d) => d.code)).toEqual(["jsx/async"]);
    // An error that isn't about async comes out as thrown.
    const Missing = (): React.ReactElement => {
      throw new Error("no product 42");
    };
    expect(() =>
      validate(
        <Email>
          <Missing />
        </Email>
      )
    ).toThrow("no product 42");
  });
});

describe("the template, as collected (internal)", () => {
  it("holds what React rendered, values normalized, ids only where written", () => {
    expect(tree(welcome)!.root.children![0]).toEqual({
      type: "Section",
      style: { backgroundColor: "#111111", padding: { top: 24, right: 24, bottom: 24, left: 24 } },
      children: [{ type: "Image", props: { src: { src: "https://example.com/logo.png", width: 120 }, alt: "Logo" } }],
    });
    expect(JSON.stringify(tree(welcome))).toContain('"id":"cta"');
  });

  it("renders the template's own components as React does: hooks, context, Fragments, lists, memo and forwardRef", () => {
    const Theme = createContext("#0879a1");
    const Cta = memo(({ label }: { label: string }) => {
      const color = useContext(Theme);
      const [count] = useState(2);
      useId();
      return (
        <Button href="https://example.com" style={{ backgroundColor: color }}>
          {label} {count}
        </Button>
      );
    });
    const Rows = forwardRef<unknown, { items: string[] }>(({ items }, _ref) => (
      <>
        {items.map((item) => (
          <Paragraph key={item}>{item}</Paragraph>
        ))}
      </>
    ));
    const document = tree(
      <Theme.Provider value="#ff0000">
        <Email>
          <Fragment>
            <Rows items={["a", "b"]} />
            {false && <Divider />}
            {null}
          </Fragment>
          <Cta label="Buy" />
        </Email>
      </Theme.Provider>
    );
    expect(document!.root.children).toEqual([
      { type: "Paragraph", children: ["a"] },
      { type: "Paragraph", children: ["b"] },
      { type: "Button", props: { href: "https://example.com" }, style: { backgroundColor: "#ff0000" }, children: ["Buy 2"] },
    ]);
  });

  it("keeps text as written, entities and markup-looking text included", () => {
    const document = tree(
      <Page>
        <Text>
          {"a < b & 'c' \"d\" <b>not bold</b>"} {3}
          <LineBreak />
          <Span style={{ fontWeight: "bold" }}>x</Span>
        </Text>
      </Page>
    );
    expect(document!.root.children![0]).toEqual({
      type: "Text",
      children: ["a < b & 'c' \"d\" <b>not bold</b> 3", { type: "LineBreak" }, { type: "Span", style: { fontWeight: 700 }, children: ["x"] }],
    });
  });
});
