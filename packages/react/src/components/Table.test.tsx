import { describe, it, expect } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import Table from "./Table";

describe("Table Component", () => {
  it("renders a table element", () => {
    const { container } = render(
      <Table headers={["Name"]} data={[["Alice"]]} />
    );
    const table = container.querySelector("table");
    expect(table).not.toBeNull();
  });

  it("renders header cells", () => {
    const { container } = render(
      <Table headers={["Name", "Email"]} data={[["Alice", "alice@co.com"]]} />
    );
    expect(Array.from(container.querySelectorAll("thead th")).map((th) => th.textContent)).toEqual(["Name", "Email"]);
  });

  it("renders data rows", () => {
    const { container } = render(
      <Table
        headers={["Name", "Email"]}
        data={[["Alice", "alice@co.com"], ["Bob", "bob@co.com"]]}
      />
    );
    const rows = Array.from(container.querySelectorAll("tbody tr")).map((tr) => Array.from(tr.children).map((td) => td.textContent));
    expect(rows).toEqual([["Alice", "alice@co.com"], ["Bob", "bob@co.com"]]);
  });

  it("renders with full values object", () => {
    const { container } = render(
      <Table values={{
        table: {
          headers: [{ cells: [{ text: "Product" }] }],
          rows: [{ cells: [{ text: "Widget" }] }]
        },
        enableHeader: true
      }} />
    );
    expect(container.textContent).toContain("Widget");
    expect(container.querySelector("table")).not.toBeNull();
  });

  it("renders table cells (td elements)", () => {
    const { container } = render(
      <Table headers={["Col"]} data={[["Value"]]} />
    );
    const cells = container.querySelectorAll("td");
    expect(cells).toHaveLength(1);
    expect(cells[0]!.textContent).toBe("Value");
  });

  it("gives its cells an Outlook width and background in email mode, on the table's own columns", () => {
    const { container } = render(
      <Table mode="email" headers={["Name", "Email"]} data={[["Alice", "alice@co.com"]]} />
    );
    const table = container.querySelector("thead")!.closest("table")!;
    expect(table.getAttribute("role")).toBeNull();
    const header = table.querySelector("th")!;
    expect(header.textContent).toBe("Name");
    expect(header.getAttribute("bgcolor")).toBe("#dddddd");
    expect(header.getAttribute("width")).toBe("250");
    expect(table.querySelector("tbody td")!.getAttribute("bgcolor")).toBe("#ffffff");
    expect(table.querySelectorAll("colgroup col")).toHaveLength(2);
  });

  it("repeats headers and footers by default in document mode", () => {
    const { container } = render(
      <Table
        mode="document"
        values={{
          table: {
            headers: [{ cells: [{ text: "Header", width: 100 }], height: 40 }],
            rows: [{ cells: [{ text: "Body", width: 100 }], height: 40 }],
            footers: [{ cells: [{ text: "Footer", width: 100 }], height: 40 }],
          },
          enableHeader: true,
          enableFooter: true,
        } as any}
      />
    );

    expect(container.querySelector("thead")?.textContent).toBe("Header");
    expect(container.querySelector("tfoot")?.textContent).toBe("Footer");
    expect(container.querySelector("tbody")?.textContent).toBe("Body");
  });

  it("honors the flat repeat-header prop", () => {
    const { container } = render(
      <Table
        mode="document"
        headers={["Header"]}
        data={[["Body"]]}
        repeatHeaderOnEachPage={false}
      />
    );

    expect(container.querySelector("thead")?.textContent).toBe("");
    expect(container.querySelector("tbody tr")?.textContent).toBe("Header");
  });

  it("keeps non-repeating headers and footers in the document table body", () => {
    const { container } = render(
      <Table
        mode="document"
        values={{
          table: {
            headers: [{ cells: [{ text: "Header", width: 100 }], height: 40 }],
            rows: [{ cells: [{ text: "Body", width: 100 }], height: 40 }],
            footers: [{ cells: [{ text: "Footer", width: 100 }], height: 40 }],
          },
          enableHeader: true,
          repeatHeaderOnEachPage: false,
          enableFooter: true,
          repeatFooterOnEachPage: false,
        } as any}
      />
    );

    const inBody = Array.from(container.querySelectorAll("tbody tr")).map((tr) => tr.textContent);
    expect(inBody).toEqual(["Header", "Body", "Footer"]);
    expect(container.querySelector("thead")?.textContent).toBe("");
    expect(container.querySelector("tfoot")?.textContent).toBe("");
  });

  it("has correct displayName", () => {
    expect(Table.displayName).toBe("Table");
  });
});
