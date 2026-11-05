/**
 * What an email or a page shows can be read: templates put together at random (the react package's
 * testing/templates.ts), each word in Chromium in a text size above 0, displayed and taking room, on desktop and
 * on a phone. A word in the HTML that no one can see (a Row's 0px cell around a link, a box hidden by mistake)
 * fails here, where a check of the HTML's text can't see it.
 *
 *   VISIBLE_SEEDS=300 pnpm vitest run --config vitest.browser.config.ts test/browser/visible.test.ts
 */
import { chromium, type Browser } from "playwright";
import { renderTemplate } from "../../src/writers";
import { generate, words, type Root } from "../../../react/src/primitives/testing/templates";

const SEEDS = Number(process.env.VISIBLE_SEEDS ?? 40);

let browser: Browser;
beforeAll(async () => {
  browser = await chromium.launch();
});
afterAll(async () => browser?.close());

describe.each(["Email", "Page"] as Root[])("%s", (root) => {
  it(`shows every word readably, on desktop and on a phone (${SEEDS} templates)`, async () => {
    const page = await browser.newPage();
    // Nothing is fetched (images, a video's player): what's checked is the HTML as written.
    await page.route("**/*", (route) => route.abort());
    const failures: string[] = [];
    for (let seed = 1; seed <= SEEDS; seed++) {
      const tree = generate(seed, root);
      const { html } = renderTemplate({ root: tree });
      const expected = words(tree, { players: root === "Page" }).content;
      for (const width of [700, 375]) {
        await page.setViewportSize({ width, height: 900 });
        await page.setContent(html);
        const unreadable = await page.evaluate((expected: string[]) => {
          const out: string[] = [];
          const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
          const seen = new Set<string>();
          for (let text = walker.nextNode(); text; text = walker.nextNode()) {
            const element = text.parentElement!;
            for (const word of expected) {
              if (!text.textContent!.toLowerCase().includes(word)) continue;
              const style = getComputedStyle(element);
              const range = document.createRange();
              range.selectNodeContents(text);
              const box = range.getBoundingClientRect();
              if (parseFloat(style.fontSize) > 0 && style.visibility !== "hidden" && box.width > 0 && box.height > 0) seen.add(word);
            }
          }
          for (const word of expected) if (!seen.has(word)) out.push(word);
          return out;
        }, expected);
        if (unreadable.length) failures.push(`seed ${seed} at ${width}px: ${unreadable.join(", ")} can't be read\n  ${JSON.stringify(tree)}`);
      }
    }
    await page.close();
    expect(failures.slice(0, 5)).toEqual([]);
  }, 120_000);
});
