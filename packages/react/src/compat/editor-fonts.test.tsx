import { describe, expect, it } from "vitest";
import { Column, Email, Heading, Html, Page, Paragraph, Row, renderToHtml } from "../index";
import { editorFontLinks } from "./editor-fonts";

const SOURCE_SANS = "https://fonts.googleapis.com/css?family=Source+Sans+Pro:400,700";
const design = (body: Record<string, unknown>, ...contents: Array<Record<string, unknown>>) => ({ body: { values: body, rows: [{ columns: [{ contents: contents.map((values) => ({ values })) }] }] } });

describe("the web fonts the editor knows by name", () => {
  it("are read from the body's font, a block's and a text's HTML, each once", () => {
    expect(editorFontLinks(design({ fontFamily: { value: "'Source Sans Pro',sans-serif" } }, { fontFamily: { value: "Source Sans Pro, Arial" } }))).toEqual([{ url: SOURCE_SANS }]);
    expect(editorFontLinks(design({}, { text: '<span style="font-family: Lato, sans-serif">a</span><span style="font-family: &quot;Open Sans&quot;">b</span>' }))).toEqual([{ url: "https://fonts.googleapis.com/css?family=Lato:400,700" }, { url: "https://fonts.googleapis.com/css?family=Open+Sans:400,700" }]);
  });

  it("leave out what it doesn't load: a system font, a font it doesn't know, a font that's a value of something else", () => {
    expect(editorFontLinks(design({ fontFamily: { value: "arial,helvetica,sans-serif" } }, { fontFamily: { value: "Inter, sans-serif" } }, { title: "font-family: Lato" }))).toEqual([]);
    expect(editorFontLinks({ body: {} })).toEqual([]);
  });

  it("are linked as the editor's export links them, out of classic Outlook's view in an email", () => {
    const font = { label: "Source Sans Pro", value: "Source Sans Pro, Arial, sans-serif" };
    const block = <Row><Column><Heading fontFamily={font as never}>A</Heading></Column></Row>;
    expect(renderToHtml(<Email>{block}</Email>)).toContain(`<!--[if !mso]><!--><link href="${SOURCE_SANS}" rel="stylesheet" type="text/css"><!--<![endif]-->`);
    expect(renderToHtml(<Page>{block}</Page>)).toContain(`<link href="${SOURCE_SANS}" rel="stylesheet" type="text/css">`);
    // In a text's own HTML, and once where it's in two places.
    const twice = renderToHtml(<Email fontFamily={font as never}><Row><Column><Paragraph html='<span style="font-family: Source Sans Pro">a</span>' /><Html html="<b>b</b>" /></Column></Row></Email>);
    expect(twice.split(SOURCE_SANS)).toHaveLength(2);
    expect(renderToHtml(<Email><Row><Column><Paragraph>A</Paragraph></Column></Row></Email>)).not.toContain("fonts.googleapis.com");
  });
});
