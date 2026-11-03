/**
 * Where today's components draw something other than their design asks, and the new engine, given the design,
 * draws it as they do (RFC 0001, "Moving the existing components"). Each is one function and one test, so the major
 * that drops them deletes this file.
 */

type Sides = { top: number; right: number; bottom: number; left: number };

/**
 * A Row's padding, in an email: legacy writes its sides outside the content width, where a wide window shows
 * nothing of them and a phone none either (its phone CSS zeroes them). They're left out; its top and bottom stay.
 */
export function rowPaddingInEmail(padding: Sides): Sides {
  return { top: padding.top, right: 0, bottom: padding.bottom, left: 0 };
}

/**
 * A page's margin: legacy's page and printed document leave the browser's 8px margin around the body, inside its
 * background.
 */
export function pageMargin(): Sides {
  return { top: 8, right: 8, bottom: 8, left: 8 };
}

/** A text block's letter case: legacy's heading and text exporters don't write textTransform, so text is drawn as written. */
export function textTransformOfText(_value: unknown): undefined {
  return undefined;
}

/**
 * A block's font: legacy reads `{ label, value }`, which its props make from a stack; a stack given as a string in
 * `values` isn't read, and the block is in the body's font.
 */
export function fontOfValues(value: unknown): string | undefined {
  return value && typeof value === "object" && typeof (value as { value?: unknown }).value === "string" ? (value as { value: string }).value || undefined : undefined;
}

/**
 * A divider's length: legacy writes a length given as the builder stores it (`{ width, autoWidth }`) as "[object
 * Object]", which no browser reads, and draws no line where it would be (its space is kept): a line of no length.
 */
export function dividerLength(width: unknown): unknown {
  return width !== null && typeof width === "object" ? 0 : width;
}

/**
 * A text block's HTML as legacy's text and heading exporters write it: the first non-breaking space between a word
 * and a tag is a plain space (where a line may break).
 */
export function spaceBeforeTag(html: string): string {
  return html.replace(/([^\s<>])&nbsp;(<)/, "$1 $2");
}

/**
 * A button's colors under the pointer: legacy's page writes them in its stylesheet; its email writes none, so an
 * email's button doesn't change.
 */
export function buttonHover(mode: "email" | "web" | "document", colors: { hoverColor?: unknown; hoverBackgroundColor?: unknown }): Record<string, string> | undefined {
  if (mode === "email") return undefined;
  const hover = Object.fromEntries(
    [
      ["color", colors.hoverColor],
      ["backgroundColor", colors.hoverBackgroundColor],
    ].filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1] !== "")
  );
  return Object.keys(hover).length ? hover : undefined;
}

/**
 * An image's own box: legacy's image exporters don't write the border, corner radius or background an Image's props
 * give it (`borderWidth`, `borderRadius`, `backgroundColor`), so it's drawn without them.
 */
export function imageBox(_values: Record<string, unknown>): Record<string, never> {
  return {};
}

/**
 * The padding legacy takes off an image's place to size it: the block's own, where its props give one; else none,
 * though the block has its default 10px (the exporter isn't given it), so the image may be up to 20px wider than its
 * padded place leaves, and spills into the padding.
 */
export function imagePadding(design: Record<string, unknown>, exporter: Record<string, unknown> | undefined): unknown {
  if (!exporter) return design.containerPadding ?? "10px";
  return exporter.containerPadding ?? "0px";
}

/**
 * Whether legacy writes an email image twice, the second for classic Outlook in a conditional comment, which its plain
 * text reads too (the image's alternate text is there twice): where the image has its own width and height.
 */
export function outlookCopy(src: { width?: unknown; height?: unknown; url?: unknown }): boolean {
  return typeof src.width === "number" && src.width > 0 && typeof src.height === "number" && src.height > 0 && !/\{\{|\[\[|<%/.test(String(src.url ?? ""));
}

/**
 * A row's background (or its columns') in an email: legacy's email writes a color with transparency (rgba with an
 * alpha under 1) as transparent, so the row has none.
 */
export function rowColorInEmail(value: string | undefined): string | undefined {
  const rgba = value && /^rgba\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*,\s*([\d.]+)\s*\)$/i.exec(value.trim());
  return rgba && Number(rgba[1]) < 1 ? undefined : value;
}

/**
 * A page's or printed document's text and background colors: legacy's stylesheet takes a hex, rgb() or rgba() color,
 * or transparent; another (a name, hsl()) is its default, black text on white.
 */
export function pageBodyColor(value: string | undefined, fallback: "#000000" | "#ffffff"): string {
  return value && /^(#[0-9a-f]{3,8}|rgba?\(.*\)|transparent)$/i.test(value.trim()) ? value : fallback;
}
