/**
 * A root's content collected: the walker (src/engine) renders it once per render, recording Elements' Rows, Columns,
 * blocks, scopes and head entries (see utils/record.tsx), and gives it as a tree of its records, markup and text,
 * which the model (elements.ts) is made from.
 */
import type React from "react";
import type { Recorded } from "../utils/collect";
import { collector, guard } from "../utils/record";
import { contentTree, isUnlayerProvider, nestedRoot, UNREAD } from "../utils/unwrap-root";
import { ROOTLESS } from "../utils/root-type";
import { guest, idPrefix, omitted, onError, sayer, scopeCache, unwrapped } from "../utils/render-scope";
import { isTailwindError } from "../utils/tailwind";
import { collect as walk, type Flat, type Item, type RenderError } from "../engine";
import { omits } from "../engine/errors";

/** One render of a root's children, collected. */
export interface Collected {
  content: Item[];
  /** What's recorded, in tree order (head entries too, which aren't in the content). */
  recorded: Recorded[];
  /** What was said once (the HTML, the head and the design build from the same render), by record. */
  told: Set<object>;
  /** Each component's kept markup, worked out once. */
  kept?: Map<object, React.ReactElement | undefined>;
  /** Props with their classes turned into props (see styled), by record (null: left out). */
  styled?: Map<object, Record<string, any> | null>;
  /** The records in each <Tailwind> scope, by its record (see inScope). */
  scopes?: Map<object, object[]>;
  /** The root's props (its classes as props, its mode), for a scope's rewrite of a Row (see utils/tailwind.ts). */
  root?: Record<PropertyKey, any>;
  /** Each Row, Column and block, as the Elements component it is, made once (see elements.ts), by record. */
  made?: Map<object, React.ReactElement | null>;
}

/** How `children` (a root's, `root` naming it) are walked to collect them: the collector, and the walk's options. */
export function collecting(children: React.ReactNode, root: string) {
  const policy = onError();
  // A template with no root's: a root its walk meets in it is said, once in this render (see nestedRoot).
  const say = root === ROOTLESS ? sayer() : undefined;
  const options = { omit: omits(policy), nested: say && ((name: string) => say(nestedRoot(name), UNREAD)) };
  // (What its template's wrappers read for contexts no provider gives, it reads too: one value each, the render's.)
  return { node: guard(children, options, root), options: { collector: collector(options), onError: policy, idPrefix: idPrefix(), root, tree: contentTree(children), fallbacks: unwrapped()?.fallbacks, passes: isTailwindError, frameless: isUnlayerProvider } };
}

/** A collecting walk's output as the collected template; what it left out listed and said (this render's). */
export function collectedFrom(flat: { content: Item[]; recorded: object[]; omitted: RenderError[] }): Collected {
  for (const error of flat.omitted) omitted(error);
  return { content: flat.content, recorded: flat.recorded as Recorded[], told: new Set() };
}

/** `children` collected synchronously: its components run outside this render's scope (one they start is its own). */
function collected(children: React.ReactNode, root: string): Collected {
  const { node, options } = collecting(children, root);
  return collectedFrom(guest(() => walk(node, options)) as Flat);
}

/** `children` collected, once per render (the HTML, the head and the design ask for the same). */
export const collect = (children: React.ReactNode, root = ROOTLESS): Collected =>
  children !== null && typeof children === "object" ? scopeCache(children, () => collected(children, root)) : collected(children, root);
