/**
 * The builder keeps what it can't edit, over templates put together at random (primitives/testing/templates.ts),
 * given what the builder has no editor for (a link's target, a heading's background, an image's corners):
 *
 * - to the builder and back with no change, the template comes back as it went;
 * - with one change made in the builder (a block's words, one Menu item's words, one Social icon's link), only
 *   what was changed changes: everything else, in that block too, comes back as it went.
 *
 *   ROUNDTRIP_SEEDS=1000 pnpm vitest run src/builder/roundtrip-generated.test.tsx
 */
import type { Node } from "@unlayer-internal/elements-core";
import React from "react";
import { describe, expect, it } from "vitest";
import * as primitives from "../primitives";
import { collectTemplate } from "../primitives/collect";
import { generate, toElement, type Root, type Tree } from "../primitives/testing/templates";
import { fromDesign, toDesign } from "./index";

const SEEDS = Number(process.env.ROUNDTRIP_SEEDS ?? 80);

type Values = Record<string, any>;
type Item = { type: string; values: Values };
type Design = { body: { rows: Array<{ values: Values; columns: Array<{ values: Values; contents: Item[] }> }>; values: Values } };

/** A seeded choice. */
const chooser = (seed: number) => {
  let a = seed * 7919;
  return <T,>(items: readonly T[]): T => items[(a = (a * 48271) % 2147483647) % items.length];
};

/** The template, given what the builder has no editor for: links' targets, a heading's background and corners, a Social. */
function decorated(seed: number, root: Root): Tree {
  const pick = chooser(seed);
  const visit = (node: Tree): Tree => {
    const children = node.children?.map((child) => (typeof child === "string" ? child : visit(child)));
    const out: Tree = { ...node, ...(children ? { children } : {}) };
    if (node.type === "Menu") {
      out.props = { ...node.props, items: (node.props!.items as Array<{ text: string; href: string }>).map((item) => ({ ...item, href: pick([item.href, { href: item.href, target: "_self" }, { href: item.href, target: "_blank" }]) })) };
    }
    if (node.type === "Heading" && pick([true, false])) out.style = { ...node.style, backgroundColor: "#fde68a", borderRadius: 8 };
    if (node.type === "Image" && pick([true, false])) out.style = { ...node.style, borderRadius: 12 };
    return out;
  };
  const tree = visit(generate(seed, root));
  const social: Tree = { type: "Social", props: { icons: [{ name: "Facebook", href: { href: "https://facebook.com/acme", target: "_self" } }, { name: "X", href: "https://x.com/acme" }] } };
  if (root !== "Document" && pick([true, false])) tree.children = [...(tree.children ?? []), social];
  return tree;
}

const element = (tree: Tree) => toElement(tree, primitives, React.createElement) as React.ReactElement;
const nodeOf = (template: React.ReactElement): Node => collectTemplate(template).document!.root;
const blocks = (design: Design): Item[] => design.body.rows.flatMap((row) => row.columns.flatMap((column) => column.contents));

/** The paths where two nodes differ. */
function differences(a: unknown, b: unknown, path = "root"): string[] {
  if (JSON.stringify(a) === JSON.stringify(b)) return [];
  if (!a || !b || typeof a !== "object" || typeof b !== "object" || Array.isArray(a) !== Array.isArray(b)) return [path];
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...keys].flatMap((key) => differences((a as Values)[key], (b as Values)[key], Array.isArray(a) ? `${path}[${key}]` : `${path}.${key}`));
}

/** The node whose words hold `word`, and its path. */
function find(node: Node, test: (node: Node) => boolean, path = "root"): string | undefined {
  if (test(node)) return path;
  for (const [i, child] of (node.children ?? []).entries()) {
    if (typeof child === "string") continue;
    const found = find(child, test, `${path}.children[${i}]`);
    if (found) return found;
  }
  return undefined;
}

describe.each(["Email", "Page", "Document"] as Root[])("%s to the builder and back", (root) => {
  it(`comes back as it went (${SEEDS} templates)`, () => {
    const failures: string[] = [];
    for (let seed = 1; seed <= SEEDS; seed++) {
      const tree = decorated(seed, root);
      const before = nodeOf(element(tree));
      const after = nodeOf(fromDesign(toDesign(element(tree)).design).element);
      const found = differences(before, after);
      if (found.length) failures.push(`seed ${seed}: ${found.slice(0, 4).join(", ")}\n  ${JSON.stringify(tree)}`);
    }
    expect(failures.slice(0, 4)).toEqual([]);
  });

  it(`changes only what the builder changed: one block's words, one Menu item, one Social icon (${SEEDS} templates)`, () => {
    const failures: string[] = [];
    for (let seed = 1; seed <= SEEDS; seed++) {
      const tree = decorated(seed, root);
      const before = nodeOf(element(tree));
      const design = JSON.parse(JSON.stringify(toDesign(element(tree)).design)) as Design;
      const edits: Array<{ what: string; apply: () => void; allowed: (path: string) => boolean }> = [];
      for (const block of blocks(design)) {
        const node = (block.values._elements as { node?: Node } | undefined)?.node;
        if (block.type === "menu" && block.values.menu?.items?.length) {
          const at = node && find(before, (n) => n.type === "Menu" && JSON.stringify(n.props?.items) === JSON.stringify(node.props?.items));
          edits.push({ what: "a Menu item's words", apply: () => (block.values.menu.items[0].text = "edited"), allowed: (path) => !!at && path === `${at}.props.items[0].text` });
        }
        if (block.type === "social" && block.values.icons?.icons?.length) {
          const at = find(before, (n) => n.type === "Social");
          edits.push({ what: "a Social icon's link", apply: () => (block.values.icons.icons[1].url = "https://x.com/edited"), allowed: (path) => !!at && path.startsWith(`${at}.props.icons[1].href`) });
        }
        // A word of the block's own (not a merge tag's name).
        const own = typeof block.values.text === "string" ? /(?<!\{\{)zq\d{3}(?!\}\})/.exec(block.values.text) : null;
        if ((block.type === "text" || block.type === "paragraph" || block.type === "heading") && own) {
          const word = own[0];
          const at = find(before, (n) => (n.children ?? []).some((c) => typeof c === "string" && c.includes(word)));
          edits.push({ what: `the words of the block with ${word}`, apply: () => (block.values.text = block.values.text.replace(word, "edited")), allowed: (path) => !!at && path.startsWith(`${at}.children`) });
        }
      }
      if (!edits.length) continue;
      const edit = chooser(seed)(edits);
      edit.apply();
      const after = nodeOf(fromDesign(design).element);
      const unexpected = differences(before, after).filter((path) => !edit.allowed(path));
      if (unexpected.length) failures.push(`seed ${seed}, ${edit.what} changed: ${unexpected.slice(0, 4).join(", ")} changed too\n  ${JSON.stringify(tree)}`);
    }
    expect(failures.slice(0, 4)).toEqual([]);
  });
});
