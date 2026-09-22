import Body, { type BodyProps } from "./Body";

export type DocumentPageSize =
  | "A3"
  | "A4"
  | "A5"
  | "Legal"
  | "Letter"
  | "Tabloid";

export type DocumentOrientation = "portrait" | "landscape";

export type DocumentProps = Omit<
  BodyProps,
  "mode" | "documentSize" | "documentOrientation" | "documentMargin"
> & {
  documentSize?: DocumentPageSize;
  documentOrientation?: DocumentOrientation;
};

/**
 * Document - Print-optimized rendering for PDF generation.
 *
 * Thin wrapper around Body with mode locked to "document".
 *
 * @example
 * ```tsx
 * <Document
 *   backgroundColor="#ffffff"
 *   contentWidth="700px"
 *   documentSize="A4"
 *   documentOrientation="portrait"
 * >
 *   <Row><Column><Paragraph text="Hello" /></Column></Row>
 * </Document>
 * ```
 */
export default function Document(props: DocumentProps) {
  return <Body {...props} mode="document" />;
}

Document.displayName = "Document";
