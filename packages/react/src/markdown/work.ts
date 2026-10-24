/**
 * A Markdown read with the work its render has left (see the code entry's work.ts): the inline syntax's (WORK steps
 * for each character of the render's Markdown, and BASE more) and its quotes' and list items' lines' (QUOTE_WORK, and
 * QUOTE_BASE more), for all its Markdown together, as one Markdown of their size has, so many of them can't take more
 * than one would. Outside a render, a Markdown has its own. Past the work, the rest of its inline syntax is text and
 * its quotes end at their first line without a `>` (nothing is left out), said once in the render.
 */
import type { Token } from "marked";
import { renderWork, sayInRender } from "../code/work";
import { BASE, Bounded, WORK, type Work } from "./inline";
import { QUOTE_BASE, QUOTE_WORK, TABLE_CELLS } from "./limits";

const MARKDOWN = Symbol.for("@unlayer/react-elements/markdown-work");

/** `source`'s tokens, read with what's left of its render's work (its own outside a render), which it spends. */
export function lexMarkdown(source: string, breaks: boolean): Token[] {
  const work: Work = renderWork(MARKDOWN, () => ({ inline: BASE, quotes: QUOTE_BASE })) ?? { inline: BASE, quotes: QUOTE_BASE };
  work.inline += WORK * source.length;
  work.quotes += QUOTE_WORK * source.length;
  const lexer = new Bounded({ breaks, cells: Math.max(TABLE_CELLS, source.length), size: source.length, work });
  const tokens = lexer.lex(source);
  const left = lexer.left;
  work.inline = Math.max(0, left.inline);
  work.quotes = Math.max(0, left.quotes);
  const past = [left.inline < 0 && "the rest of its inline syntax is text", left.quotes < 0 && "each quote ends at its first line without a `>`, and the rest of a list item's lines is text"].filter(Boolean);
  if (past.length)
    sayInRender(
      "markdown work",
      `[Unlayer] Markdown: it takes marked more work to read than a render's Markdown can (${WORK} steps for each of its characters, and about a million more for its inline syntax, four million for its quotes), so ${past.join("; and ")}: nothing is left out.`
    );
  return tokens;
}
