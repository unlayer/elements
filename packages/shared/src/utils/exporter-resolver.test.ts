import { describe, it, expect } from "vitest";
import { resolveExporter, resolveHead } from "./exporter-resolver";

const mockBundle = {
  exporters: {
    button: {
      web: () => "<button>web</button>",
      email: () => "<table>email</table>",
    },
    heading: {
      web: () => "<h1>web</h1>",
    },
  },
  heads: {
    button: { css: () => ".btn {}" },
    heading: undefined,
  },
};

describe("resolveExporter", () => {
  it("resolves exporter for given type and mode", () => {
    const exporter = resolveExporter(mockBundle, "button", "email");
    expect(exporter()).toBe("<table>email</table>");
  });

  it("defaults to web mode", () => {
    const exporter = resolveExporter(mockBundle, "button");
    expect(exporter()).toBe("<button>web</button>");
  });

  it("falls back to web when requested mode is unavailable", () => {
    const exporter = resolveExporter(mockBundle, "heading", "email");
    expect(exporter()).toBe("<h1>web</h1>");
  });

  it("throws when bundle has no exporters", () => {
    expect(() => resolveExporter({} as any, "button")).toThrow(
      "Unlayer exporters not loaded"
    );
  });

  it("throws for unknown type with helpful message", () => {
    expect(() => resolveExporter(mockBundle, "unknown")).toThrow(
      /Renderer 'unknown' not found.*button.*heading/
    );
  });
});

describe("resolveHead", () => {
  it("resolves head export for given type", () => {
    const head = resolveHead(mockBundle, "button");
    expect(head.css()).toBe(".btn {}");
  });

  it("throws when bundle has no heads", () => {
    expect(() => resolveHead({} as any, "button")).toThrow(
      "Unlayer heads not loaded"
    );
  });

  it("throws for type with no head defined", () => {
    expect(() => resolveHead(mockBundle, "heading")).toThrow(
      /Head export 'heading' not found/
    );
  });
});
