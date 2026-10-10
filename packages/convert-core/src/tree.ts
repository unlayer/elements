/**
 * The Elements tree: what every converter produces and every output reads.
 *
 * Same shape as the tree the Unlayer MCP server's `render_elements` takes —
 * `{ type, props, children }` with @unlayer/react-elements component names and
 * a Row `layout` given by name ("TwoEqual") — so a converted template can go
 * straight to the MCP server too.
 */

/**
 * Code standing in for a value or for children, when converting source code
 * whose content comes from props or logic (`{user.name}`, `{items.map(…)}`).
 */
export interface Expr {
  $expr: string;
}

export function expr(code: string): Expr {
  return { $expr: code };
}

export function isExpr(value: unknown): value is Expr {
  return typeof value === "object" && value !== null && typeof (value as Expr).$expr === "string";
}

/**
 * A slot in a code hole: where its nodes go. Written with private-use
 * characters, which a template's own code (`legalRef === "§13"`) doesn't hold.
 */
export const SLOT_OPEN = "\uE000";
export const SLOT_CLOSE = "\uE001";
export const SLOT = /\uE000(\d+)\uE001/g;

export interface ElementNode {
  /**
   * Component name: Email, Row, Column, Paragraph, … — or "#expr" for a
   * code hole whose `code` has a slot (SLOT_OPEN, its index, SLOT_CLOSE)
   * where each `slots` entry (more Elements nodes) goes.
   */
  type: string;
  props?: Record<string, unknown>;
  /** Child nodes; strings are text (for Heading/Button). Exprs are code. */
  children?: Array<ElementNode | string | Expr>;
  code?: string;
  slots?: Array<Array<ElementNode | string>>;
  /**
   * On an Html block standing in for something the converter couldn't map:
   * why. Counts as a fallback in the report and prints as a TODO comment.
   */
  fallback?: string;
  /**
   * An invisible Divider standing for space in an otherwise empty Column (the visual editor
   * shows an empty column as a placeholder that changes the layout). Not counted as content.
   */
  spacer?: boolean;
}

export const ROOT_TYPES = ["Email", "Page", "Document"] as const;

export const LAYOUT_TYPES = ["Row", "Column"] as const;

export const CONTENT_TYPES = [
  "Button",
  "Divider",
  "Heading",
  "Html",
  "Image",
  "Menu",
  "Paragraph",
  "PageBreak",
  "Social",
  "Table",
  "Video",
] as const;

export function el(
  type: string,
  props: Record<string, unknown> = {},
  children: Array<ElementNode | string | Expr> = []
): ElementNode {
  const node: ElementNode = { type };
  const cleaned = Object.fromEntries(Object.entries(props).filter(([, v]) => v !== undefined));
  if (Object.keys(cleaned).length > 0) node.props = cleaned;
  if (children.length > 0) node.children = children;
  return node;
}

/** An Html block keeping content the converter couldn't map, and why. */
export function fallbackHtml(html: string, reason: string): ElementNode {
  return { type: "Html", props: { html }, fallback: reason };
}

/** A code hole holding more nodes (see ElementNode.code). */
export function hole(code: string, slots: Array<Array<ElementNode | string>>): ElementNode {
  return { type: "#expr", code, slots };
}

/** Every content node (Paragraph, Button, Html, …) in document order. */
export function contentNodes(tree: ElementNode): ElementNode[] {
  const out: ElementNode[] = [];
  const visit = (node: ElementNode | string | Expr) => {
    if (typeof node === "string" || isExpr(node)) return;
    if ((CONTENT_TYPES as readonly string[]).includes(node.type) && !node.spacer) out.push(node);
    node.children?.forEach(visit);
    node.slots?.forEach((slot) => slot.forEach(visit));
  };
  visit(tree);
  return out;
}
