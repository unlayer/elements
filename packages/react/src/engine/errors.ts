/**
 * What a render does when part of a template fails: a component that throws (or is async, or suspends, in a
 * synchronous render), a Row whose Columns don't fit its layout, an exporter that fails. By default the render
 * throws a RenderError naming the component and where it is; with `onError: "omit"` (or a function) that part is left
 * out of the HTML, the plain text and the design alike, and each part left out is a RenderError too, listed.
 */
import React from "react";
import { RenderError, type OnError } from "@unlayer-internal/shared-elements";

export { RenderError, type OnError };

/** Whether a policy leaves failed parts out. */
export const omits = (policy: OnError | undefined): boolean => policy === "omit" || typeof policy === "function";

/** A part left out under `policy`: said (or given to its function) once. */
export function reportOmitted(policy: OnError | undefined, error: RenderError): void {
  if (typeof policy === "function") policy(error);
  else {
    const said = `[Unlayer] Left out: ${error.message.replace(/^\[Unlayer\] /, "")}`;
    const cause = (error as { cause?: unknown }).cause;
    if (cause === undefined) console.error(said);
    else console.error(said, cause);
  }
}

// ── Where a component is ──

/** A component on the walk's path: its name, its label (`Row 3`, `Hero`, `Paragraph 2`), and the counts of what it renders. */
export interface Frame {
  name: string;
  label: string;
  parent: Frame | null;
  counts: Map<string, number> | null;
}

/** Where a walk starts: the root (`Email`), which positions don't name. */
export const rootFrame = (name: string): Frame => ({ name, label: name, parent: null, counts: null });

/**
 * A frame for a `name` its parent renders: Rows and Columns numbered (`Row 3`), others when there's more than one
 * (`Paragraph 2`). A component rendering one of its own name (a wrapper named like what it wraps) is the same place.
 */
export function childFrame(parent: Frame, name: string, numbered = name === "Row" || name === "Column"): Frame {
  if (parent.name === name && parent.parent) return parent;
  const counts = (parent.counts ??= new Map());
  const n = (counts.get(name) ?? 0) + 1;
  counts.set(name, n);
  return { name, label: numbered || n > 1 ? `${name} ${n}` : name, parent, counts: null };
}

/** A frame that isn't counted (markup's, for the position of what it rejects). */
export const placeFrame = (parent: Frame, name: string): Frame => ({ name, label: name, parent, counts: null });

export function positionOf(frame: Frame | null): string {
  const labels: string[] = [];
  for (let f = frame; f && f.parent; f = f.parent) labels.unshift(f.label);
  return labels.join(" › ");
}

// ── Names and messages ──

const MEMO = Symbol.for("react.memo");
const FORWARD_REF = Symbol.for("react.forward_ref");

export function nameOf(type: any): string {
  if (typeof type === "string") return type;
  if (!type) return "Unknown";
  if (type.$$typeof === MEMO) return type.displayName || nameOf(type.type);
  if (type.$$typeof === FORWARD_REF) return type.displayName || type.render?.displayName || type.render?.name || "ForwardRef";
  return type.displayName || type.name || "Anonymous";
}

/**
 * What React Server Components' React lacks (`useState`, `useContext`, …: Next.js route handlers and Server
 * Components render with it), said plainly where a template calls one (the runtime's "is not a function").
 */
export function serverReactHint(error: unknown): string | undefined {
  if (!(error instanceof TypeError)) return undefined;
  const hook = /\b(use[A-Z]\w*|createContext|Component|PureComponent)\)?\s+is not a (function|constructor)/.exec(error.message)?.[1];
  if (!hook || typeof (React as unknown as Record<string, unknown>)[hook] === "function") return undefined;
  return `it calls ${hook}, which React Server Components' React doesn't have (Next.js route handlers and Server Components render with it; it has use, useId, useMemo and useCallback): render this template from a Client Component or plain Node.js code, or keep ${hook} out of it`;
}

/** What a component threw, for the RenderError that names it: its message, or what React Server Components lack. */
export const threw = (error: unknown): string => (serverReactHint(error) ?? String((error as Error)?.message ?? error)).replace(/^\[Unlayer\] /, "");

export const ASYNC_IN_SYNC =
  'it is async or suspends, and this renderer is synchronous: render with "@unlayer/react-elements/async", or load its data first and pass it as props';
