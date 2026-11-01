/**
 * A legacy template's design (what renderToJson returns: the builder's JSON) as the new engine's tree. The body is
 * the Email or Page; each row a Section around a Row of its columns; each block what `block()` makes of it (a Raw
 * node with its legacy HTML, until its component moves over). Where legacy draws something other than the design
 * asks, the tree draws it as legacy does (quirks.ts).
 */
import type { Json } from "@unlayer-internal/elements-core";
import { rowPaddingInEmail } from "./quirks";

type Values = Record<string, any>;
type Sides = { top: number; right: number; bottom: number; left: number };

/** A block of the design: its tool and values. */
export interface DesignBlock {
  type: string;
  slug?: string;
  values: Values;
}

export interface TreeNode {
  type: string;
  props?: Record<string, Json>;
  style?: Record<string, Json>;
  mobile?: Record<string, Json>;
  hidden?: { mobile?: boolean; desktop?: boolean };
  children?: Array<TreeNode | string>;
  compat?: Record<string, Json>;
}

export interface LowerOptions {
  /** The legacy root's output: the design doesn't say. */
  mode: "email" | "web";
  /** A block as a node of the tree. */
  block(block: DesignBlock): TreeNode;
}

const px = (value: unknown): number | undefined => {
  if (typeof value === "number") return value;
  const match = typeof value === "string" ? /^\s*(-?[\d.]+)\s*(px)?\s*$/.exec(value) : null;
  return match ? Number(match[1]) : undefined;
};

/** "10px 20px" (1 to 4 values) as four sides. */
function sides(value: unknown): Sides | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "number") return { top: value, right: value, bottom: value, left: value };
  const parts = String(value).trim().split(/\s+/).map((part) => parseFloat(part));
  if (parts.some((part) => !Number.isFinite(part))) return undefined;
  const [top, right = top, bottom = top, left = right] = parts;
  return { top, right, bottom, left };
}

const color = (value: unknown) => (typeof value === "string" && value !== "" && value !== "transparent" ? value : undefined);
const some = (s: Sides | undefined) => (s && (s.top || s.right || s.bottom || s.left) ? s : undefined);

/** A legacy border (`borderTopWidth`, …) as the new engine's, side by side. */
function border(values: Values = {}): Json | undefined {
  const out: Record<string, Json> = {};
  for (const side of ["Top", "Right", "Bottom", "Left"]) {
    const width = px(values[`border${side}Width`]);
    if (!width) continue;
    out[side.toLowerCase()] = { width, style: values[`border${side}Style`] ?? "solid", color: values[`border${side}Color`] ?? "#000000" };
  }
  return Object.keys(out).length ? out : undefined;
}

/** Where a block, column or row is hidden: on desktop, or on phones (an override). */
function hidden(values: Values): TreeNode["hidden"] {
  const desktop = !!(values.hideDesktop || values._override?.desktop?.hideDesktop);
  const mobile = !!(values.hideMobile || values._override?.mobile?.hideMobile);
  return desktop || mobile ? { ...(desktop ? { desktop } : {}), ...(mobile ? { mobile } : {}) } : undefined;
}

const defined = <T extends object>(object: T): T => Object.fromEntries(Object.entries(object).filter(([, v]) => v !== undefined)) as T;

function column(design: Values, width: string | undefined, options: LowerOptions): TreeNode {
  const values: Values = design.values ?? {};
  const phonePadding = some(sides(values._override?.mobile?.padding));
  return defined({
    type: "Column",
    style: defined({ width, backgroundColor: color(values.backgroundColor), padding: some(sides(values.padding)), border: border(values.border), borderRadius: px(values.borderRadius) || undefined }) as Record<string, Json>,
    mobile: phonePadding ? { padding: phonePadding } : undefined,
    hidden: hidden(values),
    children: (design.contents ?? []).map((block: DesignBlock) => defined({ ...options.block(block), hidden: hidden(block.values ?? {}) })),
  });
}

function row(design: Values, options: LowerOptions): TreeNode {
  const values: Values = design.values ?? {};
  const padding = sides(values.padding);
  const cells: number[] = design.cells ?? values.cells ?? [1];
  const total = cells.reduce((sum, cell) => sum + cell, 0) || 1;
  // Legacy shares are each column's whole box, its padding included: a percentage of the row.
  const widths = cells.map((cell) => (cells.length > 1 ? `${Math.round((cell / total) * 1e6) / 1e4}%` : undefined));
  const inner = defined({
    type: "Row",
    props: values.noStackMobile ? { stackOnMobile: false } : undefined,
    style: defined({ backgroundColor: color(values.columnsBackgroundColor) }) as Record<string, Json>,
    children: (design.columns ?? []).map((c: Values, index: number) => column(c, widths[index], options)),
  });
  return defined({
    type: "Section",
    style: defined({
      backgroundColor: color(values.backgroundColor),
      padding: some(padding && (options.mode === "email" ? rowPaddingInEmail(padding) : padding)),
    }) as Record<string, Json>,
    hidden: hidden(values),
    compat: values.displayCondition ? { displayCondition: values.displayCondition } : undefined,
    children: [inner],
  });
}

/** The design's body, rows and blocks as the new engine's tree. */
export function lowerDesign(design: { body: Values }, options: LowerOptions): { root: TreeNode } {
  const values: Values = design.body.values ?? {};
  const root = defined({
    type: options.mode === "email" ? "Email" : "Page",
    props: defined({
      width: px(values.contentWidth),
      previewText: options.mode === "email" && values.preheaderText ? values.preheaderText : undefined,
      dir: values.textDirection || undefined,
      lang: values.language?.value || undefined,
      title: values.accessibilityTitle || undefined,
    }) as Record<string, Json>,
    style: defined({ backgroundColor: color(values.backgroundColor), color: values.textColor || undefined, fontFamily: values.fontFamily?.value || undefined }) as Record<string, Json>,
    children: (design.body.rows ?? []).map((r: Values) => row(r, options)),
  });
  return { root };
}
