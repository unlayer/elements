/**
 * The tools of today's components that render through the new components (RFC 0001 step 7), by tool: each lowers
 * its block, or says it can't (undefined) and the block keeps the HTML today's exporter writes (a Raw node); null is
 * a block that draws nothing in this output. A tool is added here once the comparisons with main pass with it.
 */
import type { DesignBlock, Place, TreeNode } from "../lower";
import { button } from "./button";
import { divider } from "./divider";
import { image } from "./image";
import { heading, text } from "./text";

export type Lowering = (block: DesignBlock, place: Place) => TreeNode | null | undefined;

export const BLOCKS: Readonly<Record<string, Lowering>> = { button, divider, heading, image, text };
