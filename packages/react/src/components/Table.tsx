import { TableExporters, TableDefaults } from "@unlayer/exporters";
import type { TableValues } from "../types";
import { createItemComponent, type ItemComponentProps } from "../utils/create-component";
import { mapSemanticProps, type SemanticProps } from "../utils/semantic-props";

type TableSemanticProps = SemanticProps<TableValues> & {
  /** Column headers as string[] */
  headers?: string[];
  /** Row data as 2D string array */
  data?: string[][];
};

export interface TableProps extends Omit<ItemComponentProps<SemanticProps<TableValues>>, "headers" | "data"> {
  headers?: string[];
  data?: string[][];
}

// Defaults from the editor schema, plus table data structure
const DEFAULT_TABLE: NonNullable<TableValues["table"]> = { headers: [], rows: [], footers: [] };

const DEFAULT_VALUES = {
  ...TableDefaults,
  table: DEFAULT_TABLE, // Schema doesn't include table data structure
} as unknown as TableValues;

/**
 * Table - Renders a data table.
 *
 * @example Shorthand
 * ```tsx
 * <Table
 *   headers={["Name", "Email", "Role"]}
 *   data={[["Alice", "alice@co.com", "Admin"], ["Bob", "bob@co.com", "User"]]}
 * />
 * ```
 *
 * @example Full Control
 * ```tsx
 * <Table values={{
 *   table: {
 *     headers: [{ cells: [{ text: "Name" }, { text: "Email" }] }],
 *     rows: [{ cells: [{ text: "John" }, { text: "john@example.com" }] }]
 *   },
 *   enableHeader: true
 * }} />
 * ```
 */
const Table = createItemComponent<TableValues, TableSemanticProps>({
  name: "Table",
  defaultValues: DEFAULT_VALUES,
  propMapper: (props) => {
    const { headers, data, ...rest } = props;

    if (headers || data) {
      const base: Partial<TableValues> = mapSemanticProps(
        rest as SemanticProps<TableValues>,
        DEFAULT_VALUES,
        "Table"
      );

      const tableHeaders = headers
        ? [{ cells: headers.map((text: string) => ({ text, width: 0 })), height: 0 }]
        : [];

      const tableRows = data
        ? data.map((row: string[]) => ({
            cells: row.map((text: string) => ({ text, width: 0 })),
            height: 0,
          }))
        : [];

      base.table = { headers: tableHeaders, rows: tableRows, footers: [] };

      if (headers) {
        base.columns = headers.length;
        base.enableHeader = true;
      }
      if (data) {
        base.rows = data.length;
      }

      return base;
    }

    return mapSemanticProps(
      props as SemanticProps<TableValues>,
      DEFAULT_VALUES,
      "Table"
    );
  },
  displayName: "Table",
  exporters: TableExporters,
});

export default Table;
