/**
 * The builder's design JSON as a template in the new components (RFC 0001, step 11, the way back). Each item that
 * came from a template carries what of its node the builder can't hold (`values._elements`): the node is that, with
 * the builder's values read into it (less the part of each that's its place). An item made in the builder comes from
 * its values alone.
 *
 * The builder's order is the template's: rows of one Section next to each other are that Section again (rows of it
 * moved apart are a Section each), rows of a Grid are its children in order, a one-column row of blocks is those blocks
 * in its Section or the root, and blocks of a box that was flattened into a column are that box again. A row or column
 * the builder changed where the template has no node of its own (a row of blocks, a Grid's row) comes back as one that
 * holds the change; a row added in the builder between rows of one Section (or page) is in it.
 */
import { linkParts, type Child, type Json, type LinkValue, type Node } from "@unlayer-internal/elements-core";
import { FIELDS, NEW_BLOCK } from "./fields";
import { setPaths } from "./paths";
import { baseline, BUILDER_OWN, fingerprint, PARTED, PAYLOAD_KEY, PAYLOAD_VERSION, type Group, type Payload } from "./payload";
import { sameText } from "./runs";
import { dropTaken, mark } from "./taken";

export type Values = Record<string, any>;
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
export function unchanged(key: string, was: unknown, now: unknown): boolean {
  if (key === "text") return sameText(was, now);
  // A padding by its sides ("0px" is "0px 0px 0px 0px").
  if ((key === "padding" || key === "containerPadding") && typeof was === "string" && typeof now === "string") return sameSides(was, now);
  if (was === null || typeof was !== "object") return was === now || (was === "" && now === undefined);
  if (now === null || typeof now !== "object") return false;
  if (Array.isArray(was)) return Array.isArray(now) && was.length === now.length && was.every((item, i) => unchanged("", item, now[i]));
  // Written empty (a border the template has none of): anything the builder put in it is a change, but a border
  // every side of which is 0 wide (the builder's own default), which draws nothing.
  if (!Object.keys(was).length) return !meaningful(now) || noBorder(now);
  return Object.entries(was).every(([k, v]) => unchanged(k, v, (now as Values)[k]));
}

const sameSides = (a: string, b: string) => {
  const sides = (css: string) => {
    const [top = 0, right = top, bottom = top, left = right] = css.trim().split(/\s+/).map((part) => parseFloat(part) || 0);
    return [top, right, bottom, left].join(" ");
  };
  return sides(a) === sides(b);
};

/** A border the builder writes with every side 0 wide: none. */
const noBorder = (value: unknown) => {
  const widths = value && typeof value === "object" ? Object.entries(value).filter(([key]) => key.endsWith("Width")) : [];
  return widths.length > 0 && widths.every(([, width]) => !parseFloat(String(width)));
};

/** A value the builder sets on a block made in it that says something (not empty, not off). */
const meaningful = (value: unknown) => value !== undefined && value !== null && value !== "" && value !== false && !(typeof value === "object" && !Object.keys(value as object).length);

/** A row holding only page breaks (where a Document's page ends). */
const breakRow = (row: Row) => row.columns.length === 1 && row.columns[0].contents.length > 0 && row.columns[0].contents.every((content) => content.type === "page_break");

/** A row's band (the background across the width) is a Section's in Elements. */
const BAND = "backgroundColor";
const notBand = (key: string) => key !== BAND;

/** Says what of an item's values the template can't hold, with the value's key. */
export type Say = (message: string, key: string) => void;

/**
 * The keys of an item's values to read into its node: for a template's item, each the node holds (the builder's is
 * the node's) and each that isn't what it was written as (its default, its place, as kept); for one made in the
 * builder, each it set.
 */
export function changesOf(kind: string, values: Values, payload: Payload | undefined, only?: (key: string) => boolean): string[] {
  const fields = FIELDS[kind] ?? {};
  const w = baseline(kind, payload);
  return Object.keys({ ...w, ...values }).filter((key) => {
    if (BUILDER_OWN.has(key) || (only && !only(key))) return false;
    // A long value only told apart from the one written (a block's own markup).
    if (payload?.h && key in payload.h) return fingerprint(values[key]) !== payload.h[key] && Boolean(fields[key]);
    // A value with parts of the node's and the builder's: its setter tells them apart.
    if (payload && PARTED.has(`${kind}.${key}`) && meaningful(values[key])) return Boolean(fields[key]);
    if (w && key in w ? unchanged(key, w[key], values[key]) : !meaningful(values[key])) return false;
    return Boolean(fields[key]) || Boolean(w && key in w) || BUILDER_DATA.has(key);
  });
}

/** An item's values read into its node; the builder's own data on it kept in `compat.builder`. */
export function applyTo(kind: string, node: Node, values: Values, payload: Payload | undefined, say: Say, only?: (key: string) => boolean) {
  const fields = FIELDS[kind] ?? {};
  const w = baseline(kind, payload);
  for (const key of changesOf(kind, values, payload, only)) {
    const set = fields[key];
    // Phone values told apart by a fingerprint: hidden on phones as the node is, the rest said where they change.
    const was = key === "_override" && payload?.h?._override !== undefined ? { mobile: { hideMobile: node.hidden?.mobile } } : w ? w[key] : undefined;
    if (set) set({ node, now: values[key], was, say: (message) => say(message, key) });
    else {
      if (w && key in w && !BUILDER_DATA.has(key)) say(`its ${key} changed in the builder: kept for the builder, which Elements doesn't draw`, key);
      // A value the builder removed is no longer the builder's data.
      const builder = { ...(node.compat?.builder as Values) };
      if (values[key] === undefined) delete builder[key];
      else builder[key] = values[key] as Json;
      const { builder: _builder, ...rest } = node.compat ?? {};
      node.compat = Object.keys(builder).length ? { ...rest, builder } : Object.keys(rest).length ? rest : undefined;
      if (!node.compat) delete node.compat;
    }
  }
}

/** The href an image was written with: its Link's, or none. */
const writtenHref = (node: Node, payload: Payload | undefined): string => {
  if (payload?.w?.action) return String((payload.w.action as Values).values?.href ?? "");
  if (node.type === "Link") return String(linkParts(node.props?.href as LinkValue).href ?? "");
  const action = baseline("image", payload)?.action as Values | undefined;
  return String(action?.values?.href ?? "");
};

/**
 * A template's item read back: its kept node with the builder's values read into it (an image with the builder's
 * link, a block of its own markup with nothing but its visibility).
 */
export function readItem(kind: string, kept: Node, values: Values, payload: Payload | undefined, say: Say): Node {
  const node = copy(kept);
  if (kind === "image") {
    const image = node.type === "Link" ? (node.children ?? []).find((child): child is Node => typeof child !== "string" && child.type === "Image")! : node;
    const before = copy(image);
    applyTo("image", image, values, payload, say, (key) => key !== "action");
    if (payload) mark(image, setPaths(before, image), payload);
    const href = String(values.action?.values?.href ?? "");
    if (payload && href === writtenHref(node, payload)) return node;
    if (node.type === "Link") {
      if (!href) return image;
      node.props = { ...node.props, href };
      return node;
    }
    return href ? { type: "Link", props: { href }, children: [image] } : image;
  }
  if (payload?.locked) applyTo("html", node, values, payload, say, (key) => key !== "containerPadding");
  else applyTo(kind, node, values, payload, say, kind === "row" ? notBand : undefined);
  if (payload) mark(node, setPaths(kept, node), payload);
  return node;
}

export function lower(design: Design, report: string[]): Node {
  const say = (where: string) => (message: string) => report.push(`${where}: ${message}`);
  const changes = (kind: string, values: Values, payload: Payload | undefined, only?: (key: string) => boolean) => changesOf(kind, values, payload, only);
  const apply = (kind: string, node: Node, values: Values, payload: Payload | undefined, where: string, only?: (key: string) => boolean) => applyTo(kind, node, values, payload, say(where), only);

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
  const root: Node = bodyPayload?.node ? readItem("body", bodyPayload.node, body.values, bodyPayload, say("body")) : { type: printed ? "Document" : "Email" };
  if (!bodyPayload?.node) apply("body", root, body.values, bodyPayload, "body");
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

  const block = (content: Content, where: string): Node | null => {
    const payload = payloadOf(content.values);
    const type = NEW_BLOCK[content.type];
    // A template's block: what it kept, or the component its tool is where the builder holds all of it.
    if (payload && (payload.node || type)) return readItem(content.type, payload.node ?? { type }, content.values, payload, say(where));
    if (!type) {
      say(where)(`a ${content.type} block of the builder's has no component in Elements yet: left out`);
      return null;
    }
    if (content.type === "page_break" && !isDocument) {
      say(where)("a page break is a Document's: left out");
      return null;
    }
    if (content.type === "image") return readItem("image", { type }, content.values, undefined, say(where));
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
      // A Row's column: its kept node, or a Column where the builder holds all of it.
      const node: Node = payload ? readItem("column", payload.node ?? { type: "Column" }, column.values, payload, say(at)) : { type: "Column" };
      if (!payload) apply("column", node, column.values, payload, at);
      return { ...node, children: inner };
    });
    const written = baseline("row", rowPayload)?.cells as number[] | undefined;
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
      const w = baseline("row", payload);
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

      // A row of blocks (no Row or Grid of its own), or one the builder made holding a page break.
      if (payload?.run || (payload && !payload.node && !payload.grid) || (!payload && row.columns.length === 1 && row.columns[0].contents.some((content) => content.type === "page_break"))) {
        const column = row.columns[0];
        // A run's column says nothing of its own: it's the run's.
        const columnPayload = payloadOf(column?.values) ?? (payload && column ? ({ v: payload.v } as Payload) : undefined);
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

      const node: Node = payload?.node ? readItem("row", payload.node, row.values, payload, say(where)) : { type: "Row" };
      if (!payload?.node) apply("row", node, row.values, payload, where, notBand);
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

  return dropTaken(uniqueIds({ ...root, children: top }));
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
