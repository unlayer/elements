import { describe, it, expect } from "vitest";
import React from "react";
import { Email, Row, Column, ColumnLayouts, Button, Social, Image, Menu, renderToHtml, renderToJson } from "./index";

// Guards for "valid, type-checking input silently produced broken output" footguns.

const wrap = (el: React.ReactElement) =>
  renderToHtml(
    <Email contentWidth="600px">
      <Row layout={ColumnLayouts.OneColumn}>
        <Column>{el}</Column>
      </Row>
    </Email>
  );
const firstHref = (html: string) => (html.match(/<a\b[^>]*\bhref="([^"]*)"/i) || [, null])[1];

describe("Button href shapes all resolve (attrs is not dropped)", () => {
  it("plain string href", () => {
    expect(firstHref(wrap(<Button href="https://x.com/s">Go</Button>))).toBe("https://x.com/s");
  });
  it("{ name, values: { href } } (canonical storage shape)", () => {
    expect(
      firstHref(wrap(<Button href={{ name: "web", values: { href: "https://x.com/v" } } as any}>Go</Button>))
    ).toBe("https://x.com/v");
  });
  it("{ name, attrs: { href } } — the type advertises attrs, so it must render", () => {
    expect(
      firstHref(wrap(<Button href={{ name: "web", attrs: { href: "https://x.com/a" } } as any}>Go</Button>))
    ).toBe("https://x.com/a");
  });
  it("genuine custom attrs are still spread onto the anchor", () => {
    const html = wrap(
      <Button href={{ name: "web", values: { href: "https://x.com/v" }, attrs: { class: "cta" } } as any}>Go</Button>
    );
    expect(firstHref(html)).toBe("https://x.com/v");
    expect(html).toContain('class="cta"');
  });
});

describe("Social iconSize/spacing accept px strings without NaN", () => {
  const social = (props: any) =>
    wrap(<Social icons={[{ name: "Facebook", url: "https://fb.com/x" }]} {...props} />);

  it("a px-string iconSize coerces to a number (no NaNpx)", () => {
    const html = social({ iconSize: "34px" });
    expect(html).not.toContain("NaN");
    expect(html).toContain("34px"); // the icon box uses the coerced 34
  });
  it("a px-string spacing does not produce NaN", () => {
    expect(social({ spacing: "8px" })).not.toContain("NaN");
  });
  it("a numeric iconSize still works", () => {
    expect(social({ iconSize: 40 })).not.toContain("NaN");
  });
  it("a non-px iconSize (\"50%\") is dropped → falls back to the default, no NaN", () => {
    const html = social({ iconSize: "50%" });
    expect(html).not.toContain("NaN");
    expect(html).toContain("32px"); // schema default, not a coerced 50
  });
});

describe("Image with no explicit dimensions does not force a wrong aspect", () => {
  it("a string-url image emits no height attribute (height:auto keeps its real ratio)", () => {
    const html = wrap(<Image src="https://x.com/photo.png" />);
    const img = (html.match(/<img[^>]*>/i) || [""])[0];
    expect(img).toMatch(/width="\d+"/); // responsive width attr is present
    expect(img).not.toMatch(/height="\d+"/); // but no guessed height
  });
  it("an object src with real dimensions keeps its height", () => {
    const html = wrap(<Image src={{ url: "https://x.com/p.png", width: 400, height: 400 } as any} />);
    const img = (html.match(/<img[^>]*>/i) || [""])[0];
    expect(img).toMatch(/height="\d+"/);
  });
});

describe("the attrs-href fix is consistent across all link-bearing components", () => {
  const allHrefs = (html: string) => [...html.matchAll(/<a\b[^>]*\bhref="([^"]*)"/gi)].map((m) => m[1]);

  it("Image action { name, attrs: { href } } wraps the image in a working anchor", () => {
    const html = wrap(
      <Image src="https://x/p.png" action={{ name: "web", attrs: { href: "https://x.com/ia" } } as any} />
    );
    expect(allHrefs(html)).toContain("https://x.com/ia");
  });

  it("existing link forms still resolve (Menu items, Image action string) — no regression", () => {
    const menu = wrap(
      <Menu items={[{ text: "A", href: "https://x.com/m1" }] as any} layout="horizontal" />
    );
    expect(allHrefs(menu)).toContain("https://x.com/m1");
    const img = wrap(<Image src="https://x/p.png" action={"https://x.com/is" as any} />);
    expect(allHrefs(img)).toContain("https://x.com/is");
  });
});

describe("attrs href round-trips into the editor (renderToJson stores values.href)", () => {
  const buttonHref = (el: React.ReactElement) =>
    (renderToJson(
      <Email contentWidth="600px"><Row layout={ColumnLayouts.OneColumn}><Column>{el}</Column></Row></Email>
    ) as any).body.rows[0].columns[0].contents[0].values.href;

  it("a Button attrs href is stored in values.href (where the Builder reads it)", () => {
    const href = buttonHref(<Button href={{ name: "web", attrs: { href: "https://x.com/cta" } } as any}>Go</Button>);
    expect(href.values.href).toBe("https://x.com/cta");
    expect(href.attrs).toBeUndefined();
  });

  it("a string href is stored canonically too", () => {
    const href = buttonHref(<Button href="https://x.com/s">Go</Button>);
    expect(href.values.href).toBe("https://x.com/s");
  });
});
