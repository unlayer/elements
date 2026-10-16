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
  | { kind: "row" | "column" | "tailwind"; props: Record<string, any> }
  /**
   * What a component gives the document's head, and the root's props unless it sets them (a <Font>); `design`, what
   * it gives the design (a <Font>'s URL on the fonts of its family).
   */
  | { kind: "head"; tags: (mode: string) => string[]; root?: Record<string, unknown>; json?: string; design?: (body: any) => void }
  | { kind: "block"; type: React.ComponentType<any>; props: Record<string, any> }
  | { kind: "boundary"; element: React.ReactElement };

export interface Collection {
  /** In each marker, so markup a template writes can't pass for one. */
  nonce: string;
  recorded: Recorded[];
  /** Markup is guarded too, as components are (a render once more after one threw: see normalize.tsx's `collected`). */
  markup?: boolean;
  /**
   * The React Elements' components call isn't the renderer's (a bundler gave them other copies, as Next.js's
   * server layers can): `useId()` can't tell this render from one inside it, so Rows, Columns and blocks record
   * while it's collecting.
   */
  blind?: boolean;
  /**
   * An async render's (see "@unlayer/react-elements/async"): its async components are rendered, as `async` gives
   * them (on React 18, resolved first), not left out.
   */
  async?: (element: React.ReactElement) => React.ReactElement;
  /** A Row, Column or block in it rendered its HTML: it couldn't tell this render (see Sentinel), so it's no template. */
  lost?: boolean;
}

// Shared by every copy of Elements a process loads (a project's ESM and CommonJS builds, a tool's own): a render one
// copy starts collects the Rows, Columns and blocks another's template uses.
const SHARED = Symbol.for("@unlayer/react-elements/collecting");
export const frames: Array<Collection | null> = ((globalThis as Record<symbol, unknown>)[SHARED] ??= []) as Array<Collection | null>;

/**
 * The collections async renders are under way with, by nonce: their components run after awaits, with another
 * render's frame maybe on top, and find theirs by their ids (see Sentinel). Shared, as the stack is.
 */
const ASYNCS = Symbol.for("@unlayer/react-elements/async-collections");
export const asyncs = ((globalThis as Record<symbol, unknown>)[ASYNCS] ??= new Map()) as Map<string, Collection>;

/**
 * The async render whose work this is (`undefined` where the async entry can't tell), for a Row, Column or block whose
 * ids can't name it (see Collection.blind): the async entry's runner (see its running.ts), shared as the stack is.
 */
const RUNNING = Symbol.for("@unlayer/react-elements/async-running");
export const running = (): Collection | undefined => ((globalThis as Record<symbol, unknown>)[RUNNING] as { current(): Collection | undefined } | undefined)?.current();

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
 * On the Rows, Columns and blocks that record themselves while a template is collected (0.2 and later). One of an
 * older copy (0.1.x, from a package still on it) doesn't, and guard records it in its place (see record.tsx).
 */
export const RECORDS = Symbol.for("@unlayer/react-elements/records");

/**
 * The collecting render's `identifierPrefix`: React puts it at the start of every `useId()` there (after its
 * opening `:` or `«`), so a Row, Column or block can tell that render from another one started inside it (a
 * component rendering a block to a string with react-dom), where it renders what it renders instead of a
 * marker. React's own ids never hold a "-", so none of them starts with it.
 */
export const COLLECTING_ID = "unlayer-collect-";

/**
 * A marker for what's recorded at `at`: its start ("o"), end ("c"), a component that failed ("f"), or a block.
 * React writes its attributes in this order, which the patterns that find markers in HTML spell out exactly
 * (normalize.tsx): nothing looser, as they run on HTML that holds the template's own.
 */
export function marker(collection: Collection, at: number, edge?: "o" | "c" | "f"): React.ReactElement {
  return React.createElement(MARK, { key: `${at}${edge ?? ""}`, "data-n": collection.nonce, "data-i": at, ...(edge ? { "data-e": edge } : {}) });
}
