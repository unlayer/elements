import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";
import {
  Button,
  Column,
  Divider,
  Document,
  Email,
  Heading,
  Html,
  Image,
  Link,
  Menu,
  Page,
  Paragraph,
  Row,
  Social,
  Table,
  renderToHtml,
  renderToHtmlParts,
  renderToJson,
  renderToPlainText,
  renderRowToJson,
  UnlayerProvider,
} from "../index";
import { Tailwind, classNameToDeclarations, loadTailwind, renderToHtml as renderToHtmlAsync, renderToJson as renderToJsonAsync, type TailwindHandle } from "./index";
import { inlineClasses } from "./html";

const config = { theme: { extend: { colors: { brand: "#007291" } } } };
let tw: TailwindHandle;
beforeAll(async () => {
  tw = await loadTailwind(config);
});

let warn: MockInstance;
beforeEach(() => {
  warn = vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => warn.mockRestore());
const warnings = () => warn.mock.calls.map((call) => String(call[0]));

const design = (content: React.ReactNode, root: Record<string, unknown> = {}) =>
  renderToJson(
    <Tailwind tw={tw}>
      <Email {...root}>
        <Row>
          <Column>{content}</Column>
        </Row>
      </Email>
    </Tailwind>
  );
/** One block's values in the design. */
const block = (node: React.ReactElement) => design(node).body.rows[0].columns[0].contents[0].values as Record<string, any>;

describe("<Tailwind>: classes as each component's props", () => {
  it("gives Paragraph and Heading their text styles", () => {
    expect(block(<Paragraph className="text-lg font-bold text-brand leading-7 tracking-wide text-center font-serif">Hi</Paragraph>)).toMatchObject({
      fontSize: "18px",
      fontWeight: 700,
      color: "#007291",
      lineHeight: "28px",
      letterSpacing: "0.025em",
      textAlign: "center",
      fontFamily: { value: "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif" },
    });
    // A unitless line height (Tailwind's text sizes) as the editor writes one: a percentage.
    expect(block(<Heading className="text-3xl font-semibold text-gray-900">Title</Heading>)).toMatchObject({ fontSize: "30px", lineHeight: "120%", fontWeight: 600, color: "#101828" });
    expect(block(<Paragraph className="text-sm">Hi</Paragraph>)).toMatchObject({ fontSize: "14px", lineHeight: "142.86%" });
  });

  it("puts a block's margins and padding in its containerPadding, other sides kept", () => {
    expect(block(<Paragraph className="my-4 px-2">Hi</Paragraph>).containerPadding).toBe("16px 8px");
    expect(block(<Paragraph className="mt-6">Hi</Paragraph>).containerPadding).toBe("24px 10px 10px");
    expect(block(<Html html="<b>x</b>" className="m-2 p-2" />).containerPadding).toBe("16px");
    // In one unit, or with a zero, they add up too.
    expect(block(<Paragraph className="p-[5%] m-[2%]">Hi</Paragraph>).containerPadding).toBe("7%");
    expect(block(<Paragraph className="p-[5%] m-0">Hi</Paragraph>).containerPadding).toBe("5%");
    expect(warnings()).toEqual([]);
  });

  it("keeps a block's padding where its margin can't be added to it, and says so", () => {
    // Whatever the classes' order: the padding is the block's own.
    for (const className of ["p-[5%] m-2", "m-2 p-[5%]"]) expect(block(<Paragraph className={className}>Hi</Paragraph>).containerPadding).toBe("5%");
    expect(block(<Paragraph className="pt-[5%] m-2">Hi</Paragraph>).containerPadding).toBe("5% 8px 8px");
    expect([...new Set(warnings())]).toEqual([
      "[Unlayer] Paragraph ignores `margin: 8px` from class `m-2`: its `containerPadding` can't add it to `padding: 5%`.",
      "[Unlayer] Paragraph ignores `margin: 8px` from class `m-2`: its `containerPadding` can't add it to `padding-top: 5%`.",
    ]);
    // Said once for a margin on several sides.
    expect(warnings()).toHaveLength(3);
  });

  it("gives Button its colors, inner padding, corners, border, width and hover colors", () => {
    const values = block(
      <Button href="https://example.com" className="bg-blue-600 text-white px-6 py-3 rounded-lg border-2 border-blue-800 w-full hover:bg-blue-700 hover:text-blue-50 m-2">
        Go
      </Button>
    );
    expect(values.buttonColors).toEqual({ backgroundColor: "#155dfc", color: "#fff", hoverBackgroundColor: "#1447e6", hoverColor: "#eff6ff" });
    expect(values).toMatchObject({ padding: "12px 24px", borderRadius: "8px", containerPadding: "8px", size: { width: "100%", autoWidth: false } });
    expect(values.border).toMatchObject({ borderTopWidth: "2px", borderTopStyle: "solid", borderTopColor: "#193cb8", borderLeftWidth: "2px" });
    // No hover class: it keeps its colors on hover, as in the browser.
    expect(block(<Button className="bg-red-500 text-black">Go</Button>).buttonColors).toEqual({ backgroundColor: "#fb2c36", color: "#000", hoverBackgroundColor: "#fb2c36", hoverColor: "#000" });
    // Padding on one axis keeps the default on the other.
    expect(block(<Button className="px-8">Go</Button>).padding).toBe("10px 32px");
  });

  it("paints a Row's content width and pads it; a Column gets its background, padding, border and corners", () => {
    const row = design(<Paragraph>Hi</Paragraph>).body.rows[0].values;
    expect(row.columnsBackgroundColor).toBe("");
    const json = renderToJson(
      <Tailwind tw={tw}>
        <Email>
          <Row className="bg-white p-4">
            <Column className="bg-gray-50 p-6 border border-gray-200 rounded-lg">
              <Paragraph>Hi</Paragraph>
            </Column>
          </Row>
        </Email>
      </Tailwind>
    );
    // (A card in it: the Row's padding stays around it, see "a Row's padding" below.)
    expect(json.body.rows[0].values).toMatchObject({ columnsBackgroundColor: "#fff", backgroundColor: "", padding: "16px" });
    const column = json.body.rows[0].columns[0].values;
    expect(column).toMatchObject({ backgroundColor: "#f9fafb", padding: "24px", borderRadius: "8px" });
    expect(column.border).toEqual(
      Object.fromEntries(["Top", "Right", "Bottom", "Left"].flatMap((side) => [[`border${side}Width`, "1px"], [`border${side}Style`, "solid"], [`border${side}Color`, "#e5e7eb"]]))
    );
  });

  it("sizes Image and Divider, and gives a Divider's line its border", () => {
    expect(block(<Image src="https://example.com/a.png" className="w-1/2" />).src).toMatchObject({ autoWidth: false, maxWidth: "50%" });
    expect(block(<Divider className="border-t-2 border-dashed border-gray-300 w-3/4" />)).toMatchObject({
      width: "75%",
      border: { borderTopWidth: "2px", borderTopStyle: "dashed", borderTopColor: "#d1d5dc" },
    });
    expect(block(<Menu items={[{ text: "Home", href: "https://example.com" }]} className="text-sm text-gray-900 text-left" />)).toMatchObject({ fontSize: "14px", textColor: "#101828", align: "left" });
    expect(block(<Social icons={[]} className="text-right" />)).toMatchObject({ align: "right" });
  });

  it("styles the root it's around, or that it's the only child of", () => {
    const body = design(<Paragraph>Hi</Paragraph>, { className: "bg-gray-100 text-gray-900 font-sans max-w-[600px]" }).body.values;
    expect(body).toMatchObject({ backgroundColor: "#f3f4f6", textColor: "#101828", contentWidth: "600px" });
    // Tailwind's sans-serif stack (its theme's `--font-sans`).
    expect(body.fontFamily.value).toMatch(/sans-serif, 'Apple Color Emoji'/);
    const inside = renderToJson(
      <Email className="bg-gray-100 max-w-xl">
        <Tailwind tw={tw}>
          <Row>
            <Column>
              <Paragraph className="text-red-500">Hi</Paragraph>
            </Column>
          </Row>
        </Tailwind>
      </Email>
    );
    expect(inside.body.values).toMatchObject({ backgroundColor: "#f3f4f6", contentWidth: "576px" });
    expect(inside.body.rows[0].columns[0].contents[0].values.color).toBe("#fb2c36");
  });

  it("gives the HTML what it gives the design", () => {
    const element = (
      <Tailwind tw={tw}>
        <Email className="bg-gray-100">
          <Row className="bg-white">
            <Column className="p-6">
              <Paragraph className="text-red-500 text-lg">Hello</Paragraph>
              <Button className="bg-blue-600 rounded-lg">Go</Button>
            </Column>
          </Row>
        </Email>
      </Tailwind>
    );
    const html = renderToHtml(element);
    for (const css of ["#f3f4f6", "color: #fb2c36", "font-size: 18px", "#155dfc", "border-radius: 8px", "padding: 24px"]) expect(html).toContain(css);
    expect(html).not.toMatch(/class="[^"]*(bg-|text-red)/);
    // Rendered by React itself, as a Server Component would.
    const markup = renderToStaticMarkup(element);
    expect(markup).toContain("#f3f4f6");
    expect(markup).toContain("color: #fb2c36");
  });

  it("styles blocks a component of the user's own renders, and the innermost <Tailwind> wins", async () => {
    const other = await loadTailwind({ theme: { extend: { colors: { brand: "#ff0000" } } } });
    const Promo = ({ text }: { text: string }) => {
      const [label] = React.useState(text);
      return (
        <Tailwind tw={other}>
          <Paragraph className="text-brand">{label}</Paragraph>
        </Tailwind>
      );
    };
    const json = design(
      <>
        <Paragraph className="text-brand">Ours</Paragraph>
        <Promo text="Theirs" />
      </>
    );
    expect(json.body.rows[0].columns[0].contents.map((c: any) => c.values.color)).toEqual(["#007291", "#ff0000"]);
  });

  it("leaves className alone outside a <Tailwind>", () => {
    const json = renderToJson(
      <Email>
        <Row>
          <Column>
            <Paragraph className="text-lg">Hi</Paragraph>
          </Column>
        </Row>
      </Email>
    );
    expect(json.body.rows[0].columns[0].contents[0].values.fontSize).toBe("14px");
    // A class name is the HTML's (for the embedder's own CSS); the design can't hold it.
    expect(warnings()).toEqual(["[Unlayer] Paragraph `className` is kept in HTML but not in the design for the visual editor."]);
  });
});

describe("<Tailwind>: props given win over classes", () => {
  it("over a class, flat, in a group or in `values`", () => {
    expect(block(<Paragraph className="text-lg text-red-500" fontSize="20px">Hi</Paragraph>)).toMatchObject({ fontSize: "20px", color: "#fb2c36" });
    expect(block(<Button className="bg-red-500 text-white" buttonColors={{ backgroundColor: "#000000" }}>Go</Button>).buttonColors).toMatchObject({ backgroundColor: "#000000", color: "#fff" });
    expect(block(<Paragraph className="text-red-500" values={{ color: "#123456" } as any}>Hi</Paragraph>).color).toBe("#123456");
    expect(block(<Paragraph className="p-6" containerPadding="4px">Hi</Paragraph>).containerPadding).toBe("4px");
    expect(block(<Image src="https://example.com/a.png" width={120} className="w-1/2" />).src.maxWidth).not.toBe("50%");
    expect(design(<Paragraph>Hi</Paragraph>, { className: "bg-gray-100", backgroundColor: "#000000" }).body.values.backgroundColor).toBe("#000000");
  });

  it("over a phone class, in `mobile`", () => {
    const values = block(<Paragraph className="max-sm:text-sm max-sm:text-center" mobile={{ fontSize: "12px" }}>Hi</Paragraph>);
    expect(values._override.mobile).toMatchObject({ fontSize: "12px", textAlign: "center" });
    const column = renderToJson(
      <Tailwind tw={tw}>
        <Email>
          <Row>
            <Column padding="5px" className="p-6 max-sm:p-2">
              <Paragraph>Hi</Paragraph>
            </Column>
          </Row>
        </Email>
      </Tailwind>
    ).body.rows[0].columns[0].values;
    expect(column.padding).toBe("5px");
    expect(column._override.mobile.padding).toBe("8px");
  });

  it("but not a prop given as `undefined`: a wrapper forwarding optional props it wasn't given keeps its classes, in the design and the HTML", () => {
    // Your own components, passing on what they're given (`color={props.color}`): unset, it's `undefined`.
    type Optional = { color?: string; fontSize?: string; bg?: string; padding?: string; width?: number };
    const Text = (p: Optional) => (
      <Paragraph className="text-blue-500 text-lg max-sm:text-sm uppercase" color={p.color} fontSize={p.fontSize} mobile={{ fontSize: p.fontSize }} style={{ textTransform: p.color }}>
        Hi
      </Paragraph>
    );
    const Cta = (p: Optional) => (
      <Button href="https://example.com" className="bg-red-500 text-black px-6" backgroundColor={p.bg} color={p.color} padding={p.padding} buttonColors={{ hoverColor: "#00ff00", color: p.color }}>
        Go
      </Button>
    );
    const Title = (p: Optional) => <Heading className="text-brand text-2xl" color={p.color} fontSize={p.fontSize}>Title</Heading>;
    const Picture = (p: Optional) => <Image src="https://example.com/a.png" className="w-32" width={p.width} />;
    const template = (forward: boolean) => {
      const given = (props: Record<string, unknown>) => (forward ? props : {});
      return (
        <Tailwind tw={tw}>
          <Email className="bg-gray-100 max-w-[640px]" {...given({ backgroundColor: undefined, contentWidth: undefined })}>
            <Row className="bg-white" {...given({ columnsBackgroundColor: undefined, backgroundColor: undefined })}>
              <Column className="bg-zinc-50 rounded-lg p-6" {...given({ backgroundColor: undefined, borderRadius: undefined, padding: undefined })}>
                {forward ? <Text /> : <Paragraph className="text-blue-500 text-lg max-sm:text-sm uppercase">Hi</Paragraph>}
                {forward ? <Cta /> : <Button href="https://example.com" className="bg-red-500 text-black px-6" buttonColors={{ hoverColor: "#00ff00" }}>Go</Button>}
                {forward ? <Title /> : <Heading className="text-brand text-2xl">Title</Heading>}
                {forward ? <Picture /> : <Image src="https://example.com/a.png" className="w-32" />}
              </Column>
            </Row>
          </Email>
        </Tailwind>
      );
    };
    const forwarded = renderToJson(template(true));
    expect(forwarded).toEqual(renderToJson(template(false)));
    expect(renderToHtml(template(true))).toBe(renderToHtml(template(false)));
    const [text, cta, title, picture] = forwarded.body.rows[0].columns[0].contents.map((c: any) => c.values);
    expect(text).toMatchObject({ color: "#2b7fff", fontSize: "18px", _override: { mobile: { fontSize: "14px" } } });
    expect(cta.buttonColors).toMatchObject({ backgroundColor: "#fb2c36", color: "#000", hoverColor: "#00ff00" });
    expect(title).toMatchObject({ color: "#007291", fontSize: "24px" });
    // (128px of the 572px the Column's padding leaves it.)
    expect(picture.src.maxWidth).toBe("22.38%");
    expect(forwarded.body.values).toMatchObject({ backgroundColor: "#f3f4f6", contentWidth: "640px" });
    expect(forwarded.body.rows[0].values.columnsBackgroundColor).toBe("#fff");
    expect(forwarded.body.rows[0].columns[0].values).toMatchObject({ backgroundColor: "#fafafa", borderRadius: "8px", padding: "24px" });
  });
});

describe("<Tailwind>: screen sizes", () => {
  it("sets a phone variant (`max-sm:`) as the `mobile` prop", () => {
    const values = block(<Paragraph className="text-lg max-sm:text-sm max-sm:text-center max-sm:px-1">Hi</Paragraph>);
    expect(values.fontSize).toBe("18px");
    expect(values._override.mobile).toEqual({ fontSize: "14px", lineHeight: "142.86%", textAlign: "center", containerPadding: "10px 4px" });
    expect(block(<Button className="w-60 max-sm:w-full">Go</Button>)._override.mobile.size).toEqual({ autoWidth: false, width: "100%" });
  });

  it("takes a breakpoint variant (`sm:`) for the desktop, and what's set without it for phones", () => {
    expect(block(<Paragraph className="text-sm sm:text-lg">Hi</Paragraph>)).toMatchObject({ fontSize: "18px", _override: { mobile: { fontSize: "14px" } } });
    // No class for phones: Paragraph's default.
    expect(block(<Paragraph className="sm:text-lg">Hi</Paragraph>)).toMatchObject({ fontSize: "18px", _override: { mobile: { fontSize: "14px" } } });
    const row = renderToJson(
      <Tailwind tw={tw}>
        <Email>
          <Row className="p-2 sm:px-8">
            <Column>
              <Paragraph>Hi</Paragraph>
            </Column>
          </Row>
        </Email>
      </Tailwind>
    ).body.rows[0];
    // In its Column, as a Row's padding is.
    expect(row.values.padding).toBe("0px");
    expect(row.columns[0].values).toMatchObject({ padding: "8px 32px", _override: { mobile: { padding: "8px" } } });
  });

  it("hides a block on phones, on desktops, or shows it on one only", () => {
    expect(block(<Paragraph className="max-sm:hidden">Hi</Paragraph>)._override).toMatchObject({ mobile: { hideMobile: true } });
    expect(block(<Paragraph className="sm:hidden">Hi</Paragraph>)._override).toMatchObject({ desktop: { hideDesktop: true } });
    expect(block(<Paragraph className="hidden sm:block">Hi</Paragraph>)._override).toMatchObject({ mobile: { hideMobile: true }, desktop: { hideDesktop: false } });
    expect(block(<Paragraph className="hidden max-sm:block">Hi</Paragraph>)._override).toMatchObject({ mobile: { hideMobile: false }, desktop: { hideDesktop: true } });
  });
});

describe("<Tailwind>: classes in an Html block's markup", () => {
  it("are inline styles, with the email conversions; the element's own style wins; your own classes stay", () => {
    const element = (
      <Tailwind tw={tw}>
        <Email>
          <Row>
            <Column>
              <Html html={'<p class="text-red-500 p-4 mine" style="color: blue">Hi <a class=\'font-bold underline\' href="https://example.com">there</a></p><br class="block"/><!-- <i class="p-2"> -->'} />
              <Paragraph html={'Total: <span class="text-brand font-bold px-2 rounded-s-md">$10</span>'} />
            </Column>
          </Row>
        </Email>
      </Tailwind>
    );
    const [html, paragraph] = renderToJson(element).body.rows[0].columns[0].contents;
    expect(html.values.html).toBe(
      '<p class="mine" style="padding: 16px; color: #fb2c36; color: blue">Hi <a href="https://example.com" style="font-weight: 700; text-decoration: underline">there</a></p><br style="display: block"/><!-- <i class="p-2"> -->'
    );
    // Logical sides (`px-2`, `rounded-s-md`) as physical ones, which email clients read.
    expect(paragraph.values.text).toBe('Total: <span style="border-top-left-radius: 6px; border-bottom-left-radius: 6px; padding-left: 8px; padding-right: 8px; font-weight: 700; color: #007291">$10</span>');
    const email = renderToHtml(element);
    expect(email).toContain('style="padding: 16px; color: #fb2c36; color: blue"');
    expect(email).not.toMatch(/class="[^"]*(text-red|font-bold|text-brand)/);
    expect(warnings()).toEqual([]);
  });

  it("are inline styles in a Heading's and a Button's children, and on a <Link> on its own in a Column, as in a Paragraph's: in every mode, the HTML and the design", async () => {
    // (Classes in their children's markup stayed as written, which email clients don't read, and weren't said.)
    const content = (
      <Row>
        <Column>
          <Heading>
            Welcome to <span className="text-indigo-600">Acme</span>
          </Heading>
          <Heading>
            Read{" "}
            <Link href="https://e.test" className="text-indigo-600 no-underline">
              this
            </Link>
          </Heading>
          <Button href="https://e.test">
            <span className="text-yellow-300 font-bold">Go</span>
          </Button>
          <Link href="https://e.test/all" className="text-indigo-600 font-semibold no-underline">
            All
          </Link>
          <a href="https://e.test/raw" className="font-semibold">
            Raw
          </a>
        </Column>
      </Row>
    );
    const indigo = "#4f39f6";
    for (const Root of [Email, Page, Document]) {
      const element = (
        <Tailwind tw={tw}>
          <Root>{content}</Root>
        </Tailwind>
      );
      for (const html of [renderToHtml(element), await renderToHtmlAsync(element)]) {
        expect(html).not.toMatch(/class="[^"]*(text-indigo|text-yellow|font-bold|font-semibold|no-underline)/);
        expect([html.match(/color: ?#4f39f6/g)?.length ?? 0, /color: ?#ffdf20[^"]*font-weight: 700|font-weight: 700[^"]*color: ?#ffdf20/.test(html), /font-weight: 600/.test(html)]).toEqual([3, true, true]);
      }
      const texts = renderToJson(element).body.rows[0].columns[0].contents.map((c: any) => c.values.text);
      expect(texts[0]).toBe(`Welcome to <span style="color: ${indigo}">Acme</span>`);
      expect(texts[1]).toBe(`Read <a href="https://e.test" target="_blank" rel="noopener" style="color: ${indigo}; text-decoration: none">this</a>`);
      expect(texts.slice(2).map((t: string) => t.match(/style="[^"]*"/)?.[0])).toEqual(['style="font-weight: 700; color: #ffdf20"', `style="font-weight: 600; color: ${indigo}; text-decoration: none"`, 'style="font-weight: 600"']);
    }
    expect(warnings()).toEqual([]);
  });

  it("says which classes it can't inline: variants a stylesheet would need, and ones that don't apply in an email", () => {
    block(<Html html={'<p class="p-2 max-sm:p-1 hover:underline sm:p-4 dark:text-white">x</p>'} />);
    expect(warnings()).toEqual([
      "[Unlayer] Html ignores class `dark:text-white` in its markup: it applies only for @media (prefers-color-scheme: dark).",
      "[Unlayer] Html can't inline class `hover:underline` in its markup: it applies on hover, which needs a stylesheet.",
      "[Unlayer] Html can't inline class `max-sm:p-1` in its markup: it applies on phones only, which needs a stylesheet.",
      "[Unlayer] Html can't inline class `sm:p-4` in its markup: it applies above a screen width only, which needs a stylesheet.",
    ]);
    // A variant's own class (`group`) stays yours; a class that applies only inside it is said, and goes.
    warn.mockClear();
    expect(block(<Html html={'<div class="group mine"><p class="[.group:hover_&]:underline p-2">x</p></div>'} />).html).toBe('<div class="group mine"><p style="padding: 8px">x</p></div>');
    expect(warnings()).toEqual(["[Unlayer] Html ignores class `[.group:hover_&]:underline` in its markup: it applies only for `.group:hover &`."]);
  });

  it("doesn't inline what shows or hides an element that a screen variant changes on another screen: `hidden md:block` doesn't hide on every screen", () => {
    expect(block(<Html html={'<div class="hidden md:block mine">Desktop text</div><p class="block max-sm:hidden ps-2 md:pl-4 p-1">Desktop only</p><p class="hidden hover:block text-red-500 hover:text-blue-500">Hover</p>'} />).html).toBe(
      // (`ps-2` and `p-1` are inline as on every screen: `md:pl-4` can't apply.)
      '<div class="mine">Desktop text</div><p style="padding: 4px; padding-left: 8px">Desktop only</p><p style="display: none; color: #fb2c36">Hover</p>'
    );
    expect(warnings()).toEqual([
      "[Unlayer] Html can't inline `hidden`'s `display` in its markup: `md:block` sets it above a screen width only, which needs a stylesheet.",
      "[Unlayer] Html can't inline class `md:block` in its markup: it applies above a screen width only, which needs a stylesheet.",
      "[Unlayer] Html can't inline `block`'s `display` in its markup: `max-sm:hidden` sets it on phones only, which needs a stylesheet.",
      "[Unlayer] Html can't inline class `max-sm:hidden` in its markup: it applies on phones only, which needs a stylesheet.",
      "[Unlayer] Html can't inline class `md:pl-4` in its markup: it applies above a screen width only, which needs a stylesheet.",
      "[Unlayer] Html can't inline class `hover:block` in its markup: it applies on hover, which needs a stylesheet.",
      "[Unlayer] Html can't inline class `hover:text-blue-500` in its markup: it applies on hover, which needs a stylesheet.",
    ]);
  });

  it("inlines any other class a screen variant changes as it is on every screen, saying the variant can't apply", () => {
    const said: string[] = [];
    const inline = (html: string, rtl = false) => inlineClasses(html, (className) => classNameToDeclarations(tw, className), (text) => said.push(text), rtl);
    const variant = (name: string, when = "above a screen width only") => `can't inline class \`${name}\` in its markup: it applies ${when}, which needs a stylesheet`;
    const shown = (name: string, property: string, variantName: string, when = "above a screen width only") =>
      `can't inline \`${name}\`'s \`${property}\` in its markup: \`${variantName}\` sets it ${when}, which needs a stylesheet`;
    const cases: Array<[string, string, string[], boolean?]> = [
      // `px-4` is the padding on every screen; `md:pl-2` can't apply in markup. The class leaves the attribute, inlined.
      ['<p class="px-4 md:pl-2 mine">a</p>', '<p class="mine" style="padding-left: 16px; padding-right: 16px">a</p>', [variant("md:pl-2")]],
      ['<p class="p-4 md:p-2">a</p>', '<p style="padding: 16px">a</p>', [variant("md:p-2")]],
      ['<p class="border-2 md:border-l-4">a</p>', '<p style="border-style: solid; border-width: 2px">a</p>', [variant("md:border-l-4")]],
      ['<p class="rounded-md md:rounded-tl-none">a</p>', '<p style="border-radius: 6px">a</p>', [variant("md:rounded-tl-none")]],
      ['<p class="size-4 md:w-8 text-red-500 max-sm:text-blue-500">a</p>', '<p style="width: 16px; height: 16px; color: #fb2c36">a</p>', [variant("max-sm:text-blue-500", "on phones only"), variant("md:w-8")]],
      ['<p class="ps-4 md:pr-1">a</p>', '<p style="padding-right: 16px">a</p>', [variant("md:pr-1")], true],
      // What shows or hides the element: inline neither (shown on every screen is the safer mistake).
      ['<div class="hidden md:block mine">x</div>', '<div class="mine">x</div>', [shown("hidden", "display", "md:block"), variant("md:block")]],
      ['<div class="flex max-sm:hidden p-2">x</div>', '<div style="padding: 8px">x</div>', [shown("flex", "display", "max-sm:hidden", "on phones only"), variant("max-sm:hidden", "on phones only")]],
      ['<div class="invisible md:visible">x</div>', "<div>x</div>", [shown("invisible", "visibility", "md:visible"), variant("md:visible")]],
      // A hover variant doesn't count: without hover, the element is as it says.
      ['<div class="hidden hover:block">x</div>', '<div style="display: none">x</div>', [variant("hover:block", "on hover")]],
    ];
    for (const [markup, inlined, warned, rtl] of cases) {
      said.length = 0;
      expect([markup, inline(markup, rtl)]).toEqual([markup, inlined]);
      expect([markup, said]).toEqual([markup, warned]);
    }
    // An Html block's, in the design and the email alike, said in each render.
    const html = <Html html={'<p class="px-4 md:pl-2">a</p>'} />;
    const eachRender = ["[Unlayer] Html can't inline class `md:pl-2` in its markup: it applies above a screen width only, which needs a stylesheet."];
    expect(block(html).html).toBe('<p style="padding-left: 16px; padding-right: 16px">a</p>');
    expect(warnings()).toEqual(eachRender);
    warn.mockClear();
    expect(renderToHtml(<Tailwind tw={tw}><Email><Row><Column>{html}</Column></Row></Email></Tailwind>)).toContain('<p style="padding-left: 16px; padding-right: 16px">a</p>');
    expect(warnings()).toEqual(eachRender);
  });

  it("reads tags and attributes as a browser does: what isn't a class attribute, or isn't in a tag, stays as written", () => {
    const cases: Array<[string, string]> = [
      // `class=` in another attribute's value; the first `class` of a tag (a browser ignores the others).
      ['<div title=" class=x">Hi</div>', '<div title=" class=x">Hi</div>'],
      ['<div title=" class=x" class="p-2 mine">Hi</div>', '<div title=" class=x" class="mine" style="padding: 8px">Hi</div>'],
      ["<p data-x='class=\"p-4\"' class=p-2>a</p>", "<p data-x='class=\"p-4\"' style=\"padding: 8px\">a</p>"],
      ['<p class="p-2" class="p-4 mine">a</p>', '<p style="padding: 8px">a</p>'],
      // A `/` between attributes, a name in capitals, an unquoted value (`block/` isn't Tailwind's).
      ['<p/CLASS="p-2">a</p><br class=block/>', '<p style="padding: 8px">a</p><br class=block/>'],
      // In a comment, in raw text, in a `<` that starts no tag, in a tag the markup ends in: text, as written.
      ['<!--> <b class="p-2">x</b><!-- <i class="p-2"> -->', '<!--> <b style="padding: 8px">x</b><!-- <i class="p-2"> -->'],
      ['<textarea><b class="p-2"></textarea><title><i class="p-2"></title><style>.a{} <b class="p-2"></style><script>"<b class=\'p-2\'>"</script>', '<textarea><b class="p-2"></textarea><title><i class="p-2"></title><style>.a{} <b class="p-2"></style><script>"<b class=\'p-2\'>"</script>'],
      ['a < b class="p-2"> c', 'a < b class="p-2"> c'],
      ['<p>x</p><p class="p-2', '<p>x</p><p class="p-2'],
      // The element's own style after the classes', as it's written (its references and quotes kept).
      ['<p style=color:blue class=p-2>a</p>', '<p style="padding: 8px; color:blue">a</p>'],
      ["<p class=\"p-2 mine\" title=\"&copy;\" style='font-family: \"A\"; content: \"&copy;\";'>a</p>", '<p class="mine" title="&copy;" style="padding: 8px; font-family: &quot;A&quot;; content: &quot;&copy;&quot;">a</p>'],
    ];
    for (const [markup, inlined] of cases) expect([markup, block(<Html html={markup} />).html]).toEqual([markup, inlined]);
    expect(warnings()).toEqual([]);
  });

  it("reads markup in time linear in its size: an end tag ends what's open in it once, the classes are read at once", () => {
    // Elements nested 60,000 deep in an element with a class, ended by their end tags or by others' (`</span>`, which
    // ends none of them), and 30,000 tags with a class of their own each: an end tag read every element still open, and
    // each tag's classes were read alone (with Tailwind, each read of a class it hasn't built builds its whole stylesheet).
    const n = 60_000;
    // (A reader that reads nothing, at no cost: the time is the markup's.)
    const reader = Object.assign((_: string) => ({ declarations: [], ignored: [] }), { prepare: vi.fn((_: string) => {}) });
    for (const [html, prepared] of [
      ['<div class="p-1">' + "<div>".repeat(n) + "x" + "</div>".repeat(n) + "</div>", "p-1"],
      ['<div class="p-1">' + "<div>".repeat(n) + "x" + "</span>".repeat(n) + "</div>", "p-1"],
      [Array.from({ length: n / 2 }, (_, i) => `<span class="x${i}">x</span>`).join(""), Array.from({ length: n / 2 }, (_, i) => `x${i}`).join(" ")],
    ] as const) {
      const start = performance.now();
      inlineClasses(html, reader, () => {});
      expect(performance.now() - start).toBeLessThan(2000);
      expect(reader.prepare).toHaveBeenLastCalledWith(prepared);
    }
  });

  it("never throws, changes nothing but class attributes and the styles they give, and inlining again changes nothing, whatever fragments it's given (fuzzed)", () => {
    // `TAILWIND_FUZZ_RUNS=100000` for a longer run, `TAILWIND_FUZZ_SEED` for other inputs.
    const runs = Number(process.env.TAILWIND_FUZZ_RUNS ?? 600);
    const fragments = [
      "<p", "<div", "<span", "<br", "<img src=x", "<a href='x'", ">", "/>", " ", "\n", "\t", "/", "=", '"', "'", "`", "\0",
      ' class="', " class='", " class=", " CLASS=", "class", ' title="', " title='", ' style="', " style='color: blue'", ' style="color: red;"', " style", ' dir="rtl"', " dir=ltr",
      "p-4", " text-red-500", " mine", " md:p-2", " hidden", " md:block", " ps-4", " max-sm:p-1", " hover:underline", " dark:text-white", " w-[10px]", " group", " group-hover:underline",
      "&amp;", "&quot;", "&#39;", "&copy;", "&", "<!--", "-->", "--!>", "<!-->", "<!", "<?x ", "</", "</p>", "</div>", "</span>", "<script>", "</script>", "<style>", "</style>",
      "<textarea>", "</textarea>", "<title>", "</title>", "<xmp>", "<plaintext>", "<noscript>", "<svg>", "</svg>", "<math>", "<table><tr><td", "text", "Hi", "<", "<<",
    ];
    const read = (className: string) => classNameToDeclarations(tw, className);
    const none = (className: string) => ({ declarations: [], ignored: className.split(/\s+/).filter(Boolean).map((name) => ({ className: name, reason: "Tailwind has no such class" })) });
    const parse = (html: string) => new DOMParser().parseFromString(`<!doctype html><body>${html}`, "text/html").body;
    // What a browser reads both as, but for each element's class (fewer classes) and style (the inlined ones before its own).
    const differ = (a: Node, b: Node): string | undefined => {
      if (a.nodeType !== b.nodeType || a.nodeName !== b.nodeName) return `${a.nodeName} → ${b.nodeName}`;
      if (a instanceof Element && b instanceof Element) {
        const rest = (e: Element) => [...e.attributes].filter((x) => x.name !== "class" && x.name !== "style").map((x) => `${x.name}=${x.value}`).join(" ");
        if (rest(a) !== rest(b)) return `<${a.localName} ${rest(a)}> → <${b.localName} ${rest(b)}>`;
        const classes = (e: Element) => (e.getAttribute("class") ?? "").split(/[\t\n\f\r ]+/).filter(Boolean);
        if (classes(b).some((name) => !classes(a).includes(name))) return `class ${a.getAttribute("class")} → ${b.getAttribute("class")}`;
        const style = (e: Element) => (e.getAttribute("style") ?? "").replace(/;\s*$/, "");
        if (!style(b).endsWith(style(a))) return `style ${a.getAttribute("style")} → ${b.getAttribute("style")}`;
      } else if (a.nodeValue !== b.nodeValue) return `${JSON.stringify(a.nodeValue)} → ${JSON.stringify(b.nodeValue)}`;
      if (a.childNodes.length !== b.childNodes.length) return `${a.nodeName}'s ${a.childNodes.length} children → ${b.childNodes.length}`;
      for (let i = 0; i < a.childNodes.length; i++) {
        const why = differ(a.childNodes[i], b.childNodes[i]);
        if (why) return why;
      }
      return undefined;
    };
    const r = random(Number(process.env.TAILWIND_FUZZ_SEED ?? 20261018));
    const bad: string[] = [];
    for (let run = 0; run < runs && bad.length < 5; run++) {
      let input = "";
      for (let n = 1 + Math.floor(r() * 24); n > 0; n--) input += fragments[Math.floor(r() * fragments.length)];
      const wrong = (why: string, out = "") => bad.push(`${JSON.stringify(input)} → ${JSON.stringify(out)}: ${why}`);
      let out: string;
      try {
        out = inlineClasses(input, read, () => {});
        if (inlineClasses(input, none, () => {}) !== input) wrong("changed with no class to inline", inlineClasses(input, none, () => {}));
      } catch (error) {
        wrong(`throws ${error}`);
        continue;
      }
      if (inlineClasses(out, read, () => {}) !== out) wrong("not idempotent", out);
      const why = differ(parse(input), parse(out));
      if (why) wrong(why, out);
    }
    expect(bad).toEqual([]);
  }, 60000);
});

describe("<Tailwind>: logical sides (`ps-*`, `border-e-*`, `rounded-ss-*`, `text-start`) follow the text direction", () => {
  type Props = Record<string, unknown>;
  const RTL = { textDirection: "rtl" };
  const one = (root: Props, content: React.ReactNode, row = "") => (
    <Tailwind tw={tw}>
      <Email {...root}>
        <Row className={row}>{content}</Row>
      </Email>
    </Tailwind>
  );
  /** A border's four widths, `top right bottom left`. */
  const widths = (border: Record<string, string>) => ["Top", "Right", "Bottom", "Left"].map((side) => border[`border${side}Width`] ?? "-").join(" ");
  const columnOf = (root: Props) => {
    const element = one(root, <Column className="bg-white ps-4 pe-2 max-sm:ps-1 border-s-2 border-e-4 rounded-ss-sm rounded-se-md rounded-ee-lg rounded-es-xl"><Paragraph>Hi</Paragraph></Column>);
    const { values } = renderToJson(element).body.rows[0].columns[0];
    return { values: { padding: values.padding, phone: values._override?.mobile?.padding, border: widths(values.border), radius: values.borderRadius }, html: renderToHtml(element) };
  };

  it("on a Column: its padding, borders and corners, in the design and the HTML", () => {
    const ltr = columnOf({});
    expect(ltr.values).toEqual({ padding: "0px 8px 0px 16px", phone: "0px 8px 0px 4px", border: "- 4px - 2px", radius: "4px 6px 8px 12px" });
    const rtl = columnOf(RTL);
    expect(rtl.values).toEqual({ padding: "0px 16px 0px 8px", phone: "0px 4px 0px 8px", border: "- 2px - 4px", radius: "6px 4px 12px 8px" });
    expect(rtl.html).toMatch(/class="v-col-padding[^"]*" style="[^"]*padding: 0px 16px 0px 8px;border-top: 0px solid transparent;border-left: 4px solid #000000;border-right: 2px solid #000000;[^"]*border-radius: 6px 4px 12px 8px;/);
    // `ltr` and `auto` (which the email can't resolve) read as left to right.
    for (const textDirection of ["ltr", "auto"]) expect(columnOf({ textDirection }).values).toEqual(ltr.values);
    expect(warnings()).toEqual([]);
  });

  it("on blocks: their spacing, a Button's padding, border and corners, and the alignment, theirs or around them", () => {
    const blocks = (root: Props) =>
      renderToJson(
        one(
          root,
          <Column className="text-end">
            <Paragraph className="ps-4 me-2 text-start">A</Paragraph>
            <Heading>B</Heading>
            <Button href="https://example.com" className="ps-6 pe-3 border-e-2 rounded-s-lg">C</Button>
            <Image src="https://example.com/a.png" className="text-start" />
          </Column>
        )
      ).body.rows[0].columns[0].contents.map(({ values: v }: { values: Record<string, any> }) => [v.containerPadding, v.textAlign, v.padding, v.border && widths(v.border), v.borderRadius].filter((x) => x !== undefined));
    expect(blocks({})).toEqual([["10px 8px 10px 16px", "left"], ["10px", "right"], ["10px", "right", "10px 12px 10px 24px", "- 2px - -", "8px 4px 4px 8px"], ["10px", "left"]]);
    expect(blocks(RTL)).toEqual([["10px 16px 10px 8px", "right"], ["10px", "left"], ["10px", "left", "10px 24px 10px 12px", "- - - 2px", "4px 8px 8px 4px"], ["10px", "right"]]);
  });

  it("on a Row: its padding classes go to the Column on that side (the first is on the right), and its Columns' margins between them", () => {
    const columns = (root: Props) =>
      renderToJson(one(root, [<Column key={1} className="me-2"><Paragraph>1</Paragraph></Column>, <Column key={2} className="ms-2"><Paragraph>2</Paragraph></Column>], "ps-8 pe-4 py-2")).body.rows[0].columns.map(
        ({ values: v }: { values: Record<string, any> }) => [v.padding, v._override?.mobile?.padding]
      );
    expect(columns({})).toEqual([["8px 8px 8px 32px", "8px 16px 8px 32px"], ["8px 16px 8px 8px", "8px 16px 8px 32px"]]);
    // Mirrored: stacked on phones, the first is still on top, 8px from the next.
    expect(columns(RTL)).toEqual([["8px 32px 8px 8px", "8px 32px 8px 16px"], ["8px 8px 8px 16px", "8px 32px 8px 16px"]]);
    // A physical class is the side it says: the left is the last Column's, right to left.
    const physical = (root: Props, row: string) => renderToJson(one(root, [<Column key={1}><Paragraph>1</Paragraph></Column>, <Column key={2}><Paragraph>2</Paragraph></Column>], row)).body.rows[0].columns.map((c: any) => c.values.padding);
    expect([physical({}, "pl-8"), physical({}, "pr-8")]).toEqual([["0px 0px 0px 32px", "0px"], ["0px", "0px 32px 0px 0px"]]);
    expect([physical(RTL, "pl-8"), physical(RTL, "pr-8")]).toEqual([["0px", "0px 0px 0px 32px"], ["0px 32px 0px 0px", "0px"]]);
  });

  it("in an Html block's markup: an element's own `dir`, else the nearest around it in the markup, else the root's", () => {
    const markup = '<p class="ps-3 border-e-2 rounded-ss-md text-start">a</p><div dir="ltr"><p class="ps-3">b<br class="block"><span dir="rtl" class="pe-1">c</span></p></div><p dir="ltr" class="pe-1">d</p><p class="pe-1">e</p>';
    const html = (root: Props) => renderToJson(one(root, <Column><Html html={markup} /></Column>)).body.rows[0].columns[0].contents[0].values.html;
    expect(html({})).toBe(
      '<p style="border-top-left-radius: 6px; border-right-style: solid; border-right-width: 2px; padding-left: 12px; text-align: start">a</p><div dir="ltr"><p style="padding-left: 12px">b<br style="display: block"><span dir="rtl" style="padding-left: 4px">c</span></p></div><p dir="ltr" style="padding-right: 4px">d</p><p style="padding-right: 4px">e</p>'
    );
    expect(html(RTL)).toBe(
      '<p style="border-top-right-radius: 6px; border-left-style: solid; border-left-width: 2px; padding-right: 12px; text-align: start">a</p><div dir="ltr"><p style="padding-left: 12px">b<br style="display: block"><span dir="rtl" style="padding-left: 4px">c</span></p></div><p dir="ltr" style="padding-right: 4px">d</p><p style="padding-left: 4px">e</p>'
    );
    // The HTML has the same.
    expect(renderToHtml(one(RTL, <Column><Html html={markup} /></Column>))).toContain(html(RTL));
  });

  it("follow the direction the root renders in: its config, an <UnlayerProvider>'s, the renderer's; the async renderers' too, each render its own", async () => {
    const template = (root: Props = {}) => one(root, <Column className="ps-4 max-sm:ps-1"><Paragraph>Hi</Paragraph></Column>);
    const padding = (design: any) => design.body.rows[0].columns[0].values.padding;
    /** The body's direction, the Column's padding and its phone padding (the head's CSS). */
    const html = (out: string) => [/<body[^>]*dir="(\w+)"/.exec(out)?.[1], /class="v-col-padding[^"]*" style="[^"]*padding: ([^;]+);/.exec(out)?.[1], /#u_column_1 \.v-col-padding \{ padding: ([^!]+) !important/.exec(out)?.[1]];
    const right = ["rtl", "0px 16px 0px 0px", "0px 4px 0px 0px"];
    expect(padding(renderToJson(template({ config: { textDirection: "rtl" } })))).toBe("0px 16px 0px 0px");
    expect(html(renderToHtml(template({ config: { textDirection: "rtl" } })))).toEqual(right);
    const provided = <UnlayerProvider config={{ textDirection: "rtl" }}>{template()}</UnlayerProvider>;
    expect([renderToJson(provided).body.values.textDirection, padding(renderToJson(provided))]).toEqual(["rtl", "0px 16px 0px 0px"]);
    expect(html(renderToHtml(provided))).toEqual(right);
    expect(html(renderToHtml(template(), { textDirection: "rtl" }))).toEqual(right);
    // Rendered by React itself, as a Server Component would.
    expect(renderToStaticMarkup(template(RTL))).toMatch(/class="v-col-padding[^"]*" style="[^"]*padding: 0px 16px 0px 0px;/);
    // At once, a right-to-left render and a left-to-right one.
    const asyncOne = (root: Props) => (
      <Tailwind config={config}>
        <Email {...root}>
          <Row>
            <Column className="ps-4">
              <Paragraph>Hi</Paragraph>
            </Column>
          </Row>
        </Email>
      </Tailwind>
    );
    const [rtl, ltr] = await Promise.all([renderToJsonAsync(asyncOne(RTL)), renderToJsonAsync(asyncOne({}))]);
    expect([padding(rtl), padding(ltr)]).toEqual(["0px 16px 0px 0px", "0px 0px 0px 16px"]);
  });
});

describe("<Tailwind>: a Row's padding classes inset its content, as in CSS (in its Columns)", () => {
  const ROOTS = { Email, Page, Document } as const;
  const row = (rowClass: string, columns: Array<Record<string, unknown>> = [{}], rowProps: Record<string, unknown> = {}, Root: (typeof ROOTS)[keyof typeof ROOTS] = Email) => (
    <Tailwind tw={tw}>
      <Root className="bg-gray-100 max-w-[600px]">
        <Row className={rowClass} {...rowProps}>
          {columns.map((props, i) => (
            <Column key={i} {...props}>
              <Heading>Hi</Heading>
            </Column>
          ))}
        </Row>
      </Root>
    </Tailwind>
  );
  const values = (element: React.ReactElement) => {
    const { values: row, columns } = renderToJson(element).body.rows[0];
    return { row: row.padding, columns: columns.map((c: { values: Record<string, any> }) => [c.values.padding, c.values._override?.mobile?.padding]) };
  };

  it.each(Object.keys(ROOTS) as Array<keyof typeof ROOTS>)("%s: go to its Column, so the background covers them", (mode) => {
    const element = row("bg-white px-8 pt-10 pb-2", [{}], {}, ROOTS[mode]);
    expect(values(element)).toEqual({ row: "0px", columns: [["40px 32px 8px", undefined]] });
    expect(renderToJson(element).body.rows[0].values.columnsBackgroundColor).toBe("#fff");
    // In the HTML: none on the row; the padding is in the Column, inside the white content box.
    const html = renderToHtml(element);
    expect(html).not.toMatch(/<div id="u_row_1"[^>]*style="padding/);
    expect(html).toMatch(/class="v-col-padding[^"]*" style="[^"]*padding: ?40px 32px 8px;/);
    expect(warnings()).toEqual([]);
  });

  it("differ from the padding prop, which is the editor's, around the row", () => {
    const fromClasses = renderToJson(row("bg-white p-8", [{}, {}])).body.rows[0];
    const fromProps = renderToJson(row("bg-white", [{}, {}], { padding: 32 })).body.rows[0];
    expect([fromClasses.values.padding, fromClasses.columns.map((c: { values: Record<string, any> }) => c.values.padding)]).toEqual(["0px", ["32px 0px 32px 32px", "32px 32px 32px 0px"]]);
    expect([fromProps.values.padding, fromProps.columns.map((c: { values: Record<string, any> }) => c.values.padding)]).toEqual(["32px", ["0px", "0px"]]);
    // A prop given wins over a class, and is the editor's (said, with a content background: once in each render).
    expect(values(row("bg-white p-8", [{}], { padding: "4px" }))).toEqual({ row: "4px", columns: [["0px", undefined]] });
    expect(warnings()).toEqual(Array(2).fill("[Unlayer] Row padding sits outside the row's content background, as in the editor; to inset the content use the Columns' padding."));
  });

  it("split by side between Columns, added to their own (classes or props), and stack on phones", () => {
    expect(values(row("bg-white px-8 pt-10 pb-2", [{}, { className: "p-2" }]))).toEqual({
      row: "0px",
      columns: [
        ["40px 0px 8px 32px", "40px 32px 0px"],
        ["48px 40px 16px 8px", "8px 40px 16px"],
      ],
    });
    // Phone classes go to the Columns' phone padding; side by side (noStackMobile), as on desktop.
    expect(values(row("bg-white p-8 max-sm:p-4", [{}, {}])).columns).toEqual([
      ["32px 0px 32px 32px", "16px 16px 0px"],
      ["32px 32px 32px 0px", "0px 16px 16px"],
    ]);
    expect(values(row("p-8", [{}, {}], { noStackMobile: true })).columns).toEqual([
      ["32px 0px 32px 32px", undefined],
      ["32px 32px 32px 0px", undefined],
    ]);
    // Without a background too: its content is inset.
    expect(values(row("px-8 py-4"))).toEqual({ row: "0px", columns: [["16px 32px", undefined]] });
    expect(values(row("p-4", [{ padding: 8 }])).columns).toEqual([["24px", undefined]]);
  });

  it("lengths that don't add up are said, and that Column keeps its own", () => {
    expect(values(row("bg-white px-[2em]", [{ padding: "8px" }])).columns).toEqual([["8px", undefined]]);
    expect([...new Set(warnings())]).toEqual(["[Unlayer] Row padding `2em` from its classes can't be added to a Column's `8px`, so that Column keeps its own."]);
  });

  it("add a plain Column's margins to its padding: as in CSS, nothing is painted there", () => {
    expect(values(row("bg-white px-8 py-4", [{ className: "mr-2" }, { className: "ml-2" }]))).toEqual({
      row: "0px",
      columns: [
        ["16px 8px 16px 32px", "16px 32px 8px"],
        ["16px 32px 16px 8px", "8px 32px 16px"],
      ],
    });
    expect(warnings()).toEqual([]);
  });
});

describe("<Tailwind>: card grids, with the Row's padding and the Columns' margins as gutters in the color around the cards", () => {
  type Props = Record<string, unknown>;
  const ROOTS = { Email, Page, Document } as const;
  const grid = (rowClass: string, columns: Props[], { root = {}, row = {}, Root = Email }: { root?: Props; row?: Props; Root?: (typeof ROOTS)[keyof typeof ROOTS] } = {}) => (
    <Tailwind tw={tw}>
      <Root className="bg-gray-100 max-w-[600px]" {...root}>
        <Row className={rowClass} {...row}>
          {columns.map((props, i) => (
            <Column key={i} {...props}>
              <Paragraph>Card {i}</Paragraph>
            </Column>
          ))}
        </Row>
      </Root>
    </Tailwind>
  );
  /** A border's four widths in one string (`top right bottom left`), and its colors where they show. */
  const sides = (border: Record<string, string> | undefined) =>
    border && [["Top", "Right", "Bottom", "Left"].map((side) => border[`border${side}Width`] ?? "-").join(" "), [...new Set(["Top", "Right", "Bottom", "Left"].filter((side) => parseFloat(border[`border${side}Width`]) > 0).map((side) => border[`border${side}Color`]))].join(" ")];
  const cards = (element: React.ReactElement) => {
    const { values: row, columns } = renderToJson(element).body.rows[0];
    return {
      row: row.padding,
      columns: columns.map(({ values: v }: { values: Record<string, any> }) => ({
        padding: v.padding,
        border: sides(v.border),
        radius: v.borderRadius,
        ...(v._override?.mobile ? { phone: { ...v._override.mobile, ...(v._override.mobile.border ? { border: sides(v._override.mobile.border) } : {}) } } : {}),
      })),
    };
  };
  const CARD = "bg-zinc-50 rounded-lg p-4";
  const square = (why: string) =>
    `[Unlayer] Row can't keep its cards' rounded corners, so they're square: in the editor a corner is a circle, and ${why}. Make each corner's two gutters equal, and the same on phones (the Row's padding, the Columns' margins), to keep them round.`;
  const SQUARE = square("the gutters that meet at one differ (40px and 16px)");

  it("inset the cards in the Row's content box, as in CSS: the outer sides are its padding, the inner ones their margins", () => {
    expect(cards(grid("bg-white px-10 py-4", [{ className: `${CARD} mr-2` }, { className: `${CARD} ml-2` }]))).toEqual({
      row: "0px",
      columns: [
        // On phones, stacked: the Row's sides each, its top the first's, its bottom the last's, and the space between
        // the two as on desktop (the first's right margin below it, the second's left margin above it).
        { padding: "16px", border: ["16px 8px 16px 40px", "#fff"], radius: "0px", phone: { border: ["16px 40px 8px 40px", "#fff"] } },
        { padding: "16px", border: ["16px 40px 16px 8px", "#fff"], radius: "0px", phone: { border: ["8px 40px 16px 40px", "#fff"] } },
      ],
    });
    // The corners meet gutters of 40px and 16px: they can't stay circles, so they're square (said once per render).
    expect(warnings()).toEqual([SQUARE]);
  });

  it.each(Object.keys(ROOTS) as Array<keyof typeof ROOTS>)("%s: the HTML has the borders and the design's phone ones", (mode) => {
    const element = grid("bg-white px-10 py-4", [{ className: `${CARD} mr-2` }, { className: `${CARD} ml-2` }], { Root: ROOTS[mode] });
    const html = renderToHtml(element);
    expect(html).not.toMatch(/<div id="u_row_1"[^>]*style="padding: ?16px 40px/);
    expect(html).toMatch(/v-col-border[^"]*" style="[^"]*border-top: 16px solid #fff;border-left: 40px solid #fff;border-right: 8px solid #fff;border-bottom: 16px solid #fff;/);
    // A web page has no phone border for a Column (the editor's web export writes its rule for an element it hasn't).
    if (mode !== "Document") expect(html).toContain("#u_column_1 .v-col-border { border-top: 16px solid #fff !important;border-left: 40px solid #fff !important;border-right: 40px solid #fff !important;border-bottom: 8px solid #fff !important; }");
    expect(warnings()).toEqual(mode === "Page" ? [SQUARE, "[Unlayer] Row keeps its cards' desktop gutters on phones: the editor's web export has no phone border for a Column."] : [SQUARE]);
  });

  it("keep rounded corners round where each corner's gutters are equal, grown by them (a radius is its outer edge's)", () => {
    expect(cards(grid("bg-white p-2", [{ className: `${CARD} mr-2` }, { className: `${CARD} ml-2` }]))).toEqual({
      row: "0px",
      columns: [
        { padding: "16px", border: ["8px 8px 8px 8px", "#fff"], radius: "16px" },
        { padding: "16px", border: ["8px 8px 8px 8px", "#fff"], radius: "16px" },
      ],
    });
    expect(warnings()).toEqual([]);
    // A Column's corners are the same on phones: there, its gutters must give the same radius.
    const phones = cards(grid("bg-white p-2 max-sm:p-4", [{ className: `${CARD} mr-2 max-sm:mr-4` }, { className: `${CARD} ml-2 max-sm:ml-4` }], { row: { noStackMobile: true } }));
    expect(phones.columns[0]).toEqual({ padding: "16px", border: ["8px 8px 8px 8px", "#fff"], radius: "0px", phone: { border: ["16px 16px 16px 16px", "#fff"] } });
    expect(warnings()).toEqual([square("a corner's gutters on phones differ from its gutters on desktop, and its radius is the same on both")]);
    warn.mockClear();
    cards(grid("bg-white p-2 max-sm:px-4", [{ className: `${CARD} mr-2` }, { className: `${CARD} ml-2` }]));
    expect(warnings()).toEqual([square("on phones the gutters that meet at one differ (16px and 8px)")]);
  });

  it("paint the gutters the color around the cards: the Row's content background, its background, the body's", () => {
    const color = (element: React.ReactElement) => cards(element).columns[0].border[1];
    const columns = [{ className: "bg-white mr-2" }, { className: "bg-white ml-2" }];
    expect(color(grid("bg-zinc-100 px-4", columns))).toBe("#f4f4f5");
    expect(color(grid("px-4", columns, { row: { backgroundColor: "#123456" } }))).toBe("#123456");
    expect(color(grid("px-4", columns))).toBe("#f3f4f6");
    expect(color(grid("px-4", columns, { root: { className: undefined, backgroundColor: "#fedcba" } }))).toBe("#fedcba");
    // The editor's default body background, where nothing sets one.
    expect(color(grid("px-4", columns, { root: { className: undefined } }))).toBe("#F7F8F9");
    expect(warnings()).toEqual([]);
  });

  it("work for a Row without classes, from its Columns' margins", () => {
    const element = (
      <Tailwind tw={tw}>
        <Email className="bg-gray-100">
          <Row>
            <Column className="bg-white mr-2"><Paragraph>One</Paragraph></Column>
            <Column className="bg-white ml-2"><Paragraph>Two</Paragraph></Column>
          </Row>
        </Email>
      </Tailwind>
    );
    expect(cards(element).columns.map((c: { border: string[] }) => c.border)).toEqual([["0px 8px 0px 0px", "#f3f4f6"], ["0px 0px 0px 8px", "#f3f4f6"]]);
    expect(warnings()).toEqual([]);
  });

  it("can't be a card's border where it has one of its own, or around what isn't one opaque color: the Row keeps its padding, said", () => {
    const keep = (why: string) => `[Unlayer] Row keeps the padding from its classes around its Columns, as the editor's padding: its cards' gutters would be borders in the color around them, and ${why}.`;
    const ignored = (side: string, className: string) => `[Unlayer] Column ignores \`margin-${side}: 8px\` from class \`${className}\`.`;
    const columns = [{ className: "bg-white border border-zinc-200 mr-2" }, { className: "bg-white ml-2" }];
    expect(cards(grid("bg-zinc-100 px-10 py-4", columns))).toMatchObject({ row: "16px 40px", columns: [{ padding: "0px", border: ["1px 1px 1px 1px", "#e4e4e7"] }, { padding: "0px" }] });
    expect(warnings()).toEqual([keep("a card has a border of its own on a side its gutter needs"), ignored("right", "mr-2"), ignored("left", "ml-2")]);
    warn.mockClear();
    cards(grid("bg-black/50 px-4", [{ className: "bg-white" }]));
    cards(grid("px-4", [{ className: "bg-white" }], { row: { backgroundImage: { url: "https://example.com/a.png", fullWidth: false } } }));
    expect(warnings()).toEqual([
      keep("that color (`rgba(0, 0, 0, 0.5)`) isn't opaque"),
      keep("a background image is around them, not one color"),
    ]);
  });

  it("need the Row's background in a Row rendered on its own (renderRowToJson has no body)", () => {
    // A Row on its own isn't in a <Tailwind>: its Columns' margins (in one) give the gutters.
    const row = (props: Record<string, unknown>) =>
      renderRowToJson(
        <Row {...props}>
          <Tailwind tw={tw}>
            <Column className="bg-white px-4 mr-2"><Paragraph>One</Paragraph></Column>
            <Column className="bg-white px-4 ml-2"><Paragraph>Two</Paragraph></Column>
          </Tailwind>
        </Row>
      );
    expect(row({ columnsBackgroundColor: "#eeeeee" }).columns[0].values.border).toMatchObject({ borderRightWidth: "8px", borderRightColor: "#eeeeee", borderLeftWidth: "0px" });
    expect(warnings()).toEqual([]);
    expect(row({}).columns[0].values.border).toEqual({});
    expect(warnings()).toEqual([
      "[Unlayer] Row can't give its cards gutters: they'd be borders in the color around them, and that color isn't known for a Row on its own (give the Row a background, `bg-*`).",
      "[Unlayer] Column ignores `margin-right: 8px` from class `mr-2`.",
      "[Unlayer] Column ignores `margin-left: 8px` from class `ml-2`.",
    ]);
  });
});

const MODES = { Email, Page, Document } as const;
type Mode = keyof typeof MODES;
/** A template: the root's, the Row's and the Column's classes, around `content`. */
const nested = (classes: { root?: string; row?: string; column?: string }, content: React.ReactNode, Root: (typeof MODES)[Mode] = Email) => (
  <Tailwind tw={tw}>
    <Root className={classes.root}>
      <Row className={classes.row}>
        <Column className={classes.column}>{content}</Column>
      </Row>
    </Root>
  </Tailwind>
);
/** The values of the first Column's blocks in the design. */
const contents = (element: React.ReactElement) => renderToJson(element).body.rows[0].columns[0].contents.map((c: { values: Record<string, any> }) => c.values);

describe("<Tailwind>: text styles on a Row, a Column or the root are the text blocks' inside, as CSS inherits them", () => {
  it("gives Paragraph, Heading, Menu and Table the Column's, a Button its label's and its place, Social its place", () => {
    const [p, h, b, m, t, s] = contents(
      nested(
        { column: "bg-indigo-600 text-white text-center text-lg font-semibold tracking-wide" },
        <>
          <Paragraph>Hi</Paragraph>
          <Heading>Title</Heading>
          <Button href="https://example.com">Go</Button>
          <Menu items={[{ text: "Home", href: "https://example.com" }]} />
          <Table headers={["A"]} data={[["1"]]} />
          <Social icons={[]} />
        </>
      )
    );
    expect(p).toMatchObject({ color: "#fff", textAlign: "center", fontSize: "18px", lineHeight: "155.56%", fontWeight: 600, letterSpacing: "0.025em" });
    expect(h).toMatchObject({ color: "#fff", textAlign: "center", fontSize: "18px", lineHeight: "155.56%", fontWeight: 600 });
    // A Button's label sits on its own background, and an email client gives a link its own color: not the color.
    expect(b).toMatchObject({ textAlign: "center", fontSize: "18px", fontWeight: 600, letterSpacing: "0.025em" });
    expect(b.buttonColors.color).toBe("#FFFFFF");
    expect(m).toMatchObject({ textColor: "#fff", align: "center", fontSize: "18px", fontWeight: 600 });
    expect(t).toMatchObject({ headerColor: "#fff", contentColor: "#fff", footerColor: "#fff", contentTextAlign: "center", headerFontSize: "18px", contentFontSize: "18px", contentLineHeight: "155.56%", contentFontWeight: 600 });
    expect(s).toMatchObject({ align: "center" });
    // All in the design: nothing kept in HTML only.
    expect(warnings()).toEqual([]);
  });

  it("lets a block's own classes and props win, and the nearest container's over the ones around it", () => {
    const element = (
      <Tailwind tw={tw}>
        <Email className="text-gray-800 text-sm">
          <Row className="text-red-500 text-right">
            <Column className="text-white">
              <Paragraph className="text-left">Own class</Paragraph>
              <Paragraph color="#123456">Own prop</Paragraph>
              <Paragraph textColor="#654321" align="center">Its other names</Paragraph>
              <Heading className="text-blue-600 text-2xl">Own size</Heading>
            </Column>
          </Row>
          <Row className="text-red-500">
            <Column>
              <Paragraph>The Row's</Paragraph>
            </Column>
          </Row>
          <Row>
            <Column>
              <Paragraph>The root's</Paragraph>
            </Column>
          </Row>
        </Email>
      </Tailwind>
    );
    const rows = renderToJson(element).body.rows.map((r: any) => r.columns[0].contents.map((c: any) => c.values));
    const [ownClass, ownProp, aliases, heading] = rows[0];
    expect(ownClass).toMatchObject({ color: "#fff", textAlign: "left", fontSize: "14px", lineHeight: "142.86%" });
    expect(ownProp).toMatchObject({ color: "#123456", textAlign: "right" });
    expect(aliases).toMatchObject({ color: "#654321", textAlign: "center" });
    expect(heading).toMatchObject({ color: "#155dfc", fontSize: "24px", textAlign: "right" });
    expect(rows[1][0]).toMatchObject({ color: "#fb2c36", fontSize: "14px" });
    expect(rows[2][0]).toMatchObject({ color: "#1e2939", fontSize: "14px" });
  });

  it("maps the root's color and font to the body's, as the editor has them, and shows the color in the text blocks", () => {
    const json = renderToJson(nested({ root: "text-gray-800 font-serif text-center" }, <><Paragraph>Hi</Paragraph><Heading>Title</Heading></>));
    expect(json.body.values.textColor).toBe("#1e2939");
    expect(json.body.values.fontFamily.value).toMatch(/^ui-serif/);
    const [p, h] = json.body.rows[0].columns[0].contents.map((c: any) => c.values);
    expect(p).toMatchObject({ color: "#1e2939", textAlign: "center" });
    expect(h).toMatchObject({ color: "#1e2939", textAlign: "center" });
    // The font is the body's, which the text blocks show (the editor's), not theirs.
    expect(p.fontFamily).toBeUndefined();
    expect(warnings()).toEqual([]);
  });

  it("passes phone variants on to the blocks' phone settings, where a block sets nothing for that style", () => {
    const [plain, own, ownPhone] = contents(
      nested(
        { row: "text-lg max-sm:text-sm", column: "max-sm:text-center" },
        <>
          <Paragraph>Hi</Paragraph>
          <Paragraph className="text-left text-base">Hi</Paragraph>
          <Paragraph className="max-sm:text-right">Hi</Paragraph>
        </>
      )
    );
    expect(plain).toMatchObject({ fontSize: "18px", _override: { mobile: { fontSize: "14px", lineHeight: "142.86%", textAlign: "center" } } });
    // Its own classes apply on phones too, as a rule of its own does in CSS.
    expect(own).toMatchObject({ fontSize: "16px", textAlign: "left" });
    expect(own._override?.mobile).toBeUndefined();
    expect(ownPhone._override.mobile).toMatchObject({ textAlign: "right", fontSize: "14px" });
  });

  it.each(Object.keys(MODES) as Mode[])("%s: the HTML shows them in the text blocks, not on the Column", (mode) => {
    const html = renderToHtml(nested({ root: "text-gray-800", row: "text-center", column: "text-white" }, <><Paragraph>Hi</Paragraph><Heading className="text-left">Title</Heading></>, MODES[mode]));
    expect(html).toMatch(/<div [^>]*v-text-align[^>]*style="[^"]*color: #fff;[^"]*text-align: center/);
    expect(html).toMatch(/<h1 [^>]*style="[^"]*color: #fff;[^"]*text-align: left/);
    expect(html).not.toMatch(/id="u_column_1"[^>]*style="[^"]*color: ?#fff/);
    expect(warnings()).toEqual([]);
  });

  it.each(Object.keys(MODES) as Mode[])("%s: markup in the Column (an Html block) gets them as an inline style on it, said", (mode) => {
    const element = nested({ column: "text-white text-center" }, <><Paragraph>Hi</Paragraph><Html html="<p>Markup</p>" /></>, MODES[mode]);
    const cell = renderToHtml(element).match(/id="u_column_1"[^>]*>/)![0];
    expect(cell).toMatch(/style="[^"]*color:#fff/);
    expect(cell).toMatch(/style="[^"]*text-align:center/);
    expect(warnings().sort()).toEqual([
      "[Unlayer] Column `color: #fff` from class `text-white` is kept in HTML (an inline style) for the markup in it, but not in the design for the visual editor.",
      "[Unlayer] Column `text-align: center` from class `text-center` is kept in HTML (an inline style) for the markup in it, but not in the design for the visual editor.",
    ]);
    // The design: in the Paragraph, not on the Column.
    warn.mockClear();
    const json = renderToJson(element).body.rows[0].columns[0];
    expect(json.contents[0].values).toMatchObject({ color: "#fff", textAlign: "center" });
    expect(JSON.stringify(json.values)).not.toContain("#fff");
  });

  it("keeps the styles that aren't props (case, italics, decoration) on the Column, where they reach the text as in CSS", () => {
    const html = renderToHtml(nested({ column: "uppercase italic text-white" }, <Paragraph>Hi</Paragraph>));
    expect(html).toMatch(/id="u_column_1"[^>]*style="[^"]*text-transform:uppercase;font-style:italic/);
    expect(warnings()).toEqual([
      "[Unlayer] Column `text-transform: uppercase` from class `uppercase` is kept in HTML (an inline style) but not in the design for the visual editor.",
      "[Unlayer] Column `font-style: italic` from class `italic` is kept in HTML (an inline style) but not in the design for the visual editor.",
    ]);
  });
});

describe("<Tailwind>: a border without a color is the text color (Tailwind's currentColor)", () => {
  const sides = (border: Record<string, string>) => ["Top", "Right", "Bottom", "Left"].map((side) => border[`border${side}Color`]);

  it("on a Column: its own text color, else the Row's, the root's, or the body's default", () => {
    const column = (classes: { root?: string; row?: string; column?: string }) => renderToJson(nested(classes, <Paragraph>Hi</Paragraph>)).body.rows[0].columns[0].values;
    expect(sides(column({ column: "border" }).border)).toEqual(Array(4).fill("#000000"));
    expect(sides(column({ column: "border-2 text-white" }).border)).toEqual(Array(4).fill("#fff"));
    expect(sides(column({ row: "text-red-500", column: "border" }).border)).toEqual(Array(4).fill("#fb2c36"));
    expect(sides(column({ root: "text-gray-800", column: "border-t" }).border)[0]).toBe("#1e2939");
    // A color class wins, as in CSS; a side without a width has none.
    expect(sides(column({ column: "border border-zinc-300 text-white" }).border)).toEqual(Array(4).fill("#d4d4d8"));
    expect(column({ column: "border-t" }).border.borderBottomColor).toBeUndefined();
    // On phones too, where only a phone class sets the width.
    expect(column({ column: "text-white max-sm:border-2" })._override.mobile.border).toMatchObject({ borderTopWidth: "2px", borderTopColor: "#fff" });
  });

  it("on a Button: its own label's color; on a Divider: the text color around it", () => {
    const [button, plainButton, divider] = contents(
      nested(
        { column: "text-red-500" },
        <>
          <Button className="border-2 text-white bg-black">Go</Button>
          <Button className="border">Go</Button>
          <Divider className="border-t-2" />
        </>
      )
    );
    expect(button.border).toMatchObject({ borderTopWidth: "2px", borderTopColor: "#fff", borderLeftColor: "#fff" });
    expect(plainButton.border).toMatchObject({ borderTopColor: "#FFFFFF" });
    expect(divider.border).toMatchObject({ borderTopWidth: "2px", borderTopStyle: "solid", borderTopColor: "#fb2c36" });
    // Without anything around it: the body's text color.
    expect(block(<Divider className="border-t-4" />).border.borderTopColor).toBe("#000000");
  });

  it.each(Object.keys(MODES) as Mode[])("%s: the HTML draws them in that color", (mode) => {
    const html = renderToHtml(nested({ root: "text-gray-800", column: "border" }, <Divider className="border-t-2" />, MODES[mode]));
    expect(html).toMatch(/border-top: ?1px solid #1e2939/);
    expect(html).toMatch(/border-top(: |-width:)2px[^"]*#1e2939/);
    expect(html).not.toContain("currentColor");
  });
});

describe("<Tailwind>: an Image's width classes", () => {
  const src = (className: string) => block(<Image src="https://example.com/a.png" className={className} />).src;

  it("hold a width and a max width together, as the browser shows them (the smaller one)", () => {
    // 320px of the 480px the block has.
    expect(src("w-full max-w-xs")).toMatchObject({ autoWidth: false, maxWidth: "66.67%" });
    expect(src("max-w-xs w-full")).toMatchObject({ autoWidth: false, maxWidth: "66.67%" });
    expect(src("w-64 max-w-xs")).toMatchObject({ autoWidth: false, maxWidth: "53.33%" });
    expect(src("w-96 max-w-xs")).toMatchObject({ autoWidth: false, maxWidth: "66.67%" });
    expect(src("w-1/2 max-w-full")).toMatchObject({ autoWidth: false, maxWidth: "50%" });
    expect(src("w-full max-w-[560px]")).toMatchObject({ autoWidth: false, maxWidth: "100%" });
    expect(warnings()).toEqual([]);
    // A percentage and pixels: which is smaller depends on the column, and the editor's image has one width.
    expect(src("w-1/2 max-w-xs")).toMatchObject({ maxWidth: "50%" });
    expect(warnings()).toEqual(["[Unlayer] Image can't hold both `width: 50%` and `max-width: 320px` from its classes (the editor's image has one width), so it's 50%."]);
  });

  it("hold a min width too, as CSS does (it wins over the max width)", () => {
    // 320px of the 480px the block has; 400px is 83.33%.
    expect(src("w-64 min-w-xs")).toMatchObject({ autoWidth: false, maxWidth: "66.67%" });
    expect(src("w-96 min-w-xs")).toMatchObject({ autoWidth: false, maxWidth: "80%" });
    expect(src("w-64 min-w-[400px] max-w-xs")).toMatchObject({ autoWidth: false, maxWidth: "83.33%" });
    expect(src("min-w-xs max-w-[400px]")).toMatchObject({ autoWidth: false, maxWidth: "83.33%" });
    expect(warnings()).toEqual([]);
    expect(src("w-1/2 min-w-xs")).toMatchObject({ maxWidth: "50%" });
    expect(warnings()).toEqual(["[Unlayer] Image can't hold both `width: 50%` and `min-width: 320px` from its classes (the editor's image has one width), so it's 50%."]);
  });

  it("take `w-auto` as the editor's auto width", () => {
    expect(src("w-auto")).toMatchObject({ autoWidth: true, maxWidth: "100%" });
    expect(src("w-auto max-w-xs")).toMatchObject({ autoWidth: false, maxWidth: "66.67%" });
    expect(warnings()).toEqual([]);
  });

  it.each(Object.keys(MODES) as Mode[])("%s: the HTML holds the max width, and `w-auto` stays in its column", (mode) => {
    const html = renderToHtml(
      nested(
        {},
        <>
          <Image src="https://example.com/a.png" className="w-full max-w-xs" />
          <Image src="https://example.com/b.png" className="w-auto" />
        </>,
        MODES[mode]
      )
    );
    const [capped, auto] = html.match(/<img [^>]*>/g)!;
    expect(capped).toMatch(/max-width: 320(\.\d+)?px/);
    expect(auto).toMatch(/width: 100%/);
    expect(auto).not.toMatch(/width: ?auto/);
  });
});

describe("<Tailwind>: the root's width classes", () => {
  const width = (className: string, root: Record<string, unknown> = {}) => design(<Paragraph>Hi</Paragraph>, { className, ...root }).body.values.contentWidth;

  it("are one content width, as CSS sizes the box: the max width caps the width, the min width wins over both", () => {
    expect(width("w-[600px] max-w-[800px]")).toBe("600px");
    expect(width("max-w-[800px] w-[600px]")).toBe("600px");
    expect(width("max-w-[500px] w-[600px]")).toBe("500px");
    expect(width("w-[600px] max-w-[500px]")).toBe("500px");
    expect(width("w-[600px] min-w-[640px]")).toBe("640px");
    expect(width("w-[600px] min-w-[640px] max-w-[620px]")).toBe("640px");
    expect(width("w-[600px] min-w-[500px] max-w-[800px]")).toBe("600px");
    expect(width("max-w-[700px] min-w-[640px]")).toBe("700px");
    // A width alone, a max width alone (the box is as wide as it allows), the whole window capped.
    expect(width("w-[600px]")).toBe("600px");
    expect(width("max-w-[640px]")).toBe("640px");
    expect(width("w-full max-w-[640px]")).toBe("640px");
    expect(width("w-1/2 max-w-[80%]")).toBe("50%");
    expect(warnings()).toEqual([]);
  });

  it("keep the width where which one wins depends on the window's width, and say so", () => {
    expect(width("w-[600px] max-w-[90%]")).toBe("600px");
    expect(width("w-[80%] min-w-[500px]")).toBe("80%");
    expect(warnings()).toEqual([
      "[Unlayer] Email can't hold both `width: 600px` and `max-width: 90%` from its classes (the design has one content width), so it's 600px.",
      "[Unlayer] Email can't hold both `width: 80%` and `min-width: 500px` from its classes (the design has one content width), so it's 80%.",
    ]);
  });

  it("leave a min width alone in the HTML, and lose to a `contentWidth` given", () => {
    const body = design(<Paragraph>Hi</Paragraph>, { className: "min-w-[640px]" }).body.values;
    expect(body.contentWidth).toBe(design(<Paragraph>Hi</Paragraph>).body.values.contentWidth);
    expect(warnings()).toEqual(["[Unlayer] Email `min-width: 640px` from class `min-w-[640px]` is kept in HTML (an inline style) but not in the design for the visual editor."]);
    expect(width("w-[600px] max-w-[800px]", { contentWidth: "700px" })).toBe("700px");
  });

  it.each(Object.keys(MODES) as Mode[])("%s: the HTML is that wide", (mode) => {
    const html = renderToHtml(nested({ root: "w-[600px] max-w-[800px]" }, <Paragraph>Hi</Paragraph>, MODES[mode]));
    expect(html).toMatch(/\b600px/);
    expect(html).not.toMatch(/\b800px/);
  });
});

describe("<Tailwind>: what a component can't take is said", () => {
  const kept = (rule: string, className: string, name = "Paragraph") =>
    `[Unlayer] ${name} \`${rule}\` from class \`${className}\` is kept in HTML (an inline style) but not in the design for the visual editor.`;

  it("inlines a class no prop takes on the component's element, said once per render", () => {
    const html = renderToHtml(
      <Tailwind tw={tw}>
        <Email>
          <Row>
            <Column>
              <Button className="grid" href="https://example.com">Go</Button>
              <Paragraph className="uppercase italic" style={{ fontStyle: "normal" }}>Hi</Paragraph>
              <Image src="https://example.com/a.png" className="rounded-lg" />
            </Column>
          </Row>
        </Email>
      </Tailwind>
    );
    expect(html).toMatch(/<a [^>]*style="[^"]*;display:grid"/);
    // Its own `style` wins over a class.
    expect(html).toMatch(/<div [^>]*v-text-align[^>]*style="[^"]*;text-transform:uppercase;font-style:normal"/);
    expect(html).toMatch(/<img [^>]*style="[^"]*;border-radius:8px"/);
    expect(warnings()).toEqual([kept("display: grid", "grid", "Button"), kept("text-transform: uppercase", "uppercase"), kept("font-style: italic", "italic"), kept("border-radius: 8px", "rounded-lg", "Image")]);
    // The design: said by the classes once, and the block's own style too.
    warn.mockClear();
    design(<Paragraph className="uppercase" style={{ fontStyle: "normal" }}>Hi</Paragraph>);
    expect(warnings()).toEqual([kept("text-transform: uppercase", "uppercase"), "[Unlayer] Paragraph `style.fontStyle` is kept in HTML but not in the design for the visual editor."]);
  });

  it("says why for each kind", () => {
    block(<Paragraph className="dark:bg-black nonsense max-sm:text-red-500 uppercase mx-auto bg-white focus:text-red-500 max-sm:italic hover:underline">Hi</Paragraph>);
    block(<Paragraph className="sm:text-red-500">Hi</Paragraph>);
    expect(warnings()).toEqual([
      "[Unlayer] Paragraph ignores class `dark:bg-black`: it applies only for @media (prefers-color-scheme: dark).",
      "[Unlayer] Paragraph ignores class `nonsense`: Tailwind has no such class.",
      "[Unlayer] Paragraph ignores class `focus:text-red-500`: it applies only for `:focus`.",
      kept("background-color: #fff", "bg-white"),
      "[Unlayer] Paragraph ignores `margin-inline: auto` from class `mx-auto`: its `containerPadding` can't be negative or automatic.",
      kept("text-transform: uppercase", "uppercase"),
      "[Unlayer] Paragraph ignores `font-style: italic` from class `max-sm:italic`.",
      "[Unlayer] Paragraph has no phone setting for `color` (class `max-sm:text-red-500`).",
      "[Unlayer] Paragraph has no hover style for `text-decoration-line` (class `hover:underline`).",
      "[Unlayer] Paragraph can't set `color` for one screen size (class `sm:text-red-500`).",
    ]);
  });
});

describe("<Tailwind config> with the synchronous renderers", () => {
  const message = '[Unlayer] <Tailwind config> needs `tw`: `await loadTailwind(config)` from "@unlayer/react-elements/tailwind", or the async renderers ("@unlayer/react-elements/async"), which compile it (these are synchronous).';
  const template = (root?: string, paragraph?: string) => (
    <Tailwind config={config}>
      <Email className={root}>
        <Row>
          <Column>
            <Paragraph className={paragraph}>Hi</Paragraph>
          </Column>
        </Row>
      </Email>
    </Tailwind>
  );

  it("throws, for a block's classes or the root's, in every renderer", () => {
    for (const element of [template(undefined, "text-brand"), template("bg-gray-100")]) {
      expect(() => renderToHtml(element)).toThrow(message);
      expect(() => renderToPlainText(element)).toThrow(message);
      expect(() => renderToJson(element)).toThrow(message);
      expect(() => renderToHtmlParts(element)).toThrow(message);
    }
  });

  it("throws even after the async renderers compiled the same config", async () => {
    await renderToJsonAsync(template(undefined, "text-brand"));
    expect(() => renderToJson(template(undefined, "text-brand"))).toThrow(message);
  });

  it("renders when there are no classes to read", () => {
    expect(renderToPlainText(template())).toBe("Hi");
  });

  it("says what `tw` takes when it's something else", () => {
    expect(() => renderToJson(<Tailwind tw={{ config: undefined }}>{template(undefined, "p-2").props.children}</Tailwind>)).toThrow('[Unlayer] <Tailwind tw> takes `await loadTailwind(config)` from "@unlayer/react-elements/tailwind".');
  });
});

/** A seeded random number generator (mulberry32): the same inputs every run. */
function random(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
