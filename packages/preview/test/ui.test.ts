import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Browser, Page } from "puppeteer-core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { findBrowser } from "../src/server/browser";
import { startDevServer, type DevServer } from "../src/server/dev-server";
import { fixtureCopy } from "./helpers";

/**
 * The preview app in a browser, against the dev server: what only shows in
 * the page. They need the built app (the package's build) and a browser on
 * this machine (or CHROME_PATH); without either, they skip.
 */

const UI = fileURLToPath(new URL("../dist/ui/", import.meta.url));

function installedBrowser(): string | undefined {
  try {
    return findBrowser(undefined).path;
  } catch {
    return undefined;
  }
}

const browserPath = installedBrowser();
const runnable = Boolean(browserPath) && existsSync(path.join(UI, "index.html"));

// A template whose data takes a while: long enough to look at the page while it renders, on a slow machine too.
const SLOW = `import { Email, Row, Column, Heading, Paragraph } from "@unlayer/react-elements";

async function Data() {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  return <Paragraph>Slow data arrived</Paragraph>;
}

export default function Slow() {
  return <Email><Row><Column><Heading>Slow</Heading><Data /></Column></Row></Email>;
}
`;

// A slow CI runner takes many times longer than a laptop.
const WAIT = { timeout: 30_000 };

let fixture: Awaited<ReturnType<typeof fixtureCopy>>;
let server: DevServer;
let browser: Browser;
let page: Page;

beforeAll(async () => {
  if (!runnable) return;
  fixture = await fixtureCopy("ui");
  await writeFile(path.join(fixture.emails, "slow.tsx"), SLOW);
  server = await startDevServer({ dir: fixture.emails, port: 0, uiDir: UI });
  const { default: puppeteer } = await import("puppeteer-core");
  browser = await puppeteer.launch({ executablePath: browserPath, headless: true, args: process.getuid?.() === 0 ? ["--no-sandbox"] : [] });
  page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
}, 120_000);

afterAll(async () => {
  await browser?.close();
  await server?.close();
  await fixture?.cleanup();
});

/** The Code view's state: the template named, what's shown, and whether it can be copied and downloaded. */
function codeState() {
  return page.evaluate(() => {
    const text = document.querySelector(".code-text")?.textContent ?? "";
    const button = (label: string) => document.querySelector<HTMLButtonElement>(`.code-bar button[aria-label="${label}"]`);
    return {
      title: document.querySelector(".title-name")?.textContent,
      text,
      copy: button("Copy") ? !button("Copy")!.disabled : false,
      download: button("Download") ? !button("Download")!.disabled : false,
      copyForAi: !document.querySelector<HTMLButtonElement>(".copy-ai")?.disabled,
    };
  });
}

describe.skipIf(!runnable)("preview app", () => {
  it("shows and hands out only the selected template's render, also while a slow one renders", async () => {
    await page.goto(`${server.url}/preview/welcome.tsx`);
    await page.click('button[aria-label="Code"]');
    await (await page.waitForSelector('.code-bar [role="tab"]:nth-child(2)', WAIT))!.click();
    await page.waitForFunction(() => document.querySelector(".code-text")?.textContent?.includes("Welcome, Ada"), WAIT);
    expect(await codeState()).toMatchObject({ title: "welcome", copy: true, download: true, copyForAi: true });

    await page.click('button[title="slow.tsx"]');
    await page.waitForFunction(() => document.querySelector(".title-name")?.textContent === "slow", WAIT);
    // Until slow.tsx's render comes, nothing of welcome.tsx's is shown or handed out under slow's name.
    const rendering = await codeState();
    expect(rendering.text).not.toContain("Welcome, Ada");
    expect(rendering).toMatchObject({ copy: false, download: false, copyForAi: false });

    await page.waitForFunction(() => document.querySelector(".code-text")?.textContent?.includes("Slow data arrived"), WAIT);
    expect(await codeState()).toMatchObject({ title: "slow", copy: true, download: true, copyForAi: true });
  }, 120_000);
});
