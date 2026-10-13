import { afterEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { convertSource, verifyConversion } from "../src/index";

const dirs: string[] = [];
afterEach(() => {
  for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

/**
 * A template and the files it imports, migrated as the CLI migrates it (imports read from the folder): the migrated
 * code's type errors that the original doesn't have, and both templates, to render.
 */
async function migrate(files: Record<string, string>, entry: string) {
  const dir = fs.mkdtempSync(path.join(import.meta.dirname, ".tmp-"));
  dirs.push(dir);
  for (const [name, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, name)), { recursive: true });
    fs.writeFileSync(path.join(dir, name), text);
  }
  const original = path.join(dir, entry);
  const file = original.replace(/\.tsx$/, ".migrated.tsx");
  const loadModule = (specifier: string, from: string) => {
    const target = path.resolve(path.dirname(from), specifier);
    for (const candidate of [target, `${target}.tsx`, `${target}.ts`]) if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return { fileName: candidate, source: fs.readFileSync(candidate, "utf8") };
    return undefined;
  };
  const conversion = await convertSource(files[entry], { fileName: file, loadModule });
  fs.writeFileSync(file, conversion.code);
  const options = { noEmit: true, jsx: ts.JsxEmit.ReactJSX, strict: true, noUnusedLocals: true, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, target: ts.ScriptTarget.ES2022, skipLibCheck: true, types: ["react"] };
  const program = ts.createProgram([original, file], options);
  const errors = (of: string) => ts.getPreEmitDiagnostics(program).filter((d) => d.file?.fileName === of).map((d) => `TS${d.code}: ${ts.flattenDiagnosticMessageText(d.messageText, " ")}`);
  const left = errors(original);
  const added = errors(file).filter((e) => {
    const at = left.indexOf(e);
    if (at >= 0) left.splice(at, 1);
    return at < 0;
  });
  const { default: Original } = await import(original);
  const { default: Migrated } = await import(file);
  return { conversion, added, originalErrors: errors(original), Original, Migrated };
}

const texts = (design: any): string[] =>
  design.body.rows.flatMap((row: any) => row.columns.flatMap((column: any) => column.contents.filter((c: any) => c.type === "text").map((c: any) => String(c.values.text ?? ""))));

describe("code written by inlining components", () => {
  // Each pattern below is what inlining a component with its props written in gives: a prop left out or given as a
  // literal in a condition, an empty default list, a component's children tested or passed to a function, a prop
  // given `cond ? {…} : undefined` and read after a test, a type the template imports too.
  const files = {
    "components/footer.tsx": `import { Section, Text, Link } from "@react-email/components";
interface FooterLink { label: string; href: string }
export function Footer({ reason, settingsUrl, marketing, links = [] }: { reason?: string; settingsUrl?: string; marketing?: boolean; links?: FooterLink[] }) {
  return (
    <Section>
      {reason && <Text>{reason}</Text>}
      {(marketing || settingsUrl) && (
        <Text>Not for you? <Link href={marketing ? "https://example.com/prefs" : settingsUrl}>Change your settings</Link></Text>
      )}
      {links.length > 0 ? <Text>{links.map((l) => <Link key={l.href} href={l.href}>{l.label}</Link>)}</Text> : null}
    </Section>
  );
}
`,
    "components/card.tsx": `import type { ReactNode } from "react";
import { Section, Text } from "@react-email/components";
export function Card({ title, children }: { title: string; children?: ReactNode }) {
  return <Section><Text style={{ fontWeight: 700 }}>{title}</Text>{children ? <Text>{children}</Text> : null}</Section>;
}
`,
    "components/actions.tsx": `import { Button, Link } from "@react-email/components";
interface Action { label: string; href: string }
export function Actions({ primary, secondary }: { primary: Action; secondary?: Action }) {
  return (
    <table><tbody><tr>
      <td><Button href={primary.href}>{primary.label}</Button></td>
      {secondary ? <td><Link href={secondary.href}>{secondary.label}</Link></td> : null}
    </tr></tbody></table>
  );
}
`,
    "components/shout.tsx": `function shout(text: string) { return text.toUpperCase(); }
export function Shout({ children }: { children: string }) {
  return <div dangerouslySetInnerHTML={{ __html: shout(children) }} />;
}
`,
    "components/list.tsx": `import { Text } from "@react-email/components";
interface Entry { label: string; hint?: string }
export function List({ title, rows }: { title: string; rows: Entry[] }) {
  return <>{title ? <Text>{title}</Text> : null}{rows.map((row) => <Text key={row.label}>{row.label}{row.hint ? \` (\${row.hint})\` : ""}</Text>)}</>;
}
`,
    "digest.tsx": `import { type ReactNode } from "react";
import { Html, Body, Container, Text } from "@react-email/components";
import { Footer } from "./components/footer";
import { Card } from "./components/card";
import { Actions } from "./components/actions";
import { Shout } from "./components/shout";
import { List } from "./components/list";

function Header({ title, tagline }: { title: string; tagline?: string }) {
  return <><Text style={{ fontSize: "20px" }}>{title}</Text>{tagline && <Text>{tagline}</Text>}</>;
}

export default function Digest({ name, accountId, message, items, extra }: { name: string; accountId?: string; message: string; items: string[]; extra?: ReactNode }) {
  return (
    <Html><Body><Container>
      <Header title={\`Hi \${name}\`} />
      <Card title="Plan">Your plan renews <b>soon</b>.</Card>
      <Shout>{message}</Shout>
      <List title={accountId ? "Your account" : "Welcome"} rows={items.map((item) => ({ label: item }))} />
      <Actions primary={{ label: "Open", href: "https://example.com/open" }} secondary={accountId ? { label: "Settings", href: \`https://example.com/a/\${accountId}\` } : undefined} />
      <Footer reason="You signed up." />
      <Footer settingsUrl="https://example.com/settings" links={[{ label: "Help", href: "https://example.com/help" }]} />
      {extra}
    </Container></Body></Html>
  );
}
Digest.PreviewProps = { name: "Ana", accountId: "42", message: "Big news", items: ["Alpha", "Beta"], extra: null };
`,
  };

  it("type-checks where the original does, renders, and leaves no empty block", async () => {
    const { conversion, added, originalErrors, Original, Migrated } = await migrate(files, "digest.tsx");
    expect(originalErrors).toEqual([]);
    expect(added).toEqual([]);
    expect(conversion.code).not.toMatch(/\{\s*\(?undefined\)?\s*&&/);
    for (const props of [Original.PreviewProps, { name: "Bo", message: "Other news", items: [] }]) {
      const check = await verifyConversion(Original, Migrated, { props });
      expect([check.missing, check.added, check.missingAttributes, check.addedAttributes, check.designWarnings]).toEqual([[], [], [], [], []]);
      // No Paragraph for the tagline that isn't there, nor for the links the first footer doesn't get.
      expect(texts(check.design).filter((text) => !text.trim())).toEqual([]);
    }
  });
});

describe("markup kept as it renders", () => {
  it("states the browser's defaults under a style it can't read without type errors, and loads its images lazily (no React 19 preload links)", async () => {
    const { conversion, added, originalErrors, Original, Migrated } = await migrate({
      "styles.ts": `export const table = { borderCollapse: "collapse" as const, width: "100%" };
`,
      "receipt.tsx": `import { Html, Body, Section, Img } from "@react-email/components";
import { table } from "./styles";
function Badge({ src }: { src: string }) {
  const [shown] = [src];
  return <img src={shown} alt="Badge" width={20} />;
}
export default function Receipt({ logo }: { logo: string }) {
  return <Html><Body><Section>
    <table style={table}><tbody><tr><td>Total</td></tr></tbody></table>
    <Img src={logo} alt="Logo" />
    <Badge src={logo} />
  </Section></Body></Html>;
}
Receipt.PreviewProps = { logo: "https://example.com/logo.png" };
`,
    }, "receipt.tsx");
    expect(originalErrors).toEqual([]);
    expect(added).toEqual([]);
    // React 19 writes a preload link before the email's rows for each image a component renders, unless it's lazy:
    // the design can't hold one ("<link> is not a valid Body child").
    expect(conversion.code.match(/loading="lazy"/g)).toHaveLength(2);
    const check = await verifyConversion(Original, Migrated);
    expect([check.missing, check.added, check.missingAttributes, check.designWarnings]).toEqual([[], [], [], []]);
  });
});

describe("a component of the template's own kept with a className", () => {
  it("keeps its className when it takes no style (a style prop would be a type error)", async () => {
    const { conversion, added, originalErrors, Original, Migrated } = await migrate({
      "summary.tsx": `import { Html, Body, Tailwind, Section, Text } from "@react-email/components";
function Badge({ value, className }: { value: number; className?: string }) {
  const { sign } = { sign: value > 0 ? "+" : "" };
  return <span className={\`rounded px-1 \${className ?? ""}\`}>{sign}{value}%</span>;
}
export default function Summary({ change }: { change: number }) {
  return <Tailwind><Html><Body><Section><Text className="text-sm">Revenue <Badge value={change} className="ml-1" /></Text></Section></Body></Html></Tailwind>;
}
Summary.PreviewProps = { change: 12 };
`,
    }, "summary.tsx");
    expect(originalErrors).toEqual([]);
    expect(added).toEqual([]);
    expect(conversion.code).toMatch(/<Badge value=\{change\} className="ml-1" \/>/);
    const check = await verifyConversion(Original, Migrated);
    expect([check.missing, check.added]).toEqual([[], []]);
  });
});

describe("a layout component around <Html>, <Head> and <Body>", () => {
  it("is inlined, so its Body is the template's and the content converts (a default JSX prop given another)", async () => {
    const { conversion, added, Original, Migrated } = await migrate({
      "layout.tsx": `import type { ReactNode } from "react";
import { Html, Head, Body, Container, Preview, Text } from "@react-email/components";
const page = { backgroundColor: "#f4f4f5", fontFamily: "Arial, sans-serif" };
export function Layout({ preview, footer = <Text>Sent by Acme</Text>, children }: { preview: string; footer?: ReactNode; children?: ReactNode }) {
  return (
    <Html lang="en">
      <Head><meta name="color-scheme" content="light only" /></Head>
      <Preview>{preview}</Preview>
      <Body style={page}>
        <Container style={{ backgroundColor: "#ffffff", padding: "24px" }}>{children}{footer}</Container>
      </Body>
    </Html>
  );
}
`,
      "welcome.tsx": `import { Text } from "@react-email/components";
import { Layout } from "./layout";
export default function Welcome({ name }: { name: string }) {
  return (
    <Layout preview="Welcome aboard" footer={<Text>You signed up at acme.example.</Text>}>
      <Text>Hi {name}, thanks for joining.</Text>
    </Layout>
  );
}
Welcome.PreviewProps = { name: "Ana" };
`,
    }, "welcome.tsx");
    expect(added).toEqual([]);
    expect(conversion.report.fallbacks).toEqual([]);
    expect(conversion.code).toMatch(/<Email[^>]*backgroundColor="#f4f4f5"/);
    const check = await verifyConversion(Original, Migrated);
    expect([check.missing, check.added, check.designWarnings]).toEqual([[], [], []]);
    expect(check.convertedHtml.match(/<html/g)).toHaveLength(1);
  });

  it("is inlined when the template gives it a call's value (a brand worked out from props), which goes in a const first", async () => {
    const { conversion, added, Original, Migrated } = await migrate({
      "layout.tsx": `import type { ReactNode } from "react";
import { Html, Body, Container, Link, Text } from "@react-email/components";
export interface Brand { name: string; href: string }
const acme: Brand = { name: "Acme", href: "https://acme.example" };
export function pageBrand(page: string): Brand {
  return { name: \`\${page} Status\`, href: \`https://status.example/\${page}\` };
}
export function Layout({ brand = acme, children }: { brand?: Brand; children?: ReactNode }) {
  return (
    <Html><Body style={{ backgroundColor: "#eef2ff" }}><Container>
      <Link href={brand.href}>{brand.name}</Link>
      {children}
      <Text>Sent by {brand.name}</Text>
    </Container></Body></Html>
  );
}
`,
      "notice.tsx": `import { Text } from "@react-email/components";
import { Layout, pageBrand } from "./layout";
export default function Notice({ page, note }: { page: string; note: string }) {
  return <Layout brand={pageBrand(page)}><Text>{note}</Text></Layout>;
}
Notice.PreviewProps = { page: "Acme", note: "All systems normal." };
`,
    }, "notice.tsx");
    expect(added).toEqual([]);
    expect(conversion.report.fallbacks).toEqual([]);
    expect(conversion.code).toMatch(/const layoutBrand = pageBrand\(page\);/);
    expect(conversion.code).toMatch(/<Email[^>]*backgroundColor="#eef2ff"/);
    for (const props of [Original.PreviewProps, { page: "Globex", note: "Degraded." }]) {
      const check = await verifyConversion(Original, Migrated, { props });
      expect([check.missing, check.added, check.missingAttributes, check.designWarnings]).toEqual([[], [], [], []]);
    }
  });
});
