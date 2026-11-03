/**
 * The codemod from today's components to the new ones (`--from elements`): what each of today's components becomes,
 * and what's reported where the new template may draw differently. main's examples, migrated and compared with main in
 * Chromium, are in legacy-examples.test.ts and the Storybook comparison gate.
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

  it("reports markup it can't write with the new components, and keeps its text", async () => {
    const { code, report } = await migrate(`export const T = () => <Email><Row><Column><Paragraph html="<ul><li>One</li></ul>" /></Column></Row></Email>;`);
    expect(code).toContain('{"One"}');
    expect(report.join("\n")).toMatch(/<ul>, which isn't inline text/);
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
    // 120 of 600 less the Row's 80 and the block's 20: 24%, at most 24% of the 520px column.
    expect(squash(code)).toContain('style={{width:"24%",maxWidth:124.8}}');
    expect(report.join("\n")).toMatch(/120px as 24% of its column, at most 124.8px/);
  });

  it("caps a full-width image at its column less the Row's side padding, as today's do", async () => {
    const { code } = await migrate(`export const T = () => <Email contentWidth="600px"><Row padding="0 48px"><Column><Image src="https://example.com/photo.jpg" width="100%" /></Column></Row></Email>;`);
    expect(squash(code)).toContain('style={{width:"100%",maxWidth:504}}');
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
      <Menu items={[{ text: "Docs", href: "https://example.com/docs" }]} linkColor="#123456" textColor="#999999" separator="|" />
    </Column></Row></Email>;`);
    const flat = squash(code);
    expect(flat).toContain('<Columnstyle={{padding:10,alignItems:"start"}}><Buttonhref="https://example.com"style={{backgroundColor:"#000000"}}>Go</Button>');
    expect(flat).toContain('icons={[{name:"Facebook",href:"https://facebook.com/x"}]}size={24}');
    expect(flat).toContain('style={{color:"#123456",separatorColor:"#999999",fontSize:14}}');
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

  it("leaves a component with no new one out, loudly: a comment where it was and a line in the report", async () => {
    const { code, report } = await migrate(`export const T = () => <Email><Row><Column><Html html="<table></table>" /></Column></Row></Email>;`);
    expect(code).toContain("@unlayer/migrate: <Html> isn't migrated");
    expect(report.join("\n")).toMatch(/<Html> has no new component yet/);
  });

  it("leaves a component with no new one out where an expression goes as null, so the template still renders", async () => {
    const { code, report } = await migrate(
      `function Legal() { return <Html html="<b>Terms</b>" />; }
export const T = ({ show }: { show: boolean }) => <Email>{show && <Html html="<b>x</b>" />}{show ? <Video /> : null}<Legal /></Email>;`,
      "Email, Html, Video"
    );
    expect(code).toMatch(/show && \/\* @unlayer\/migrate: <Html> isn't migrated: [^*]*\*\/ null/);
    expect(code).toMatch(/return \/\* @unlayer\/migrate: <Html> isn't migrated: [^*]*\*\/ null;/);
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
    expect(squashed).toContain('{text:"Home",href:{href:"/",target:"_self"}},{text:"Top",href:"/top"},{text:"Docs",href:"/docs"},]');
    expect(squashed).toContain('items={[{text:"Blog",href:{href:"/blog",target:"_blank"}}]}');
    expect(report.filter((line) => !line.includes("today's Menu puts a space"))).toEqual([
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
    expect(report).toContain("line 8: its phone padding is left out: the new Menu's links keep their padding on phones");
    expect(errors(code)).toEqual([]);
  });

  it("leaves modules that don't import today's components as they are", async () => {
    const source = `import { Button } from "@react-email/components";\nexport const T = () => <Button href="#">Go</Button>;\n`;
    expect((await migrateElements(source)).code).toBe(source);
  });
});

describe("inlineHtml", () => {
  it("decodes entities and keeps the spaces between runs", () => {
    const parsed = inlineHtml("Tom &amp; Jerry <i>and</i> friends");
    expect(parsed).toEqual({ jsx: '{"Tom & Jerry "}<Span style={{ fontStyle: "italic" }}>and</Span>{" friends"}', used: new Set(["Span"]) });
  });

  it("refuses a style a run of text can't take, and markup that isn't closed", () => {
    expect(inlineHtml('<span style="display:block">x</span>')).toEqual({ unsupported: "a style a run of text can't take (display:block)" });
    expect(inlineHtml("<b>x")).toEqual({ unsupported: "<b> isn't closed" });
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
});
