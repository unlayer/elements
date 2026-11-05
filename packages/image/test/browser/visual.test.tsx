/**
 * An image drawn as Chromium draws the Canvas's HTML: the same template, with the same font file (the Canvas's own,
 * as a data: URI, which the HTML loads with @font-face and the image reads), rendered both ways and compared pixel by
 * pixel. A pixel counts as different only where no pixel within one of it on the other side has its color, and only a
 * handful may (the edges of letters, which two rasterizers smooth differently).
 *
 * Chromium smooths text in grey and leaves glyphs where the font puts them, as the image does: on Linux it otherwise
 * colors letters' edges (LCD text) and snaps them to whole pixels (hinting), and nearly 3% of this test's pixels differ.
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { chromium } from "playwright";
import type { ReactElement } from "react";
import { Canvas, Circle, Column, Heading, Rect, render, Row, Svg, Text } from "@unlayer/react-elements";
import { renderImage } from "../../src";

const FONT = readFileSync(join(dirname(createRequire(import.meta.url).resolve("pdfjs-dist/package.json")), "standard_fonts", "LiberationSans-Regular.ttf"));
const fonts = [{ family: "Liberation", src: `data:font/ttf;base64,${FONT.toString("base64")}` }];

/** Each image's pixels, Chromium's and the image's, decoded in Chromium; and how many differ. */
async function compare(template: ReactElement): Promise<{ differ: number; total: number; size: number[] }> {
  const { html } = await render(template);
  const { image, width, height } = await renderImage(template);
  const browser = await chromium.launch({ args: ["--disable-lcd-text", "--font-render-hinting=none"] });
  try {
    const page = await browser.newPage({ viewport: { width, height } });
    await page.setContent(html);
    await page.evaluate(() => document.fonts.ready);
    const shot = (await page.screenshot({ clip: { x: 0, y: 0, width, height } })).toString("base64");
    return await page.evaluate(
      async ([a, b]) => {
        const load = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => Object.assign(new Image(), { onload() { resolve(this as unknown as HTMLImageElement); }, onerror: reject, src }));
        const pixels = (img: HTMLImageElement) => {
          const canvas = Object.assign(document.createElement("canvas"), { width: img.width, height: img.height });
          const context = canvas.getContext("2d")!;
          context.drawImage(img, 0, 0);
          return context.getImageData(0, 0, img.width, img.height);
        };
        const [p, q] = (await Promise.all([load(`data:image/png;base64,${a}`), load(`data:image/png;base64,${b}`)])).map(pixels);
        const same = (i: number, j: number) => Math.abs(p.data[i] - q.data[j]) <= 24 && Math.abs(p.data[i + 1] - q.data[j + 1]) <= 24 && Math.abs(p.data[i + 2] - q.data[j + 2]) <= 24;
        let differ = 0;
        for (let y = 0; y < p.height; y++)
          for (let x = 0; x < p.width; x++) {
            const i = (y * p.width + x) * 4;
            let near = false;
            for (let dy = -1; dy <= 1 && !near; dy++)
              for (let dx = -1; dx <= 1 && !near; dx++) {
                const nx = x + dx;
                const ny = y + dy;
                near = nx >= 0 && ny >= 0 && nx < q.width && ny < q.height && same(i, (ny * q.width + nx) * 4);
              }
            if (!near) differ++;
          }
        return { differ, total: p.width * p.height, size: [q.width, q.height] };
      },
      [shot, Buffer.from(image).toString("base64")]
    );
  } finally {
    await browser.close();
  }
}

describe("an image and the Canvas's HTML in Chromium", () => {
  it("draw the same boxes and shapes", async () => {
    const result = await compare(
      <Canvas width={400} height={240} style={{ backgroundColor: "#f1f5f9", padding: 24, gap: 16 }}>
        <Row style={{ gap: 16 }}>
          <Column style={{ backgroundColor: "#6366f1", height: 80, borderRadius: 12 }} />
          <Column style={{ width: 120, backgroundColor: "#0ea5e9", height: 80 }} />
        </Row>
        <Svg width={160} height={80} title="Shapes">
          <Rect width={160} height={80} rx={10} style={{ fill: "#1e293b" }} />
          <Circle cx={40} cy={40} r={24} style={{ fill: "#f59e0b" }} />
          <Rect x={80} y={20} width={60} height={40} style={{ fill: "transparent", stroke: "#ffffff", strokeWidth: 4 }} />
        </Svg>
      </Canvas>
    );
    expect(result.size).toEqual([400, 240]);
    // The edges of rounded corners and circles, which two rasterizers smooth differently. A box a pixel off is hundreds.
    expect(result.differ, `${result.differ} of ${result.total} pixels differ`).toBeLessThanOrEqual(48);
  });

  it("draw the same text, in the same font, in the same place", async () => {
    const result = await compare(
      <Canvas width={480} height={200} fonts={fonts} style={{ backgroundColor: "#0f172a", padding: 32, gap: 12, color: "#ffffff", fontFamily: "Liberation" }}>
        <Heading level={1} style={{ fontSize: 36, lineHeight: 1.2, fontWeight: 400 }}>
          Launch week
        </Heading>
        <Text style={{ fontSize: 18, color: "#cbd5e1", lineHeight: 1.4 }}>Five days of new things, one a day.</Text>
      </Canvas>
    );
    // Letters' edges: the two rasterizers smooth them differently. Moved or missing text is thousands.
    expect(result.differ / result.total, `${result.differ} of ${result.total} pixels differ`).toBeLessThan(0.01);
  });
});
