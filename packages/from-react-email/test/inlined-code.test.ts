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
      "palette.ts": `export let palette = { brand: "#2563eb", hidden: "none" };
`,
      "theme.ts": `export { palette } from "./palette";
`,
      "promo.tsx": `import { Html, Body, Text } from "@react-email/components";
import { palette } from "./theme";
export default function Promo() {
  return <Html><Body><Text style={{ color: palette.brand }}>Spring sale</Text><Text style={{ display: palette.hidden }}>Secret</Text></Body></Html>;
}
`,
    }, "promo.tsx");
    expect(conversion.report.lostStyles).toEqual(expect.arrayContaining([expect.stringContaining("color: palette.brand"), expect.stringContaining("display: palette.hidden")]));
    // `display` from code can hide content: still counted; `color` can't.
    expect(conversion.report.lostShown).toEqual([expect.stringContaining("display: palette.hidden")]);
  });
});
