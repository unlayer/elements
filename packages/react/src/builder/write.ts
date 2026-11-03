/**
 * The writing half of toDesign(): a template raised to today's components (raise.tsx), written as the builder's design
 * JSON, each item with what it keeps of its node (`values._elements`, minimal.ts by default).
 */
import type { Node, ResolvedNode } from "@unlayer-internal/elements-core";
import React from "react";
import { Document as LegacyDocument, renderToJson } from "../index";
import { FIELDS } from "./fields";
import type { Design, Values } from "./lower";
import { minimal } from "./minimal";
import { PAYLOAD_KEY, type Payload } from "./payload";
import { raise } from "./raise";

export interface DesignResult {
  /** The builder's design JSON, for loadDesign(). */
  design: ReturnType<typeof renderToJson>;
  /** What the builder can't hold as it is (a block of HTML), and what it keeps with no editor yet: one line each. */
  report: string[];
}

/** What an item keeps of its node, from its values and all it was made from: none for one that says nothing of its own. */
export type Keep = (kind: string, values: Values, full: Payload, resolved: ResolvedNode | undefined) => Payload | undefined;

/** A template as the builder's design JSON, each item keeping what `keepOf` says (the least that reads back, by default). */
export function writeDesign(element: React.ReactElement, keepOf: Keep = minimal): DesignResult {
  const { element: raised, report, payloads, resolvedOf, headers, footers } = raise(element);
  if (!raised) throw new Error(`[Elements] This template can't go to the builder:\n${report.join("\n")}`);
  const design = renderToJson(raised);
  if (headers && footers) printed(design as unknown as Design & DesignExtras, payloads.get(raised)!.node!, headers, footers, report);
  keep(raised, design as unknown as Design & DesignExtras, payloads, resolvedOf, headers ?? [], footers ?? [], keepOf);
  return { design, report };
}

type DesignExtras = { counters: Record<string, number>; schemaVersion: number; body: { headers?: Design["body"]["rows"]; footers?: Design["body"]["rows"] } };

/** The schema version whose document margin is the one written (an older one's "96px" the builder reads as its preset). */
const DOCUMENT_SCHEMA = 28;

/**
 * A Document's page settings, and its header and footer as the builder's `headers` and `footers` (rows written as
 * the body's are, numbered after them as the builder numbers its own).
 */
function printed(design: Design & DesignExtras, root: Node, headers: React.ReactElement[], footers: React.ReactElement[], report: string[]) {
  const margin = (root.props?.margin as { top: number; right: number; bottom: number; left: number } | undefined) ?? { top: 48, right: 48, bottom: 48, left: 48 };
  const sides = [margin.top, margin.right, margin.bottom, margin.left];
  // The builder's margin is one for every side: the widest, and the template's kept where they differ.
  design.body.values.documentMargin = `${Math.max(...sides)}px`;
  if (new Set(sides).size > 1) report.push("root: the builder has one margin for every side: it shows the widest, and the template's are kept in the design");
  design.schemaVersion = Math.max(design.schemaVersion, DOCUMENT_SCHEMA);
  const next = (key: string) => (design.counters[key] = (design.counters[key] ?? 0) + 1);
  const rowsOf = (elements: React.ReactElement[], kind: "u_header" | "u_footer") => {
    if (!elements.length) return [];
    const rows = (renderToJson(React.createElement(LegacyDocument, null, elements)) as unknown as Design).body.rows;
    for (const row of rows) {
      row.values._meta = { htmlID: `${kind}_${next(kind)}`, htmlClassNames: kind };
      for (const column of row.columns) {
        column.values._meta = { ...(column.values._meta as object), htmlID: `u_column_${next("u_column")}` };
        for (const content of column.contents) {
          const base = String((content.values._meta as { htmlID?: string } | undefined)?.htmlID ?? `u_content_${content.type}`).replace(/_\d+$/, "");
          content.values._meta = { ...(content.values._meta as object), htmlID: `${base}_${next(base)}` };
        }
      }
    }
    return rows;
  };
  design.body.headers = rowsOf(headers, "u_header");
  design.body.footers = rowsOf(footers, "u_footer");
}

/** The elements raise() made, in the order renderToJson() writes them (arrays flattened, as React does). */
function elements(children: unknown): React.ReactElement[] {
  const out: React.ReactElement[] = [];
  const visit = (child: unknown) => {
    if (Array.isArray(child)) child.forEach(visit);
    else if (child && typeof child === "object" && "props" in child) out.push(child as React.ReactElement);
  };
  visit(children);
  return out;
}

/**
 * Each item's node kept in its values: only what the builder can't hold (minimal()); the builder's own data a node
 * carries back (`compat.builder`) written again, where no value of the template's is.
 */
function keep(raised: React.ReactElement, design: Design & DesignExtras, payloads: WeakMap<object, Payload>, resolvedOf: WeakMap<object, ResolvedNode>, headers: React.ReactElement[], footers: React.ReactElement[], keepOf: Keep) {
  const put = (kind: string, values: Record<string, unknown>, made: React.ReactElement) => {
    const payload = payloads.get(made);
    if (!payload) throw new Error("[Elements] toDesign: an item of the design has no template node");
    const builder = (payload.node?.compat?.builder ?? {}) as Record<string, unknown>;
    for (const [key, value] of Object.entries(builder)) if (!FIELDS[kind]?.[key]) values[key] = value;
    const kept = keepOf(kind, values, payload, resolvedOf.get(made));
    if (!kept) return;
    // A Section's, a Grid's or a box's rows and blocks know it by a short key of the design's own.
    if (kept.sec) kept.sec = { ...kept.sec, key: short(kept.sec.key) };
    if (kept.grid) kept.grid = { ...kept.grid, key: short(kept.grid.key) };
    if (kept.wrap) kept.wrap = kept.wrap.map((group) => ({ ...group, key: short(group.key) }));
    values[PAYLOAD_KEY] = kept;
  };
  const keys = new Map<string, string>();
  const short = (key: string) => {
    if (!keys.has(key)) keys.set(key, (keys.size + 1).toString(36));
    return keys.get(key)!;
  };
  const count = (what: string, made: unknown[], json: unknown[]) => {
    if (made.length !== json.length) throw new Error(`[Elements] toDesign: ${made.length} ${what} made, ${json.length} written`);
  };
  const rows = (made: React.ReactElement[], json: Design["body"]["rows"]) => {
    count("rows", made, json);
    made.forEach((rowElement, r) => {
      const row = json[r];
      put("row", row.values, rowElement);
      const columns = elements((rowElement.props as { children?: unknown }).children);
      count("columns", columns, row.columns);
      columns.forEach((columnElement, c) => {
        const column = row.columns[c];
        put("column", column.values, columnElement);
        const contents = elements((columnElement.props as { children?: unknown }).children);
        count("blocks", contents, column.contents);
        contents.forEach((contentElement, i) => put(column.contents[i].type, column.contents[i].values, contentElement));
      });
    });
  };
  put("body", design.body.values, raised);
  rows(elements((raised.props as { children?: unknown }).children), design.body.rows);
  rows(headers, design.body.headers ?? []);
  rows(footers, design.body.footers ?? []);
}
