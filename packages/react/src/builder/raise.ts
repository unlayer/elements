/**
 * A template in the new components as the builder's rows, columns and blocks (written as its design JSON by
 * design.ts), the codemod's mapping the other way. Each component becomes the tool the builder edits it with, with the
 * values that draw it as the new engine does: a Section a
 * full-width row, a Row a row of its children as columns (their shares and gap as the columns' widths and padding), a
 * box directly in the root or a Section a row of its own, content directly in the root a one-column row, a text block
 * its HTML. What a tool has no field for is a hidden property of it (hide.ts); what no tool shows (a Layer, an Svg, a
 * Table, a box nested in a column, a template's own component) is an HTML block of the new engine's own markup, and said.
 */
import { prepareTemplate, type Json, type Node, type ResolvedNode } from "@unlayer-internal/elements-core";
import type React from "react";
import { collectTemplate } from "../primitives/collect";
import { add, boxRowOf, builderId, gapOf, hasBox, hiding, padding, rowOf, TEXT_FOLDED, ZERO, type Sides, type Writer } from "./columns";
import { block, columnWith, rowWith, type Block, type Body, type BodyFields, type Row } from "./design";
import { hiddenOf, leftOut, merge } from "./hide";
import { lockedHtml } from "./locked";
import { blockTool, type Place } from "./tools";
import { builderBorder, builderFont, cssPx, cssSides, type Values } from "./values";

export interface Raised {
  /** The template as the builder's parts, each with its hidden properties in its values. */
  body: Body | null;
  /** What the builder can't hold as it is: one line each, with where. */
  report: string[];
}

type Child = { child: Node; path: string };

const holdsPageNumber = (node: Node): boolean => node.type === "PageNumber" || (node.children ?? []).some((child) => typeof child !== "string" && holdsPageNumber(child));

/** What shows a box's edges: where these are set, space around it can't move inside it. */
const PAINT = ["backgroundColor", "border", "borderRadius"];

/** What a browser gives text where nothing says otherwise. */
const BROWSER_TEXT: Record<string, unknown> = { fontSize: 16, fontStyle: "normal", letterSpacing: 0, textAlign: "left", textTransform: "none" };

export function raise(element: React.ReactElement): Raised {
  const report: string[] = [];
  const { document, diagnostics, components } = collectTemplate(element);
  if (!document || diagnostics.some((d) => d.severity === "error")) return { body: null, report: diagnostics.filter((d) => d.severity === "error").map((d) => `${d.path}: ${d.message}`) };
  const root = document.root;
  if (root.type !== "Email" && root.type !== "Page" && root.type !== "Document") {
    return { body: null, report: [`root: the builder edits an Email, a Page or a Document, not a ${root.type}`] };
  }
  if (holdsPageNumber(root)) report.push("root: a PageNumber goes to the builder as its token ({{page_number}}), which the editor's PDF prints as it is: the builder has no page numbers yet");
  const prepared = prepareTemplate(document, { components });
  if (!prepared.resolved) return { body: null, report: prepared.diagnostics.filter((d) => d.severity === "error").map((d) => `${d.path}: ${d.message}`) };
  const resolvedRoot = prepared.resolved.root;
  const resolved = new Map<string, ResolvedNode>();
  const index = (node: ResolvedNode) => {
    resolved.set(node.path, node);
    for (const child of node.children) if (typeof child !== "string") index(child);
  };
  index(resolvedRoot);
  const at = (path: string) => resolved.get(path)!;

  /** A part, with its hidden properties. */
  const put = <T extends { values: Values }>(made: T, values: Values = {}): T => {
    made.values = merge(made.values, values);
    return made;
  };
  const sayLeftOut = (tool: string, node: Node, path: string, fields: readonly string[]) => {
    const left = leftOut(tool, node, fields);
    if (left.length) report.push(`${path}: the builder's ${tool} has no place for ${left.join(", ")}: left out`);
  };
  /** A Row with a child of its own size, whose width the layout doesn't know. */
  const unsized = (node: Node, path: string) => childrenOf(node, path).some(({ child, path: childPath }) => !child.hidden?.desktop && resolved.get(childPath)?.width === null);
  const childrenOf = (node: Node, path: string): Child[] =>
    (node.children ?? []).map((child, i) => ({ child, path: `${path}.children[${i}]` })).filter((c): c is Child => typeof c.child !== "string");

  /** The text styles a node inherits from its ancestors (its parent's, as resolved) that the root's don't give it. */
  const inheritedText = (path: string): Record<string, Json> => {
    const parent = resolved.get(path.replace(/\.children\[\d+\]$/, ""));
    if (!parent) return {};
    const { lineHeightPx: _px, ...text } = parent.text;
    return Object.fromEntries(Object.entries(text).filter(([key, value]) => JSON.stringify(value) !== JSON.stringify(resolvedRoot.text[key as keyof typeof text]))) as Record<string, Json>;
  };
  /** The text styles markup takes from around it that it wouldn't get in the builder: the body holds the root's color, font and weight, and nothing else takes a browser's defaults' place. */
  const textAround = (path: string): Record<string, Json> => {
    const parent = resolved.get(path.replace(/\.children\[\d+\]$/, ""));
    if (!parent) return {};
    const { lineHeightPx: _px, ...text } = parent.text;
    const given: Record<string, unknown> = { ...BROWSER_TEXT, color: resolvedRoot.text.color, fontFamily: resolvedRoot.text.fontFamily, fontWeight: resolvedRoot.text.fontWeight };
    return Object.fromEntries(Object.entries(text).filter(([key, value]) => JSON.stringify(value) !== JSON.stringify(given[key]))) as Record<string, Json>;
  };
  const place: Place = {
    at,
    report,
    put,
    sayLeftOut,
    locked: (node, path, why, around) => {
      report.push(`${path}: ${why}: it's an HTML block of its own markup in the builder (it can be moved, not edited)`);
      const own = at(path);
      return put(lockedHtml(node, own.width ?? own.available ?? Number(resolvedRoot.width), root, components, around, inheritedText(path)));
    },
    stack: (node, path, around) => stack(node, path, at(path), around),
    textAround,
  };

  /** A stack's blocks, its gap above each but the first, its padding around them. */
  const stack = (node: Node, path: string, own: ResolvedNode, around: Sides): Block[] => {
    const gap = gapOf(own);
    const pad = add(padding(node), around);
    // An empty stack in it (a plain Column with nothing in it) is only space: it goes to the block after it.
    const empty = (child: Node) => child.type === "Column" && !hasBox(child) && !(child.children ?? []).some((c) => typeof c !== "string");
    const all = childrenOf(node, path);
    const children = all.filter(({ child }) => !empty(child));
    let carry = 0;
    const carried: number[] = [];
    for (const { child } of all) {
      if (empty(child)) carry += padding(child).top + padding(child).bottom;
      else {
        carried.push(carry);
        carry = 0;
      }
    }
    return children.flatMap(({ child, path: childPath }, i) => {
      const last = i === children.length - 1;
      const space: Sides = { top: (i === 0 ? pad.top : gap) + carried[i], right: pad.right, bottom: last ? pad.bottom + carry : 0, left: pad.left };
      return ([] as Block[]).concat(blockTool(child, childPath, own, space, place));
    });
  };

  const writer: Writer = { at, put, sayLeftOut, place, childrenOf, stack };
  const row = (node: Node, path: string, band: Values, outer: Sides, bandHidden: Values, arranged?: ResolvedNode) => rowOf(writer, node, path, band, outer, bandHidden, arranged);
  const boxRow = (node: Node, path: string, band: Values, outer: Sides, bandHidden: Values) => boxRowOf(writer, node, path, band, outer, bandHidden);

  /** A one-column row of the builder's holding blocks (content directly in the root, or a Section's). */
  const oneColumn = (blocks: Child[], stackNode: ResolvedNode, band: Values, pad: Sides, bandHidden: Values, sectionHiding: Values = {}): Row => {
    const gap = gapOf(stackNode);
    const contents = blocks.flatMap(({ child, path }, i) => {
      const space: Sides = { top: i === 0 ? pad.top : gap, right: pad.right, bottom: i === blocks.length - 1 ? pad.bottom : 0, left: pad.left };
      return ([] as Block[]).concat(child.type === "Row" ? place.locked(child, path, "a Row whose children take their own width (a line of links)", space) : blockTool(child, path, stackNode, space, place));
    });
    // A run with nothing in it but space (an empty Section): its space as the row's padding.
    const empty = !contents.length;
    return put(rowWith([1], { padding: empty ? cssSides({ ...pad, left: 0, right: 0 }) : "0px", ...sectionHiding, ...band }, [columnWith({ padding: "0px" }, contents)]), bandHidden);
  };

  /** The root's children, or a Section's: Rows, Grids and boxes as rows of their own, runs of blocks as one-column rows. */
  const rows = (children: Child[], stackNode: ResolvedNode, band: Values, pad: Sides, section?: Node): Row[] => {
    const out: Row[] = [];
    let run: Child[] = [];
    const gap = gapOf(stackNode);
    // A Section's border, as the part of it around each of its rows; its hiding, each row's.
    const border = (section?.style?.border ?? {}) as Record<string, Json>;
    const count = Math.max(1, countRows(children));
    // Only where it's hidden: a Section shown everywhere leaves its rows' own hiding as it is.
    const sectionHiding = section ? Object.fromEntries(Object.entries(hiding(section)).filter(([, hidden]) => hidden)) : {};
    const bandHidden = (r: number): Values => {
      const lines = { left: border.left, right: border.right, ...(r === 0 ? { top: border.top } : {}), ...(r === count - 1 ? { bottom: border.bottom } : {}) };
      const own = Object.fromEntries(Object.entries(lines).filter(([, line]) => line !== undefined));
      return Object.keys(own).length ? { sectionBorder: builderBorder(own as never) } : {};
    };
    const flush = (last: boolean) => {
      if (!run.length) return;
      const top = out.length === 0 ? pad.top : gap;
      out.push(oneColumn(run, stackNode, band, { ...pad, top, bottom: last ? pad.bottom : 0 }, bandHidden(out.length), sectionHiding));
      run = [];
    };
    children.forEach(({ child, path }, i) => {
      const last = i === children.length - 1;
      const outer = (): Sides => ({ ...pad, top: out.length === 0 ? pad.top : gap, bottom: last ? pad.bottom : 0 });
      if (child.type === "Column" && !hasBox(child) && hasLayout(child)) {
        // A plain stack holding Rows: its children are rows of their own, its padding around them.
        flush(false);
        const o = outer();
        out.push(...rows(childrenOf(child, path), at(path), band, add(o, padding(child)), section));
      } else if (child.type === "Row" && unsized(child, path)) {
        // Children that take their own width (a line of links) have no share a builder column can hold.
        run.push({ child, path });
      } else if (child.type === "Row") {
        flush(false);
        out.push(row(child, path, { ...band, ...sectionHiding }, outer(), bandHidden(out.length)));
      } else if (child.type === "Grid") {
        // A Grid is the Column of Rows it's laid out as: each of its Rows a row of the builder's, each cell a column.
        flush(false);
        const arranged = at(path);
        const gridGap = gapOf(arranged);
        sayLeftOut("row", child, path, ["props.columns", "props.stackOnMobile", "style.gap", "style.rowGap", "style.alignItems", ...TEXT_FOLDED]);
        // Each cell holds the Grid's child there, as the template has it.
        const items = (child.children ?? []).filter((item): item is Node => typeof item !== "string");
        let next = 0;
        arranged.children.forEach((gridRow, r) => {
          if (typeof gridRow === "string") return;
          const shape = nodeOf(gridRow);
          const cells = (shape.children ?? []).map((cell) => (typeof cell !== "string" && cell.children?.length ? { ...cell, children: [items[next++]] } : cell));
          const space = { ...pad, top: r === 0 ? (out.length === 0 ? pad.top : gap) : gridGap, bottom: last && r === arranged.children.length - 1 ? pad.bottom : 0 };
          out.push(row({ ...shape, children: cells }, gridRow.path, { ...band, ...sectionHiding }, space, bandHidden(out.length), gridRow));
        });
      } else if (child.type === "Column" && (hasBox(child) || !childrenOf(child, path).length) && !hasLayout(child)) {
        flush(false);
        const o = outer();
        // A builder row has no room at its sides: the space around a box goes into its column, where nothing shows it
        // isn't around the box. A box that's painted fills its column, so it's as wide as the row: said, not hidden.
        const painted = PAINT.some((key) => child.style?.[key] !== undefined || child.mobile?.[key] !== undefined);
        if (painted && (o.left || o.right)) report.push(`${path}: the builder's row can't keep a painted box in from its sides: the ${o.left || o.right}px around it is left out, so it's as wide as the row`);
        const inset = painted ? child : { ...child, style: { ...child.style, padding: add(padding(child), { left: o.left, right: o.right }) } };
        out.push(boxRow(inset, path, { ...band, ...sectionHiding }, { top: o.top, right: 0, bottom: o.bottom, left: 0 }, bandHidden(out.length)));
      } else run.push({ child, path });
    });
    flush(true);
    return out;
  };

  const top = childrenOf(root, "root");
  const body: Row[] = [];
  const headers: Row[] = [];
  const footers: Row[] = [];
  let loose: Child[] = [];
  const flushLoose = () => {
    if (loose.length) body.push(...rows(loose, resolvedRoot, {}, ZERO));
    loose = [];
  };
  /** A page break of the builder's, in a row of its own. */
  const pageBreak = () => rowWith([1], { padding: "0px" }, [columnWith({ padding: "0px" }, [block("page_break")])]);
  // In a Document, a page break goes where a page starts or ends (the builder breaks at each).
  let last: "page" | "break" | "other" | null = null;
  const breakBefore = () => {
    if (last && last !== "break") body.push(pageBreak());
  };
  for (const [i, { child, path }] of top.entries()) {
    if (child.type === "Section") {
      flushLoose();
      if (last === "page") breakBefore();
      last = "other";
      const own = at(path);
      sayLeftOut("row", child, path, ["style.backgroundColor", "style.padding", "style.border", "style.gap", "style.alignItems", ...TEXT_FOLDED]);
      const band = own.style.backgroundColor !== undefined ? { backgroundColor: own.style.backgroundColor as string } : {};
      if (child.mobile?.border !== undefined) report.push(`${path}: the builder's row has no border on phones: left out`);
      const sectionRows = rows(childrenOf(child, path), own, band, padding(child), child);
      if (child.id && sectionRows[0]) put(sectionRows[0], builderId(child.id, "u_row"));
      // An empty Section (a band of space) is a row with nothing in it.
      body.push(...(sectionRows.length ? sectionRows : [oneColumn([], own, band, padding(child), {}, hiding(child))]));
    } else if (child.type === "DocumentPage") {
      flushLoose();
      breakBefore();
      last = "page";
      sayLeftOut("row", child, path, ["style.gap", "style.alignItems", ...TEXT_FOLDED]);
      const pageRows = rows(childrenOf(child, path), at(path), {}, ZERO);
      body.push(...(pageRows.length ? pageRows : [oneColumn([], at(path), {}, ZERO, {})]));
    } else if (child.type === "PageBreak") {
      flushLoose();
      const content = top.slice(i + 1).some((c) => !["PageHeader", "PageFooter", "PageBreak"].includes(c.child.type));
      if (last === null || !content) report.push(`${path}: a page break with nothing before or after it is no page in Elements, and a blank page in the builder`);
      body.push(pageBreak());
      last = "break";
    } else if (child.type === "PageHeader" || child.type === "PageFooter") {
      sayLeftOut("row", child, path, ["style.gap", "style.alignItems", "style.padding", "style.backgroundColor", "style.border", ...TEXT_FOLDED]);
      const bandOf = at(path).style.backgroundColor !== undefined ? { backgroundColor: at(path).style.backgroundColor as string } : {};
      (child.type === "PageHeader" ? headers : footers).push(...rows(childrenOf(child, path), at(path), bandOf, padding(child), child));
    } else {
      if (last === "page") breakBefore();
      last = "other";
      loose.push({ child, path });
    }
  }
  flushLoose();

  const style = resolvedRoot.style;
  const text = resolvedRoot.text;
  sayLeftOut("body", root, "root", [
    "props.width", "props.previewText", "props.dir", "props.title", "props.size", "props.orientation",
    "style.backgroundColor", "style.color", "style.fontFamily", "style.fontWeight", "style.gap", "style.alignItems", ...TEXT_FOLDED,
  ]);
  const common: BodyFields = {
    contentWidth: cssPx(Number(resolvedRoot.width)),
    textColor: text.color,
    fontFamily: builderFont(String(text.fontFamily)),
    ...(text.fontWeight !== 400 ? { fontWeight: text.fontWeight } : {}),
    ...(root.props?.dir ? { textDirection: root.props.dir as string } : {}),
  };
  // Its title, the builder's accessibility title (which its export writes as the page's <title>).
  const title = typeof root.props?.title === "string" && root.props.title ? { accessibilityTitle: root.props.title } : {};
  // A Document's margin: the builder has one for every side (design.ts), the template's sides kept where they differ.
  const margin = root.type === "Document" ? { margin: cssSides((root.props?.margin as Sides | undefined) ?? { top: 48, right: 48, bottom: 48, left: 48 }) } : {};
  // No background is none (the builder's own default is a grey).
  const bodyHidden = { ...hiddenOf("body", root, ["props.margin"]), ...margin, ...title, backgroundColor: (style.backgroundColor as string | undefined) ?? "" };
  if (root.type === "Document") {
    const paper = { documentSize: (root.props?.size as string | undefined) ?? "A4", documentOrientation: (root.props?.orientation as string | undefined) ?? "portrait" };
    return { body: { root: root.type, fields: { ...common, ...paper }, values: bodyHidden, rows: body, headers, footers }, report };
  }
  const previewText = root.type === "Email" && root.props?.previewText ? { previewText: String(root.props.previewText) } : {};
  return { body: { root: root.type, fields: common, ...previewText, values: bodyHidden, rows: body }, report };
}

/** How many rows of the builder's children make (a Grid's rows each, runs of blocks one). */
function countRows(children: Child[]): number {
  let count = 0;
  let run = false;
  for (const { child } of children) {
    if (child.type === "Column" && !hasBox(child) && hasLayout(child)) {
      count += countRows((child.children ?? []).filter((c): c is Node => typeof c !== "string").map((c) => ({ child: c, path: "" })));
      run = false;
    } else if (child.type === "Row" || (child.type === "Column" && (hasBox(child) || !(child.children ?? []).some((c) => typeof c !== "string")) && !hasLayout(child))) {
      count++;
      run = false;
    } else if (child.type === "Grid") {
      count += Math.ceil((child.children ?? []).filter((c) => typeof c !== "string").length / Math.max(1, Number(child.props?.columns ?? 2)));
      run = false;
    } else if (!run) {
      count++;
      run = true;
    }
  }
  return count;
}

/** Whether a box holds a layout a builder column can't (a Row, a Grid): it's locked instead. */
const hasLayout = (node: Node): boolean => (node.children ?? []).some((child) => typeof child !== "string" && (child.type === "Row" || child.type === "Grid" || child.type === "Layer" || (child.type === "Column" && hasLayout(child))));

/** A resolved node as a template node (a Grid's arranged Rows, which the template doesn't have). */
export function nodeOf(node: ResolvedNode): Node {
  return {
    type: node.type,
    ...(node.id ? { id: node.id } : {}),
    props: node.props,
    style: node.style,
    ...(node.hidden ? { hidden: node.hidden } : {}),
    children: node.children.map((child) => (typeof child === "string" ? child : nodeOf(child))),
  };
}
