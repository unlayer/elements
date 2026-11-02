/**
 * The builder's design JSON as a template in the new components (RFC 0001, step 11, the way back). Each item that
 * came from a template carries its node (`values._elements`): the node comes back as it was, with the values changed
 * in the builder applied to it. An item made in the builder comes from its values alone.
 *
 * The builder's order is the template's: rows of one Section next to each other are that Section again (rows of it
 * moved apart are a Section each), rows of a Grid are its children in order, a one-column row of blocks is those blocks
 * in its Section or the root, and blocks of a box that was flattened into a column are that box again. A row or column
 * the builder changed where the template has no node of its own (a row of blocks, a Grid's row) comes back as one that
 * holds the change; a row added in the builder between rows of one Section (or page) is in it.
 */
import type { Child, Json, Node } from "@unlayer-internal/elements-core";
import { FIELDS, NEW_BLOCK } from "./fields";
import { BUILDER_OWN, PAYLOAD_KEY, PAYLOAD_VERSION, type Group, type Payload } from "./payload";
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

/** A template's node in an item's values, in a format this version reads (its own, or an earlier one). */
const payloadOf = (values: Values | undefined): Payload | undefined => {
  const payload = values?.[PAYLOAD_KEY];
  return payload && typeof payload === "object" && payload.v >= 1 && payload.v <= PAYLOAD_VERSION ? (payload as Payload) : undefined;
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

/** A row holding only page breaks (where a Document's page ends). */
const breakRow = (row: Row) => row.columns.length === 1 && row.columns[0].contents.length > 0 && row.columns[0].contents.every((content) => content.type === "page_break");

/** A row's band (the background across the width) is a Section's in Elements. */
const BAND = "backgroundColor";
const notBand = (key: string) => key !== BAND;

export function lower(design: Design, report: string[]): Node {
  const say = (where: string) => (message: string) => report.push(`${where}: ${message}`);

  /** The keys of an item's values the builder changed (or, made in the builder, set) that the template holds. */
  const changes = (kind: string, values: Values, payload: Payload | undefined, only?: (key: string) => boolean): string[] => {
    const fields = FIELDS[kind] ?? {};
    const w = payload?.w;
    return Object.keys({ ...w, ...values }).filter((key) => {
      if (BUILDER_OWN.has(key) || (only && !only(key))) return false;
      if (w && key in w ? unchanged(key, w[key], values[key]) : !meaningful(values[key])) return false;
      return Boolean(fields[key]) || Boolean(w && key in w) || BUILDER_DATA.has(key);
    });
  };

  /** The builder's changes to an item applied to its node; the builder's own data on it kept in `compat.builder`. */
  const apply = (kind: string, node: Node, values: Values, payload: Payload | undefined, where: string, only?: (key: string) => boolean) => {
    const fields = FIELDS[kind] ?? {};
    const w = payload?.w;
    for (const key of changes(kind, values, payload, only)) {
      const set = fields[key];
      if (set) set({ node, now: values[key], was: w ? w[key] : undefined, say: say(where) });
      else {
        if (w && key in w && !BUILDER_DATA.has(key)) say(where)(`its ${key} changed in the builder: kept for the builder, which Elements doesn't draw`);
        // A value the builder removed is no longer the builder's data.
        const builder = { ...(node.compat?.builder as Values) };
        if (values[key] === undefined) delete builder[key];
        else builder[key] = values[key] as Json;
        const { builder: _builder, ...rest } = node.compat ?? {};
        node.compat = Object.keys(builder).length ? { ...rest, builder } : Object.keys(rest).length ? rest : undefined;
        if (!node.compat) delete node.compat;
      }
    }
  };

  const body = design.body;
  const bodyPayload = payloadOf(body.values);
  // Items a later version of Elements wrote (in a format this one doesn't read): made from the builder's values.
  const later: Array<{ where: string; v: number }> = [];
  const seen = (values: Values | undefined, where: string) => {
    const v = (values?.[PAYLOAD_KEY] as { v?: unknown } | undefined)?.v;
    if (typeof v === "number" && v > PAYLOAD_VERSION) later.push({ where, v });
  };
  seen(body.values, "body");
  for (const [part, rows] of [["rows", body.rows], ["headers", body.headers ?? []], ["footers", body.footers ?? []]] as const) {
    rows.forEach((row, r) => {
      seen(row.values, `body.${part}[${r}]`);
      row.columns.forEach((column, c) => {
        seen(column.values, `body.${part}[${r}].columns[${c}]`);
        column.contents.forEach((content, i) => seen(content.values, `body.${part}[${r}].columns[${c}].contents[${i}]`));
      });
    });
  }
  if (later.length) {
    const more = later.length > 1 ? ` and ${later.length - 1} more` : "";
    report.push(`${later[0].where}${more}: written by a later version of Elements (its format ${later[0].v}, this one reads ${PAYLOAD_VERSION}): made from the builder's values, as what's made in the builder is`);
  }
  // A design made in the builder is an Email, or a Document where it has a document's parts (a header, a page break).
  const printed = Boolean(body.headers?.length || body.footers?.length) || body.rows.some((row) => row.columns.some((column) => column.contents.some((content) => content.type === "page_break")));
  const root: Node = bodyPayload?.node ? copy(bodyPayload.node) : { type: printed ? "Document" : "Email" };
  apply("body", root, body.values, bodyPayload, "body");
  const isDocument = root.type === "Document";

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

  /** An image with the builder's link: a Link around it (the template's own, or one the builder set). */
  const linkedImage = (node: Node, values: Values, payload: Payload | undefined, where: string): Node => {
    const image = node.type === "Link" ? (node.children ?? []).find((child): child is Node => typeof child !== "string" && child.type === "Image")! : node;
    apply("image", image, values, payload, where, (key) => key !== "action");
    const href = String(values.action?.values?.href ?? "");
    if (payload && href === String(payload.w?.action?.values?.href ?? "")) return node;
    if (node.type === "Link") {
      if (!href) return image;
      node.props = { ...node.props, href };
      return node;
    }
    return href ? { type: "Link", props: { href }, children: [image] } : image;
  };

  const block = (content: Content, where: string): Node | null => {
    const payload = payloadOf(content.values);
    if (payload?.node) {
      const node = copy(payload.node);
      if (payload.locked) apply("html", node, content.values, payload, where, (key) => key !== "containerPadding");
      else if (content.type === "image") return linkedImage(node, content.values, payload, where);
      else apply(content.type, node, content.values, payload, where);
      return node;
    }
    const type = NEW_BLOCK[content.type];
    if (!type) {
      say(where)(`a ${content.type} block of the builder's has no component in Elements yet: left out`);
      return null;
    }
    if (content.type === "page_break" && !isDocument) {
      say(where)("a page break is a Document's: left out");
      return null;
    }
    if (content.type === "image") return linkedImage({ type }, content.values, undefined, where);
    const node: Node = { type };
    apply(content.type, node, content.values, undefined, where);
    if (type === "Video" && !node.props?.src) {
      say(where)("a video with no URL in the builder: left out");
      return null;
    }
    return node;
  };

  /** A page break is the Document's: one in a column (beside other blocks in a row) is left out. */
  const noBreaks = (children: Child[], where: string) =>
    children.filter((child) => {
      if (typeof child === "string" || child.type !== "PageBreak") return true;
      say(where)("a page break in a column of a row: a page break is the document's, between its pages: left out");
      return false;
    });

  /** A Row's children from its columns (a column the builder changed holding its change), and their widths where the builder's changed. */
  const rowChildren = (row: Row, rowPayload: Payload | undefined, where: string): Child[] => {
    const children = row.columns.map((column, c): Node => {
      const at = `${where}.columns[${c}]`;
      const payload = payloadOf(column.values);
      const inner = noBreaks(columnBlocks(column, at), at);
      if (payload?.direct && inner.length === 1 && typeof inner[0] !== "string" && !changes("column", column.values, payload).length) return inner[0];
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
    // Its children the builder has no column for, back in their places.
    for (const { index, node } of rowPayload?.kept ?? []) children.splice(Math.min(index, children.length), 0, copy(node));
    return children;
  };

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
    const payloads = rows.map((row) => payloadOf(row.values));
    /** The Section (or page) a row is in: its own, or for a row made in the builder, the one around it. */
    const groupOf = (r: number): Group | undefined => {
      if (payloads[r]) return payloads[r]!.sec;
      let p = r - 1;
      while (p >= 0 && !payloads[p]) p--;
      let n = r + 1;
      while (n < rows.length && !payloads[n]) n++;
      const before = p >= 0 ? payloads[p]?.sec : undefined;
      const after = n < rows.length ? payloads[n]?.sec : undefined;
      if (before && after?.key === before.key) return before;
      // On a page in the builder from the page break that starts it to the one that ends it.
      if (before?.node.type === "DocumentPage" && (n >= rows.length || breakRow(rows[n]))) return before;
      if (after?.node.type === "DocumentPage" && (p < 0 || breakRow(rows[p]))) return after;
      return undefined;
    };

    rows.forEach((row, r) => {
      const where = `${prefix}[${r}]`;
      const payload = payloads[r];
      const group = groupOf(r);
      const w = payload?.w;
      // The row's band changed in the builder (or a row made there has one): a Section's background in Elements. A
      // band cleared there is no background.
      const bandChanged = w && BAND in w ? !unchanged(BAND, w[BAND], row.values[BAND]) : !payload && meaningful(row.values[BAND]);
      const band = meaningful(row.values[BAND]) ? (row.values[BAND] as string) : undefined;
      const ownSection = bandChanged && group?.node.type === "Section";

      // The Section it's a row of (a new one where its rows were moved apart, or its band is its own now).
      if (ownSection || group?.key !== section?.key) {
        grid = null;
        section = null;
        reopen = null;
        if (group) {
          const type = group.node.type;
          if (ownSection) {
            say(where)("its background changed in the builder: a band across the width is a Section's in Elements, so this row is a Section of its own");
            split.add(group.key);
          } else if (seen.has(group.key) && !split.has(group.key)) say(where)(`rows of a ${type} were moved apart in the builder: each part is a ${type} of its own`);
          seen.add(group.key);
          open(group.key, group.node);
          if (ownSection) {
            const { backgroundColor: _cleared, ...rest } = section!.node.style ?? {};
            section!.node.style = band ? { ...rest, backgroundColor: band } : rest;
            if (!Object.keys(section!.node.style).length) delete section!.node.style;
            section!.key = `${group.key}#${r}`;
          }
        }
      }
      /** Where the row's content goes: its Section, or a new one holding the band the builder gave it. */
      const target = (): Child[] => {
        if (!bandChanged || ownSection || !band) return into();
        // A Section's band, or in a header or footer (which hold no Section) a Column's background.
        const holder: Node = { type: group && group.node.type !== "Section" && group.node.type !== "DocumentPage" ? "Column" : "Section", style: { backgroundColor: band }, children: [] };
        into().push(holder);
        return holder.children!;
      };

      if (payload?.grid) {
        // A Grid's row the builder changed is a Row of its own; the rest of the Grid goes on as it was.
        const changed = changes("row", row.values, payload, notBand).length > 0 || row.columns.some((column) => changes("column", column.values, payloadOf(column.values)).length > 0) || JSON.stringify(w?.cells) !== JSON.stringify(row.cells);
        if (!changed && !bandChanged) {
          if (grid?.key !== payload.grid.key) {
            grid = { key: payload.grid.key, node: { ...copy(payload.grid.node), children: [] } };
            into().push(grid.node);
          }
          for (const [c, column] of row.columns.entries()) grid.node.children!.push(...noBreaks(columnBlocks(column, `${where}.columns[${c}]`), where));
          return;
        }
        say(where)("a row of a Grid changed in the builder: it's a Row of its own");
        grid = null;
        const node: Node = { type: "Row" };
        apply("row", node, row.values, payload, where, notBand);
        target().push({ ...node, children: rowChildren(row, payload, where) });
        return;
      }
      grid = null;

      if (payload?.run || (!payload && row.columns.length === 1 && row.columns[0].contents.some((content) => content.type === "page_break"))) {
        const column = row.columns[0];
        const columnPayload = payloadOf(column?.values);
        const rowChanged = payload ? changes("row", row.values, payload, notBand) : [];
        const columnChanged = payload && column ? changes("column", column.values, columnPayload) : [];
        const made = row.columns.flatMap((c, i) => columnBlocks(c, `${where}.columns[${i}]`));
        // Blocks whose row or column the builder changed: a Row and Column of their own holding the change (between
        // the page breaks in it, which are the Document's).
        const wrap = rowChanged.length > 0 || columnChanged.length > 0;
        let holder: Child[] | null = null;
        let run: Child[] = [];
        const flush = () => {
          if (!run.length) return;
          holder ??= target();
          if (wrap) {
            const rowNode: Node = { type: "Row" };
            apply("row", rowNode, row.values, payload, where, notBand);
            const columnNode: Node = { type: "Column" };
            if (column) apply("column", columnNode, column.values, columnPayload, `${where}.columns[0]`);
            holder.push({ ...rowNode, children: [{ ...columnNode, children: run }] });
          } else holder.push(...run);
          run = [];
        };
        for (const child of made) {
          if (typeof child !== "string" && child.type === "PageBreak") {
            flush();
            // A page break ends the page it's in: what follows is a page of its own.
            if (section) {
              say(where)(`a page break inside a ${section.node.type}: it ends it there, and what follows is one of its own`);
              split.add(section.key);
              reopen = { key: section.key, base: section.base };
              section = null;
            }
            top.push(child);
            holder = null;
          } else run.push(child);
        }
        flush();
        return;
      }

      const node: Node = payload?.node ? copy(payload.node) : { type: "Row" };
      apply("row", node, row.values, payload, where, notBand);
      target().push({ ...node, children: rowChildren(row, payload, where) });
    });
    return top;
  };

  const top = place(body.rows, "rows");
  if (isDocument) {
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

/** Ids made unique: a block duplicated in the builder keeps its id once, the others get the first free number after it. */
function uniqueIds(root: Node): Node {
  const taken = new Set<string>();
  const collect = (node: Node) => {
    if (node.id !== undefined) taken.add(node.id);
    for (const child of node.children ?? []) if (typeof child !== "string") collect(child);
  };
  collect(root);
  const seen = new Set<string>();
  const visit = (node: Node): Node => {
    let id = node.id;
    if (id !== undefined) {
      if (seen.has(id)) {
        let n = 2;
        while (taken.has(`${id}-${n}`)) n++;
        id = `${id}-${n}`;
        taken.add(id);
      }
      seen.add(id);
    }
    return { ...node, ...(id !== undefined ? { id } : {}), ...(node.children ? { children: node.children.map((child) => (typeof child === "string" ? child : visit(child))) } : {}) };
  };
  return visit(root);
}
