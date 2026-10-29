/**
 * An Image's height class (a logo's `h-12 w-auto`) as its width. In the browser an image with a height and an auto
 * width is as wide as its aspect ratio makes it; the editor's image has a width, not a height (its height follows
 * from its width and its size). So where the image's size is given (`src={{ url, width, height }}`), the height is
 * the width its ratio gives (48px of a 400×100 logo is 192px wide), and where it isn't, the height is passed over:
 * as an inline style beside the image's width it would stretch it.
 */
import type { ClassDeclaration } from "./declarations";

const plain = (v: unknown): v is Record<string, any> => !!v && typeof v === "object" && !Array.isArray(v);
/**
 * A positive length in pixels, as a number or a string (`400`, `"400"`, `"400px"`); undefined otherwise. (A string
 * read once, and only one a size could be: `\d*\.?\d+` read a run of digits again from each place it could split it.)
 */
const pixels = (v: unknown): number | undefined => {
  const text = typeof v === "string" ? v.trim() : "";
  const n = typeof v === "number" ? v : text.length <= 24 && /^(?:\d+(?:\.\d+)?|\.\d+)(px)?$/.test(text) ? parseFloat(text) : NaN;
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

/** The image's own size, from an object `src` (or `values.src`) with both a width and a height. */
function sizeOf(explicit: Record<string, any>): { width: number; height: number } | undefined {
  for (const src of [explicit.src, explicit.values?.src]) {
    if (!plain(src)) continue;
    const [width, height] = [pixels(src.width), pixels(src.height)];
    if (width && height) return { width, height };
  }
  return undefined;
}

/** Whether a width is given in props: the display width (`width`, `maxWidth`, or `src`'s `maxWidth`, `autoWidth`). */
function widthGiven(explicit: Record<string, any>): boolean {
  if (explicit.width != null || explicit.maxWidth != null) return true;
  return [explicit.src, explicit.values?.src].some((src) => plain(src) && (src.maxWidth != null || src.autoWidth != null));
}

/**
 * The declarations with each height in pixels whose width is auto (no width class for its screens but `w-auto`, and
 * no width in props) as that width; `sized` says one is, so the image's `src.width` is its size, not a display width.
 * A height with a width (`size-12`, `w-32 h-12`), a hover one, or one that isn't in pixels (`h-auto`, `h-full`) is
 * left as it is.
 */
export function heightAsWidth(
  declarations: ClassDeclaration[],
  explicit: Record<string, any>,
  ignore: (d: ClassDeclaration, why: string) => void
): { declarations: ClassDeclaration[]; sized: boolean } {
  const heights = declarations.filter((d) => d.property === "height" && d.when !== "hover" && pixels(d.value) !== undefined);
  if (!heights.length || widthGiven(explicit)) return { declarations, sized: false };
  // A width class for these screens: its own, or one for every screen (phones and desktops also show those).
  const widthFor = (when: ClassDeclaration["when"]) =>
    declarations.some((d) => d.property === "width" && d.value !== "auto" && (d.when === when || (when !== "hover" && d.when === "always")));
  const size = sizeOf(explicit);
  const replaced = new Map<ClassDeclaration, ClassDeclaration | undefined>();
  for (const d of heights) {
    if (widthFor(d.when)) continue;
    if (size) {
      const width = Math.round((pixels(d.value)! * size.width) / size.height * 100) / 100;
      replaced.set(d, { ...d, property: "width", value: `${width}px` });
    } else {
      ignore(d, ": an image's height gives its width only with the image's size (`src={{ url, width, height }}`), as its aspect ratio does in the browser; without it, the height would stretch the image");
      replaced.set(d, undefined);
    }
  }
  if (!replaced.size) return { declarations, sized: false };
  // The width a height gives replaces a `w-auto` for the same screens.
  const sizedAt = new Set([...replaced].filter(([, w]) => w).map(([d]) => d.when));
  const out = declarations.flatMap((d) => {
    if (replaced.has(d)) return replaced.get(d) ? [replaced.get(d)!] : [];
    return d.property === "width" && d.value === "auto" && sizedAt.has(d.when) ? [] : [d];
  });
  return { declarations: out, sized: sizedAt.size > 0 };
}
