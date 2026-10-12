import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToHtml } from "./render-to-html";
import { renderToJson } from "./render-to-json";
import { Email, Page, Document, Row, Column, Heading, Button, Paragraph, Menu } from "../index";

// A value such as a user's name, with markup in it.
const name = '<img src=x onerror="alert(1)"> & Co';

describe("text children of Heading and Button", () => {
  it.each([["email", Email], ["web", Page]] as const)("show markup as typed, as Paragraph's do (%s)", (_, Root) => {
    const html = renderToHtml(
      <Root>
        <Row><Column>
          <Heading>Hi {name}</Heading>
          <Button href="https://example.com">{name}</Button>
          <Paragraph>{name}</Paragraph>
        </Column></Row>
      </Root>
    );
    expect(html).not.toContain("<img src=x");
    expect(html.match(/&lt;img src=x onerror=/g)).toHaveLength(3);
    expect(html).toContain("&amp; Co");
  });

  it("keep markup given through the text prop", () => {
    const html = renderToHtml(
      <Email><Row><Column>
        <Heading text="Hi <strong>there</strong>" />
        <Button href="https://example.com" text="Buy <strong>now</strong>" />
      </Column></Row></Email>
    );
    expect(html).toContain("Hi <strong>there</strong>");
    expect(html).toContain("Buy <strong>now</strong>");
  });

  it("store escaped text in the design, which the editor shows as typed", () => {
    const design = renderToJson(<Email><Row><Column><Heading>{name}</Heading><Button href="#">{name}</Button></Column></Row></Email>);
    const [heading, button] = design.body.rows[0].columns[0].contents as Array<{ values: { text: string } }>;
    expect(heading.values.text).toBe("&lt;img src=x onerror=\"alert(1)\"&gt; &amp; Co");
    expect(button.values.text).toBe(heading.values.text);
  });
});

describe("an email service's <%name%> tag in text", () => {
  it.each([["email", Email], ["web", Page]] as const)("stays as written in Heading and Button text and Menu items, for it to fill in, as in 0.1.22 (%s)", (mode, Root) => {
    const html = renderToHtml(
      <Root><Row><Column>
        <Heading>{"Hi <%first_name%>"}</Heading>
        <Button href="https://example.com">{"Open <%first_name%>'s plan"}</Button>
        <Menu items={[{ text: "<%company%> home", href: "https://example.com" }]} />
      </Column></Row></Root>
    );
    expect(html).toContain("Hi <%first_name%>");
    expect(html).toContain("<%first_name%>");
    // Menu text: the email exporter writes it as it is (0.1.22 too); the web and document ones escape it.
    if (mode === "email") expect(html).toContain("<%company%>");
    // Markup around it is still escaped.
    expect(renderToHtml(<Root><Row><Column><Heading>{"<%name%><b>bold</b>"}</Heading></Column></Row></Root>)).toContain("<%name%>&lt;b&gt;bold&lt;/b&gt;");
  });
});

describe("link URLs", () => {
  it.each([["email", Email], ["web", Page]] as const)("can't end their href attribute (%s)", (_, Root) => {
    const html = renderToHtml(
      <Root><Row><Column>
        <Button href={'https://example.com/?a=1&b=2"><img src=x onerror="alert(1)">'}>Go</Button>
        <Button href="https://example.com/plain?a=1&b=2">Plain</Button>
      </Column></Row></Root>
    );
    expect(html).not.toContain("<img src=x");
    expect(html).toContain('https://example.com/?a=1&b=2%22%3E%3Cimg');
    // An ordinary URL is written as before.
    expect(html).toContain('href="https://example.com/plain?a=1&b=2"');
  });

  it.each([["email", Email], ["web", Page]] as const)("keep an email service's <%name%> placeholder as written, for it to fill in (%s)", (_, Root) => {
    const unsubscribe = "<%asm_group_unsubscribe_raw_url%>";
    const email = <Root><Row><Column><Button href={unsubscribe}>Unsubscribe</Button><Button href={`${unsubscribe}"><img src=x onerror="alert(1)">`}>Go</Button></Column></Row></Root>;
    const html = renderToHtml(email);
    expect(html).toContain(`href="${unsubscribe}"`);
    // Anything else around it is still encoded.
    expect(html).not.toContain("<img src=x");
    expect(html).toContain(`${unsubscribe}%22%3E%3Cimg`);
    expect(JSON.stringify(renderToJson(email))).toContain(unsubscribe);
  });

  it("leave plain labels as they were", () => {
    const html = renderToHtml(<Email><Row><Column><Button href="#">Click me</Button><Heading>Welcome</Heading></Column></Row></Email>);
    expect(html).toMatch(/>Click me</);
    expect(html).toMatch(/>\s*Welcome\s*</);
  });
});

describe("line breaks in Heading and Button text", () => {
  it.each([["email", Email], ["web", Page], ["document", Document]] as const)("stay breaks, written in a string or as a JSX <br /> (%s)", (_, Root) => {
    const html = renderToHtml(
      <Root><Row><Column>
        <Heading>{"The Last Light<br/>on the Dolomites"}</Heading>
        <Heading>Work together,<br />in real time</Heading>
        <Button href="https://example.com/shop">{"Shop<br>now"}</Button>
        <Heading>{'Hi<br/><img src=x onerror="alert(1)">'}</Heading>
      </Column></Row></Root>
    );
    const doc = new DOMParser().parseFromString(html, "text/html");
    const [first, second, last] = Array.from(doc.querySelectorAll("h1"));
    expect([first, second, last].map((h) => h.querySelectorAll("br").length)).toEqual([1, 1, 1]);
    expect(first.textContent).toBe("The Last Lighton the Dolomites");
    expect(doc.querySelector("a[href='https://example.com/shop'] br")).not.toBeNull();
    // Only the break: other markup still shows as typed.
    expect(doc.querySelectorAll("img[src='x']")).toHaveLength(0);
    expect(last.textContent).toBe('Hi<img src=x onerror="alert(1)">');
  });
});

describe("text placed straight in a Row or Column", () => {
  const Name = () => name;
  it.each([["email", Email], ["web", Page], ["document", Document]] as const)("shows as text, from a Fragment, a component or written there (%s)", (_, Root) => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const html = renderToHtml(
        <Root>
          <Row>{name}<Column><>{name}</></Column></Row>
          <Row><Column><Name /></Column></Row>
          <Row><Column>{name}{7}</Column></Row>
        </Root>
      );
      expect(html).not.toContain("<img src=x");
      expect(html.match(/&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt; &amp; Co/g)).toHaveLength(4);
      expect(html).toContain("&amp; Co7");
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("Put it in a <Paragraph>"));
    } finally {
      warn.mockRestore();
    }
  });

  it("doesn't warn about whitespace between blocks", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      renderToHtml(<Email><Row>{" "}<Column>{" "}<Paragraph>Hi</Paragraph>{"\n"}</Column></Row></Email>);
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });
});

describe("the text direction", () => {
  it.each([["email", Email], ["web", Page], ["document", Document]] as const)("is only ever ltr, rtl or auto in the markup (%s)", (_, Root) => {
    const html = renderToHtml(<Root textDirection={'rtl"><img src=x onerror="alert(1)">'}><Row><Column><Paragraph>x</Paragraph></Column></Row></Root>);
    expect(html).not.toContain("<img src=x");
    const rtl = (dir: string) => renderToHtml(<Root textDirection={dir}><Row><Column><Paragraph>x</Paragraph></Column></Row></Root>);
    expect(rtl("RTL")).toContain('<html dir="rtl"');
    expect(rtl("RTL")).toBe(rtl("rtl"));
  });
});

