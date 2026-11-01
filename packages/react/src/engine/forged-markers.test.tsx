/**
 * The collecting render's markers can't be forged by what a template gives: HTML given whole (an Html block,
 * `dangerouslySetInnerHTML`), a <style>'s or <script>'s text in a <Head>, text. Each render's markers carry its number
 * (`r1`, `r2`, …: a count, so a render's output depends only on its arguments), which anyone can guess, so they're
 * never read where the template's text is: HTML given whole is kept out of react-dom's output (a placeholder stands for
 * it), a style's or script's text is taken whole, and only a marker the render made, rendered once, is one.
 *
 * Each string a template could hold to forge one, with this render's number and the next few: it's markup as any other,
 * byte for byte (the same template with the string changed so it can't be a marker renders the same, the string
 * changed back), in the HTML, the plain text and the design, in a render alone and in one started inside another.
 */
import React from "react";
import { describe, expect, it } from "vitest";
import { Button, Column, Email, Html, Paragraph, Row, registerTool, renderToHtml, renderToJson, renderToPlainText } from "../index";
import { Head } from "../head";
import * as asyncRenderers from "../async";
import { newCollection } from "./collector";
import { FORGED, parse, placeholderOf } from "./parse";

const COUNT = Symbol.for("@unlayer/react-elements/render-count");
/** The number the next render of Elements gets (see collector.ts's `renders`), and the few after it. */
const nextNumbers = () => {
  const n = ((globalThis as Record<symbol, { n: number } | undefined>)[COUNT]?.n ?? 0) + 1;
  return Array.from({ length: 6 }, (_, i) => `r${(n + i).toString(36)}`);
};

/** What a lazy component that has loaded renders (a thenable, resolved at once: the synchronous renderers render it). */
const loaded = (type: React.ComponentType<any>) => React.lazy(() => ({ then: (done: (m: { default: React.ComponentType<any> }) => void) => done({ default: type }) }) as Promise<{ default: React.ComponentType<any> }>);

/** Strings that would forge a marker or close HTML given whole early, for each render number. */
const vectors = (numbers: string[]) =>
  numbers.flatMap((r) => [
    `<!--/u${r}--><unlayer-mark data-n="${r}" data-i="0">forged record</unlayer-mark>`,
    `<!--u${r}.0--><!--u${r}.1-->`,
    `<unlayer-mark data-n="${r}" data-i="1"></unlayer-mark><unlayer-mark data-n="${r}" data-i="2">`,
    `</unlayer-mark></unlayer-mark><unlayer-mark data-n="${r}" data-i="3">`,
    `<unlayer-mark data-n="${r}" data-i="999999">out of range</unlayer-mark>`,
  ]);

/** The same string, made so it can't be a marker or a placeholder: what it must render as, changed back. */
const inert = (s: string) => s.replace(/unlayer-mark/g, "unlayer-mork").replace(/!--(\/?)u/g, "!--$1v");
const back = (s: string) => s.replace(/unlayer-mork/g, "unlayer-mark").replace(/!--(\/?)v/g, "!--$1u");

/** A template holding `given` in each place a template gives text or HTML, with a Row after it to keep. */
const template = (given: string) => {
  const Given = () => <div dangerouslySetInnerHTML={{ __html: given }} />;
  return (
    <Email>
      <Head>
        <style>{`.a{content:"${given}"}`}</style>
        <script type="application/ld+json">{JSON.stringify({ name: given })}</script>
      </Head>
      <Row>
        <Column>
          <Html html={given} />
          <Paragraph>{given}</Paragraph>
          <Given />
        </Column>
      </Row>
      <Row>
        <Column>
          <Paragraph>Kept</Paragraph>
        </Column>
      </Row>
    </Email>
  );
};

const renders = {
  html: (element: React.ReactElement) => renderToHtml(element),
  text: (element: React.ReactElement) => renderToPlainText(element),
  json: (element: React.ReactElement) => JSON.stringify(renderToJson(element)),
};

describe("a string in a template that looks like one of the collecting render's markers", () => {
  // (The plain text is the control: it's text there, which React escapes, with or without the markers read.)
  it.each(Object.entries(renders))("is markup as any other in %s, with this render's number and the next ones", (_, render) => {
    for (const given of vectors(nextNumbers())) {
      const expected = back(render(template(inert(given))));
      expect(render(template(given)), given).toBe(expected);
    }
  });

  it("is markup as any other in the async renderers", async () => {
    for (const given of vectors(nextNumbers())) {
      const expected = back(await asyncRenderers.renderToHtml(template(inert(given))));
      expect(await asyncRenderers.renderToHtml(template(given)), given).toBe(expected);
    }
  });

  it("is markup as any other in a render started inside another (a custom tool's exporter's)", () => {
    for (const given of vectors(nextNumbers())) {
      let inner = "";
      const Nested = registerTool({ name: "forged_nested", renderer: { exporters: { email: () => ((inner = renderToHtml(template(given))), "<b>nested</b>") } } });
      const outer = (<Email><Row><Column><Html html={given} /><Nested /></Column></Row></Email>);
      const html = renderToHtml(outer);
      expect(inner, given).toBe(back(renderToHtml(template(inert(given)))));
      expect(html).toContain("<b>nested</b>");
      expect(html.split("unlayer-mark").length - 1, given).toBe(given.split("unlayer-mark").length - 1);
    }
  });
});

describe("a <script>'s or <style>'s text from data (JSON-LD of an order)", () => {
  // A product description from a CMS in Gmail's JSON-LD order markup, written the usual React way. Its `<!--` (React 18),
  // or a `</scripts` then a `<!--` (React 19), ran the email's markup on as a comment: the design kept one row, the
  // HTML lost the rows after it (in a <Head>: the whole body), and the collecting render's markers were in it. An
  // `</unlayer-mark>` in it closed the Column it was in.
  const descriptions = ["Brass desk lamp <!-- more", "Brass desk lamp </scripts and <!-- more", "</unlayer-mark></unlayer-mark> lamp <!--", "</script><p>lamp</p> <!--", "</style> lamp </STYLE > <!--"];
  const order = (description: string) => JSON.stringify({ "@context": "http://schema.org", "@type": "Order", orderNumber: "A-1001", acceptedOffer: { itemOffered: { name: "Desk lamp", description } } });
  type Place = "rows" | "head" | "column";
  const template = (description: string, place: Place, tag: "script" | "style", form: "dsih" | "children") => {
    const text = tag === "script" ? order(description) : `.lamp{content:${JSON.stringify(description)}}`;
    const Markup = () => (form === "dsih" ? React.createElement(tag, { type: tag === "script" ? "application/ld+json" : undefined, dangerouslySetInnerHTML: { __html: text } }) : React.createElement(tag, { type: tag === "script" ? "application/ld+json" : undefined }, text));
    return (
      <Email>
        {place === "head" ? <Head><Markup /></Head> : null}
        <Row><Column><Paragraph>Thanks for your order</Paragraph></Column></Row>
        {place === "rows" ? <Markup /> : null}
        <Row><Column><Paragraph>Order A-1001</Paragraph>{place === "column" ? <Markup /> : null}<Paragraph>Track your order</Paragraph></Column></Row>
        <Row><Column><Paragraph>Questions? Reply to this email.</Paragraph></Column></Row>
      </Email>
    );
  };
  const blocks = (design: ReturnType<typeof renderToJson>) => design.body.rows.map((row) => row.columns.map((column) => column.contents.length));

  for (const place of ["rows", "head", "column"] as const) {
    it(`keeps every row and block, and no marker, with it ${place === "rows" ? "among the rows" : place === "head" ? "in a <Head>" : "in a Column"}`, () => {
      for (const tag of ["script", "style"] as const) {
        for (const form of ["dsih", "children"] as const) {
          // (The negative control: the same template with a description that ends nothing.)
          const expected = blocks(renderToJson(template("Brass desk lamp", place, tag, form)));
          expect(expected).toEqual([[1], [place === "column" ? 3 : 2], [1]]);
          for (const description of descriptions) {
            const at = `${tag} ${form}: ${description}`;
            const html = renderToHtml(template(description, place, tag, form));
            expect(blocks(renderToJson(template(description, place, tag, form))), at).toEqual(expected);
            for (const text of ["Thanks for your order", "Track your order", "Questions? Reply", "</html>"]) expect(html, at).toContain(text);
            // (The description's own `</unlayer-mark>` is its text; no marker of the render's is.)
            expect(html, at).not.toMatch(/<unlayer-mark data-|<!--u[a-z0-9]+\.\d+-->/);
            expect(renderToPlainText(template(description, place, tag, form)), at).toContain("Questions? Reply");
          }
        }
      }
    });
  }
});

describe("a marker or placeholder of a part React left out (a <Suspense>'s content where it rendered the fallback)", () => {
  // What a lazy component renders is React's own render of it (Elements can't prepare it: nothing public gives what
  // React.lazy loads), so its HTML given whole reaches react-dom's output as written, and can name this render's
  // markers and placeholders by number. One of a part React left out (it rendered it, then rendered the fallback) or
  // never rendered (a fallback not shown) brought that part's content into the email; React wrote none of it there.
  const SECRETS = ["SECRET_RAW", "SECRET_BLOCK", "SECRET_STYLE", "SECRET_FALLBACK"];
  const NEVER = { then() {} } as PromiseLike<never>;
  const Never = () => {
    throw NEVER;
  };
  // (A lazy component that fails to load: React renders the <Suspense>'s fallback itself, in either renderer.)
  const FailsToLoad = React.lazy(() => ({ then: (_: unknown, fail: (error: Error) => void) => fail(new Error("its chunk didn't load")) }) as Promise<never>);
  const Raw = ({ html, tag = "div" }: { html: string; tag?: string }) => React.createElement(tag, { dangerouslySetInnerHTML: { __html: html } });
  class RawClass extends React.Component<{ html: string }> {
    render() {
      return <Raw html={this.props.html} />;
    }
  }
  /** The ways a lazy component's own markup can give HTML whole: an element, a component of its own, a class, memo, forwardRef. */
  const FORGERS: Record<string, (html: string) => React.ComponentType> = {
    element: (html) => loaded(() => <Raw html={html} />),
    "a component": (html) => loaded(() => <section><Inner html={html} /></section>),
    "a class": (html) => loaded(() => <RawClass html={html} />),
    memo: (html) => loaded(React.memo(() => <Raw html={html} />)),
    forwardRef: (html) => loaded(React.forwardRef<unknown, object>(() => <Raw html={html} tag="span" />)),
    "a style": (html) => loaded(() => <Raw html={html} tag="style" />),
  };
  function Inner({ html }: { html: string }) {
    return <Raw html={html} />;
  }
  /** A placeholder or a marker of this render's number `r`, number `k`. */
  const FORMS = [(r: string, k: number) => `<!--u${r}.${k}-->`, (r: string, k: number) => `<unlayer-mark data-n="${r}" data-i="${k}"></unlayer-mark>`, (r: string, k: number) => `<unlayer-mark data-n="${r}" data-i="${k}">x</unlayer-mark>`];
  /**
   * A template whose first Column has a part React leaves out (`how`: a <Suspense>'s content where something in it
   * suspends or fails to load, a component of the template's own left out alone, or a fallback React doesn't render),
   * and a lazy component after it, `Forger`.
   */
  const template = (how: "suspends" | "fails" | "fallback" | "boundary", Forger: React.ComponentType) => {
    const secrets = (
      <>
        <Raw html="SECRET_RAW" />
        <Paragraph>SECRET_BLOCK</Paragraph>
        <Raw tag="style" html=".x{content:'SECRET_STYLE'}" />
      </>
    );
    const part =
      how === "fallback" ? (
        <React.Suspense fallback={<><div dangerouslySetInnerHTML={{ __html: "SECRET_FALLBACK" }} /><style dangerouslySetInnerHTML={{ __html: ".y{content:'SECRET_FALLBACK'}" }} /><Paragraph>SECRET_FALLBACK</Paragraph></>}><Paragraph>shown</Paragraph></React.Suspense>
      ) : how === "boundary" ? (
        <Boundaried>{secrets}</Boundaried>
      ) : (
        <React.Suspense fallback={null}>{secrets}{how === "suspends" ? <Never /> : <FailsToLoad />}</React.Suspense>
      );
    return (
      <Email>
        <Row><Column>{part}<Paragraph>Kept</Paragraph></Column></Row>
        <Row><Column><Forger /></Column></Row>
      </Email>
    );
  };
  /** A component of the template's own in a Column (left out alone when it fails, `onError: "omit"`), failing after its secrets. */
  function Boundaried({ children }: { children: React.ReactNode }) {
    return <div>{children}<FailsToLoad /></div>;
  }
  const leaked = (out: string) => SECRETS.filter((s) => out.includes(s));

  it("brings nothing of it into the email, the plain text or the design, in the synchronous and async renderers (each way a lazy component gives HTML, each of this render's numbers)", async () => {
    const found: string[] = [];
    let forgedFailures = 0;
    for (const how of ["suspends", "fails", "fallback", "boundary"] as const) {
      for (const [by, forger] of Object.entries(FORGERS)) {
        for (let k = 0; k < 12; k++) for (const [form, forge] of FORMS.entries()) {
          for (const mode of ["sync", "async"] as const) {
            // (A synchronous render renders a <Suspense>'s fallback where what's in it suspends; an async one waits.)
            if (mode === "async" && how === "suspends") continue;
            const outs: string[] = [];
            for (const api of ["html", "text", "json"] as const) {
              const [r] = nextNumbers();
              const Forger = forger(forge(r, k));
              try {
                const element = template(how, Forger);
                const options = { onError: "omit" as const };
                if (mode === "sync") outs.push(api === "html" ? renderToHtml(element, options) : api === "text" ? renderToPlainText(element, options) : JSON.stringify(renderToJson(element, options)));
                else outs.push(api === "html" ? await asyncRenderers.renderToHtml(element, options) : api === "text" ? await asyncRenderers.renderToPlainText(element, options) : JSON.stringify(await asyncRenderers.renderToJson(element, options)));
              } catch (error) {
                // (It may fail the render, saying the markup holds a marker React didn't write: never more than that.)
                expect(String((error as Error).message), `${how} ${by} ${form} ${k} ${mode} ${api}`).toMatch(/marker of Elements' own collecting render/);
                forgedFailures++;
              }
            }
            for (const out of outs) for (const secret of leaked(out)) found.push(`${how}, ${by}, ${form ? "marker" : "placeholder"} ${k}, ${mode}: ${secret}`);
          }
        }
      }
    }
    expect(found).toEqual([]);
    // (The forgeries do name this render's markers: some of them fail the render.)
    expect(forgedFailures).toBeGreaterThan(0);
  }, 120_000);

  it("leaves the email as it was where the lazy component's HTML only looks like one (the control)", () => {
    for (const how of ["suspends", "fails", "fallback", "boundary"] as const) {
      const html = renderToHtml(template(how, FORGERS.element(inert(FORMS.map((forge) => forge("r1", 0)).join("")))), { onError: "omit" });
      expect(html).toContain("Kept");
      expect(leaked(html)).toEqual([]);
    }
  });
});

describe("HTML given whole in what a lazy component renders that isn't whole (an element, a <style> or a comment left open, an end tag of what it didn't open)", () => {
  // What a lazy component renders is React's own render of it (see above): its HTML given whole is in react-dom's output
  // as written, among the markers React wrote after it. A <style> or <script> it left open took every block and row
  // after it (the design kept none, the email lost them) and wrote the render's markers into the email; one closed by
  // a later <style>'s end tag did the same, and a comment left open did up to the next `-->` React wrote; an
  // `</unlayer-mark>` in it ended the Column it was in, so the blocks after it were left out with nothing said.
  const Cms = ({ html }: { html: string }) => <div className="cms" dangerouslySetInnerHTML={{ __html: html }} />;
  const lazyCms = (html: string) => loaded(() => <Cms html={html} />);
  /** The same, not lazy: its HTML given whole kept out of react-dom's output, so nothing in it is read. */
  const plainCms = (html: string) => () => <Cms html={html} />;
  /** A component of the template's around it: an end tag in it can't end the `<div>` this one opened. */
  const Wrap = ({ children }: { children: React.ReactNode }) => <div className="wrap">{children}</div>;
  /**
   * Markup after it whose ends it could run on to: a `</style>`, a `</template>`, the end of a comment React writes (a
   * placeholder for HTML given whole; between two texts, in an async render).
   */
  const Later = () => (
    <>
      <style>{".later{color:red}"}</style>
      <template><b>later</b></template>
      <p>{"Later "}{"text"}</p>
      <div dangerouslySetInnerHTML={{ __html: "<i>Later HTML</i>" }} />
    </>
  );
  const template = (Lazy: React.ComponentType) => (
    <Email>
      <Row>
        <Column>
          <Wrap><Lazy /></Wrap>
          <Paragraph>Your order shipped</Paragraph>
          <Button href="https://example.com/track">Track order</Button>
        </Column>
      </Row>
      <Row>
        <Column>
          <Paragraph>Questions? Reply to this email.</Paragraph>
          <Later />
        </Column>
      </Row>
    </Email>
  );
  const renderers = (mode: "sync" | "async") => {
    const r = mode === "sync" ? { renderToHtml, renderToPlainText, renderToJson } : asyncRenderers;
    return { html: async (element: React.ReactElement) => r.renderToHtml(element), text: async (element: React.ReactElement) => r.renderToPlainText(element), json: async (element: React.ReactElement) => JSON.stringify(await r.renderToJson(element)) };
  };
  const blocks = (design: string) => (JSON.parse(design) as ReturnType<typeof renderToJson>).body.rows.map((row) => row.columns.map((column) => column.contents.map((content) => content.type)));
  const GENUINE = /<unlayer-mark data-n="r[0-9a-z]+" data-i=|<!--ur[0-9a-z]+\.\d+-->/;

  /**
   * Markup in a quoted value, as a sanitizer built on a DOM (jsdom's) writes it: a `>` there is the value's, not the
   * tag's end, so nothing after it is a tag, an end tag or a URL React 18 wrote. React 18's `javascript:` URL, written
   * as React 19 writes it, there ended the value (its `"`), and the rest was the <img>'s: a live `onerror`. The same
   * where the parse read on otherwise than a browser: past a quote left open, in a comment a browser ended (`<!-->`, at
   * `--!>`), or in a <textarea> a browser ended inside what the parse read as a value.
   */
  const IN_VALUES = [
    '<img alt="a> <a href=javascript:alert(1) title=x onerror=alert(2) src=y>" src="pic.png">',
    "<img alt='a> <a href=javascript:alert(1) onerror=alert(2) src=y>' src=pic.png>",
    '<a title="1 > 0" href="https://example.com/x">x</a><img alt="b></div></td></tr></table>c" src="pic.png">',
    '<img alt="open quote <a href=javascript:alert(1)>',
    '<b>bold</b><!-- --!><img alt="x --> <a href=javascript:alert(1) onerror=alert(2) src=y>" src=z>',
    '<!--><img alt="x --> <a href=javascript:alert(1) onerror=alert(2) src=y>" src=z>',
    '<textarea><a title="</textarea><img alt=" href=javascript:alert(1) onerror=alert(2) src=y z="w">',
    '<STYLE><a title="</STYLE><img alt=" href=javascript:0 onerror=alert(1) src=y z="w">',
    // (In an <svg> or <math>, a <style>'s or <script>'s content is markup: a `</style>` in a value isn't its end.)
    '<svg><style><a title="x> <a href=javascript:1 onclick=alert(1)>"></style></svg>',
    '<svg><script><a title="x> <a href=javascript:1 onclick=alert(1)>"></script></svg>',
    '<math><style><a title="x> <a href=javascript:1 onclick=alert(1)>"></style></math>',
    '<svg><style><a title="x></style><a href=javascript:1 onclick=alert(1) y="z"></a></svg>',
    '<svg><![CDATA[ > <a title="]]><x y=" href=javascript:1 onclick=alert(1) z="w"></x></svg>',
  ];

  it("is the email, plain text and design of the same component not lazy, every block and row kept and no marker written, where it leaves an element, a <style>, a <script> or a comment open or ends what it didn't open", async () => {
    const left = ["<style>.promo{color:red}", "<script>var promo = 1;", "<style>", "<!-- promo", "<!--$!--><template>promo", "</div></div></td></tr></table>promo", "<div>promo", "<div><span>promo", "<p>a<p>promo", "<textarea>promo", "</style></script>--> promo", ...IN_VALUES];
    for (const mode of ["sync", "async"] as const) {
      const r = renderers(mode);
      // (The negative control: HTML that's whole.)
      const expected = blocks(await r.json(template(lazyCms("<b>promo</b>"))));
      expect(expected).toEqual([[["html", "text", "button"]], [["text", "html"]]]);
      for (const raw of left) {
        const at = `${mode}: ${raw}`;
        for (const api of ["html", "text", "json"] as const) {
          const out = await r[api](template(lazyCms(raw)));
          // (But a comment of the form React writes its own in, which an async render's parse takes for React's.)
          const notLazy = await r[api](template(plainCms(raw)));
          expect(out, `${at} (${api})`).toBe(mode === "async" ? notLazy.split("<!--$!-->").join("") : notLazy);
          expect(out, `${at} (${api})`).not.toMatch(GENUINE);
        }
        const html = await r.html(template(lazyCms(raw)));
        for (const text of ["Your order shipped", "Track order", "Reply to this email.", ".later{color:red}", "<i>Later HTML</i>", "</html>"]) expect(html, at).toContain(text);
        expect(html, at).toContain(raw.replace("<!--$!-->", mode === "async" ? "" : "<!--$!-->"));
        expect(blocks(await r.json(template(lazyCms(raw)))), at).toEqual(expected);
      }
    }
  });

  it("leaves out, as a browser does, an end tag that ends nothing where it would be a block's text (React's own, after the HTML ended the component's element)", async () => {
    // (The `</div>` in the HTML ends the footer's <div>, as a browser reads it: React's `</span>` and `</div>` after it
    // end nothing, among the blocks. In an element's content, one is written as it is, as the same HTML not lazy: above.)
    const Footer = () => (
      <div className="footer">
        <Paragraph>Thanks for reading</Paragraph>
        <span dangerouslySetInnerHTML={{ __html: "Text</div>" }} />
        <Paragraph>Unsubscribe</Paragraph>
      </div>
    );
    const email = (Content: React.ComponentType) => (
      <Email>
        <Row>
          <Column>
            <Content />
          </Column>
        </Row>
      </Email>
    );
    for (const mode of ["sync", "async"] as const) {
      const r = renderers(mode);
      for (const Content of [loaded(Footer), Footer]) {
        const at = `${mode}${Content === Footer ? " (not lazy)" : ""}`;
        expect(await r.html(email(Content)), at).not.toMatch(/&lt;\/(?:span|div)&gt;/);
        expect(await r.json(email(Content)), at).not.toMatch(/&lt;\/(?:span|div)&gt;/);
        const text = await r.text(email(Content));
        expect(text, at).not.toMatch(/<\/(?:span|div)>/);
        for (const words of ["Thanks for reading", "Unsubscribe"]) expect(text, at).toContain(words);
      }
    }
  });

  it("writes what's after an <svg> a browser keeps open, where the parse doesn't, as given (React 18's URLs too)", async () => {
    // (A `</svg>` in its <foreignObject>'s HTML ends nothing to a browser, and one left open at the lazy component's end
    // goes on into what's after it: a <style> there is markup to the browser, and React 18's URL written in it ended a
    // value.)
    const style = '<style><a title="x> <a href=javascript:1 onclick=alert(1)>"></style>';
    const Html = ({ tag, html }: { tag: "a" | "span"; html: string }) => React.createElement(tag, { className: "cms", dangerouslySetInnerHTML: { __html: html } });
    const cases: React.ComponentType[][] = [
      [() => <Html tag="span" html={`<svg><foreignObject><div></svg></div></foreignObject>${style}</svg>`} />],
      [() => <Html tag="span" html="</span><svg>" />, () => <Html tag="a" html={style} />],
    ];
    for (const mode of ["sync", "async"] as const) {
      const r = renderers(mode);
      for (const [at, parts] of cases.entries()) {
        const email = (lazy: boolean) => (
          <Email>
            <Row>
              <Column>
                <Wrap>
                  {parts.map((Part, i) => {
                    const Content = lazy ? loaded(Part) : Part;
                    return <Content key={i} />;
                  })}
                </Wrap>
                <Paragraph>After</Paragraph>
              </Column>
            </Row>
          </Email>
        );
        expect(await r.html(email(true)), `${mode} ${at}`).toBe(await r.html(email(false)));
      }
    }
  });

  it("fails the render, by name, where it ends one of the render's markers (`</unlayer-mark>`), whatever is after it", async () => {
    const ends = ["</unlayer-mark>", "</UNLAYER-MARK>", "</div></unlayer-mark>", "</div></div></unlayer-mark>", "</div></unlayer-mark><br>", '</div></unlayer-mark><unlayer-mark data-n="r0">', "<b></unlayer-mark></b>", '<unlayer-mark data-n="r0" data-i="0">promo</unlayer-mark>'];
    for (const mode of ["sync", "async"] as const) {
      const r = renderers(mode);
      for (const raw of ends) {
        for (const api of ["html", "text", "json"] as const) {
          await expect(r[api](template(lazyCms(raw))), `${mode} ${api}: ${raw}`).rejects.toThrow(/marker of Elements' own collecting render/);
        }
      }
    }
    // (The negative control: the same with no end tag of the render's.)
    expect(renderToHtml(template(lazyCms("</div></unlayer-mork>")))).toContain("Track order");
  });
});

describe("a marker or HTML given whole that React rendered, in a part it kept, and the parse never reads", () => {
  // React writes every marker it renders, once: one the parse doesn't read is in what it read as text (HTML given whole
  // in what a lazy component renders, run on past it), so what the template holds there isn't where it is.
  const collection = () => newCollection({ omit: false, shared: {} });

  it("fails the render, by name: a marker", () => {
    const c = collection();
    c.marks.push({ k: "r", record: {} });
    c.rendered.add(0);
    expect(() => parse("<style>.promo{}</style>", c)).toThrow(FORGED);
    // (The negative control: where it's read.)
    const read = collection();
    read.marks.push({ k: "r", record: {} });
    read.rendered.add(0);
    expect(() => parse(`<unlayer-mark data-n="${read.nonce}" data-i="0">x</unlayer-mark>`, read)).not.toThrow();
  });

  it("fails the render, by name: HTML given whole", () => {
    const c = collection();
    c.raw.push({ html: "<b>promo</b>", scope: -1 });
    c.rawRendered.add(0);
    expect(() => parse("<style>.promo{}</style>", c)).toThrow(FORGED);
    const read = collection();
    read.raw.push({ html: "<b>promo</b>", scope: -1 });
    read.rawRendered.add(0);
    expect(() => parse(`<p>${placeholderOf(read.nonce, 0)}</p>`, read)).not.toThrow();
  });

  it("fails the render, by name, where one is never ended", () => {
    // (React ends every marker it writes: one with no end tag ran on over the rest of the template.)
    const c = collection();
    c.marks.push({ k: "r", record: {} });
    c.rendered.add(0);
    expect(() => parse(`<unlayer-mark data-n="${c.nonce}" data-i="0">x<p>rest</p>`, c)).toThrow(FORGED);
  });

  it("doesn't where React left that part out (a <Suspense>'s content, where it wrote the fallback)", () => {
    const c = collection();
    // (Its fallback's marker, 0, read; what's in the content, 1, rendered but not written.)
    c.marks.push({ k: "fb", frame: { name: "Suspense" } as never, scope: undefined }, { k: "r", record: {}, scope: 0 });
    c.scopes.push({ parent: -1, marker: 0 });
    c.rendered.add(0).add(1);
    expect(() => parse(`<unlayer-mark data-n="${c.nonce}" data-i="0">loading</unlayer-mark>`, c)).not.toThrow();
  });
});
