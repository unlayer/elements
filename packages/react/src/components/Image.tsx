import { ImageExporters, ImageDefaults } from "@unlayer/exporters";
import type { ImageValues, ImageSrcInput, SizeInput } from "../types";
import { createItemComponent, type ItemComponentProps } from "../utils/create-component";
import { mapSemanticProps, type SemanticProps } from "../utils/semantic-props";

/**
 * Image semantic props — agent-friendly `src` (plain URL string or value object)
 * and CSS-style sizing (number/px pins, "50%" sets a percentage), replacing the
 * loose `any` flat props.
 */
type ImageSemanticProps = Omit<
  SemanticProps<ImageValues>,
  "src" | "width" | "maxWidth"
> & {
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

// Defaults from the editor schema, plus React-specific overrides
const DEFAULT_VALUES = {
  ...ImageDefaults,
  // Override src with autoWidth/maxWidth for responsive rendering
  src: {
    ...ImageDefaults.src,
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
    const { alt, src, ...rest } = props;

    // Normalize a string `values.src` to { url } before mapping. mapSemanticProps
    // merges flat src props (width=, …) onto the src group by spreading; if the
    // escape-hatch src is a string, spreading it character-spreads the URL into
    // numeric keys ({0:"h",1:"t",…}) and loses the url. Wrapping it first keeps
    // the merge object-to-object.
    const restValues = (rest as { values?: { src?: unknown } }).values;
    const normalizedRest =
      restValues && typeof restValues.src === "string"
        ? { ...rest, values: { ...restValues, src: { url: restValues.src } } }
        : rest;

    const base: Partial<ImageValues> = mapSemanticProps(
      normalizedRest as SemanticProps<ImageValues>,
      DEFAULT_VALUES,
      "Image"
    );

    // Map alt → altText
    if (alt !== undefined) {
      base.altText = alt;
    }

    // Build the src value. Note: ImageValues.src is typed as string (codegen
    // bug) but the exporter expects { url, autoWidth?, maxWidth?, width?, ... }.
    // The user can provide src three ways — the `src` prop (string or object),
    // flat semantic props (width=, maxWidth=, …), and the `values.src` escape
    // hatch — the latter two land on `base.src` via mapSemanticProps. Combine
    // all user-provided src fields (defensively, since base.src may be a string
    // or non-object), then apply the width pin.
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

      // In Unlayer's value model, `src.width`/`height` are the NATURAL image
      // size and never set the display width. Display size = autoWidth + maxWidth:
      // the default (and "100%") is responsive (autoWidth:true, capped at the
      // natural size); a fixed display size is autoWidth:false + `maxWidth` as a
      // PERCENT of the container. An explicit autoWidth is honored.
      const pctRe = /^\d+(?:\.\d+)?%$/;

      // A `width` that is a percent is a DISPLAY width → route it to maxWidth.
      // A px / bare-number `width` is the NATURAL size (a number); the natural
      // cap then gives an "up to <w>px, responsive" display for free.
      if (typeof merged.width === "string") {
        const t = merged.width.trim();
        if (pctRe.test(t)) {
          if (userSrc.maxWidth === undefined) merged.maxWidth = t;
          delete merged.width;
        } else {
          const px = /^(\d+(?:\.\d+)?)(?:px)?$/.exec(t);
          if (px) merged.width = parseFloat(px[1]);
        }
      }

      const displayPct =
        typeof merged.maxWidth === "string" && pctRe.test(merged.maxWidth.trim())
          ? merged.maxWidth.trim()
          : undefined;
      if (userSrc.autoWidth === undefined) {
        if (displayPct && displayPct !== "100%") {
          merged.autoWidth = false;
          merged.maxWidth = displayPct;
        } else {
          merged.autoWidth = true;
          merged.maxWidth = "100%";
        }
      }

      base.src = merged as ImageValues["src"];
    }

    return base;
  },
  displayName: "Image",
  exporters: ImageExporters,
});

export default Image;
