import { Column, Email, Table, TableCell, TableRow } from "@hyper-elements/react";

export const meta = {
  title: "Table",
  description: "Rows of cells with padding and row borders; columns take their cells' widths.",
  group: "Data",
};

export default function Example() {
  return (
    <Email width={520} style={{ backgroundColor: "#ffffff", fontFamily: "Inter, Helvetica, Arial, sans-serif", color: "#0f172a", gap: 16 }}>
      <Column style={{ padding: 24, gap: 16 }}>
        <Table style={{ cellPadding: [10, 12], rowBorder: "1px solid #e2e8f0", fontSize: 14 }}>
          <TableRow header style={{ backgroundColor: "#f8fafc" }}>
            <TableCell>Output</TableCell>
            <TableCell>Root</TableCell>
            <TableCell style={{ textAlign: "right" }}>Browser needed</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Email HTML</TableCell>
            <TableCell>Email</TableCell>
            <TableCell style={{ textAlign: "right" }}>No</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>PDF</TableCell>
            <TableCell>Document</TableCell>
            <TableCell style={{ textAlign: "right" }}>No</TableCell>
          </TableRow>
        </Table>
      </Column>
    </Email>
  );
}
