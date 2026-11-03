/**
 * The writing half of toDesign(): a template raised to today's components (raise.tsx), written as the builder's
 * design JSON with today's renderToJson, each item's exact values and hidden properties merged into what it wrote.
 */
import React from "react";
import { Document as LegacyDocument, renderToJson } from "../index";
import { merge } from "./hide";
import { raise } from "./raise";
import type { Values } from "./values";

type Content = { type: string; values: Values };
type Column = { contents: Content[]; values: Values };
type Row = { cells: number[]; columns: Column[]; values: Values };
export type Design = { counters?: Record<string, number>; schemaVersion?: number; body: { rows: Row[]; values: Values; headers?: Row[]; footers?: Row[] } };

export interface DesignResult {
  /** The builder's design JSON, for loadDesign(). */
  design: Design;
  /** What the builder can't hold as it is (a block of HTML, a style left out): one line each. */
  report: string[];
}

/** The schema version whose document margin is the one written (an older one's "96px" the builder reads as its preset). */
const DOCUMENT_SCHEMA = 28;

export function writeDesign(element: React.ReactElement): DesignResult {
  const { element: raised, report, hidden, headers, footers } = raise(element);
  if (!raised) throw new Error(`[Elements] This template can't go to the builder:\n${report.join("\n")}`);
  const design = renderToJson(raised) as unknown as Design;
  if (headers && footers) printed(design, headers, footers);
  const apply = (values: Values, made: React.ReactElement) => {
    const extra = hidden.get(made);
    if (!extra) return values;
    const merged = merge(values, extra);
    for (const key of Object.keys(values)) delete values[key];
    return Object.assign(values, merged);
  };
  const rows = (made: React.ReactElement[], json: Row[]) => {
    if (made.length !== json.length) throw new Error(`[Elements] toDesign: ${made.length} rows made, ${json.length} written`);
    made.forEach((rowElement, r) => {
      const row = json[r];
      apply(row.values, rowElement);
      const columns = elements((rowElement.props as { children?: unknown }).children);
      columns.forEach((columnElement, c) => {
        const column = row.columns[c];
        apply(column.values, columnElement);
        elements((columnElement.props as { children?: unknown }).children).forEach((content, i) => apply(column.contents[i].values, content));
      });
    });
  };
  apply(design.body.values, raised);
  rows(elements((raised.props as { children?: unknown }).children), design.body.rows);
  rows(headers ?? [], design.body.headers ?? []);
  rows(footers ?? [], design.body.footers ?? []);
  if (headers) margins(design);
  return { design, report };
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

/** A Document's header and footer as the builder's `headers` and `footers`: rows written as the body's are, numbered after them. */
function printed(design: Design, headers: React.ReactElement[], footers: React.ReactElement[]) {
  design.schemaVersion = Math.max(design.schemaVersion ?? 0, DOCUMENT_SCHEMA);
  const counters = (design.counters ??= {});
  const next = (key: string) => (counters[key] = (counters[key] ?? 0) + 1);
  const rowsOf = (made: React.ReactElement[], kind: "u_header" | "u_footer") => {
    if (!made.length) return [];
    const rows = (renderToJson(React.createElement(LegacyDocument, null, made)) as unknown as Design).body.rows;
    for (const row of rows) {
      row.values._meta = { htmlID: `${kind}_${next(kind)}`, htmlClassNames: kind };
      for (const column of row.columns) {
        column.values._meta = { ...(column.values._meta as object), htmlID: `u_column_${next("u_column")}` };
        for (const content of column.contents) {
          const meta = content.values._meta as { htmlID?: string; htmlClassNames?: string } | undefined;
          // An id the template gave it is kept; the builder's own are numbered on.
          if (meta?.htmlID && !/^u_content_[a-z_]+_\d+$/.test(meta.htmlID)) continue;
          const base = String(meta?.htmlID ?? `u_content_${content.type}`).replace(/_\d+$/, "");
          content.values._meta = { ...meta, htmlID: `${base}_${next(base)}` };
        }
      }
    }
    return rows;
  };
  design.body.headers = rowsOf(headers, "u_header");
  design.body.footers = rowsOf(footers, "u_footer");
}

/** A Document's margin: the builder has one for every side, the widest; the template's sides where they differ are hidden. */
function margins(design: Design) {
  const values = design.body.values;
  const sides = values.margin;
  if (typeof sides !== "string") return;
  const widths = sides.split(/\s+/).map((part) => parseFloat(part) || 0);
  values.documentMargin = `${Math.max(...widths)}px`;
  if (new Set(widths).size === 1) delete values.margin;
}
