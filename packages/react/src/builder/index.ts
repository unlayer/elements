/**
 * The builder adapter (RFC 0001, step 11): a template in the new components as the Unlayer builder's design JSON, and
 * back. To the builder, it goes through today's components (`raise`), whose design JSON the builder has opened for
 * years; each item keeps the node it was made from in its values, so what the builder has no editor for yet stays in
 * the design (the builder keeps it, and shows no editor for it). Back from the builder, the template is those nodes
 * with the builder's changes applied; what was made in the builder comes from its values.
 */
import type { Node } from "@unlayer-internal/elements-core";
import React from "react";
import { Document as LegacyDocument, renderToJson } from "../index";
import { FIELDS } from "./fields";
import { lower, type Design } from "./lower";
import { PAYLOAD_KEY, written, type Payload } from "./payload";
import { printTemplate, toElement } from "./print";
import { raise } from "./raise";

export { raise, type Raised } from "./raise";

export interface DesignResult {
  /** The builder's design JSON, for loadDesign(). */
  design: ReturnType<typeof renderToJson>;
  /** What the builder can't hold as it is (a block of HTML), and what it keeps with no editor yet: one line each. */
  report: string[];
}

/** A template in the new components (an `<Email>`, a `<Page>` or a `<Document>`) as the builder's design JSON. */
export function toDesign(element: React.ReactElement): DesignResult {
  const { element: raised, report, payloads, headers, footers } = raise(element);
  if (!raised) throw new Error(`[Elements] This template can't go to the builder:\n${report.join("\n")}`);
  const design = renderToJson(raised);
  if (headers && footers) printed(design as unknown as Design & DesignExtras, payloads.get(raised)!.node!, headers, footers, report);
  keep(raised, design as unknown as Design & DesignExtras, payloads, headers ?? [], footers ?? []);
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

export interface TemplateResult {
  /** The template, to render. */
  element: React.ReactElement;
  /** The template as JSX source in the new components. */
  code: string;
  /** What the builder changed that the template can't hold, and what was left out: one line each. */
  report: string[];
}

export interface FromDesignOptions {
  /** Components of the template's own (made with component()), by name, for `element`. */
  components?: Record<string, React.ComponentType<any>>;
  /** The name of the component in `code`. */
  name?: string;
}

/** The builder's design JSON as a template in the new components: one made with toDesign() as it was, with the builder's changes. */
export function fromDesign(design: object, options: FromDesignOptions = {}): TemplateResult {
  const report: string[] = [];
  const root = lower(design as Design, report);
  return { element: toElement(root, options.components), code: printTemplate(root, options.name), report };
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
 * Each item's node kept in its values, with the values written (to tell the builder's changes on the way back); the
 * builder's own data a node carries back (`compat.builder`) written again, where no value of the template's is.
 */
function keep(raised: React.ReactElement, design: Design & DesignExtras, payloads: WeakMap<object, Payload>, headers: React.ReactElement[], footers: React.ReactElement[]) {
  const put = (kind: string, values: Record<string, unknown>, made: React.ReactElement) => {
    const payload = payloads.get(made);
    if (!payload) throw new Error("[Elements] toDesign: an item of the design has no template node");
    const builder = (payload.node?.compat?.builder ?? {}) as Record<string, unknown>;
    for (const [key, value] of Object.entries(builder)) if (!FIELDS[kind]?.[key]) values[key] = value;
    values[PAYLOAD_KEY] = { ...payload, w: written(values) };
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
