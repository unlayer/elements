/**
 * Every output shows the words a template has, in its order: templates put together at random (testing/templates.ts),
 * each rendered as HTML and plain text, for every root. A word missing or out of order is a writer losing or
 * moving content, whatever component it's in. The PDF's and the image's own writers have the same test in their
 * packages.
 *
 *   CONTENT_SEEDS=2000 pnpm vitest run src/primitives/content.test.tsx
 */
import React from "react";
import { describe, expect, it } from "vitest";
import * as primitives from "./index";
import { render, validate } from "./index";
import { generate, misplaced, toElement, words, type Root } from "./testing/templates";

const SEEDS = Number(process.env.CONTENT_SEEDS ?? 120);

/** The text an HTML page shows (no head, stylesheet or Outlook-only markup), its words where they are. */
const shownText = (html: string) =>
  html
    .replace(/<head[\s\S]*?<\/head>/i, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ");

it("fails a word missing, out of order or written twice (the check the tests below make)", () => {
  expect(misplaced("zq001 zq002 zq003", ["zq001", "zq002", "zq003"])).toEqual([]);
  expect(misplaced("zq001 zq003", ["zq001", "zq002", "zq003"])).toEqual(["zq002 missing"]);
  expect(misplaced("zq002 zq001", ["zq001", "zq002"])).toEqual(["zq002 out of order"]);
  expect(misplaced("zq001 zq002 zq002", ["zq001", "zq002"])).toEqual(["zq002 more than once"]);
});

describe.each(["Email", "Page", "Document", "Canvas"] as Root[])("%s: every output shows the template's words, in order", (root) => {
  it(`in its HTML and its plain text (${SEEDS} templates)`, async () => {
    const failures: string[] = [];
    for (let seed = 1; seed <= SEEDS; seed++) {
      const tree = generate(seed, root);
      const element = toElement(tree, primitives, React.createElement) as React.ReactElement;
      const errors = validate(element).diagnostics.filter((d) => d.severity === "error");
      if (errors.length) {
        failures.push(`seed ${seed}: the template isn't valid: ${errors.map((d) => `${d.path}: ${d.message}`).join("; ")}`);
        continue;
      }
      const { html, text } = await render(element);
      const { content, margins } = words(tree);
      // A page's and a print's HTML play a video: its title isn't words there.
      const shown = words(tree, { players: root !== "Email" }).content;
      const problems = [
        ...misplaced(shownText(html), shown).map((p) => `HTML: ${p}`),
        ...margins.filter((word) => !html.toLowerCase().includes(word)).map((word) => `HTML: ${word} (header or footer) missing`),
        ...misplaced(text, content).map((p) => `plain text: ${p}`),
      ];
      if (problems.length) failures.push(`seed ${seed}: ${problems.join(", ")}\n  ${JSON.stringify(tree)}`);
    }
    expect(failures.slice(0, 5)).toEqual([]);
  });
});
