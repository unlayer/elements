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

    const base: Partial<ImageValues> = mapSemanticProps(
      rest as SemanticProps<ImageValues>,
      DEFAULT_VALUES,
      "Image"
    );

    // Map alt → altText
    if (alt !== undefined) {
      base.altText = alt;
    }

    // Map string src → exporter object format
    // Note: ImageValues.src is typed as string (codegen bug) but the exporter
    // expects { url, autoWidth?, maxWidth? } at runtime.
    if (typeof src === "string") {
      (base as Record<string, unknown>).src = { url: src, autoWidth: true, maxWidth: "100%" };
    } else if (src !== undefined) {
      base.src = { ...DEFAULT_VALUES.src, ...src };
    }

    return base;
  },
  displayName: "Image",
  exporters: ImageExporters,
});

export default Image;
