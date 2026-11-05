/**
 * A Document as print HTML: each page a box of the paper's size, its margins as padding, a page break after each but
 * the last; its PageHeader at the top of each, its PageFooter at the bottom, the page's content between them. CSS's
 * @page gives the paper its size (its margins none: they're the boxes'); on a screen the pages sit on a grey desk.
 */
import { documentPages, pageBox } from "../../document";
import type { ResolvedNode } from "../../resolve";
import { h } from "../jsx";
import { px, textDeclarations } from "../shared/css";
import { isNode, type Component } from "./context";
import { alignSelf, stackOf } from "./layout";
import { numbering } from "./PageNumber";

/** The print stylesheet: the paper's size, backgrounds printed, and the desk the pages sit on on a screen. */
export function documentCss(root: ResolvedNode): string {
  const box = pageBox(root.props);
  return (
    `@page{size:${box.css};margin:0}` +
    "body{-webkit-print-color-adjust:exact;print-color-adjust:exact}" +
    "@media screen{body{background:#e5e7eb;padding:24px 0}.elements-page{box-shadow:0 1px 4px rgba(0,0,0,.2)}.elements-page+.elements-page{margin-top:24px!important}}"
  );
}

export const Document: Component = ({ node: root, style, render }) => {
  const box = pageBox(root.props);
  const { margin } = box;
  const { pages, header, footer } = documentPages(root);
  return (
    <main style={textDeclarations(root.text, undefined)}>
      {pages.map(({ page, children }, index) =>
        numbering({ page: index + 1, total: pages.length }, () => (
          <section
            id={page?.id}
            class="elements-page"
            style={{
              boxSizing: "border-box",
              width: box.width,
              height: box.height,
              margin: "0 auto",
              padding: `${px(margin.top)} ${px(margin.right)} ${px(margin.bottom)} ${px(margin.left)}`,
              display: "flex",
              flexDirection: "column",
              backgroundColor: page?.style.backgroundColor ?? style.backgroundColor,
              overflow: "hidden",
              breakAfter: index < pages.length - 1 ? "page" : undefined,
            }}
          >
            {header && render(header, [])}
            <div style={[{ flex: "1 1 auto", minHeight: 0 }, stackOf(page ?? root), page ? textDeclarations(page.text, root.text) : {}]}>
              {children.filter(isNode).map((child) => render(child, alignSelf(child, page ?? root)))}
            </div>
            {footer && render(footer, [])}
          </section>
        ))
      )}
    </main>
  );
};
