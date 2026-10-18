// @vitest-environment node
import React from "react";
import { JSDOM } from "jsdom";
import { describe, expect, it, vi } from "vitest";
import { Column, Email, Heading, Html, Paragraph, RenderError, Row, UnlayerProvider, renderToHtml as renderToHtmlSync, renderToHtmlParts as renderToHtmlPartsSync, renderToJson as renderToJsonSync, renderToPlainText as renderToPlainTextSync } from "../index";
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

  /**
   * Data that suspends until it's there, as React 18's Suspense libraries do (react-i18next's `useTranslation`):
   * `read()` throws a promise until it has settled.
   */
  const suspending = (value: string) => {
    const data = { calls: 0, value: undefined as string | undefined, promise: undefined as Promise<void> | undefined };
    const read = () => {
      data.calls++;
      data.promise ??= later(value).then((loaded) => void (data.value = loaded));
      if (data.value === undefined) throw data.promise;
      return data.value;
    };
    return Object.assign(data, { read });
  };
  type Data = { calls: number; read: () => string };
  const Theme = React.createContext("none");
  const InTheme = () => <Paragraph>{React.useContext(Theme)}</Paragraph>;
  const one = (content: React.ReactNode) => <Email><Row><Column>{content}</Column></Row></Email>;
  const TEMPLATE = 'async and suspending templates need "@unlayer/react-elements/async"\'s renderers';
  const inSync = (name: string, position: string) => `it is async or suspends, and this renderer is synchronous: render with "@unlayer/react-elements/async", or load its data first and pass it as props (in <${name}> at ${position})`;
  /** Where it suspends: a template whose data does there, and what the synchronous renderers say for it. */
  const WHERE: Array<[string, (data: Data) => React.ReactElement, string]> = [
    ["the template", (data) => { const Template = () => one(<Paragraph>{data.read()}</Paragraph>); return <Template />; }, TEMPLATE],
    ["the template in a provider", (data) => {
      const Template = () => one(<Paragraph>{data.read()}</Paragraph>);
      const Provider = ({ children }: { children: React.ReactNode }) => <Theme.Provider value="dark">{children}</Theme.Provider>;
      return <Provider><Template /></Provider>;
    }, TEMPLATE],
    ["a wrapper", (data) => {
      const Wrapper = ({ children }: { children: React.ReactNode }) => <Theme.Provider value={data.read()}>{children}</Theme.Provider>;
      return <Wrapper>{one(<InTheme />)}</Wrapper>;
    }, TEMPLATE],
    ["a class wrapper", (data) => {
      class Loader extends React.Component<{ children: React.ReactNode }> {
        render() {
          return <Theme.Provider value={data.read()}>{this.props.children}</Theme.Provider>;
        }
      }
      return <Loader>{one(<InTheme />)}</Loader>;
    }, TEMPLATE],
    ["a component", (data) => { const Text = () => <Paragraph>{data.read()}</Paragraph>; return one(<Text />); }, inSync("Text", "Row 1 › Column 1 › Text")],
    ["a class component", (data) => {
      class Translated extends React.Component {
        render() {
          return <Paragraph>{data.read()}</Paragraph>;
        }
      }
      return one(<Translated />);
    }, inSync("Translated", "Row 1 › Column 1 › Translated")],
    ["a block's children", (data) => { const Name = () => <b>{data.read()}</b>; return one(<Paragraph>Hi <Name /></Paragraph>); }, inSync("Name", "Row 1 › Column 1 › Paragraph › Name")],
    // A <Suspense> around the root is outside the document: its fallback isn't one, so what's in it is waited for, and
    // the synchronous renderers say so, as without it.
    ["the template in a <Suspense>", (data) => { const Template = () => one(<Paragraph>{data.read()}</Paragraph>); return <React.Suspense fallback={<p>Loading</p>}><Template /></React.Suspense>; }, TEMPLATE],
    ["a component, in a <Suspense> around the root", (data) => { const Text = () => <Paragraph>{data.read()}</Paragraph>; return <React.Suspense fallback={<p>Loading</p>}>{one(<Text />)}</React.Suspense>; }, inSync("Text", "Row 1 › Column 1 › Text")],
  ];

  it.each(WHERE)("wait where %s throws a promise (React 18's Suspense), calling it again once it settles; the synchronous renderers say what to do", async (_, template, said) => {
    expect(() => renderToHtmlSync(template(suspending("Loaded")))).toThrow(said);
    expect(() => renderToJsonSync(template(suspending("Loaded")))).toThrow(said);
    const data = suspending("Loaded");
    expect(await renderToHtml(template(data))).toContain("Loaded");
    // Suspended, then rendered once it settled.
    expect(data.calls).toBe(2);
    expect(JSON.stringify(await renderToJson(template(suspending("Loaded"))))).toContain("Loaded");
    expect(await renderToPlainText(template(suspending("Loaded")))).toContain("Loaded");
  });

  const use = (React as unknown as { use?: <T>(promise: PromiseLike<T>) => T }).use;
  it.runIf(use)("wait for `use()` of a promise the same way, wherever it is (React 19)", async () => {
    for (const [where, template, said] of WHERE.filter(([where]) => !where.includes("class"))) {
      const using = () => {
        const promise = later("Used");
        const data = { calls: 0, read: () => (data.calls++, use!(promise)) };
        return data;
      };
      expect(() => renderToHtmlSync(template(using())), where).toThrow(said);
      const data = using();
      expect(await renderToHtml(template(data)), where).toContain("Used");
      expect(data.calls, where).toBe(2);
    }
  });

  it("fail with what a promise a component throws rejected with, where it throws it again, as `use()` of it fails", async () => {
    const down = new Error("the translations didn't load");
    const failing = () => {
      const promise = later(null).then(() => {
        throw down;
      });
      promise.catch(() => {});
      let calls = 0;
      // (Waited for again each time it's thrown, it would never be done.)
      return () => {
        if (++calls > 5) throw new Error("called again and again");
        throw promise;
      };
    };
    const read = failing();
    const Template = () => one(<Paragraph>{read()}</Paragraph>);
    await expect(renderToHtml(<Template />)).rejects.toMatchObject({ message: "[Unlayer] the translations didn't load (in <Template>)", component: "Template", cause: down });
    const again = failing();
    const Text = () => <Paragraph>{again()}</Paragraph>;
    await expect(renderToHtml(one(<Text />))).rejects.toMatchObject({ message: "[Unlayer] the translations didn't load (in <Text> at Row 1 › Column 1 › Text)", cause: down });
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

  it("render a template with no root as the synchronous renderers do, calling it once", async () => {
    // Rows with no root: renderToHtml() renders them in a document, renderToJson() says the root it needs. The
    // async template is called once a render (not again by the synchronous render after), inside the providers and
    // after the wrapper (whose useId() moves the ids after it) around it.
    const Theme = React.createContext("light");
    const Themed = () => <p id={React.useId()}>{React.useContext(Theme)}</p>;
    const content = (
      <>
        <Themed />
        <Row><Column><Paragraph>A</Paragraph></Column></Row>
        <Row><Column><Paragraph>B</Paragraph></Column></Row>
      </>
    );
    const runs = { template: 0 };
    const Rows = () => content;
    async function LoadedRows() {
      runs.template++;
      await later(null);
      return content;
    }
    const Wrapper = ({ children }: { children: React.ReactElement }) => (React.useId(), children);
    const element = (Template: React.FC) => <Theme.Provider value="dark"><Wrapper><Template /></Wrapper></Theme.Provider>;
    const html = renderToHtmlSync(element(Rows));
    expect(html).toContain(">dark</p>");
    expect(await renderToHtml(element(LoadedRows))).toBe(html);
    expect(await renderToPlainText(element(LoadedRows))).toBe(renderToPlainTextSync(element(Rows)));
    expect(await renderToHtmlParts(element(LoadedRows))).toEqual(renderToHtmlPartsSync(element(Rows)));
    expect(runs.template).toBe(3);
    let said = "";
    try {
      renderToJsonSync(element(Rows));
    } catch (error) {
      said = (error as Error).message;
    }
    expect(said).toContain("Root element must be <Body>, <Email>, <Page>, or <Document>");
    await expect(renderToJson(element(LoadedRows))).rejects.toThrow(said);
    expect(runs.template).toBe(4);
  });

  it("resolve a lazy template (`React.lazy`) as an async one, its root's settings read; the synchronous renderers say it's async", async () => {
    // It was taken for a template with no root: the HTML in a web page's document without the root's language and
    // fonts, and renderToJson() said its root wasn't one.
    const Welcome = () => <Email lang="fr" fonts={[{ url: "https://fonts.example.com/brand.css" }]} previewText="Bonjour"><Row><Column><Paragraph>Lazy</Paragraph></Column></Row></Email>;
    const lazily = () => React.lazy(async () => (await later(null), { default: Welcome }));
    const Lazy = lazily();
    const Wrapper = () => <Lazy />;
    for (const element of [<Lazy />, <Wrapper />, <UnlayerProvider config={{ textDirection: "rtl" }}><Lazy /></UnlayerProvider>]) {
      const loaded = <Welcome />;
      const same = element.type === UnlayerProvider ? <UnlayerProvider config={{ textDirection: "rtl" }}>{loaded}</UnlayerProvider> : loaded;
      const html = await renderToHtml(element);
      expect(html).toBe(renderToHtmlSync(same));
      expect(html).toContain('lang="fr"');
      expect(html).toContain("brand.css");
      expect(await renderToHtmlParts(element)).toEqual(renderToHtmlPartsSync(same));
      expect(await renderToPlainText(element)).toBe(renderToPlainTextSync(same));
      expect(await renderToJson(element)).toEqual(renderToJsonSync(same));
    }
    // Loaded, the synchronous renderers render it too; before, they say it's async.
    expect(renderToHtmlSync(<Lazy />)).toBe(renderToHtmlSync(<Welcome />));
    const Pending = lazily();
    expect(() => renderToHtmlSync(<Pending />)).toThrow('[Unlayer] renderToHtml: async and suspending templates need "@unlayer/react-elements/async"');
    expect(() => renderToJsonSync(<Pending />)).toThrow(/renderToJson: could not unwrap <wrapper>.*async and suspending templates need/);
    // One that fails to load rejects with its error, naming it.
    const Missing = React.lazy(() => Promise.reject(new Error("no such chunk")));
    const failed = await renderToHtml(<Missing />).catch((error: unknown) => error);
    expect(failed).toBeInstanceOf(RenderError);
    expect(failed).toMatchObject({ message: "[Unlayer] no such chunk (in <lazy>)", component: "lazy", cause: new Error("no such chunk") });
  });

  it("unwrap a <Suspense> around the template, its root's settings read, waiting for what's in it; its fallback, which isn't a document, never renders", async () => {
    // It was taken for a template with no root: renderToJson() said its root wasn't one, and the HTML was a web page's
    // document without the root's language and fonts, the Email's own document inside it.
    const email = <Email lang="fr" fonts={[{ url: "https://fonts.example.com/brand.css" }]} previewText="Bonjour"><Row><Column><Paragraph>Hi</Paragraph></Column></Row></Email>;
    const Welcome = () => email;
    const AsyncWelcome = async () => (await later(null), <Welcome />);
    const loading = <p>Loading</p>;
    const html = renderToHtmlSync(<Welcome />);
    expect(html.match(/<body/g)).toHaveLength(1);
    const elements = [
      <React.Suspense fallback={loading}><Welcome /></React.Suspense>,
      <React.Suspense fallback={loading}><AsyncWelcome /></React.Suspense>,
      <React.Suspense fallback={loading}>{email}</React.Suspense>,
      <React.StrictMode><React.Suspense fallback={loading}><React.Suspense><AsyncWelcome /></React.Suspense></React.Suspense></React.StrictMode>,
    ];
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      for (const element of elements) {
        expect(await renderToHtml(element)).toBe(html);
        expect(await renderToHtmlParts(element)).toEqual(renderToHtmlPartsSync(<Welcome />));
        expect(await renderToPlainText(element)).toBe(renderToPlainTextSync(<Welcome />));
        expect(await renderToJson(element)).toEqual(renderToJsonSync(<Welcome />));
      }
      // The synchronous renderers, where nothing suspends; and an async template in one, said as without it.
      for (const element of [elements[0], elements[2]]) {
        expect(renderToHtmlSync(element)).toBe(html);
        expect(renderToJsonSync(element)).toEqual(renderToJsonSync(<Welcome />));
      }
      expect(warn.mock.calls.filter((call) => String(call[0]).includes("unwrap"))).toEqual([]);
    } finally {
      warn.mockRestore();
    }
    expect(() => renderToHtmlSync(elements[1])).toThrow(`[Unlayer] renderToHtml: ${TEMPLATE}`);
    expect(() => renderToJsonSync(elements[1])).toThrow(/renderToJson: could not unwrap <wrapper>.*async and suspending templates need/);
    // A template in it that fails fails the render, naming it: its fallback can't make the document.
    const Broken = async (): Promise<React.ReactElement> => {
      await later(null);
      throw new Error("no order");
    };
    for (const render of [renderToHtml, renderToJson]) {
      await expect(render(<React.Suspense fallback={loading}><Broken /></React.Suspense>)).rejects.toMatchObject({ message: "[Unlayer] no order (in <Broken>)", component: "Broken" });
      await expect(render(<React.Suspense fallback={loading}><Broken /></React.Suspense>, { onError: "omit" })).rejects.toBeInstanceOf(RenderError);
    }
  });

  it("wait for what's async in a template with no root, as in a root, each run once; the synchronous renderers say where it is", async () => {
    // An async block in a Column, an async Row, async markup and a thrown promise (React 18's Suspense) among Rows
    // with no root around them.
    const runs = { price: 0, total: 0, note: 0 };
    const Price = async () => {
      runs.price++;
      return <Paragraph>{await later("$10")}</Paragraph>;
    };
    const Total = async () => {
      runs.total++;
      return <Row><Column><Paragraph>{await later("$20")}</Paragraph></Column></Row>;
    };
    const Note = async () => {
      runs.note++;
      return <b>{await later("$30")}</b>;
    };
    const template = (data: Data) => {
      const Text = () => <Paragraph>{data.read()}</Paragraph>;
      const Rows = () => (
        <>
          <Row><Column><Price /></Column></Row>
          <Total />
          <div><Note /></div>
          <Row><Column><Text /></Column></Row>
        </>
      );
      return <Rows />;
    };
    const data = suspending("Loaded");
    const html = await renderToHtml(template(data));
    for (const text of ["$10", "$20", "<b>$30</b>", "Loaded"]) expect(html).toContain(text);
    expect(data.calls).toBe(2);
    expect(runs).toEqual({ price: 1, total: 1, note: 1 });
    expect(await renderToPlainText(template(suspending("Loaded")))).toBe("$10\n\n$20\n\n$30\n\nLoaded");
    expect((await renderToHtmlParts(template(suspending("Loaded")))).body).toContain("$20");
    expect(runs).toEqual({ price: 3, total: 3, note: 3 });
    // The design needs a root, async or not: what's in the template isn't waited for.
    await expect(renderToJson(template(suspending("Loaded")))).rejects.toThrow("Root element must be <Body>, <Email>, <Page>, or <Document>");
    expect(runs).toEqual({ price: 3, total: 3, note: 3 });
    // The synchronous renderers fail on the first, naming it and where it is.
    const said = inSync("Price", "Rows › Row 1 › Column 1 › Price");
    expect(() => renderToHtmlSync(template(suspending("Loaded")))).toThrow(said);
    expect(() => renderToHtmlPartsSync(template(suspending("Loaded")))).toThrow(said);
    expect(() => renderToPlainTextSync(template(suspending("Loaded")))).toThrow(said);
    // (A template that suspends itself is one of the template's wrappers, said as they are.)
    const Suspends = () => <Row><Column><Paragraph>{suspending("Loaded").read()}</Paragraph></Column></Row>;
    expect(() => renderToHtmlSync(<Suspends />)).toThrow(TEMPLATE);
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
    // Around Rows with no root too.
    const rows = await renderToHtml(<Tailwind config={{ theme: { extend: { colors: { brand: "#007291" } } } }}><Row><Column><Paragraph className="text-brand">Hi</Paragraph></Column></Row></Tailwind>);
    expect(rows).toMatch(/color: ?#007291/);
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
