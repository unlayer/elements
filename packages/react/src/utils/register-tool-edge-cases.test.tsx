/**
 * Edge cases for registerElementsTool, modeled on real-world custom tool
 * shapes (a product card with option-group defaults and nested values, and
 * a head-heavy tool whose css keys off values._meta.htmlID).
 */
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { registerElementsTool } from "./register-tool";
import { renderToHtml, renderToHtmlParts, renderToPlainText } from "./render-to-html";
import { renderToJson } from "./render-to-json";
import Email from "../components/Email";
import Page from "../components/Page";
import Row from "../components/Row";
import Column from "../components/Column";

const inEmail = (...children: React.ReactElement[]) => (
  <Email>
    <Row>
      <Column>{children}</Column>
    </Row>
  </Email>
);

// ---------------------------------------------------------------------------
// A realistic product-card tool: values: {} with ALL defaults on option
// widgets, nested object values, a rich-text default, and editor-only
// fields at every level (label/icon/widget/position/transformer/usageLimit).
// ---------------------------------------------------------------------------
const productTool = {
  name: "product_tool",
  label: "Product",
  icon: "fa-smile",
  supportedDisplayModes: ["web", "email"],
  usageLimit: 4,
  transformer: (values: any) => values, // editor-only
  options: {
    productContent: {
      title: "Product Content",
      position: 1,
      options: {
        productImage: {
          label: "Product Image",
          defaultValue: { url: "https://example.com/default-product.png" },
          widget: "image",
        },
        productTitle: { label: "Product Title", defaultValue: "Product Title", widget: "text" },
        productTitleColor: { label: "Title Color", defaultValue: "#000000", widget: "color_picker" },
        productDescription: {
          label: "Description",
          defaultValue: "Lorem ipsum <strong>rich</strong> text.",
          widget: "rich_text",
        },
        productPrice: { label: "Price", defaultValue: "7.99", widget: "text" },
        productCTA: { label: "Button Name", defaultValue: "Buy Now", widget: "text" },
        productCTAAction: {
          label: "Action",
          defaultValue: { name: "web", values: { href: "http://example.com", target: "_blank" } },
          widget: "link",
        },
        hiddenOption: { label: "Off", defaultValue: "should-not-appear", enabled: false },
      },
    },
  },
  values: {},
  renderer: {
    Viewer: () => "editor-only",
    exporters: {
      web: (values: any) =>
        // link-widget values arrive in render shape ({ url, target }) — the
        // same access pattern editor custom tools use
        `<div class="product-card"><img src="${values.productImage.url}"/><h3 style="color:${values.productTitleColor}">${values.productTitle}</h3><div>${values.productDescription}</div><a href="${values.productCTAAction.url}" target="${values.productCTAAction.target}">${values.productCTA} $${values.productPrice}</a></div>`,
      email: (values: any) =>
        `<table class="product-card-email"><tr><td><a href="${values.productCTAAction.url}">${values.productCTA} $${values.productPrice}</a></td></tr></table>`,
    },
    head: {
      css: () => undefined, // real tools often return nothing
      js: () => undefined,
    },
  },
};

describe("edge: option-group defaults (the common real-world shape)", () => {
  const Product = registerElementsTool(productTool as any);

  it("seeds values from widget defaultValues when values is {}", () => {
    const html = renderToHtml(inEmail(<Product />));
    expect(html).toContain("Buy Now $7.99");
    expect(html).toContain("http://example.com");
  });

  it("nested object defaults survive (image url, link action)", () => {
    const html = renderToHtml(
      <Page>
        <Row>
          <Column>
            <Product />
          </Column>
        </Row>
      </Page>
    );
    expect(html).toContain('src="https://example.com/default-product.png"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain("Lorem ipsum <strong>rich</strong> text.");
  });

  it("disabled options contribute no default", () => {
    const json = renderToJson(inEmail(<Product />));
    const values = json.body.rows[0].columns[0].contents[0].values;
    expect(values.hiddenOption).toBeUndefined();
    expect("should-not-appear" in values).toBe(false);
  });

  it("flat props override option defaults", () => {
    const html = renderToHtml(inEmail(<Product productPrice="19.99" productCTA="Order" />));
    expect(html).toContain("Order $19.99");
  });

  it("tool-level values win over option defaults (editor precedence)", () => {
    const Tool = registerElementsTool({
      ...productTool,
      name: "product_tool_valued",
      values: { productPrice: "0.99" },
    } as any);
    const html = renderToHtml(inEmail(<Tool />));
    expect(html).toContain("$0.99");
  });

  it("deep-merges a partial nested override with the object default", () => {
    const html = renderToHtml(
      <Page>
        <Row>
          <Column>
            <Product values={{ productCTAAction: { values: { href: "https://shop.example" } } }} />
          </Column>
        </Row>
      </Page>
    );
    expect(html).toContain('href="https://shop.example"');
    // target from the default object is preserved by the deep merge
    expect(html).toContain('target="_blank"');
  });

  it("emits option defaults into design JSON for the property panel", () => {
    const json = renderToJson(inEmail(<Product productPrice="42" />));
    const content = json.body.rows[0].columns[0].contents[0];
    expect(content.type).toBe("custom");
    expect(content.slug).toBe("product_tool");
    expect(content.values.productPrice).toBe("42");
    expect(content.values.productTitle).toBe("Product Title");
    expect(content.values.productImage).toEqual({ url: "https://example.com/default-product.png" });
  });
});

// ---------------------------------------------------------------------------
// Head behaviors: css keyed on values._meta.htmlID and option defaults,
// per-mode branching via the third argument, js emission, undefined heads.
// ---------------------------------------------------------------------------
const headTool = {
  name: "head_tool",
  options: {
    text: {
      title: "Text",
      options: {
        backgroundColor: { label: "Background", defaultValue: "#FFF000", widget: "color_picker" },
      },
    },
  },
  values: {},
  renderer: {
    exporters: {
      web: () => '<div class="ht">head tool</div>',
      email: () => '<div class="ht">head tool</div>',
    },
    head: {
      css: (values: any, _bodyValues: any, meta: any) =>
        `#${values._meta.htmlID} { background-color: ${values.backgroundColor}; } /* mode:${meta.displayMode} */`,
      js: () => "console.info('head tool ready');",
    },
  },
};

describe("edge: head contributions", () => {
  const HeadTool = registerElementsTool(headTool as any);

  it("head css sees _meta.htmlID and option-default values", () => {
    const { head } = renderToHtmlParts(inEmail(<HeadTool />));
    expect(head).toContain("#u_content_custom_head_tool_1 { background-color: #FFF000; }");
  });

  it("head css receives the display mode", () => {
    const emailHead = renderToHtmlParts(inEmail(<HeadTool />)).head;
    const webHead = renderToHtmlParts(
      <Page>
        <Row>
          <Column>
            <HeadTool />
          </Column>
        </Row>
      </Page>
    ).head;
    expect(emailHead).toContain("mode:email");
    expect(webHead).toContain("mode:web");
  });

  it("two instances get distinct per-instance css rules", () => {
    const { head } = renderToHtmlParts(inEmail(<HeadTool />, <HeadTool />));
    expect(head).toContain("#u_content_custom_head_tool_1 {");
    expect(head).toContain("#u_content_custom_head_tool_2 {");
  });

  it("body markup and head css agree on per-instance ids (multi-instance)", () => {
    const Scoped = registerElementsTool({
      name: "scoped_tool",
      options: { g: { title: "G", options: {
        bg: { label: "Bg", defaultValue: "#fafafa", widget: "color_picker" },
      }}},
      values: {},
      renderer: {
        exporters: {
          email: (v: any) => `<div id="${v._meta.htmlID}-x">scoped</div>`,
          web: (v: any) => `<div id="${v._meta.htmlID}-x">scoped</div>`,
        },
        head: { css: (v: any) => `#${v._meta.htmlID}-x { background: ${v.bg}; }` },
      },
    } as any);
    const { head, body } = renderToHtmlParts(
      inEmail(<Scoped />, <Scoped bg="#111827" />)
    );
    // every head rule targets an id that actually exists in the body
    expect(body).toContain('id="u_content_custom_scoped_tool_1-x"');
    expect(body).toContain('id="u_content_custom_scoped_tool_2-x"');
    expect(head).toContain("#u_content_custom_scoped_tool_1-x { background: #fafafa; }");
    expect(head).toContain("#u_content_custom_scoped_tool_2-x { background: #111827; }");
  });

  it("head js lands in the document script tag", () => {
    const html = renderToHtml(inEmail(<HeadTool />));
    expect(html).toContain("console.info('head tool ready');");
  });

  it("heads returning undefined emit nothing (no 'undefined' in output)", () => {
    const Product = registerElementsTool({ ...productTool, name: "product_tool_h" } as any);
    const { head } = renderToHtmlParts(inEmail(<Product />));
    expect(head).not.toContain("undefined");
  });

  it("head tags are collected and deduplicated", () => {
    const TagTool = registerElementsTool({
      name: "tag_tool",
      values: {},
      renderer: {
        exporters: { email: () => "<span>t</span>" },
        head: { tags: () => ['<meta name="x-tool" content="tag_tool">'] },
      },
    } as any);
    const { head } = renderToHtmlParts(inEmail(<TagTool />, <TagTool />));
    expect(head.match(/x-tool/g)).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Failure modes and hostile input
// ---------------------------------------------------------------------------
describe("edge: failure modes", () => {
  it("a throwing exporter drops only its own block — siblings render, error logged", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const Broken = registerElementsTool({
      name: "broken_tool",
      values: {},
      renderer: { exporters: { email: () => { throw new Error("boom"); } } },
    } as any);
    const html = renderToHtml(inEmail(<Broken />, <HeadToolSafe />));
    // The broken block is omitted (no error card in sendable output)...
    expect(html).not.toContain("broken_tool");
    // ...siblings and the document survive intact
    expect(html).toContain("safe tool");
    expect(html.trimEnd().endsWith("</html>")).toBe(true);
    // ...and the failure is loudly logged for the developer
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
    consoleWarn.mockRestore();
  });

  it("a non-string exporter return is coerced, not crashed on", () => {
    const Numeric = registerElementsTool({
      name: "numeric_tool",
      values: {},
      renderer: { exporters: { email: () => 42 as unknown as string } },
    } as any);
    const html = renderToHtml(inEmail(<Numeric />));
    expect(html).toContain("42");
  });

  it("a non-string exporter return is coerced BEFORE a configured sanitizer sees it", () => {
    const Numeric = registerElementsTool({
      name: "numeric_tool_sanitized",
      values: {},
      renderer: { exporters: { email: () => 42 as unknown as string } },
    } as any);
    // A realistic sanitizer calls string methods — it must never receive a number
    const toSafeHtml = (html: string) => html.replace(/<script[\s\S]*?<\/script>/g, "");
    const html = renderToHtml(inEmail(<Numeric />), { toSafeHtml });
    expect(html).toContain("42");
  });

  it("special characters in values pass through raw (tool owns its markup)", () => {
    const Echo = registerElementsTool({
      name: "echo_tool",
      values: { text: "" },
      renderer: { exporters: { email: (v: any) => `<div>${v.text}</div>` } },
    } as any);
    const html = renderToHtml(inEmail(<Echo text={'5 < 6 & "quotes"'} />));
    expect(html).toContain('5 < 6 & "quotes"');
  });

  it("a configured sanitizer sees each mode's output", () => {
    const seen: string[] = [];
    const Tool = registerElementsTool({
      name: "san_tool",
      values: {},
      renderer: {
        exporters: {
          web: () => "<div>web-out</div>",
          email: () => "<div>email-out</div>",
        },
      },
    } as any);
    const toSafeHtml = (html: string) => {
      seen.push(html);
      return html;
    };
    renderToHtml(inEmail(<Tool />), { toSafeHtml });
    renderToHtml(
      <Page>
        <Row>
          <Column>
            <Tool />
          </Column>
        </Row>
      </Page>,
      { toSafeHtml }
    );
    expect(seen).toContain("<div>email-out</div>");
    expect(seen).toContain("<div>web-out</div>");
  });
});

const HeadToolSafe = registerElementsTool({
  name: "safe_tool",
  values: {},
  renderer: { exporters: { email: () => "<div>safe tool</div>" } },
} as any);

// ---------------------------------------------------------------------------
// Composition: multiple tools, base props, plaintext
// ---------------------------------------------------------------------------
describe("edge: composition", () => {
  const A = registerElementsTool({
    name: "tool_a",
    values: { n: "a" },
    renderer: { exporters: { email: (v: any) => `<p>tool ${v.n}</p>` } },
  } as any);
  const B = registerElementsTool({
    name: "tool_b",
    values: { n: "b" },
    renderer: { exporters: { email: (v: any) => `<p>tool ${v.n}</p>` } },
  } as any);

  it("different tools keep independent counters and slugs", () => {
    const json = renderToJson(inEmail(<A />, <B />, <A />));
    const contents = json.body.rows[0].columns[0].contents;
    expect(contents.map((c: any) => c.slug)).toEqual(["tool_a", "tool_b", "tool_a"]);
    expect(contents[0].values._meta.htmlID).toBe("u_content_custom_tool_a_1");
    expect(contents[1].values._meta.htmlID).toBe("u_content_custom_tool_b_1");
    expect(contents[2].values._meta.htmlID).toBe("u_content_custom_tool_a_2");
  });

  it("containerPadding flat prop wraps the tool like built-ins", () => {
    const html = renderToHtml(inEmail(<A containerPadding="24px 40px" />));
    expect(html).toContain("padding:24px 40px");
  });

  it("base props (className/style/mode) do not leak into tool values", () => {
    const Probe = registerElementsTool({
      name: "probe_tool",
      values: {},
      renderer: {
        exporters: {
          email: (v: any) => `<div>keys:${Object.keys(v).filter((k) => !k.startsWith("_")).sort().join(",")}</div>`,
        },
      },
    } as any);
    const html = renderToHtml(inEmail(<Probe className="x" style={{ color: "red" }} />));
    expect(html).toContain("keys:</div>");
  });

  it("renderToPlainText extracts custom tool text like any content", () => {
    const text = renderToPlainText(inEmail(<A />, <B />));
    expect(text).toContain("tool a");
    expect(text).toContain("tool b");
  });

  it("custom tool paragraphs still get the shared p treatment from its own markup", () => {
    // The tool owns its markup — Elements does not inject the reset into it
    const html = renderToHtml(inEmail(<A />));
    expect(html).toContain("<p>tool a</p>");
  });
});
