import { ImageExporters, ImageDefaults } from "@unlayer/exporters";
import type { ImageValues } from "../types";
import { createItemComponent, type ItemComponentProps } from "../utils/create-component";
import { mapSemanticProps, type SemanticProps } from "../utils/semantic-props";

type ImageSemanticProps = SemanticProps<ImageValues> & {
  /** Alt text (alias for altText) */
  alt?: string;
};

export interface ImageProps extends ItemComponentProps<SemanticProps<ImageValues>> {
  alt?: string;
}

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
      // A string url (from the `src` prop or `values.src`) keeps no placeholder
      // dimensions — the Builder detects the natural size on load; an object src
      // starts from the schema defaults.
      const isStringUrl =
        typeof src === "string" || (src === undefined && typeof baseSrc === "string");
      const start = isStringUrl
        ? { autoWidth: true, maxWidth: "100%" }
        : { ...DEFAULT_VALUES.src };
      const merged = { ...start, ...userSrc } as Record<string, any>;

      // An explicit width must pin the DISPLAY width. In Unlayer the display
      // width is governed by autoWidth + maxWidth — `src.width` is the *natural*
      // size. With autoWidth:true the Builder auto-sizes to the natural width
      // and drops the intended width when the image is selected. So pin
      // autoWidth:false when the caller set a display size. An explicit maxWidth
      // *is* the display width and takes precedence — only derive maxWidth from
      // the numeric width when no maxWidth was given (else a natural width like
      // 1600 would clobber a caller's maxWidth:"50%"). No explicit sizing → stay
      // responsive. An explicit autoWidth is honored.
      if (userSrc.autoWidth === undefined) {
        if (userSrc.maxWidth !== undefined) {
          merged.autoWidth = false;
        } else if (typeof userSrc.width === "number") {
          merged.autoWidth = false;
          merged.maxWidth = `${userSrc.width}px`;
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
