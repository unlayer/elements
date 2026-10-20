/** What mapping one template carries along: its head, the notes it reports, and the blocks still compiling. */

import type { DeclaredDifference } from "@unlayer/convert-core";
import type { HeadInfo } from "./head";
import type { DesignContent, Fallback, MjmlNode, Note } from "./types";

export interface Context {
  head: HeadInfo;
  /** The template's `mj-head`, for blocks compiled on their own. */
  headNode?: MjmlNode;
  /** The `<mjml>` root (its `lang`, `dir`, `owa`). */
  root: MjmlNode;
  /** The body's font stack: blocks with another one name theirs. */
  bodyFont: string;
  /**
   * The email's direction in Elements, which lays out every row's columns in it: right to left for `<mjml dir="rtl">`
   * where MJML shows no section's columns left to right.
   */
  direction: "ltr" | "rtl";
  warnings: Note[];
  info: Note[];
  fallbacks: Fallback[];
  /** Fallback blocks compiling (MJML compiles asynchronously): awaited before the design is done. */
  jobs: Array<Promise<void>>;
  /** Content the conversion changes on purpose (a social icon's alt text), for the check to expect. */
  declared: DeclaredDifference[];
}

/** A block kept as MJML's HTML, compiled by `html()`: noted, and filled in when it's compiled. */
export function fallbackBlock(ctx: Context, tag: string, reason: string, html: () => Promise<string>): DesignContent {
  const block: DesignContent = { type: "html", values: { html: "", containerPadding: "0px" } };
  ctx.fallbacks.push({ tag, reason });
  ctx.jobs.push(
    html().then(
      (text) => void (block.values.html = text),
      (error) => {
        ctx.warnings.push({ reason: "couldn't compile a block MJML's way", detail: `<${tag}>: ${(error as Error).message}` });
      },
    ),
  );
  return block;
}
