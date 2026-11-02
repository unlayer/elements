/**
 * An image shows the words a Canvas has, in its order: Canvases put
 * together at random (the react package's testing/templates.ts, as its own content test uses them), each written
 * by the image writer.
 *
 *   CONTENT_SEEDS=2000 pnpm vitest run test/content.test.tsx
 */
import * as primitives from "@unlayer/react-elements/primitives";
import { prepare } from "@unlayer/react-elements/primitives";
import { createElement, type ReactElement } from "react";
import { generate, misplaced, toElement, words } from "../../react/src/primitives/testing/templates";
import { writeCanvas } from "../src/write";

const SEEDS = Number(process.env.CONTENT_SEEDS ?? 120);

/** The words in the canvas the writer builds, in their order. */
const text = (item: unknown): string => {
  if (typeof item === "string") return `${item} `;
  if (Array.isArray(item)) return item.map(text).join("");
  if (!item || typeof item !== "object") return "";
  const { runs, children } = item as Record<string, unknown>;
  return text(runs ?? children ?? []);
};

it(`writes a Canvas's words in its order (${SEEDS} Canvases)`, () => {
  const failures: string[] = [];
  for (let seed = 1; seed <= SEEDS; seed++) {
    const tree = generate(seed, "Canvas");
    const { root, diagnostics } = prepare(toElement(tree, primitives, createElement) as ReactElement);
    if (!root) {
      failures.push(`seed ${seed}: the template isn't valid: ${diagnostics.map((d) => d.message).join("; ")}`);
      continue;
    }
    const written = text(writeCanvas(root, { families: new Set(["liberation sans"]), fallback: "Liberation Sans", fonts: [], image: (src) => src }));
    const { content } = words(tree);
    const problems = misplaced(written, content);
    if (problems.length) failures.push(`seed ${seed}: ${problems.join(", ")}\n  ${JSON.stringify(tree)}`);
  }
  expect(failures.slice(0, 5)).toEqual([]);
});
