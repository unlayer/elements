/**
 * A template in the new components as today's (the builder's), the codemod's mapping the other way. Each component
 * becomes the tool the builder edits it with, with the values that draw it as the new engine does: a Section a
 * full-width row, a Row a row of its children as columns (their shares and gap as the columns' widths and padding), a
 * box directly in the root or a Section a row of its own, content directly in the root a one-column row, a text block
 * its HTML. What a tool has no field for is a hidden property of it (hide.ts); what no tool shows (a Layer, an Svg, a
 * Table, a box nested in a column, a template's own component) is an HTML block of the new engine's own markup, and said.
 */
import type { Json, Node, ResolvedNode } from "@unlayer-internal/elements-core";
import { prepareTemplate } from "@unlayer-internal/elements-exporters";
import React from "react";
import { Column, Document, Email, Page, PageBreak, Row } from "../index";
import { collectTemplate } from "../primitives/collect";
import { blockTool, type Place } from "./tools";
import { hiddenOf, leftOut, merge } from "./hide";
import { builderBorder, cssPx, cssSides, builderFont, type Values } from "./values";
import { lockedHtml } from "./locked";

type Sides = { top: number; right: number; bottom: number; left: number };

export interface Raised {
  /** The template in today's components. */
  element: React.ReactElement | null;
  /** What the builder can't hold as it is: one line each, with where. */
  report: string[];
  /** Each element's hidden properties, merged into its values once written. */
  hidden: WeakMap<object, Values>;
  /** A Document's header and footer, as rows of their own (the builder's `headers` and `footers`). */
  headers?: React.ReactElement[];
  footers?: React.ReactElement[];
}

const ZERO: Sides = { top: 0, right: 0, bottom: 0, left: 0 };
const add = (a: Sides, b: Partial<Sides>): Sides => ({ top: a.top + (b.top ?? 0), right: a.right + (b.right ?? 0), bottom: a.bottom + (b.bottom ?? 0), left: a.left + (b.left ?? 0) });
const padding = (node: { style?: Record<string, Json> }): Sides => (node.style?.padding as Sides | undefined) ?? ZERO;
const gapOf = (node: ResolvedNode) => (typeof node.style.gap === "number" ? node.style.gap : 0);
/** A box with a look of its own: a Column that can't fold into the blocks around it. */
const BOX = ["backgroundColor", "border", "borderRadius", "width", "minWidth", "maxWidth", "height", "overflow", "justifyContent"];
const hasBox = (node: Node) => BOX.some((key) => node.style?.[key] !== undefined) || Boolean(node.hidden);
/** Stacks whose children are blocks one under another, folded into the column they're in. */
const STACKS = new Set(["Section", "Column", "DocumentPage"]);
type Child = { child: Node; path: string };

export function raise(element: React.ReactElement): Raised {
  const report: string[] = [];
  const hidden = new WeakMap<object, Values>();
  const { document, diagnostics, components } = collectTemplate(element);
  if (!document || diagnostics.some((d) => d.severity === "error")) return { element: null, report: diagnostics.filter((d) => d.severity === "error").map((d) => `${d.path}: ${d.message}`), hidden };
  const root = document.root;
  if (root.type !== "Email" && root.type !== "Page" && root.type !== "Document") {
    return { element: null, report: [`root: the builder edits an Email, a Page or a Document, not a ${root.type}`], hidden };
  }
  const prepared = prepareTemplate(document, { components });
  if (!prepared.resolved) return { element: null, report: prepared.diagnostics.filter((d) => d.severity === "error").map((d) => `${d.path}: ${d.message}`), hidden };
  const resolvedRoot = prepared.resolved.root;
  const resolved = new Map<string, ResolvedNode>();
  const index = (node: ResolvedNode) => {
    resolved.set(node.path, node);
    for (const child of node.children) if (typeof child !== "string") index(child);
  };
  index(resolvedRoot);
  const at = (path: string) => resolved.get(path)!;

  /** The element, with its hidden properties. */
  const put = (made: React.ReactElement, values: Values = {}): React.ReactElement => {
    hidden.set(made, merge(hidden.get(made) ?? {}, values));
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

  const place: Place = {
    at,
    report,
    put,
    sayLeftOut,
    locked: (node, path, why, around) => {
      report.push(`${path}: ${why}: it's an HTML block of its own markup in the builder (it can be moved, not edited)`);
      const own = at(path);
      return put(lockedHtml(node, path, own.width ?? own.available ?? Number(resolvedRoot.width), root, components, around));
    },
    stack: (node, path, around) => stack(node, path, at(path), around),
  };

  /** A stack's blocks, its gap above each but the first, its padding around them. */
  const stack = (node: Node, path: string, own: ResolvedNode, around: Sides): React.ReactElement[] => {
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
      return ([] as React.ReactElement[]).concat(blockTool(child, childPath, own, space, place));
    });
  };

  /** A builder row's hiding, from the node it's made of. */
  const hiding = (node: Node) => ({ hideOnMobile: node.hidden?.mobile || undefined, hideOnDesktop: node.hidden?.desktop || undefined });

  /** A row of the builder's for a Row: each child a column, its width and its share of the gap its column's. */
  const row = (node: Node, path: string, band: Values, outer: Sides, bandHidden: Values, arranged?: ResolvedNode): React.ReactElement => {
    const own = arranged ?? at(path);
    const gap = gapOf(own);
    const rowPad = add(padding(node), outer);
    const all = childrenOf(node, path);
    const n = all.length;
    if (!arranged) sayLeftOut("row", node, path, ["style.padding", "style.gap", "style.backgroundColor", "style.border", "style.alignItems", "props.stackOnMobile", ...TEXT_FOLDED]);
    const stacks = node.props?.stackOnMobile !== false;
    const rowBorder = (own.style.border as Record<string, Json> | undefined) ?? {};
    const columns = all.map(({ child, path: childPath }, i) => {
      // A child hidden on desktop takes no room there: the least share a column can have in the builder.
      const width = child.hidden?.desktop ? 0 : (at(childPath)?.width ?? 0);
      // The Row's top and bottom padding is the builder's row's; its sides and its gap, the columns' own.
      const halves: Sides = { top: 0, bottom: 0, left: i > 0 ? gap / 2 : rowPad.left, right: i < n - 1 ? gap / 2 : rowPad.right };
      const share = width + halves.left + halves.right;
      const isColumn = child.type === "Column";
      const style = child.style ?? {};
      // The Row's border is its columns' in the builder, which stretches them to the row's height: top and bottom on
      // each, its sides on the first and last. The column's own over it.
      const fromRow = { top: rowBorder.top, bottom: rowBorder.bottom, ...(i === 0 ? { left: rowBorder.left } : {}), ...(i === n - 1 ? { right: rowBorder.right } : {}) };
      const lines = Object.fromEntries(Object.entries({ ...fromRow, ...((isColumn ? style.border : undefined) as object) }).filter(([, line]) => line !== undefined));
      const columnPadding = isColumn ? add(padding(child), halves) : halves;
      // Where the columns stack on phones, each is as wide as the row (its sides only the Row's), the phone gap above
      // all but the first.
      const phoneGap = typeof own.mobile?.gap === "number" ? own.mobile.gap : gap;
      const ownPhone = isColumn ? ((child.mobile?.padding as Sides | undefined) ?? padding(child)) : ZERO;
      const phonePadding = stacks && n > 1 ? add(ownPhone, { left: rowPad.left, right: rowPad.right, top: i > 0 ? phoneGap : 0 }) : isColumn ? (child.mobile?.padding as Sides | undefined) : undefined;
      if (isColumn && !arranged) sayLeftOut("column", child, childPath, ["style.padding", "mobile.padding", "style.backgroundColor", "style.border", "mobile.border", "style.borderRadius", "style.width", "style.flex", "style.gap", "style.alignItems", ...TEXT_FOLDED]);
      const columnOwn = isColumn ? at(childPath) : own;
      const contents = isColumn ? stack(withoutPadding(child), childPath, columnOwn, ZERO) : ([] as React.ReactElement[]).concat(blockTool(child, childPath, own, ZERO, place));
      const element = (
        <Column
          key={childPath}
          padding={cssSides(columnPadding)}
          backgroundColor={isColumn ? (style.backgroundColor as string | undefined) : undefined}
          border={builderBorder(lines as never)}
          borderRadius={isColumn && style.borderRadius !== undefined ? (typeof style.borderRadius === "number" ? cssPx(style.borderRadius) : undefined) : undefined}
        >
          {contents}
        </Column>
      );
      // Its phone padding (where the columns stack, the Row's sides and gap in it) and border, as the builder's phone values.
      const phone = { ...(phonePadding && cssSides(phonePadding) !== cssSides(columnPadding) ? { padding: cssSides(phonePadding) } : {}), ...(isColumn && child.mobile?.border ? { border: builderBorder(child.mobile.border as never) } : {}) };
      return { share, element: put(element, merge(isColumn ? hiddenOf("column", child) : {}, Object.keys(phone).length ? { _override: { mobile: phone } } : {})) };
    });
    const alignItems = own.style.alignItems as string | undefined;
    const made = (
      <Row
        key={path}
        cells={columns.map((c) => Math.max(1, Math.round(c.share)))}
        padding={`${cssPx(rowPad.top)} 0px ${cssPx(rowPad.bottom)} 0px`}
        noStackMobile={node.props?.stackOnMobile === false || undefined}
        columnsBackgroundColor={own.style.backgroundColor as string | undefined}
        {...hiding(node)}
        {...band}
      >
        {columns.map((c) => c.element)}
      </Row>
    );
    const values: Values = { ...(alignItems && alignItems !== "start" ? { alignItems: ALIGN_ITEMS[alignItems] } : {}) };
    return put(made, merge(merge(values, arranged ? {} : hiddenOf("row", node, ["style.border"])), bandHidden));
  };

  /** A row of its own for a box directly in the root or a Section: one column, the box's. */
  const boxRow = (node: Node, path: string, band: Values, outer: Sides, bandHidden: Values): React.ReactElement => {
    const own = at(path);
    sayLeftOut("column", node, path, ["style.padding", "mobile.padding", "style.backgroundColor", "style.border", "mobile.border", "style.borderRadius", "style.gap", "style.alignItems", ...TEXT_FOLDED]);
    const style = node.style ?? {};
    const column = (
      <Column
        padding={cssSides(padding(node))}
        backgroundColor={style.backgroundColor as string | undefined}
        border={builderBorder(style.border as never)}
        borderRadius={typeof style.borderRadius === "number" ? cssPx(style.borderRadius) : undefined}
      >
        {stack(withoutPadding(node), path, own, ZERO)}
      </Column>
    );
    const { hidden: _, ...visible } = node;
    const made = (
      <Row key={path} cells={[1]} padding={cssSides(outer)} {...hiding(node)} {...band}>
        {put(column, merge(hiddenOf("column", visible as Node), phoneBox(node)))}
      </Row>
    );
    return put(made, bandHidden);
  };

  /** A one-column row of the builder's holding blocks (content directly in the root, or a Section's). */
  const oneColumn = (blocks: Child[], stackNode: ResolvedNode, band: Values, pad: Sides, key: string, bandHidden: Values, sectionHiding: Values = {}): React.ReactElement => {
    const gap = gapOf(stackNode);
    const contents = blocks.flatMap(({ child, path }, i) => {
      const space: Sides = { top: i === 0 ? pad.top : gap, right: pad.right, bottom: i === blocks.length - 1 ? pad.bottom : 0, left: pad.left };
      return ([] as React.ReactElement[]).concat(child.type === "Row" ? place.locked(child, path, "a Row whose children take their own width (a line of links)", space) : blockTool(child, path, stackNode, space, place));
    });
    // A run with nothing in it but space (an empty Section): its space as the row's padding.
    const empty = !contents.length;
    return put(
      <Row key={key} cells={[1]} padding={empty ? cssSides({ ...pad, left: 0, right: 0 }) : "0px"} {...sectionHiding} {...band}>
        <Column padding="0px">{contents}</Column>
      </Row>,
      bandHidden
    );
  };

  /** The root's children, or a Section's: Rows, Grids and boxes as rows of their own, runs of blocks as one-column rows. */
  const rows = (children: Child[], stackNode: ResolvedNode, band: Values, pad: Sides, keyBase: string, section?: Node): React.ReactElement[] => {
    const out: React.ReactElement[] = [];
    let run: Child[] = [];
    const gap = gapOf(stackNode);
    // A Section's border, as the part of it around each of its rows; its hiding, each row's.
    const border = (section?.style?.border ?? {}) as Record<string, Json>;
    const count = Math.max(1, countRows(children));
    const sectionHiding = section ? hiding(section) : {};
    const bandHidden = (r: number): Values => {
      const lines = { left: border.left, right: border.right, ...(r === 0 ? { top: border.top } : {}), ...(r === count - 1 ? { bottom: border.bottom } : {}) };
      const own = Object.fromEntries(Object.entries(lines).filter(([, line]) => line !== undefined));
      return Object.keys(own).length ? { sectionBorder: builderBorder(own as never) } : {};
    };
    const flush = (last: boolean) => {
      if (!run.length) return;
      const top = out.length === 0 ? pad.top : gap;
      out.push(oneColumn(run, stackNode, band, { ...pad, top, bottom: last ? pad.bottom : 0 }, `${keyBase}.run${out.length}`, bandHidden(out.length), sectionHiding));
      run = [];
    };
    children.forEach(({ child, path }, i) => {
      const last = i === children.length - 1;
      const outer = (): Sides => ({ ...pad, top: out.length === 0 ? pad.top : gap, bottom: last ? pad.bottom : 0 });
      if (child.type === "Column" && !hasBox(child) && hasLayout(child)) {
        // A plain stack holding Rows: its children are rows of their own, its padding around them.
        flush(false);
        const o = outer();
        out.push(...rows(childrenOf(child, path), at(path), band, add(o, padding(child)), path, section));
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
        out.push(boxRow(child, path, { ...band, ...sectionHiding }, { top: o.top, right: 0, bottom: o.bottom, left: 0 }, bandHidden(out.length)));
      } else run.push({ child, path });
    });
    flush(true);
    return out;
  };

  const top = childrenOf(root, "root");
  const body: React.ReactElement[] = [];
  const headers: React.ReactElement[] = [];
  const footers: React.ReactElement[] = [];
  let loose: Child[] = [];
  const flushLoose = () => {
    if (loose.length) body.push(...rows(loose, resolvedRoot, {}, ZERO, `root.loose${body.length}`));
    loose = [];
  };
  /** A page break of the builder's, in a row of its own. */
  const pageBreak = (path: string) => (
    <Row key={`${path}.break`} cells={[1]} padding="0px">
      <Column padding="0px">
        <PageBreak key={path} />
      </Column>
    </Row>
  );
  // In a Document, a page break goes where a page starts or ends (the builder breaks at each).
  let last: "page" | "break" | "other" | null = null;
  const breakBefore = (path: string) => {
    if (last && last !== "break") body.push(pageBreak(`${path}.before`));
  };
  for (const [i, { child, path }] of top.entries()) {
    if (child.type === "Section") {
      flushLoose();
      if (last === "page") breakBefore(path);
      last = "other";
      const own = at(path);
      sayLeftOut("row", child, path, ["style.backgroundColor", "style.padding", "style.border", "style.gap", "style.alignItems", ...TEXT_FOLDED]);
      const band = own.style.backgroundColor !== undefined ? { backgroundColor: own.style.backgroundColor as string } : {};
      const sectionRows = rows(childrenOf(child, path), own, band, padding(child), path, child);
      // An empty Section (a band of space) is a row with nothing in it.
      body.push(...(sectionRows.length ? sectionRows : [oneColumn([], own, band, padding(child), `${path}.empty`, {}, hiding(child))]));
    } else if (child.type === "DocumentPage") {
      flushLoose();
      breakBefore(path);
      last = "page";
      sayLeftOut("row", child, path, ["style.gap", "style.alignItems", ...TEXT_FOLDED]);
      const pageRows = rows(childrenOf(child, path), at(path), {}, ZERO, path);
      body.push(...(pageRows.length ? pageRows : [oneColumn([], at(path), {}, ZERO, `${path}.blank`, {})]));
    } else if (child.type === "PageBreak") {
      flushLoose();
      const content = top.slice(i + 1).some((c) => !["PageHeader", "PageFooter", "PageBreak"].includes(c.child.type));
      if (last === null || !content) report.push(`${path}: a page break with nothing before or after it is no page in Elements, and a blank page in the builder`);
      body.push(pageBreak(path));
      last = "break";
    } else if (child.type === "PageHeader" || child.type === "PageFooter") {
      sayLeftOut("row", child, path, ["style.gap", "style.alignItems", "style.padding", "style.backgroundColor", "style.border", ...TEXT_FOLDED]);
      (child.type === "PageHeader" ? headers : footers).push(...rows(childrenOf(child, path), at(path), {}, padding(child), path, child));
    } else {
      if (last === "page") breakBefore(path);
      last = "other";
      loose.push({ child, path });
    }
  }
  flushLoose();

  const style = resolvedRoot.style;
  const text = resolvedRoot.text;
  sayLeftOut("body", root, "root", [
    "props.width", "props.previewText", "props.dir", "props.size", "props.orientation",
    "style.backgroundColor", "style.color", "style.fontFamily", "style.fontWeight", "style.gap", "style.alignItems", ...TEXT_FOLDED,
  ]);
  const common = {
    contentWidth: cssPx(Number(resolvedRoot.width)) as never,
    textColor: text.color,
    fontFamily: builderFont(String(text.fontFamily)),
    ...(text.fontWeight !== 400 ? { fontWeight: text.fontWeight } : {}),
    ...(root.props?.dir ? { textDirection: root.props.dir as never } : {}),
  };
  // A Document's margin: the builder has one for every side (write.ts), the template's sides kept where they differ.
  const margin = root.type === "Document" ? { margin: cssSides((root.props?.margin as Sides | undefined) ?? { top: 48, right: 48, bottom: 48, left: 48 }) } : {};
  // No background is none (the builder's own default is a grey).
  const bodyHidden = { ...hiddenOf("body", root, ["props.margin"]), ...margin, backgroundColor: (style.backgroundColor as string | undefined) ?? "" };
  const raised =
    root.type === "Document"
      ? put(
          <Document {...common} documentSize={(root.props?.size as never) ?? "A4"} documentOrientation={(root.props?.orientation as never) ?? "portrait"}>
            {body}
          </Document>,
          bodyHidden
        )
      : put(React.createElement(root.type === "Email" ? Email : Page, { ...common, ...(root.type === "Email" && root.props?.previewText ? { previewText: String(root.props.previewText) } : {}) }, body), bodyHidden);
  if (root.type === "Document") return { element: raised, report, hidden, headers, footers };
  return { element: raised, report, hidden };
}

/** Text styles a container passes down, which its blocks take as their own in the builder. */
export const TEXT_FOLDED = ["color", "fontFamily", "fontSize", "fontWeight", "fontStyle", "lineHeight", "letterSpacing", "textAlign", "textTransform"].map((key) => `style.${key}`);

/** Elements' alignItems as the builder row's. */
const ALIGN_ITEMS: Record<string, string> = { start: "flex-start", center: "center", end: "flex-end", stretch: "stretch" };

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

/** A box's phone padding and border, as its column's phone values. */
function phoneBox(node: Node): Values {
  const phone = { ...(node.mobile?.padding ? { padding: cssSides(node.mobile.padding as Sides) } : {}), ...(node.mobile?.border ? { border: builderBorder(node.mobile.border as never) } : {}) };
  return Object.keys(phone).length ? { _override: { mobile: phone } } : {};
}

/** A Column's node without its padding (its column's, in the builder). */
function withoutPadding(node: Node): Node {
  const { padding: _padding, ...style } = node.style ?? {};
  return { ...node, style };
}

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
