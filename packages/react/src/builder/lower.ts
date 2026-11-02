/**
 * The builder's design JSON as a template in the new components (RFC 0001, step 11, the way back). Each item that
 * came from a template carries its node (`values._elements`): the node comes back as it was, with the values changed
 * in the builder applied to it. An item made in the builder comes from its values alone.
 *
 * The builder's order is the template's: rows of one Section next to each other are that Section again (rows of it
 * moved apart are a Section each), rows of a Grid are its children in order, a one-column row of blocks is those blocks
 * in its Section or the root, and blocks of a box that was flattened into a column are that box again.
 */
import type { Child, Json, Node } from "@unlayer-internal/elements-core";
import { FIELDS, NEW_BLOCK } from "./fields";
import { BUILDER_OWN, PAYLOAD_KEY, type Group, type Payload } from "./payload";
import { sameText } from "./runs";

type Values = Record<string, any>;
type Content = { type: string; values: Values };
type Column = { contents: Content[]; values: Values };
type Row = { cells: number[]; columns: Column[]; values: Values };
export type Design = { body: { rows: Row[]; values: Values; headers?: Row[]; footers?: Row[] } };

/**
 * Builder data with no Elements meaning that a template keeps where the builder set it (a display condition). The
 * builder adds its own defaults to what it loads (a body's popup settings); those aren't kept.
 */
const BUILDER_DATA = new Set(["displayCondition", "anchor", "_languages"]);

const payloadOf = (values: Values | undefined): Payload | undefined => {
  const payload = values?.[PAYLOAD_KEY];
  return payload && typeof payload === "object" && payload.v >= 1 ? (payload as Payload) : undefined;
};
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value));

/** Whether the builder's value is the one written: text by its runs, an object by the keys written (the builder adds its own). */
function unchanged(key: string, was: unknown, now: unknown): boolean {
  if (key === "text") return sameText(was, now);
  if (was === null || typeof was !== "object") return was === now || (was === "" && now === undefined);
  if (now === null || typeof now !== "object") return false;
  if (Array.isArray(was)) return Array.isArray(now) && was.length === now.length && was.every((item, i) => unchanged("", item, now[i]));
  return Object.entries(was).every(([k, v]) => unchanged(k, v, (now as Values)[k]));
}

/** A value the builder sets on a block made in it that says something (not empty, not off). */
const meaningful = (value: unknown) => value !== undefined && value !== null && value !== "" && value !== false && !(typeof value === "object" && !Object.keys(value as object).length);

export function lower(design: Design, report: string[]): Node {
  const say = (where: string) => (message: string) => report.push(`${where}: ${message}`);

  /** The builder's changes to an item applied to its node; the builder's own data on it kept in `compat.builder`. */
  const apply = (kind: string, node: Node, values: Values, payload: Payload | undefined, where: string, only?: (key: string) => boolean) => {
    const fields = FIELDS[kind] ?? {};
    const w = payload?.w;
    for (const key of Object.keys({ ...w, ...values })) {
      if (BUILDER_OWN.has(key) || (only && !only(key))) continue;
      const now = values[key];
      const was = w?.[key];
      if (w && key in w ? unchanged(key, was, now) : !meaningful(now)) continue;
      const set = fields[key];
      if (set) set({ node, now, was: w ? was : undefined, say: say(where) });
      else if ((w && key in w) || BUILDER_DATA.has(key)) node.compat = { ...node.compat, builder: { ...(node.compat?.builder as Values), [key]: now as Json } };
    }
  };

  const body = design.body;
  const bodyPayload = payloadOf(body.values);
  const root: Node = bodyPayload?.node ? copy(bodyPayload.node) : { type: "Email" };
  apply("body", root, body.values, bodyPayload, "body");

  /** A column's blocks, the boxes flattened into it put back around theirs. */
  const blocks = (contents: Array<{ content: Content; wraps: Group[] }>, where: string): Child[] => {
    const out: Child[] = [];
    for (let i = 0; i < contents.length; ) {
      const outer = contents[i].wraps[0];
      if (outer) {
        let j = i;
        while (j < contents.length && contents[j].wraps[0]?.key === outer.key) j++;
        const inner = contents.slice(i, j).map(({ content, wraps }) => ({ content, wraps: wraps.slice(1) }));
        out.push({ ...copy(outer.node), children: blocks(inner, where) });
        i = j;
        continue;
      }
      const made = contents[i].content.type === "page_break" && payloadOf(contents[i].content.values)?.implied ? null : block(contents[i].content, `${where}.contents[${i}]`);
      if (made) out.push(made);
      i++;
    }
    return out;
  };
  const columnBlocks = (column: Column, where: string) => blocks(column.contents.map((content) => ({ content, wraps: payloadOf(content.values)?.wrap ?? [] })), where);

  const block = (content: Content, where: string): Node | null => {
    const payload = payloadOf(content.values);
    if (payload?.node) {
      const node = copy(payload.node);
      if (payload.locked) apply("html", node, content.values, payload, where, (key) => key !== "containerPadding");
      else apply(content.type, node, content.values, payload, where);
      return node;
    }
    const type = NEW_BLOCK[content.type];
    if (!type) {
      say(where)(`a ${content.type} block of the builder's has no component in Elements yet: left out`);
      return null;
    }
    const node: Node = { type };
    apply(content.type, node, content.values, undefined, where);
    return node;
  };

  /** A Row's children from its columns, and their widths where the builder's changed. */
  const rowChildren = (row: Row, rowPayload: Payload | undefined, where: string): Child[] => {
    const children = row.columns.map((column, c): Node => {
      const at = `${where}.columns[${c}]`;
      const payload = payloadOf(column.values);
      const inner = columnBlocks(column, at);
      if (payload?.direct && inner.length === 1 && typeof inner[0] !== "string") return inner[0];
      const node: Node = payload?.node ? copy(payload.node) : { type: "Column" };
      apply("column", node, column.values, payload, at);
      return { ...node, children: inner };
    });
    const written = rowPayload?.w?.cells as number[] | undefined;
    if (!written || JSON.stringify(written) !== JSON.stringify(row.cells)) {
      const total = row.cells.reduce((sum, cell) => sum + cell, 0);
      if (written) say(where)("its columns' widths changed in the builder: each takes its share of the row");
      if (written || row.cells.length > 1)
        children.forEach((child, c) => {
          child.style = { ...child.style, width: `${Math.round((row.cells[c] / total) * 10000) / 100}%` };
        });
    }
    return children;
  };

  /** A page break is the Document's: one in a column (beside other blocks in a row) is left out. */
  const noBreaks = (children: Child[], where: string) =>
    children.filter((child) => {
      if (typeof child === "string" || child.type !== "PageBreak") return true;
      say(where)("a page break in a column of a row: a page break is the document's, between its pages: left out");
      return false;
    });

  /** Rows as the template's children: each row in its Section (or page, header, footer), Grid or Row, or its blocks. */
  const place = (rows: Row[], prefix: string): Child[] => {
    const top: Child[] = [];
    let section: { key: string; node: Node; base: Node } | null = null;
    let grid: { key: string; node: Node } | null = null;
    const seen = new Set<string>();
    const split = new Set<string>();
    /** A page a page break ended, which goes on after it (made when something goes in it). */
    let reopen: { key: string; base: Node } | null = null;
    const open = (key: string, base: Node) => {
      section = { key, base, node: { ...copy(base), children: [] } };
      top.push(section.node);
    };
    const into = () => {
      if (!section && reopen) {
        open(reopen.key, reopen.base);
        reopen = null;
      }
      return section ? section.node.children! : top;
    };

    rows.forEach((row, r) => {
      const where = `${prefix}[${r}]`;
      const payload = payloadOf(row.values);
      // The Section it's a row of (a new one where its rows were moved apart).
      if (payload?.sec?.key !== section?.key) {
        grid = null;
        section = null;
        reopen = null;
        if (payload?.sec) {
          const type = payload.sec.node.type;
          if (seen.has(payload.sec.key) && !split.has(payload.sec.key)) say(where)(`rows of a ${type} were moved apart in the builder: each part is a ${type} of its own`);
          seen.add(payload.sec.key);
          open(payload.sec.key, payload.sec.node);
        }
      }
      // The row's band (its background, its hiding) is its Section's; a Row's own values are its own.
      const band = (key: string) => key === "backgroundColor" || key === "hideDesktop" || key === "_override";
      if (section) apply("row", section.node, row.values, payload, where, (key) => band(key) && key !== "backgroundColor");
      if (section) apply("section", section.node, row.values, payload, where, (key) => key === "backgroundColor");
      else if (payload && !unchanged("backgroundColor", payload.w?.backgroundColor, row.values.backgroundColor)) say(where)("its background changed in the builder: a background across the width is a Section's");

      if (payload?.grid) {
        if (grid?.key !== payload.grid.key) {
          grid = { key: payload.grid.key, node: { ...copy(payload.grid.node), children: [] } };
          into().push(grid.node);
        }
        for (const [c, column] of row.columns.entries()) grid.node.children!.push(...noBreaks(columnBlocks(column, `${where}.columns[${c}]`), where));
        return;
      }
      grid = null;
      if (payload?.run || (!payload && row.columns.length === 1 && row.columns[0].contents.some((content) => content.type === "page_break"))) {
        for (const [c, column] of row.columns.entries()) {
          for (const made of columnBlocks(column, `${where}.columns[${c}]`)) {
            if (typeof made !== "string" && made.type === "PageBreak") {
              // A page break ends the page it's in: what follows is a page of its own.
              if (section) {
                say(where)(`a page break inside a ${section.node.type}: it ends it there, and what follows is one of its own`);
                split.add(section.key);
                reopen = { key: section.key, base: section.base };
                section = null;
              }
              top.push(made);
            } else into().push(made);
          }
        }
        return;
      }
      const node: Node = payload?.node ? copy(payload.node) : { type: "Row" };
      apply("row", node, row.values, payload, where, (key) => !band(key) || (!section && key !== "backgroundColor"));
      if (!payload && meaningful(row.values.backgroundColor)) node.style = { ...node.style, backgroundColor: row.values.backgroundColor };
      into().push({ ...node, children: noBreaks(rowChildren(row, payload, where), where) });
    });
    return top;
  };

  const top = place(body.rows, "rows");
  if (root.type === "Document") {
    /** A header's or footer's rows as one PageHeader or PageFooter (rows made in the builder in it too). */
    const part = (children: Child[], type: string): Child[] => {
      if (!children.length) return [];
      const own = children.find((child): child is Node => typeof child !== "string" && child.type === type);
      return [{ ...(own ? { ...own } : { type }), children: children.flatMap((child) => (typeof child !== "string" && child.type === type ? (child.children ?? []) : [child])) }];
    };
    top.unshift(...part(place(body.headers ?? [], "headers"), "PageHeader"));
    top.push(...part(place(body.footers ?? [], "footers"), "PageFooter"));
  } else pageNumbersAsMergeTags(top);

  return uniqueIds({ ...root, children: top });
}

/** Outside a Document, the page number tokens are the merge tags they look like. */
function pageNumbersAsMergeTags(children: Child[]) {
  children.forEach((child, i) => {
    if (typeof child === "string") return;
    if (child.type === "PageNumber") children[i] = { type: "MergeTag", props: { name: child.props?.total ? "page_count" : "page_number" } };
    else if (child.children) pageNumbersAsMergeTags(child.children);
  });
}

/** Ids made unique: a block duplicated in the builder keeps its id once, the others get a number after it. */
function uniqueIds(root: Node): Node {
  const seen = new Map<string, number>();
  const visit = (node: Node): Node => {
    let id = node.id;
    if (id !== undefined) {
      const count = seen.get(id) ?? 0;
      seen.set(id, count + 1);
      if (count) id = `${id}-${count + 1}`;
    }
    return { ...node, ...(id !== undefined ? { id } : {}), ...(node.children ? { children: node.children.map((child) => (typeof child === "string" ? child : visit(child))) } : {}) };
  };
  return visit(root);
}
