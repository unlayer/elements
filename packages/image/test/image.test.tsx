/**
 * Images written from a Canvas: their size, the same bytes for the same template, and what's needed and not fetched
 * (a font always, an image's file).
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { Canvas, Circle, Column, Email, Heading, Image, Rect, Svg, Text } from "@unlayer/react-elements/primitives";
import { renderImage } from "../src";

/** Liberation Sans (Arial's metrics, SIL OFL), as pdf.js ships it. */
const FONT = readFileSync(join(dirname(createRequire(import.meta.url).resolve("pdfjs-dist/package.json")), "standard_fonts", "LiberationSans-Regular.ttf"));
const fonts = [{ family: "Liberation Sans", src: FONT }];

/** A 1×1 PNG. */
const PNG = Uint8Array.from(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64"));

/** A PNG's size, from its IHDR chunk. */
const size = (png: Uint8Array) => [Buffer.from(png).readUInt32BE(16), Buffer.from(png).readUInt32BE(20)];

const card = (
  <Canvas width={600} height={315} style={{ backgroundColor: "#0f172a", padding: 40, gap: 16, color: "#ffffff", fontFamily: "Liberation Sans, sans-serif" }}>
    <Heading level={1} style={{ fontSize: 40 }}>
      Launch week
    </Heading>
    <Text style={{ fontSize: 18, color: "#cbd5e1" }}>Five days of new things, one a day.</Text>
    <Svg width={120} height={60} title="Logo">
      <Rect width={120} height={60} rx={8} style={{ fill: "#6366f1" }} />
      <Circle cx={30} cy={30} r={20} style={{ fill: "transparent", stroke: "#ffffff", strokeWidth: 4 }} />
    </Svg>
  </Canvas>
);

describe("renderImage", () => {
  it("writes a PNG of the Canvas's size, sharper at a scale", async () => {
    const { image, width, height, diagnostics } = await renderImage(card, { fonts });
    expect(Buffer.from(image.subarray(1, 4)).toString()).toBe("PNG");
    expect([width, height]).toEqual([600, 315]);
    expect(size(image)).toEqual([600, 315]);
    // The Heading is bold (its default), and only the regular file is given.
    expect(diagnostics.map((d) => [d.code, d.path, d.message])).toEqual([
      ["image/font-weight", "root.children[0]", "Text in Liberation Sans at 700, which is given at 400 only: it's drawn in the nearest. Give that file in renderImage's fonts option"],
    ]);
    expect(size((await renderImage(card, { fonts, scale: 2 })).image)).toEqual([1200, 630]);
  });

  it("writes an SVG, its text as paths (no font needed to show it)", async () => {
    const svg = new TextDecoder().decode((await renderImage(card, { fonts, format: "svg" })).image);
    expect(svg).toMatch(/^<svg width="600" height="315" viewBox="0 0 600 315"/);
    expect(svg).not.toContain("<text");
    expect(svg).toContain("6366f1");
  });

  it("writes the same file for the same template", async () => {
    const [a, b] = await Promise.all([renderImage(card, { fonts }), renderImage(card, { fonts })]);
    expect(Buffer.from(a.image).equals(Buffer.from(b.image))).toBe(true);
  });

  it("takes the Canvas's own fonts given as data: URIs", async () => {
    const own = (
      <Canvas width={200} height={100} fonts={[{ family: "Liberation Sans", src: `data:font/ttf;base64,${FONT.toString("base64")}` }]} style={{ fontFamily: "Liberation Sans" }}>
        <Text>Hi</Text>
      </Canvas>
    );
    expect((await renderImage(own)).diagnostics).toEqual([]);
  });

  it("needs a font, and fetches nothing: an image it isn't given is an error; given by its URL, it's drawn", async () => {
    await expect(renderImage(card)).rejects.toMatchObject({ diagnostics: [expect.objectContaining({ code: "image/font", path: "root" })] });
    const photo = (
      <Canvas width={200} height={100}>
        <Image src={{ src: "https://cdn.acme.test/photo.png", width: 100, height: 50 }} alt="Photo" />
      </Canvas>
    );
    await expect(renderImage(photo, { fonts })).rejects.toMatchObject({ diagnostics: [expect.objectContaining({ code: "image/image", path: "root.children[0].props.src" })] });
    expect(size((await renderImage(photo, { fonts, images: { "https://cdn.acme.test/photo.png": PNG } })).image)).toEqual([200, 100]);
  });

  it("writes a Canvas only", async () => {
    await expect(
      renderImage(
        <Email>
          <Column>
            <Text>Hi</Text>
          </Column>
        </Email>,
        { fonts }
      )
    ).rejects.toMatchObject({ diagnostics: [expect.objectContaining({ code: "image/root" })] });
  });
});
