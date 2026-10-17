/**
 * A Row's or Column's own HTML (its props mapped, its exporter called): what fails there fails the render, or with
 * `onError: "omit"` leaves that Row or Column out, of the HTML, the plain text and the design alike, as a block that
 * fails is left out (model/elements.ts's markup finds which by the record the error carries).
 */
import { RenderError } from "@unlayer-internal/shared-elements";
import { whereIs } from "./collect";
import { isTailwindError } from "./tailwind";

const records = new WeakMap<RenderError, object>();

/** `render()`, a Row's or Column's (`record`, recorded where `place` says when it has none), failing as it. */
export function renderContainer<T>(name: "Row" | "Column", record: object | undefined, place: string, render: () => T): T {
  try {
    return render();
  } catch (error) {
    // What its Columns or blocks threw names them already.
    if (error instanceof RenderError || isTailwindError(error)) throw error;
    const failure = new RenderError(`${name} failed to render: ${String((error as Error)?.message ?? error)}`, name, whereIs(record as Parameters<typeof whereIs>[0]) ?? place, error);
    if (record) records.set(failure, record);
    throw failure;
  }
}

/** The record of the Row or Column whose own HTML failed with `error` (see renderContainer). */
export const containerOf = (error: unknown): object | undefined => (error instanceof RenderError ? records.get(error) : undefined);
