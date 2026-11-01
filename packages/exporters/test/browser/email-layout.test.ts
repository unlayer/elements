/**
 * The email in Chromium: every box as wide as the resolver worked out on
 * desktop, with the stylesheet and without it (Gmail drops `<style>` for some
 * accounts: the email must be right without it), and Rows stacked on phones,
 * by the stylesheet and, without it, by the fluid-hybrid columns alone.
 */
import { chromium, type Browser, type Page } from "playwright";
import { resolveDocument, type ResolvedNode } from "@unlayer-internal/elements-core";
import { renderEmail } from "../../src";
import { template } from "./fixture";

const resolved = resolveDocument(template("Email"));
const { html, diagnostics } = renderEmail(resolved);

let browser: Browser;
let page: Page;

beforeAll(async () => {
  browser = await chromium.launch();
  page = await browser.newPage();
});
afterAll(async () => browser?.close());

type Box = { width: number; left: number; top: number; shown: boolean };

async function boxes(viewport: number, { style = true } = {}): Promise<Record<string, Box>> {
  await page.setViewportSize({ width: viewport, height: 900 });
  await page.setContent(html);
  if (!style) await page.evaluate(() => document.querySelectorAll("style").forEach((element) => element.remove()));
  return page.evaluate(() =>
    Object.fromEntries(
      [...document.querySelectorAll("[id]")].map((element) => {
        const box = element.getBoundingClientRect();
        return [element.id, { width: box.width, left: box.left, top: box.top, shown: box.width > 0 && box.height >= 0 && (element as HTMLElement).offsetParent !== null }];
      })
    )
  );
}

function sized(node: ResolvedNode, into: ResolvedNode[] = []): ResolvedNode[] {
  if (node.width !== null && node.type !== "Email" && node.type !== "Section" && node.id) into.push(node);
  for (const child of node.children) if (typeof child !== "string") sized(child, into);
  return into;
}

describe("email layout in Chromium", () => {
  it("renders with no warnings for this template", () => {
    expect(diagnostics.filter((d) => d.severity !== "info")).toEqual([]);
  });

  for (const style of [true, false]) {
    it(`gives every box the width the resolver worked out, on desktop${style ? "" : ", without the stylesheet"}`, async () => {
      const measured = await boxes(1280, { style });
      const expected = sized(resolved.root);
      expect(expected.length).toBeGreaterThan(10);
      for (const node of expected) expect([node.id, Math.round(measured[node.id!].width)]).toEqual([node.id, node.width]);
      // A Section spans the window.
      expect(measured.section_1.width).toBe(1280);
    });
  }

  it("stacks Rows full-width and hides what's hidden, on phones", async () => {
    const measured = await boxes(375);
    expect(measured["desktop-only"].shown).toBe(false);
    // The Row's content: 375 less its 10px padding each side; its children one under another.
    for (const id of ["column_1", "column_2"]) expect(Math.round(measured[id].width)).toBe(355);
    expect(measured.column_2.top).toBeGreaterThan(measured.column_1.top);
    expect(measured.row_1.width).toBe(375);
  });

  it("still stacks without the stylesheet: the columns wrap where they don't fit, inside the screen", async () => {
    const measured = await boxes(375, { style: false });
    expect(measured.column_2.top).toBeGreaterThan(measured.column_1.top);
    for (const [id, box] of Object.entries(measured)) {
      if (id === "section_1") continue;
      expect([id, box.left + box.width <= 375.5]).toEqual([id, true]);
    }
  });

  it("shows the hidden-on-phones column on desktop, beside the others", async () => {
    const measured = await boxes(1280);
    expect(measured["desktop-only"].shown).toBe(true);
    expect(measured["desktop-only"].top).toBe(measured.column_1.top);
  });
});
