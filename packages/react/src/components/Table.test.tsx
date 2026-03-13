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

  it("has correct displayName", () => {
    expect(Table.displayName).toBe("Table");
  });
});
