import { afterEach, describe, expect, it } from "vitest";
import fs from "node:fs";
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
  return dir;
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

  it("rejects colliding output paths before loading or writing any template, even with --force", async () => {
    const source = `import { Html } from "@react-email/components"; throw new Error("must not load");`;
    const dir = project({ "a/welcome.tsx": source, "b/welcome.tsx": source });
    for (const force of [[], ["--force"]]) {
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

  it("migrates, checks and writes templates to --out, with design JSON and a report", async () => {
    const dir = project({ "emails/welcome.tsx": WELCOME, "emails/components/button.tsx": SHARED, "lib/format.ts": FORMAT });
    const out = io(dir);
    const code = await main(["emails", "--out", "migrated", "--design", "--report", "migration.md"], out, lib);
    expect(out.err).toBe("");
    expect(code).toBe(0);
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
    expect(await main(["emails", "--write"], out, lib)).toBe(0);
    expect(out.out).toMatch(/✓ emails\/order\.tsx: 100% editable/);
    const migrated = fs.readFileSync(path.join(dir, "emails/order.tsx"), "utf8");
    expect(migrated).not.toContain("./components/layout");
    expect(migrated).toContain('from "../lib/brand"');
    expect(migrated).toContain("previewText={`Order ${id} shipped`}");
    expect(migrated).toContain("Sent by {brand}");
    // footerNote's value was written into the text: its copied declaration went.
    expect(migrated).not.toContain("footerNote");
    // The shared component file itself is left alone (it isn't a template).
    expect(fs.readFileSync(path.join(dir, "emails/components/layout.tsx"), "utf8")).toBe(layout);
  });

  it("checks without writing by default, and replaces templates with --write", async () => {
    const dir = project({ "emails/welcome.tsx": WELCOME, "lib/format.ts": FORMAT });
    const dry = io(dir);
    expect(await main(["emails/welcome.tsx"], dry, lib)).toBe(0);
    expect(dry.out).toContain("Nothing written");
    expect(fs.readFileSync(path.join(dir, "emails/welcome.tsx"), "utf8")).toBe(WELCOME);

    const write = io(dir);
    expect(await main(["emails", "--write"], write, lib)).toBe(0);
    expect(fs.readFileSync(path.join(dir, "emails/welcome.tsx"), "utf8")).toContain('from "@unlayer/react-elements"');
    expect(fs.readdirSync(path.join(dir, "emails")).filter((f) => f.includes("unlayer-migrate"))).toEqual([]);
  });

  it("reports templates it can't load and exits with 2, writing nothing for them", async () => {
    const dir = project({ "emails/broken.tsx": `import { Html } from "@react-email/components";\nexport default function B() { return <Html>{missing}</Html> }\nB.PreviewProps = {};\n` });
    const out = io(dir);
    const code = await main(["emails", "--write"], out, lib);
    expect(code).toBe(2);
    expect(out.out).toMatch(/✗ emails\/broken\.tsx: /);
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
    const migrated = (text: string) => `import { Button, Column, Email, Paragraph, Row } from "@unlayer/react-elements";
export default function Hi({ name }: { name: string }) {
  return <Email><Row><Column><Paragraph>${text}</Paragraph><Button href="https://example.com">Start</Button></Column></Row></Email>;
}
`;
    const dir = project({ "emails/hi.tsx": original, "migrated/good.tsx": migrated("Hello {name}, welcome aboard."), "migrated/bad.tsx": migrated("Hello {name}, welcome.") });
    const good = io(dir);
    expect(await main(["compare", "emails/hi.tsx", "migrated/good.tsx"], good, lib)).toBe(0);
    expect(good.out).toMatch(/✓ migrated\/good\.tsx against emails\/hi\.tsx: same words, links and images/);
    const bad = io(dir);
    expect(await main(["compare", "emails/hi.tsx", "migrated/bad.tsx"], bad, lib)).toBe(2);
    expect(bad.out).toContain('lost text: "aboard"');
    const usage = io(dir);
    expect(await main(["compare", "emails/hi.tsx"], usage, lib)).toBe(1);
  });

  it("explains usage mistakes", async () => {
    const dir = project({});
    for (const argv of [[], ["--write", "--out", "x", "emails"], ["nope"], ["--bogus"], ["--from", "mjml", "x"]]) {
      const out = io(dir);
      expect(await main(argv, out, lib)).toBe(1);
      expect(out.err).not.toBe("");
    }
    const help = io(dir);
    expect(await main(["--help"], help, lib)).toBe(0);
    expect(help.out).toContain("npx @unlayer/migrate");
  });
});
