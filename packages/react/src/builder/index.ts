/**
 * The builder adapter (RFC 0001, step 11): a template in the new components as the Unlayer builder's design JSON,
 * through today's components (`raise`), whose design JSON the builder has opened for years. Each item keeps the node
 * it was made from in its values, so what the builder has no editor for yet stays in the design (the builder keeps
 * it, and shows no editor for it).
 */
import type React from "react";
import { renderToJson } from "../index";
import { FIELDS } from "./fields";
import { PAYLOAD_KEY, written, type Payload } from "./payload";
import { raise } from "./raise";

type Values = Record<string, unknown>;
type Design = { body: { values: Values; rows: Array<{ values: Values; columns: Array<{ values: Values; contents: Array<{ type: string; values: Values }> }> }> } };

export { raise, type Raised } from "./raise";

export interface DesignResult {
  /** The builder's design JSON, for loadDesign(). */
  design: ReturnType<typeof renderToJson>;
  /** What the builder can't hold as it is (a block of HTML), and what it keeps with no editor yet: one line each. */
  report: string[];
}

/** A template in the new components (an `<Email>` or a `<Page>`) as the builder's design JSON. */
export function toDesign(element: React.ReactElement): DesignResult {
  const { element: raised, report, payloads } = raise(element);
  if (!raised) throw new Error(`[Elements] This template can't go to the builder:\n${report.join("\n")}`);
  const design = renderToJson(raised);
  keep(raised, design as unknown as Design, payloads);
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

/**
 * Each item's node kept in its values, with the values written (to tell the builder's changes on the way back); the
 * builder's own data a node carries back (`compat.builder`) written again, where no value of the template's is.
 */
function keep(raised: React.ReactElement, design: Design, payloads: WeakMap<object, Payload>) {
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
  put("body", design.body.values, raised);
  const rows = elements((raised.props as { children?: unknown }).children);
  count("rows", rows, design.body.rows);
  rows.forEach((rowElement, r) => {
    const row = design.body.rows[r];
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
}

