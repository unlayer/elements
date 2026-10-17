/**
 * What the walker relies on in React, per minor version it's tested with (CI runs the suite on each: see
 * .github/workflows/test.yml). A version that isn't here takes the row of the nearest one before it; the self-test
 * (self-test.ts) checks this React has those shapes before the first render, so an unknown version that differs fails
 * with a named error instead of rendering wrong.
 *
 * | React     | dispatcher slot (client · react-server build)                                | useId   | context  | suspends by     |
 * |-----------|------------------------------------------------------------------------------|---------|----------|-----------------|
 * | 18.0–18.3 | __SECRET_INTERNALS….ReactCurrentDispatcher.current · (no react-server build) | `:R1:`  | provider | thrown promises |
 * | 19.0      | __CLIENT_INTERNALS….H · __SERVER_INTERNALS….H                                | `:R1:`  | context  | use(), thrown   |
 * | 19.1      | same                                                                         | `«R1»`  | context  | use(), thrown   |
 * | 19.2      | same                                                                         | `_R_1_` | context  | use(), thrown   |
 * | 19.3      | same                                                                         | `_R_1_` | context  | use(), thrown   |
 *
 * Context: "provider", React 18's (`Ctx.Provider` is `{ $$typeof: react.provider, _context }`; `Ctx.Consumer` the
 * context itself, or in development `{ $$typeof: react.context, _context }`); "context", React 19's (`<Ctx>` is the
 * provider, `Ctx.Provider === Ctx`; `Ctx.Consumer` is `{ $$typeof: react.consumer, _context }`). `use()` (19) marks a
 * thenable with `status` and `value`/`reason`, which the walker reads and sets as React does. The react-server build
 * (Next.js's Server Components and route handlers) has no `createContext`, `useState`, `useContext`, `useEffect`, …:
 * only `use`, `useId`, `useMemo`, `useCallback` and `useDebugValue`.
 *
 * Errors: the walker throws its own for what React's server renderer rejects (an object as a child, React's #31; an
 * invalid element type, #130; portals), and never reads React's messages.
 */
import React from "react";

export type IdFormat = "colon" | "guillemet" | "underscore";
export type ContextShape = "provider" | "context";

export interface ReactRow {
  /** major.minor */
  react: string;
  /** The dispatcher slot's path, per build. */
  slots: string[];
  id: IdFormat;
  context: ContextShape;
  /** Whether it has `use()`. */
  use: boolean;
}

const LEGACY = "__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher.current";
const CLIENT = "__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE.H";
const SERVER = "__SERVER_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE.H";

export const KNOWN_REACT: readonly ReactRow[] = [
  // React 18's minors are all the same to it.
  ...["18.0", "18.1", "18.2", "18.3"].map((react): ReactRow => ({ react, slots: [LEGACY], id: "colon", context: "provider", use: false })),
  { react: "19.0", slots: [CLIENT, SERVER], id: "colon", context: "context", use: true },
  { react: "19.1", slots: [CLIENT, SERVER], id: "guillemet", context: "context", use: true },
  { react: "19.2", slots: [CLIENT, SERVER], id: "underscore", context: "context", use: true },
  { react: "19.3", slots: [CLIENT, SERVER], id: "underscore", context: "context", use: true },
];

/** What a useId the walker gives looks like, per format (no identifierPrefix). */
export const ID_PATTERN: Record<IdFormat, RegExp> = {
  colon: /^:R[0-9a-v]+(H[0-9a-v]+)?:$/,
  guillemet: /^«R[0-9a-v]+(H[0-9a-v]+)?»$/,
  underscore: /^_R_[0-9a-v]+(H[0-9a-v]+)?_$/,
};

const version = (v: string) => v.split(/[.-]/).slice(0, 2).map((n) => Number.parseInt(n, 10) || 0);

const [MAJOR, MINOR] = version(String(React.version));
/** React 18 renders some elements, attributes, styles and children otherwise than React 19 (see walk.ts, attributes.ts). */
export const REACT_18 = MAJOR < 19;
/** React 19.3 added `credentialless` to its boolean attributes and `maskType` to its SVG attributes. */
export const REACT_19_3 = MAJOR > 19 || (MAJOR === 19 && MINOR >= 3);

/** The installed React's row: its own, else the nearest before it (`known: false`), or for one older than all, the first. */
export function reactRow(v: string = React.version): { row: ReactRow; known: boolean; older?: boolean } {
  const [major, minor] = version(v);
  const exact = KNOWN_REACT.find((r) => r.react === `${major}.${minor}`);
  if (exact) return { row: exact, known: true };
  const before = [...KNOWN_REACT].reverse().find((r) => {
    const [m, n] = version(r.react);
    return m < major || (m === major && n <= minor);
  });
  return before ? { row: before, known: false } : { row: KNOWN_REACT[0], known: false, older: true };
}

let row: ReactRow | undefined;
export const idFormat = (): IdFormat => (row ??= reactRow().row).id;

/** React's dispatcher slot: where its hooks read the dispatcher from. */
export interface Slot {
  get(): unknown;
  set(dispatcher: unknown): void;
  path: string;
}

/** The slot of `R` (the React Elements imports, the template's: `react` is a peer dependency), by the table's paths. */
export function slotOf(R: object = React, paths: string[] = (row ??= reactRow().row).slots): Slot | null {
  for (const path of paths) {
    const keys = path.split(".");
    const field = keys.pop()!;
    let holder: any = R;
    for (const key of keys) holder = holder?.[key];
    if (holder && typeof holder === "object" && field in holder) return { get: () => holder[field], set: (d) => void (holder[field] = d), path };
  }
  return null;
}
