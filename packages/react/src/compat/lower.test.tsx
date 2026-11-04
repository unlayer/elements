import { describe, expect, it, vi } from "vitest";
import { ContentExporters } from "@unlayer/exporters";
import { Button, Column, Divider, Document, Email, Heading, Html, Page, Paragraph, Row, renderToHtml, renderToJson } from "../index";
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

const lowered = (element: React.ReactElement) => withRenderScope(() => lowerTemplate(element, undefined, "renderToHtml")) as Lowered;
const tree = (element: React.ReactElement) => lowered(element).tree.root;
const css = (element: React.ReactElement) => String(tree(element).compat?.css ?? "");
const notes = (element: React.ReactElement) => lowered(element).diagnostics.map((d) => `${d.severity}: ${d.message}`);
const find = (node: TreeNode, test: (n: TreeNode) => boolean): TreeNode | undefined => (test(node) ? node : (node.children ?? []).map((c) => (typeof c === "string" ? undefined : find(c, test))).find(Boolean));
const columnOf = (element: React.ReactElement) => find(tree(element), (n) => !!n.designColumn)!;
const rowOf = (element: React.ReactElement) => find(tree(element), (n) => n.type === "Row")!;
const cell = <Column><Paragraph>A</Paragraph></Column>;
const picture = { url: "https://example.com/bg.png", fullWidth: true, repeat: "no-repeat", position: "center" };

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

  it("draws a column's lines and background on a cell of its own, as tall as the row, where its row's columns are side by side in an email", () => {
    const line = { borderBottomWidth: "1px", borderBottomStyle: "solid", borderBottomColor: "#ddd" };
    const row = rowOf(<Email><Row cells={[1, 1]}><Column border={line}><Paragraph>A</Paragraph></Column><Column backgroundColor="#eee"><Paragraph>B</Paragraph></Column></Row></Email>);
    expect(row.compat?.stretch).toBe(true);
    expect((row.children as TreeNode[]).map((c) => [c.style?.border, c.style?.backgroundColor])).toEqual([[{ bottom: { width: 1, style: "solid", color: "#ddd" } }, undefined], [undefined, "#eee"]]);
  });

  it("keeps a row's columns as fluid blocks where nothing shows of their height or their shares", () => {
    expect(rowOf(<Email><Row cells={[1, 1]}><Column padding="8px"><Paragraph>A</Paragraph></Column><Column><Paragraph>B</Paragraph></Column></Row></Email>).compat?.stretch).toBeUndefined();
    expect(rowOf(<Email><Row><Column backgroundColor="#eee"><Paragraph>A</Paragraph></Column></Row></Email>).compat?.stretch).toBeUndefined();
  });

  it("draws a row's columns as cells where they stay side by side on phones, or a share is nothing", () => {
    expect(rowOf(<Email><Row cells={[1, 1]} noStackMobile><Column><Paragraph>A</Paragraph></Column><Column><Paragraph>B</Paragraph></Column></Row></Email>).compat?.stretch).toBe(true);
    expect(rowOf(<Email><Row cells={[0, 1]}><Column><Paragraph>A</Paragraph></Column><Column><Paragraph>B</Paragraph></Column></Row></Email>).compat?.stretch).toBe(true);
  });

  it("gives a cell the width a block of a fixed length takes, past its share, and keeps its row's table from moving off centre", () => {
    const template = <Email><Row cells={[1, 1, 1]}><Column><Paragraph>A</Paragraph></Column><Column padding="5px"><Divider width={300} /></Column><Column><Button href="https://example.com" values={{ size: { autoWidth: false, width: "200px" } } as never}>B</Button></Column></Row></Email>;
    const row = rowOf(template);
    expect(row.compat?.stretch).toBe(true);
    expect((row.children as TreeNode[]).map((c) => c.compat?.minWidth)).toEqual([undefined, 330, 220]);
    expect((row.children as TreeNode[]).map((c) => c.compat?.phoneMinWidth)).toEqual([undefined, 330, undefined]);
    const section = (tree(template).children as TreeNode[])[0];
    expect(css(template)).toContain(`.${section.compat?.className} > table { table-layout: fixed; }`);
    expect(rowOf(<Email><Row cells={[1, 1, 1]}><Column><Paragraph>A</Paragraph></Column><Column><Divider width={120} /></Column><Column><Paragraph>B</Paragraph></Column></Row></Email>).compat?.stretch).toBeUndefined();
    // A row's only column stays a block, whose line runs past the table the same way.
    const alone = <Email><Row><Column><Divider width={900} /></Column></Row></Email>;
    expect(rowOf(alone).compat?.stretch).toBeUndefined();
    expect(css(alone)).toContain(`.${(tree(alone).children as TreeNode[])[0].compat?.className} > table { table-layout: fixed; }`);
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

  describe("what a template's frame holds, drawn as legacy draws it", () => {
    it("writes a row's anchor before it, as legacy's named link", () => {
      for (const Root of [Email, Page, Document]) {
        const html = renderToHtml(<Root><Row>{cell}</Row><Row anchor={'x"y'}><Column><Paragraph>Details</Paragraph></Column></Row></Root>);
        expect(html).toContain('<a name="x&quot;y"></a>');
        expect(html.indexOf("<a name")).toBeLessThan(html.indexOf("Details"));
      }
    });

    it("gives a page's row its columns' alignment, a name the new Row hasn't by a rule; an email's has none", () => {
      expect(rowOf(<Page><Row values={{ alignItems: "center" } as never}>{cell}</Row></Page>).style?.alignItems).toBe("center");
      expect(rowOf(<Page><Row values={{ alignItems: "flex-end" } as never}>{cell}</Row></Page>).style?.alignItems).toBe("end");
      const baseline = <Page><Row values={{ alignItems: "baseline" } as never}>{cell}</Row></Page>;
      expect(css(baseline)).toContain(`.${rowOf(baseline).compat?.className} { align-items: baseline; }`);
      expect(rowOf(<Email><Row values={{ alignItems: "center" } as never}>{cell}</Row></Email>).style?.alignItems).toBeUndefined();
    });

    it("says of a value legacy draws nothing of that it draws nothing, and draws the same", () => {
      const plain = renderToHtml(<Email><Row>{cell}</Row></Email>);
      const given = <Email values={{ accessibilityTitle: "T" } as never}><Row values={{ somethingNew: 1, _override: { tablet: { padding: "4px", hideTablet: true }, mobile: { backgroundColor: "#0f0" } } } as never}><Column values={{ somethingNew: 2, _override: { tablet: { padding: "4px" } } } as never}><Paragraph>A</Paragraph></Column></Row></Email>;
      expect(renderToHtml(given)).toBe(plain);
      expect(notes(given)).toEqual([
        'info: A body\'s accessibilityTitle "T" draws nothing',
        "info: A row's somethingNew 1 draws nothing",
        "info: A row's settings for tablets draw nothing",
        "info: A row's backgroundColor for phones draws nothing",
        "info: A column's somethingNew 2 draws nothing",
        "info: A column's settings for tablets draw nothing",
      ]);
      // Empty values and the editor's flags are nothing to say.
      expect(notes(<Page><Row anchor="" values={{ locked: true } as never}>{cell}</Row></Page>)).toEqual([]);
    });

    it("writes a row's and a column's settings for a device at legacy's 480px, whatever the content width", () => {
      const settings = { desktop: { padding: "24px" }, mobile: { padding: "40px 20px" } };
      const template = (Root: typeof Email) => <Root contentWidth="700px"><Row values={{ _override: settings } as never}><Column values={{ _override: { ...settings, mobile: { padding: "4px", border: { borderTopWidth: "3px", borderTopStyle: "solid", borderTopColor: "#0a0" } } } } as never}><Paragraph>A</Paragraph></Column></Row></Root>;
      const email = template(Email);
      const section = (tree(email).children as TreeNode[])[0];
      const column = columnOf(email);
      // An email's row has only its top and bottom there; its sides are outside the content.
      expect(css(email)).toContain(`@media (min-width: 481px) { .${column.compat?.className} { padding: 24px !important; } .${section.compat?.className} { padding-top: 24px !important; padding-bottom: 24px !important; } }`);
      expect(css(email)).toContain(`@media (max-width: 480px) { .${column.compat?.className} { padding: 4px !important; } .${column.compat?.className} { border-top: 3px solid #0a0 !important;`);
      expect(css(email)).toContain(`.${section.compat?.className} { padding-top: 40px !important; padding-bottom: 40px !important; } }`);
      // A page's band has them all; its column's lines are out of legacy's selector's reach.
      const page = template(Page);
      const band = find(tree(page), (n) => n.compat?.className !== undefined && !n.designColumn)!;
      expect(css(page)).toContain(`.${band.compat?.className} { padding: 40px 20px !important; }`);
      expect(css(page)).not.toContain("border-top");
      // A printed document has no phones, and its desktop settings whatever the width.
      const printed = css(template(Document));
      expect(printed).toContain("@media (min-width: 1px)");
      expect(printed).not.toContain("max-width: 480px");
    });

    it("keeps a phone padding of 0, which takes off a column's padding there", () => {
      const template = <Page><Row><Column padding="40px" mobile={{ padding: "0px" } as never}><Paragraph>A</Paragraph></Column></Row></Page>;
      expect(css(template)).toContain(`.${columnOf(template).compat?.className} { padding: 0px !important; }`);
    });

    it("hides a row in an email at legacy's 480px, whatever the content width, and says a column's hiding draws nothing, as legacy's", () => {
      const template = <Email contentWidth="700px"><Row hideOnMobile>{cell}</Row><Row hideOnDesktop>{cell}</Row></Email>;
      const [phone, desktop] = tree(template).children as TreeNode[];
      expect(phone).toMatchObject({ hidden: { mobile: true } });
      expect(desktop).toMatchObject({ hidden: { desktop: true } });
      const html = renderToHtml(template);
      expect(html).toContain("@media (max-width: 480px){");
      expect(html).toMatch(/@media \(max-width: 480px\)\{[^}]*\{display:none!important\}[^}]*\{display:table-row!important\}/);
      const column = <Email><Row><Column values={{ _override: { mobile: { hideMobile: true } } } as never}><Paragraph>A</Paragraph></Column></Row></Email>;
      expect(columnOf(column).hidden).toBeUndefined();
      expect(notes(column).join()).toContain("A column's hideMobile for phones draws nothing");
      // A printed document hides nothing.
      expect(find(tree(<Document><Row hideOnMobile>{cell}</Row></Document>), (n) => !!n.hidden)).toBeUndefined();
    });

    it("writes sides it can't read as legacy writes them, for the browser to draw or not", () => {
      const template = <Page><Row padding="1em"><Column padding="2em 5%"><Paragraph>A</Paragraph></Column></Row></Page>;
      const column = columnOf(template);
      expect(column.style?.padding).toBeUndefined();
      expect(css(template)).toContain(`.${column.compat?.className} { padding: 2em 5%; }`);
      expect(css(template)).toContain("{ padding: 1em; }");
      // An email's row: as they are, and none of the sides on phones.
      const email = <Email><Row padding="1em"><Column><Paragraph>A</Paragraph></Column></Row></Email>;
      const name = ((tree(email).children as TreeNode[])[0].compat?.className as string).split(" ")[0];
      expect(css(email)).toContain(`.${name} { padding: 1em; }`);
      expect(css(email)).toContain(`@media (max-width: 520px) { .${name} { padding-left: 0 !important; padding-right: 0 !important; } }`);
    });

    it("leaves out, and says, what can't be written in CSS", () => {
      const template = <Page><Row><Column values={{ padding: "1px;} body{display:none" } as never}><Paragraph>A</Paragraph></Column></Row></Page>;
      expect(css(template)).not.toContain("display:none");
      expect(notes(template).join()).toContain("can't be written in CSS");
    });

    it("writes a column's corner radius, lines and colors the new engine doesn't read as legacy writes them", () => {
      const template = <Page><Row><Column borderRadius="50%" backgroundColor="hsl(1, 2%, 3%)" border={{ borderTopWidth: "1em", borderTopStyle: "solid", borderTopColor: "#f00", borderBottomWidth: "2px", borderBottomStyle: "double", borderBottomColor: "#00f", borderLeftWidth: "2px", borderLeftStyle: "solid", borderLeftColor: "#0f0" }}><Paragraph>A</Paragraph></Column></Row></Page>;
      const column = columnOf(template);
      const rule = css(template);
      expect(rule).toContain("border-radius: 50%");
      expect(rule).toContain("background-color: hsl(1, 2%, 3%)");
      expect(rule).toContain("border-top: 1em solid #f00");
      expect(rule).toContain("border-bottom: 2px double #00f");
      // The line it reads is the new engine's.
      expect(column.style?.border).toEqual({ left: { width: 2, style: "solid", color: "#0f0" } });
    });

    it("keeps a page's column its share of the row inside its side lines, a neighbour its share (legacy's run past the row)", () => {
      const template = <Page><Row cells={[1, 1]}><Column border={{ borderLeftWidth: "4px", borderLeftStyle: "solid", borderLeftColor: "#00f" }}><Paragraph>A</Paragraph></Column><Column><Paragraph>B</Paragraph></Column></Row></Page>;
      const [first, second] = rowOf(template).children as TreeNode[];
      expect(css(template)).toContain(`.${first.compat?.className} { flex: 0 0 calc(50% + 4px) !important; }`);
      expect(css(template)).toContain(`.${second.compat?.className} { flex-shrink: 0 !important; }`);
      expect(css(template)).toContain(`@media (max-width: 480px) { .${first.compat?.className}.${first.compat?.className} { width: calc(100% + 4px) !important;`);
    });

    it("passes a row's and a column's own class names through, as legacy wrote them", () => {
      const template = (Root: typeof Email) => <Root><Row values={{ _meta: { htmlClassNames: 'promo "x"' } } as never}><Column values={{ _meta: { htmlClassNames: "promo-col" } } as never}><Paragraph>A</Paragraph></Column></Row></Root>;
      for (const Root of [Email, Page, Document]) {
        const html = renderToHtml(template(Root));
        expect(html).toContain('class="promo x"');
        expect(html).toContain('class="promo-col"');
      }
      expect(renderToHtml(<Email><Row>{cell}</Row></Email>)).not.toContain("u_row");
    });

    it("draws a row's background picture across the window, or at the content width, in an email for Outlook too", () => {
      const full = <Email><Row backgroundImage={picture as never}>{cell}</Row></Email>;
      expect((tree(full).children as TreeNode[])[0].compat?.background).toEqual({ url: picture.url, repeat: "no-repeat", position: "center center", tile: false });
      expect(rowOf(full).compat?.background).toBeUndefined();
      const inner = <Email><Row backgroundImage={{ ...picture, fullWidth: false, repeat: "repeat", position: "top-left" } as never}>{cell}</Row></Email>;
      expect(rowOf(inner).compat?.background).toEqual({ url: picture.url, repeat: "repeat", position: "left top", tile: true });
      expect((tree(inner).children as TreeNode[])[0].compat?.background).toBeUndefined();
      const html = renderToHtml(full);
      expect(html).toContain(`background="${picture.url}"`);
      expect(html).toContain(`background-image:url(&quot;${picture.url}&quot;)`);
      expect(html).toContain(`<v:fill type="frame" src="${picture.url}"></v:fill>`);
    });

    it("reads a row's picture as its exporter gets it, without the design's defaults", () => {
      const template = <Email><Row backgroundImage={{ url: picture.url, fullWidth: true } as never}>{cell}</Row></Email>;
      expect((tree(template).children as TreeNode[])[0].compat?.background).toEqual({ url: picture.url, repeat: "no-repeat", tile: false });
    });

    it("draws a page's row's background picture on its band, or at the content width over its columns' background", () => {
      const band = <Page><Row backgroundImage={{ ...picture, size: "cover" } as never}>{cell}</Row></Page>;
      expect(css(band)).toContain(`background-image: url("${picture.url}"); background-repeat: no-repeat; background-position: center center; background-size: cover;`);
      const inner = <Page><Row columnsBackgroundColor="#eee" backgroundImage={{ ...picture, fullWidth: false } as never}>{cell}</Row></Page>;
      const content = find(tree(inner), (n) => n.style?.maxWidth === 500)!;
      expect(content.style?.backgroundColor).toBe("#eee");
      expect(css(inner)).toContain(`.${content.compat?.className} { background-image:`);
    });

    it("draws the body's picture on a page and in a printed document; legacy's email has none, and that's said", () => {
      const image = { url: picture.url, repeat: "repeat", position: "top-left", cover: true };
      expect(css(<Page values={{ backgroundImage: image } as never}><Row>{cell}</Row></Page>)).toContain(`body { background-image: url("${picture.url}"); background-repeat: repeat; background-position: left top; }`);
      const printed = <Document values={{ backgroundImage: image } as never}><Row>{cell}</Row></Document>;
      expect(css(printed)).toContain(`body { background-image: url("${picture.url}"); background-repeat: repeat; background-position: left top; background-size: cover; }`);
      expect(find(tree(printed), (n) => !!n.compat?.className && !n.children?.some((c) => typeof c !== "string" && c.compat?.className))).toBeDefined();
      const email = <Email values={{ backgroundImage: image } as never}><Row>{cell}</Row></Email>;
      expect(css(email)).not.toContain("background-image");
      expect(notes(email).join()).toContain("The body's background picture draws nothing in an email");
    });

    it("gives a column its share of the layout where its row's don't fit it, and says so", () => {
      const short = <Page><Row cells={[1, 1]}>{cell}</Row></Page>;
      expect(columnOf(short).style?.width).toBe("50%");
      expect(notes(short).join()).toContain("A row of 1 column(s) in a layout of 2");
      const long = <Page><Row cells={[1]}>{cell}{cell}</Row></Page>;
      const [first, second] = rowOf(long).children as TreeNode[];
      expect(first.style?.width).toBe("100%");
      expect(css(long)).toContain(`.${first.compat?.className} { flex-shrink: 0 !important; }`);
      expect(second.style?.width).toBeUndefined();
      expect(css(long)).toContain(`.${second.compat?.className} { flex: 0 1 100% !important; min-width: auto !important; }`);
    });

    it("sits an email's content off centre where its row's sides differ, by the difference, none on phones", () => {
      const template = <Email><Row padding="0 10px 0 40px">{cell}</Row></Email>;
      const name = (tree(template).children as TreeNode[])[0].compat?.className;
      expect(css(template)).toContain(`.${name} { padding-left: 30px; }`);
      expect(css(template)).toContain(`@media (max-width: 520px) { .${name} { padding-left: 0 !important; padding-right: 0 !important; } }`);
      expect((tree(<Email><Row padding="0 20px">{cell}</Row></Email>).children as TreeNode[])[0].compat).toBeUndefined();
    });

    it("keeps content to a width that isn't in px as legacy's rows are: a share of the window, on a page and up to 500px in an email", () => {
      const email = <Email contentWidth="80%"><Row>{cell}</Row></Email>;
      expect(tree(email).props?.width).toBe(500);
      const name = (tree(email).children as TreeNode[])[0].compat?.className;
      expect(css(email)).toContain(`.${name} > table { max-width: min(500px, 80%) !important; min-width: 320px !important; }`);
      // All of the window is its 500px.
      expect((tree(<Email contentWidth="100%"><Row>{cell}</Row></Email>).children as TreeNode[])[0].compat).toBeUndefined();
      const page = <Page contentWidth="80%"><Row>{cell}</Row></Page>;
      const content = find(tree(page), (n) => n.style?.width === "100%")!;
      expect(content.style?.maxWidth).toBeUndefined();
      expect(content.mobile).toEqual({ maxWidth: "100%" });
      expect(css(page)).toContain(`.${content.compat?.className} { max-width: 80%; }`);
    });

    it("takes a phone's whole width on a page narrower than one; an email is at least a phone's 320px", () => {
      expect(find(tree(<Page contentWidth="320px"><Row>{cell}</Row></Page>), (n) => n.style?.maxWidth === 320)?.mobile).toEqual({ maxWidth: "100%" });
      expect(find(tree(<Page contentWidth="600px"><Row>{cell}</Row></Page>), (n) => n.style?.maxWidth === 600)?.mobile).toBeUndefined();
      expect(tree(<Email contentWidth="100px"><Row>{cell}</Row></Email>).props?.width).toBe(320);
    });

    it("draws the body's own link style as legacy does: not at all", () => {
      for (const Root of [Email, Page, Document]) {
        const template = (props: Record<string, unknown>) => <Root {...props}><Row><Column><Paragraph html='<a href="https://example.com">a link</a>' /><Html html='<a href="https://example.com">a link</a>' /></Column></Row></Root>;
        expect(renderToHtml(template({ linkStyle: { linkColor: "#ff0000", linkHoverColor: "#00ff00", linkUnderline: false } }))).toBe(renderToHtml(template({})));
      }
    });

    it("draws the body's text size and weight on a page only, as legacy's stylesheet has them", () => {
      const values = { fontSize: "1.25rem", lineHeight: "2", fontWeight: 700 };
      expect(tree(<Page values={values as never}><Row>{cell}</Row></Page>).style).toMatchObject({ fontSize: 20, lineHeight: 2, fontWeight: 700 });
      for (const Root of [Email, Document]) expect(tree(<Root values={values as never}><Row>{cell}</Row></Root>).style?.fontWeight).toBeUndefined();
      const odd = <Page values={{ fontSize: "120%" } as never}><Row>{cell}</Row></Page>;
      expect(notes(odd).join()).toContain("The body's fontSize");
    });

    it("draws the body's font legacy doesn't read in the browser's, in an email; on a page in its default; and says so", () => {
      const template = (Root: typeof Email) => <Root values={{ fontFamily: "Georgia, serif" } as never}><Row>{cell}</Row></Root>;
      expect(tree(template(Email)).style?.fontFamily).toBe("initial");
      expect(tree(template(Page)).style?.fontFamily).toBeUndefined();
      expect(notes(template(Email)).join()).toContain("The body's font");
    });

    it("sits content to the side it's aligned to", () => {
      expect((tree(<Email contentAlign="right"><Row>{cell}</Row></Email>).children as TreeNode[])[0].compat?.align).toBe("right");
      expect((tree(<Email contentAlign="center"><Row>{cell}</Row></Email>).children as TreeNode[])[0].compat).toBeUndefined();
      const band = find(tree(<Page contentAlign="left"><Row>{cell}</Row></Page>), (n) => n.style?.alignItems !== undefined);
      expect(band?.style?.alignItems).toBe("start");
      expect(renderToHtml(<Email contentAlign="left"><Row>{cell}</Row></Email>)).toContain('align="left"');
    });

    it("keeps an email service's <%name%> tag in the preview text for it to fill in", () => {
      const html = renderToHtml(<Email previewText="Hi <%name%> & <b>you</b>"><Row>{cell}</Row></Email>);
      expect(html).toContain("Hi <%name%> &amp; &lt;b&gt;you&lt;/b&gt;&#847;");
      expect(tree(<Email previewText="Hi you"><Row>{cell}</Row></Email>).compat).toBeUndefined();
    });

    it("draws markup and text among the rows where they are, across an email's window", () => {
      const template = <Email>{"Before"}<Row>{cell}</Row><section>After</section></Email>;
      const [before, row, after] = tree(template).children as TreeNode[];
      expect(before).toMatchObject({ type: "Raw", props: { html: "Before" }, compat: { wide: true } });
      expect(row.type).toBe("Section");
      expect(after).toMatchObject({ type: "Raw", props: { html: "<section>After</section>" }, compat: { wide: true } });
      expect(renderToHtml(template)).toContain("<tr><td>Before</td></tr>");
      // What's only white space is nothing.
      expect((tree(<Email>{" "}<Row>{cell}</Row></Email>).children as TreeNode[]).map((c) => c.type)).toEqual(["Section"]);
      // A page's are in its stack, a printed document's in the font's own line height.
      expect(find(tree(<Page>{"Before"}<Row>{cell}</Row></Page>), (n) => n.type === "Raw")?.props?.html).toBe("Before");
      expect(find(tree(<Document>{"Before"}<Row>{cell}</Row></Document>), (n) => n.type === "Raw")?.props?.html).toBe('<div style="line-height:normal">Before</div>');
    });

    it("gives markup around rows a table of its own for them in an email", () => {
      const template = <Email><div className="wrap"><Row>{cell}</Row></div></Email>;
      const [open, row, close] = tree(template).children as TreeNode[];
      expect(open).toMatchObject({ props: { html: '<div class="wrap">' }, compat: { wide: "open" } });
      expect(row.type).toBe("Section");
      expect(close).toMatchObject({ props: { html: "</div>" }, compat: { wide: "close" } });
      const html = renderToHtml(template);
      expect(html).toMatch(/<tr><td><div class="wrap"><table[^>]*width="100%">/);
      expect(html).toContain("</table></div></td></tr>");
      expect(find(tree(<Document><div className="wrap"><Row>{cell}</Row></div></Document>), (n) => n.type === "Raw")?.props?.html).toBe('<div style="line-height:normal"><div class="wrap">');
    });

    it("draws a block or a Column among the rows, as today's Body renders it", () => {
      const template = <Page><Paragraph>Loose block</Paragraph><Row>{cell}</Row></Page>;
      expect(find(tree(template), (n) => n.type === "Raw")?.props?.html).toContain("Loose block");
    });

    it("draws text in a column where it is, among its blocks", () => {
      const template = <Email><Row><Column>First<Paragraph>A</Paragraph>{"Last"}</Column></Row></Email>;
      expect((columnOf(template).children as TreeNode[]).map((c) => (c.type === "Raw" ? c.props?.html : c.type))).toEqual(["First", "Paragraph", "Last"]);
    });

    it("draws text in a row beside its columns, as a cell of an email's as wide as its longest word, kept apart by a page's", () => {
      const email = <Email><Row>Text{cell}</Row></Email>;
      expect(rowOf(email).compat?.stretch).toBe(true);
      expect((rowOf(email).children as TreeNode[]).map((c) => c.type)).toEqual(["Raw", "Column"]);
      expect((rowOf(email).children as TreeNode[])[1].style?.width).toBe("100%");
      const page = <Page><Row>{cell}Text</Row></Page>;
      const [column, text] = rowOf(page).children as TreeNode[];
      expect(css(page)).toContain(`.${text.compat?.className} { flex: 0 1 auto !important; min-width: auto !important; }`);
      expect(css(page)).toContain(`.${column.compat?.className} { flex-shrink: 0 !important; }`);
    });

    it("leaves other markup in a Row out, as legacy, and says so", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      try {
        expect((rowOf(<Page><Row><div>Markup</div>{cell}</Row></Page>).children as TreeNode[]).map((c) => c.type)).toEqual(["Column"]);
        // (Said by renderToJson, which the lowering reads.)
        expect(warn.mock.calls.join()).toContain("is not a valid Row child");
      } finally {
        warn.mockRestore();
      }
    });

    it("gives an id a template's frame or block has whatever it holds, as legacy writes it", () => {
      const template = <Email><Row values={{ _meta: { htmlID: "r.1" } } as never}><Column values={{ _meta: { htmlID: "c:1" } } as never}><Paragraph values={{ _meta: { htmlID: "p/1" } } as never}>A</Paragraph></Column></Row></Email>;
      const html = renderToHtml(template);
      for (const id of ["r.1", "c:1", "p/1"]) expect(html).toContain(`id="${id}"`);
      expect(find(tree(template), (n) => n.id === "c:1")?.compat?.anyId).toBe(true);
      expect(find(tree(<Email><Row><Column values={{ _meta: { htmlID: "plain" } } as never}><Paragraph>A</Paragraph></Column></Row></Email>), (n) => n.id === "plain")?.compat).toBeUndefined();
    });

    it("writes each rule of a template the same way every time", () => {
      const template = <Page><Row padding="1em"><Column padding="2em"><Paragraph>A</Paragraph></Column></Row></Page>;
      expect(renderToHtml(template)).toBe(renderToHtml(template));
    });
  });

  it("writes legacy's preview text: its first 150 characters, none where it's only white space", () => {
    const preview = (text: string) => tree(<Email previewText={text}><Row><Column><Paragraph>A</Paragraph></Column></Row></Email>).props?.previewText;
    expect(preview("A".repeat(200))).toBe("A".repeat(150));
    expect(preview("Hi there")).toBe("Hi there");
    expect(preview("   ")).toBeUndefined();
  });

  it("hides only by the overrides legacy reads", () => {
    // A flat hideDesktop in a block's values hides nothing in legacy.
    const block = find(tree(<Page><Row><Column><Paragraph values={{ hideDesktop: true } as never}>A</Paragraph></Column></Row></Page>), (n) => n.type === "Paragraph");
    expect(block?.hidden).toBeUndefined();
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
