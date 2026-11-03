/**
 * PDFs read back with pdf.js: their pages (how many, their paper), the words on each and where the first sits, and
 * that nothing is fetched (an image it isn't given is an error, not a request).
 */
import { readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { inflateSync } from "node:zlib";
import { getDocument, OPS } from "pdfjs-dist/legacy/build/pdf.mjs";
import type { ReactElement } from "react";
import { COMPONENTS, LAYOUT_VERSION } from "@unlayer-internal/elements-core";
import {
  Button,
  Circle,
  Column,
  Divider,
  Document,
  Email,
  Grid,
  Heading,
  Html,
  Image,
  Layer,
  Link,
  List,
  ListItem,
  Menu,
  PageBreak,
  PageFooter,
  PageHeader,
  PageNumber,
  Paragraph,
  prepare,
  Rect,
  Row,
  Section,
  Social,
  Span,
  Svg,
  Table,
  TableCell,
  TableRow,
  Text,
  validate,
  Video,
} from "@unlayer/react-elements/primitives";
import { renderPdf } from "../src";
import { writeDocument } from "../src/write";
import { toWoff, toWoff2 } from "./woff";

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

/** Liberation Sans (SIL OFL), as pdf.js ships it. */
const liberation = (name: string) => readFileSync(join(dirname(createRequire(import.meta.url).resolve("pdfjs-dist/package.json")), "standard_fonts", name));
/** The fonts a PDF embeds, each named by its file's own name (after a subset's tag: "ABCDEF+LiberationSans-Bold"). */
const embedded = (pdf: Uint8Array) => [...new Set([...Buffer.from(pdf).toString("latin1").matchAll(/\/BaseFont \/[A-Z]{6}\+([\w-]+)/g)].map((match) => match[1]))];

/** fontkit, as react-pdf's pdfkit reads fonts with it (test-only: it reads back the fonts a PDF embeds). */
const fontkit = createRequire(createRequire(createRequire(import.meta.url).resolve("@react-pdf/renderer/package.json")).resolve("pdfkit"))("fontkit") as {
  create(data: Buffer): { numGlyphs: number; getGlyph(id: number): { path: { commands: unknown[] } } };
};
/** Each font file a PDF embeds: its glyphs (.notdef aside), and how many have an outline (a letter drawn, not blank). */
function glyphs(pdf: Uint8Array): Array<{ glyphs: number; outlined: number }> {
  const text = Buffer.from(pdf).toString("latin1");
  return [...text.matchAll(/\/FontFile2 (\d+) 0 R/g)].map(([, id]) => {
    const object = new RegExp(`\\n${id} 0 obj\\s*<<([\\s\\S]*?)>>\\s*stream\\r?\\n`).exec(text)!;
    const start = object.index + object[0].length;
    const data = Buffer.from(pdf.subarray(start, start + Number(/\/Length (\d+)/.exec(object[1])![1])));
    const font = fontkit.create(/FlateDecode/.test(object[1]) ? inflateSync(data) : data);
    const ids = Array.from({ length: font.numGlyphs - 1 }, (_, i) => i + 1);
    const outlined = (id: number) => {
      try {
        return font.getGlyph(id).path.commands.length > 0;
      } catch {
        return false;
      }
    };
    return { glyphs: ids.length, outlined: ids.filter(outlined).length };
  });
}

/** A 1×1 PNG. */
const PNG = Uint8Array.from(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64"));
const PNG_URI = `data:image/png;base64,${Buffer.from(PNG).toString("base64")}`;

interface Read {
  pages: Array<{ size: [number, number]; words: string; first?: { str: string; x: number; y: number } }>;
}

async function read(pdf: Uint8Array): Promise<Read> {
  const document = await getDocument({ data: pdf.slice(), useSystemFonts: false, disableFontFace: true, verbosity: 0 }).promise;
  const pages: Read["pages"] = [];
  for (let n = 1; n <= document.numPages; n++) {
    const page = await document.getPage(n);
    const [, , width, height] = page.view;
    const items = (await page.getTextContent()).items.filter((item): item is { str: string; transform: number[] } & typeof item => "str" in item && item.str.trim() !== "");
    pages.push({
      size: [Math.round(width), Math.round(height)],
      // pdf.js splits a line into items where its style changes: joined with spaces, less those before punctuation.
      words: items.map((item) => item.str).join(" ").replace(/\s+/g, " ").replace(/ ([.,!?])/g, "$1").trim(),
      // From the top left, in points.
      first: items[0] && { str: items[0].str, x: Math.round(items[0].transform[4] * 10) / 10, y: Math.round((height - items[0].transform[5]) * 10) / 10 },
    });
  }
  return { pages };
}

const invoice = (
  <Document size="A4" margin={48} title="Invoice 2705">
    <PageHeader>
      <Text style={{ fontSize: 10, color: "#666666" }}>Acme · Invoice</Text>
    </PageHeader>
    <Heading level={1} style={{ fontSize: 24 }}>
      Invoice 2705
    </Heading>
    <Paragraph>
      Thank you for your <Span style={{ fontWeight: 700 }}>order</Span>. Questions? <Link href="https://acme.test/help">Contact us</Link>.
    </Paragraph>
    <Row style={{ gap: 16 }}>
      <Column>
        <Text>Pro plan</Text>
      </Column>
      <Column>
        <Text style={{ textAlign: "right" }}>$25.00</Text>
      </Column>
    </Row>
    <Image src={{ src: PNG_URI, width: 40, height: 40 }} alt="Logo" />
    <PageBreak />
    <Document.Page>
      <Text>Terms and conditions</Text>
    </Document.Page>
    <PageFooter>
      <Text style={{ fontSize: 10, textAlign: "right" }}>
        Page <PageNumber /> of <PageNumber total />
      </Text>
    </PageFooter>
  </Document>
);

describe("renderPdf", () => {
  it("writes each page on the Document's paper, its header and footer on each, numbered", async () => {
    const { pdf, diagnostics } = await renderPdf(invoice);
    expect(Buffer.from(pdf.subarray(0, 5)).toString()).toBe("%PDF-");
    expect(diagnostics.filter((d) => d.severity !== "info")).toEqual([]);
    const { pages } = await read(pdf);
    // A4: 595 × 842 points.
    expect(pages.map((page) => page.size)).toEqual([
      [595, 842],
      [595, 842],
    ]);
    expect(pages[0].words).toBe("Acme · Invoice Invoice 2705 Thank you for your order. Questions? Contact us. Pro plan $25.00 Page 1 of 2");
    expect(pages[1].words).toBe("Acme · Invoice Terms and conditions Page 2 of 2");
  });

  it("starts the content inside the margins, as the print HTML does: 48px is 36 points", async () => {
    const { pages } = await read((await renderPdf(invoice)).pdf);
    const first = pages[0].first!;
    expect(first.str).toBe("Acme · Invoice");
    expect(first.x).toBe(36);
    // The first line's baseline, a 10pt line down from the top margin.
    expect(first.y).toBeGreaterThan(36);
    expect(first.y).toBeLessThan(36 + 13);
  });

  it("makes each page's box the room inside its margins, no taller (react-pdf warned it can't wrap one taller on every A4 page)", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      for (const props of [{ size: "A4" }, { size: "A4", orientation: "landscape" }, { size: "Letter", margin: 50.3 }, { size: "A3", margin: 0 }] as const) {
        await renderPdf(
          <Document {...props}>
            <Text>One line</Text>
          </Document>
        );
      }
      expect(warn.mock.calls.map((call) => String(call[0]))).toEqual([]);
    } finally {
      warn.mockRestore();
    }
  });

  it("writes the same file for the same template", async () => {
    const [a, b] = await Promise.all([renderPdf(invoice), renderPdf(invoice)]);
    expect(Buffer.from(a.pdf).equals(Buffer.from(b.pdf))).toBe(true);
  });

  it("fetches nothing: an image it isn't given is an error; given by its URL, it's drawn", async () => {
    const template = (
      <Document>
        <Image src={{ src: "https://cdn.acme.test/logo.png", width: 40, height: 40 }} alt="Logo" />
      </Document>
    );
    await expect(renderPdf(template)).rejects.toMatchObject({ diagnostics: [expect.objectContaining({ code: "pdf/image", path: "root.children[0].props.src" })] });
    const { pdf } = await renderPdf(template, { images: { "https://cdn.acme.test/logo.png": PNG } });
    expect((await read(pdf)).pages).toHaveLength(1);
    await expect(renderPdf(template, { images: { "https://cdn.acme.test/logo.png": new TextEncoder().encode("GIF89a") } })).rejects.toMatchObject({
      diagnostics: [expect.objectContaining({ code: "pdf/image", message: "This image's file isn't a PNG or JPEG, the formats a PDF draws" })],
    });
  });

  it("says an SVG image isn't drawn (react-pdf draws PNG and JPEG), and shows its alt text in its box", async () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="#ff0000"/></svg>';
    const template = (
      <Document>
        <Image src={{ src: "https://cdn.acme.test/logo.svg", width: 80, height: 40 }} alt="Acme logo" />
        <Image src={{ src: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`, width: 40, height: 40 }} alt="" />
        <Text>Below</Text>
      </Document>
    );
    const { pdf, diagnostics } = await renderPdf(template, { images: { "https://cdn.acme.test/logo.svg": new TextEncoder().encode(svg) } });
    const message = "A PDF draws PNG and JPEG images, not SVG: give this one as a PNG or JPEG (its file in renderPdf's images option, by its URL, or a data: URI). Its alt text is shown in its box meanwhile";
    expect(diagnostics.map((d) => [d.code, d.severity, d.path, d.message])).toEqual([
      ["pdf/image", "warning", "root.children[0].props.src", message],
      ["pdf/image", "warning", "root.children[1].props.src", message],
    ]);
    expect((await read(pdf)).pages[0].words).toBe("Acme logo Below");
    // Each in a box of the image's size (40px tall: 30 points), so what's around it is where it was.
    const { root } = prepare(template);
    const { content } = writeDocument(root!, { families: new Set(), fonts: [], image: () => undefined, date: new Date(0) }).pages[0];
    expect(content.slice(0, 2).map((block) => [block.kind, "style" in block ? [block.style.width, block.style.height] : []])).toEqual([
      ["box", [60, 30]],
      ["box", [30, 30]],
    ]);
  });

  it("draws a Video's thumbnail given in images: its own, or a YouTube video's by the URL it's derived from", async () => {
    // The images a PDF draws, as pdf.js reads its drawing operators.
    const images = async (pdf: Uint8Array) => {
      const { fnArray } = await (await (await getDocument({ data: pdf.slice(), verbosity: 0 }).promise).getPage(1)).getOperatorList();
      return fnArray.filter((fn) => fn === OPS.paintImageXObject).length;
    };
    const youtube = <Video src="https://www.youtube.com/watch?v=dQw4w9WgXcQ" title="Our launch" />;
    const own = <Video src="https://vimeo.com/76979871" title="Our launch" thumbnail={{ src: "https://cdn.acme.test/launch.png", width: 64, height: 36 }} />;
    for (const [video, url] of [
      [youtube, "https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg"],
      [own, "https://cdn.acme.test/launch.png"],
    ] as const) {
      const { pdf } = await renderPdf(<Document>{video}</Document>, { images: { [url]: PNG } });
      expect(await images(pdf)).toBe(1);
      expect((await read(pdf)).pages[0].words).toBe("");
      // Not given, its title.
      const { pdf: titled } = await renderPdf(<Document>{video}</Document>);
      expect(await images(titled)).toBe(0);
      expect((await read(titled)).pages[0].words).toBe("Our launch");
    }
  });

  it("notes a web font it isn't given, and draws its text in a standard PDF font", async () => {
    const { diagnostics, pdf } = await renderPdf(
      <Document fonts={[{ family: "Inter", src: "https://fonts.acme.test/inter.woff2" }]} style={{ fontFamily: "Inter, sans-serif" }}>
        <Text>Hello</Text>
      </Document>
    );
    expect(diagnostics.map((d) => [d.code, d.severity])).toEqual([["pdf/font", "warning"]]);
    expect((await read(pdf)).pages[0].words).toBe("Hello");
  });

  it("draws a font file it's given that's WOFF as it draws a TTF, each letter's outline embedded, and says nothing", async () => {
    const ttf = liberation("LiberationSans-Regular.ttf");
    const template = (
      <Document fonts={[{ family: "Brand", src: "https://fonts.acme.test/brand.woff" }]} style={{ fontFamily: "Brand, sans-serif" }}>
        <Text>Hello</Text>
      </Document>
    );
    for (const src of [ttf, toWoff(ttf)]) {
      const { diagnostics, pdf } = await renderPdf(template, { fonts: [{ family: "Brand", src }] });
      expect(diagnostics).toEqual([]);
      expect(embedded(pdf)).toEqual(["LiberationSans"]);
      // H, e, l and o.
      expect(glyphs(pdf)).toEqual([{ glyphs: 4, outlined: 4 }]);
      expect((await read(pdf)).pages[0].words).toBe("Hello");
    }
  });

  it("says a font file that's WOFF2 isn't drawn (react-pdf would embed its letters blank), and draws its text as for a font not given", async () => {
    const regular = liberation("LiberationSans-Regular.ttf");
    const template = (
      <Document fonts={[{ family: "Brand", src: "https://fonts.acme.test/brand.woff2" }]} style={{ fontFamily: "Brand, sans-serif" }}>
        <Text>Hello</Text>
        <Text style={{ fontWeight: 700 }}>Bold</Text>
      </Document>
    );
    // A WOFF2 as Google Fonts' are (glyf and loca transformed: test/woff.ts), alone or beside the family's TTF.
    const alone = await renderPdf(template, { fonts: [{ family: "Brand", src: toWoff2(regular) }] });
    expect(alone.diagnostics.map((d) => [d.code, d.severity, d.message])).toEqual([
      ["pdf/font", "warning", "Brand's file is WOFF2: a PDF draws TTF, OTF and WOFF files. Its text is drawn in a standard PDF font meanwhile"],
    ]);
    expect(glyphs(alone.pdf)).toEqual([]);
    expect((await read(alone.pdf)).pages[0].words).toBe("Hello Bold");
    const beside = await renderPdf(template, { fonts: [{ family: "Brand", src: regular }, { family: "Brand", src: toWoff2(liberation("LiberationSans-Bold.ttf")), weight: 700 }] });
    expect(beside.diagnostics.find((d) => d.message.includes("WOFF2"))?.message).toBe("Brand's file is WOFF2: a PDF draws TTF, OTF and WOFF files. Its text is drawn in Brand's other files meanwhile");
    // Every letter embedded is drawn: the bold text in the regular file.
    expect(embedded(beside.pdf)).toEqual(["LiberationSans"]);
    expect(glyphs(beside.pdf).every((font) => font.outlined === font.glyphs)).toBe(true);
  });

  it("draws text in a weight or style a family isn't given in the nearest file it is, and says so (as an image does)", async () => {
    const regular = { family: "Brand", src: liberation("LiberationSans-Regular.ttf") };
    const template = (
      <Document style={{ fontFamily: "Brand, sans-serif" }}>
        <Text>Upright</Text>
        <Text style={{ fontStyle: "italic" }}>Slanted</Text>
        <Heading>Bold</Heading>
        <Table>
          <TableRow header>
            <TableCell>Plan</TableCell>
          </TableRow>
        </Table>
      </Document>
    );
    // Italic text where only the upright file is given: react-pdf threw ("Could not resolve font for elements-…").
    const { pdf, diagnostics } = await renderPdf(template, { fonts: [regular] });
    expect(diagnostics.map((d) => [d.code, d.severity, d.path, d.message])).toEqual([
      ["pdf/font-weight", "warning", "root.children[1]", "Text in Brand at 400 italic, which is given at 400 only: it's drawn in the nearest. Give that file in renderPdf's fonts option"],
      ["pdf/font-weight", "warning", "root.children[2]", "Text in Brand at 700, which is given at 400 only: it's drawn in the nearest. Give that file in renderPdf's fonts option"],
    ]);
    expect(embedded(pdf)).toEqual(["LiberationSans"]);
    expect((await read(pdf)).pages[0].words).toBe("Upright Slanted Bold Plan");
    // Given the italic and bold files, each is drawn in its own, and nothing is said.
    const all = await renderPdf(template, {
      fonts: [regular, { family: "Brand", src: liberation("LiberationSans-Italic.ttf"), style: "italic" }, { family: "Brand", src: liberation("LiberationSans-Bold.ttf"), weight: 700 }],
    });
    expect(all.diagnostics).toEqual([]);
    expect(embedded(all.pdf).sort()).toEqual(["LiberationSans", "LiberationSans-Bold", "LiberationSans-Italic"]);
  });

  it("says text a standard PDF font can't draw (it draws Western European characters only) where no font file is given for it", async () => {
    const template = (
      <Document>
        <Text>Hello, café — “Ÿ” €5</Text>
        <Text>Привет, мир</Text>
        <Text style={{ fontFamily: "Georgia, serif" }}>Ελληνικά</Text>
        <Text>Łódź</Text>
      </Document>
    );
    const { pdf, diagnostics } = await renderPdf(template);
    // Once for each standard font, where it's first met.
    expect(diagnostics.map((d) => [d.code, d.severity, d.path, d.message])).toEqual([
      [
        "pdf/font",
        "warning",
        "root.children[1]",
        `Text in Helvetica has characters a standard PDF font can't draw ("П"): it draws Western European characters only, and no font file is given for this text's fontFamily. Give one that has them in renderPdf's fonts option. They come out as other characters meanwhile`,
      ],
      [
        "pdf/font",
        "warning",
        "root.children[2]",
        `Text in Times-Roman has characters a standard PDF font can't draw ("Ε"): it draws Western European characters only, and no font file is given for this text's fontFamily. Give one that has them in renderPdf's fonts option. They come out as other characters meanwhile`,
      ],
    ]);
    const words = (await read(pdf)).pages[0].words;
    expect(words).toContain("Hello, café — “Ÿ” €5");
    expect(words).not.toContain("Привет");
    // In a font file that has them (Liberation Sans has Cyrillic, Greek and Polish), they're drawn, and nothing is said.
    const given = await renderPdf(<Document style={{ fontFamily: "Liberation Sans" }}>{template.props.children}</Document>, {
      fonts: [{ family: "Liberation Sans", src: liberation("LiberationSans-Regular.ttf") }],
    });
    expect(given.diagnostics.filter((d) => d.code === "pdf/font")).toEqual([
      expect.objectContaining({ path: "root.children[2]", message: expect.stringMatching(/^Text in Times-Roman has characters/) }),
    ]);
    expect((await read(given.pdf)).pages[0].words).toContain("Привет, мир");
  });

  it("says what a PDF can't show that its HTML can: a hover, a Video, markup (and validate() says it too)", async () => {
    const template = (
      <Document>
        <Button href="https://x.test" hover={{ backgroundColor: "#333333" }}>
          Go
        </Button>
        <Video src="https://vimeo.com/76979871" title="Our launch" />
        <Html html="<b>Sale</b>" text="Sale today" />
      </Document>
    );
    const said = (diagnostics: Array<{ code: string; message: string }>) => diagnostics.filter((d) => d.code.startsWith("pdf/")).map((d) => [d.code, d.message.split(":")[0]]);
    const expected = [
      ["pdf/unsupported", "A hover isn't possible in a PDF"],
      ["pdf/unsupported", "A Video isn't possible in a PDF"],
      ["pdf/unsupported", "Markup isn't possible in a PDF"],
    ];
    expect(said((await renderPdf(template)).diagnostics)).toEqual(expected);
    expect(said(validate(template).diagnostics)).toEqual(expected);
    // An email shows both: neither is said.
    expect(validate(<Email><Button href="https://x.test" hover={{ backgroundColor: "#333333" }}>Go</Button></Email>).diagnostics.filter((d) => d.code.startsWith("pdf/"))).toEqual([]);
  });

  it("says a page whose content can't fit is cut off, an estimate till text is measured (and validate() says it too)", async () => {
    const long = (
      <Document>
        {Array.from({ length: 120 }, (_, i) => (
          <Paragraph key={i}>Paragraph {i + 1} of a page that goes on for longer than an A4 page can hold.</Paragraph>
        ))}
      </Document>
    );
    const { diagnostics } = await renderPdf(long);
    const overflow = diagnostics.find((d) => d.code === "document/overflow");
    expect(overflow).toMatchObject({ severity: "warning" });
    expect(overflow?.message).toMatch(/^Page 1's content \(split it with a PageBreak, or into pages\) looks about \d+% as tall as its room \(an estimate: text isn't measured yet\)\. What doesn't fit is cut off$/);
    expect(validate(long).diagnostics.map((d) => d.code)).toContain("document/overflow");
    // A page that fits says nothing, nor does each page of the same content split into pages.
    expect((await renderPdf(<Document><Paragraph>One paragraph.</Paragraph></Document>)).diagnostics).toEqual([]);
    const split = (
      <Document>
        {Array.from({ length: 4 }, (_, page) => (
          <Document.Page key={page}>
            {Array.from({ length: 30 }, (_, i) => (
              <Paragraph key={i}>Paragraph {i + 1} of a page that holds a quarter of it.</Paragraph>
            ))}
          </Document.Page>
        ))}
      </Document>
    );
    expect((await renderPdf(split)).diagnostics.map((d) => d.code)).not.toContain("document/overflow");
  });

  it("draws each render's fonts from its own files: a family another render gave other files to isn't theirs", async () => {
    // Two different files given, in turn, as one family.
    const brand = (
      <Document style={{ fontFamily: "Brand" }}>
        <Text>Hello</Text>
      </Document>
    );
    const regular = await renderPdf(brand, { fonts: [{ family: "Brand", src: liberation("LiberationSans-Regular.ttf") }] });
    const bold = await renderPdf(brand, { fonts: [{ family: "Brand", src: liberation("LiberationSans-Bold.ttf") }] });
    const again = await renderPdf(brand, { fonts: [{ family: "Brand", src: liberation("LiberationSans-Regular.ttf") }] });
    expect(embedded(regular.pdf)).toEqual(["LiberationSans"]);
    expect(embedded(bold.pdf)).toEqual(["LiberationSans-Bold"]);
    expect(embedded(again.pdf)).toEqual(["LiberationSans"]);
    expect(Buffer.from(again.pdf).equals(Buffer.from(regular.pdf))).toBe(true);
  });

  it("draws an Svg's shapes as vectors, in the drawing's box", async () => {
    const { pdf } = await renderPdf(
      <Document>
        <Svg width={120} height={60} title="Logo">
          <Rect width={120} height={60} rx={8} style={{ fill: "#6366f1" }} />
          <Circle cx={30} cy={30} r={20} style={{ fill: "transparent", stroke: "#ffffff", strokeWidth: 4 }} />
        </Svg>
        <Text>Below the drawing</Text>
      </Document>
    );
    // The rectangle's fill, #6366f1, among the page's drawing operators.
    const document = await getDocument({ data: pdf.slice(), verbosity: 0 }).promise;
    const operators = await (await document.getPage(1)).getOperatorList();
    expect(JSON.stringify(operators.argsArray)).toMatch(/6366f1|99,102,241/i);
    const { pages } = await read(pdf);
    // 48px margin + 60px drawing = 81pt down, then the line of text below it.
    expect(pages[0].first?.str).toBe("Below the drawing");
    expect(pages[0].first!.y).toBeGreaterThan(36 + 45);
  });

  it("links to a link's URL, given as a string or as { href, target }", async () => {
    const { pdf } = await renderPdf(
      <Document>
        <Button href={{ href: "https://a.test/go", target: "_blank" }}>Go</Button>
        <Paragraph>
          See <Link href={{ href: "https://b.test/more" }}>more</Link> or <Link href="https://c.test/x">this</Link>
        </Paragraph>
      </Document>
    );
    const document = await getDocument({ data: pdf.slice(), verbosity: 0 }).promise;
    const urls = (await (await document.getPage(1)).getAnnotations()).map((annotation: { url?: string }) => annotation.url);
    expect(urls).toEqual(["https://a.test/go", "https://b.test/more", "https://c.test/x"]);
  });

  it("writes the words of a Link on its own and of a Menu's links, each linked", async () => {
    const { pdf } = await renderPdf(
      <Document>
        <Link href="https://acme.test/report">Read the report</Link>
        <Menu
          items={[
            { text: "Home", href: "https://acme.test/" },
            { text: "Blog", href: "https://acme.test/blog" },
          ]}
          separator="|"
        />
      </Document>
    );
    expect((await read(pdf)).pages[0].words).toBe("Read the report Home | Blog");
    const document = await getDocument({ data: pdf.slice(), verbosity: 0 }).promise;
    const urls = (await (await document.getPage(1)).getAnnotations()).map((annotation: { url?: string }) => annotation.url);
    expect(urls).toEqual(["https://acme.test/report", "https://acme.test/", "https://acme.test/blog"]);
  });

  it("cuts a page's content where the page ends, its lines as far apart as laid out (not drawn over each other)", async () => {
    const lines = Array.from({ length: 100 }, (_, i) => `Line ${i + 1}`);
    const { pdf } = await renderPdf(
      <Document size="A4" margin={48}>
        {lines.map((line) => (
          <Text key={line} style={{ fontSize: 12, lineHeight: 1.5 }}>
            {line}
          </Text>
        ))}
      </Document>
    );
    const document = await getDocument({ data: pdf.slice(), useSystemFonts: false, disableFontFace: true, verbosity: 0 }).promise;
    expect(document.numPages).toBe(1);
    const items = (await (await document.getPage(1)).getTextContent()).items as Array<{ str?: string; transform: number[] }>;
    const baselines = items.filter((item) => item.str?.startsWith("Line")).map((item) => item.transform[5]);
    // A 12px line at 1.5 is 18px: 13.5 points, from each line to the next.
    expect(baselines.slice(1).map((y, i) => baselines[i] - y).filter((gap) => Math.abs(gap - 13.5) > 0.05)).toEqual([]);
    expect(baselines.length).toBeGreaterThan(40);
    expect(baselines.length).toBeLessThan(lines.length);
  });

  it("paints each page white unless it has a background of its own (a viewer may show a transparent page as black)", async () => {
    const fills = async (template: ReactElement) => {
      const { pdf } = await renderPdf(template);
      const document = await getDocument({ data: pdf.slice(), verbosity: 0 }).promise;
      return JSON.stringify((await (await document.getPage(1)).getOperatorList()).argsArray);
    };
    expect(
      await fills(
        <Document>
          <Text style={{ color: "#111827" }}>Plain paper</Text>
        </Document>
      )
    ).toMatch(/#ffffff|255,255,255/i);
    const tinted = await fills(
      <Document style={{ backgroundColor: "#fef3c7" }}>
        <Text style={{ color: "#111827" }}>Tinted paper</Text>
      </Document>
    );
    expect(tinted).toMatch(/fef3c7|254,243,199/i);
    expect(tinted).not.toMatch(/#ffffff|255,255,255/i);
  });

  it("reads the tree prepare() lays out at the layout version it's built for, and refuses another (Elements newer or older)", async () => {
    const template = (
      <Document>
        <Text>Hi</Text>
      </Document>
    );
    expect(prepare(template).layout).toBe(LAYOUT_VERSION);
    await expect(renderPdf(template)).resolves.toMatchObject({ diagnostics: [] });
    const refused = async (prepared: { layout?: number }, message: string) => {
      other.prepared = prepared;
      try {
        await expect(renderPdf(template)).rejects.toMatchObject({ diagnostics: [{ code: "pdf/version", severity: "error", path: "root", message }] });
      } finally {
        other.prepared = undefined;
      }
    };
    const reads = `@unlayer/elements-pdf reads layout version ${LAYOUT_VERSION}; this @unlayer/react-elements writes`;
    await refused({ layout: LAYOUT_VERSION + 1 }, `${reads} ${LAYOUT_VERSION + 1}: update @unlayer/elements-pdf`);
    await refused({ layout: LAYOUT_VERSION - 1 }, `${reads} ${LAYOUT_VERSION - 1}: update @unlayer/react-elements`);
    await refused({}, `${reads} none: update @unlayer/react-elements`);
  });

  it("depends on its engine in one file: the writer builds pages as plain data, which react-pdf's adapter draws", () => {
    const sources = readdirSync(join(dirname(fileURLToPath(import.meta.url)), "../src"));
    const importing = sources.filter((file) => /from "@react-pdf\//.test(readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../src", file), "utf8")));
    expect(importing).toEqual(["react-pdf.tsx"]);
    // What the writer builds is data: the same after a round trip through JSON (its date aside).
    const { root } = prepare(invoice);
    const pages = writeDocument(root!, { families: new Set(), fonts: [], image: (src) => src, date: new Date(0) });
    expect(JSON.parse(JSON.stringify({ ...pages, date: undefined }))).toEqual({ ...pages, date: undefined });
    // A4 in points, on each page.
    expect(new Set(pages.pages.map((page) => `${page.width}x${page.height}`))).toEqual(new Set(["595.275x841.89"]));
  });

  describe("every block a Document takes", () => {
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
      Image: [<Image key="i" src={{ src: PNG_URI, width: 1, height: 1 }} alt="" />, ""],
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
      // Markup it can't draw: its plain text, its own or its markup's words.
      Html: [<Html key="html" html="<p>Sale <b>today</b></p><style>p{color:red}</style>" />, "Sale today"],
    };
    /** The words in the pages the writer builds, in their order. */
    const words = (item: unknown): string => {
      if (typeof item === "string") return item;
      if (Array.isArray(item)) return item.map(words).join("");
      if (!item || typeof item !== "object") return "";
      const { pages, header, content, footer, runs, children } = item as Record<string, unknown>;
      return pages ? words(pages) : content ? words([header, content, footer]) : words(runs ?? children ?? []);
    };

    it("has a sample of each (a new block needs its case in the writer, and one here)", () => {
      const takes = new Set(COMPONENTS.Document.children.categories);
      // Raw isn't one: only importers make it, for an Email or a Page (today's components in the new engine).
      const blocks = Object.values(COMPONENTS).filter((definition) => !definition.imported && definition.categories.some((category) => takes.has(category)));
      expect(Object.keys(SAMPLES).sort()).toEqual(blocks.map((definition) => definition.type).sort());
    });

    it.each(Object.entries(SAMPLES))("draws a %s with its words", (_, [sample, drawn]) => {
      const { root, diagnostics } = prepare(<Document>{sample}</Document>);
      expect(diagnostics.filter((d) => d.severity === "error")).toEqual([]);
      expect(words(writeDocument(root!, { families: new Set(), fonts: [], image: (src) => src, date: new Date(0) }))).toBe(drawn);
    });

    it("paints a Table row's background", async () => {
      // The fill colors the page sets, as pdf.js reads its drawing operators: the header row's red among them.
      const { pdf } = await renderPdf(<Document>{SAMPLES.Table[0]}</Document>);
      const page = await (await getDocument({ data: pdf.slice(), verbosity: 0 }).promise).getPage(1);
      const { fnArray, argsArray } = await page.getOperatorList();
      const fills = fnArray.flatMap((fn, i) => (fn === OPS.setFillRGBColor ? [String(argsArray[i])] : []));
      expect(fills).toContain("#ff0000");
    });
  });

  it("writes a Document only", async () => {
    await expect(
      renderPdf(
        <Email>
          <Text>Hi</Text>
        </Email>
      )
    ).rejects.toMatchObject({ diagnostics: [expect.objectContaining({ code: "pdf/root" })] });
  });
});
