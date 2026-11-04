/**
 * The tools of today's components that render through the new components (RFC 0001 step 7), by tool: each lowers
 * its block, or says it can't (undefined) and the block keeps the HTML today's exporter writes (a Raw node); null is
 * a block that draws nothing in this output. A tool is added here once the comparisons with main pass with it. Those
 * in DRAWN always lower: what the new engine can't read of a block is said (a diagnostic), never a reason to keep it.
 */
import type { DesignBlock, Place, TreeNode } from "../lower";
import { button } from "./button";
import { divider } from "./divider";
import { image } from "./image";
import { menu } from "./menu";
import { pageBreak } from "./page-break";
import { social } from "./social";
import { table } from "./table";
import { heading, text } from "./text";
import { video } from "./video";

/** Where a block is, with what a tool that always lowers says. */
export type DrawnPlace = Place & {
  id?: string;
  /** Says what's drawn otherwise than the block asks: a diagnostic of the render. */
  note(message: string, severity?: "warning" | "info"): void;
  /** Text with its email service's tags (or what `pattern` finds) kept out of the writers' escaping (render.ts puts them back). */
  keep(text: string, pattern?: RegExp): string;
};

export type Lowering = (block: DesignBlock, place: DrawnPlace) => TreeNode | null | undefined;

export const BLOCKS: Readonly<Record<string, Lowering>> = { button, divider, heading, image, menu, page_break: pageBreak, social, table, text, video };

export const DRAWN: ReadonlySet<string> = new Set(["button", "divider", "heading", "image", "menu", "page_break", "social", "table", "text", "video"]);
