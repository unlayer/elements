/**
 * The tools of today's components that render through the new components (RFC 0001 step 7), by tool: each lowers its
 * block, always: what the new engine can't read of it is said (a diagnostic), never a reason to keep it. Null is a
 * block that draws nothing in this output.
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

export type Lowering = (block: DesignBlock, place: Place) => TreeNode | null;

export const BLOCKS: Readonly<Record<string, Lowering>> = { button, divider, heading, image, menu, page_break: pageBreak, social, table, text, video };
