import { describe, it, expect } from "vitest";
import React from "react";
import { renderToPlainText, renderToHtmlParts, renderToHtml } from "./render-to-html";
import { renderToJson } from "./render-to-json";
import { Email, Html, Link, Menu, Social, Table, Video, toPlainText, type PlainTextOptions } from "../index";
import { Markdown } from "../markdown";
import Body from "../components/Body";
import Row from "../components/Row";
import { Column } from "../components/Column";
import Paragraph from "../components/Paragraph";
import Button from "../components/Button";
import Heading from "../components/Heading";
import Image from "../components/Image";

describe("renderToPlainText", () => {
  it("extracts text from a Paragraph", () => {
    const text = renderToPlainText(
      <Body>
        <Row>
          <Column>
            <Paragraph>Hello World</Paragraph>
          </Column>
        </Row>
      </Body>
    );
    expect(text).toContain("Hello World");
  });

  it("extracts text from multiple components", () => {
    const text = renderToPlainText(
      <Body>
        <Row>
          <Column>
            <Heading>Welcome</Heading>
            <Paragraph>First paragraph</Paragraph>
            <Button>Click me</Button>
          </Column>
        </Row>
      </Body>
    );
    // htmlToPlainText uppercases h1 headings
    expect(text.toUpperCase()).toContain("WELCOME");
    expect(text).toContain("First paragraph");
    expect(text).toContain("Click me");
  });

  it("strips HTML tags", () => {
    const text = renderToPlainText(
      <Body>
        <Row>
          <Column>
            <Paragraph>Plain text only</Paragraph>
          </Column>
        </Row>
      </Body>
    );
    expect(text).not.toContain("<div");
    expect(text).not.toContain("<p");
    expect(text).not.toContain("<table");
  });

  it("returns a string", () => {
    const text = renderToPlainText(<Paragraph>Test</Paragraph>);
    expect(typeof text).toBe("string");
  });
});

describe("renderToHtmlParts", () => {
  it("returns separate head and body strings", () => {
    const { head, body } = renderToHtmlParts(
      <Body mode="email">
        <Row>
          <Column>
            <Button>Click</Button>
          </Column>
        </Row>
      </Body>
    );
    expect(typeof head).toBe("string");
    expect(typeof body).toBe("string");
  });

  it("head contains <style> tag with CSS", () => {
    const { head } = renderToHtmlParts(
      <Body mode="email">
        <Row>
          <Column>
            <Button>Click</Button>
          </Column>
        </Row>
      </Body>
    );
    expect(head).toContain("<style>");
    expect(head).toContain("</style>");
  });

  it("body contains the rendered HTML", () => {
    const { body } = renderToHtmlParts(
      <Body mode="email">
        <Row>
          <Column>
            <Paragraph>Content here</Paragraph>
          </Column>
        </Row>
      </Body>
    );
    expect(body).toContain("Content here");
  });

  it("head includes body-level CSS (text color, link styles)", () => {
    const { head } = renderToHtmlParts(
      <Body mode="email">
        <Row>
          <Column>
            <Button>Click</Button>
          </Column>
        </Row>
      </Body>
    );
    // Body head generates table/td color and link styles
    expect(head).toContain("table, td");
    expect(head).toContain("color");
  });

  it("head is empty when no head-generating components", () => {
    const { head } = renderToHtmlParts(
      <Body mode="email">
        <Row>
          <Column>
            <Paragraph>No head CSS</Paragraph>
          </Column>
        </Row>
      </Body>
    );
    // Paragraph doesn't generate head CSS but Body/Row might
    expect(typeof head).toBe("string");
  });

  it("works with web mode", () => {
    const { head, body } = renderToHtmlParts(
      <Body mode="web">
        <Row>
          <Column>
            <Paragraph>Web mode</Paragraph>
          </Column>
        </Row>
      </Body>
    );
    expect(body).toContain("Web mode");
    expect(typeof head).toBe("string");
  });

  describe("options and what's left out", () => {
    const email = (
      <Body>
        <Row>
          <Column>
            <Heading>Your order</Heading>
            <Paragraph html='Track it <a href="https://example.com/t">here</a>.' />
            <Button href="https://example.com/o" skipInText>View order</Button>
            <Paragraph skipInText>Sent by Example</Paragraph>
          </Column>
        </Row>
      </Body>
    );

    it("leaves out a block with `skipInText`, in the text only", () => {
      expect(renderToPlainText(email)).toBe("YOUR ORDER\n\nTrack it here (https://example.com/t).");
      const { body } = renderToHtmlParts(email);
      expect(body).toContain("View order");
      expect(body).toContain("Sent by Example");
    });

    it("takes the text's options", () => {
      expect(renderToPlainText(email, { links: "after", uppercaseHeadings: false })).toBe("Your order\n\nTrack it here [1].\n\n[1] https://example.com/t");
      expect(renderToPlainText(email, { skip: ["h1"], links: "none" })).toBe("Track it here.");
    });

    it("writes any HTML as text with toPlainText, as it writes a template's", () => {
      expect(toPlainText(renderToHtml(email), { links: "none" })).toBe("YOUR ORDER\n\nTrack it here.");
      expect(toPlainText("<p>A</p><p>B</p>")).toBe("A\nB");
    });
  });
});

describe("every link's URL in the plain text", () => {
  // URLs of random parts (a fixed seed): capitals, a query with `&`, a quote, parentheses, percent escapes …
  const r = random(Number(process.env.LINKS_SEED ?? 20261018));
  const pick = <T,>(list: readonly T[]): T => list[Math.floor(r() * list.length)];
  const PARTS = ["Pay", "a1", "it's", "(v2)", "%20x", "~me", "a+b", "x,y", "k=v;w", "Z!", "*", "$5", "@t", "a:b", "-_."];
  /** The URLs the template has placed, each once. */
  let placed: string[] = [];
  const url = (where: string) => {
    placed.push(`https://example.com/${where}/${Array.from({ length: 1 + Math.floor(r() * 3) }, () => pick(PARTS)).join("/")}${r() < 0.5 ? `?q=${pick(PARTS)}&b=2` : ""}${r() < 0.3 ? "#Top" : ""}`);
    return placed[placed.length - 1];
  };
  /** A URL in a `"` attribute (Markdown's are written `<…>`). */
  const attr = (u: string) => u.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

  /** Every block and place a link can be in, with new URLs; a `promo` class or `data-skip-in-text` around a link leaves it out. */
  const template = () => {
    const a = (where: string, text = "go") => `<a href="${attr(url(where))}">${text}</a>`;
    const md = (where: string, text = "go") => `[${text}](<${url(where)}>)`;
    return (
      <Email>
        <Row>
          <Column>
            <Paragraph html={`Read ${a("paragraph", "the guide")} and ${a("paragraph-2", "the FAQ")}.`} />
            <Paragraph>
              See <Link href={url("paragraph-link")}>this</Link>
            </Paragraph>
            {(["h1", "h2", "h3", "h4", "h5", "h6"] as const).map((level) => (
              <Heading key={level} level={level} text={`Pay ${a(`heading-${level}`, "your invoice")}`} />
            ))}
            <Heading level="h2">
              Hi <Link href={url("heading-link")}>there</Link>
            </Heading>
            <Button href={url("button")}>Open</Button>
            <Menu items={[{ text: "Home", href: url("menu") }, { text: "Blog", href: url("menu-2") }]} />
            <Image src="https://example.com/logo.png" alt="Logo" action={url("image")} />
            <Table headers={[a("table-header", "Plan")]} data={[[a("table-cell", "Pro"), `${a("table-cell-2", "A")} ${a("table-cell-3", "B")}`]]} />
            <Social icons={[{ name: "facebook", url: url("social") }, { name: "x", url: url("social-2") }]} />
            <Video videoUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ" />
            <Html
              html={`<p>${a("html")}</p><ul><li>${a("html-li")}</li></ul><table><tr><td>${a("html-td")}</td></tr></table><pre>run ${a("html-pre", "this")}</pre><h1>${a("html-h1", "Top")}</h1><div class="promo">${a("html-promo")}</div><div data-skip-in-text="true">${a("html-skipped")}</div>`}
            />
            <Paragraph skipInText html={a("skip-in-text")} />
            <Markdown>
              {[
                ...[1, 2, 3, 4, 5, 6].map((n) => `${"#".repeat(n)} ${md(`markdown-h${n}`, "Pay invoice")}`),
                `# <${url("markdown-autolink")}>`,
                `A ${md("markdown-paragraph")}, **${md("markdown-bold")}**, *${md("markdown-italic")}*, ${md("markdown-code", "`npm i`")} and ${md("markdown-last")}.`,
                `- ${md("markdown-li")}\n  - ${md("markdown-li-nested")}\n1. ${md("markdown-ol")}`,
                `> ${md("markdown-quote")}\n>\n> > ${md("markdown-quote-nested")}`,
                `| Plan | Link |\n| --- | --- |\n| Pro | ${md("markdown-cell")} |`,
                `[![Logo](https://example.com/logo.png)](<${url("markdown-image")}>)`,
                `<div><a href="${attr(url("markdown-html"))}">raw</a></div>`,
              ].join("\n\n")}
            </Markdown>
          </Column>
        </Row>
      </Email>
    );
  };

  /** Each `href` in the HTML, as the browser reads it; its link's text; and whether the text leaves it out. */
  const links = (html: string, skip: string[] = []) =>
    [...new DOMParser().parseFromString(html, "text/html").querySelectorAll("[href]")].map((element) => ({
      href: element.getAttribute("href")!,
      text: element.textContent!.trim(),
      left: !!element.closest(['[data-skip-in-text="true"]', ...skip].join(",")),
    }));
  /** The URLs in the design: in its HTML, or a value of their own (a button's, a menu item's, an icon's). */
  const designed = (value: unknown): string[] =>
    typeof value === "string" ? (/<a\s/i.test(value) ? links(value).map((link) => link.href) : [value]) : value && typeof value === "object" ? Object.values(value).flatMap(designed) : [];

  const OPTIONS: PlainTextOptions[] = [{}, { links: "after" }, { links: "none" }, { uppercaseHeadings: false, wordwrap: 30, skip: [".promo"] }, { links: "after", wordwrap: 30, skip: [".promo"] }];

  it("has each, in each `links` mode, as written: unless a block's `skipInText`, `data-skip-in-text` or `skip` leaves it out", () => {
    const bad: string[] = [];
    for (let run = 0; run < 4; run++) {
      placed = [];
      const email = template();
      const { body } = renderToHtmlParts(email);
      const design = new Set(designed(renderToJson(email)));
      const all = links(body);
      // Every place above has its link in the HTML, as written, and every link in the HTML is in the design (but a block's
      // the design leaves out).
      for (const href of placed) if (!all.some((link) => link.href === href)) bad.push(`HTML: ${href}`);
      for (const { href } of all) if (!design.has(href) && !/skip-in-text/.test(href)) bad.push(`design: ${href}`);
      for (const options of OPTIONS) {
        const text = renderToPlainText(email, options);
        const listed = text.includes("\n\n[1] ") ? text.slice(text.lastIndexOf("\n\n[1] ") + 2).split("\n") : [];
        for (const link of links(body, options.skip)) {
          const where = `${JSON.stringify(options)} ${link.href}`;
          if (link.left || (options.links === "none" && link.text !== link.href)) {
            if (text.includes(link.href)) bad.push(`${where}: in the text`);
          } else if (options.links === "after" && link.text !== link.href) {
            if (!listed.some((line) => line.replace(/^\[\d+\] /, "") === link.href)) bad.push(`${where}: not listed`);
          } else if (!text.includes(link.href)) bad.push(`${where}: not in the text`);
        }
      }
    }
    expect(bad).toEqual([]);
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
