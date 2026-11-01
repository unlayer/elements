import { describe, expect, it } from "vitest";
import React, { createContext, forwardRef, Fragment, memo, Suspense, useContext, useId, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Button, Column, Divider, ElementsError, Email, Heading, Image, LineBreak, Link, List, ListItem, MergeTag, Page, Paragraph, render, Row, Section, Social, Span, Table, TableCell, TableRow, Text, validate } from "./index";
import { collectTemplate } from "./collect";
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
    expect(email.html).toMatch(/<a href="https:\/\/instagram.com\/acme" title="Instagram"[^>]*><img src="https:\/\/cdn.tools.unlayer.com\/social\/icons\/squared\/instagram.png" alt="Instagram" width="24"/);
    const page = await render(<Page><Social icons={icons} /></Page>);
    expect(page.html).toContain('src="https://cdn.tools.unlayer.com/social/icons/circle/instagram.png"');
    // @ts-expect-error: an icon has a name and an href
    expect(validate(<Email><Social icons={[{ name: "X", url: "https://x.com" }]} /></Email>).valid).toBe(false);
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

  it("reports HTML that isn't a component, and what isn't one root", () => {
    expect(validate(<Page><Text><b>bold</b></Text></Page>).diagnostics.map((d) => d.code)).toEqual(["jsx/markup"]);
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
