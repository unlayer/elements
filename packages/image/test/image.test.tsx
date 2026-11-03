/**
 * Images written from a Canvas: their size, the same bytes for the same template, and what's needed and not fetched
 * (a font always, an image's file).
 */
import { readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { COMPONENTS, LAYOUT_VERSION } from "@unlayer-internal/elements-core";
import {
  Button,
  Canvas,
  Circle,
  Column,
  Divider,
  Email,
  Grid,
  Heading,
  Image,
  Layer,
  Link,
  List,
  ListItem,
  Menu,
  Paragraph,
  prepare,
  Rect,
  Row,
  Section,
  Social,
  Svg,
  Table,
  TableCell,
  TableRow,
  Text,
  validate,
  Video,
} from "@unlayer/react-elements/primitives";
import type { ReactElement, ReactNode } from "react";
import { renderImage } from "../src";
import { writeCanvas } from "../src/write";

/** What prepare() gives, where a test gives another layout version (the Elements installed newer or older than this package). */
const other = vi.hoisted(() => ({ prepared: undefined as { layout?: number } | undefined }));
vi.mock("@unlayer/react-elements/primitives", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@unlayer/react-elements/primitives")>();
  return {
    ...actual,
    prepare: (element: ReactElement) => {
      if (!other.prepared) return actual.prepare(element);
      const { layout: _, ...prepared } = actual.prepare(element);
      return { ...prepared, ...other.prepared };
    },
  };
});

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

  it("says a font file that's WOFF2 isn't drawn (an image draws TTF, OTF and WOFF), given or the Canvas's own", async () => {
    const woff2 = Uint8Array.from([0x77, 0x4f, 0x46, 0x32, 0, 1, 0, 0]);
    const own = (
      <Canvas width={200} height={100} fonts={[{ family: "Packed", src: `data:font/woff2;base64,${Buffer.from(woff2).toString("base64")}` }]} style={{ fontFamily: "Liberation Sans" }}>
        <Text>Hi</Text>
      </Canvas>
    );
    const { diagnostics } = await renderImage(own, { fonts: [...fonts, { family: "Other", src: woff2 }] });
    expect(diagnostics.filter((d) => d.message.includes("WOFF2")).map((d) => [d.code, d.message.split(":")[0]])).toEqual([
      ["image/font", "Other's file is WOFF2"],
      ["image/font", "Packed's file is WOFF2"],
    ]);
  });

  it("says what an image can't show that its HTML can (a hover, a Video), and content that can't fit the Canvas (and validate() says both)", async () => {
    const template = (
      <Canvas width={300} height={120} style={{ fontFamily: "Liberation Sans", gap: 8 }}>
        <Button href="https://x.test" hover={{ backgroundColor: "#333333" }}>
          Go
        </Button>
        <Video src="https://vimeo.com/76979871" title="Our launch" />
        {Array.from({ length: 12 }, (_, i) => (
          <Text key={i}>Line {i + 1} of more than a 120px Canvas can hold</Text>
        ))}
      </Canvas>
    );
    const said = (diagnostics: Array<{ code: string; message: string }>) => diagnostics.filter((d) => /^(image|canvas)\//.test(d.code) && d.code !== "image/font").map((d) => [d.code, d.message.split(":")[0].split(" (")[0]]);
    const expected = [
      ["canvas/overflow", "The Canvas's content looks about"],
      ["image/unsupported", "A hover isn't possible in an image"],
      ["image/unsupported", "A Video isn't possible in an image"],
    ];
    const tidy = (list: string[][]) => list.map(([code, message]) => [code, message.replace(/ \d+%.*/, "")]).sort();
    expect(tidy(said((await renderImage(template, { fonts })).diagnostics))).toEqual(tidy(expected));
    expect(tidy(said(validate(template).diagnostics))).toEqual(tidy(expected));
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

  it("reads the tree prepare() lays out at the layout version it's built for, and refuses another (Elements newer or older)", async () => {
    const template = (
      <Canvas width={200} height={100} style={{ fontFamily: "Liberation Sans" }}>
        <Text>Hi</Text>
      </Canvas>
    );
    expect(prepare(template).layout).toBe(LAYOUT_VERSION);
    await expect(renderImage(template, { fonts })).resolves.toMatchObject({ diagnostics: [] });
    const refused = async (prepared: { layout?: number }, message: string) => {
      other.prepared = prepared;
      try {
        await expect(renderImage(template, { fonts })).rejects.toMatchObject({ diagnostics: [{ code: "image/version", severity: "error", path: "root", message }] });
      } finally {
        other.prepared = undefined;
      }
    };
    const reads = `@unlayer/elements-image reads layout version ${LAYOUT_VERSION}; this @unlayer/react-elements writes`;
    await refused({ layout: LAYOUT_VERSION + 1 }, `${reads} ${LAYOUT_VERSION + 1}: update @unlayer/elements-image`);
    await refused({ layout: LAYOUT_VERSION - 1 }, `${reads} ${LAYOUT_VERSION - 1}: update @unlayer/react-elements`);
    await refused({}, `${reads} none: update @unlayer/react-elements`);
  });

  it("depends on its engine in one file: the writer builds a canvas as plain data, which Satori's and resvg's adapter draws", () => {
    const src = join(dirname(fileURLToPath(import.meta.url)), "../src");
    const importing = readdirSync(src).filter((file) => /from "(satori|@resvg\/)/.test(readFileSync(join(src, file), "utf8")));
    expect(importing).toEqual(["satori.ts"]);
    // What the writer builds is data: the same after a round trip through JSON.
    const { root } = prepare(card);
    const canvas = writeCanvas(root!, { families: new Set(["liberation sans"]), fallback: "Liberation Sans", fonts: [], image: (src) => src });
    expect(JSON.parse(JSON.stringify(canvas))).toEqual(canvas);
    expect([canvas.width, canvas.height, canvas.children.length]).toEqual([600, 315, 3]);
  });

  describe("every block a Canvas takes", () => {
    /** A sample of each, with the words it draws. */
    const SAMPLES: Record<string, [ReactElement, string]> = {
      Section: [<Section key="s"><Text>In a section</Text></Section>, "In a section"],
      Row: [<Row key="r"><Column><Text>In a row</Text></Column></Row>, "In a row"],
      Column: [<Column key="c"><Text>In a column</Text></Column>, "In a column"],
      Grid: [<Grid key="g" columns={2}><Text>Left</Text><Text>Right</Text></Grid>, "LeftRight"],
      Layer: [<Layer key="l"><Text>Under</Text><Text>Over</Text></Layer>, "UnderOver"],
      Text: [<Text key="t">A text</Text>, "A text"],
      Paragraph: [<Paragraph key="p">A paragraph</Paragraph>, "A paragraph"],
      Heading: [<Heading key="h">A heading</Heading>, "A heading"],
      Link: [<Link key="a" href="https://acme.test">A link</Link>, "A link"],
      Button: [<Button key="b" href="https://acme.test">A button</Button>, "A button"],
      Image: [<Image key="i" src={{ src: `data:image/png;base64,${Buffer.from(PNG).toString("base64")}`, width: 1, height: 1 }} alt="" />, ""],
      Divider: [<Divider key="d" />, ""],
      List: [
        <List key="ul" type="number">
          <ListItem>First</ListItem>
          <ListItem>
            Second
            <List>
              <ListItem>Inside</ListItem>
            </List>
            After
          </ListItem>
        </List>,
        "1.First2.Second•InsideAfter",
      ],
      Table: [
        <Table key="tb">
          <TableRow header style={{ backgroundColor: "#ff0000" }}>
            <TableCell>Plan</TableCell>
            <TableCell>Price</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Pro</TableCell>
            <TableCell>$20</TableCell>
          </TableRow>
        </Table>,
        "PlanPricePro$20",
      ],
      Video: [<Video key="v" src="https://vimeo.com/76979871" title="Our launch" />, "Our launch"],
      Svg: [<Svg key="svg" width={10} height={10}><Rect width={10} height={10} /></Svg>, ""],
      Social: [<Social key="so" icons={[{ name: "x", href: "https://x.com/acme" }]} />, ""],
      Menu: [<Menu key="m" items={[{ text: "Home", href: "/" }, { text: "Blog", href: "/blog" }]} separator="|" />, "Home|Blog"],
    };
    const words = (item: unknown): string => {
      if (typeof item === "string") return item;
      if (Array.isArray(item)) return item.map(words).join("");
      if (!item || typeof item !== "object") return "";
      const { runs, children } = item as Record<string, unknown>;
      return words(runs ?? children ?? []);
    };
    const canvas = (children: ReactNode) => <Canvas width={600} height={600} style={{ fontFamily: "Liberation Sans" }}>{children}</Canvas>;

    it("has a sample of each (a new block needs its case in the writer, and one here)", () => {
      const takes = new Set(COMPONENTS.Canvas.children.categories);
      // Raw isn't one: only importers make it, for an Email or a Page (today's components in the new engine).
      const blocks = Object.values(COMPONENTS).filter((definition) => !definition.imported && definition.categories.some((category) => takes.has(category)));
      expect(Object.keys(SAMPLES).sort()).toEqual(blocks.map((definition) => definition.type).sort());
    });

    it.each(Object.entries(SAMPLES))("draws a %s with its words", (_, [sample, drawn]) => {
      const { root, diagnostics } = prepare(canvas(sample));
      expect(diagnostics.filter((d) => d.severity === "error")).toEqual([]);
      expect(words(writeCanvas(root!, { families: new Set(["liberation sans"]), fallback: "Liberation Sans", fonts: [], image: (src) => src }))).toBe(drawn);
    });

    it("writes the text blocks as Satori draws them", async () => {
      const text = ["Link", "List", "Table", "Video", "Menu"].map((type) => SAMPLES[type][0]);
      const svg = new TextDecoder().decode((await renderImage(canvas(text), { fonts, format: "svg" })).image);
      // The Table's header row's background.
      expect(svg).toContain('fill="#ff0000"');
    });
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
