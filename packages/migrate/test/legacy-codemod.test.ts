/**
 * The codemod from today's components to the new ones (`--from elements`): what each of today's components becomes,
 * and what's reported where the new template may draw differently. main's examples, migrated and compared with main in
 * Chromium, are in legacy-examples.test.ts and the Storybook comparison gate.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { inlineHtml } from "../src/legacy/html";
import { migrateElements } from "../src/legacy/codemod";
import { main, type Io } from "../src/cli";

const migrate = (body: string, imports = "Email, Row, Column, ColumnLayouts, Heading, Paragraph, Button, Image, Divider, Social, Menu, Html") =>
  migrateElements(`import { ${imports} } from "@unlayer/react-elements";\n${body}`);
/** The code without its spacing, to look for a piece of it whatever the formatting. */
const squash = (code: string) => code.replace(/\s+/g, "");

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

  it("rewrites today's JSX inside expressions (a map, a condition) in place", async () => {
    const { code } = await migrate(`export const T = ({ items, footer }: { items: string[]; footer: boolean }) => <Email>{items.map((item) => <Row key={item}><Column><Paragraph>{item}</Paragraph></Column></Row>)}{footer && <Row><Column><Divider /></Column></Row>}</Email>;`);
    const flat = squash(code);
    expect(flat).toContain("{items.map((item)=>(<Section><Paragraph");
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

  it("carries phone settings over, today's containerPadding as the padding", async () => {
    const { code } = await migrate(`export const T = () => <Email><Row><Column padding="36px 40px" mobile={{ padding: "24px 20px" }}><Heading mobile={{ fontSize: 30, textAlign: "center", containerPadding: "4px 0" }}>Hi</Heading></Column></Row></Email>;`);
    const flat = squash(code);
    expect(flat).toContain('mobile={{padding:"24px20px"}}');
    expect(flat).toContain('mobile={{padding:"4px0",fontSize:30,textAlign:"center"}}');
  });

  it("leaves a component with no new one out, loudly: a comment where it was and a line in the report", async () => {
    const { code, report } = await migrate(`export const T = () => <Email><Row><Column><Html html="<table></table>" /></Column></Row></Email>;`);
    expect(code).toContain("@unlayer/migrate: <Html> isn't migrated");
    expect(report.join("\n")).toMatch(/<Html> has no new component yet/);
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
