/**
 * The conversion report: how much of a template became native Elements
 * components (editable in the visual editor) and what fell back, and why.
 */

import { contentNodes, type ElementNode } from "./tree";

export interface ReportEntry {
  /** A stable category, used to rank causes across templates. */
  reason: string;
  /** Specifics: the class, element or value involved. */
  detail?: string;
}

export interface ConversionReport {
  /** Content blocks in the output. */
  contentNodes: number;
  /** Blocks that are native Elements components. */
  nativeNodes: number;
  /** Html blocks standing in for content that couldn't be mapped. */
  fallbackNodes: number;
  /** nativeNodes / contentNodes (1 when there's no content). */
  nativeRatio: number;
  /** One entry per fallback block. */
  fallbacks: ReportEntry[];
  /** Differences from the original: things approximated or dropped (e.g. hover styles). */
  notes: ReportEntry[];
  /** What the conversion did that doesn't change how it looks (a component inlined, a class split). */
  info: ReportEntry[];
  /**
   * Words the original shows that the conversion doesn't, when the conversion
   * was checked against the original's HTML. Empty means nothing was lost.
   */
  missingText?: string[];
  /** Words the conversion shows that the original doesn't. */
  addedText?: string[];
  /** Links, image sources and image text the original has and the conversion doesn't. */
  missingAttributes?: string[];
  /**
   * Style values computed from props or state that the conversion can't keep,
   * with where they were. They change how the email looks: the check fails on them.
   */
  lostStyles?: string[];
}

/** Collects notes while converting; `finish` adds the counts from the tree. */
export class ReportBuilder {
  private readonly notes: ReportEntry[] = [];
  private readonly infos: ReportEntry[] = [];
  private readonly lost: string[] = [];

  /** A difference from the original. */
  note(reason: string, detail?: string): void {
    this.notes.push(detail === undefined ? { reason } : { reason, detail });
  }

  /** A style dropped that changes how the email looks: the check fails on it. */
  lostStyle(detail: string): void {
    this.lost.push(detail);
  }

  /** Something the conversion did that doesn't change how the email looks. */
  info(reason: string, detail?: string): void {
    this.infos.push(detail === undefined ? { reason } : { reason, detail });
  }

  finish(tree: ElementNode): ConversionReport {
    const blocks = contentNodes(tree);
    const fallbacks = blocks
      .filter((node) => node.fallback !== undefined)
      .map((node) => parseReason(node.fallback as string));
    const native = blocks.length - fallbacks.length;
    return {
      contentNodes: blocks.length,
      nativeNodes: native,
      fallbackNodes: fallbacks.length,
      nativeRatio: blocks.length === 0 ? 1 : native / blocks.length,
      fallbacks,
      notes: this.notes,
      info: this.infos,
      ...(this.lost.length ? { lostStyles: this.lost } : {}),
    };
  }
}

/** "unsupported element: div" → { reason: "unsupported element", detail: "div" } */
function parseReason(text: string): ReportEntry {
  const index = text.indexOf(": ");
  return index === -1 ? { reason: text } : { reason: text.slice(0, index), detail: text.slice(index + 2) };
}
