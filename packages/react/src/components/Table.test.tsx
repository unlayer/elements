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
    expect(container.textContent).toContain("Name");
    expect(container.textContent).toContain("Email");
  });

  it("renders data rows", () => {
    const { container } = render(
      <Table
        headers={["Name", "Email"]}
        data={[["Alice", "alice@co.com"], ["Bob", "bob@co.com"]]}
      />
    );
    expect(container.textContent).toContain("Alice");
    expect(container.textContent).toContain("alice@co.com");
    expect(container.textContent).toContain("Bob");
    expect(container.textContent).toContain("bob@co.com");
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
    expect(cells.length).toBeGreaterThan(0);
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

    expect(container.querySelector("thead")?.textContent).toContain("Header");
    expect(container.querySelector("tfoot")?.textContent).toContain("Footer");
    expect(container.querySelector("tbody .u-table-header")).toBeNull();
    expect(container.querySelector("tbody .u-table-footer")).toBeNull();
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

    expect(container.querySelector("tbody .u-table-header")?.textContent).toContain(
      "Header"
    );
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

    expect(container.querySelector("tbody .u-table-header")?.textContent).toContain(
      "Header"
    );
    expect(container.querySelector("tbody .u-table-footer")?.textContent).toContain(
      "Footer"
    );
  });

  it("has correct displayName", () => {
    expect(Table.displayName).toBe("Table");
  });
});
