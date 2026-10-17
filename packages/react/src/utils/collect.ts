/**
 * What collecting a template records (see record.tsx, and src/model, which makes the template's model from it): each
 * Row, Column, block, scope and head entry it renders, where it renders it, in the content the collecting walk gives.
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
    /** `rich`: text with elements in it, rendered inside its record (see record.tsx). */
    | { kind: "block"; type: React.ComponentType<any>; props: Record<string, any>; rich?: boolean }
    /** A component of the template's own; `output`, what it returned (see src/model's keptMarkup). */
    | { kind: "boundary"; element: React.ReactElement; output?: { value: unknown } }
  );

/**
 * On Elements' Rows, Columns and blocks (0.2 and later): a collecting walk records them. One of an older copy
 * (0.1.x, from a package still on it) is recognized by its name and its code instead (see record.tsx).
 */
export const RECORDS = Symbol.for("@unlayer/react-elements/records");

/** On <Head> and <Font> (the `head` and `font` entries): what they give the document's head, as a record. */
export const HEAD_ENTRY = Symbol.for("@unlayer/react-elements/head-entry");
