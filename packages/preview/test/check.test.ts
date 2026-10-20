import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { checkTemplates, formatCheckReport } from "../src/server/check";
import { UsageError } from "../src/server/errors";
import { cli, fixtureCopy } from "./helpers";

let fixture: Awaited<ReturnType<typeof fixtureCopy>>;

// The problems needs-fixes.tsx in the showcase has: links that go nowhere, run script or are relative, and flexbox.
const NEEDS_FIXES = `import { Email, Row, Column, Heading, Paragraph, Button, Html } from "@unlayer/react-elements";

export default function NeedsFixes() {
  return (
    <Email>
      <Row>
        <Column>
          <Heading>Problems</Heading>
          <Paragraph html={'Read the <a href="#">terms</a> or <a href="/pricing">see pricing</a>.'} />
          <Button href="javascript:alert(1)">Click me</Button>
          <Html html={'<div style="display:flex;gap:12px"><span>A</span><span>B</span></div>'} />
        </Column>
      </Row>
    </Email>
  );
}
`;

// React's development warnings, which it writes with console.error: a list without keys.
const NO_KEYS = `import { Email, Row, Column, Paragraph } from "@unlayer/react-elements";

function Items({ items }: { items: string[] }) {
  return <>{items.map((item) => <Paragraph>{item}</Paragraph>)}</>;
}

export default function NoKeys() {
  return <Email><Row><Column><Items items={["One", "Two"]} /></Column></Row></Email>;
}
`;

// A block Elements leaves out, and says so with console.error: a Row with a layout for 2 Columns and 1.
const LEFT_OUT = `import { Email, Row, Column, Paragraph, ColumnLayouts } from "@unlayer/react-elements";

export default function LeftOut() {
  return <Email><Row layout={ColumnLayouts.TwoEqual}><Column><Paragraph>Only one</Paragraph></Column></Row></Email>;
}
`;

const BAD_URL = `import { Email, Row, Column, Html } from "@unlayer/react-elements";

export default function BadUrl() {
  return <Email><Row><Column><Html html={'<img src="/static/%" alt="Logo">'} /></Column></Row></Email>;
}
`;

// A template and a module it imports that log while they load, as dotenv does by default.
const NOISY_ENV = `console.log("[dotenv] injecting env (2) from .env");
console.debug("[dotenv] debug");
console.warn("Using sample data");
export const name = "Ada";
`;

const NOISY = `import { Email, Row, Column, Paragraph } from "@unlayer/react-elements";
import { name } from "./_lib/env";

console.info("Loading the data");

export default function Noisy() {
  console.log("Rendering for " + name);
  return <Email><Row><Column><Paragraph>Hi {name}</Paragraph></Column></Row></Email>;
}
`;

beforeAll(async () => {
  fixture = await fixtureCopy("check");
  await writeFile(path.join(fixture.emails, "needs-fixes.tsx"), NEEDS_FIXES);
  await writeFile(path.join(fixture.emails, "broken.tsx"), "export default function Broken() { return <Email>; }\n");
  await mkdir(path.join(fixture.root, "more"));
  await writeFile(path.join(fixture.root, "more", "no-keys.tsx"), NO_KEYS);
  await writeFile(path.join(fixture.root, "more", "left-out.tsx"), LEFT_OUT);
  await writeFile(path.join(fixture.root, "more", "bad-url.tsx"), BAD_URL);
});

afterAll(async () => {
  await fixture?.cleanup();
});

describe("check", () => {
  it("reports what to fix and what to check in a template, as the preview's Checks do", async () => {
    const report = await checkTemplates({ dir: fixture.emails, templates: ["needs-fixes.tsx"], network: false });
    expect(report.ok).toBe(false);
    expect(report.network).toBe(false);
    const [template] = report.templates;
    expect(template).toMatchObject({ path: "needs-fixes.tsx", ok: false, mode: "email" });
    expect(template.file).toBe(path.relative(process.cwd(), path.join(fixture.emails, "needs-fixes.tsx")));
    expect(template.bytes).toBeGreaterThan(1000);
    expect(template.toFix.map((f) => [f.kind, f.block, f.url])).toEqual([
      ["link", "Paragraph 1", "#"],
      ["link", "Paragraph 1", "/pricing"],
      ["link", "Button 1", "javascript:alert(1)"],
    ]);
    const flex = template.toCheck.find((f) => f.feature === "display:flex");
    expect(flex).toMatchObject({ kind: "client", level: "warning", block: "Html 1", line: 11 });
    expect(flex?.clients?.some((c) => c.client === "outlook.windows" && c.support === "none")).toBe(true);
    // Elements' own CSS (its media queries, its Outlook markup) isn't the template's to fix.
    expect(template.toCheck.some((f) => f.feature?.startsWith("@media"))).toBe(false);
    expect(report.summary).toEqual({ templates: 1, toFix: 3, toCheck: template.toCheck.length, notes: template.notes.length });
    // The report is what --json prints.
    expect(JSON.parse(JSON.stringify(report))).toEqual(report);
  });

  it("passes a template with only things to check, unless it's strict", async () => {
    // welcome.tsx links to example.com: a placeholder to replace before sending, which is to check.
    const report = await checkTemplates({ dir: fixture.emails, templates: [path.join(fixture.emails, "welcome.tsx")], network: false });
    expect(report.templates[0].toFix).toEqual([]);
    expect(report.templates[0].toCheck.some((f) => f.kind === "link" && /placeholder/.test(f.message))).toBe(true);
    expect(report.ok).toBe(true);
    const strict = await checkTemplates({ dir: fixture.emails, templates: ["welcome.tsx"], network: false, strict: true });
    expect(strict.ok).toBe(false);
    expect(strict.strict).toBe(true);
  });

  it("checks every template, worst first, and points a render error at its file and line", async () => {
    const report = await checkTemplates({ dir: fixture.emails, network: false });
    expect(report.templates.map((t) => t.path).slice(0, 2)).toEqual(["needs-fixes.tsx", "broken.tsx"]);
    expect(report.templates).toHaveLength(6);
    const broken = report.templates.find((t) => t.path === "broken.tsx")!;
    expect(broken).toMatchObject({ ok: false, mode: null, bytes: null });
    expect(broken.toFix[0]).toMatchObject({ kind: "render", level: "error", line: 1 });
    expect(broken.toFix[0].file).toBe(path.relative(process.cwd(), path.join(fixture.emails, "broken.tsx")));
    // A page isn't checked against email clients.
    expect(report.templates.find((t) => t.path === "landing.tsx")?.toCheck.some((f) => f.kind === "client")).toBe(false);
  });

  it("prints each template, a line per thing to fix or check, and a summary", async () => {
    const report = await checkTemplates({ dir: fixture.emails, templates: ["needs-fixes.tsx", "landing.tsx"], network: false });
    const text = formatCheckReport(report);
    const lines = text.trimEnd().split("\n");
    expect(lines[0]).toMatch(/^✗ needs-fixes\.tsx \(email, \d+ KB\): 3 to fix, \d+ to check/);
    expect(lines).toContain("    fix    Button 1 · “Click me” → javascript:alert(1) · Email clients don't run javascript: links.");
    expect(lines).toContain("    fix    Paragraph 1 · “terms” → # · This link goes nowhere: give it a URL.");
    expect(lines.some((line) => /^ {4}check {2}Html 1 · line 11 · `display:flex` isn't supported in /.test(line))).toBe(true);
    expect(lines.some((line) => /^✓ landing\.tsx \(web, \d+ KB\)/.test(line))).toBe(true);
    expect(lines[lines.length - 1]).toMatch(/^Checked 2 templates: 3 to fix, \d+ to check\..* Links and images weren't requested \(--offline\)\.$/);
    expect(text).not.toContain("\u001b[");
    expect(formatCheckReport(report, { color: true })).toContain("\u001b[31m");
  });

  it("fixes what Elements leaves out, and only checks React's development warnings", async () => {
    const report = await checkTemplates({ dir: path.join(fixture.root, "more"), templates: ["no-keys.tsx", "left-out.tsx"], network: false });
    const leftOut = report.templates.find((t) => t.path === "left-out.tsx")!;
    expect(leftOut.toFix).toEqual([expect.objectContaining({ kind: "render", level: "error", message: expect.stringMatching(/^\[Unlayer\] A Row with the TwoEqual layout/) })]);
    const noKeys = report.templates.find((t) => t.path === "no-keys.tsx")!;
    expect(noKeys.toFix).toEqual([]);
    expect(noKeys.toCheck).toEqual(expect.arrayContaining([expect.objectContaining({ kind: "warning", level: "warning", message: expect.stringMatching(/unique "key" prop/) })]));
    expect(noKeys.ok).toBe(true);
  });

  it("reports a URL that doesn't decode as the template's, and checks the others", async () => {
    const report = await checkTemplates({ dir: path.join(fixture.root, "more"), network: false });
    expect(report.templates.map((t) => t.path).sort()).toEqual(["bad-url.tsx", "left-out.tsx", "no-keys.tsx"]);
    const badUrl = report.templates.find((t) => t.path === "bad-url.tsx")!;
    expect(badUrl.toFix).toEqual([expect.objectContaining({ kind: "image", url: "/static/%", message: expect.stringMatching(/^A malformed URL/) })]);
  });

  it("fails a broken image that has no alt text", async () => {
    await writeFile(
      path.join(fixture.root, "more", "no-alt.tsx"),
      `import { Email, Row, Column, Image } from "@unlayer/react-elements";
export default function NoAlt() {
  return <Email><Row><Column><Image src="https://acme.dev/gone.png" /></Column></Row></Email>;
}
`
    );
    const notFound = (async () => new Response(null, { status: 404, headers: { "content-type": "text/html" } })) as typeof fetch;
    try {
      const report = await checkTemplates({ dir: path.join(fixture.root, "more"), templates: ["no-alt.tsx"], fetch: notFound });
      const [template] = report.templates;
      expect(template.toFix).toEqual([expect.objectContaining({ kind: "image", url: "https://acme.dev/gone.png", status: 404, message: "It answers 404." })]);
      expect(template.notes).toEqual(expect.arrayContaining([expect.objectContaining({ kind: "image", message: expect.stringMatching(/^Empty alt text/) })]));
      expect(report.ok).toBe(false);
    } finally {
      await rm(path.join(fixture.root, "more", "no-alt.tsx"));
    }
  });

  it("prints only JSON with --json, with what a template and its imports log while they load among its findings", async () => {
    const noisy = path.join(fixture.root, "noisy");
    await mkdir(path.join(noisy, "_lib"), { recursive: true });
    await writeFile(path.join(noisy, "_lib", "env.ts"), NOISY_ENV);
    await writeFile(path.join(noisy, "noisy.tsx"), NOISY);
    const spies = (["log", "info", "debug", "warn", "error"] as const).map((level) => vi.spyOn(console, level).mockImplementation(() => undefined));
    let result: Awaited<ReturnType<typeof cli>>;
    let printed: string;
    try {
      result = await cli(["check", "--dir", noisy, "--json", "--offline"]);
    } finally {
      printed = spies.flatMap((spy) => spy.mock.calls.flat()).join("\n");
      for (const spy of spies) spy.mockRestore();
    }
    // Nothing reached the console: it would be printed before the JSON.
    expect(printed).toBe("");
    const report = JSON.parse(result.stdout);
    const [template] = report.templates;
    expect(template.notes.map((f: any) => [f.kind, f.message])).toEqual(
      expect.arrayContaining([
        ["log", "[dotenv] injecting env (2) from .env"],
        ["log", "Loading the data"],
        ["log", "Rendering for Ada"],
      ])
    );
    expect(template.toCheck).toEqual(expect.arrayContaining([expect.objectContaining({ kind: "warning", message: "Using sample data" })]));
  });

  it("refuses templates and folders that aren't there", async () => {
    await expect(checkTemplates({ dir: fixture.emails, templates: ["nope.tsx"], network: false })).rejects.toThrow(UsageError);
    await expect(checkTemplates({ dir: fixture.emails, templates: ["nope.tsx"], network: false })).rejects.toThrow(/No template nope\.tsx in .*Its templates: billing\/receipt\.jsx/s);
    await expect(checkTemplates({ dir: path.join(fixture.root, "missing") })).rejects.toThrow(/doesn't exist/);
  });

  it("refuses a folder with no templates, as one that isn't there", async () => {
    const empty = path.join(fixture.root, "empty");
    await mkdir(empty);
    await expect(checkTemplates({ dir: empty, network: false })).rejects.toThrow(UsageError);
    const { code, stderr } = await cli(["check", "--dir", empty, "--json"]);
    expect(code).toBe(2);
    expect(JSON.parse(stderr).error).toMatch(/^There are no templates in .*empty/);
  });
});
