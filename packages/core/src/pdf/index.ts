/**
 * What the PDF output of `@hyper-elements/react/pdf` is made of: a Document as pages to draw (the writer), and the
 * react-pdf adapter that draws them. This entry is separate from the core's main one so that nothing that imports the
 * core loads react-pdf.
 */
export * from "./model";
// What the entry's reader (src/pdf in @hyper-elements/react) takes from the core too, so its bundle holds one copy of it.
export { assetParts, LAYOUT_VERSION, type Asset, type FontFace } from "../index";
export { pdfFamily } from "./styles";
export { reactPdf } from "./react-pdf";
export { thumbnailOf, writeDocument, type WriteContext } from "./write";
