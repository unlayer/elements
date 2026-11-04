/**
 * The codemod from today's components to the new ones (`--from elements`): what each of today's components becomes,
 * and what's reported where the new template may draw differently. The examples, migrated, are in legacy-examples.test.ts.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { afterEach, describe, expect, it } from "vitest";
import { inlineHtml } from "../src/legacy/html";
import { migrateElements } from "../src/legacy/codemod";
import { main, type Io } from "../src/cli";
import { errors } from "./migrated";

const migrate = (body: string, imports = "Email, Row, Column, ColumnLayouts, Heading, Paragraph, Button, Image, Divider, Social, Menu, Html") =>
  migrateElements(`import { ${imports} } from "@unlayer/react-elements";\n${body}`);
/** The code without its spacing, to look for a piece of it whatever the formatting. */
const squash = (code: string) => code.replace(/\s+/g, "");
/** What a module's syntax holds that its file can't (TypeScript in a .jsx file, for one). */
const syntaxErrors = (code: string, fileName: string) =>
  (ts.transpileModule(code, { fileName, reportDiagnostics: true, compilerOptions: { jsx: ts.JsxEmit.Preserve, allowJs: true } }).diagnostics ?? []).map((d) => ts.flattenDiagnosticMessageText(d.messageText, "\n"));

describe("migrateElements", () => {
  it("writes a Document as the new root, with its page's size and orientation", async () => {
    const { code, report } = await migrateElements(`import { Document, Row, Column, Paragraph, PageBreak } from "@unlayer/react-elements";
export const T = () => <Document documentSize="Letter" documentOrientation="landscape" contentWidth="700px"><Row><Column><Paragraph>One</Paragraph><PageBreak /><Paragraph>Two</Paragraph></Column></Row></Document>;`);
    expect(code).toContain('from "@unlayer/react-elements/primitives"');
    expect(code).not.toMatch(/from "@unlayer\/react-elements";/);
    expect(squash(code)).toContain('<Documentsize="Letter"orientation="landscape"');
    expect(code).toContain("<PageBreak />");
    expect(report.join("\n")).toContain("contentWidth is left out");
    expect(errors(code)).toEqual([]);
  });

  it("writes today's Html block in a Column with its padding, as a string or as JSX", async () => {
    const { code, report } = await migrate('export const T = () => <Email><Row><Column><Html html="<b>x</b>" containerPadding="4px" /><Html><i>y</i></Html></Column></Row></Email>;');
    const flat = squash(code);
    expect(flat).toContain('<Htmlhtml="<b>x</b>"/>');
    expect(flat).toContain("<Html><i>y</i></Html>");
    expect(report).toEqual([]);
    expect(errors(code)).toEqual([]);
  });

  it("writes a Button's colors given together as buttonColors", async () => {
    const { code, report } = await migrate('export const T = ({ c }: { c: { color: string; backgroundColor: string } }) => <Email><Row><Column><Button href="https://example.com" buttonColors={{ backgroundColor: "#111111", color: "#eeeeee" }}>A</Button><Button href="https://example.com" buttonColors={c}>B</Button></Column></Row></Email>;');
    expect(code).toContain('backgroundColor: "#111111"');
    expect(code).toContain('color: "#eeeeee"');
    expect(code).toContain("backgroundColor: c.backgroundColor");
    expect(report.join("\n")).not.toContain("buttonColors");
  });

  it("leaves a Table's hidden header and footer hidden, and says that cells from code are written as text", async () => {
    const { code, report } = await migrate(`const hidden = { enableHeader: false, enableFooter: false, table: { headers: [{ cells: [{ text: "Secret head" }] }], rows: [{ cells: [{ text: "Shown" }] }], footers: [{ cells: [{ text: "Secret foot" }] }] } };
const shown = { enableFooter: true, table: { rows: [{ cells: [{ text: "Body" }] }], footers: [{ cells: [{ text: "Foot" }] }] } };
export const T = ({ head = true, rows = [["x"]] }: { head?: boolean; rows?: string[][] }) => <Email><Row><Column>
      <Table values={hidden} />
      <Table values={shown} />
      <Table headers={["A"]} enableHeader={head} data={rows} />
    </Column></Row></Email>;`, "Email, Row, Column, Table");
    // (The constants stay as they are: what matters is what the template writes.)
    const written = code.split("export const T")[1];
    expect(written).not.toContain("Secret");
    expect(written).toContain("Shown");
    expect(written).toContain("Foot");
    expect(written).toMatch(/head\)?\s*&&/);
    expect(report.join("\n")).toContain("its data comes from code: it's written as text");
    expect(errors(code)).toEqual([]);
  });

  it("writes a Table from headers and data, as written or from code, and from values it can read", async () => {
    const { code, report } = await migrate(`const invoice = { table: { headers: [{ cells: [{ text: "Item", width: 80 }, { text: "Price", width: 20, textAlign: "right" }] }], rows: [{ cells: [{ text: "Shirt" }, { text: "$48.00", textAlign: "right" }] }] } };
export const T = ({ rows = [["x"]] }: { rows?: string[][] }) => <Email><Row><Column>
      <Table headers={["A", "B"]} data={[["1", "2"]]} />
      <Table headers={["C"]} data={rows} />
      <Table values={invoice} headerBackgroundColor="#f6f8fa" contentColor="#1a1f36" />
    </Column></Row></Email>;`, "Email, Row, Column, Table");
    const flat = squash(code);
    expect(flat).toContain("<TableRowheader");
    expect(flat).toContain(">A</TableCell>");
    expect(code).toContain("rows.map(");
    expect(code).toContain('"80%"');
    expect(code).toContain('backgroundColor: "#f6f8fa"');
    expect(code).toContain('color: "#1a1f36"');
    expect(code).toContain("$48.00");
    expect(report.join("\n")).not.toContain("isn't migrated");
    expect(errors(code)).toEqual([]);
  });

  it("keeps a root's language", async () => {
    const { code, report } = await migrate('export const T = () => <Email lang="es"><Row><Column><Paragraph>Hola</Paragraph></Column></Row></Email>;');
    expect(code).toContain('lang="es"');
    expect(report.join("\n")).not.toContain("lang");
    const page = await migrate('export const T = ({ language }) => <Page lang={language}><Row><Column><Paragraph>Hola</Paragraph></Column></Row></Page>;', "Page, Row, Column, Paragraph");
    expect(page.code).toContain("lang={language}");
  });

  it("takes a value in markup out of the call that escapes it, keeping what the call held together", async () => {
    const { code } = await migrate('export const T = ({ name }) => <Email><Row><Column><Paragraph html={`<b>${escapeHtml(name || "Guest") + ", welcome"}</b> ${htmlText(name)} ${escapeHtml(a ? b : c)}`} /></Column></Row></Email>;');
    expect(code).toContain('(name || "Guest") + ", welcome"');
    expect(code).toContain("{name}");
    expect(code).toContain("{a ? b : c}");
    expect(code).not.toMatch(/htmlText|escapeHtml/);
  });

  it("writes a radius as the new components take it, keeps links from code, and a Button's new window", async () => {
    const { code, report } = await migrateElements(`import { Email, Row, Column, Paragraph, Button } from "@unlayer/react-elements";
export const T = ({ url }: { url: string }) => (
  <Email><Row><Column borderRadius="8px 8px 0px 0px">
    <Paragraph html={\`<a\${htmlAttribute("href", url)} style="color:#00f;text-decoration-line:underline" target="_blank">Link</a>\`} />
    <Button href="https://example.com" borderRadius="0.375rem" lineHeight="normal">Go</Button>
    <Button href={url} target="_self">Stay</Button>
  </Column></Row></Email>
);`);
    expect(code).toMatch(/borderRadius: \[8, 8, 0, 0\]/);
    expect(code).toMatch(/borderRadius: 6\b/);
    expect(code).toContain('lineHeight: "normal"');
    expect(code).toMatch(/<Link\s+href=\{\{ href: url, target: "_blank" \}\}/);
    expect(code).toContain('textDecoration: "underline"');
    expect(code).toMatch(/href=\{\{\s*href: "https:\/\/example\.com",\s*target: "_blank",?\s*\}\}/);
    expect(code).toMatch(/href=\{\{ href: url, target: "_self" \}\}/);
    expect(report.join("\n")).not.toContain("without an href");
    const computed = await migrateElements(`import { Email, Row, Column } from "@unlayer/react-elements";
export const T = ({ cells }: { cells: number[] }) => <Email><Row cells={cells}><Column /></Row></Email>;`);
    expect(computed.report.join("\n")).not.toContain("Columns are written one under another");
    expect(computed.code).toContain("<SharedRow shares={cells}>");
    expect(computed.code).toContain("function SharedRow(");
    expect(computed.code).toMatch(/import \{[^}]*\bRow\b[^}]*\} from "@unlayer\/react-elements\/primitives"/);
    expect(computed.code).not.toMatch(/import \{[^}]*SharedRow/);
    const layout = await migrateElements(`import { Email, Row, Column } from "@unlayer/react-elements";
export const T = ({ chosen }: { chosen: { cells: number[] } }) => <Email><Row layout={chosen}><Column /></Row></Email>;`);
    expect(layout.report.join("\n")).toContain("Columns are written one under another");
  });

  it("writes markup inside a value with the components, its values unescaped", async () => {
    const { code, report } = await migrate(`export const T = ({ note = "n", items = ["i"], name = "m" }: { note?: string; items?: string[]; name?: string }) => <Email><Row><Column>
      <Paragraph html={\`\${note ? \`<em>\${htmlText(note)}</em>\` : ""} and \${items.map((item) => \`<b>\${htmlText(item)}</b>\`).join("")}\`} />
      <Paragraph html={\`\${name ? \`\${htmlText(name)}<br/>\` : ""}\${note ? \`<em>\${htmlText(note)}</em>\` : ""}\`} />
      <Paragraph html={\`\${htmlText(note ? "it&apos;s kept" : "")} as it is\`} />
    </Column></Row></Email>;`);
    const flat = squash(code);
    expect(flat).toContain('{note?(<><Spanstyle={{fontStyle:"italic"}}>{note}</Span></>):("")}');
    expect(flat).toContain("{items.map((item,index)=>(<Fragmentkey={index}><Spanstyle={{fontWeight:700}}>{item}</Span></Fragment>))}");
    expect(code).toMatch(/import \{ Fragment \} from "react";/);
    expect(flat).toContain("{name?(<>{name}<LineBreak/></>):");
    expect(code).toContain('"it&apos;s kept"');
    expect(code).not.toMatch(/htmlText|\.join\(/);
    expect(report).toEqual([]);
    expect(errors(code)).toEqual([]);
  });

  it("reads only what's shown as markup: a comparison's string stays a string", async () => {
    const { code } = await migrate(`export const T = ({ carrier = "AT&T" }: { carrier?: string }) => <Email><Row><Column>
      <Paragraph html={\`<b>\${carrier === "AT&T" ? "Carrier invoice" : "Other <i>invoice</i>"}</b>\`} />
    </Column></Row></Email>;`);
    expect(code).toContain('carrier === "AT&T"');
    expect(squash(code)).toContain('<Spanstyle={{fontStyle:"italic"}}>invoice</Span>');
    expect(errors(code)).toEqual([]);
  });

  it("uses the names a template already has for what it needs from React, and others where it uses those for something else", async () => {
    const list = (imports: string, more = "") => migrateElements(`import { Email, Row, Column, Paragraph } from "@unlayer/react-elements";
${imports}${more}
export const T = ({ items = ["a"] }: { items?: string[] }) => <Email><Row><Column><Paragraph html={\`\${items.map((item) => \`<b>\${htmlText(item)}</b>\`).join("")}\`} /></Column></Row></Email>;`);
    const already = await list('import { Fragment } from "react";\n');
    expect(already.code.match(/\bFragment\b[^\n]*from "react"/g)).toHaveLength(1);
    expect(errors(already.code)).toEqual([]);
    const own = await list("", 'const Fragment = "mine"; export const other = Fragment;\n');
    expect(own.code).toContain("Fragment as ReactFragment");
    expect(own.code).toContain("<ReactFragment key={index}>");
    expect(errors(own.code)).toEqual([]);
  });

  it("writes lengths in rem, em and following the window as the px the new components take", async () => {
    const { code } = await migrate(`export const T = () => <Email><Row><Column mobile={{ padding: "0px calc(56px - 2.5vw) 32px calc(8px - 3.75vw)" }}>
      <Paragraph fontSize="0.875rem" letterSpacing="-0.05em">A</Paragraph>
      <Paragraph html='<span style="font-size:0.875rem;letter-spacing:-0.05em">B</span> <span style="letter-spacing:0.1em">C</span>' />
    </Column></Row></Email>;`);
    expect(code).toContain('padding: "0px 47px 32px 0px"');
    expect(code).toContain("fontSize: 14");
    expect(code).toContain("letterSpacing: -0.7");
    expect(code).toContain('fontSize: "14px"');
    expect(code).toContain('letterSpacing: "-0.7px"');
    expect(code).toContain('letterSpacing: "1.6px"');
    expect(errors(code)).toEqual([]);
  });

  it("keeps a link from code on an Image", async () => {
    const { code, report } = await migrate(`export const T = ({ social }: { social: { href: string } }) => <Email><Row><Column><Image src="https://example.com/a.png" action={social.href} /></Column></Row></Email>;`);
    expect(squash(code)).toContain('<Linkhref={{href:social.href,target:"_blank"}}>');
    expect(report.join("\n")).not.toContain("action");
  });

  it("keeps markup the migration kept as it renders, as an Html block of that JSX", async () => {
    const { code, report } = await migrate(`function KeptHtml({ children }: { children: React.ReactNode; containerPadding?: string }) { return <>{children}</>; }
KeptHtml.displayName = "Html";
export const T = ({ name }: { name: string }) => <Email><Row><Column>
      <KeptHtml containerPadding="16px 0px"><div style={{ color: "#333333" }}><b>{name}</b></div></KeptHtml>
    </Column></Row></Email>;`);
    const flat = squash(code);
    expect(flat).toContain('<Columnstyle={{padding:"16px0px"}}><Html><divstyle={{color:"#333333"}}><b>{name}</b></div></Html></Column>');
    expect(report).toEqual([]);
  });

  it("keeps html with what a run of text can't hold as an Html block, with its text's styles", async () => {
    const { code, report } = await migrate(`export const T = ({ name }: { name: string }) => <Email><Row><Column>
      <Paragraph color="#123456" html={\`<ul><li>\${htmlText(name)}</li></ul>\`} />
      <Paragraph html='Logo <img src="https://example.com/logo.png" alt="Logo"> here' />
    </Column></Row></Email>;`);
    expect(code).toContain("<Html html={`<ul><li>${htmlText(name)}</li></ul>`}");
    expect(code).toContain('color: "#123456"');
    expect(code).toContain("logo.png");
    expect(code).not.toContain("<Paragraph");
    expect(report).toEqual([]);
  });

  it("keeps boxes in a line apart, as words, and as an Html block where it can", async () => {
    expect(inlineHtml('<span style="display:inline-block">A</span><span style="display:inline-block">B</span>').jsx).toContain('{" "}');
    const { code } = await migrate(`export const T = ({ places }: { places: string[] }) => <Email><Row><Column>
      <Paragraph html={\`\${(places ?? []).map((place) => \`<p style="display:inline-block;padding:4px;color:#ff0000">\${htmlText(place)}</p>\`).join("")}\`} />
    </Column></Row></Email>;`);
    expect(squash(code)).toContain("<Htmlhtml=");
    expect(code).toContain("display:inline-block;padding:4px");
  });

  it("keeps a Button with no background transparent, where the new one has a color of its own", async () => {
    const { code } = await migrate('export const T = () => <Email><Row><Column><Button href="https://example.com" backgroundColor="transparent">Go</Button></Column></Row></Email>;');
    expect(code).toContain('backgroundColor: "transparent"');
    expect(errors(code)).toEqual([]);
  });

  it("imports the new components it uses from /primitives, and keeps today's other exports where they were", async () => {
    const { code, report } = await migrateElements(`import { Email, Row, Column, Paragraph, renderToHtml } from "@unlayer/react-elements";
export const html = () => renderToHtml(<Email><Row><Column><Paragraph>Hi</Paragraph></Column></Row></Email>);`);
    expect(code).toContain('import { Email, Paragraph, Section } from "@unlayer/react-elements/primitives";');
    expect(code).toContain('import { renderToHtml } from "@unlayer/react-elements";');
    expect(report.join("\n")).toMatch(/renderToHtml is today's API/);
  });

  it("writes out the defaults today's components draw that the new ones don't share", async () => {
    const { code } = await migrate(`export const T = () => <Email><Row><Column><Heading>Title</Heading><Paragraph>Body</Paragraph></Column></Row></Email>;`);
    const flat = squash(code);
    // The email's width, color and font; a Heading's 22px at 140%, not bold; a Paragraph's 14px at 140%; 10px around each.
    expect(flat).toContain('<Emailwidth={500}style={{color:"#000000",fontFamily:"arial,helvetica,sans-serif"}}>');
    expect(flat).toContain('<Headingstyle={{padding:10,fontSize:22,fontWeight:400,lineHeight:"140%"}}>');
    expect(flat).toContain('<Paragraphstyle={{padding:10,fontSize:14,lineHeight:"140%"}}>');
  });

  it("reads a heading's level, an em letter spacing in px, and keeps the template's constants by name", async () => {
    const { code } = await migrate(`const INK = "#111111";
export const T = () => <Email contentWidth="600px"><Row><Column><Heading headingType="h3" fontSize="20px" letterSpacing="0.05em" color={INK}>Hi</Heading></Column></Row></Email>;`);
    const flat = squash(code);
    expect(flat).toContain("<Emailwidth={600}");
    expect(flat).toContain("<Headinglevel={3}");
    expect(flat).toContain("fontSize:20");
    expect(flat).toContain("letterSpacing:1");
    expect(flat).toContain("color:INK");
  });

  it("turns a Paragraph's html into Span, Link and LineBreak, expressions in a template literal included", async () => {
    const { code, report } = await migrate(`export const T = ({ name, url }: { name: string; url: string }) => <Email><Row><Column>
      <Paragraph html={\`Hi <b>\${name}</b>,<br/>see <a href="\${url}" style="color:#ff0000">this</a>\`} />
    </Column></Row></Email>;`);
    const flat = squash(code);
    expect(code).toContain('{"Hi "}');
    expect(flat).toContain('<Spanstyle={{fontWeight:700}}>{name}</Span>,<LineBreak/>{"see"}');
    expect(flat).toContain('<Linkhref={url}style={{color:"#ff0000"}}>this</Link>');
    expect(report).toEqual([]);
  });

  it("writes html's paragraphs and blocks as lines, its entities decoded and its links as Links, and names each thing it leaves out", async () => {
    const { code, report } = await migrate(`export const T = () => <Email><Row><Column>
      <Paragraph html='<p>First line.</p><p>Second &amp; last, <a href="https://example.com" target="_blank">link</a></p>' />
      <Paragraph html='Logo here<sup>1</sup>, <font color="red">red</font>' />
      <Paragraph html="<div>One</div><div>Two</div>" />
    </Column></Row></Email>;`);
    const flat = squash(code);
    expect(code).toContain('{"Second & last, "}');
    expect(flat).toContain('Firstline.<LineBreak/><LineBreak/>{"Second&last,"}<Linkhref={{href:"https://example.com",target:"_blank"}}>link</Link>');
    expect(flat).toContain('Logohere<Spanstyle={{verticalAlign:"super"}}>1</Span>,red</Paragraph>');
    expect(flat).toContain("One<LineBreak/>Two");
    expect(report).toEqual([
      "line 3: its html's paragraphs (<p>) are lines a blank line apart: the 1em today's draw above and below each is left out",
      "line 4: its html's <font> is left out, its text kept",
    ]);
    expect(errors(code)).toEqual([]);
  });

  it("writes what today's draw of a text block: a Paragraph's children, else its text (as text), else its html; a Heading's or a Button's text (as markup), else its children", async () => {
    const { code, report } = await migrate(
      `export const T = ({ note }: { note?: string }) => <Email><Row><Column>
      <Paragraph html="<b>Not drawn</b>">From children</Paragraph>
      <Paragraph text="Tom &amp; <b>Jerry</b>" html="<i>Not drawn</i>" />
      <Paragraph html="<b>Only where there's no note</b>">{note}</Paragraph>
      <Heading text="<b>Bold</b> title" html="<i>Not drawn</i>">Not drawn</Heading>
      <Button href="#" text="Go &amp; see">Not drawn</Button>
    </Column></Row></Email>;`,
      "Email, Row, Column, Heading, Paragraph, Button"
    );
    const flat = squash(code);
    expect(flat).toContain(">Fromchildren</Paragraph>");
    // Today's draw a Paragraph's text as it is: its markup shows, and so does its entity.
    expect(code).toContain('{"Tom &amp; <b>Jerry</b>"}');
    expect(flat).toContain(">{note}</Paragraph>");
    expect(flat).toContain('<Spanstyle={{fontWeight:700}}>Bold</Span>{"title"}</Heading>');
    expect(flat).toContain(">Go&see</Button>");
    expect(code).not.toContain("Not drawn");
    expect(report).toEqual([
      "line 3: its html isn't drawn by today's Paragraph, which draws its children: it's left out",
      "line 4: its html isn't drawn by today's Paragraph, which draws its text: it's left out",
      "line 5: its html is drawn by today's Paragraph only where its children are undefined: it's left out",
      "line 6: its children aren't drawn by today's Heading, which draws its text: they're left out",
      "line 6: its html isn't drawn by today's Heading, which draws its text: it's left out",
      "line 7: its children aren't drawn by today's Button, which draws its text: they're left out",
    ]);
    expect(errors(code)).toEqual([]);
  });

  it("makes a Row a band across the email: its top and bottom padding the Section's, its sides (outside the content) dropped", async () => {
    const { code } = await migrate(`export const T = () => <Email><Row backgroundColor="#eeeeee" padding="20px 40px 8px"><Column><Paragraph>Hi</Paragraph></Column></Row></Email>;`);
    expect(squash(code)).toContain('<Sectionstyle={{backgroundColor:"#eeeeee",padding:[20,0,8,0]}}><Paragraph');
  });

  it("gives each Column its share of a layout, and draws a line every Column has along the Row (each Column's on phones)", async () => {
    const { code, report } = await migrate(`const cell = { padding: "14px 0", borderBottomWidth: "1px", borderBottomStyle: "solid", borderBottomColor: "#dddddd" } as const;
export const T = () => <Email><Row layout={ColumnLayouts.TwoWideNarrow}><Column {...cell}><Paragraph>Item</Paragraph></Column><Column {...cell}><Paragraph>$1</Paragraph></Column></Row></Email>;`);
    const flat = squash(code);
    expect(flat).toContain('<Rowstyle={{border:{bottom:"1pxsolid#dddddd"}}}mobile={{border:{bottom:"none"}}}>');
    expect(flat).toContain('<Columnstyle={{width:"66.67%",padding:"14px0"}}mobile={{border:{bottom:"1pxsolid#dddddd"}}}>');
    expect(flat).toContain('<Columnstyle={{width:"33.33%",padding:"14px0"}}');
    expect(report).toEqual([]);
  });

  it("reports Columns whose borders or backgrounds today's stretch to the Row's height", async () => {
    const { report } = await migrate(`export const T = () => <Email><Row layout={ColumnLayouts.TwoEqual}><Column backgroundColor="#f0f0f0"><Paragraph>A</Paragraph></Column><Column><Paragraph>B</Paragraph><Paragraph>C</Paragraph></Column></Row></Email>;`);
    expect(report.join("\n")).toMatch(/stretch this Row's Columns to its height/);
  });

  it("writes an image's px width as the share of its column today's draw it at, and reports it", async () => {
    const { code, report } = await migrate(`export const T = () => <Email contentWidth="600px"><Row padding="0 40px"><Column><Image src="https://example.com/logo.png" width="120px" alt="Logo" /></Column></Row></Email>;`);
    // 120 of 600 less the block's 20 (the Row's side padding is outside its Columns): 20.69%, at most that of the 600px column.
    expect(squash(code)).toContain('style={{width:"20.69%",maxWidth:124.14}}');
    expect(report.join("\n")).toMatch(/120px as 20.69% of its column, at most 124.14px/);
  });

  it("caps a full-width image at its column, the Row's side padding outside it, as the editor's do", async () => {
    const { code } = await migrate(`export const T = () => <Email contentWidth="600px"><Row padding="0 48px"><Column><Image src="https://example.com/photo.jpg" width="100%" /></Column></Row></Email>;`);
    expect(squash(code)).toContain('style={{width:"100%",maxWidth:600}}');
  });

  it("rewrites today's JSX inside expressions (a map, a condition) in place, an element's key kept", async () => {
    const { code } = await migrate(`export const T = ({ items, footer }: { items: string[]; footer: boolean }) => <Email>{items.map((item) => <Row key={item}><Column><Paragraph>{item}</Paragraph></Column></Row>)}{footer && <Row><Column><Divider /></Column></Row>}</Email>;`);
    const flat = squash(code);
    expect(flat).toContain("{items.map((item)=>(<Sectionkey={item}><Paragraph");
    expect(flat).toContain('{footer&&(<Section><Dividerstyle={{borderTop:"1pxsolid#BBBBBB",padding:10}}/></Section>)}');
  });

  it("maps a Button's alignment, Social's icons and a Menu's colors to the new props", async () => {
    const { code } = await migrate(`export const T = () => <Email><Row><Column>
      <Button href="https://example.com" textAlign="left" backgroundColor="#000000">Go</Button>
      <Social icons={[{ name: "Facebook", url: "https://facebook.com/x" }]} iconSize="24px" />
      <Menu items={[{ text: "Docs", href: "https://example.com/docs" }, { text: "Blog", href: "https://example.com/blog" }]} linkColor="#123456" textColor="#999999" separator="|" />
    </Column></Row></Email>;`);
    const flat = squash(code);
    expect(flat).toContain('<Columnstyle={{padding:10,alignItems:"start"}}><Buttonhref={{href:"https://example.com",target:"_blank"}}style={{backgroundColor:"#000000"}}>Go</Button>');
    expect(flat).toContain('icons={[{name:"Facebook",href:"https://facebook.com/x"}]}size={24}');
    expect(flat).toContain('<Linkhref="https://example.com/docs"style={{color:"#123456",textDecoration:"none"}}>Docs</Link>');
    expect(flat).toContain('style={{flex:"none",padding:[5,15],color:"#999999"}}>{"\\u00a0|"}</Text>');
  });

  it("writes a horizontal menu of known links spaced as today's: a space before each link and separator but the first, separators hidden on phones", async () => {
    const { code } = await migrate(`export const T = ({ links = [{ text: "Home", href: "/" }] }: { links?: Array<{ text: string; href: string }> }) => <Email><Row><Column>
      <Menu items={[{ text: "Docs", href: "/docs" }, { text: "Blog", href: "/blog" }]} separator="·" padding="4px 12px" align="left" />
      <Menu items={[{ text: "Docs", href: "/docs" }, { text: "Blog", href: "/blog" }]} />
      <Menu items={[{ text: "Docs", href: "/docs" }]} layout="vertical" />
      <Menu items={links} />
    </Column></Row></Email>;`);
    const flat = squash(code);
    const link = (href: string, text: string) => `<Textstyle={{flex:"none",padding:"4px12px"}}><Linkhref="${href}"style={{color:"#0068A5",textDecoration:"none"}}>${text}</Link></Text>`;
    expect(flat).toContain(
      '<RowstackOnMobile={false}style={{flexWrap:"wrap",justifyContent:"start",fontSize:14,lineHeight:1.2}}>' +
        link("/docs", "Docs") +
        '<Texthidden={{mobile:true}}style={{flex:"none",padding:"4px12px",color:"#444444"}}>{"\\u00a0·"}</Text>' +
        link("/blog", '{"\\u00a0Blog"}') +
        "</Row>"
    );
    // Without a separator, the space alone; a vertical menu, or links worked out at run time, stay a Menu.
    expect(flat).toContain('<Textstyle={{flex:"none",padding:[5,15]}}><Linkhref="/blog"style={{color:"#0068A5",textDecoration:"none"}}>{"\\u00a0Blog"}</Link></Text></Row>');
    expect(flat).toContain('layout="vertical"');
    expect(flat).toContain("items={links}");
    expect(errors(code)).toEqual([]);
  });

  it("writes JavaScript into a JavaScript module: an alignment read at run time has no TypeScript in it", async () => {
    const source = `import { Email, Row, Column, Button, Social } from "@unlayer/react-elements";
export default function Card({ align }) {
  return <Email><Row><Column><Button href="#" textAlign={align}>Go</Button><Social icons={[]} align={align} /></Column></Row></Email>;
}`;
    const js = await migrateElements(source, { typescript: false });
    expect(syntaxErrors(js.code, "Card.jsx")).toEqual([]);
    expect(squash(js.code)).toContain('alignItems:{left:"start",center:"center",right:"end"}[align]??"start"');
    expect(squash(js.code)).toContain('justifyContent:{left:"start",center:"center",right:"end"}[align]??"start"');
    // TypeScript keeps the cast its types need.
    const tsx = await migrateElements(source);
    expect(squash(tsx.code)).toContain('alignItems:({left:"start",center:"center",right:"end"}asconst)[alignas"left"]??"start"');
  });

  it("carries phone settings over, today's containerPadding as the padding", async () => {
    const { code } = await migrate(`export const T = () => <Email><Row><Column padding="36px 40px" mobile={{ padding: "24px 20px" }}><Heading mobile={{ fontSize: 30, textAlign: "center", containerPadding: "4px 0" }}>Hi</Heading></Column></Row></Email>;`);
    const flat = squash(code);
    expect(flat).toContain('mobile={{padding:"24px20px"}}');
    expect(flat).toContain('mobile={{padding:"4px0",fontSize:30,textAlign:"center"}}');
  });

  it("keeps today's types, and a namespace used for more than its components; the components through it are migrated", async () => {
    const { code, report } = await migrateElements(`import type { EmailProps } from "@unlayer/react-elements";
import { type RowProps, Email } from "@unlayer/react-elements";
import * as E from "@unlayer/react-elements/legacy";
export const html = E.renderToHtml;
export const T = (_: EmailProps & RowProps) => <Email><E.Row><E.Column><E.Paragraph>Hi</E.Paragraph></E.Column></E.Row></Email>;`);
    expect(code).toContain('import type { EmailProps } from "@unlayer/react-elements";');
    expect(code).toContain('import { type RowProps } from "@unlayer/react-elements";');
    expect(code).toContain('import * as E from "@unlayer/react-elements/legacy";');
    expect(squash(code)).toContain('<Emailwidth={500}style={{color:"#000000",fontFamily:"arial,helvetica,sans-serif"}}><Section><Paragraph');
    expect(report).toEqual(["line 3: E stays imported from @unlayer/react-elements/legacy for today's API used through it; its components are migrated"]);
    // A namespace used only for components goes.
    const only = await migrateElements(`import * as E from "@unlayer/react-elements";\nexport const T = () => <E.Email><E.Row layout={E.ColumnLayouts.TwoEqual}><E.Column /><E.Column /></E.Row></E.Email>;`);
    expect(only.code).not.toContain("import * as E");
    expect(squash(only.code)).toContain('<Columnstyle={{width:"50%"}}');
  });

  it("keeps an import the module uses other than as an element, and leaves alone a name the module declares again", async () => {
    const { code, report } = await migrateElements(`import * as E from "@unlayer/react-elements";
import { Email, Row, Column, Paragraph } from "@unlayer/react-elements/legacy";
const Alias = E.Row;
const Plain = Row;
export const T = () => <Email><Row><Column><Paragraph>Hi</Paragraph></Column></Row></Email>;
export const Mine = ({ E }: { E: { Row: () => null } }) => <E.Row />;
export const Other = (Row: () => null) => <Row />;`);
    expect(code).toContain('import * as E from "@unlayer/react-elements";');
    expect(code).toContain('import { Row } from "@unlayer/react-elements/legacy";');
    expect(code).toContain("const Alias = E.Row;");
    expect(code).toContain("const Plain = Row;");
    expect(squash(code)).toContain("<Section><Paragraph");
    // The module's own E and Row, declared again where they're used, aren't today's.
    expect(code).toContain("<E.Row />");
    expect(code).toContain("export const Other = (Row: () => null) => <Row />;");
    expect(report).toEqual([
      "line 1: E stays imported from @unlayer/react-elements for today's API used through it; its components are migrated",
      "line 2: Row stays imported from @unlayer/react-elements/legacy: it's used other than as an element (<Row>), which is all that's migrated",
    ]);
  });

  it("writes one of today's layouts outside a Row's props as its cells, so nothing is left using today's ColumnLayouts", async () => {
    const { code, report } = await migrate(`const layout = ColumnLayouts.TwoWideNarrow;
export const T = () => <Email><Row layout={layout}><Column /><Column /></Row></Email>;`);
    expect(code).not.toContain("ColumnLayouts");
    expect(squash(code)).toContain("constlayout={cells:[2,1]};");
    expect(squash(code)).toContain('<Columnstyle={{width:"66.67%"}}');
    expect(report).toEqual([]);
    // Used other ways, it stays imported, and the Row it can't read is reported.
    const kept = await migrate(`export const T = ({ name }: { name: "TwoEqual" }) => <Email><Row layout={ColumnLayouts[name]}><Column /><Column /></Row></Email>;`);
    expect(kept.code).toContain('import { ColumnLayouts } from "@unlayer/react-elements";');
    expect(kept.report.join("\n")).toMatch(/ColumnLayouts stays imported/);
    expect(kept.report.join("\n")).toMatch(/this Row's layout can't be read \(ColumnLayouts\[name\]\)/);
  });

  it("gives each Column its share of every one of today's layouts", async () => {
    const shares = async (layout: string, columns: number) =>
      [...squash((await migrate(`export const T = () => <Email><Row layout={ColumnLayouts.${layout}}>${"<Column />".repeat(columns)}</Row></Email>;`)).code).matchAll(/width:"([\d.]+%)"/g)].map((m) => m[1]);
    expect(await shares("ThreeNarrowWideNarrow", 3)).toEqual(["25%", "50%", "25%"]);
    expect(await shares("FiveEqual", 5)).toEqual(["20%", "20%", "20%", "20%", "20%"]);
  });

  it("imports a new component under another name where the template has one of its own by that name", async () => {
    const { code } = await migrateElements(`import { Email, Row, Column, Paragraph } from "@unlayer/react-elements";
import Link from "next/link";
function Section({ title }: { title: string }) { return <h2>{title}</h2>; }
export const T = () => <Email><Row><Column><Paragraph html={'See <a href="https://example.com">the docs</a>'} /></Column></Row></Email>;
export const Nav = () => <Link href="/">Home</Link>;`);
    expect(code).toMatch(/import \{\s*Email,\s*Link as ElementsLink,\s*Paragraph,\s*Section as ElementsSection,?\s*\} from "@unlayer\/react-elements\/primitives";/);
    expect(squash(code)).toContain('<ElementsSection><Paragraphstyle={{padding:10,fontSize:14,lineHeight:"140%"}}>{"See"}<ElementsLinkhref="https://example.com">thedocs</ElementsLink></Paragraph></ElementsSection>');
    // The template's own are left as they were.
    expect(code).toContain('<Link href="/">Home</Link>');
    expect(code).toContain("return <h2>{title}</h2>;");
  });

  it("links an Image as today's action does, writes a text direction as dir, and reports a prop it has nothing for", async () => {
    const { code, report } = await migrate(`export const T = () => <Email textDirection="rtl"><Row><Column>
      <Image src="https://example.com/a.png" action="https://example.com/sale" />
      <Image src="https://example.com/b.png" action={{ name: "web", values: { href: "https://example.com/b", target: "_self" } }} />
      <Paragraph textDirection="ltr" values={{ textJson: "{}" }}>Hi</Paragraph>
    </Column></Row></Email>;`);
    const flat = squash(code);
    expect(flat).toContain('<Emailwidth={500}dir="rtl"');
    expect(flat).toContain('<Linkhref={{href:"https://example.com/sale",target:"_blank"}}><Imagesrc="https://example.com/a.png"');
    expect(flat).toContain('<Linkhref={{href:"https://example.com/b",target:"_self"}}><Imagesrc="https://example.com/b.png"');
    expect(flat).toContain('<Paragraphdir="ltr"');
    expect(report).toEqual(["line 5: <Paragraph>'s values isn't migrated: it's left out (the new components have nothing it becomes)"]);
  });

  it("reports an Image's or a Button's alignment on phones, which the new components don't have, and writes none", async () => {
    const { code, report } = await migrate(`export const T = () => <Email><Row><Column>
      <Image src="https://example.com/a.png" textAlign="left" mobile={{ textAlign: "center" }} />
      <Button href="https://example.com" mobile={{ textAlign: "left" }}>Go</Button>
    </Column></Row></Email>;`);
    expect(squash(code)).not.toMatch(/mobile=\{\{[^}]*alignItems/);
    expect(report).toEqual([
      "line 3: its alignment on phones (mobile textAlign) is left out: the new components place a block on phones where it is on desktop",
      "line 4: its alignment on phones (mobile textAlign) is left out: the new components place a block on phones where it is on desktop",
    ]);
  });

  it("leaves a component it doesn't migrate out, loudly: a comment where it was and a line in the report", async () => {
    const { code, report } = await migrate(`export const T = () => <Email><Row><Column><Spacer /></Column></Row></Email>;`, "Email, Row, Column, Spacer");
    expect(code).toContain("@unlayer/migrate: <Spacer> isn't migrated");
    expect(report.join("\n")).toMatch(/<Spacer> isn't migrated: it's left out/);
  });

  it("leaves a component it doesn't migrate out where an expression goes as null, so the template still renders", async () => {
    const { code, report } = await migrate(
      `function Legal() { return <Spacer />; }
export const T = ({ show }: { show: boolean }) => <Email>{show && <Spacer />}{show ? <Video /> : null}<Legal /></Email>;`,
      "Email, Spacer, Video"
    );
    expect(code).toMatch(/show && \/\* @unlayer\/migrate: <Spacer> isn't migrated: [^*]*\*\/ null/);
    expect(code).toMatch(/return \/\* @unlayer\/migrate: <Spacer> isn't migrated: [^*]*\*\/ null;/);
    expect(squash(code)).toContain("{show?null:null}");
    expect(report).toHaveLength(3);
    expect(errors(code, { show: true })).toEqual([]);
  });

  it("writes font weights and a Menu's link targets as the new components take them, so the template validates", async () => {
    const { code, report } = await migrate(`const MORE = [{ text: "Blog", href: "/blog", target: "_blank" }];
export const T = () => (
  <Email>
    <Heading fontWeight="700">Title</Heading>
    <Paragraph html={'<span style="font-weight:600">Bold</span> and <span style="font-weight:bolder">more</span>'} />
    <Button href="#" fontWeight="650">Go</Button>
    <Menu items={[{ text: "Home", href: "/", target: "_self" }, { text: "Top", href: "/top", target: "_top" }, { text: "Docs", href: "/docs" }]} />
    <Menu items={MORE} />
  </Email>
);`);
    const squashed = squash(code);
    expect(squashed).toContain("fontWeight:700,lineHeight");
    expect(squashed).toContain('<Spanstyle={{fontWeight:600}}>Bold</Span>{"and"}<Spanstyle={{fontWeight:700}}>more</Span>');
    expect(squashed).toContain('<Linkhref={{href:"/",target:"_self"}}');
    expect(squashed).toContain('<Linkhref="/top"');
    expect(squashed).toContain('<Linkhref={{href:"/blog",target:"_blank"}}');
    expect(report.filter((line) => !line.includes("written as a Row of its links"))).toEqual([
      "line 7: its fontWeight 650 is 700: the new components take 100 to 900 in hundreds",
      'line 8: a Menu item\'s target "_top" is left out: a link opens in a new window ("_blank") or in its own ("_self")',
      "line 9: MORE's items are written here, each target part of its link",
    ]);
    expect(errors(code)).toEqual([]);
  });

  it("says a computed font weight and computed Menu items are kept as they are, with what the new components take", async () => {
    const { code, report } = await migrate(`export const T = ({ weight, links }: { weight: "700"; links: Array<{ text: string; href: string; target?: string }> }) => (
  <Email>
    <Heading fontWeight={weight}>Title</Heading>
    <Menu items={links} />
  </Email>
);`);
    expect(squash(code)).toContain("fontWeight:weight");
    expect(squash(code)).toContain("items={links}");
    expect(report.filter((line) => !line.includes("today's Menu puts a space"))).toEqual([
      'line 4: its fontWeight is computed (weight): it\'s kept as it is, and the new components take a number from 100 to 900 in hundreds, "normal" or "bold", not a string of digits ("700")',
      "line 5: this Menu's items are computed (links): they're kept as they are, and an item's target is part of its link now ({ text, href: { href, target } }), not a field of its own",
    ]);
  });

  it("carries an icon's target into its link, writes today's placeholder where an Image has no src, and converts line heights", async () => {
    const { code, report } = await migrate(
      `export const T = () => (
  <Email>
    <Social icons={[{ name: "X", url: "https://x.com/acme", target: "_self" }, { name: "Facebook", url: "https://facebook.com/acme" }]} />
    <Image />
    <Image src={undefined} />
    <Paragraph lineHeight="1.5" mobile={{ lineHeight: "2em" }}>Words</Paragraph>
    <Menu items={[{ text: "Home", href: "/" }]} mobile={{ padding: 4 }} />
  </Email>
);`,
      "Email, Social, Image, Paragraph, Menu"
    );
    const squashed = squash(code);
    expect(squashed).toContain('icons={[{name:"X",href:{href:"https://x.com/acme",target:"_self"}},{name:"Facebook",href:"https://facebook.com/acme"},]}');
    expect(squashed.split('<Imagesrc="https://cdn.tools.unlayer.com/image/placeholder.png"/>')).toHaveLength(3);
    expect(squashed).toContain("lineHeight:1.5");
    expect(squashed).toContain("mobile={{lineHeight:2}}");
    expect(report).toContain("line 5: this Image has no src: today's draw their placeholder image, which is written in (give it its own)");
    expect(report).toContain("line 6: this Image has no src: today's draw their placeholder image, which is written in (give it its own)");
    // A menu's phone padding is each of its links' (and separators') on phones, as today's.
    expect(squashed).toContain('<Textstyle={{flex:"none",padding:[5,15]}}mobile={{padding:4}}>');
    expect(report.join("\n")).not.toContain("phone padding is left out");
    expect(errors(code)).toEqual([]);
  });

  it("leaves modules that don't import today's components as they are", async () => {
    const source = `import { Button } from "@react-email/components";\nexport const T = () => <Button href="#">Go</Button>;\n`;
    expect((await migrateElements(source)).code).toBe(source);
    // Today's other API alone, or a component it never draws: nothing is migrated, so nothing is reformatted.
    for (const other of [`import {renderToHtml} from '@unlayer/react-elements'\nexport const send = (email: any) => renderToHtml( email )\n`, `import { Email } from "@unlayer/react-elements";\nexport { Email }\n`]) {
      expect((await migrateElements(other)).code).toBe(other);
    }
  });
});

describe("inlineHtml", () => {
  it("decodes entities and keeps the spaces between runs", () => {
    const parsed = inlineHtml("Tom &amp; Jerry <i>and</i> friends");
    expect(parsed).toEqual({ jsx: '{"Tom & Jerry "}<Span style={{ fontStyle: "italic" }}>and</Span>{" friends"}', used: new Set(["Span"]), dropped: [] });
  });

  it("keeps what a run of text takes of a style and names the rest; draws markup that isn't closed as a browser does", () => {
    // A run shown as a block starts a line of its own, as a browser draws it.
    expect(inlineHtml('<span style="display:block;color:#123456">x</span>')).toEqual({ jsx: '<Span style={{ color: "#123456" }}>x</Span>', used: new Set(["Span"]), dropped: [] });
    expect(inlineHtml('A<a href="https://example.com" style="display:block">B</a>C').jsx).toBe('A<LineBreak /><Link href="https://example.com">B</Link><LineBreak />C');
    expect(inlineHtml('<span style="margin:4px;color:#123456">x</span>').dropped).toEqual(["style margin: 4px (on <span>) is left out: a run of text doesn't take it"]);
    expect(inlineHtml("<b>x")).toEqual({ jsx: "<Span style={{ fontWeight: 700 }}>x</Span>", used: new Set(["Span"]), dropped: [] });
    expect(inlineHtml("a</i> <!-- note --><b>b</b>")).toEqual({ jsx: '{"a "}<Span style={{ fontWeight: 700 }}>b</Span>', used: new Set(["Span"]), dropped: [] });
  });

  it("starts each block's text on a line of its own, a paragraph's a blank line from its neighbors, with no line before the first", () => {
    expect(inlineHtml("<div>A</div><div>B</div>").jsx).toBe("A<LineBreak />B");
    expect(inlineHtml("<p>A</p>\n<p>B</p>").jsx).toBe("A<LineBreak /><LineBreak />B");
    expect(inlineHtml("A<br><p>B</p>").jsx).toBe("A<LineBreak /><LineBreak />B");
    expect(inlineHtml("<p>A</p><ul><li>B</li><li>C</li></ul>").jsx).toBe("A<LineBreak /><LineBreak />B<LineBreak />C");
  });
});

const dirs: string[] = [];
afterEach(() => {
  for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

function project(files: Record<string, string>): string {
  const dir = fs.mkdtempSync(path.join(import.meta.dirname, ".tmp-"));
  dirs.push(dir);
  for (const [file, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    fs.writeFileSync(path.join(dir, file), text);
  }
  return dir;
}
function io(cwd: string): Io & { out: string; err: string } {
  const sink = { cwd, out: "", err: "", stdout: (t: string) => void (sink.out += t), stderr: (t: string) => void (sink.err += t) };
  return sink;
}
const TEMPLATE = `import { Email, Row, Column, Paragraph } from "@unlayer/react-elements";\nexport default function T() { return <Email><Row><Column><Paragraph>Hi</Paragraph></Column></Row></Email>; }\n`;

describe("unlayer-migrate --from elements", () => {
  it("prints one template migrated, writing nothing", async () => {
    const dir = project({ "emails/welcome.tsx": TEMPLATE });
    const sink = io(dir);
    expect(await main(["emails/welcome.tsx", "--from", "elements"], sink)).toBe(0);
    expect(sink.out).toContain('from "@unlayer/react-elements/primitives"');
    expect(fs.readFileSync(path.join(dir, "emails/welcome.tsx"), "utf8")).toBe(TEMPLATE);
  });

  it("writes a .jsx template as JavaScript", async () => {
    const dir = project({ "emails/Card.jsx": `import { Email, Row, Column, Button } from "@unlayer/react-elements";\nexport default function Card({ align }) { return <Email><Row><Column><Button textAlign={align}>Go</Button></Column></Row></Email>; }\n` });
    const sink = io(dir);
    expect(await main(["emails/Card.jsx", "--from", "elements"], sink)).toBe(0);
    expect(sink.out).toContain('from "@unlayer/react-elements/primitives"');
    expect(syntaxErrors(sink.out, "Card.jsx")).toEqual([]);
  });

  it("replaces templates with --write only where git can restore them", async () => {
    const dir = project({ "emails/welcome.tsx": TEMPLATE, "emails/other.ts": "export const x = 1;\n" });
    const refused = io(dir);
    expect(await main(["emails", "--from", "elements", "--write"], refused)).toBe(1);
    expect(refused.err).toMatch(/git couldn't restore these:\n {2}emails\/welcome\.tsx \(not committed\)/);
    expect(fs.readFileSync(path.join(dir, "emails/welcome.tsx"), "utf8")).toBe(TEMPLATE);

    const git = (...args: string[]) => execFileSync("git", ["-c", "user.name=Test", "-c", "user.email=test@example.com", "-c", "commit.gpgsign=false", ...args], { cwd: dir, stdio: "ignore" });
    git("init", "-q");
    git("add", "-A");
    git("commit", "-q", "-m", "templates");
    const sink = io(dir);
    expect(await main(["emails", "--from", "elements", "--write"], sink)).toBe(0);
    expect(sink.out).toContain("emails/welcome.tsx: migrated");
    expect(fs.readFileSync(path.join(dir, "emails/welcome.tsx"), "utf8")).toContain("@unlayer/react-elements/primitives");
    expect(fs.readFileSync(path.join(dir, "emails/other.ts"), "utf8")).toBe("export const x = 1;\n");
  });

  it("takes the modules that import today's components as templates: one that only names the package, passes it on or uses its other API is left as it is, and not listed", async () => {
    const others = {
      "emails/notes.ts": `// Written for "@unlayer/react-elements": import { Email } from "@unlayer/react-elements";\nexport const answer   =   42;\n`,
      "emails/send.ts": `import {renderToHtml} from '@unlayer/react-elements'\nexport const send = (email: any) => renderToHtml( email )\n`,
      "emails/index.ts": `export { Email,Row } from '@unlayer/react-elements'\n`,
    };
    const dir = project({ "emails/welcome.tsx": TEMPLATE, ...others });
    commit(dir);
    const sink = io(dir);
    expect(await main(["emails", "--from", "elements", "--write"], sink)).toBe(0);
    expect(sink.out).toBe("emails/welcome.tsx: migrated\n");
    for (const [file, text] of Object.entries(others)) expect(fs.readFileSync(path.join(dir, file), "utf8")).toBe(text);
  });

  it("migrates templates that import today's components through the project's own modules, by the names those pass them on as", async () => {
    const ui = {
      // Today's components passed on by name (one renamed), and all of them through another module, which has its own Paragraph.
      "emails/ui/index.ts": `export { Email, Row as Band, Column } from "@unlayer/react-elements";\nexport * from "./more";\nexport { Footer } from "./footer";\n`,
      "emails/ui/more.ts": `export * from "@unlayer/react-elements";\nexport const Paragraph = (props: { children?: unknown }) => null;\n`,
      "emails/ui/footer.tsx": `export const Footer = () => null;\n`,
    };
    const dir = project({
      ...ui,
      "emails/welcome.tsx": `import { Email, Band, Column, Heading, Paragraph, Footer } from "./ui";\nexport default function Welcome() { return <Email><Band><Column><Heading>Hi</Heading><Paragraph>Mine</Paragraph><Footer /></Column></Band></Email>; }\n`,
      "emails/digest.tsx": `import * as UI from "./ui";\nexport default function Digest() { return <UI.Email><UI.Band><UI.Column><UI.Heading>News</UI.Heading></UI.Column></UI.Band></UI.Email>; }\n`,
    });
    commit(dir);
    const sink = io(dir);
    expect(await main(["emails", "--from", "elements", "--write"], sink)).toBe(0);
    expect(sink.out).toBe("emails/digest.tsx: migrated\nemails/welcome.tsx: migrated\n");
    const welcome = fs.readFileSync(path.join(dir, "emails/welcome.tsx"), "utf8");
    expect(welcome).toContain('import { Email, Heading, Section } from "@unlayer/react-elements/primitives";');
    // The project's own components stay imported from where they were, and as they were.
    expect(welcome).toContain('import { Paragraph, Footer } from "./ui";');
    expect(squash(welcome)).toMatch(/<Section><Headingstyle=\{\{[^}]*\}\}>Hi<\/Heading><Paragraph>Mine<\/Paragraph><Footer\/><\/Section>/);
    const digest = fs.readFileSync(path.join(dir, "emails/digest.tsx"), "utf8");
    expect(digest).not.toContain("./ui");
    expect(squash(digest)).toContain("<Section><Headingstyle=");
    // The modules that pass today's components on are left as they are.
    for (const [file, text] of Object.entries(ui)) expect(fs.readFileSync(path.join(dir, file), "utf8")).toBe(text);
  });

  it.each([false, true])("keeps a component the project's module exports by name beside `export *` of today's (the named export first: %s)", async (first) => {
    const wildcard = 'export * from "@unlayer/react-elements";';
    const custom = 'export { Paragraph } from "./own";';
    const ui = { "emails/ui.ts": first ? `${custom}\n${wildcard}\n` : `${wildcard}\n${custom}\n`, "emails/own.tsx": "export const Paragraph = () => <p>Required custom disclosure</p>;\n" };
    const dir = project({ ...ui, "emails/welcome.tsx": `import { Email, Row, Column, Paragraph } from "./ui";\nexport default function Welcome() { return <Email><Row><Column><Paragraph /></Column></Row></Email>; }\n` });
    commit(dir);
    const sink = io(dir);
    expect(await main(["emails", "--from", "elements", "--write"], sink)).toBe(0);
    const welcome = fs.readFileSync(path.join(dir, "emails/welcome.tsx"), "utf8");
    // The project's own Paragraph stays imported from its module, and as it was written.
    expect(welcome).toMatch(/import \{ Paragraph \} from "\.\/ui";/);
    expect(welcome).toContain("<Paragraph />");
  });

  it("fails a template that imports today's components through a namespace another module passes on, naming both, instead of skipping it", async () => {
    const dir = project({
      "emails/ui.ts": `export * as E from "@unlayer/react-elements";\n`,
      "emails/welcome.tsx": `import { E } from "./ui";\nexport default function Welcome() { return <E.Email><E.Row><E.Column><E.Paragraph>Hi</E.Paragraph></E.Column></E.Row></E.Email>; }\n`,
    });
    const sink = io(dir);
    expect(await main(["emails", "--from", "elements"], sink)).toBe(2);
    expect(sink.err).toContain("emails/welcome.tsx: couldn't be migrated: it imports today's components as E from ./ui (emails/ui.ts), a namespace of them, which the codemod doesn't follow: import them by name");
  });
});

function commit(dir: string) {
  const git = (...args: string[]) => execFileSync("git", ["-c", "user.name=Test", "-c", "user.email=test@example.com", "-c", "commit.gpgsign=false", ...args], { cwd: dir, stdio: "ignore" });
  git("init", "-q");
  git("add", "-A");
  git("commit", "-q", "-m", "templates");
}
