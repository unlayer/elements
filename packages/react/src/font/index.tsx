/**
 * @unlayer/react-elements/font: `<Font>`, a web font for a template.
 */
import type React from "react";
import { recordForHead } from "../head/record";
import { fontFamilyOf, fontTags, fontUrlInDesign, primaryFamily, type FontProps } from "../utils/font-design";

export { fontFamilyOf, fontTags, type FontProps };

function fontInDesign(font: FontProps, body: Parameters<typeof fontUrlInDesign>[2]): void {
  const { url, label } = fontFamilyOf(font);
  const family = primaryFamily(label);
  if (url && family) fontUrlInDesign(family, url, body);
}

/**
 * Font - Declares a web font for the template. Place it in an Email, Page or Document (or a component of yours
 * there): the document's head loads it (the stylesheet's `<link>`, or an `@font-face` for a font file), and with
 * `default` it's the root's `fontFamily`, in the HTML and the design. Outlook ignores web fonts: it shows `fallback`.
 *
 * @example
 * ```tsx
 * <Email>
 *   <Font family="Inter" url="https://fonts.googleapis.com/css2?family=Inter:wght@400;700" fallback="Arial, sans-serif" default />
 *   <Row>…</Row>
 * </Email>
 * ```
 */
export function Font(props: FontProps): React.ReactElement {
  // While a template is collected, what it gives the head and the root is recorded; it renders nothing.
  return recordForHead(
    {
      kind: "head",
      tags: (mode: string) => fontTags(props, mode),
      root: props.default ? { fontFamily: fontFamilyOf(props) } : undefined,
      design: (body: Parameters<typeof fontInDesign>[1]) => fontInDesign(props, body),
    },
    "Font"
  );
}

Font.displayName = "Font";

export default Font;
