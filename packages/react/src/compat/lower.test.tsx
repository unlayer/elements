import { describe, expect, it } from "vitest";
import { ContentExporters } from "@unlayer/exporters";
import { Column, Divider, Document, Email, Heading, Page, Paragraph, Row, renderToJson } from "../index";
import { withRenderScope } from "../utils/render-scope";
import { contentBox, lowerDesign, PAGE_WIDTH, type Mode, type TreeNode } from "./lower";
import { lowerTemplate, type Lowered } from "./template";

const template = (
  <Email backgroundColor="#eeeeee" contentWidth="560px" textColor="#222222" previewText="Hi">
    <Row backgroundColor="#ffffff" padding="20px 40px 10px 40px" cells={[1, 2]}>
      <Column padding="8px">
        <Heading>Left</Heading>
      </Column>
      <Column>
        <Paragraph>Right</Paragraph>
      </Column>
    </Row>
  </Email>
);

const lowered = (element: React.ReactElement) => withRenderScope(() => lowerTemplate(element, undefined, "renderToHtml")) as Lowered | { unlowered: string };
const tree = (element: React.ReactElement) => (lowered(element) as Lowered).tree.root;

describe("lowerDesign()", () => {
  it("makes the body the Email, a row a Section around a Row, its columns' shares percentages, a block what block() makes", () => {
    const blocks: string[] = [];
    const { root } = lowerDesign(renderToJson(template) as never, { mode: "email", block: (b) => (blocks.push(b.type), { type: "Raw", props: { html: b.type } }) });
    expect(root).toMatchObject({ type: "Email", props: { width: 560, previewText: "Hi" }, style: { backgroundColor: "#eeeeee", color: "#222222" } });
    const [section] = root.children as any[];
    expect(section).toMatchObject({ type: "Section", style: { backgroundColor: "#ffffff", padding: { top: 20, right: 0, bottom: 10, left: 0 } } });
    const [left, right] = section.children[0].children;
    expect([left.style.width, right.style.width]).toEqual(["33.3333%", "66.6667%"]);
    expect(left.style.padding).toEqual({ top: 8, right: 8, bottom: 8, left: 8 });
    expect(right.children[0]).toEqual({ type: "Raw", props: { html: "text" } });
    expect(blocks).toEqual(["heading", "text"]);
  });

  it("draws a page as legacy lays one out: its rows bands of the window in its 8px margin, their columns at the content width", () => {
    const root = tree(<Page contentWidth="600px"><Row padding="20px 40px" backgroundColor="#fafafa"><Column><Paragraph>A</Paragraph></Column></Row></Page>);
    expect(root).toMatchObject({ type: "Page", props: { width: PAGE_WIDTH } });
    const [margin] = root.children as TreeNode[];
    expect(margin.style).toEqual({ padding: { top: 8, right: 8, bottom: 8, left: 8 } });
    const [band] = margin.children as TreeNode[];
    expect(band.style).toEqual({ backgroundColor: "#fafafa", padding: { top: 20, right: 40, bottom: 20, left: 40 }, alignItems: "center" });
    expect((band.children as TreeNode[])[0].style).toEqual({ width: "100%", maxWidth: 600 });
  });

  it("draws a line every column of a row has along its top or bottom as the row's (legacy's columns are as tall as their row)", () => {
    const line = { borderBottomWidth: "1px", borderBottomStyle: "solid", borderBottomColor: "#ddd" };
    const root = tree(<Email><Row cells={[1, 1]}><Column border={line}><Paragraph>A</Paragraph></Column><Column border={line}><Paragraph>B</Paragraph></Column></Row></Email>);
    const row = ((root.children as TreeNode[])[0].children as TreeNode[])[0];
    expect(row.style?.border).toEqual({ bottom: { width: 1, style: "solid", color: "#ddd" } });
    expect(row.mobile).toEqual({ border: { bottom: "none" } });
    expect((row.children as TreeNode[]).map((c) => [c.style?.border, c.mobile?.border])).toEqual([[undefined, { bottom: { width: 1, style: "solid", color: "#ddd" } }], [undefined, { bottom: { width: 1, style: "solid", color: "#ddd" } }]]);
  });

  it("never stacks a printed document's columns, its text 15px", () => {
    const root = tree(<Document><Row cells={[1, 1]}><Column><Paragraph>A</Paragraph></Column><Column><Paragraph>B</Paragraph></Column></Row></Document>);
    expect(root.style?.fontSize).toBe(15);
    const row = ((((root.children as TreeNode[])[0].children as TreeNode[])[0].children as TreeNode[])[0].children as TreeNode[])[0];
    expect(row).toMatchObject({ type: "Row", props: { stackOnMobile: false } });
  });

  it("keeps the ids authors give rows, columns and blocks", () => {
    const root = tree(<Email><Row values={{ _meta: { htmlID: "top" } } as never}><Column values={{ _meta: { htmlID: "col" } } as never}><Paragraph values={{ _meta: { htmlID: "intro" } } as never}>A</Paragraph></Column></Row></Email>);
    const section = (root.children as TreeNode[])[0];
    const column = ((section.children as TreeNode[])[0].children as TreeNode[])[0];
    expect([section.id, column.id, (column.children as TreeNode[])[0].id]).toEqual(["top", "col", "intro"]);
  });

  it("says what in a template's frame it can't draw as legacy does", () => {
    const unlowered = (element: React.ReactElement) => (lowered(element) as { unlowered?: string }).unlowered;
    expect(unlowered(<Email><Row backgroundImage={{ url: "https://example.com/bg.png" } as never}><Column><Paragraph>A</Paragraph></Column></Row></Email>)).toContain("background image");
    expect(unlowered(<Email><Row padding="0 10px 0 20px"><Column><Paragraph>A</Paragraph></Column></Row></Email>)).toContain("side padding");
    expect(unlowered(<Email previewText="{% if vip %}For you{% endif %}"><Row><Column><Paragraph>A</Paragraph></Column></Row></Email>)).toContain("tag in the preview text");
    expect(unlowered(<Email><Row cells={[1, 1]}><Column><Paragraph>A</Paragraph></Column></Row></Email>)).toContain("don't fit");
    // A divider longer than its column (a 300px line in a third of the email): legacy's row runs past the email.
    expect(unlowered(<Email><Row cells={[1, 1, 1]}><Column><Paragraph>A</Paragraph></Column><Column><Divider width={300} /></Column><Column><Paragraph>B</Paragraph></Column></Row></Email>)).toContain("divider longer than its column");
    expect(unlowered(<Email><Row cells={[1, 1, 1]}><Column><Paragraph>A</Paragraph></Column><Column><Divider width={120} /></Column><Column><Paragraph>B</Paragraph></Column></Row></Email>)).toBeUndefined();
    expect(unlowered(<Email><Row values={{ _meta: { htmlClassNames: "promo" } } as never}><Column><Paragraph>A</Paragraph></Column></Row></Email>)).toContain("class names");
    expect(unlowered(<Email><Row hideOnMobile><Column><Paragraph>A</Paragraph></Column></Row></Email>)).toContain("phones");
    expect(unlowered(<Email><Row cells={[1, 1]}><Column backgroundColor="#eee"><Paragraph>A</Paragraph></Column><Column><Paragraph>B</Paragraph></Column></Row></Email>)).toContain("as tall as their row");
    expect(unlowered(<Email>{"Loose"}<Row><Column><Paragraph>A</Paragraph></Column></Row></Email>)).toContain("among the rows");
    expect(unlowered(<Email previewText="Hi <%name%>"><Row><Column><Paragraph>A</Paragraph></Column></Row></Email>)).toContain("tag in the preview text");
  });

  it("renders as today a frame holding a value it doesn't read, whatever it is", () => {
    const unlowered = (element: React.ReactElement) => (lowered(element) as { unlowered?: string }).unlowered;
    const cell = <Column><Paragraph>A</Paragraph></Column>;
    // A row's anchor (legacy writes <a name>), its columns' vertical alignment, a value of its own.
    expect(unlowered(<Page><Row anchor="details">{cell}</Row></Page>)).toContain("anchor");
    expect(unlowered(<Page><Row values={{ alignItems: "center" } as never}>{cell}</Row></Page>)).toContain("alignItems");
    expect(unlowered(<Email><Row values={{ somethingNew: 1 } as never}>{cell}</Row></Email>)).toContain("somethingNew");
    expect(unlowered(<Email><Row values={{ _override: { tablet: { padding: "4px" } } } as never}>{cell}</Row></Email>)).toContain("tablets");
    // A content width that isn't in px, a page narrower than a phone, the body's own link style.
    for (const Root of [Email, Page]) expect(unlowered(<Root contentWidth="100%"><Row>{cell}</Row></Root>)).toContain("content width");
    expect(unlowered(<Page contentWidth="80%"><Row>{cell}</Row></Page>)).toContain("content width");
    expect(unlowered(<Page contentWidth="320px"><Row>{cell}</Row></Page>)).toContain("narrower than a phone");
    expect(unlowered(<Page linkStyle={{ linkColor: "#ff0000" } as never}><Row>{cell}</Row></Page>)).toContain("link style");
    // What legacy draws the same: an email narrower than a phone, empty values, the editor's flags.
    expect(unlowered(<Email contentWidth="320px"><Row>{cell}</Row></Email>)).toBeUndefined();
    expect(unlowered(<Page><Row anchor="" values={{ locked: true } as never}>{cell}</Row></Page>)).toBeUndefined();
  });

  it("writes legacy's preview text: its first 150 characters, none where it's only white space", () => {
    const preview = (text: string) => (lowered(<Email previewText={text}><Row><Column><Paragraph>A</Paragraph></Column></Row></Email>) as Lowered).tree.root.props?.previewText;
    expect(preview("A".repeat(200))).toBe("A".repeat(150));
    expect(preview("Hi there")).toBe("Hi there");
    expect(preview("   ")).toBeUndefined();
  });

  it("hides only by the overrides legacy reads, and keeps a phone padding of 0", () => {
    const tree = (element: React.ReactElement) => (lowered(element) as Lowered).tree.root;
    const find = (node: TreeNode, test: (n: TreeNode) => boolean): TreeNode | undefined => (test(node) ? node : (node.children ?? []).map((c) => (typeof c === "string" ? undefined : find(c, test))).find(Boolean));
    // A flat hideDesktop in a block's values hides nothing in legacy.
    const block = find(tree(<Page><Row><Column><Paragraph values={{ hideDesktop: true } as never}>A</Paragraph></Column></Row></Page>), (n) => n.type === "Paragraph");
    expect(block?.hidden).toBeUndefined();
    const column = find(tree(<Page><Row><Column padding="40px" mobile={{ padding: "0px" } as never}><Paragraph>A</Paragraph></Column></Row></Page>), (n) => !!n.designColumn);
    expect(column?.mobile).toEqual({ padding: { top: 0, right: 0, bottom: 0, left: 0 } });
  });
});

describe("contentBox()", () => {
  const box = { id: "u_content_html_1", className: "u_content_html", padding: "10px" };
  const font = "arial,helvetica,sans-serif";

  it("is a <div> on a page, with the block's id, class and padding, and classes that hide it", () => {
    expect(contentBox("X", box, font, "web")).toBe('\n  <div id="u_content_html_1" class="u_content_html v-container-padding-padding" style="overflow-wrap: break-word;padding: 10px;">\n    X\n  </div>\n');
    expect(contentBox("X", { ...box, override: { mobile: { hideMobile: true }, desktop: { hideDesktop: true } } }, font, "web")).toContain('class="u_content_html v-container-padding-padding hide-desktop hide-mobile"');
  });

  it("is a <div> in a printed document, named for its pages, in the template's font, hiding nothing", () => {
    const expected = '\n  <div id="u_content_html_1" data-page-row="u_content_html_1" class="u_content_html v-container-padding" style="overflow-wrap: break-word;padding: 10px;font-family: arial,helvetica,sans-serif;">\n    X\n  </div>\n';
    expect(contentBox("X", box, font, "document")).toBe(expected);
    expect(contentBox("X", { ...box, override: { mobile: { hideMobile: true }, desktop: { hideDesktop: true } } }, font, "document")).toBe(expected);
  });

  it("is a table in an email, the font on it and its cell, its padding on the cell", () => {
    expect(contentBox("X", box, font, "email")).toBe(
      '\n<table id="u_content_html_1" class="u_content_html" style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">\n  <tbody>\n    <tr>\n      <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:arial,helvetica,sans-serif;" align="left">\n        X\n      </td>\n    </tr>\n  </tbody>\n</table>\n'
    );
    expect(contentBox("X", { ...box, override: { mobile: { hideMobile: true } } }, font, "email")).toContain('class="u_content_html hide-mobile" style="font-family:');
  });

  it("isn't there in an email for Outlook, or until the head's rules say so, where it's hidden on desktop", () => {
    const html = contentBox("X", { ...box, override: { desktop: { hideDesktop: true } } }, font, "email");
    expect(html.startsWith('<!--[if !mso]><!-->\n<table id="u_content_html_1" class="u_content_html hide-default__display-table hide-desktop" style="display: none;mso-hide: all;font-family:')).toBe(true);
    expect(html.endsWith("</table>\n<!--<![endif]-->")).toBe(true);
  });

  it("can't be ended by what a value holds", () => {
    const html = contentBox("X", { ...box, padding: '1px"><script>', id: 'a"b' }, '"Open Sans"', "web");
    expect(html).not.toContain("<script>");
    expect(html).toContain('id="a&quot;b"');
  });

  it("writes what the closed ContentExporters write, byte for byte, in every mode and setting", () => {
    const overrides = [undefined, {}, { mobile: { hideMobile: true } }, { desktop: { hideDesktop: true } }, { tablet: { hideTablet: true } }, { mobile: { hideMobile: false }, desktop: { hideDesktop: false }, tablet: { hideTablet: false } }, { mobile: { hideMobile: true }, desktop: { hideDesktop: true }, tablet: { hideTablet: true } }];
    let checked = 0;
    for (const mode of ["web", "email", "document"] as Mode[]) {
      for (const override of overrides) {
        for (const padding of ["10px", "0px", "1px 2px 3px 4px", "2em", "", undefined]) {
          for (const family of [font, "'Open Sans',sans-serif", "", undefined]) {
            for (const [id, className] of [["u_content_custom_my_tool_2", "u_content_custom_my_tool"], ["given.id", "u_content_mine"]]) {
              const closed = (ContentExporters as Record<string, (...args: any[]) => string>)[mode]("<b>inner</b>", { containerPadding: padding, _override: override, _meta: { htmlID: id, htmlClassNames: className } }, { fontFamily: family === undefined ? undefined : { value: family } }, {});
              expect(contentBox("<b>inner</b>", { id, className, padding, override }, family, mode)).toBe(closed);
              checked++;
            }
          }
        }
      }
    }
    expect(checked).toBe(3 * 7 * 6 * 4 * 2);
  });
});
