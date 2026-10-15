import { writeFile } from "node:fs/promises";
import path from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { run } from "../src/cli";
import { renderTemplates } from "../src/server/render";
import { UsageError } from "../src/server/errors";
import { fixtureCopy } from "./helpers";

let fixture: Awaited<ReturnType<typeof fixtureCopy>>;

const NEEDS_FIXES = `import { Email, Row, Column, Button } from "@unlayer/react-elements";

export default function NeedsFixes() {
  return (
    <Email>
      <Row>
        <Column>
          <Button href="javascript:alert(1)">Click me</Button>
        </Column>
      </Row>
    </Email>
  );
}
`;

beforeAll(async () => {
  fixture = await fixtureCopy("render");
  await writeFile(path.join(fixture.emails, "needs-fixes.tsx"), NEEDS_FIXES);
  await writeFile(path.join(fixture.emails, "broken.tsx"), "export default function Broken() { return <Email>; }\n");
});

afterAll(async () => {
  await fixture?.cleanup();
});

/** Runs `elements-preview <args>` in-process: what it writes to stdout and stderr, and its exit code. */
async function cli(args: string[]): Promise<{ stdout: string; stderr: string; code: number }> {
  let stdout = "";
  let stderr = "";
  const out = vi.spyOn(process.stdout, "write").mockImplementation((chunk) => ((stdout += String(chunk)), true));
  const err = vi.spyOn(process.stderr, "write").mockImplementation((chunk) => ((stderr += String(chunk)), true));
  const exit = vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
    throw Object.assign(new Error("exit"), { exitCode: code ?? 0 });
  }) as never);
  let code: number;
  try {
    await run(args);
    code = Number(process.exitCode ?? 0);
  } catch (error) {
    const exitCode = (error as { exitCode?: number }).exitCode;
    if (exitCode === undefined) throw error;
    code = exitCode;
  } finally {
    out.mockRestore();
    err.mockRestore();
    exit.mockRestore();
    process.exitCode = undefined;
  }
  return { stdout, stderr, code };
}

afterEach(() => {
  process.exitCode = undefined;
});

describe("render", () => {
  it("gives each template's mode, HTML and design JSON", async () => {
    const { templates, failed } = await renderTemplates({ dir: fixture.emails, templates: ["welcome.tsx", "landing.tsx"] });
    expect(failed).toBe(0);
    expect(templates.map((t) => [t.path, t.mode, t.ok])).toEqual([
      ["landing.tsx", "web", true],
      ["welcome.tsx", "email", true],
    ]);
    const welcome = templates[1];
    expect(welcome.file).toBe(path.relative(process.cwd(), path.join(fixture.emails, "welcome.tsx")));
    expect(welcome.html).toContain("Welcome, Ada");
    expect(welcome.design).toMatchObject({ body: { rows: expect.any(Array) } });
    expect(welcome.check).toBeUndefined();
    expect(welcome.error).toBeUndefined();
  });

  it("with check, carries check's findings and fails a template with something to fix", async () => {
    const { templates, failed } = await renderTemplates({ dir: fixture.emails, templates: ["needs-fixes.tsx", "welcome.tsx"], check: true, network: false });
    expect(failed).toBe(1);
    const [needsFixes, welcome] = templates;
    expect(needsFixes).toMatchObject({ path: "needs-fixes.tsx", ok: false, mode: "email", check: { ok: false } });
    expect(needsFixes.html).toContain("javascript:alert(1)");
    expect(needsFixes.check?.toFix.map((f) => [f.kind, f.url])).toEqual([["link", "javascript:alert(1)"]]);
    expect(welcome).toMatchObject({ ok: true, check: { ok: true, toFix: [] } });
  });

  it("reports a template that doesn't render, with its file and line", async () => {
    const { templates, failed } = await renderTemplates({ dir: fixture.emails, templates: ["broken.tsx"] });
    expect(failed).toBe(1);
    expect(templates[0]).toMatchObject({ path: "broken.tsx", ok: false, mode: null, html: null, design: null, error: { line: 1 } });
    expect(templates[0].error?.file).toBe(path.relative(process.cwd(), path.join(fixture.emails, "broken.tsx")));
  });

  it("refuses templates that aren't there", async () => {
    await expect(renderTemplates({ dir: fixture.emails, templates: ["nope.tsx"] })).rejects.toThrow(UsageError);
  });
});

describe("elements-preview render", () => {
  it("prints one template as one JSON object with --json", async () => {
    const { stdout, code } = await cli(["render", "welcome.tsx", "--dir", fixture.emails, "--json"]);
    expect(code).toBe(0);
    const lines = stdout.trimEnd().split("\n");
    expect(lines).toHaveLength(1);
    const template = JSON.parse(lines[0]);
    expect(Object.keys(template)).toEqual(expect.arrayContaining(["path", "file", "ok", "mode", "html", "design", "warnings"]));
    expect(template).toMatchObject({ path: "welcome.tsx", ok: true, mode: "email" });
    expect(template.html).toContain("Welcome, Ada");
    expect(template.design.body.rows.length).toBeGreaterThan(0);
  });

  it("prints a line per template for a folder, and exits with 1 when one has something to fix", async () => {
    const { stdout, code } = await cli(["render", ".", "--dir", fixture.emails, "--json", "--check", "--offline"]);
    expect(code).toBe(1);
    const templates = stdout.trimEnd().split("\n").map((line) => JSON.parse(line));
    expect(templates.map((t) => t.path)).toContain("welcome.tsx");
    expect(templates.find((t) => t.path === "needs-fixes.tsx")).toMatchObject({ ok: false, check: { ok: false } });
    expect(templates.find((t) => t.path === "broken.tsx")).toMatchObject({ ok: false, error: { line: 1 } });
  });

  it("prints one template's HTML without --json", async () => {
    const { stdout, code } = await cli(["render", "welcome.tsx", "--dir", fixture.emails]);
    expect(code).toBe(0);
    expect(stdout).toMatch(/^<!DOCTYPE html PUBLIC/i);
    expect(stdout).toContain("Welcome, Ada");
  });

  it("exits with 2 and a JSON error when it can't run", async () => {
    const missing = await cli(["render", "nope.tsx", "--dir", fixture.emails, "--json"]);
    expect(missing.code).toBe(2);
    expect(JSON.parse(missing.stderr).error).toMatch(/No template nope\.tsx/);
    const none = await cli(["render", "--dir", fixture.emails, "--json"]);
    expect(none.code).toBe(2);
    expect(JSON.parse(none.stderr).error).toMatch(/Name the templates to render/);
    const several = await cli(["render", ".", "--dir", fixture.emails]);
    expect(several.code).toBe(2);
    expect(several.stderr).toMatch(/Name one to print its HTML, or pass --json/);
  });
});
