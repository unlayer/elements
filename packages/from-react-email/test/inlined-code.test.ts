import { afterEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import React from "react";
import { convertSource, mergeTagDesign, verifyConversion } from "../src/index";

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
  const file = original.replace(/\.(tsx|jsx)$/, ".migrated.$1");
  const loadModule = (specifier: string, from: string) => {
    const target = path.resolve(path.dirname(from), specifier);
    for (const candidate of [target, `${target}.tsx`, `${target}.ts`, path.join(target, "index.ts")]) if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return { fileName: candidate, source: fs.readFileSync(candidate, "utf8") };
    return undefined;
  };
  const conversion = await convertSource(files[entry], { fileName: file, loadModule });
  fs.writeFileSync(file, conversion.code);
  const options = { noEmit: true, allowJs: true, jsx: ts.JsxEmit.ReactJSX, strict: true, noUnusedLocals: true, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, target: ts.ScriptTarget.ES2022, skipLibCheck: true, types: ["react"] };
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
  it("states the browser's defaults under a style it can't read without type errors, and writes its images as the original does", async () => {
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
    // No `loading` the original doesn't have: lazy images can wait until they're scrolled to (a tracking pixel too).
    // React 19's preload links for them aren't content to the check.
    expect(conversion.code).not.toContain("loading=");
    const check = await verifyConversion(Original, Migrated);
    expect([check.missing, check.added, check.missingAttributes, check.designWarnings]).toEqual([[], [], [], []]);
    expect(check.convertedHtml).not.toContain("loading=");
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

describe("React Email's components imported through a file of the project's", () => {
  it("are read as React Email's (`export { … } from`, `export *`, an import exported again), and the import keeps the rest", async () => {
    const { conversion, added, Original, Migrated } = await migrate({
      "ui/index.ts": `export { Html, Body, Container } from "@react-email/components";
import { Text, Heading } from "@react-email/components";
export { Text, Heading as Title };
export * from "./more";
`,
      "ui/more.ts": `export { Button } from "@react-email/components";
export function company() { return "Acme Inc."; }
`,
      "invite.tsx": `import { Html, Body, Container, Text, Title, Button, company } from "./ui";
export default function Invite({ url }: { url: string }) {
  return <Html><Body><Container>
    <Title>You're invited</Title>
    <Text>Join {company()} today.</Text>
    <Button href={url} style={{ backgroundColor: "#111827", color: "#ffffff", padding: "12px 20px" }}>Accept</Button>
  </Container></Body></Html>;
}
Invite.PreviewProps = { url: "https://example.com/accept" };
`,
    }, "invite.tsx");
    expect(added).toEqual([]);
    expect(conversion.report.fallbacks).toEqual([]);
    expect(conversion.report.nativeRatio).toBe(1);
    expect(conversion.code).toMatch(/import \{ company \} from "\.\/ui";/);
    const check = await verifyConversion(Original, Migrated);
    expect([check.missing, check.added, check.missingAttributes, check.designWarnings]).toEqual([[], [], [], []]);
  });

  it("leave a component the file exports itself as the project's, though `export *` passes on React Email's of that name", async () => {
    const { conversion, Original, Migrated } = await migrate({
      "ui/index.ts": `export * from "@react-email/components";
export { Button } from "./button";
`,
      "ui/button.tsx": `import { useMemo } from "react";
import { Button as Base } from "@react-email/components";
export function Button({ href, children }: { href: string; children: string }) {
  const label = useMemo(() => children.toUpperCase(), [children]);
  return <Base href={href} style={{ backgroundColor: "#4f46e5", color: "#ffffff", padding: "12px 20px" }}>{label}</Base>;
}
`,
      "invite.tsx": `import { Html, Body, Container, Text, Button } from "./ui";
export default function Invite({ url }: { url: string }) {
  return <Html><Body><Container>
    <Text>You're invited.</Text>
    <Button href={url}>Accept</Button>
  </Container></Body></Html>;
}
Invite.PreviewProps = { url: "https://example.com/accept" };
`,
    }, "invite.tsx");
    // The project's Button isn't Elements' Button with React Email's defaults: it renders as the project wrote it.
    expect(conversion.code).toMatch(/<Button href=\{url\}>Accept<\/Button>/);
    const check = await verifyConversion(Original, Migrated);
    expect([check.missing, check.added, check.missingAttributes, check.styles]).toEqual([[], [], [], []]);
  });
});

describe("a JavaScript template (.jsx)", () => {
  it("reads its module constants (styles) and converts a heading whose text is a condition over lines", async () => {
    const { conversion, Original, Migrated } = await migrate({
      "receipt.jsx": `import { Html, Body, Container, Heading, Text } from "@react-email/components";
const main = { backgroundColor: "#0f172a" };
const title = { color: "#f8fafc", fontSize: "26px" };
export default function Receipt({ firstName }) {
  return (
    <Html><Body style={main}><Container>
      <Heading style={{ textAlign: "center", ...title }}>
        {firstName ? \`\${firstName}, your order shipped\` : "Your order shipped"}
      </Heading>
      <Text style={title}>Thanks for shopping.</Text>
    </Container></Body></Html>
  );
}
Receipt.PreviewProps = { firstName: "Leo" };
`,
    }, "receipt.jsx");
    expect(conversion.report.lostStyles ?? []).toEqual([]);
    expect(conversion.code).toMatch(/<Email[^>]*backgroundColor="#0f172a"/);
    expect(conversion.code).toMatch(/color="#f8fafc"/);
    for (const props of [Original.PreviewProps, {}]) {
      const check = await verifyConversion(Original, Migrated, { props });
      expect([check.missing, check.added, check.styles]).toEqual([[], [], []]);
    }
  });
});

describe("styles from another file of the project", () => {
  it("are read as the template's own constants are: through re-exports, and from JSON", async () => {
    const { conversion, added, Original, Migrated } = await migrate({
      "theme/colors.ts": `export const colors = { ink: "#e2e8f0", night: "#0b1120" };
`,
      "theme/index.ts": `import { colors } from "./colors";
export const page = { backgroundColor: colors.night, fontFamily: "Arial, sans-serif" };
export const heading = { color: colors.ink, fontSize: "24px" };
export { colors };
`,
      "brand.json": `{ "accent": "#22d3ee" }
`,
      "status.tsx": `import { Html, Body, Container, Heading, Text, Link } from "@react-email/components";
import { page, heading, colors } from "./theme";
import brand from "./brand.json";
export default function Status({ url }: { url: string }) {
  return <Html><Body style={page}><Container>
    <Heading style={heading}>All systems normal</Heading>
    <Text style={{ color: colors.ink }}>No incidents in the last 24 hours. <Link href={url} style={{ color: brand.accent }}>Details</Link></Text>
  </Container></Body></Html>;
}
Status.PreviewProps = { url: "https://status.example.com" };
`,
    }, "status.tsx");
    expect(added).toEqual([]);
    expect(conversion.report.lostStyles ?? []).toEqual([]);
    expect(conversion.code).toMatch(/<Email[^>]*backgroundColor="#0b1120"/);
    const check = await verifyConversion(Original, Migrated);
    expect([check.missing, check.added, check.styles]).toEqual([[], [], []]);
  });
});

describe("text and links from another file of the project", () => {
  it("keep their import, as the template writes them: only a style or a class list is written as its value", async () => {
    const { conversion, added, Original, Migrated } = await migrate({
      "brand.ts": `export const brand = "Acme";
export const siteUrl = "https://acme.example.com";
export const accent = "#22d3ee";
`,
      "notice.tsx": `import { Html, Body, Container, Text, Link, Button } from "@react-email/components";
import { brand, siteUrl, accent } from "./brand";
export default function Notice() {
  return <Html><Body><Container>
    <Text style={{ color: accent }}>Thanks for using {brand}. <Link href={siteUrl} style={{ color: accent }}>Visit us</Link></Text>
    <Button href={siteUrl} style={{ backgroundColor: accent, padding: "12px 20px" }}>Open {brand}</Button>
  </Container></Body></Html>;
}
`,
    }, "notice.tsx");
    expect(added).toEqual([]);
    expect(conversion.report.lostStyles ?? []).toEqual([]);
    expect(conversion.code).toContain('from "./brand"');
    expect(conversion.code).not.toContain("Acme");
    expect(conversion.code).not.toContain("acme.example.com");
    expect(conversion.code).toContain("#22d3ee");
    const check = await verifyConversion(Original, Migrated);
    expect([check.missing, check.added, check.styles]).toEqual([[], [], []]);
  });
});

describe("a text constant from another file of the project beside markup", () => {
  it("is text: written as its import, with no branch for React elements", async () => {
    const { conversion, added, Original, Migrated } = await migrate({
      "config.ts": `export const POSTAL_ADDRESS = "1 Main St, Springfield";
`,
      "notice.tsx": `import { Html, Body, Container, Text } from "@react-email/components";
import { POSTAL_ADDRESS } from "./config";
export default function Notice() {
  return <Html><Body><Container>
    <Text>Sent by <b>Acme</b>, {POSTAL_ADDRESS}</Text>
  </Container></Body></Html>;
}
`,
    }, "notice.tsx");
    expect(added).toEqual([]);
    expect(conversion.code).toContain('from "./config"');
    expect(conversion.code).not.toContain("holdsElements");
    expect(conversion.code).not.toContain("Springfield");
    const check = await verifyConversion(Original, Migrated);
    expect([check.missing, check.added, check.designWarnings]).toEqual([[], [], []]);
    expect(conversion.report.nativeRatio).toBe(1);
  });
});

describe("markup kept as React that renders React Email's <Tailwind>", () => {
  const files = {
    "shell.tsx": `import type { ReactNode } from "react";
import { Html, Body, Container, Tailwind } from "@react-email/components";
export function Shell({ children, note }: { children: ReactNode; note?: string }) {
  return <Html><Tailwind><Body className="bg-slate-50"><Container className="p-4">{children}{note}</Container></Body></Tailwind></Html>;
}
`,
    "plain-shell.tsx": `import type { ReactNode } from "react";
import { Html, Body, Container } from "@react-email/components";
export function PlainShell({ children, note }: { children: ReactNode; note?: string }) {
  return <Html><Body style={{ backgroundColor: "#f8fafc" }}><Container>{children}{note}</Container></Body></Html>;
}
`,
  };
  const template = (shell: string) => `import { Text } from "@react-email/components";
import { ${shell} as Shell } from "./${shell === "Shell" ? "shell" : "plain-shell"}";
function Inner({ name, ...rest }: { name: string; note?: string }) {
  return <Shell {...rest}><Text>Hi {name}</Text></Shell>;
}
export default function Notice() { return <Inner name="Ada" note="Bye" />; }
`;

  it("is refused, saying why (<Tailwind> suspends on its first render, Elements renders synchronously)", async () => {
    await expect(migrate({ ...files, "notice.tsx": template("Shell") }, "notice.tsx")).rejects.toThrow(/<Inner> is kept as React .* renders React Email's <Tailwind>, which suspends/);
  });

  it("isn't refused without <Tailwind>", async () => {
    const { conversion } = await migrate({ ...files, "notice.tsx": template("PlainShell") }, "notice.tsx");
    expect(conversion.report.fallbacks).toEqual([{ reason: "custom component", detail: "Inner" }]);
  });
});

describe("several components inlined from one import", () => {
  it("leave the import's other names as written (the names going aren't cut one by one)", async () => {
    const { conversion, added, Original, Migrated } = await migrate({
      "parts.tsx": `import { Text } from "@react-email/components";
export function formatCount(count: number) { return count.toLocaleString("en-US"); }
export function Title({ children }: { children: string }) { return <Text style={{ fontSize: "20px" }}>{children}</Text>; }
export function Note({ children }: { children: string }) { return <Text style={{ color: "#6b7280" }}>{children}</Text>; }
`,
      "weekly.tsx": `import { Html, Body, Text } from "@react-email/components";
import {
  formatCount,
  Note,
  Title,
} from "./parts";
export default function Weekly({ count }: { count: number }) {
  return <Html><Body><Title>Your week</Title><Text>{formatCount(count)} emails archived</Text><Note>See you next week</Note></Body></Html>;
}
Weekly.PreviewProps = { count: 1200 };
`,
    }, "weekly.tsx");
    expect(added).toEqual([]);
    expect(conversion.report.info.filter((i) => i.reason === "local component inlined where it's used").map((i) => i.detail).sort()).toEqual(["Note", "Title"]);
    expect(conversion.code).toMatch(/import \{ formatCount \} from "\.\/parts";/);
    const check = await verifyConversion(Original, Migrated);
    expect([check.missing, check.added, check.styles]).toEqual([[], [], []]);
  });
});

describe("a prop given one of two object literals", () => {
  it("keeps the prop's declared type, so a literal type in it still type-checks", async () => {
    const { added, originalErrors, Original, Migrated } = await migrate({
      "status.tsx": `import { Html, Body, Section, Text } from "@react-email/components";
const palette = { good: { color: "#16a34a" }, bad: { color: "#dc2626" } };
function Tag({ tone, children }: { tone: "good" | "bad"; children: string }) {
  const { color } = palette[tone];
  return <span style={{ color }}>{children}</span>;
}
function Header({ pill }: { pill: { tone: "good" | "bad"; label: string } }) {
  return <Section><Text>Status: <Tag tone={pill.tone}>{pill.label}</Tag></Text></Section>;
}
export default function Status({ down }: { down: boolean }) {
  return <Html><Body><Header pill={down ? { tone: "bad", label: "Down" } : { tone: "good", label: "Up" }} /></Body></Html>;
}
Status.PreviewProps = { down: true };
`,
    }, "status.tsx");
    expect(originalErrors).toEqual([]);
    expect(added).toEqual([]);
    for (const props of [Original.PreviewProps, { down: false }]) {
      const check = await verifyConversion(Original, Migrated, { props });
      expect([check.missing, check.added]).toEqual([[], []]);
    }
  });
});

describe("a component from another file used twice", () => {
  it("is inlined both times, sharing the copy of its file's constant", async () => {
    const { conversion, added, Original, Migrated } = await migrate({
      "frame.tsx": `import type { ReactNode } from "react";
import { Html, Body, Container, Text } from "@react-email/components";
const footerStyle = { color: "#6b7280", fontSize: "12px" };
export function Frame({ children }: { children: ReactNode }) {
  return <Html><Body><Container>{children}<Text style={footerStyle}>Acme, 1 Main St</Text></Container></Body></Html>;
}
`,
      "trial.tsx": `import { Text } from "@react-email/components";
import { Frame } from "./frame";
export default function Trial({ paid }: { paid: boolean }) {
  if (paid) return <Frame><Text>Your plan continues.</Text></Frame>;
  return <Frame><Text>Add a card to keep your plan.</Text></Frame>;
}
Trial.PreviewProps = { paid: true };
`,
    }, "trial.tsx");
    expect(added).toEqual([]);
    expect(conversion.report.fallbacks).toEqual([]);
    for (const props of [Original.PreviewProps, { paid: false }]) {
      const check = await verifyConversion(Original, Migrated, { props });
      expect([check.missing, check.added, check.styles]).toEqual([[], [], []]);
    }
  });
});

describe("a style value from a file the codemod can't read", () => {
  it("is a lost style, not content shown or hidden, when no value of its property can hide anything", async () => {
    const { conversion } = await migrate({
      "palette.ts": `export let palette = { weight: 700, hidden: "none" };
`,
      "theme.ts": `export { palette } from "./palette";
`,
      "promo.tsx": `import { Html, Body, Text } from "@react-email/components";
import { palette } from "./theme";
export default function Promo() {
  return <Html><Body><Text style={{ fontWeight: palette.weight }}>Spring sale</Text><Text style={{ display: palette.hidden }}>Secret</Text></Body></Html>;
}
`,
    }, "promo.tsx");
    expect(conversion.report.lostStyles).toEqual(expect.arrayContaining([expect.stringContaining("fontWeight: palette.weight"), expect.stringContaining("display: palette.hidden")]));
    // `display` from code can hide content: still counted; `fontWeight` can't.
    expect(conversion.report.lostShown).toEqual([expect.stringContaining("display: palette.hidden")]);
  });
});

describe("values in text that may be React elements", () => {
  const blockTypes = (design: any): string[] => design.body.rows.flatMap((row: any) => row.columns.flatMap((column: any) => column.contents.map((content: any) => content.type)));
  const link = React.createElement("a", { href: "https://example.com/help" }, "the help center");

  it.each([
    ["an imported props type", "note.tsx", `import type { Props } from "./types";\nexport default function Note({ name, footer }: Props) {`],
    ["a ReactNode", "note.tsx", `import type { ReactNode } from "react";\nexport default function Note({ name, footer }: { name: string; footer?: ReactNode }) {`],
    ["a .jsx template", "note.jsx", `export default function Note({ name, footer }) {`],
  ])("are written both ways, chosen when it renders (%s): text stays an editable block, an element keeps its markup", async (_, file, head) => {
    const { conversion, added, Original, Migrated } = await migrate({
      "types.ts": `export interface Props { name: string; footer?: unknown }\n`,
      [file]: `import { Html, Body, Section, Text } from "@react-email/components";
${head}
  return <Html><Body><Section>
    <Text>Hi {name}, thanks for writing.</Text>
    <Text>Questions? <b>Help:</b> {footer}</Text>
  </Section></Body></Html>;
}
Note.PreviewProps = { name: "Ana", footer: "reply to this email" };
`,
    }, file);
    expect(added).toEqual([]);
    expect(conversion.code).toMatch(/holdsElements\(footer\) \?/);
    expect(conversion.code).not.toContain("react-dom");
    // The plain-children block stays as it was.
    expect(conversion.code).not.toMatch(/holdsElements\(name\)/);
    const text = await verifyConversion(Original, Migrated);
    expect([text.missing, text.added, text.variants]).toEqual([[], [], []]);
    expect(blockTypes(text.design)).toEqual(["text", "text"]);
    // In the design, the text a value gives is a merge tag, as for any text (its test for elements is false for one).
    const tagged = await mergeTagDesign(Migrated, Original.PreviewProps, text.design, { source: conversion.code, helpers: conversion.helpers });
    expect(tagged.used).toContain("footer");
    const element = await verifyConversion(Original, Migrated, { props: { name: "Ana", footer: link } });
    expect([element.missing, element.added, element.missingAttributes]).toEqual([[], [], []]);
    expect(element.convertedHtml).toContain('<a href="https://example.com/help">the help center</a>');
  });

  it("stay text where their type says they're text", async () => {
    const { conversion } = await migrate({
      "note.tsx": `import { Html, Body, Text } from "@react-email/components";
export default function Note({ name, count }: { name: string; count?: number }) {
  return <Html><Body><Text>Hi <b>{name}</b>, {count} new</Text></Body></Html>;
}
Note.PreviewProps = { name: "Ana", count: 3 };
`,
    }, "note.tsx");
    expect(conversion.code).not.toContain("holdsElements");
  });

  it("are checked given an element, so a migration that loses one fails", async () => {
    const { Original } = await migrate({
      "note.tsx": `import { Html, Body, Text } from "@react-email/components";
export default function Note({ footer }: { footer?: any }) {
  return <Html><Body><Text>Questions? <b>Help:</b> {footer}</Text></Body></Html>;
}
Note.PreviewProps = { footer: "reply to this email" };
`,
    }, "note.tsx");
    const { Email, Row, Column, Paragraph } = await import("@unlayer/react-elements");
    // A migration whose text is right and whose kept branch (for elements) loses the value.
    function holdsElements(...values: unknown[]): boolean {
      return values.some((value) => React.isValidElement(value));
    }
    const Migrated = ({ footer }: { footer?: unknown }) =>
      React.createElement(Email, null, React.createElement(Row, null, React.createElement(Column, null,
        holdsElements(footer) ? React.createElement(Paragraph, { html: "Questions? <b>Help:</b>" }) : React.createElement(Paragraph, { html: `Questions? <b>Help:</b> ${String(footer ?? "")}` }))));
    const check = await verifyConversion(Original, Migrated);
    expect(check.variants.find((v) => v.change === "footer: an element")?.missing).toEqual(["given", "as", "an", "element"]);
  });
});

describe("components kept as React under a text color", () => {
  const badge = `function Badge({ label }: { label: string }) {
  const text = useMemo(() => label.toUpperCase(), [label]);
  return <table><tbody><tr><td style={{ padding: "4px" }}>{text}</td></tr></tbody></table>;
}
function Card({ title }: { title: string }) {
  const [shown] = useState(title);
  return <Section><Text>{shown}</Text><Badge label="new" /></Section>;
}
`;
  const head = `import { useMemo, useState } from "react";\nimport { Html, Body, Section, Text } from "@react-email/components";\n`;

  it("give their tables and cells the color around them, through the components that use them", async () => {
    const { conversion, added, Original, Migrated } = await migrate({
      "dark.tsx": `${head}${badge}
export default function Dark({ plan }: { plan: string }) {
  return <Html><Body><Section style={{ backgroundColor: "#1f2937", color: "#ffffff" }}>
    <Badge label={plan} />
    <Card title="Your plan" />
  </Section></Body></Html>;
}
Dark.PreviewProps = { plan: "pro" };
`,
    }, "dark.tsx");
    expect(added).toEqual([]);
    expect(conversion.report.lostShown ?? []).toEqual([]);
    const check = await verifyConversion(Original, Migrated);
    expect([check.missing, check.added, check.styles]).toEqual([[], [], []]);
  });

  it("are reported as content where their uses are under different colors, or one computed from code", async () => {
    const { conversion } = await migrate({
      "mixed.tsx": `${head}${badge}
export default function Mixed({ plan, accent }: { plan: string; accent: string }) {
  return <Html><Body>
    <Section style={{ backgroundColor: "#1f2937", color: "#ffffff" }}><Badge label={plan} /></Section>
    <Section><Badge label="free" /></Section>
    <Section style={{ backgroundColor: "#111827", color: accent }}><Card title="Plan" /></Section>
  </Body></Html>;
}
Mixed.PreviewProps = { plan: "pro", accent: "#f9fafb" };
`,
    }, "mixed.tsx");
    expect(conversion.report.lostShown).toEqual([
      expect.stringMatching(/<Badge>, kept as React, renders tables or cells without a text color of its own, under/),
      expect.stringMatching(/<Card>, kept as React, .* under a text color computed from code/),
    ]);
  });
});

describe("tidy code from inlining", () => {
  it("writes a block a folded condition gives without braces around it", async () => {
    const { conversion, Original, Migrated } = await migrate({
      "header.tsx": `import { Section, Text } from "@react-email/components";
export function Header({ tagline }: { tagline?: string }) {
  return <Section>{tagline && <Text style={{ color: "#64748b" }}>{tagline}</Text>}</Section>;
}
`,
      "digest.tsx": `import { Html, Body, Text } from "@react-email/components";
import { Header } from "./header";
export default function Digest({ date }: { date: string }) {
  return <Html><Body><Header tagline={\`Daily digest · \${date}\`} /><Text>Hello</Text></Body></Html>;
}
Digest.PreviewProps = { date: "Tue" };
`,
    }, "digest.tsx");
    expect(conversion.code).not.toMatch(/\{\s*<Paragraph/);
    const check = await verifyConversion(Original, Migrated);
    expect([check.missing, check.added]).toEqual([[], []]);
  });

  it("writes a prop's default as `?? fallback` where the value given is known and isn't null", async () => {
    const { conversion, added, Original, Migrated } = await migrate({
      "brand.json": `{ "name": "Northwind" }\n`,
      "footer.tsx": `import { Text } from "@react-email/components";
export function Footer({ company = "Acme Inc." }: { company?: string }) {
  return <Text>{company} · 1 Main St</Text>;
}
`,
      "news.tsx": `import { Html, Body, Text } from "@react-email/components";
import brand from "./brand.json";
import { Footer } from "./footer";
export default function News({ who }: { who?: string }) {
  return <Html><Body><Text>News</Text><Footer company={brand.name} /><Footer company={who} /></Body></Html>;
}
News.PreviewProps = { who: "Globex" };
`,
    }, "news.tsx");
    expect(added).toEqual([]);
    expect(conversion.code).toContain('{brand.name ?? "Acme Inc."}');
    // A prop that may be null keeps the default's own test (`??` would also replace null).
    expect(conversion.code).toMatch(/who === undefined \? "Acme Inc\." : who/);
    for (const props of [Original.PreviewProps, {}]) {
      const check = await verifyConversion(Original, Migrated, { props });
      expect([check.missing, check.added]).toEqual([[], []]);
    }
  });
});

describe("colors computed from props", () => {
  it("are written on the text and buttons that set them, as code (a text's background behind its words, as its color may need it)", async () => {
    const { conversion, added, Original, Migrated } = await migrate({
      "watch.tsx": `import { Html, Body, Container, Text, Button } from "@react-email/components";
const TONE: Record<string, string> = { good: "#a8ff53", bad: "#ff5353" };
export default function Watch({ tone = "good", url }: { tone?: string; url: string }) {
  const accent = TONE[tone] ?? TONE.good;
  return <Html><Body style={{ backgroundColor: "#15171a" }}><Container>
    <Text style={{ color: accent, fontSize: "11px" }}>Watch update</Text>
    <Text style={{ color: "#d7d9dd" }}>Body copy</Text>
    <Button href={url} style={{ backgroundColor: accent, color: "#15171a", padding: "10px 16px" }}>Open</Button>
    <Text style={{ color: tone === "good" ? "#ffffff" : "#94a3b8", backgroundColor: tone === "good" ? "#16a34a" : "#e2e8f0" }}>{tone === "good" ? "Done" : 2}</Text>
  </Container></Body></Html>;
}
Watch.PreviewProps = { tone: "good", url: "https://example.com/watch" };
`,
    }, "watch.tsx");
    expect(added).toEqual([]);
    expect(conversion.report.lostStyles ?? []).toEqual([]);
    for (const tone of ["good", "bad"]) {
      const check = await verifyConversion(Original, Migrated, { props: { tone, url: "https://example.com/watch" } });
      expect([check.missing, check.added, check.styles]).toEqual([[], [], []]);
    }
  });
});

describe("a text's own background where its box can't be drawn", () => {
  it("goes behind its words, so light text on it stays readable (a date card in a column)", async () => {
    const { added, Original, Migrated } = await migrate({
      "invite.tsx": `import { Html, Body, Container, Section, Row, Column, Text } from "@react-email/components";
export default function Invite({ month, day, title }: { month: string; day: string; title: string }) {
  return <Html><Body><Container style={{ backgroundColor: "#ffffff" }}><Section><Row>
    <Column style={{ width: "84px" }}>
      <Section style={{ border: "1px solid #e0e7ff", borderRadius: "8px", textAlign: "center" }}>
        <Text style={{ backgroundColor: "#4338ca", color: "#ffffff", fontSize: "12px", textTransform: "uppercase", margin: 0, padding: "4px 0" }}>{month}</Text>
        <Text style={{ fontSize: "28px", margin: 0 }}>{day}</Text>
      </Section>
    </Column>
    <Column><Text style={{ backgroundColor: "#fef3c7", color: "#92400e", margin: 0 }}>{title}</Text></Column>
  </Row></Section></Container></Body></Html>;
}
Invite.PreviewProps = { month: "Nov", day: "14", title: "Design night" };
`,
    }, "invite.tsx");
    expect(added).toEqual([]);
    const check = await verifyConversion(Original, Migrated);
    expect([check.missing, check.added]).toEqual([[], []]);
    expect(check.styles.filter((s) => s.property === "background" || s.property === "color")).toEqual([]);
  });
});

describe("the check's element given for a value that may be one", () => {
  it("isn't given for a list's length, and an attribute it's turned into text for isn't content", async () => {
    const { conversion, Original, Migrated } = await migrate({
      "team.jsx": `import { Html, Body, Text, Img } from "@react-email/components";
export default function Team({ team, members }) {
  return <Html><Body>
    <Img src="https://example.com/team.png" width="64" height="64" alt={team} />
    <Text>Join <b>{team}</b>: {members.length} members</Text>
  </Body></Html>;
}
Team.PreviewProps = { team: "Acme", members: ["Ana", "Bo"] };
`,
    }, "team.jsx");
    expect(conversion.code).toMatch(/holdsElements\(team, members\.length\)/);
    const check = await verifyConversion(Original, Migrated);
    expect([check.missing, check.added, check.variants]).toEqual([[], [], []]);
  });
});

describe("backgrounds computed from props", () => {
  const theme = (box: string) => `import { Html, Body, Container, Section, Row, Column, Text } from "@react-email/components";
export default function Theme({ dark = false }: { dark?: boolean }) {
  const fg = dark ? "#ffffff" : "#111111";
  return <Html>${box}</Html>;
}
Theme.PreviewProps = { dark: false };
`;
  const shown = (check: Awaited<ReturnType<typeof verifyConversion>>) => check.styles.filter((s) => s.property === "shown");

  it.each([
    ["a Body", `<Body style={{ backgroundColor: dark ? "#000000" : "#ffffff" }}><Text style={{ color: fg }}>Plain text</Text></Body>`],
    ["a Container", `<Body><Container style={{ backgroundColor: dark ? "#000000" : "#ffffff" }}><Text style={{ color: fg }}>Plain text</Text></Container></Body>`],
    ["a Section", `<Body><Container><Section style={{ backgroundColor: dark ? "#000000" : "#ffffff", padding: "8px" }}><Text style={{ color: fg }}>Plain text</Text></Section></Container></Body>`],
    ["a Column of several", `<Body><Container><Section><Row><Column style={{ backgroundColor: dark ? "#000000" : "#ffffff" }}><Text style={{ color: fg }}>Left</Text></Column><Column><Text>Right</Text></Column></Row></Section></Container></Body>`],
  ])("are written as code on the box (%s), so text colored with them stays readable", async (_, box) => {
    const { conversion, added, Original, Migrated } = await migrate({ "theme.tsx": theme(box) }, "theme.tsx");
    expect(added).toEqual([]);
    expect(conversion.report.lostStyles ?? []).toEqual([]);
    for (const dark of [false, true]) {
      const check = await verifyConversion(Original, Migrated, { props: { dark } });
      expect([check.missing, check.added, shown(check)]).toEqual([[], [], []]);
      expect(check.styles.filter((s) => s.property === "color" || s.property === "background")).toEqual([]);
    }
  });

  it("where one can't be written as code, leave the color computed under it too (as before: a look, never unreadable)", async () => {
    const { conversion, Original, Migrated } = await migrate({ "theme.tsx": theme(`<Body><Container style={{ background: dark ? "#000000" : "#ffffff" }}><Text style={{ color: fg }}>Plain text</Text></Container></Body>`) }, "theme.tsx");
    expect(conversion.code).not.toContain("color={fg}");
    for (const dark of [false, true]) {
      const check = await verifyConversion(Original, Migrated, { props: { dark } });
      expect([check.missing, check.added, shown(check)]).toEqual([[], [], []]);
    }
  });
});

describe("holdsElements' isValidElement", () => {
  it.each([
    ["a namespace import", `import * as React from "react";`, /React\.isValidElement\(value\)/],
    ["a default import", `import React from "react";`, /React\.isValidElement\(value\)/],
    ["named imports", `import { useMemo, } from "react";`, /import \{ useMemo, isValidElement \} from "react";/],
    ["a type import only", `import type { ReactNode } from "react";`, /import \{ isValidElement \} from "react";/],
  ])("comes through the template's own React import (%s): one import of react", async (_, line, expected) => {
    const { conversion, added, Original, Migrated } = await migrate({
      "greet.tsx": `${line}
import { Html, Body, Text } from "@react-email/components";
import type { Props } from "./props";
export default function Greet({ name }: Props) {
  ${line.includes("useMemo") ? "const shown = useMemo(() => name, [name]);" : "const shown = name;"}
  return <Html><Body><Text>Hi <b>{shown}</b></Text></Body></Html>;
}
Greet.PreviewProps = { name: "Ana" };
`,
      "props.ts": `export interface Props { name: string }\n`,
    }, "greet.tsx");
    expect(added).toEqual([]);
    expect(conversion.code).toMatch(expected);
    expect(conversion.code.match(/^import [^;]*from "react";/gm)?.filter((l) => !l.startsWith("import type"))).toHaveLength(1);
    const check = await verifyConversion(Original, Migrated);
    expect([check.missing, check.added]).toEqual([[], []]);
  });
});

describe("values read through TypeScript's utility types", () => {
  it("are known to be text (a Record of messages by locale): no switch, no React Email left", async () => {
    const { conversion, added, Original, Migrated } = await migrate({
      "notice.tsx": `import { Html, Body, Text, Link } from "@react-email/components";
type Locale = "en" | "es";
const messages: Record<Locale, { help: string; helpLink: string }> = {
  en: { help: "Need help?", helpLink: "Contact support" },
  es: { help: "¿Necesitas ayuda?", helpLink: "Contacta con soporte" },
};
const extra: Partial<Record<Locale, Pick<{ note: string; skip: number }, "note">>> = { en: { note: "Thanks" } };
export default function Notice({ locale = "en" }: { locale?: Locale }) {
  const t = messages[locale] ?? messages.en;
  const n = extra[locale];
  return <Html><Body>
    <Text>{t.help} <Link href={\`https://example.com/\${locale}/support\`}>{t.helpLink}</Link></Text>
    <Text>Signed: <b>{n?.note}</b></Text>
  </Body></Html>;
}
Notice.PreviewProps = { locale: "en" };
`,
    }, "notice.tsx");
    expect(added).toEqual([]);
    expect(conversion.code).not.toContain("holdsElements");
    expect(conversion.code).not.toContain("@react-email");
    for (const locale of ["en", "es"]) {
      const check = await verifyConversion(Original, Migrated, { props: { locale } });
      expect([check.missing, check.added]).toEqual([[], []]);
    }
  });
});

describe("a block written both ways, kept as HTML elements", () => {
  const blockHtml = (html: string) => {
    // The Html block's markup (Elements writes it in a div of its own).
    const at = html.indexOf("Questions");
    return at < 0 ? "" : html.slice(html.lastIndexOf("<p", at), html.indexOf("</p>", at) + 4);
  };
  const link = React.createElement("a", { href: "https://example.com/help" }, "the help center");

  it("needs no React Email component (a link from a prop, a style object, a value from props), and shows an element as the original does", async () => {
    const { conversion, added, Original, Migrated } = await migrate({
      "types.ts": `export interface Props { name: string; url: string; footer?: unknown }\n`,
      "note.jsx": `import { Html, Body, Section, Text, Link, CodeInline } from "@react-email/components";
const copy = { color: "#334155", fontSize: "15px", lineHeight: "22px" };
export default function Note({ name, url, footer }) {
  return <Html><Body><Section>
    <Text style={copy}>Hi <b>{name}</b>, questions? <Link href={url} style={{ color: "#2563eb" }}>Help</Link> {footer} from <CodeInline>{name}</CodeInline></Text>
  </Section></Body></Html>;
}
Note.PreviewProps = { name: "Ana", url: "https://example.com/support", footer: "Reply anytime." };
`,
    }, "note.jsx");
    expect(added).toEqual([]);
    expect(conversion.code).toMatch(/holdsElements\(/);
    expect(conversion.code).not.toContain("@react-email");
    expect(conversion.code).toMatch(/<a\s+href=\{url\}/);
    expect(conversion.report.info.filter((i) => i.reason === "keeps @react-email/components")).toEqual([]);
    for (const footer of ["Reply anytime.", link]) {
      const check = await verifyConversion(Original, Migrated, { props: { name: "Ana", url: "https://example.com/x", footer } });
      expect([check.missing, check.added, check.missingAttributes, check.addedAttributes, check.styles]).toEqual([[], [], [], [], []]);
    }
  });

  it("is the markup React Email renders for the block, with the block's margins in its padding as the Paragraph's", async () => {
    const { Original, Migrated } = await migrate({
      "note.jsx": `import { Html, Body, Text } from "@react-email/components";
export default function Note({ footer }) {
  return <Html><Body><Text style={{ color: "#334155" }}>Questions? <b>Help:</b> {footer}</Text></Body></Html>;
}
Note.PreviewProps = { footer: "reply" };
`,
    }, "note.jsx");
    const { renderToHtml } = await import("@unlayer/react-elements");
    const { render } = await import("@react-email/components");
    const kept = blockHtml(renderToHtml(React.createElement(Migrated, { footer: link })));
    const original = blockHtml(await render(React.createElement(Original, { footer: link })));
    // The same paragraph, but its 16px margins: the block's padding holds them, as it does the Paragraph's.
    expect(kept.replace(/margin:0/, "")).toBe(original.replace(/margin-top:16px;margin-bottom:16px/, ""));
  });

  it("keeps React Email where a component can't be written as HTML, and says so", async () => {
    const { conversion } = await migrate({
      "note.jsx": `import { Html, Body, Text, Button } from "@react-email/components";
export default function Note({ footer, url }) {
  return <Html><Body><Text>Questions? {footer} <Button href={url} style={{ padding: "8px 12px" }}>Help</Button></Text></Body></Html>;
}
Note.PreviewProps = { footer: "reply", url: "https://example.com" };
`,
    }, "note.jsx");
    expect(conversion.report.info).toContainEqual({ reason: "keeps @react-email/components", detail: expect.stringMatching(/<Button>.* in the block for footer couldn't be rewritten/) });
    expect(conversion.code).toContain("@react-email/components");
  });
});

describe("editability counted as the design gets it", () => {
  it("counts a block written both ways as kept where the preview props give its value as an element", async () => {
    const files = (preview: string) => ({
      "note.tsx": `import type { ReactNode } from "react";
import { Html, Body, Text } from "@react-email/components";
export default function Note({ name, note }: { name: string; note: ReactNode }) {
  return <Html><Body><Text>Hi <strong>{name}</strong>, <b>{note}</b>.</Text><Text>Bye</Text></Body></Html>;
}
Note.PreviewProps = { name: "Ana", note: ${preview} };
`,
    });
    const element = await migrate(files(`<em>your trial ends soon</em>`), "note.tsx");
    expect(element.conversion.report.nativeRatio).toBe(0.5);
    expect(element.conversion.report.fallbacks).toEqual([{ reason: "text from a value the preview props give as elements", detail: "note" }]);
    const text = await migrate(files(`"your trial ends soon"`), "note.tsx");
    expect(text.conversion.report.nativeRatio).toBe(1);
  });
});

describe("the design of a template whose preview props give an element", () => {
  it("has no merge tag from the element's insides, and a block left out of a design fails the check", async () => {
    const { conversion, Original, Migrated } = await migrate({
      "note.tsx": `import type { ReactNode } from "react";
import { Html, Body, Text } from "@react-email/components";
export default function Note({ name, note }: { name: string; note: ReactNode }) {
  return <Html><Body><Text>Hi <strong>{name}</strong>, <b>{note}</b>.</Text></Body></Html>;
}
Note.PreviewProps = { name: "Ana", note: <em>your trial ends soon</em> };
`,
    }, "note.tsx");
    const errors: string[] = [];
    const error = console.error;
    console.error = (...args: unknown[]) => void errors.push(args.map(String).join(" "));
    try {
      const check = await verifyConversion(Original, Migrated);
      expect(check.designWarnings).toEqual([]);
      const tagged = await mergeTagDesign(Migrated, Original.PreviewProps, check.design, { source: conversion.code, helpers: conversion.helpers });
      expect(tagged.used).toEqual(["name"]);
      expect(JSON.stringify(tagged.design)).not.toMatch(/note\.props|uNlAyEr/);
      expect(errors.filter((e) => /uNlAyEr|Invalid tag/.test(e))).toEqual([]);
    } finally {
      console.error = error;
    }
    // A component that throws in the design's render is a block the editor doesn't get.
    const Broken = () => {
      throw new Error("no data");
    };
    const { Email, Row, Column } = await import("@unlayer/react-elements");
    const Leaves = () => React.createElement(Email, null, React.createElement(Row, null, React.createElement(Column, null, React.createElement(Broken))));
    console.error = () => undefined;
    try {
      const check = await verifyConversion(Original, Leaves);
      expect(check.designWarnings).toEqual([expect.stringMatching(/^\[Unlayer\] <Broken> threw while rendering/)]);
    } finally {
      console.error = error;
    }
  });
});

describe("a box's background image with a computed URL", () => {
  it.each([undefined, "shop.example.com"])("is written with the template's code for the URL (VERCEL_URL %s), in the email and the design", async (host) => {
    const before = process.env.VERCEL_URL;
    if (host === undefined) delete process.env.VERCEL_URL;
    else process.env.VERCEL_URL = host;
    try {
      const { conversion, added, Original, Migrated } = await migrate({
        "hero.tsx": `import { Html, Body, Container, Section, Text } from "@react-email/components";
const assets = process.env.VERCEL_URL ? \`https://\${process.env.VERCEL_URL}\` : "https://assets.example.com";
export default function Hero({ code }: { code: string }) {
  return <Html><Body><Container>
    <Section style={{ backgroundColor: "#2b1a3d", backgroundImage: \`url('\${assets}/static/hero-art.png')\`, backgroundSize: "cover", backgroundPosition: "center", padding: "40px 24px" }}>
      <Text style={{ color: "#ffffff", fontSize: "32px" }}>Use code {code}</Text>
    </Section>
  </Container></Body></Html>;
}
Hero.PreviewProps = { code: "SPRING15" };
`,
      }, "hero.tsx");
      expect(added).toEqual([]);
      expect(conversion.code).toContain("url: `${assets}/static/hero-art.png`");
      expect(conversion.report.lostStyles ?? []).toEqual([]);
      const check = await verifyConversion(Original, Migrated);
      expect([check.missing, check.added, check.missingAttributes, check.addedAttributes]).toEqual([[], [], [], []]);
      const url = `${host ? `https://${host}` : "https://assets.example.com"}/static/hero-art.png`;
      const images = (check.design as any).body.rows.map((row: any) => row.values.backgroundImage?.url).filter(Boolean);
      expect(images).toEqual([url]);
    } finally {
      if (before === undefined) delete process.env.VERCEL_URL;
      else process.env.VERCEL_URL = before;
    }
  });
});
