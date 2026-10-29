/**
 * Before the first render, a check that the installed React has the shapes the walker relies on (react-compat.ts):
 * its dispatcher slot where the table says, the dispatcher installed there and the previous one put back, useId in
 * its format, context and `use()` as the walker reads them. A version the table doesn't know renders if it passes
 * (with a warning in development); one that fails throws a named error, unless UNLAYER_SKIP_REACT_CHECK=1.
 */
import React from "react";
import { callWithHooks, DISPATCHER, hookState, theSlot } from "./dispatcher";
import { ID_PATTERN, KNOWN_REACT, reactRow, type ReactRow, type Slot } from "./react-compat";
import { ROOT_TREE } from "./tree-id";

const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};

/** What's wrong with this React (`R`, whose dispatcher slot is `slot`) for the walker, or undefined. */
export function probe(row: ReactRow, R: any = React, slot: Slot | null = theSlot()): string | undefined {
  if (!slot) return `its hooks dispatcher isn't at ${row.slots.join(" or ")}`;
  const before = slot.get();
  const context = typeof R.createContext === "function" ? R.createContext("default") : undefined;
  const fulfilled = { status: "fulfilled", value: "used", then() {} };
  const seen: Record<string, unknown> = {};
  const state = hookState("Probe", ROOT_TREE, context ? { context, value: "provided", next: null } : null);
  try {
    callWithHooks(state, () => {
      seen.installed = slot.get() === DISPATCHER;
      seen.memo = R.useMemo(() => "memo", []);
      if (typeof R.useId === "function") seen.id = R.useId();
      if (context && typeof R.useContext === "function") seen.context = R.useContext(context);
      if (row.use && typeof R.use === "function") seen.use = R.use(fulfilled);
    });
  } catch (error) {
    return `a component's hooks failed (${String((error as Error)?.message ?? error)})`;
  }
  if (!seen.installed) return `the dispatcher didn't install at ${slot.path}`;
  if (slot.get() !== before) return `the dispatcher at ${slot.path} wasn't put back`;
  if (seen.memo !== "memo") return "useMemo didn't reach the dispatcher";
  if ("id" in seen && !ID_PATTERN[row.id].test(String(seen.id))) return `useId gave ${String(seen.id)}, not React ${row.react}'s format`;
  if (context) {
    const shape = row.context === "context" ? context.Provider === context && context.Consumer?.$$typeof === Symbol.for("react.consumer") : context.Provider?.$$typeof === Symbol.for("react.provider");
    if (!shape) return `its context isn't shaped as React ${row.react}'s`;
    if ("context" in seen && seen.context !== "provided") return "useContext didn't read the walker's provider";
  }
  if ("use" in seen && seen.use !== "used") return "use() didn't read a fulfilled thenable's value";
  return undefined;
}

/** What development says of a React the table doesn't have (`v`) that passed the check. */
export const untested = (v: string): string =>
  `[Unlayer] React ${v} is ${reactRow(v).older ? "older" : "newer"} than the versions Elements is tested with (${KNOWN_REACT[0].react}–${KNOWN_REACT[KNOWN_REACT.length - 1].react}); it passed Elements' check of the React it relies on.`;

let verdict: string | null | undefined;

/** Throws, on every render, if this React fails the check (run once per process). */
export function checkReact(): void {
  if (verdict === undefined) {
    if (env.UNLAYER_SKIP_REACT_CHECK === "1") verdict = null;
    else {
      const { row, known } = reactRow();
      verdict = probe(row) ?? null;
      if (!verdict && !known && env.NODE_ENV !== "production") console.warn(untested(React.version));
    }
  }
  if (verdict) throw new Error(`[Unlayer] unsupported React ${React.version}: ${verdict}. Set UNLAYER_SKIP_REACT_CHECK=1 to render anyway.`);
}
