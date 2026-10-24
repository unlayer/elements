/**
 * What Markdown from data can't make Markdown's parser (marked) or the blocks it becomes take more than its size
 * calls for: tables marked fills out cell by cell, quotes and lists it reads by calling itself, and quotes it reads a
 * chunk at a time (see quotes.ts).
 */
import { Tokenizer, type Token, type Tokens } from "marked";
import { readQuote } from "./quotes";
import { addTasks } from "./tasks";

/**
 * The `raw` of a quote read from `text` that read `lists` lists again. marked's has a line break more for each (the
 * line break before the lines after the list), so the lexer read on that much past the quote: what came after it lost
 * its first characters (`After` was `fter`). Where that's more than line breaks, it's the text the quote was read from.
 */
const quoteRaw = (text: string, raw: string, lists: number): string => {
  const end = raw.length - lists;
  return (text[end] ?? "\n") === "\n" && /[^\n]/.test(text.slice(end, raw.length)) ? text.slice(0, end) : raw;
};

/** A rule that finds nothing: marked's tokenizer finds no task item with it (see tasks.ts). */
const NOTHING = /(?!)/;

/**
 * The cells a Markdown's tables can have in all, at the least: past it, as many as its text has characters. marked
 * fills each row out to the header's width (`|a|b|…|` then rows of `|`), so a few kilobytes can be millions of cells,
 * and a Table block writes about 350 bytes of HTML for each. A table whose cells are all written out (each one at
 * least its `|`) always fits, however large; these are for one whose rows are short: 1,000 cells is a table of 20
 * columns and 50 rows, whose HTML (about 350 KB) is already more than three times what Gmail shows before it clips a
 * message (102 KB).
 */
export const TABLE_CELLS = 1000;

/** How deep quotes and lists nest (together): deeper, a quote's `>` and a list's marker are text. */
export const NESTING = 32;

/**
 * The work a Markdown's quotes can take for each of its characters, and QUOTE_BASE more (counted as quotes.ts counts
 * it): far more than Markdown as people write it takes. Past it, each quote ends at its first line without a `>`
 * (that line and the rest are read on outside it), so a lazy line no longer continues a quote's paragraph.
 */
export const QUOTE_WORK = 32;
export const QUOTE_BASE = 1 << 22;

/** A table past the cells left for a Markdown's tables: its size, nothing of it read but its header. */
export type TooLarge = { columns: number; rows: number; cells: number };

/** What a table past the cells left is said with (see TooLarge). */
export const tooLarge = ({ columns, rows, cells }: TooLarge) =>
  `A table of ${columns} columns and ${rows} rows is ${cells} cells, more than the Markdown can render: its tables can have, in all, as many cells as it has characters, or ${TABLE_CELLS} where that's more (marked fills each row out to the header's width)`;

/**
 * marked's tokenizer, keeping to those limits: a table past the cells left is a table token with no rows and its
 * size in `tooLarge`, which isn't filled out; a quote or a list deeper than NESTING isn't one (its text is a paragraph).
 */
export class Limited extends Tokenizer {
  private depth = 0;
  /** The last quote or list read: a quote marked reads again starts with it. */
  private last: Token | undefined;
  /** The lists the quote being read has read again. */
  private rereads = 0;
  /**
   * Whether the lexer has read on since the last quote or list (it looks for a space first, at each place it reads a
   * block): where it hasn't, marked is reading that quote or list again, with the lines after it (a quote's lazy
   * continuation), and the cells its tables were charged (`charged`) are given back first, so each table is charged once.
   */
  private reading = true;
  private charged = 0;

  /** `cells`: the cells the Markdown's tables can have (see TABLE_CELLS); `work`: the work its quotes can take (QUOTE_WORK). */
  constructor(
    private cells: number,
    private work: number
  ) {
    super();
  }

  table(src: string): (Tokens.Table & { tooLarge?: TooLarge }) | undefined {
    // Whether it's a table, as marked reads one, from its first two lines (its header and delimiter row): marked's rule
    // reads every line after them as its rows before it tells, and no row makes a table not one. Read from the whole
    // text, a line a table can't start (`a` over `-`, a setext heading) took time growing with the text after it.
    const second = src.indexOf("\n");
    const third = second < 0 ? -1 : src.indexOf("\n", second + 1);
    if (third >= 0) {
      const queued = this.lexer.inlineQueue.length;
      const head = super.table(src.slice(0, third));
      // (Its cells aren't the Markdown's: what they'd have marked read is left out.)
      this.lexer.inlineQueue.length = queued;
      if (!head) return undefined;
    }
    const cap = this.rules.block.table.exec(src);
    if (cap && this.rules.other.tableDelimiter.test(cap[2])) {
      // As marked counts them: a column for each of the delimiter row's cells (the header must have as many), and a
      // row for each line after it.
      const columns = cap[2].replace(this.rules.other.tableAlignChars, "").split("|").length;
      const rows = cap[3]?.trim() ? cap[3].replace(this.rules.other.tableRowBlankLine, "").split("\n").length : 0;
      const cells = columns * (rows + 1);
      if (cells > this.cells) {
        // Whether it's a table, as marked reads one: from its header alone.
        const header = super.table(`${cap[1]}\n${cap[2]}`);
        return header && { ...header, raw: cap[0].replace(/\n+$/, ""), rows: [], tooLarge: { columns, rows, cells } };
      }
    }
    const table = super.table(src);
    if (table) this.cells -= table.header.length * (table.rows.length + 1);
    return table;
  }

  space(src: string): Tokens.Space | undefined {
    const space = super.space(src);
    if (!space) this.reading = true;
    return space;
  }

  blockquote(src: string): Tokens.Blockquote | undefined {
    if (this.depth >= NESTING || !this.rules.other.blockquoteStart.test(src)) return undefined;
    // A quote marked reads again (with the lines after it, which continue it): past the work, it's what it was, so
    // the quote around it ends there and the lines after it are read on outside it.
    const last = this.reading ? undefined : this.last;
    const again = last?.type === "blockquote" && src.startsWith(`${last.raw}\n`);
    const { cut, work } = readQuote(src, this.work, again);
    this.work -= work;
    if (again && cut === 0) return last as Tokens.Blockquote;
    const text = cut === undefined ? src : src.slice(0, cut);
    const outer = this.rereads;
    this.rereads = 0;
    try {
      return this.nested(() => {
        const quote = super.blockquote(text);
        if (quote && this.rereads) quote.raw = quoteRaw(text, quote.raw, this.rereads);
        return quote;
      });
    } finally {
      this.rereads = outer;
    }
  }

  list(src: string): Tokens.List | undefined {
    // Read again: by the quote it's the last block of, with the lines after it (see blockquote()).
    const again = !this.reading;
    return this.nested(() => {
      const list = super.list(src);
      if (list) {
        addTasks(list, this.lexer.inlineQueue);
        if (again) this.rereads++;
      }
      return list;
    });
  }

  /** Its own copy of marked's rules, where it finds no task item itself (its lists are given their tasks after: tasks.ts). */
  own(): void {
    this.rules = { ...this.rules, other: { ...this.rules.other, listIsTask: NOTHING } };
  }

  /** A quote or a list, read one level deeper, unless that's past NESTING; its tables charged once (see `reading`). */
  private nested<T extends Token>(read: () => T | undefined): T | undefined {
    if (this.depth >= NESTING) return undefined;
    const again = this.reading ? 0 : this.charged;
    this.cells += again;
    const cells = this.cells;
    this.depth++;
    try {
      const token = read();
      if (token) {
        this.charged = cells - this.cells;
        this.reading = false;
        this.last = token;
      } else this.cells -= again;
      return token;
    } finally {
      this.depth--;
    }
  }
}
