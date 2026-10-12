/**
 * The render that collects a template's Rows, Columns and blocks (see
 * normalize.tsx). While one runs, those components record their props and
 * render markers instead of HTML; React renders everything else (the user's
 * components, Fragments, conditions, Context). A render of Elements' own
 * inside it (a row's HTML, a nested renderToHtml) is under `null`: nothing is
 * collected there. A stack, not React context: Server Components have no
 * context, and a collecting render can start inside another.
 */
import React from "react";

export type Recorded =
  | { kind: "row" | "column"; props: Record<string, any> }
  | { kind: "block"; type: React.ComponentType<any>; props: Record<string, any> }
  | { kind: "boundary"; element: React.ReactElement };

export interface Collection {
  /** In each marker, so markup a template writes can't pass for one. */
  nonce: string;
  recorded: Recorded[];
}

// Shared by every copy of Elements a process loads (a project's ESM and CommonJS builds, a tool's own): a render one
// copy starts collects the Rows, Columns and blocks another's template uses.
const SHARED = Symbol.for("@unlayer/react-elements/collecting");
const frames: Array<Collection | null> = ((globalThis as Record<symbol, unknown>)[SHARED] ??= []) as Array<Collection | null>;

/** The collecting render under way, if any (and not a render of Elements' own inside it). */
export function collecting(): Collection | undefined {
  return frames[frames.length - 1] ?? undefined;
}

/** Runs `run` with `frame` collecting (or, with `null`, nothing collecting). */
export function within<T>(frame: Collection | null, run: () => T): T {
  frames.push(frame);
  try {
    return run();
  } finally {
    frames.pop();
  }
}

export const MARK = "unlayer-mark";

/**
 * The collecting render's `identifierPrefix`: React puts it at the start of every `useId()` there (after its
 * opening `:` or `«`), so a Row, Column or block can tell that render from another one started inside it (a
 * component rendering a block to a string with react-dom), where it renders what it renders instead of a
 * marker. React's own ids never hold a "-", so none of them starts with it.
 */
export const COLLECTING_ID = "unlayer-collect-";

/** A marker for what's recorded at `at`: its start ("o"), end ("c"), a component that failed ("f"), or a block. */
export function marker(collection: Collection, at: number, edge?: "o" | "c" | "f"): React.ReactElement {
  return React.createElement(MARK, { key: `${at}${edge ?? ""}`, "data-n": collection.nonce, "data-i": at, ...(edge ? { "data-e": edge } : {}) });
}
