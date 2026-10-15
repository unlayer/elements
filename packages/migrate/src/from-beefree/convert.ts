/**
 * beefreeToDesign: a Beefree template (its classic "full" JSON) as an Unlayer design. Pure: no I/O, no Node APIs, no
 * React; the same input gives the same design.
 */
import { align, backgroundImage, color, fontFamily, px, pxString } from "./css";
import type { ModuleContext, Slot } from "./context";
import { DesignBuilder } from "./design";
import { convertRow } from "./layout";
import { knownBodyType, readBeefree } from "./read";
import type { BeefreeFallback, BeefreePage, BeefreeToDesignResult, BeefreeWarning, BeefreeWebFont, Values } from "./types";

/** Beefree's message width where a template sets none. */
const DEFAULT_WIDTH = 500;

/** The body's settings: the page around the message, the message's width, and its default font, colors and links. */
function bodyValues(page: BeefreePage, webFonts: readonly BeefreeWebFont[], warn: (reason: string, message: string) => void): { values: Values; width: number; textColor: string; linkColor: string; direction: string } {
  const body = page.body ?? {};
  const container = body.container?.style ?? {};
  const style = body.content?.style ?? {};
  const computed = body.content?.computedStyle ?? {};
  const width = px(computed.messageWidth) ?? px(style.width) ?? DEFAULT_WIDTH;
  const textColor = color(style.color) || "#000000";
  const linkColor = color(computed.linkColor) || "#0068A5";
  const direction = String(style.direction ?? "").trim().toLowerCase() === "rtl" ? "rtl" : "ltr";
  const values: Values = {
    contentWidth: pxString(width),
    backgroundColor: color(container["background-color"]),
    textColor,
    linkStyle: { body: true, linkColor, linkHoverColor: linkColor, linkUnderline: true, linkHoverUnderline: true },
  };
  const font = fontFamily(style["font-family"], webFonts);
  if (font) values.fontFamily = font;
  if (align(computed.align) === "left") values.contentAlign = "left";
  const image = backgroundImage(container, true);
  if (image) values.backgroundImage = image;
  if (direction === "rtl") values.textDirection = "rtl";
  const meta = page.head?.meta ?? {};
  if (typeof meta.preheader === "string" && meta.preheader.trim()) values.preheaderText = meta.preheader;
  if (typeof meta.title === "string" && meta.title.trim()) values.accessibilityTitle = meta.title;
  if (px(computed.messageWidthMobile)) warn("body-phone-width", `The body: its phone width (${computed.messageWidthMobile}) has no Unlayer equivalent; phones show the message at their own width.`);
  return { values, width, textColor, linkColor, direction };
}

/**
 * Convert a Beefree template into an Unlayer design.
 *
 * @param input - The template: its JSON text (a UTF-8 BOM is fine), its bytes, or the parsed object. It may be the
 *   page itself (`{ page }`), as the Template Catalog API gives it (`{ json_data: { page } }`), or as Beefree's
 *   `ITemplateJson` (`{ data: { json: { page } } }`).
 * @returns The design (`renderToJson()`'s shape: `designToElements()` writes it as Elements code), what didn't convert
 *   as it is (each naming its row, column and module), the modules kept as HTML, and the template's version.
 * @throws BeefreeFormatError when the input isn't a Beefree template of version 0.0.1 or 2.0.0: not JSON, Beefree's
 *   Simple Schema, a rows collection, a template without a version or of another one.
 */
export function beefreeToDesign(input: string | Uint8Array | object): BeefreeToDesignResult {
  const { page, version } = readBeefree(input);
  const warnings: BeefreeWarning[] = [];
  const fallbacks: BeefreeFallback[] = [];
  const warn = (reason: string, message: string, where?: string) => warnings.push({ reason, ...(where ? { where } : {}), message });

  const body = page.body ?? {};
  if (!knownBodyType(version, body.type)) warn("body-type", `The body: its type "${body.type}" isn't one Beefree ${version} templates have; it's read as theirs.`, "The body");
  const webFonts = (Array.isArray(body.webFonts) ? body.webFonts : []).filter((font): font is BeefreeWebFont => !!font && typeof font === "object");
  const { values, width, textColor, linkColor, direction } = bodyValues(page, webFonts, (reason, message) => warn(reason, message, "The body"));

  const builder = new DesignBuilder();
  const moduleContext = (where: string, slot: Slot): ModuleContext => ({
    version,
    builder,
    webFonts,
    textColor,
    linkColor,
    direction,
    where,
    slot,
    warn: (reason, message) => warn(reason, message, where),
    fallback: (reason) => fallbacks.push({ where, module: /\(([^)]+)\)$/.exec(where)?.[1] ?? "", reason }),
  });
  const rows = (page.rows ?? []).flatMap((row, index) => {
    if (!row || typeof row !== "object") {
      warn("not-a-row", `Row ${index + 1}: isn't a row, so it's left out.`, `Row ${index + 1}`);
      return [];
    }
    const converted = convertRow(row, index, { builder, bodyWidth: width, moduleContext, warn });
    return converted ? [converted] : [];
  });
  return { design: builder.design(rows, values), warnings, fallbacks, version };
}
