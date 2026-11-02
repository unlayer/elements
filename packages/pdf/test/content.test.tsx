/**
 * A PDF shows the words a Document has, in its order, and its header's and footer's on its pages: Documents put
 * together at random (the react package's testing/templates.ts, as its own content test uses them), each written
 * by the PDF writer.
 *
 *   CONTENT_SEEDS=2000 pnpm vitest run test/content.test.tsx
 */
import * as primitives from "@unlayer/react-elements/primitives";
import { prepare } from "@unlayer/react-elements/primitives";
import { createElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { generate, misplaced, toElement, words } from "../../react/src/primitives/testing/templates";
import { writeDocument } from "../src/write";

const SEEDS = Number(process.env.CONTENT_SEEDS ?? 120);

/** The words in the writer's elements, in their order. */
const text = (node: ReactNode): string => {
  if (typeof node === "string" || typeof node === "number") return `${node} `;
  if (Array.isArray(node)) return node.map(text).join("");
  return isValidElement(node) ? text((node.props as { children?: ReactNode }).children) : "";
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
    const written = text(writeDocument(root, { fonts: new Map(), image: (src) => src, date: new Date(0) }));
    const { content, margins } = words(tree);
    const problems = [...misplaced(written, content), ...margins.filter((word) => !written.includes(word)).map((word) => `${word} (header or footer) missing`)];
    if (problems.length) failures.push(`seed ${seed}: ${problems.join(", ")}\n  ${JSON.stringify(tree)}`);
  }
  expect(failures.slice(0, 5)).toEqual([]);
});
