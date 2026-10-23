/**
 * Divider, Html, Menu and Social write their web and document HTML as strings (divider.ts, html.ts, menu.ts,
 * social.ts) where @unlayer/exporters renders it with react-dom/server. Both run here, and must write the same HTML
 * byte for byte (or both throw): for every combination of the values that shape each block's HTML and thousands
 * more drawn by a seeded generator (parity-values.ts), and for each block Elements renders in the test corpus
 * (test-corpus.tsx: the stories, the codegen designs, the regression suite's user values) and with its defaults, as
 * a Page and as a Document, with the values Elements gives the exporter.
 *
 * It's also the alarm for the pin: when the catalog moves @unlayer/exporters to a release whose HTML for these
 * blocks differs, this test fails until the string versions write the new release's HTML (compare its compiled
 * DividerExporters, HtmlExporters, MenuExporters and SocialExporters with these files). *
 * Where they mean to differ: a `javascript:` URL (a link's, an icon's image), which the string versions write as
 * react-dom 19 writes it, a URL that throws, with any React; react-dom 18 writes it as given (see attributes.ts). So
 * the pinned exporters' HTML is compared with its `javascript:` URLs written so (`blockedUrls`).
 */
import { describe, expect, it, vi } from "vitest";
import { JSDOM, VirtualConsole } from "jsdom";
import { DividerExporters, HtmlExporters, MenuExporters, SocialExporters } from "@unlayer/exporters";
import { Column, Divider, Document, Html, Menu, Page, Row, Social, renderToHtml } from "../index";
import { divider } from "./divider";
import { html } from "./html";
import { menu } from "./menu";
import { social } from "./social";
import { dividerValues, htmlCases, menuValues, socialCases } from "./parity-values";
import { as, corpus } from "./test-corpus";
import { blockedUrls } from "../test-utils";

type Exporter = (...args: any[]) => string;

/** The arguments Elements calls each string exporter with, while a test renders templates. */
const { calls } = vi.hoisted(() => ({ calls: [] as { block: "divider" | "html" | "menu" | "social"; args: unknown[] }[] }));
vi.mock("./divider", async (actual) => {
  const own = await actual<{ divider: Exporter }>();
  return { divider: (...args: unknown[]) => (calls.push({ block: "divider", args }), own.divider(...args)) };
});
vi.mock("./html", async (actual) => {
  const own = await actual<{ html: Exporter }>();
  return { html: (...args: unknown[]) => (calls.push({ block: "html", args }), own.html(...args)) };
});
vi.mock("./menu", async (actual) => {
  const own = await actual<{ menu: Exporter }>();
  return { menu: (...args: unknown[]) => (calls.push({ block: "menu", args }), own.menu(...args)) };
});
vi.mock("./social", async (actual) => {
  const own = await actual<{ social: Exporter }>();
  return { social: (...args: unknown[]) => (calls.push({ block: "social", args }), own.social(...args)) };
});

/** The string versions. */
const OWN: Record<string, Exporter> = { divider, html, menu, social };

/** The upstream exporters each string version stands in for (Menu's and Social's web one renders documents too). */
const UPSTREAM: Record<string, [string, Exporter][]> = {
  divider: [["DividerExporters.web", DividerExporters.web as Exporter], ["DividerExporters.document", DividerExporters.document as Exporter]],
  html: [["HtmlExporters.web", HtmlExporters.web as Exporter], ["HtmlExporters.document", HtmlExporters.document as Exporter]],
  menu: [["MenuExporters.web", MenuExporters.web as Exporter]],
  social: [["SocialExporters.web", SocialExporters.web as Exporter]],
};

const run = (exporter: Exporter, args: unknown[]): { html?: string; threw?: true } => {
  try {
    return { html: exporter(...args) };
  } catch {
    return { threw: true };
  }
};

/** Where the string version and an upstream exporter write different HTML for the same arguments (one line each), and how many were compared. */
function compare(block: string, own: Exporter, cases: unknown[][]): { compared: number; differences: string[] } {
  const differences: string[] = [];
  let compared = 0;
  const error = vi.spyOn(console, "error").mockImplementation(() => {});
  try {
    for (const args of cases) {
      const mine = run(own, args);
      for (const [name, upstream] of UPSTREAM[block]) {
        const theirs = run(upstream, args);
        if (theirs.html !== undefined) theirs.html = blockedUrls(theirs.html);
        compared++;
        if (mine.threw && theirs.threw) continue;
        if (mine.html !== theirs.html) differences.push(`${name}(${describeArgs(args)}): ${theirs.threw ? "throws" : JSON.stringify(theirs.html)} but the string version ${mine.threw ? "throws" : `gives ${JSON.stringify(mine.html)}`}`);
      }
    }
  } finally {
    error.mockRestore();
  }
  return { compared, differences: differences.slice(0, 5) };
}

const describeArgs = (args: unknown[]) => {
  try {
    return JSON.stringify(args[0], (_, value) => (typeof value === "function" ? "[function]" : typeof value === "bigint" ? `${value}n` : value)).slice(0, 300);
  } catch {
    return String(args[0]);
  }
};

describe("for the values each block takes", () => {
  it.each([
    ["Divider", "divider", divider, () => dividerValues().map((values) => [values])],
    ["Html", "html", html, () => htmlCases().map(([values, meta]) => [values, 0, 0, [], {}, {}, undefined, meta])],
    ["Menu", "menu", menu, () => menuValues().map((values) => [values])],
    ["Social", "social", social, () => socialCases().map(([values, meta]) => [values, 0, 0, [], {}, {}, undefined, meta])],
  ] as const)("%s writes the pinned exporters' HTML", (_, block, own, cases) => {
    const { compared, differences } = compare(block, own as Exporter, cases());
    expect(differences).toEqual([]);
    expect(compared).toBeGreaterThan(150);
  });
});

describe("for the values Elements gives them", () => {
  /** The calls a render makes of each string exporter. */
  function rendered(render: () => void): Record<string, unknown[][]> {
    calls.length = 0;
    const quiet = [vi.spyOn(console, "warn").mockImplementation(() => {}), vi.spyOn(console, "error").mockImplementation(() => {})];
    try {
      render();
    } finally {
      for (const spy of quiet) spy.mockRestore();
    }
    const byBlock: Record<string, unknown[][]> = { divider: [], html: [], menu: [], social: [] };
    for (const { block, args } of calls) byBlock[block].push(args);
    return byBlock;
  }

  it("each block's defaults write the pinned exporters' HTML, on a page and in a document", () => {
    const template = <Row><Column><Divider /><Html /><Menu /><Social /></Column></Row>;
    const byBlock = rendered(() => {
      renderToHtml(<Page>{template}</Page>);
      renderToHtml(<Document>{template}</Document>);
    });
    for (const [block, cases] of Object.entries(byBlock)) {
      expect(cases.length, block).toBe(2);
      expect(compare(block, OWN[block], cases).differences).toEqual([]);
    }
  });

  it("every block of the stories, codegen designs and regression values writes the pinned exporters' HTML", () => {
    const templates = corpus();
    const byBlock = rendered(() => {
      for (const { element, options } of templates)
        for (const Root of [Page, Document]) {
          try {
            renderToHtml(as(element, Root), options as never);
          } catch {
            // (A story that doesn't render as a page has no blocks to compare.)
          }
        }
    });
    for (const [block, cases] of Object.entries(byBlock)) {
      expect(cases.length, block).toBeGreaterThan(40);
      expect(compare(block, OWN[block], cases).differences).toEqual([]);
    }
  });
});

describe("a `javascript:` URL", () => {
  const BLOCKED = "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')";
  it("is written as react-dom 19 writes it where the pinned exporters' react-dom is 18 (the values above have them)", () => {
    const values = { menu: { items: [{ key: "1", text: "Go", link: { url: "javascript:alert(1)", target: "_self" } }] } };
    expect(menu(values)).toBe(blockedUrls(MenuExporters.web(values as never) as string));
    expect(menu(values)).toContain("javascript:throw new Error(&#x27;React has blocked");
  });

  // However it's written: React 19's test (C0 controls and spaces before it, tabs and line breaks in it, any case), in
  // a list (written as its text), and given in a link's attributes.
  const URLS: unknown[] = ["javascript:globalThis.__probe=1", " \u0001JavaScript:globalThis.__probe=1", "java\tscr\nipt:globalThis.__probe=1", ["javascript:globalThis.__probe=1"]];

  /** The page's first link, clicked: its href, and whether the URL ran. */
  async function click(html: string): Promise<{ href: string | null; ran: boolean }> {
    const dom = new JSDOM(html, { url: "https://example.test/", runScripts: "dangerously", virtualConsole: new VirtualConsole() });
    try {
      const link = dom.window.document.querySelector("a")!;
      link.click();
      await new Promise((resolve) => setTimeout(resolve, 15));
      return { href: link.getAttribute("href"), ran: (dom.window as unknown as { __probe?: number }).__probe === 1 };
    } finally {
      dom.window.close();
    }
  }

  it("runs when a link holds one (the check below can see one run)", async () => {
    expect(await click('<a href="javascript:globalThis.__probe=1" target="_self">Go</a>')).toEqual({ href: "javascript:globalThis.__probe=1", ran: true });
  });

  it.each([
    ["a web page", Page],
    ["a document", Document],
  ] as const)("is written as one that throws, as react-dom 19 writes it, in a Menu's and a Social's links on %s, with any React", async (_, Root) => {
    for (const url of URLS) {
      const blocks = {
        Menu: <Menu items={[{ text: "Go", href: url as string, target: "_self" }]} />,
        Social: <Social icons={[{ name: "Facebook", url: url as string }]} />,
        "Menu's link attributes": <Menu values={{ menu: { items: [{ key: "1", text: "Go", link: { name: "web", values: { href: "", target: "_self" }, attrs: { href: url } } }] } } as never} />,
      };
      for (const [name, block] of Object.entries(blocks)) expect([name, url, await click(renderToHtml(<Root><Row><Column>{block}</Column></Row></Root>))]).toEqual([name, url, { href: BLOCKED, ran: false }]);
    }
  });

  it("is written so as an icon's image too, and as a block's link however it's written", () => {
    const html = (root: React.ReactElement) => new JSDOM(renderToHtml(root)).window.document;
    // A block's link written with a character reference: the editor's exporters write it as it is in an email (where a
    // browser decodes it) and the design holds it so, so it's the URL that throws in every mode.
    const page = html(<Page><Row><Column><Social icons={{ iconType: "circle", icons: [{ name: "Facebook", url: "&#106;avascript:x", imgUrl: "javascript:x" }] } as never} /></Column></Row></Page>);
    expect(page.querySelector("img")!.getAttribute("src")).toBe(BLOCKED);
    expect(page.querySelector("a")!.getAttribute("href")).toBe(BLOCKED);
    // (Markup React writes escapes its `&`, so a reference in it stays text: see text-children.test.tsx.)
  });
});
