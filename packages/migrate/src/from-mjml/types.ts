/** Shapes the MJML converter works with: MJML's JSON tree, the Unlayer design it writes, and what it reports. */

import type { DeclaredDifference } from "@unlayer/convert-core";

/** A node of MJML's JSON tree (mjml-parser-xml's output, and what mjml2html takes). */
export interface MjmlNode {
  tagName: string;
  attributes: Record<string, string>;
  children?: MjmlNode[];
  /** The raw content of an ending tag (`mj-text`, `mj-button`, `mj-raw`, …). */
  content?: string;
  /** The line it starts on, in its file. */
  line?: number;
  /** The file it comes from (an `mj-include`'s), when known. */
  file?: string;
}

/** A design value object, as the editor stores it. */
export type Values = Record<string, unknown>;

export interface DesignContent {
  type: string;
  values: Values;
}

export interface DesignColumn {
  values: Values;
  contents: DesignContent[];
}

export interface DesignRow {
  cells: number[];
  values: Values;
  columns: DesignColumn[];
}

/** An Unlayer design: what the editor's `loadDesign()` opens and `renderToJson()` gives. */
export interface Design {
  counters: Record<string, number>;
  body: { rows: DesignRow[]; values: Values };
}

/** What a conversion reports: a stable reason (to group by) and what it's about. */
export interface Note {
  reason: string;
  detail?: string;
}

/** A block kept as the HTML MJML compiles it to (it renders as before, but isn't editable as blocks). */
export interface Fallback extends Note {
  /** The MJML tag it stands for. */
  tag: string;
}

/** An `mj-include`: where it points, from which file. Resolved by the caller, which reads files. */
export type IncludeResolver = (path: string, from: string | undefined) => { file: string; source: string } | { error: string };

export interface MjmlToDesignOptions {
  /** The template's path: includes resolve from its folder, and notes name it. */
  filePath?: string;
  /** Reads an `mj-include`. Without one, includes aren't followed (each is reported). */
  resolveInclude?: IncludeResolver;
}

export interface MjmlToDesignResult {
  design: Design;
  /** What's approximated or not kept (a note per thing, grouped by reason in reports). */
  warnings: Note[];
  /** Blocks kept as MJML's compiled HTML. */
  fallbacks: Fallback[];
  /** What the conversion did that doesn't change how it looks (includes followed, MJML defaults applied). */
  info: Note[];
  /** The template as MJML's JSON tree, its includes resolved: what the reference HTML is compiled from. */
  document: MjmlNode;
  /**
   * Content the conversion changes on purpose, each naming exactly what it replaces (a social icon's alt text, as the
   * editor's Social block writes it): the check against MJML's HTML expects these, and only these.
   */
  declared: DeclaredDifference[];
  /** `mj-title`, when set (Elements writes no `<title>` from a design). */
  title?: string;
}

/** A template MJML 5 can't read: MJML 3's syntax (`mj-container`). */
export class MjmlVersionError extends Error {}
