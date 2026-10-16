// @vitest-environment node
import React from "react";
import { JSDOM } from "jsdom";
import { describe, expect, it, vi } from "vitest";
import { Column, Email, Heading, Html, Paragraph, RenderError, Row, UnlayerProvider, renderToHtml as renderToHtmlSync, renderToJson as renderToJsonSync } from "../index";
import { Tailwind } from "../tailwind";
import { pretty as formatted, renderToHtml, renderToHtmlParts, renderToJson, renderToPlainText } from "./index";
import * as tailwind from "../tailwind";
import { Head } from "../head";
import { Font } from "../font";

const later = <T,>(value: T, ms = 5) => new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));
const contents = (design: { body: { rows: any[] } }) => design.body.rows.flatMap((row) => row.columns.flatMap((column: any) => column.contents.map((c: any) => c.values.text ?? c.values.html)));

describe("the async renderers", () => {
  it("keeps each template's own <Head> tags and <Font> when async templates render at once", async () => {
    const template = (name: string, ms: number) => {
      const Late = async () => {
        await later(null, ms);
        return (
          <>
            <Head><meta name="who" content={name} /></Head>
            <Font family={`Family${name}`} url={`https://fonts.googleapis.com/css2?family=Family${name}`} />
            <Paragraph>{`Body ${name}`}</Paragraph>
          </>
        );
      };
      return <Email><Row><Column><Late /></Column></Row></Email>;
    };
    const names = ["A", "B", "C", "D", "E", "F"];
    // Started in order, finished in reverse and interleaved: the first one's components run with others under way.
    const htmls = await Promise.all(names.map((name, i) => renderToHtml(template(name, 5 + ((i * 7) % 4) * 6))));
    names.forEach((name, i) => {
      expect(htmls[i]).toContain(`Body ${name}`);
      expect(htmls[i]).toContain(`content="${name}"`);
      expect(htmls[i]).toContain(`Family${name}`);
      for (const other of names.filter((n) => n !== name)) {
        expect(htmls[i]).not.toContain(`content="${other}"`);
        expect(htmls[i]).not.toContain(`Family${other}`);
      }
    });
  });

  it("resolve an async template, async blocks in a Column, async components in text, and thrown promises (Suspense), each run once", async () => {
    const runs = { template: 0, name: 0, block: 0 };
    const Name = async ({ id }: { id: number }) => {
      runs.name++;
      return <strong>{await later(`Ada ${id}`)}</strong>;
    };
    const Block = async () => {
      runs.block++;
      return <Paragraph>{await later("Loaded later")}</Paragraph>;
    };
    // React 18's Suspense: a component that throws a promise until its data is there.
    const cache: { value?: string; promise?: Promise<void> } = {};
    const Suspends = () => {
      cache.promise ??= later("Suspended, then shown").then((value) => void (cache.value = value));
      if (!cache.value) throw cache.promise;
      return <Paragraph>{cache.value}</Paragraph>;
    };
    async function Receipt({ id }: { id: number }) {
      runs.template++;
      const order = await later({ number: id, total: "$10" });
      return (
        <Email previewText={`Order ${order.number}`}>
          <Row>
            <Column>
              <Heading>Order {order.number}</Heading>
              <Paragraph>
                Thanks, <Name id={order.number} />. Total: {order.total}
              </Paragraph>
              <Block />
              <Suspends />
            </Column>
          </Row>
        </Email>
      );
    }
    const design = await renderToJson(<Receipt id={7} />);
    expect(contents(design)).toEqual(["Order 7", "Thanks, <strong>Ada 7</strong>. Total: $10", "Loaded later", "Suspended, then shown"]);
    expect(runs).toEqual({ template: 1, name: 1, block: 1 });
    const html = await renderToHtml(<Receipt id={8} />, { title: "Receipt" });
    expect(html).toContain("Thanks, <strong>Ada 8</strong>. Total: $10");
    expect(html).toContain("<title>Receipt</title>");
    expect(html).not.toMatch(/<!--\$|<!-- -->|unlayer-mark/);
    expect(await renderToPlainText(<Receipt id={9} />)).toBe("ORDER 9\n\nThanks, Ada 9. Total: $10\n\nLoaded later\n\nSuspended, then shown");
    expect((await renderToHtmlParts(<Receipt id={10} />)).body).toContain("Loaded later");
    expect(runs).toEqual({ template: 4, name: 4, block: 4 });
  });

  it("give what the synchronous renderers give for a template with nothing async", async () => {
    const Hooked = () => {
      const [label] = React.useState("from a hook");
      return <Paragraph>{label}</Paragraph>;
    };
    const email = (
      <Email>
        <Row>
          <Column>
            <Heading>Hi</Heading>
            <Hooked />
            <Html html="<p>kept</p>" />
          </Column>
        </Row>
      </Email>
    );
    expect(await renderToHtml(email)).toBe(renderToHtmlSync(email));
    expect(await renderToJson(email)).toEqual(renderToJsonSync(email));
  });

  it("give an async template the config of an <UnlayerProvider> around it, as the synchronous renderers do", async () => {
    const Loaded = async () => <Paragraph text={`Hi, the total is ${await later("$10")}`} />;
    async function Receipt() {
      const order = await later({ number: 7 });
      return <Email><Row><Column><Heading>Order {order.number}</Heading><Loaded /></Column></Row></Email>;
    }
    const config = { textDirection: "rtl", toSafeHtml: (html: string) => html.replace("Hi,", "Hey,") };
    const element = <UnlayerProvider config={config}><Receipt /></UnlayerProvider>;
    const html = await renderToHtml(element);
    expect(html).toMatch(/<html[^>]* dir="rtl"/);
    expect(html).toContain("Hey, the total is $10");
    expect((await renderToHtmlParts(element)).body).toContain("Hey, the total is $10");
    expect(await renderToPlainText(element)).toContain("Hey, the total is $10");
    const design = await renderToJson(element);
    expect(design.body.values.textDirection).toBe("rtl");
    expect(contents(design)).toEqual(["Order 7", "Hi, the total is $10"]);
  });

  it("keep each render's own, run side by side", async () => {
    const Slow = async ({ name, ms }: { name: string; ms: number }) => <Paragraph>{await later(name, ms)}</Paragraph>;
    const email = (name: string, ms: number) => (
      <Email>
        <Row>
          <Column>
            <Slow name={`${name} 1`} ms={ms} />
            <Slow name={`${name} 2`} ms={20 - ms} />
          </Column>
        </Row>
      </Email>
    );
    const [a, b] = await Promise.all([renderToJson(email("A", 15)), renderToJson(email("B", 2))]);
    expect(contents(a)).toEqual(["A 1", "A 2"]);
    expect(contents(b)).toEqual(["B 1", "B 2"]);
  });

  it("reject with what a component threw after an await, as the error's cause", async () => {
    const boom = new Error("the order service is down");
    const Broken = async () => {
      await later(null);
      throw boom;
    };
    const failure = await renderToHtml(<Email><Row><Column><Paragraph>Before</Paragraph><Broken /></Column></Row></Email>).catch((error) => error);
    expect(failure).toBeInstanceOf(RenderError);
    expect(failure).toMatchObject({ message: "[Unlayer] the order service is down (in <Broken> at Row 1 › Column 1 › Broken)", component: "Broken", position: "Row 1 › Column 1 › Broken", cause: boom });
    async function Template() {
      await later(null);
      throw boom;
    }
    await expect(renderToJson(<Template />)).rejects.toMatchObject({ message: "[Unlayer] the order service is down (in <Template>)", component: "Template", cause: boom });
  });

  it("compile <Tailwind config>, also in a template that's async", async () => {
    async function Welcome() {
      const color = await later("#007291");
      return (
        <Tailwind config={{ theme: { extend: { colors: { brand: color } } } }}>
          <Email className="bg-gray-100">
            <Row>
              <Column>
                <Paragraph className="text-brand">Hi</Paragraph>
              </Column>
            </Row>
          </Email>
        </Tailwind>
      );
    }
    const design = await renderToJson(<Welcome />);
    expect(design.body.values.backgroundColor).toBe("#f3f4f6");
    expect(design.body.rows[0].columns[0].contents[0].values.color).toBe("#007291");
    // The Tailwind entry's async renderers are these.
    expect(tailwind.renderToHtml).toBe(renderToHtml);
    expect(tailwind.renderToJson).toBe(renderToJson);
  });

  it("format the HTML with `pretty`: the same visible text, and Outlook's conditional comments kept", async () => {
    const Name = async () => <em>{await later("Ada")}</em>;
    const email = (
      <Email>
        <Row>
          <Column>
            <Paragraph>
              Hello <Name />, see <a href="https://example.com">this</a>.
            </Paragraph>
          </Column>
        </Row>
      </Email>
    );
    const [plain, pretty] = await Promise.all([renderToHtml(email), renderToHtml(email, { pretty: true })]);
    expect(pretty).not.toBe(plain);
    expect(pretty.split("\n").length).toBeGreaterThan(plain.split("\n").length);
    const text = (html: string) => new JSDOM(html).window.document.body.textContent!.replace(/\s+/g, " ").trim();
    expect(text(pretty)).toBe(text(plain));
    // Every comment as it was: Outlook's conditional ones hold markup that only pairs up for Outlook.
    const comments = (html: string) => html.match(/<!--[\s\S]*?-->/g) ?? [];
    expect(comments(pretty).filter((c) => /\[if [^\]]*mso/.test(c)).length).toBeGreaterThan(0);
    expect(comments(pretty)).toEqual(comments(plain));
    expect(pretty).toContain("Hello <em>Ada</em>, see");
    // Standalone: any HTML, the synchronous renderers' too, formatted the same way.
    expect(await formatted(renderToHtmlSync(<Email><Row><Column><Paragraph>Hello Ada</Paragraph></Column></Row></Email>))).toBe(
      await renderToHtml(<Email><Row><Column><Paragraph>Hello Ada</Paragraph></Column></Row></Email>, { pretty: true })
    );
  });

  it("write the plain text with the synchronous renderer's options", async () => {
    const email = (
      <Email>
        <Row>
          <Column>
            <Heading>Welcome</Heading>
            <Paragraph html='Read <a href="https://example.com/a">the guide</a>.' />
          </Column>
        </Row>
      </Email>
    );
    expect(await renderToPlainText(email, { links: "after", uppercaseHeadings: false })).toBe("Welcome\n\nRead the guide [1].\n\n[1] https://example.com/a");
  });

  it("say the synchronous renderers can't, naming the async component (without calling it)", () => {
    let calls = 0;
    const Later = async () => (calls++, <Paragraph>later</Paragraph>);
    const email = <Email><Row><Column><Later /><Paragraph>Still here</Paragraph></Column></Row></Email>;
    const said = '[Unlayer] it is async or suspends, and this renderer is synchronous: render with "@unlayer/react-elements/async", or load its data first and pass it as props (in <Later> at Row 1 › Column 1 › Later)';
    expect(() => renderToHtmlSync(email)).toThrow(said);
    // Left out where the render leaves failed parts out, said once.
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      expect(renderToHtmlSync(email, { onError: "omit" })).toContain("Still here");
      expect(error.mock.calls.map((c) => String(c[0]))).toEqual([said.replace("[Unlayer] it", "[Unlayer] Left out: it")]);
    } finally {
      error.mockRestore();
    }
    expect(calls).toBe(0);
  });
});
