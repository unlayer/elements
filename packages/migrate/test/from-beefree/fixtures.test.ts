/**
 * The committed Beefree templates (test/fixtures/beefree, see its NOTICE): each converts to a well-formed design whose
 * Elements code type-checks, renders, and renders back to the same design; where Beefree's HTML export is beside it,
 * the content check finds the same words, links and images, apart from the two known differences (see failureCauses).
 */
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { compareText } from "@unlayer/convert-core";
import { beefreeToDesign, type Design } from "../../src/from-beefree";
import { failureCauses, lostContent, render, roundTripDifferences, typecheck } from "./harness";

const ROOT = path.join(import.meta.dirname, "../fixtures/beefree");
const fixtures = fs
  .readdirSync(ROOT, { recursive: true, encoding: "utf8" })
  .filter((file) => file.endsWith(".json"))
  .sort();

const TYPES = new Set(["text", "heading", "button", "image", "divider", "html", "menu", "social", "video"]);

/** What's wrong with a design's structure (empty when it's well formed). */
function structureProblems(design: Design): string[] {
  const problems: string[] = [];
  if (typeof design.schemaVersion !== "number") problems.push("no schemaVersion");
  if (!design.body?.values?._meta) problems.push("the body has no _meta");
  const counted: Record<string, number> = {};
  const count = (kind: string) => (counted[kind] = (counted[kind] ?? 0) + 1);
  design.body.rows.forEach((row, r) => {
    count("u_row");
    if (row.cells.length !== row.columns.length) problems.push(`row ${r + 1}: ${row.cells.length} cells, ${row.columns.length} columns`);
    if (!row.cells.every((cell) => Number.isInteger(cell) && cell > 0)) problems.push(`row ${r + 1}: cells ${JSON.stringify(row.cells)}`);
    if (JSON.stringify(row.values.cells) !== JSON.stringify(row.cells)) problems.push(`row ${r + 1}: values.cells`);
    row.columns.forEach((column, c) => {
      count("u_column");
      if (!(column.values._meta as Record<string, unknown>)?.htmlID) problems.push(`row ${r + 1}, column ${c + 1}: no _meta`);
      column.contents.forEach((content, b) => {
        count(`u_content_${content.type}`);
        if (!TYPES.has(content.type)) problems.push(`row ${r + 1}, column ${c + 1}, block ${b + 1}: type ${content.type}`);
        const meta = content.values._meta as Record<string, string> | undefined;
        if (meta?.htmlClassNames !== `u_content_${content.type}`) problems.push(`row ${r + 1}, column ${c + 1}, block ${b + 1}: _meta ${JSON.stringify(meta)}`);
      });
    });
  });
  if (JSON.stringify(Object.entries(counted).sort()) !== JSON.stringify(Object.entries(design.counters).sort())) problems.push(`counters ${JSON.stringify(design.counters)}, counted ${JSON.stringify(counted)}`);
  return problems;
}

const componentName = (file: string) => path.basename(file, ".json").replace(/(^|[^a-zA-Z0-9]+)([a-zA-Z0-9])/g, (_, __, c: string) => c.toUpperCase());

describe("the committed Beefree templates", () => {
  const generated = new Map<string, string>();

  it("are the 17 public fixtures, with their licenses", () => {
    expect(fixtures).toHaveLength(17);
    expect(fs.readFileSync(path.join(ROOT, "LICENSE"), "utf8")).toMatch(/Apache License\s+Version 2\.0/);
    expect(fs.readFileSync(path.join(ROOT, "NOTICE"), "utf8")).toContain("MIT License");
  });

  it.each(fixtures)("%s converts to a well-formed design whose code renders back to it", (file) => {
    const { design, version } = beefreeToDesign(fs.readFileSync(path.join(ROOT, file)));
    expect(["0.0.1", "2.0.0"]).toContain(version);
    expect(design.body.rows.length).toBeGreaterThan(0);
    expect(structureProblems(design)).toEqual([]);
    const rendered = render(design, componentName(file));
    generated.set(componentName(file), rendered.code);
    expect(rendered.codegenWarnings).toEqual([]);
    expect(roundTripDifferences(design, rendered.back)).toEqual([]);
    expect(rendered.html).toMatch(/^<!DOCTYPE/i);
  });

  it("their code type-checks against the published types", () => {
    for (const file of fixtures) {
      if (!generated.has(componentName(file))) generated.set(componentName(file), render(beefreeToDesign(fs.readFileSync(path.join(ROOT, file))).design, componentName(file)).code);
    }
    expect(typecheck(generated)).toEqual([]);
  });

  const exported = fixtures.filter((file) => fs.existsSync(path.join(ROOT, file.replace(/\.json$/, ".html"))));

  it.each(exported)("%s says what Beefree's export says (social icon alt text and phone menus aside)", (file) => {
    const { design } = beefreeToDesign(fs.readFileSync(path.join(ROOT, file)));
    const check = compareText(fs.readFileSync(path.join(ROOT, file.replace(/\.json$/, ".html")), "utf8"), render(design).html);
    if (lostContent(check)) expect(failureCauses(check, design).filter((cause) => cause.startsWith("other"))).toEqual([]);
  });

  it("the check passes outright where neither known difference applies", () => {
    const file = "toptile-legacy/signup-email.json";
    const { design } = beefreeToDesign(fs.readFileSync(path.join(ROOT, file)));
    expect(lostContent(compareText(fs.readFileSync(path.join(ROOT, file.replace(/\.json$/, ".html")), "utf8"), render(design).html))).toBe(false);
  });
});
