import Body, { type BodyProps } from "./Body";

export type DocumentProps = Omit<BodyProps, "mode">;

/**
 * Document - Print-optimized rendering for PDF generation.
 *
 * Thin wrapper around Body with mode locked to "document".
 *
 * @example
 * ```tsx
 * <Document backgroundColor="#ffffff" contentWidth="700px">
 *   <Row><Column><Paragraph text="Hello" /></Column></Row>
 * </Document>
 * ```
 */
export default function Document(props: DocumentProps) {
  return <Body {...props} mode="document" />;
}

Document.displayName = "Document";
