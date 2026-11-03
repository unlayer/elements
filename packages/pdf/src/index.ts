/**
 * PDF output for Elements: a `<Document>` written as a PDF on the server, without a browser or the network. Its
 * pages, header and footer and page numbers are the print HTML's, laid out at the same widths. The writer builds the
 * pages as plain data (model.ts); an engine's adapter draws them (react-pdf's, react-pdf.tsx, the only file that
 * imports one), so the engine can change without the writer changing.
 *
 *   const { pdf } = await renderPdf(<Invoice />, { fonts: [{ family: "Inter", src: interRegular }] });
 *
 * Nothing is fetched: an image is a data: URI, or its bytes are given in `images` by its URL; a web font's file is
 * given in `fonts`. A template that needs one it isn't given is an error (an image) or drawn in a standard PDF font (a
 * font), and says so.
 */
import { assetParts, type Asset, type FontFace } from "@unlayer-internal/elements-core";
import { ElementsError, prepare, type Diagnostic, type ResolvedNode } from "@unlayer/react-elements/primitives";
import type { ReactElement } from "react";
import type { Font } from "./model";
import { reactPdf } from "./react-pdf";
import { pdfFamily } from "./styles";
import { writeDocument } from "./write";

export interface PdfFont {
  /** The family a template names in its fontFamily stacks ("Inter"). */
  family: string;
  /** The font file (TTF, OTF or WOFF; not WOFF2). */
  src: Uint8Array | ArrayBuffer;
  weight?: number;
  style?: "normal" | "italic";
}

export interface PdfOptions {
  /** Font files, by the family the template names: PDF output loads none itself. */
  fonts?: PdfFont[];
  /** Image files (PNG, JPEG, SVG), by the URL the template gives: PDF output loads none itself. */
  images?: Record<string, Uint8Array | ArrayBuffer>;
  /** When the PDF says it was made (a fixed date by default, so a template makes the same file every time). */
  date?: Date;
}

export interface PdfResult {
  /** The PDF file. */
  pdf: Uint8Array;
  /** Warnings and notes (errors are thrown). */
  diagnostics: Diagnostic[];
}

/** The date a PDF says it was made by default: fixed, so the same template makes the same bytes. */
const FIXED_DATE = new Date(Date.UTC(2026, 0, 1));

/** A Document written as a PDF. Rejects with an `ElementsError` listing the problems if it has errors. */
export async function renderPdf(element: ReactElement, options: PdfOptions = {}): Promise<PdfResult> {
  const { root, diagnostics } = prepare(element);
  if (!root) throw new ElementsError(diagnostics);
  if (root.type !== "Document") {
    throw new ElementsError([...diagnostics, { code: "pdf/root", severity: "error", message: `PDF output is a Document's: this template is a ${root.type}`, path: "root" }]);
  }
  const found: Diagnostic[] = [];
  const fonts = fontFiles(root, options.fonts ?? [], found);
  const images = imageSources(root, options.images ?? {}, found);
  if (found.some((d) => d.severity === "error")) throw new ElementsError([...diagnostics, ...found]);
  found.push(...missingFaces(root, fonts, options.fonts ?? []), ...beyondStandard(root, new Set(fonts.map((font) => font.family))));
  const pages = writeDocument(root, { families: new Set(fonts.map((font) => font.family)), fonts, image: (src) => images.get(src), date: options.date ?? FIXED_DATE });
  return { pdf: await reactPdf(pages), diagnostics: [...diagnostics, ...found] };
}

// ─── Fonts ─────────────────────────────────────────────────────────────────

function base64(bytes: Uint8Array | ArrayBuffer): string {
  return Buffer.from(bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : bytes).toString("base64");
}

/** A WOFF2 file, by its first bytes: a PDF draws TTF, OTF and WOFF files, not these. */
const woff2 = (bytes: Uint8Array) => String.fromCharCode(...bytes.subarray(0, 4)) === "wOF2";

/** The font files given, by the family the template names (lowercased); a file a PDF can't draw, or a web font not given, noted. */
function fontFiles(root: ResolvedNode, given: PdfFont[], found: Diagnostic[]): Font[] {
  const files = given.map((font) => ({ font, data: font.src instanceof ArrayBuffer ? new Uint8Array(font.src) : font.src }));
  // react-pdf embeds the glyphs a PDF draws as the file stores them (fontkit unpacks a WOFF's). A WOFF2 stores its
  // outlines transformed (Google Fonts' and most others do), and its letters come out blank, with no error.
  const drawn = files.filter(({ data }) => !woff2(data));
  const families = new Set(drawn.map(({ font }) => font.family.toLowerCase()));
  for (const { font, data } of files) {
    if (!woff2(data)) continue;
    const meanwhile = families.has(font.family.toLowerCase()) ? `${font.family}'s other files` : "a standard PDF font";
    found.push({ code: "pdf/font", severity: "warning", message: `${font.family}'s file is WOFF2: a PDF draws TTF, OTF and WOFF files. Its text is drawn in ${meanwhile} meanwhile`, path: "root.props.fonts" });
  }
  // A family given only as WOFF2 is said above, not as one not given.
  const named = new Set(given.map((font) => font.family.toLowerCase()));
  for (const face of (root.props.fonts as FontFace[] | undefined) ?? []) {
    if (named.has(face.family.toLowerCase())) continue;
    found.push({
      code: "pdf/font",
      severity: "warning",
      message: `PDF output loads no fonts: give ${face.family}'s file in renderPdf's fonts option. Its text is drawn in a standard PDF font meanwhile`,
      path: "root.props.fonts",
    });
  }
  return drawn.map(({ font, data }) => ({ family: font.family.toLowerCase(), data, weight: font.weight ?? 400, style: font.style ?? "normal" }));
}

/**
 * Text in a weight or style of a family whose file for it isn't given: drawn in the nearest given (react-pdf finds the
 * nearest weight; the adapter, a style), as an image's is.
 */
function missingFaces(root: ResolvedNode, fonts: Font[], given: PdfFont[]): Diagnostic[] {
  const out = new Map<string, Diagnostic>();
  const families = new Set(fonts.map((font) => font.family));
  const visit = (node: ResolvedNode) => {
    if (node.hidden?.desktop) return;
    const family = pdfFamily(String(node.text.fontFamily), families);
    if (families.has(family) && node.children.some((child) => typeof child === "string" && child.trim())) {
      const faces = fonts.filter((font) => font.family === family);
      const { fontWeight: weight, fontStyle: style } = node.text;
      const key = `${family}|${weight}|${style}`;
      if (!faces.some((face) => face.weight === weight && face.style === style) && !out.has(key)) {
        const name = given.find((font) => font.family.toLowerCase() === family)?.family ?? family;
        const has = faces.map((face) => `${face.weight}${face.style === "italic" ? " italic" : ""}`).join(", ");
        out.set(key, {
          code: "pdf/font-weight",
          severity: "warning",
          message: `Text in ${name} at ${weight}${style === "italic" ? " italic" : ""}, which is given at ${has} only: it's drawn in the nearest. Give that file in renderPdf's fonts option`,
          path: node.path,
          ...(node.id ? { nodeId: node.id } : {}),
        });
      }
    }
    for (const child of node.children) if (typeof child !== "string") visit(child);
  };
  visit(root);
  return [...out.values()];
}

/** What a standard PDF font draws, as react-pdf writes its text (Windows-1252): Western European characters. */
const WIN_ANSI = "€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ";
const drawnInStandard = (char: string) => {
  const code = char.codePointAt(0)!;
  return (code >= 0x20 && code <= 0x7e) || (code >= 0xa0 && code <= 0xff) || WIN_ANSI.includes(char) || char === "\n" || char === "\t" || char === "\r";
};

/** Text drawn in a standard PDF font (no file given for its stack) with characters it can't draw: once a font. */
function beyondStandard(root: ResolvedNode, families: ReadonlySet<string>): Diagnostic[] {
  const out = new Map<string, Diagnostic>();
  const visit = (node: ResolvedNode) => {
    if (node.hidden?.desktop) return;
    const family = pdfFamily(String(node.text.fontFamily), families);
    if (!families.has(family) && !out.has(family)) {
      const char = node.children.flatMap((child) => (typeof child === "string" ? [...child] : [])).find((c) => !drawnInStandard(c));
      if (char) {
        out.set(family, {
          code: "pdf/font",
          severity: "warning",
          message: `Text in ${family} has characters a standard PDF font can't draw ("${char}"): it draws Western European characters only, and no font file is given for this text's fontFamily. Give one that has them in renderPdf's fonts option. They come out as other characters meanwhile`,
          path: node.path,
          ...(node.id ? { nodeId: node.id } : {}),
        });
      }
    }
    for (const child of node.children) if (typeof child !== "string") visit(child);
  };
  visit(root);
  return [...out.values()];
}

// ─── Images ────────────────────────────────────────────────────────────────

/** What an image file is, from its first bytes: a format a PDF draws, or undefined. */
function mime(bytes: Uint8Array): string | undefined {
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return "image/jpeg";
  const head = new TextDecoder().decode(bytes.subarray(0, 256)).trimStart();
  if (head.startsWith("<svg") || head.startsWith("<?xml")) return "image/svg+xml";
  return undefined;
}

const DRAWN = /^data:image\/(png|jpeg|jpg|svg\+xml)[;,]/;

/** Each image's source as the pages hold it, without the network: a data URI; an image without one, an error. */
function imageSources(root: ResolvedNode, given: Record<string, Uint8Array | ArrayBuffer>, found: Diagnostic[]): Map<string, string> {
  const out = new Map<string, string>();
  const resolve = (src: string): string | undefined => {
    if (out.has(src)) return out.get(src);
    let source: string | undefined;
    if (DRAWN.test(src)) source = src;
    else if (given[src]) {
      const bytes = given[src] instanceof ArrayBuffer ? new Uint8Array(given[src] as ArrayBuffer) : (given[src] as Uint8Array);
      const type = mime(bytes);
      if (type) source = `data:${type};base64,${base64(bytes)}`;
    }
    if (source) out.set(src, source);
    return source;
  };
  const visit = (node: ResolvedNode) => {
    if (node.hidden?.desktop) return;
    if (node.type === "Image" && !resolve(assetParts(node.props.src as Asset).src)) {
      found.push({
        code: "pdf/image",
        severity: "error",
        message: given[assetParts(node.props.src as Asset).src]
          ? "This image's file isn't a PNG, JPEG or SVG, the formats a PDF draws"
          : "PDF output loads no images: give this one's file in renderPdf's images option (by its URL), or its src as a data: URI",
        path: `${node.path}.props.src`,
        ...(node.id ? { nodeId: node.id } : {}),
      });
    }
    if (node.type === "Video" && node.props.thumbnail) resolve(assetParts(node.props.thumbnail as Asset).src);
    for (const child of node.children) if (typeof child !== "string") visit(child);
  };
  visit(root);
  return out;
}
