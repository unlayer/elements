import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { findBrowser } from "../src/server/browser";
import { takeScreenshots } from "../src/server/screenshot";
import { fixtureCopy } from "./helpers";

/** A browser on this machine (or CHROME_PATH), or none: the tests below then skip. */
function installedBrowser(): string | undefined {
  try {
    return findBrowser(undefined).path;
  } catch {
    return undefined;
  }
}

const browser = installedBrowser();

/** A 1×1 PNG. */
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");

function pngSize(png: Buffer): { width: number; height: number } {
  expect(png.subarray(1, 4).toString("latin1")).toBe("PNG");
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
}

let fixture: Awaited<ReturnType<typeof fixtureCopy>>;

beforeAll(async () => {
  fixture = await fixtureCopy("screenshot");
  // The fixture's logo isn't a real image: one that loads, and a template whose image doesn't.
  await writeFile(path.join(fixture.emails, "static", "logo.png"), PNG);
  await writeFile(
    path.join(fixture.emails, "missing-image.tsx"),
    `import { Email, Row, Column, Image } from "@unlayer/react-elements";
export default function MissingImage() {
  return <Email><Row><Column><Image src="/static/missing.png" alt="Missing" /></Column></Row></Email>;
}
`
  );
  await writeFile(
    path.join(fixture.emails, "invoice.tsx"),
    `import { Document, Row, Column, Heading } from "@unlayer/react-elements";
export default function Invoice() {
  return <Document documentSize="Letter" documentOrientation="landscape"><Row><Column><Heading>Invoice</Heading></Column></Row></Document>;
}
`
  );
});

afterAll(async () => {
  await fixture?.cleanup();
});

describe.skipIf(!browser)(`screenshots with ${browser ?? "no browser (skipped)"}`, () => {
  it("takes desktop, phone and dark mode, full length, with /static/ images", async () => {
    const outDir = path.join(fixture.root, "shots");
    const written: string[] = [];
    const result = await takeScreenshots({
      dir: fixture.emails,
      templates: ["welcome.tsx"],
      outDir,
      variants: ["desktop", "phone", "dark"],
      onScreenshot: (_, screenshot) => written.push(screenshot.variant),
    });
    expect(result.failed).toBe(0);
    const [welcome] = result.templates;
    expect(welcome).toMatchObject({ path: "welcome.tsx", ok: true, mode: "email", warnings: [] });
    expect(written).toEqual(["desktop", "phone", "dark"]);
    const files = Object.fromEntries(welcome.screenshots.map((s) => [s.variant, path.resolve(s.file)]));
    expect(files.desktop).toBe(path.join(outDir, "welcome.desktop.png"));
    const [desktop, phone, dark] = await Promise.all([readFile(files.desktop), readFile(files.phone), readFile(files.dark)]);
    expect(pngSize(desktop)).toEqual({ width: 680, height: welcome.screenshots[0].height });
    expect(pngSize(desktop).height).toBeGreaterThanOrEqual(900);
    expect(pngSize(phone).width).toBe(375);
    expect(pngSize(dark).width).toBe(680);
    // The dark one has the preview's dark colors.
    expect(dark.equals(desktop)).toBe(false);
  });

  it("takes a Document at its page width and a page at desktop width, and says when an image doesn't load", async () => {
    const outDir = path.join(fixture.root, "shots-2");
    const result = await takeScreenshots({ dir: fixture.emails, templates: ["invoice.tsx", "landing.tsx", "missing-image"], outDir });
    expect(result.templates.map((t) => [t.path, t.mode, t.screenshots.map((s) => s.width)])).toEqual([
      ["invoice.tsx", "document", [1056]],
      ["landing.tsx", "web", [680]],
      ["missing-image.tsx", "email", [680]],
    ]);
    expect(result.templates[2].warnings).toEqual(["The image /static/missing.png didn't load: the screenshot shows it broken."]);
    expect(existsSync(path.join(outDir, "invoice.desktop.png"))).toBe(true);
  });

  it("reports a template that doesn't render and takes the others", async () => {
    await writeFile(path.join(fixture.emails, "broken.tsx"), "export default function Broken() { return <Email>; }\n");
    const result = await takeScreenshots({ dir: fixture.emails, templates: ["broken.tsx", "plain.js"], outDir: path.join(fixture.root, "shots-3"), width: 600 });
    expect(result.failed).toBe(1);
    expect(result.templates[0]).toMatchObject({ path: "broken.tsx", ok: false, screenshots: [] });
    expect(result.templates[0].error?.line).toBe(1);
    expect(result.templates[1].screenshots.map((s) => s.width)).toEqual([600]);
  });
});

describe("screenshots without what they need", () => {
  it("refuses a browser that isn't there, and no templates", async () => {
    await expect(takeScreenshots({ dir: fixture.emails, templates: ["welcome.tsx"], browser: "/nowhere/chrome" })).rejects.toThrow(/There's no browser at \/nowhere\/chrome/);
    await expect(takeScreenshots({ dir: fixture.emails, templates: [] })).rejects.toThrow(/Name the templates/);
  });
});
