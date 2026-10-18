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
 * DividerExporters, HtmlExporters, MenuExporters and SocialExporters with these files).
 */
import { describe, expect, it, vi } from "vitest";
import { DividerExporters, HtmlExporters, MenuExporters, SocialExporters } from "@unlayer/exporters";
import { Column, Divider, Document, Html, Menu, Page, Row, Social, renderToHtml } from "../index";
import { divider } from "./divider";
import { html } from "./html";
import { menu } from "./menu";
import { social } from "./social";
import { dividerValues, htmlCases, menuValues, socialCases } from "./parity-values";
import { as, corpus } from "./test-corpus";

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
