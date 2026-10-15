/**
 * The round trip that matters: a design → designToElements → the code compiled and rendered with renderToJson →
 * the same design, as the builder shows it (see compare.ts for what the comparison leaves aside).
 *
 * Run over Elements' own templates and designs the editor saved (see __fixtures__/sources.tsx). It prints the pass
 * rate and every value that doesn't survive; a value that stops surviving fails it.
 */
import { afterAll, describe, expect, it, vi } from "vitest";
import { SOURCES } from "./__fixtures__/sources";
import { roundTrip } from "./test-harness";

/** What the editor designs keep that renderToJson can't write back (see the codegen guide): nothing else may differ. */
const KNOWN_LOSSES: Record<string, string[]> = {
  "kitchen sink": ["body.rows[0].values.deletable", "body.rows[0].columns[1].contents[0].values.selectable"],
};

const report: string[] = [];
let passed = 0;

describe("design → Elements code → renderToJson", () => {
  it.each(SOURCES.map((c) => [`${c.source}: ${c.name}`, c] as const))("%s", (_, c) => {
    const design = c.design();
    // (The template may say things as it renders; the generated code renders without a word.)
    const said = (["warn", "error"] as const).map((level) => vi.spyOn(console, level));
    const result = roundTrip(design, { displayMode: c.displayMode });
    for (const spy of said) {
      expect(spy.mock.calls, c.name).toEqual([]);
      spy.mockRestore();
    }
    const lost = result.differences.map((d) => d.path);
    if (!lost.length) passed++;
    else report.push(`${c.source}: ${c.name}\n${result.differences.map((d) => `    ${d.path}: ${JSON.stringify(d.expected)} → ${JSON.stringify(d.actual)}`).join("\n")}`);
    expect(lost).toEqual(KNOWN_LOSSES[c.name] ?? []);
  });

  afterAll(() => {
    console.info(`[codegen round trip] ${passed}/${SOURCES.length} designs come back the same (${((passed / SOURCES.length) * 100).toFixed(1)}%).${report.length ? `\nWhat doesn't survive:\n${report.join("\n")}` : ""}`);
  });
});
