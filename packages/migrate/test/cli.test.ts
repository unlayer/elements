import { afterEach, describe, expect, it } from "vitest";
import React from "react";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import * as lib from "@unlayer/from-react-email";
import { main, type Io } from "../src/cli";

const WELCOME = `import { Body, Button, Container, Head, Html, Preview, Section, Tailwind, Text } from "@react-email/components";
import { formatName } from "../lib/format";

function Layout({ preview, children }: { preview: string; children: React.ReactNode }) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Tailwind>
        <Body className="bg-gray-100 font-sans">
          <Container className="mx-auto my-10 max-w-[560px] rounded-lg bg-white p-8">{children}</Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default function Welcome({ name, steps }: { name: string; steps: string[] }) {
  return (
    <Layout preview={\`Welcome, \${formatName(name)}\`}>
      <Text className="text-2xl font-bold text-gray-900">Welcome, {formatName(name)}!</Text>
      {steps.map((step, i) => (
        <Section key={step} className={i > 0 ? "mt-2" : ""}>
          <Text className="m-0 text-sm text-gray-700">{i + 1}. {step}</Text>
        </Section>
      ))}
      <Button href="https://example.com" className="rounded bg-indigo-600 px-5 py-3 text-white">Get started</Button>
    </Layout>
  );
}

Welcome.PreviewProps = { name: "alex", steps: ["Create a project", "Invite your team"] };
`;

const SHARED = `import { Button } from "@react-email/components";
export function PrimaryButton({ href }: { href: string }) {
  return <Button href={href}>Go</Button>;
}
`;

const FORMAT = `export function formatName(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}
`;

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
  // A project under git, its files committed: --write replaces only what git can restore.
  commit(dir);
  return dir;
}

/** Commits everything in `dir` (a git repository of its own). */
function commit(dir: string): void {
  const git = (...args: string[]) => execFileSync("git", ["-c", "user.name=Test", "-c", "user.email=test@example.com", "-c", "commit.gpgsign=false", ...args], { cwd: dir, stdio: "ignore" });
  if (!fs.existsSync(path.join(dir, ".git"))) git("init", "-q");
  git("add", "-A");
  git("commit", "-q", "--allow-empty", "-m", "templates");
}

function io(cwd: string): Io & { out: string; err: string } {
  const sink = { cwd, out: "", err: "", stdout: (t: string) => void (sink.out += t), stderr: (t: string) => void (sink.err += t) };
  return sink;
}

describe("unlayer-migrate", () => {
  it("loads JSX helpers outside the input folder with the project's automatic JSX runtime", async () => {
    const template = `import { Html, Body, Text } from "@react-email/components";
import { CTA } from "../shared/cta";
export default function Template({ href }: { href?: string }) { return <Html><Body><Text>Invoice ready</Text><CTA href={href}/></Body></Html>; }
Template.PreviewProps = { href: undefined };`;
    const dir = project({
      "tsconfig.json": JSON.stringify({ compilerOptions: { jsx: "react-jsx", module: "ESNext", moduleResolution: "bundler" } }),
      "emails/invoice.tsx": template,
      "shared/cta.tsx": `import { Button } from "@react-email/components";
export function CTA({ href = "https://example.com/pay" }: { href?: string }) { return <Button href={href}>Pay invoice</Button>; }`,
    });
    const out = io(dir);
    expect(await main(["emails", "--out", "migrated", "--design"], out, lib), out.out + out.err).toBe(0);
    const compare = io(dir);
    expect(await main(["compare", "emails/invoice.tsx", "migrated/invoice.tsx"], compare, lib), compare.out + compare.err).toBe(0);
    expect(fs.readFileSync(path.join(dir, "emails/invoice.tsx"), "utf8")).toBe(template);
    const design = fs.readFileSync(path.join(dir, "migrated/invoice.design.json"), "utf8");
    expect(design).toContain("Pay invoice");
    expect(design).toContain("https://example.com/pay");
  });

  it("rejects a value on a flag, so --write=false writes nothing", async () => {
    const source = `import { Html, Body, Text } from "@react-email/components";
export default function Template() { return <Html><Body><Text>Keep the original</Text></Body></Html>; }`;
    const dir = project({ "emails/welcome.tsx": source });
    for (const flag of ["--write=false", "--design=no", "--force=0"]) {
      const out = io(dir);
      expect(await main(["emails", flag], out, lib)).toBe(1);
      expect(out.err).toContain("takes no value");
      expect(fs.readFileSync(path.join(dir, "emails/welcome.tsx"), "utf8")).toBe(source);
    }
  });

  it("rejects an empty output path without replacing the original template", async () => {
    const source = `import { Html, Body, Text } from "@react-email/components";
export default function Template() { return <Html><Body><Text>Keep the original</Text></Body></Html>; }`;
    const dir = project({ "emails/welcome.tsx": source });
    for (const argv of [["emails", "--out", ""], ["emails", "--out="], ["emails", "--out", "   "]]) {
      const out = io(dir);
      expect(await main(argv, out, lib)).toBe(1);
      expect(out.err).toContain("--out needs a non-empty value");
      expect(out.out).toBe("");
      expect(fs.readFileSync(path.join(dir, "emails/welcome.tsx"), "utf8")).toBe(source);
    }
  });

  it("rejects colliding output paths before loading or writing any template, even with --force or --overwrite", async () => {
    const source = `import { Html } from "@react-email/components"; throw new Error("must not load");`;
    const dir = project({ "a/welcome.tsx": source, "b/welcome.tsx": source });
    for (const force of [[], ["--force"], ["--overwrite"]]) {
      const out = io(dir);
      expect(await main(["a", "b", "--out", "migrated", ...force], out, lib)).toBe(1);
      expect(out.err).toMatch(/same output.*welcome\.tsx/);
      expect(out.out).toBe("");
      expect(fs.existsSync(path.join(dir, "migrated"))).toBe(false);
    }
  });

  it("rejects colliding design names even when the template extensions differ", async () => {
    const source = `import { Html } from "@react-email/components"; throw new Error("must not load");`;
    const dir = project({ "emails/welcome.tsx": source, "emails/welcome.jsx": source });
    const out = io(dir);
    expect(await main(["emails", "--out", "migrated", "--design"], out, lib)).toBe(1);
    expect(out.err).toContain("welcome.design.json");
    expect(fs.existsSync(path.join(dir, "migrated"))).toBe(false);
  });

  it("preserves separate template paths under a common input folder", async () => {
    const template = (text: string) => `import { Html, Body, Text } from "@react-email/components";
export default function Template() { return <Html><Body><Text>${text}</Text></Body></Html>; }`;
    const dir = project({ "emails/a/welcome.tsx": template("Marketing welcome"), "emails/b/welcome.tsx": template("Purchase receipt") });
    const out = io(dir);
    expect(await main(["emails", "--out", "migrated", "--design"], out, lib)).toBe(0);
    expect(fs.readFileSync(path.join(dir, "migrated/a/welcome.tsx"), "utf8")).toContain("Marketing welcome");
    expect(fs.readFileSync(path.join(dir, "migrated/b/welcome.tsx"), "utf8")).toContain("Purchase receipt");
  });

  it("preserves a default CTA URL even when another link would mask its loss", async () => {
    const source = `import { Html, Body, Button } from "@react-email/components";
function CTA({ href = "https://example.com/pay" }: { href?: string }) { return <Button href={href}>Pay invoice</Button>; }
export default function Template({ href }: { href?: string }) { return <Html><Body><CTA href={href}/><Button href="https://example.com/pay">Help</Button></Body></Html>; }
Template.PreviewProps = { href: undefined };`;
    const dir = project({ "emails/default.tsx": source });
    const out = io(dir);
    expect(await main(["emails", "--out", "migrated"], out, lib)).toBe(0);
    const compare = io(dir);
    expect(await main(["compare", "emails/default.tsx", "migrated/default.tsx"], compare, lib)).toBe(0);
    // Check the actual output: the verifier's set of URLs alone can mask a lost CTA.
    const { tsImport } = await import("tsx/esm/api");
    const mod = await tsImport(path.join(dir, "migrated/default.tsx"), { parentURL: import.meta.url });
    const Template = mod.default.default ?? mod.default;
    const { renderToHtml } = await import("@unlayer/react-elements");
    const html = renderToHtml(Template({ href: undefined })).replace(/<!--[\s\S]*?-->/g, "");
    const links = [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)];
    const cta = links.find(([, , text]) => text.replace(/<[^>]*>/g, "").trim() === "Pay invoice");
    expect(cta?.[1]).toContain('href="https://example.com/pay"');
  });

  it("keeps a transformed URL as its sample value in --design", async () => {
    const source = `import { Html, Body, Button, Text } from "@react-email/components";
export default function Template({ code, name }: { code: string; name: string }) { return <Html><Body><Text>Hello {name}</Text><Button href={"https://example.com/coupon/" + code.toUpperCase()}>Redeem</Button></Body></Html>; }
Template.PreviewProps = { code: "VIP", name: "Alex" };`;
    const dir = project({ "emails/coupon.tsx": source });
    const out = io(dir);
    expect(await main(["emails", "--out", "migrated", "--design"], out, lib)).toBe(0);
    const design = fs.readFileSync(path.join(dir, "migrated/coupon.design.json"), "utf8");
    expect(design).toContain("https://example.com/coupon/VIP");
    expect(design).not.toContain("{{code}}");
    expect(design).toContain("{{name}}");
  });

  it("lists the web fonts the design uses in the report, for the editor's customFonts", async () => {
    const source = `import { Html, Head, Font, Body, Heading, Text } from "@react-email/components";
export default function Template() {
  return (
    <Html>
      <Head>
        <Font fontFamily="Inter" fallbackFontFamily="Arial" webFont={{ url: "https://fonts.gstatic.com/s/inter/v13/inter-400.woff2", format: "woff2" }} fontWeight={400} />
        <Font fontFamily="Inter" fallbackFontFamily="Arial" webFont={{ url: "https://fonts.gstatic.com/s/inter/v13/inter-600.woff2", format: "woff2" }} fontWeight={600} />
      </Head>
      <Body style={{ fontFamily: "Inter, Arial, sans-serif" }}><Heading>Your receipt</Heading><Text>Thanks for your order.</Text></Body>
    </Html>
  );
}`;
    const dir = project({ "emails/receipt.tsx": source });
    const out = io(dir);
    expect(await main(["emails", "--out", "migrated", "--design", "--report", "report.json"], out, lib), out.out + out.err).toBe(0);
    const [result] = JSON.parse(fs.readFileSync(path.join(dir, "report.json"), "utf8"));
    expect(result.fonts).toEqual([{ label: "Inter", value: "Inter, Arial, sans-serif", url: "https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" }]);
  });

  it("builds the design from the migrated preview props, whose JSX has styles instead of classes", async () => {
    const source = `import { Html, Body, Tailwind, Text } from "@react-email/components";
export default function Template({ note }: { note: React.ReactNode }) {
  return <Html><Tailwind><Body><Text>Hello</Text>{note}</Body></Tailwind></Html>;
}
Template.PreviewProps = { note: <p className="mb-5">Read the docs</p> };`;
    const dir = project({ "emails/note.tsx": source });
    const out = io(dir);
    expect(await main(["emails", "--out", "migrated", "--design", "--no-merge-tags"], out, lib), out.out + out.err).toBe(0);
    const design = fs.readFileSync(path.join(dir, "migrated/note.design.json"), "utf8");
    expect(design).toContain("Read the docs");
    expect(design).not.toContain("mb-5");
  });

  it("checks a memo or forwardRef template as exported, and it renders as JSX with its root's settings", async () => {
    for (const wrap of ["memo", "forwardRef"]) {
      const source = `import React from "react";
import { Html, Body, Text } from "@react-email/components";
function Template({ name }: { name: string }) { return <Html lang="ar" dir="rtl"><Body><Text>مرحبا {name}</Text></Body></Html>; }
const Exported = React.${wrap}(${wrap === "memo" ? "Template" : "(props: { name: string }, _ref) => <Template {...props} />"});
(Exported as any).PreviewProps = { name: "Ada" };
export default Exported;`;
      const dir = project({ "emails/greeting.tsx": source });
      const out = io(dir);
      expect(await main(["emails", "--out", "migrated"], out, lib), out.out + out.err).toBe(0);
      const { tsImport } = await import("tsx/esm/api");
      const mod = await tsImport(path.join(dir, "migrated/greeting.tsx"), { parentURL: import.meta.url });
      const Template = mod.default.default ?? mod.default;
      const { renderToHtml } = await import("@unlayer/react-elements");
      const html = renderToHtml(React.createElement(Template, { name: "Ada" }));
      expect(html).toContain('lang="ar"');
      expect(html).toContain('dir="rtl"');
      expect(html).toContain("Ada");
    }
  });

  it("migrates a template that calls React hooks, and one of its components that does, in both modes", async () => {
    const source = `import { useId, useMemo, useState } from "react";
import { Html, Body, Heading, Text } from "@react-email/components";
function Count({ items }: { items: string[] }) { const [shown] = useState(items.length); return <Text>You have {shown} items</Text>; }
export default function Hooky({ name = "Ada", items = ["a", "b"] }: { name?: string; items?: string[] }) {
  const greeting = useMemo(() => "Hello " + name, [name]);
  useId();
  return <Html><Body><Heading>{greeting}</Heading><Count items={items} /></Body></Html>;
}
Hooky.PreviewProps = { name: "Ada", items: ["a", "b", "c"] };`;
    const dir = project({ "emails/hooky.tsx": source });
    const out = io(dir);
    expect(await main(["emails", "--out", "migrated", "--design"], out, lib), out.out + out.err).toBe(0);
    expect(out.out).toContain("1 migrated and checked");
    expect(fs.readFileSync(path.join(dir, "migrated/hooky.design.json"), "utf8")).toContain("You have 3 items");
    const { default: Hooky } = await import(path.join(dir, "emails/hooky.tsx"));
    const words = (await lib.convertReactEmail(Hooky)).html().replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    expect(words).toContain("Hello {{name}}"); // a text prop shown as given: a merge tag
    expect(words).toContain("You have 3 items");
  });

  it("fails what it can't verify, saying why, and what phones or Tailwind's sm: show differently", async () => {
    const unreadable = `import { Html, Head, Body, Text } from "@react-email/components";
export default function T() { return <Html><Head><style>{"p:has(b) { color: #ff0000 }"}</style></Head><Body><Text>Hello there</Text></Body></Html>; }`;
    const responsive = `import { Html, Head, Body, Text, Tailwind } from "@react-email/components";
export default function T() { return <Html><Tailwind><Head /><Body><Text className="hidden sm:block">Desktop only</Text><Text>Always</Text></Body></Tailwind></Html>; }`;
    const dir = project({ "emails/unreadable.tsx": unreadable, "emails/responsive.tsx": responsive });
    const out = io(dir);
    expect(await main(["emails", "--out", "migrated"], out, lib), out.out + out.err).toBe(2);
    expect(out.out).toMatch(/✗ emails\/unreadable\.tsx: check failed \(couldn't verify: the color of "Hello", "there" \(the rule `p:has\(b\)`/);
    expect(out.out).toMatch(/✗ emails\/responsive\.tsx: check failed \(lost text: "Desktop", "only"/);
    expect(fs.existsSync(path.join(dir, "migrated/unreadable.tsx"))).toBe(false);
  });

  it("fails a migration that moves text across the page: columns stacked into one", async () => {
    const hybrid = `import { Html, Head, Body, Container, Section, Text } from "@react-email/components";
export default function Hybrid() {
  return <Html><Head /><Body style={{ margin: 0 }}><Container style={{ width: "600px" }}>
    <Section>
      <div style={{ display: "inline-block", width: "50%", verticalAlign: "top" }}><Text>Left hybrid column</Text></div>
      <div style={{ display: "inline-block", width: "50%", verticalAlign: "top" }}><Text>Right hybrid column</Text></div>
    </Section>
  </Container></Body></Html>;
}`;
    const dir = project({ "emails/hybrid.tsx": hybrid });
    const out = io(dir);
    expect(await main(["emails", "--out", "migrated"], out, lib), out.out + out.err).toBe(2);
    expect(out.out).toMatch(/✗ emails\/hybrid\.tsx: check failed \(moved: "Right", "hybrid", "column" 300px to the left\)/);
  });

  it("fails the check when a style computed from props would be dropped, naming it", async () => {
    const source = `import { Html, Body, Text } from "@react-email/components";
export default function Code({ code, color, size }: { code: string; color: string; size: number }) {
  return <Html><Body style={{ backgroundColor: "#000000" }}><Text style={{ color, fontSize: size, margin: 0 }}>{code}</Text></Body></Html>;
}
Code.PreviewProps = { code: "482913", color: "#ffffff", size: 24 };`;
    const dir = project({ "emails/code.tsx": source });
    const out = io(dir);
    expect(await main(["emails", "--out", "migrated", "--report", "report.json"], out, lib)).toBe(2);
    expect(out.out).toContain("lost styles");
    expect(fs.existsSync(path.join(dir, "migrated/code.tsx"))).toBe(false);
    const [result] = JSON.parse(fs.readFileSync(path.join(dir, "report.json"), "utf8"));
    expect(result.status).toBe("check-failed");
    expect(result.lostStyles).toEqual(["line 3: color", "line 3: fontSize: size"]);
  });

  it("migrates, checks and writes templates to --out, with design JSON and a report", async () => {
    const dir = project({ "emails/welcome.tsx": WELCOME, "emails/components/button.tsx": SHARED, "lib/format.ts": FORMAT });
    const out = io(dir);
    const code = await main(["emails", "--out", "migrated", "--design", "--report", "migration.md"], out, lib);
    expect(out.err).toBe("");
    expect(code, out.out + out.err).toBe(0);
    expect(out.out).toMatch(/✓ emails\/welcome\.tsx: 100% editable/);
    expect(out.out).toMatch(/- emails\/components\/button\.tsx: skipped \(no default-exported component/);

    const migrated = fs.readFileSync(path.join(dir, "migrated/welcome.tsx"), "utf8");
    expect(migrated).toContain('from "@unlayer/react-elements"');
    expect(migrated).not.toContain("@react-email/components");
    // The same-file layout was inlined; the import still reaches lib/format from the new folder.
    expect(migrated).not.toContain("function Layout");
    expect(migrated).toContain('from "../lib/format"');
    expect(migrated).toContain("steps.map((step, i)");

    const design = JSON.parse(fs.readFileSync(path.join(dir, "migrated/welcome.design.json"), "utf8"));
    expect(design.body.rows.length).toBeGreaterThan(2);
    const report = fs.readFileSync(path.join(dir, "migration.md"), "utf8");
    expect(report).toContain("| emails/welcome.tsx | migrated | 100% | passed |");
    // The original is untouched without --write.
    expect(fs.readFileSync(path.join(dir, "emails/welcome.tsx"), "utf8")).toBe(WELCOME);
  });

  it("inlines components imported from other files, bringing what they use", async () => {
    const layout = `import { Body, Container, Head, Html, Preview, Tailwind, Text } from "@react-email/components";
import { brand } from "../../lib/brand";

const footerNote = "Sent by";

export function Layout({ preview, children }: { preview: string; children: React.ReactNode }) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Tailwind>
        <Body className="bg-gray-100 font-sans">
          <Container className="mx-auto bg-white p-8">
            {children}
            <Text className="text-xs text-gray-500">{footerNote} {brand}</Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
`;
    const order = `import { Text } from "@react-email/components";
import { Layout } from "./components/layout";

export default function Order({ id }: { id: string }) {
  return (
    <Layout preview={\`Order \${id} shipped\`}>
      <Text className="text-lg font-bold">Order {id} is on its way</Text>
    </Layout>
  );
}

Order.PreviewProps = { id: "A-100" };
`;
    const dir = project({ "emails/order.tsx": order, "emails/components/layout.tsx": layout, "lib/brand.ts": `export const brand = "Acme";\n` });
    const out = io(dir);
    expect(await main(["emails", "--write"], out, lib), out.out + out.err).toBe(
      0,
    );
    expect(out.out).toMatch(/✓ emails\/order\.tsx: 100% editable/);
    const migrated = fs.readFileSync(path.join(dir, "emails/order.tsx"), "utf8");
    expect(migrated).not.toContain("./components/layout");
    expect(migrated).toContain('from "../lib/brand"');
    expect(migrated).toContain("previewText={plainText(`Order ${id} shipped`)}");
    expect(migrated).toContain("Sent by {brand}");
    // footerNote's value was written into the text: its copied declaration went.
    expect(migrated).not.toContain("footerNote");
    // The shared component file itself is left alone (it isn't a template).
    expect(fs.readFileSync(path.join(dir, "emails/components/layout.tsx"), "utf8")).toBe(layout);
  });

  it("follows imports through re-export files to decide what's shared in --write", async () => {
    const template = (text: string) => `import { Html, Body, Text } from "@react-email/components";
export default function Template() { return <Html><Body><Text>${text}</Text></Body></Html>; }`;
    const footer = `import { Text } from "@react-email/components";
export function Footer() { return <Text>Sent by Acme</Text>; }`;
    const receipt = `import { Html, Body, Text } from "@react-email/components";
import { Footer } from "../shared";
export default function Receipt() { return <Html><Body><Text>Your receipt</Text><Footer /></Body></Html>; }`;
    const dir = project({
      "emails/activation.tsx": template("Activate your account"),
      "emails/welcome.tsx": template("Welcome aboard"),
      // A barrel only passes templates on: it doesn't make them shared.
      "emails/index.ts": `export { default as Activation } from "./activation";\nexport { default as Welcome } from "./welcome";\n`,
      "emails/receipt.tsx": receipt,
      "emails/components/footer.tsx": footer,
      // A barrel outside the folder: the footer it passes on is shared.
      "shared/index.ts": `export { Footer } from "../emails/components/footer";\n`,
    });
    const out = io(dir);
    expect(await main(["emails", "--write"], out, lib), out.out + out.err).toBe(0);
    expect(out.out).toMatch(/✓ emails\/activation\.tsx/);
    expect(out.out).toMatch(/✓ emails\/welcome\.tsx/);
    expect(out.out).toMatch(/- emails\/components\/footer\.tsx: skipped \(imported by emails\/receipt\.tsx/);
    expect(fs.readFileSync(path.join(dir, "emails/components/footer.tsx"), "utf8")).toBe(footer);
    expect(fs.readFileSync(path.join(dir, "emails/activation.tsx"), "utf8")).toContain("@unlayer/react-elements");
  });

  it("counts a file reached through `export *` as used only when it defines the imported name", async () => {
    const template = (text: string) => `import { Html, Body, Text } from "@react-email/components";
export default function Template() { return <Html><Body><Text>${text}</Text></Body></Html>; }`;
    const footer = `import { Text } from "@react-email/components";
export function Footer() { return <Text>Sent by Acme</Text>; }`;
    const dir = project({
      "emails/welcome.tsx": template("Welcome aboard"),
      "emails/footer.tsx": footer,
      "emails/index.ts": `export * from "./footer";\nexport * from "./welcome";\n`,
      "emails/receipt.tsx": `import { Html, Body, Text } from "@react-email/components";
import { Footer } from "./index";
export default function Receipt() { return <Html><Body><Text>Your receipt</Text><Footer /></Body></Html>; }`,
    });
    const out = io(dir);
    expect(await main(["emails", "--write"], out, lib), out.out + out.err).toBe(0);
    expect(out.out).toMatch(/✓ emails\/welcome\.tsx/);
    expect(out.out).toMatch(/- emails\/footer\.tsx: skipped \(imported by emails\/receipt\.tsx/);
  });

  it("follows a barrel that imports a layout and exports it again: --write leaves the layout alone and inlines it", async () => {
    const shell = `import { Html, Body, Container } from "@react-email/components";
export default function Shell({ children }: { children?: React.ReactNode }) { return <Html><Body><Container>{children}</Container></Body></Html>; }`;
    const welcome = `import { Text } from "@react-email/components";
import { Shell } from "../components";
export default function Welcome() { return <Shell><Text>Welcome aboard</Text></Shell>; }`;
    for (const barrel of [`import Shell from "../emails/Shell";\nexport { Shell };\n`, `import Layout from "../emails/Shell";\nexport { Layout as Shell };\n`, `export { default as Shell } from "../emails/Shell";\n`]) {
      const dir = project({ "emails/Shell.tsx": shell, "emails/welcome.tsx": welcome, "components/index.ts": barrel });
      const out = io(dir);
      expect(await main(["emails", "--write"], out, lib), out.out + out.err).toBe(0);
      expect(out.out, barrel).toMatch(/- emails\/Shell\.tsx: skipped \(imported by emails\/welcome\.tsx/);
      expect(fs.readFileSync(path.join(dir, "emails/Shell.tsx"), "utf8")).toBe(shell);
      // The layout's markup is in the migrated template, which no longer needs the barrel.
      expect(out.out, barrel).toMatch(/✓ emails\/welcome\.tsx: 100% editable/);
      const migrated = fs.readFileSync(path.join(dir, "emails/welcome.tsx"), "utf8");
      expect(migrated).toMatch(/<Paragraph[^>]*>\s*Welcome aboard/);
      expect(migrated).not.toContain("components");
    }
  });

  it("follows `export default` of an imported layout, and a namespace passed on", async () => {
    const shell = `import { Html, Body } from "@react-email/components";
export default function Shell({ children }: { children?: React.ReactNode }) { return <Html><Body>{children}</Body></Html>; }`;
    const dir = project({
      "emails/Shell.tsx": shell,
      "layouts/shell.ts": `import Shell from "../emails/Shell";\nexport default Shell;\n`,
      "emails/welcome.tsx": `import { Text } from "@react-email/components";
import Shell from "../layouts/shell";
export default function Welcome() { return <Shell><Text>Welcome aboard</Text></Shell>; }`,
      "emails/Footer.tsx": shell.replace(/Shell/g, "Footer"),
      "layouts/all.ts": `export * as Parts from "../emails/Footer";\n`,
      "emails/receipt.tsx": `import { Text } from "@react-email/components";
import { Parts } from "../layouts/all";
export default function Receipt() { return <Parts.default><Text>Your receipt</Text></Parts.default>; }`,
    });
    const out = io(dir);
    await main(["emails", "--write"], out, lib);
    expect(out.out).toMatch(/- emails\/Shell\.tsx: skipped \(imported by emails\/welcome\.tsx/);
    expect(out.out).toMatch(/- emails\/Footer\.tsx: skipped \(imported by emails\/receipt\.tsx/);
    expect(fs.readFileSync(path.join(dir, "emails/Shell.tsx"), "utf8")).toBe(shell);
  });

  it("reads jsconfig.json paths (Next.js) to load templates and to find what's shared", async () => {
    const layout = `import { Html, Body, Container } from "@react-email/components";
export default function Layout({ children }) { return <Html><Body><Container>{children}</Container></Body></Html>; }`;
    const dir = project({
      "jsconfig.json": JSON.stringify({ compilerOptions: { baseUrl: ".", paths: { "@/*": ["./*"] } } }),
      "emails/layout.jsx": layout,
      "emails/welcome.jsx": `import { Text } from "@react-email/components";\nimport Layout from "@/emails/layout";\nexport default function Welcome() { return <Layout><Text>Welcome aboard</Text></Layout>; }`,
    });
    const out = io(dir);
    expect(await main(["emails", "--write"], out, lib), out.out + out.err).toBe(0);
    expect(out.out).toMatch(/- emails\/layout\.jsx: skipped \(imported by emails\/welcome\.jsx/);
    expect(out.out).toMatch(/✓ emails\/welcome\.jsx: 100% editable/);
    expect(fs.readFileSync(path.join(dir, "emails/layout.jsx"), "utf8")).toBe(layout);
  });

  it("follows a workspace package linked into node_modules to its source", async () => {
    const layout = `import { Html, Body, Container } from "@react-email/components";
export default function Layout({ children }: { children?: React.ReactNode }) { return <Html><Body><Container>{children}</Container></Body></Html>; }`;
    const dir = project({
      "packages/email-ui/package.json": JSON.stringify({ name: "@acme/email-ui", main: "Layout.tsx", types: "Layout.tsx" }),
      "packages/email-ui/Layout.tsx": layout,
      "apps/web/emails/welcome.tsx": `import { Text } from "@react-email/components";\nimport Layout from "@acme/email-ui";\nexport default function Welcome() { return <Layout><Text>Welcome aboard</Text></Layout>; }`,
    });
    fs.mkdirSync(path.join(dir, "node_modules/@acme"), { recursive: true });
    fs.symlinkSync(path.join(dir, "packages/email-ui"), path.join(dir, "node_modules/@acme/email-ui"), "dir");
    const out = io(dir);
    await main([".", "--write"], out, lib);
    expect(out.out).toMatch(/- packages\/email-ui\/Layout\.tsx: skipped \(imported by apps\/web\/emails\/welcome\.tsx/);
    expect(fs.readFileSync(path.join(dir, "packages/email-ui/Layout.tsx"), "utf8")).toBe(layout);
  });

  it("leaves a layout alone with --write when a template reaches it through a component file outside the folder", async () => {
    const base = `import { Html, Body } from "@react-email/components";
export default function Base({ content }: { content?: React.ReactNode }) { return <Html><Body>{content}</Body></Html>; }`;
    const dir = project({
      "emails/layouts/base.tsx": base,
      "src/shell.tsx": `import Base from "../emails/layouts/base";\nexport function Shell({ content }: { content?: React.ReactNode }) { return <Base content={content} />; }`,
      "emails/promo.tsx": `import { Text } from "@react-email/components";\nimport { Shell } from "../src/shell";\nexport default function Promo() { return <Shell content={<Text>Big sale today</Text>} />; }\nPromo.PreviewProps = {};`,
    });
    const out = io(dir);
    await main(["emails", "--write"], out, lib);
    expect(out.out).toMatch(/- emails\/layouts\/base\.tsx: skipped \(a shared piece .* that src\/shell\.tsx \(outside the folder\) may render for emails\/promo\.tsx: left as it is\)/);
    expect(fs.readFileSync(path.join(dir, "emails/layouts/base.tsx"), "utf8")).toBe(base);
  });

  it("leaves a layout alone with --write even when the import of it can't be followed", async () => {
    const layout = `import { Html, Body, Container } from "@react-email/components";
export default function Layout(props: { children?: React.ReactNode }) { return <Html><Body><Container>{props.children}</Container></Body></Html>; }`;
    const dir = project({
      "emails/layout.tsx": layout,
      "emails/welcome.tsx": `import { Text } from "@react-email/components";\n// @ts-ignore\nimport Layout from "unknown-alias/layout";\nexport default function Welcome() { return <Layout><Text>Welcome aboard</Text></Layout>; }`,
      "emails/receipt.tsx": `import { Html, Body, Text } from "@react-email/components";\nexport default function Receipt({ children = "Your receipt" }) { return <Html><Body><Text>Thanks, the team. Our children's charity thanks you too.</Text></Body></Html>; }`,
    });
    const out = io(dir);
    await main(["emails", "--write"], out, lib);
    expect(out.out).toMatch(/- emails\/layout\.tsx: skipped \(a layout \(it renders its children\)/);
    expect(fs.readFileSync(path.join(dir, "emails/layout.tsx"), "utf8")).toBe(layout);
    // A template whose props happen to include a `children` default, or whose text says "children", is still an email.
    expect(out.out).toMatch(/✓ emails\/receipt\.tsx/);
  });

  it("writes a template that renders optional children but has PreviewProps: an email of its own", async () => {
    const notice = `import type { ReactNode } from "react";
import { Html, Body, Container, Text, Heading } from "@react-email/components";
export default function Notice({ title = "Heads up", children }: { title?: string; children?: ReactNode }) {
  return <Html><Body><Container><Heading>{title}</Heading><Text>Your plan renews soon.</Text>{children}</Container></Body></Html>;
}
Notice.PreviewProps = { title: "Heads up" };`;
    const dir = project({ "emails/notice.tsx": notice });
    const out = io(dir);
    expect(await main(["emails", "--write"], out, lib), out.out + out.err).toBe(0);
    expect(out.out).toContain("1 migrated and checked. 1 written.");
    expect(fs.readFileSync(path.join(dir, "emails/notice.tsx"), "utf8")).toContain("@unlayer/react-elements");
  });

  it("migrates a template whose comment mentions Elements' import: only a real import means it's done", async () => {
    const source = `// Next: import { Email } from "@unlayer/react-elements" once migrated.
import { Html, Body, Text } from "@react-email/components";
/* see from "@unlayer/react-elements" */
export default function T() { return <Html><Body><Text>Keep the original</Text></Body></Html>; }`;
    const dir = project({ "emails/t.tsx": source, "emails/done.tsx": `import { Email } from "@unlayer/react-elements";\nexport default function Done() { return <Email />; }` });
    const out = io(dir);
    expect(await main(["emails"], out, lib), out.out + out.err).toBe(0);
    expect(out.out).toMatch(/✓ emails\/t\.tsx: 100% editable/);
    expect(out.out).toContain("1 migrated and checked");
  });

  it("leaves a shared component alone even when it's the only file given", async () => {
    const footer = `import { Section, Text } from "@react-email/components";
export default function Footer() { return <Section><Text>Sent by Acme</Text></Section>; }`;
    const dir = project({ "emails/components/footer.tsx": footer });
    const out = io(dir);
    expect(await main(["emails/components/footer.tsx", "--write"], out, lib), out.out + out.err).toBe(0);
    expect(out.out).toContain("not an email template");
    expect(fs.readFileSync(path.join(dir, "emails/components/footer.tsx"), "utf8")).toBe(footer);
  });

  it("says the same about a shared component in a dry run as --write does", async () => {
    const footer = `import { Section, Text } from "@react-email/components";
export default function Footer() { return <Section><Text>Sent by Acme</Text></Section>; }`;
    const dir = project({ "emails/components/footer.tsx": footer });
    const out = io(dir);
    expect(await main(["emails/components/footer.tsx"], out, lib), out.out + out.err).toBe(0);
    expect(out.out).toContain("not an email template");
  });

  it("skips templates already migrated, so running --write again changes nothing", async () => {
    const dir = project({ "emails/welcome.tsx": WELCOME, "lib/format.ts": FORMAT });
    const first = io(dir);
    expect(await main(["emails", "--write"], first, lib), first.out + first.err).toBe(0);
    const migrated = fs.readFileSync(path.join(dir, "emails/welcome.tsx"), "utf8");
    const again = io(dir);
    expect(await main(["emails", "--write"], again, lib), again.out + again.err).toBe(0);
    expect(again.out).toContain("already migrated");
    expect(fs.readFileSync(path.join(dir, "emails/welcome.tsx"), "utf8")).toBe(migrated);
  });

  it("says to rename a .js template with JSX to .jsx", async () => {
    const dir = project({ "emails/hello.js": `import { Html, Body, Text } from "@react-email/components";
export default function Hello() { return <Html><Body><Text>Hello</Text></Body></Html>; }
` });
    const out = io(dir);
    expect(await main(["emails"], out, lib)).toBe(2);
    expect(out.out).toContain("rename it to .jsx");
  });

  it("checks without writing by default, and replaces templates with --write", async () => {
    const dir = project({ "emails/welcome.tsx": WELCOME, "lib/format.ts": FORMAT });
    const dry = io(dir);
    expect(
      await main(["emails/welcome.tsx"], dry, lib),
      dry.out + dry.err,
    ).toBe(0);
    expect(dry.out).toContain("Nothing written");
    expect(fs.readFileSync(path.join(dir, "emails/welcome.tsx"), "utf8")).toBe(WELCOME);

    const write = io(dir);
    expect(await main(["emails", "--write"], write, lib)).toBe(0);
    expect(fs.readFileSync(path.join(dir, "emails/welcome.tsx"), "utf8")).toContain('from "@unlayer/react-elements"');
    expect(fs.readdirSync(path.join(dir, "emails")).filter((f) => f.includes("unlayer-migrate"))).toEqual([]);
  });

  it("reports a template that doesn't render, exits with 2 and leaves it as it is", async () => {
    const broken = `import { Html } from "@react-email/components";\nexport default function B() { return <Html>{missing}</Html> }\nB.PreviewProps = {};\n`;
    const dir = project({ "emails/broken.tsx": broken });
    const out = io(dir);
    const code = await main(["emails", "--write"], out, lib);
    expect(code).toBe(2);
    expect(out.out).toMatch(/✗ emails\/broken\.tsx: .*doesn't render: .*missing is not defined/);
    expect(fs.readFileSync(path.join(dir, "emails/broken.tsx"), "utf8")).toBe(broken);
  });

  it("writes merge tags for text props into the design JSON, or sample values with --no-merge-tags", async () => {
    const hello = `import { Body, Container, Html, Text } from "@react-email/components";
export default function Hello({ name }: { name: string }) {
  return <Html><Body><Container><Text>Hello {name}, welcome aboard.</Text></Container></Body></Html>;
}
Hello.PreviewProps = { name: "Alex" };
`;
    const dir = project({ "emails/hello.tsx": hello });
    const tagged = io(dir);
    expect(await main(["emails", "--out", "a", "--design", "--report", "a.md"], tagged, lib)).toBe(0);
    expect(fs.readFileSync(path.join(dir, "a/hello.design.json"), "utf8")).toContain("Hello {{name}}, welcome aboard.");
    expect(fs.readFileSync(path.join(dir, "a.md"), "utf8")).toContain("text props became merge tags in the design JSON: `name`");
    const plain = io(dir);
    expect(await main(["emails", "--out", "b", "--design", "--no-merge-tags"], plain, lib)).toBe(0);
    const design = fs.readFileSync(path.join(dir, "b/hello.design.json"), "utf8");
    expect(design).toContain("Hello Alex, welcome aboard.");
    expect(design).not.toContain("{{");
  });

  it("compares a template migrated by hand with the original", async () => {
    const original = `import { Body, Button, Container, Html, Text } from "@react-email/components";
export default function Hi({ name }: { name: string }) {
  return <Html><Body><Container><Text>Hello {name}, welcome aboard.</Text><Button href="https://example.com">Start</Button></Container></Body></Html>;
}
Hi.PreviewProps = { name: "Alex" };
`;
    // The original's look: a white page, and a button that looks like a link on the left (React Email's Button has no colors of its own).
    const migrated = (text: string, button = 'backgroundColor="transparent" color="#0000ee" fontSize="16px" textAlign="left"') => `import { Button, Column, Email, Paragraph, Row } from "@unlayer/react-elements";
export default function Hi({ name }: { name: string }) {
  return <Email backgroundColor="#ffffff"><Row><Column><Paragraph>${text}</Paragraph><Button href="https://example.com" ${button}>Start</Button></Column></Row></Email>;
}
`;
    const dir = project({ "emails/hi.tsx": original, "migrated/good.tsx": migrated("Hello {name}, welcome aboard."), "migrated/bad.tsx": migrated("Hello {name}, welcome."), "migrated/styled.tsx": migrated("Hello {name}, welcome aboard.", "") });
    const good = io(dir);
    expect(await main(["compare", "emails/hi.tsx", "migrated/good.tsx"], good, lib), good.out).toBe(0);
    expect(good.out).toMatch(/✓ migrated\/good\.tsx against emails\/hi\.tsx: same words, links and images/);
    const bad = io(dir);
    expect(await main(["compare", "emails/hi.tsx", "migrated/bad.tsx"], bad, lib)).toBe(2);
    expect(bad.out).toContain('lost text: "aboard"');
    // The same words, with Elements' own button colors: shown in another style.
    const styled = io(dir);
    expect(await main(["compare", "emails/hi.tsx", "migrated/styled.tsx"], styled, lib)).toBe(2);
    expect(styled.out).toMatch(/shown in another style: .*color #0000ee → #ffffff on "Start"/);
    const usage = io(dir);
    expect(await main(["compare", "emails/hi.tsx"], usage, lib)).toBe(1);
  });

  it("doesn't take the next flag as an option's value (`--report --write`)", async () => {
    const dir = project({ "emails/welcome.tsx": WELCOME, "lib/format.ts": FORMAT });
    const out = io(dir);
    expect(await main(["emails", "--report", "--write"], out, lib)).toBe(1);
    expect(out.err).toContain("--report needs a value before --write");
    expect(fs.existsSync(path.join(dir, "--write"))).toBe(false);
    expect(fs.readFileSync(path.join(dir, "emails/welcome.tsx"), "utf8")).toBe(WELCOME);
  });

  it("explains usage mistakes", async () => {
    const dir = project({});
    const mistakes: Array<[string[], string]> = [
      [[], "Pass the templates to migrate"],
      [["--write", "--out", "x", "emails"], "Use --write or --out, not both"],
      [["nope"], "Not found: nope"],
      [["--bogus"], "Unknown option: --bogus"],
      [["--from", "mjml", "x"], 'Unknown --from "mjml"'],
    ];
    for (const [argv, message] of mistakes) {
      const out = io(dir);
      expect(await main(argv, out, lib)).toBe(1);
      expect(out.err, argv.join(" ")).toContain(message);
    }
    const help = io(dir);
    expect(await main(["--help"], help, lib)).toBe(0);
    expect(help.out).toContain("npx @unlayer/migrate");
  });
});

describe("destination safety and content checks", () => {
  const source = `import { Html, Body, Text } from "@react-email/components";
export default function T() { return <Html><Body><Text>Pay $1.00 today</Text></Body></Html>; }`;

  it.each(["template", "design", "directory"])(
    "rejects a %s symlink before executing templates",
    async (kind) => {
      const original = source + '\nthrow new Error("must not execute");';
      const dir = project({
        "emails/nested/t.tsx": original,
        "elsewhere/t.tsx": "untouched",
        "elsewhere/t.design.json": "untouched",
      });
      fs.mkdirSync(path.join(dir, "migrated"));
      if (kind === "directory")
        fs.symlinkSync(
          path.join(dir, "elsewhere"),
          path.join(dir, "migrated/nested"),
          "dir",
        );
      else {
        fs.mkdirSync(path.join(dir, "migrated/nested"));
        fs.symlinkSync(
          path.join(
            dir,
            kind === "template"
              ? "emails/nested/t.tsx"
              : "elsewhere/t.design.json",
          ),
          path.join(
            dir,
            kind === "template"
              ? "migrated/nested/t.tsx"
              : "migrated/nested/t.design.json",
          ),
        );
      }
      const out = io(dir);
      expect(
        await main(
          ["emails", "--out", "migrated", "--design", "--force"],
          out,
          lib,
        ),
      ).toBe(1);
      expect(out.err).toContain("Refusing symlink output");
      expect(out.out).toBe("");
      expect(
        fs.readFileSync(path.join(dir, "emails/nested/t.tsx"), "utf8"),
      ).toBe(original);
      expect(fs.readFileSync(path.join(dir, "elsewhere/t.tsx"), "utf8")).toBe(
        "untouched",
      );
      expect(
        fs.readFileSync(path.join(dir, "elsewhere/t.design.json"), "utf8"),
      ).toBe("untouched");
    },
  );

  it("rejects --out overlapping an original, without executing it", async () => {
    const original = source + '\nthrow new Error("must not execute");';
    const dir = project({ "emails/t.tsx": original });
    const out = io(dir);
    expect(await main(["emails", "--out", "emails"], out, lib)).toBe(1);
    expect(out.err).toContain("source input");
    expect(fs.readFileSync(path.join(dir, "emails/t.tsx"), "utf8")).toBe(
      original,
    );
  });

  it("rejects a changed price in compare", async () => {
    const migrated = `import { Email, Row, Column, Paragraph } from "@unlayer/react-elements";
export default function T() { return <Email><Row><Column><Paragraph>Pay $100 today</Paragraph></Column></Row></Email>; }`;
    const dir = project({ "emails/t.tsx": source, "wrong.tsx": migrated });
    const out = io(dir);
    expect(await main(["compare", "emails/t.tsx", "wrong.tsx"], out, lib)).toBe(
      2,
    );
    expect(out.out).toContain("$1.00");
  });
});

describe("failed verification writes", () => {
  it("leaves originals and outputs untouched unless --force is requested, and cleans probes", async () => {
    const source = `import { Html, Body, Text } from "@react-email/components";
export default function T() {
  const text = import.meta.url.includes(".unlayer-migrate-") ? "Changed" : "Keep this content";
  return <Html><Body><Text>{text}</Text></Body></Html>;
}`;
    const dir = project({ "emails/t.tsx": source });
    for (const flags of [["--write"], ["--out", "migrated", "--design"]]) {
      const out = io(dir);
      expect(await main(["emails", ...flags], out, lib), out.out + out.err).toBe(2);
      expect(out.out).toContain("lost text");
      expect(fs.readFileSync(path.join(dir, "emails/t.tsx"), "utf8")).toBe(source);
      expect(fs.existsSync(path.join(dir, "migrated"))).toBe(false);
      expect(fs.readdirSync(path.join(dir, "emails"))).toEqual(["t.tsx"]);
    }
    const forced = io(dir);
    expect(await main(["emails", "--out", "forced", "--design", "--force"], forced, lib), forced.out + forced.err).toBe(2);
    expect(fs.readdirSync(path.join(dir, "forced"))).toEqual(["t.design.json", "t.tsx"]);
    expect(fs.readdirSync(path.join(dir, "emails"))).toEqual(["t.tsx"]);
  });
});
