import type { PageBreakValues } from "../types";
import {
  createItemComponent,
  type ItemComponentProps,
} from "../utils/create-component";
import { mapSemanticProps, type SemanticProps } from "../utils/semantic-props";

export type PageBreakProps = ItemComponentProps<SemanticProps<PageBreakValues>>;

const DEFAULT_VALUES = {
  color: "#6b7280",
} as PageBreakValues;

const pageBreakExporters = {
  // Page breaks are a document-only concept. Keep the unsupported renderers
  // inert so a component rendered outside <Document> does not throw.
  web: () => "",
  email: () => "",
  document: () => '<div class="u-content-page-break" aria-hidden="true"></div>',
};

const pageBreakHead = {
  css: (
    _values: Record<string, unknown>,
    _bodyValues: Record<string, unknown>,
    meta: { displayMode?: string },
  ) =>
    meta.displayMode === "document"
      ? `
      .u-content-page-break {
        break-after: page;
        page-break-after: always;
      }
    `
      : undefined,
};

/**
 * PageBreak - Forces subsequent document content onto a new PDF page.
 *
 * Page breaks render only in document mode. In email and web output they are
 * intentionally inert.
 */
const PageBreak = createItemComponent<
  PageBreakValues,
  SemanticProps<PageBreakValues>
>({
  name: "PageBreak",
  contentType: "page_break",
  metaName: "page_break",
  defaultValues: DEFAULT_VALUES,
  propMapper: (props) => mapSemanticProps(props, DEFAULT_VALUES, "PageBreak"),
  displayName: "PageBreak",
  exporters: pageBreakExporters,
  head: pageBreakHead,
  omitEmptyOutput: true,
});

export default PageBreak;
