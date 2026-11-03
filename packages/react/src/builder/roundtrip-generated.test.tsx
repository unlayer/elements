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
import { writeFileSync } from "node:fs";
import type { Node } from "@unlayer-internal/elements-core";
import React from "react";
import { describe, expect, it } from "vitest";
import * as primitives from "../primitives";
import { collectTemplate } from "../primitives/collect";
import { generate, toElement, type Root, type Tree } from "../primitives/testing/templates";
import { renderTemplate } from "@unlayer-internal/elements-exporters";
import * as airbnb from "../primitives/codemod/AirbnbConfirmation";
import * as luma from "../primitives/codemod/LumaEventInvite";
import * as mercury from "../primitives/codemod/MercuryReceipt";
import * as brew from "../primitives/codemod/MorningBrewDigest";
import * as nike from "../primitives/codemod/NikeDrop";
import * as notion from "../primitives/codemod/NotionWelcome";
import * as digest from "../primitives/codemod/ProductDigest";
import * as spotify from "../primitives/codemod/SpotifyWelcome";
import * as stripe from "../primitives/codemod/StripeReceipt";
import * as warby from "../primitives/codemod/WarbyOrderShipped";
import { FIELDS } from "./fields";
import { fromDesign, toDesign } from "./index";
import { lower } from "./lower";
import { BUILDER_OWN, DEFAULTS, PARTED } from "./payload";
import { writeDesign, type Keep } from "./write";

const EXAMPLES = [stripe.StripeReceipt, spotify.SpotifyPremiumWelcome, airbnb.AirbnbConfirmation, mercury.MercuryReceipt, luma.LumaEventInvite, warby.WarbyOrderShipped, notion.NotionWelcome, nike.NikeDrop, brew.MorningBrewDigest, digest.ProductDigest];

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
        if (block.type === "menu" && block.values.menu?.items?.length) {
          // The Menu with the builder's items' words, in their order.
          const words = JSON.stringify(block.values.menu.items.map((item: { text: string }) => item.text));
          const at = find(before, (n) => n.type === "Menu" && JSON.stringify((n.props?.items as Array<{ text: string }> | undefined)?.map((item) => item.text)) === words);
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

/**
 * Every field of every tool, edited in the builder three ways (to another value, to the builder's default for it,
 * and removed), read back from the design as written and from the same design keeping a whole copy of what it was
 * written with (the old format, which read each edit against its copy): both read the edit the same. Read the same
 * means the same template, or one that draws the same HTML (a value written where it's what the node takes).
 *
 *   EDIT_SEEDS=40 pnpm vitest run src/builder/roundtrip-generated.test.tsx -t "every field"
 */
const EDIT_SEEDS = Number(process.env.EDIT_SEEDS ?? 6);

/** The old format: each item keeps its whole node and a copy of every value written. */
const wholeCopy: Keep = (_kind, values, full) => {
  const w: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) if (!BUILDER_OWN.has(key) && value !== undefined) w[key] = JSON.parse(JSON.stringify(value));
  return { ...full, w } as never;
};

const SKIP = new Set(["cells", "_meta", "_elements"]);
/**
 * Where this format reads what the builder shows, and a whole copy read the template's intent: a body's font or text
 * color changed (each block's is written as it was, and the builder shows it there), and a heading's level changed
 * (its size is written, and the builder keeps it).
 */
const AS_SHOWN = new Set(["body.fontFamily", "body.textColor", "heading.headingType"]);
const COLOR = /^#[0-9a-f]{3,8}$/i;

/** Another value of the same kind as `value`, one per part of it (each leaf of an object, the first item of a list). */
function others(value: unknown, key: string): unknown[] {
  if (typeof value === "string") {
    if (COLOR.test(value)) return [value.toLowerCase() === "#123456" ? "#654321" : "#123456"];
    if (/^(-?\d+(\.\d+)?px\s*)+$/.test(value.trim())) return [value.trim().split(/\s+/).map((part, i) => (i === 0 ? `${parseFloat(part) + 7}px` : part)).join(" ")];
    if (/^\d+(\.\d+)?%$/.test(value)) return [`${Math.max(1, parseFloat(value) - 10)}%`];
    if (/^h[1-6]$/.test(value)) return [value === "h2" ? "h3" : "h2"];
    const turn: Record<string, string> = { left: "center", center: "right", right: "left", horizontal: "vertical", vertical: "horizontal", circle: "rounded", rounded: "squared" };
    if (turn[value]) return [turn[value]];
    if (key === "text" || key === "html") return [value.includes("</") ? value.replace(/(<\/[a-z0-9]+>)\s*$/i, " edited$1") : `${value} edited`];
    return [`${value}x`];
  }
  if (typeof value === "number") return [value + 3];
  if (typeof value === "boolean") return [!value];
  if (Array.isArray(value)) return value.length ? others(value[0], key).map((first) => [first, ...value.slice(1)]) : [];
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([k, v]) => (["name", "type", "key"].includes(k) || v === null ? [] : others(v, k).map((part) => ({ ...value, [k]: part }))));
  }
  return [];
}

type Item = { kind: string; values: Values };
const itemsOf = (design: Values): Item[] => {
  const out: Item[] = [{ kind: "body", values: design.body.values }];
  for (const row of [...design.body.rows, ...(design.body.headers ?? []), ...(design.body.footers ?? [])]) {
    out.push({ kind: "row", values: row.values });
    for (const column of row.columns) {
      out.push({ kind: "column", values: column.values });
      for (const content of column.contents) out.push({ kind: content.values._elements?.locked ? "html" : content.type, values: content.values });
    }
  }
  return out;
};

/** What a design reads as: its template's HTML (or that it isn't valid), and what's said. */
function readAs(design: Values): { tree: string; html: string; report: string[] } {
  const report: string[] = [];
  const root = lower(design as never, report);
  let html: string;
  try {
    const out = renderTemplate({ root });
    html = out.head + out.body;
  } catch (error) {
    html = `not valid: ${(error as Error).message.split("\n")[0]}`;
  }
  // Phone values told apart by a fingerprint are said to change, not which (a whole copy names them).
  return { tree: JSON.stringify(sortedKeys(root)), html, report: report.map((line) => line.replace(/its phone values changed in the builder \([^)]*\)/, "its phone values changed in the builder")).sort() };
}
const sortedKeys = (v: unknown): unknown => (Array.isArray(v) ? v.map(sortedKeys) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortedKeys((v as Values)[k])])) : v);

describe("every field of every tool, edited in the builder", () => {
  it(`reads each edit as a whole copy of what was written does (${EDIT_SEEDS} templates of each root, and the examples)`, { timeout: 300_000 }, () => {
    const templates: Array<[string, React.ReactElement]> = [];
    for (const root of ["Email", "Page", "Document"] as Root[]) for (let seed = 1; seed <= EDIT_SEEDS; seed++) templates.push([`${root} ${seed}`, element(decorated(seed, root))]);
    for (const Example of EXAMPLES) templates.push([Example.name, React.createElement(Example)]);
    const failures: string[] = [];
    let edits = 0;
    for (const [name, template] of templates) {
      const compact = JSON.stringify(writeDesign(template).design);
      const whole = JSON.stringify(writeDesign(template, wholeCopy).design);
      const seen = new Set<string>();
      itemsOf(JSON.parse(compact)).forEach((item, at) => {
        const keys = new Set([...Object.keys(FIELDS[item.kind] ?? {}), ...Object.keys(DEFAULTS[item.kind] ?? {}), "displayCondition", "anchor"]);
        for (const key of keys) {
          if (SKIP.has(key) || AS_SHOWN.has(`${item.kind}.${key}`) || seen.has(`${item.kind}.${key}`)) continue;
          seen.add(`${item.kind}.${key}`);
          const value = item.values[key];
          const fallback = DEFAULTS[item.kind]?.[key];
          const edited: Array<[string, unknown]> = [
            ...(value === undefined ? [] : others(value, key).map((v): [string, unknown] => ["to another value", v])),
            ...(fallback !== undefined && JSON.stringify(fallback) !== JSON.stringify(value) ? [["to the builder's default", PARTED.has(`${item.kind}.${key}`) && value && typeof value === "object" ? { ...value, ...(fallback as object) } : fallback] as [string, unknown]] : []),
            ...(value === undefined ? [] : [["removed", undefined] as [string, unknown]]),
          ];
          for (const [how, now] of edited) {
            edits++;
            const read = [compact, whole].map((json) => {
              const design = JSON.parse(json);
              const values = itemsOf(design)[at].values;
              if (now === undefined) delete values[key];
              else values[key] = now;
              return readAs(design);
            });
            const [a, b] = read;
            if (a.tree === b.tree && JSON.stringify(a.report) === JSON.stringify(b.report)) continue;
            if (a.html === b.html && JSON.stringify(a.report) === JSON.stringify(b.report)) continue;
            failures.push(`${name}: ${item.kind}.${key} ${how} (${JSON.stringify(now)?.slice(0, 60)}): ${a.html !== b.html ? "draws otherwise" : "says otherwise"}${JSON.stringify(a.report) !== JSON.stringify(b.report) ? ` — ${JSON.stringify(a.report)} vs ${JSON.stringify(b.report)}` : ""}`);
          }
        }
      });
    }
    if (process.env.EDIT_DUMP) writeFileSync(process.env.EDIT_DUMP, `${edits} edits\n${failures.join("\n")}\n`);
    expect(edits).toBeGreaterThan(500);
    expect(failures.slice(0, 12)).toEqual([]);
  });
});
