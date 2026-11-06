import { describe, expect, expectTypeOf, it } from "vitest";
import React, { createContext, useContext } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Button, Column, component, ElementsError, Email, Heading, Image, Page, prop, render, Row, Section, Paragraph, validate } from "./index";
import { describeComponent, type ExpandProps } from "@unlayer-internal/elements-core";
import { collectTemplate } from "./collect";

const treeOf = (element: React.ReactElement) => collectTemplate(element).document!;

const ProductCard = component({
  type: "acme.ProductCard",
  label: "Product card",
  props: {
    name: prop.text({ label: "Name", required: true }),
    photo: prop.image({ label: "Photo", required: true }),
    href: prop.link({ label: "Link", required: true }),
    accent: prop.color({ label: "Accent", default: "#0879a1" }),
    size: prop.choice(["small", "large"], { label: "Size", default: "small" }),
  },
  render: ({ name, photo, href, accent, size }) => (
    <Column style={{ gap: 8 }}>
      <Image src={photo} alt={name} />
      <Heading level={size === "large" ? 2 : 3}>{name}</Heading>
      <Button href={href} style={{ backgroundColor: accent }}>
        Buy
      </Button>
    </Column>
  ),
});

const Hero = component({
  type: "acme.Hero",
  label: "Hero",
  placement: "section",
  props: { title: prop.text({ label: "Title", required: true }) },
  render: ({ title }) => (
    <Section style={{ backgroundColor: "#111", padding: 32 }}>
      <Heading style={{ color: "#fff" }}>{title}</Heading>
    </Section>
  ),
});

const shop = (
  <Page>
    <Hero title="New arrivals" />
    <Row style={{ gap: 16 }}>
      <ProductCard name="Sneaker" photo="https://example.com/a.png" href="https://example.com/a" />
      <ProductCard id="boot" name="Boot" photo="https://example.com/b.png" href="https://example.com/b" accent="#FF0000" size="large" style={{ flex: 2 }} />
    </Row>
  </Page>
);

describe("component()", () => {
  it("is one node in the template, with its props normalized", () => {
    const document = treeOf(shop);
    expect(document.root.children![0]).toEqual({ type: "acme.Hero", props: { title: "New arrivals" } });
    expect((document.root.children![1] as { children: unknown[] }).children).toEqual([
      { type: "acme.ProductCard", props: { name: "Sneaker", photo: "https://example.com/a.png", href: "https://example.com/a" } },
      {
        id: "boot",
        type: "acme.ProductCard",
        props: { name: "Boot", photo: "https://example.com/b.png", href: "https://example.com/b", accent: "#ff0000", size: "large" },
        style: { flex: 2 },
      },
    ]);
  });

  it("renders as the primitives it's made of, in every instance", async () => {
    const { body, text, diagnostics } = await render(shop);
    expect(diagnostics).toEqual([]);
    expect(body).toMatch(/<section style="[^"]*background-color:#111">/);
    expect(body).toContain('<h3 style="margin:0;font-size:20px');
    expect(body).toContain('<h2 style="margin:0;font-size:24px');
    expect(body).toContain('style="flex:2 1 0%');
    expect(body).toContain("background-color:#f00");
    expect(body).toContain("background-color:#0879a1");
    expect(text).toContain("NEW ARRIVALS");
    // An id only where one is written: "boot" on the second card is the instance's, not written into its render.
    expect(body).not.toMatch(/ id="/);
  });

  it("works among the template's own components, hooks and context", () => {
    const Currency = createContext("$");
    const Price = ({ amount }: { amount: number }) => {
      const symbol = useContext(Currency);
      return <ProductCard name={`Sale ${symbol}${amount}`} photo="https://example.com/c.png" href="https://example.com/c" />;
    };
    const document = treeOf(
      <Currency.Provider value="€">
        <Page>
          <Price amount={5} />
        </Page>
      </Currency.Provider>
    );
    expect(document.root.children).toEqual([{ type: "acme.ProductCard", props: { name: "Sale €5", photo: "https://example.com/c.png", href: "https://example.com/c" } }]);
  });

  it("can be made of other custom components", async () => {
    const Grid = component({
      type: "acme.Pair",
      label: "Pair",
      props: {},
      render: () => (
        <Row>
          <ProductCard name="a" photo="https://example.com/a.png" href="#" />
          <ProductCard name="b" photo="https://example.com/b.png" href="#" />
        </Row>
      ),
    });
    const { body } = await render(
      <Page>
        <Grid />
      </Page>
    );
    expect(body.match(/<h3 /g)).toHaveLength(2);
  });

  it("reports wrong props, children, and what it renders that doesn't fit", async () => {
    // @ts-expect-error name and href are required
    const missing = <ProductCard photo="https://example.com/a.png" />;
    const result = validate(<Page>{missing}</Page>);
    expect(result.diagnostics.map((d) => d.code)).toEqual(["prop/required", "prop/required"]);

    const WithChildren = ProductCard as unknown as React.FC<Record<string, unknown>>;
    const children = validate(
      <Page>
        <WithChildren name="a" photo="https://example.com/a.png" href="#">
          <Paragraph>x</Paragraph>
        </WithChildren>
      </Page>
    );
    expect(children.diagnostics.map((d) => d.code)).toEqual(["children/not-allowed"]);

    const Wrong = component({ type: "acme.Wrong", label: "Wrong", props: {}, render: () => <Paragraph style={{ margin: 4 } as never}>x</Paragraph> });
    await expect(render(<Page><Wrong /></Page>)).rejects.toThrow(ElementsError);
    // A Hero goes where a Section goes.
    expect(validate(<Page><Column><Hero title="x" /></Column></Page>).diagnostics.map((d) => d.code)).toEqual(["children/not-allowed"]);
  });

  it("takes numbers and lengths, checked against their limits", async () => {
    const Spacer = component({
      type: "acme.Spacer",
      label: "Spacer",
      props: {
        lines: prop.number({ label: "Lines", min: 1, max: 4, integer: true, default: 1 }),
        indent: prop.length({ label: "Indent", min: 0, default: 0 }),
      },
      render: ({ lines, indent }) => <Paragraph style={{ padding: [0, 0, 0, indent], lineHeight: lines * 1.5 }}>{"x"}</Paragraph>,
    });
    const { html } = await render(<Page><Spacer lines={2} indent={12} /></Page>);
    expect(html).toContain("line-height:3;");
    expect(html).toContain("padding:0 0 0 12px");
    expect(validate(<Page><Spacer lines={0.5} indent={-4} /></Page>).diagnostics.map((d) => d.path)).toEqual(["root.children[0].props.lines", "root.children[0].props.indent"]);
  });

  it("is validated as render() checks it: what it renders, the output's checks and layout, rendering it once", async () => {
    let renders = 0;
    const Broken = component({
      type: "acme.Broken",
      label: "Broken",
      props: {},
      render: () => {
        renders++;
        return (
          <Column>
            {/* @ts-expect-error a Button needs an href: invalid on purpose */}
            <Button>Go</Button>
          </Column>
        );
      },
    });
    const template = (
      <Email>
        <Broken />
      </Email>
    );
    const result = validate(template);
    expect(result.valid).toBe(false);
    expect(result.diagnostics.map((d) => [d.code, d.path])).toEqual([["prop/required", "root.children[0](acme.Broken).children[0].props.href"]]);
    expect(renders).toBe(1);
    await expect(render(template)).rejects.toThrow(/prop\/required/);
    expect(renders).toBe(2);
  });

  it("is validated with the output's warnings, which leave it valid", () => {
    const result = validate(
      <Email>
        <Row style={{ justifyContent: "space-between" }}>
          <Column />
        </Row>
      </Email>
    );
    expect(result).toMatchObject({ valid: true, diagnostics: [{ code: "email/unsupported", severity: "warning", path: "root.children[0].style.justifyContent" }] });
  });

  it("can't share its type with another custom component in one template", async () => {
    const card = (label: string) =>
      component({ type: "acme.Card", label, props: { title: prop.text({ label: "Title", required: true }) }, render: ({ title }) => <Paragraph>{`${label}: ${title}`}</Paragraph> });
    const [A, B] = [card("A"), card("B")];
    const template = (
      <Page>
        <A title="one" />
        <B title="two" />
      </Page>
    );
    expect(validate(template)).toMatchObject({ valid: false, diagnostics: [{ code: "custom/duplicate", severity: "error", path: "jsx" }] });
    await expect(render(template)).rejects.toThrow(/Two different custom components are named acme\.Card/);
    // One component used twice is one component.
    expect(validate(<Page><A title="one" /><A title="two" /></Page>).valid).toBe(true);
    // component() called in a component makes one per render: the message says where to call it.
    const Product = ({ title }: { title: string }) => {
      const Inline = component({ type: "acme.Inline", label: "Inline", props: { title: prop.text({ label: "Title", required: true }) }, render: (props) => <Paragraph>{props.title}</Paragraph> });
      return <Inline title={title} />;
    };
    const twice = validate(<Page><Product title="one" /><Product title="two" /></Page>);
    expect(twice.diagnostics.map((d) => d.code)).toEqual(["custom/duplicate"]);
    expect(twice.diagnostics[0].message).toMatch(/call it once, at the top of a module/);
  });

  it("says how to use it when rendered on its own", () => {
    expect(() => renderToStaticMarkup(<ProductCard name="a" photo="https://example.com/a.png" href="#" />)).toThrow(/render\(\)/);
  });

  it("describes its props for editors", () => {
    const described = describeComponent("acme.ProductCard", { components: [ProductCard.definition] })!;
    expect(described.properties.map((p) => [p.path, p.editor, p.required])).toEqual([
      ["props.name", "text", true],
      ["props.photo", "image", true],
      ["props.href", "link", true],
      ["props.accent", "color", false],
      ["props.size", "choice", false],
      ["style.flex", "number", false],
    ]);
  });

  it("types render's props: required and defaulted ones always there", () => {
    type Props = ExpandProps<typeof ProductCard.definition.props>;
    expectTypeOf<Props["accent"]>().toEqualTypeOf<string>();
    expectTypeOf<Props["size"]>().toEqualTypeOf<"small" | "large">();
    expectTypeOf<Props["name"]>().toEqualTypeOf<string>();
    const sized = { width: prop.length({ label: "Width", units: ["px", "%"], default: 100 }), count: prop.number({ label: "Count", default: 1 }) };
    type Sized = ExpandProps<typeof sized>;
    expectTypeOf<Sized["width"]>().not.toEqualTypeOf<undefined>();
    expectTypeOf<undefined>().not.toMatchTypeOf<Sized["width"]>();
    expectTypeOf<Sized["count"]>().toEqualTypeOf<number>();
  });
});
