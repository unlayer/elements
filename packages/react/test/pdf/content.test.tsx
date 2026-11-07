/**
 * A PDF shows the words a Document has, in its order, and its header's and footer's on its pages: Documents put
 * together at random (the react package's testing/templates.ts, as its own content test uses them), each written
 * by the PDF writer.
 *
 *   CONTENT_SEEDS=2000 pnpm vitest run test/pdf/content.test.tsx
 */
import * as primitives from "@hyper-elements/react";
import { prepare } from "@hyper-elements/react";
import { createElement, type ReactElement } from "react";
import { generate, misplaced, toElement, words } from "../../src/primitives/testing/templates";
import { writeDocument } from "@unlayer-internal/elements-core/pdf";

const SEEDS = Number(process.env.CONTENT_SEEDS ?? 120);

/** The words in the pages the writer builds, in their order (each with a space after it). */
const text = (item: unknown): string => {
  if (typeof item === "string") return `${item} `;
  if (Array.isArray(item)) return item.map(text).join("");
  if (!item || typeof item !== "object") return "";
  const { pages, header, content, footer, runs, children } = item as Record<string, unknown>;
  return pages ? text(pages) : content ? text([header, content, footer]) : text(runs ?? children ?? []);
};

it(`writes a Document's words in its order, and its header's and footer's (${SEEDS} Documents)`, () => {
  const failures: string[] = [];
  for (let seed = 1; seed <= SEEDS; seed++) {
    const tree = generate(seed, "Document");
    const { root, diagnostics } = prepare(toElement(tree, primitives, createElement) as ReactElement);
    if (!root) {
      failures.push(`seed ${seed}: the template isn't valid: ${diagnostics.map((d) => d.message).join("; ")}`);
      continue;
    }
    const written = text(writeDocument(root, { families: new Set(), fonts: [], image: (src) => src, date: new Date(0) }));
    const { content, margins } = words(tree);
    const problems = [...misplaced(written, content), ...margins.filter((word) => !written.includes(word)).map((word) => `${word} (header or footer) missing`)];
    if (problems.length) failures.push(`seed ${seed}: ${problems.join(", ")}\n  ${JSON.stringify(tree)}`);
  }
  expect(failures.slice(0, 5)).toEqual([]);
});
