import React from "react";
import { describe, it, expect } from "vitest";
import { renderToHtml, renderToHtmlParts } from "./render-to-html";
import { extractHeadFromTree } from "./extract-head";
import { registerElementsTool } from "./register-tool";
import Body from "../components/Body";
import Document from "../components/Document";
import Email from "../components/Email";
import Page from "../components/Page";
import Row from "../components/Row";
import Column from "../components/Column";
import Button from "../components/Button";
import Heading from "../components/Heading";
import Html from "../components/Html";
import Paragraph from "../components/Paragraph";
import Divider from "../components/Divider";

const HeadTool = registerElementsTool({
  name: "head_probe",
  values: { accent: "#123456" },
  renderer: {
    exporters: {
      web: () => "<i>tool</i>",
      email: () => "<i>tool</i>",
    },
    head: {
      css: (values: any) => `#${values._meta.htmlID} i { color: ${values.accent}; }`,
      js: () => "window.headProbe = true;",
      tags: () => ['<meta name="x-head-probe" content="1">'],
    },
  },
});

describe("renderToHtmlParts", () => {
  it("returns head and body as separate strings", () => {
    const { head, body } = renderToHtmlParts(
      <Email>
        <Row>
          <Column>
            <Paragraph text="Hello" />
          </Column>
        </Row>
      </Email>
    );

    expect(body).toContain(">Hello<");
    expect(body).not.toContain("<style");
    expect(head.startsWith("<style>")).toBe(true);
    expect(head).not.toContain("Hello");
  });

  it("head has the body's margin and background, for a page embedding the parts", () => {
    const { head } = renderToHtmlParts(
      <Email backgroundColor="#abcdef" textColor="#333333">
        <Row>
          <Column>
            <Paragraph text="Hello" />
          </Column>
        </Row>
      </Email>
    );

    expect(head).toMatch(/<style>[\s\S]*body\{margin:0;padding:0;background-color:#abcdef\}[\s\S]*<\/style>/);
  });

  it("head has a Button's hover CSS on a page, for the class on its link", () => {
    const { head, body } = renderToHtmlParts(
      <Page>
        <Row>
          <Column>
            <Button
              text="Click Me"
              href="https://example.com"
              buttonColors={{ backgroundColor: "#3b82f6", color: "#ffffff", hoverBackgroundColor: "#1d4ed8", hoverColor: "#abcdef" }}
            />
          </Column>
        </Row>
      </Page>
    );

    const hover = /\.(\w+):hover\{color:#abcdef!important;background-color:#1d4ed8!important\}/.exec(head)?.[1];
    expect(hover).toBeDefined();
    expect(body).toMatch(new RegExp(`<a [^>]*class="${hover}"[^>]*>Click Me<`));
  });

  it("renderToHtml wraps the same body markup in a full document", () => {
    const element = (
      <Email>
        <Row>
          <Column>
            <Heading text="Test" headingType="h1" />
          </Column>
        </Row>
      </Email>
    );

    const fullDocument = renderToHtml(element);
    const { body } = renderToHtmlParts(element);

    // parts.body is the embeddable fragment (in the root's host <div>); the full document holds the same markup.
    const innerBody = body.replace(/^\s*<div[^>]*>\s*/, "").replace(/\s*<\/div>\s*$/, "");
    expect(innerBody.startsWith("<body")).toBe(true);
    expect(fullDocument).toContain(innerBody);
    expect(fullDocument.startsWith("<!DOCTYPE html>")).toBe(true);
    expect(fullDocument.trimEnd().endsWith("</html>")).toBe(true);
  });

  it("exposes granular css/js/tags alongside the assembled head", () => {
    const parts = renderToHtmlParts(
      <Email>
        <Row>
          <Column>
            <HeadTool />
          </Column>
        </Row>
      </Email>
    );
    // granular css is the raw stylesheet — no <style> wrapper
    expect(parts.css).toContain("#u_content_custom_head_probe_1 i { color: #123456; }");
    expect(parts.css).not.toContain("<style>");
    expect(parts.js).toBe("window.headProbe = true;");
    expect(parts.tags).toEqual(['<meta name="x-head-probe" content="1">']);
    // the assembled head is exactly the granular pieces composed
    const composed = [
      `<style>${parts.css}</style>`,
      `<script>${parts.js}</script>`,
      ...parts.tags,
    ].join("\n");
    expect(parts.head).toBe(composed);
  });

  it.each([["Email", Email], ["Page", Page], ["Document", Document]] as const)("parts stay embeddable fragments — no document shell leaks in (%s)", (_, Root) => {
    const { head, body } = renderToHtmlParts(
      <Root>
        <Row>
          <Column>
            <Heading text="Test" headingType="h1" />
          </Column>
        </Row>
      </Root>
    );
    expect(body).toContain("Test");
    for (const chunk of [head, body]) {
      expect(chunk).not.toMatch(/<!doctype/i);
      expect(chunk).not.toContain("<html");
      expect(chunk).not.toContain("</html>");
      expect(chunk).not.toContain("<head>");
    }
  });

  it("works with web mode (Page): a page's body has no <body> tag, and its head stacks its columns on a phone", () => {
    const { head, body } = renderToHtmlParts(
      <Page>
        <Row>
          <Column>
            <Divider />
          </Column>
        </Row>
      </Page>
    );

    expect(head).toMatch(/@media \(max-width: 480px\)\{\.(\w+)\{flex-direction:column!important/);
    expect(body).toContain("<hr");
    expect(body).not.toContain("<body");
    expect(body).not.toContain('role="presentation"');
  });

  it("respects mode from config parameter, where the root doesn't say its own", () => {
    const rows = (
      <Row>
        <Column>
          <Button text="Test" />
        </Column>
      </Row>
    );
    const isEmail = ({ body }: { body: string }) => body.includes("<body") && body.includes('role="presentation"');

    expect(isEmail(renderToHtmlParts(<Body>{rows}</Body>, { mode: "email" }))).toBe(true);
    expect(isEmail(renderToHtmlParts(<Body>{rows}</Body>, { mode: "web" }))).toBe(false);
    // Email and Page say their own.
    expect(isEmail(renderToHtmlParts(<Email>{rows}</Email>, { mode: "web" }))).toBe(true);
    expect(isEmail(renderToHtmlParts(<Page>{rows}</Page>, { mode: "email" }))).toBe(false);
  });

  it("handles tree with no head-generating components gracefully", () => {
    const parts = renderToHtmlParts(
      <Email>
        <Row>
          <Column>
            <Divider />
          </Column>
        </Row>
      </Email>
    );

    // No block of open HTML: nothing of what one asks for, and no empty script.
    expect(parts.js).toBe("");
    expect(parts.tags).toEqual([]);
    expect(parts.head).not.toContain("<script");
    expect(parts.head).not.toContain("hide-");
    expect(parts.head).not.toContain("undefined");
    expect(parts.body).toContain('aria-label="divider"');
  });
});

describe("extractHeadFromTree: what a block of open HTML asks for", () => {
  const template = (Root: React.ElementType) => (
    <Root>
      <Row>
        <Column>
          <Paragraph mobile={{ fontSize: "30px" }}>Drawn</Paragraph>
          <Html html="<b>First</b>" />
          <Html html="<b>Second</b>" mobile={{ containerPadding: "3px" }} />
          <HeadTool />
          <HeadTool accent="#654321" />
        </Column>
      </Row>
    </Root>
  );

  it("has what each custom tool's head says, by its own id, and each tag once", () => {
    const { css, js, tags } = extractHeadFromTree(template(Email), { displayMode: "email" });
    expect(css).toContain("#u_content_custom_head_probe_1 i { color: #123456; }");
    expect(css).toContain("#u_content_custom_head_probe_2 i { color: #654321; }");
    expect(js).toBe("window.headProbe = true;\nwindow.headProbe = true;");
    expect(tags).toEqual(['<meta name="x-head-probe" content="1">']);
  });

  it("selects a block's phone padding by the id its box has, numbered among its kind, on the element its output writes", () => {
    const email = extractHeadFromTree(template(Email), { displayMode: "email" }).css;
    expect(email).toContain("@media (max-width: 480px) { #u_content_html_2 .v-container-padding-padding { padding: 3px !important; } }");
    expect(renderToHtml(template(Email))).toContain('id="u_content_html_2"');
    // A page's box has its id and its class on one element.
    const page = extractHeadFromTree(template(Page), { displayMode: "web" }).css;
    expect(page).toContain("@media (max-width: 480px) { #u_content_html_2.v-container-padding-padding { padding: 3px !important; } }");
  });

  it("has nothing for a block the new engine draws, which writes none of those classes", () => {
    const { css } = extractHeadFromTree(template(Email), { displayMode: "email" });
    expect(css).not.toContain("30px");
    expect(css).not.toContain("u_content_paragraph");
  });

  // BUG: each block written as it is with phone rules of its own carries a copy of the whole head's CSS (compat/template.ts:
  // `css: [css, node.props?.css]`; only identical strings are written once). It draws the same, but an email grows with it.
  it.fails("is in the document once, however many blocks written as they are have rules of their own", () => {
    const html = renderToHtml(
      <Email>
        <Row>
          <Column>
            <HeadTool />
            <Paragraph html="<ul><li>One</li></ul>" mobile={{ fontSize: "20px" }} />
            <Paragraph html="<ul><li>Two</li></ul>" mobile={{ fontSize: "21px" }} />
          </Column>
        </Row>
      </Email>
    );
    expect(html.match(/#u_content_custom_head_probe_1 i \{/g)).toHaveLength(1);
    expect(html.match(/\.hide-mobile \{/g)).toHaveLength(1);
  });

  it("has the rules that hide a block in its output, and none in a printed document, which has no devices", () => {
    expect(extractHeadFromTree(template(Email), { displayMode: "email" }).css).toContain(".hide-default__display-table");
    expect(extractHeadFromTree(template(Page), { displayMode: "web" }).css).toContain(".hide-mobile");
    const printed = extractHeadFromTree(template(Document), { displayMode: "document" }).css;
    expect(printed).not.toContain(".hide-");
    expect(printed).not.toContain("3px");
  });
});
