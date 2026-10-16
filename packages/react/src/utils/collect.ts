/**
 * What collecting a template records (see record.tsx, and normalize.tsx, which reads it back): each Row, Column,
 * block and scope it renders, in tree order, at the marks the collecting walk writes in their place.
 */
import type React from "react";

/** Where it is in the template (`Row 3 › Column 1 › Button`), for the errors that name it. */
type Placed = { position?: string };

export type Recorded = Placed &
  (
    | { kind: "row" | "column" | "tailwind"; props: Record<string, any> }
    /**
     * What a component gives the document's head, and the root's props unless it sets them (a <Font>); `design`, what
     * it gives the design (a <Font>'s URL on the fonts of its family).
     */
    | { kind: "head"; tags: (mode: string) => string[]; root?: Record<string, unknown>; json?: string; design?: (body: any) => void }
    | { kind: "block"; type: React.ComponentType<any>; props: Record<string, any> }
    /** A component of the template's own; `output`, what it returned (see normalize.tsx's keptMarkup). */
    | { kind: "boundary"; element: React.ReactElement; output?: { value: unknown } }
  );

export interface Collection {
  /** In each marker, so markup a template writes can't pass for one. */
  nonce: string;
  /** What's recorded, numbered as the markers number it. */
  recorded: Recorded[];
}

export const MARK = "unlayer-mark";

/**
 * On Elements' Rows, Columns and blocks (0.2 and later): a collecting walk records them. One of an older copy
 * (0.1.x, from a package still on it) is recognized by its name and its code instead (see record.tsx).
 */
export const RECORDS = Symbol.for("@unlayer/react-elements/records");

/** On <Head> and <Font> (the `head` and `font` entries): what they give the document's head, as a record. */
export const HEAD_ENTRY = Symbol.for("@unlayer/react-elements/head-entry");
