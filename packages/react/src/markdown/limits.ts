/**
 * What Markdown from data can't make Markdown's parser (marked) or the blocks it becomes take more than its size
 * calls for: tables marked fills out cell by cell.
 */
import { Tokenizer, type Tokens } from "marked";

/**
 * The cells a Markdown's tables can have in all, at the least: past it, as many as its text has characters. marked
 * fills each row out to the header's width (`|a|b|…|` then rows of `|`), so a few kilobytes can be millions of cells,
 * and a Table block writes about 350 bytes of HTML for each. A table whose cells are all written out (each one at
 * least its `|`) always fits, however large; these are for one whose rows are short: 1,000 cells is a table of 20
 * columns and 50 rows, whose HTML (about 350 KB) is already more than three times what Gmail shows before it clips a
 * message (102 KB).
 */
export const TABLE_CELLS = 1000;

/** A table past the cells left for a Markdown's tables: its size, nothing of it read but its header. */
export type TooLarge = { columns: number; rows: number; cells: number };

/** What a table past the cells left is said with (see TooLarge). */
export const tooLarge = ({ columns, rows, cells }: TooLarge) =>
  `A table of ${columns} columns and ${rows} rows is ${cells} cells, more than the Markdown can render: its tables can have, in all, as many cells as it has characters, or ${TABLE_CELLS} where that's more (marked fills each row out to the header's width)`;

/**
 * marked's tokenizer, keeping to those limits: a table past the cells left is a table token with no rows and its
 * size in `tooLarge`, which isn't filled out.
 */
export class Limited extends Tokenizer {
  /** `cells`: the cells the Markdown's tables can have (see TABLE_CELLS). */
  constructor(private cells: number) {
    super();
  }

  table(src: string): (Tokens.Table & { tooLarge?: TooLarge }) | undefined {
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
}
