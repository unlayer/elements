/**
 * PDFs read back with pdf.js: their pages (how many, their paper), the words on each and where the first sits, and
 * that nothing is fetched (an image it isn't given is an error, not a request).
 */
import { readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getDocument, OPS } from "pdfjs-dist/legacy/build/pdf.mjs";
import type { ReactElement } from "react";
import { COMPONENTS } from "@unlayer-internal/elements-core";
import {
  Button,
  Circle,
  Column,
  Divider,
  Document,
  Email,
  Grid,
  Heading,
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
      diagnostics: [expect.objectContaining({ code: "pdf/image", message: "This image's file isn't a PNG, JPEG or SVG, the formats a PDF draws" })],
    });
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

  it("says a font file it's given that's WOFF or WOFF2 isn't drawn (a PDF draws TTF and OTF), and draws its text in a standard font", async () => {
    const woff2 = Uint8Array.from([0x77, 0x4f, 0x46, 0x32, 0, 1, 0, 0]);
    const { diagnostics, pdf } = await renderPdf(
      <Document fonts={[{ family: "Inter", src: "https://fonts.acme.test/inter.woff2" }]} style={{ fontFamily: "Inter, sans-serif" }}>
        <Text>Hello</Text>
      </Document>,
      { fonts: [{ family: "Inter", src: woff2 }] }
    );
    expect(diagnostics.find((d) => d.message.includes("WOFF2"))).toMatchObject({ code: "pdf/font", severity: "warning" });
    expect((await read(pdf)).pages[0].words).toBe("Hello");
  });

  it("says what a PDF can't show that its HTML can: a hover, a Video (and validate() says it too)", async () => {
    const template = (
      <Document>
        <Button href="https://x.test" hover={{ backgroundColor: "#333333" }}>
          Go
        </Button>
        <Video src="https://vimeo.com/76979871" title="Our launch" />
      </Document>
    );
    const said = (diagnostics: Array<{ code: string; message: string }>) => diagnostics.filter((d) => d.code.startsWith("pdf/")).map((d) => [d.code, d.message.split(":")[0]]);
    const expected = [
      ["pdf/unsupported", "A hover isn't possible in a PDF"],
      ["pdf/unsupported", "A Video isn't possible in a PDF"],
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
    // Liberation Sans (SIL OFL), as pdf.js ships it: two different files given, in turn, as one family.
    const file = (name: string) => readFileSync(join(dirname(createRequire(import.meta.url).resolve("pdfjs-dist/package.json")), "standard_fonts", name));
    const brand = (
      <Document style={{ fontFamily: "Brand" }}>
        <Text>Hello</Text>
      </Document>
    );
    // A PDF names each font it embeds by the file's own name (after a subset's tag: "ABCDEF+LiberationSans-Bold").
    const embedded = (pdf: Uint8Array) => [...new Set([...Buffer.from(pdf).toString("latin1").matchAll(/\/BaseFont \/[A-Z]{6}\+([\w-]+)/g)].map((match) => match[1]))];
    const regular = await renderPdf(brand, { fonts: [{ family: "Brand", src: file("LiberationSans-Regular.ttf") }] });
    const bold = await renderPdf(brand, { fonts: [{ family: "Brand", src: file("LiberationSans-Bold.ttf") }] });
    const again = await renderPdf(brand, { fonts: [{ family: "Brand", src: file("LiberationSans-Regular.ttf") }] });
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
      const blocks = Object.values(COMPONENTS).filter((definition) => definition.categories.some((category) => takes.has(category)));
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
