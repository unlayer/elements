import { ImageExporters, ImageDefaults } from "@unlayer/exporters";
import type { AlignAlias, ImageValues, ImageSrcInput, SizeInput } from "../types";
import { createItemComponent, type ItemComponentProps } from "../utils/create-component";
import { mapSemanticProps, type SemanticProps } from "../utils/semantic-props";
import { PERCENT, toPx } from "../utils/image-sizing";

/**
 * Image semantic props — agent-friendly `src` (plain URL string or value object)
 * and CSS-style sizing (number/px pins, "50%" sets a percentage), replacing the
 * loose `any` flat props.
 */
type ImageSemanticProps = Omit<
  SemanticProps<ImageValues>,
  "src" | "width" | "maxWidth"
> & AlignAlias & {
  /** Alt text (alias for altText) */
  alt?: string;
  /** Image URL string, or the value object `{ url, width?, maxWidth?, ... }`. */
  src?: ImageSrcInput;
  /** Display width — number/px pins the image; "50%" sets a percentage width. */
  width?: SizeInput;
  /** Display width as a CSS value ("50%", "300px"). */
  maxWidth?: SizeInput;
};

export interface ImageProps extends ItemComponentProps<ImageSemanticProps> {}

// Defaults from the editor schema, plus React-specific overrides.
// Drop the schema placeholder's `height` so an image with no explicit dimensions
// doesn't inherit its 4:1 aspect ratio: the email exporter then omits the `height`
// attribute (height:auto), letting the real image keep its own ratio instead of
// being letterboxed (Outlook honors the height attribute). `width` is kept — it
// drives the responsive display width attribute. Real dimensions, when provided
// via an object `src`, override these.
const { height: _placeholderHeight, ...defaultSrc } = ImageDefaults.src as Record<string, unknown>;
const DEFAULT_VALUES = {
  ...ImageDefaults,
  src: {
    ...defaultSrc,
    autoWidth: true,
    maxWidth: "100%",
  },
} as unknown as ImageValues;

/**
 * Image - Renders an image element.
 *
 * @example Shorthand
 * ```tsx
 * <Image src="https://example.com/photo.jpg" alt="A photo" />
 * ```
 *
 * @example Full Control
 * ```tsx
 * <Image values={{
 *   src: { url: "https://example.com/image.jpg", width: 600 },
 *   altText: "Description"
 * }} />
 * ```
 */
const Image = createItemComponent<ImageValues, ImageSemanticProps>({
  name: "Image",
  defaultValues: DEFAULT_VALUES,
  propMapper: (props) => {
    // `width`/`maxWidth` are DISPLAY intent — pull them out so mapSemanticProps
    // can't fold them into the natural-size `src.width` field. They drive
    // autoWidth + maxWidth below; the natural dimensions come only from an
    // object `src` / the loaded image.
    const { alt, src, width: widthProp, maxWidth: maxWidthProp, ...rest } = props;

    // Normalize a string `values.src` to { url } before mapping. mapSemanticProps
    // merges flat src props onto the src group by spreading; if the escape-hatch
    // src is a string, spreading it character-spreads the URL into numeric keys
    // ({0:"h",1:"t",…}) and loses the url. Wrapping it first keeps the merge
    // object-to-object.
    const restValues = (rest as { values?: { src?: unknown } }).values;
    const normalizedRest =
      restValues && typeof restValues.src === "string"
        ? { ...rest, values: { ...restValues, src: { url: restValues.src } } }
        : rest;

    const base: Partial<ImageValues> = mapSemanticProps(normalizedRest as SemanticProps<ImageValues>, DEFAULT_VALUES, "Image");

    // Map alt → altText
    if (alt !== undefined) {
      base.altText = alt;
    }

    // Build the src value. Note: ImageValues.src is typed as string (codegen
    // bug) but the exporter expects { url, autoWidth?, maxWidth?, width?, ... }.
    // Natural src fields come from the `src` prop (string or object) and the
    // `values.src` escape hatch (which lands on `base.src` via mapSemanticProps);
    // the display `width`/`maxWidth` props were pulled out above. Combine the
    // natural fields (defensively, since base.src may be a string or non-object),
    // then apply the display intent.
    const baseSrc = (base as Record<string, any>).src;
    const fromValues: Record<string, any> =
      baseSrc && typeof baseSrc === "object" && !Array.isArray(baseSrc)
        ? (baseSrc as Record<string, any>)
        : typeof baseSrc === "string"
          ? { url: baseSrc }
          : {};
    const fromProp: Record<string, any> =
      typeof src === "string" ? { url: src } : (src ?? {}) as Record<string, any>;
    const userSrc = { ...fromValues, ...fromProp };

    if (src !== undefined || baseSrc !== undefined) {
      // A string url (from the `src` prop or `values.src`) carries no
      // dimensions, so it starts responsive with no placeholder size; an object
      // src starts from the schema defaults.
      const isStringUrl =
        typeof src === "string" || (src === undefined && typeof baseSrc === "string");
      const start = isStringUrl
        ? { autoWidth: true, maxWidth: "100%" }
        : { ...DEFAULT_VALUES.src };
      const merged = { ...start, ...userSrc } as Record<string, any>;

      // Display size = autoWidth + maxWidth: the default is responsive
      // (autoWidth:true); a fixed display size is autoWidth:false + `maxWidth` as a
      // PERCENT of the column's content slot (see image-sizing.ts for why a
      // percent, not a raw px). A px/number pin is kept here as a placeholder and
      // converted to that percent by the width-aware pass in renderToHtml /
      // renderToJson, where the column geometry is known.
      //
      // A `width` the author provides — the flat `width` prop OR `src.width`
      // (the documented full-control form) — is treated as that display intent and
      // pins. This is the canonical pinned shape the editor stores, so it survives
      // the round-trip; an `autoWidth` set explicitly on `src` is honored as-is.
      // The display intent, in priority order: flat `width` → flat `maxWidth` → object src `maxWidth` → object src
      // `width` (a percent, or px; a value that's neither is passed over).
      let display: string | number | undefined;
      for (const candidate of [widthProp, maxWidthProp, userSrc.maxWidth, userSrc.width]) {
        display = typeof candidate === "string" && PERCENT.test(candidate.trim()) ? candidate.trim() : toPx(candidate);
        if (display !== undefined) break;
      }

      // An explicit escape-hatch `autoWidth` is honored as-is (its own maxWidth
      // stays); otherwise the display intent decides ("100%" is responsive).
      if (userSrc.autoWidth === undefined) {
        const pinned = display !== undefined && display !== "100%";
        merged.autoWidth = !pinned;
        merged.maxWidth = pinned ? display : "100%";
      }

      base.src = merged as ImageValues["src"];
    }

    return base;
  },
  displayName: "Image",
  // Every <img> it writes: an email's image with its natural size is written twice, in Outlook's conditional comment and
  // for every other client.
  at: /<img [^>]*>/g,
  exporters: ImageExporters,
});

export default Image;
