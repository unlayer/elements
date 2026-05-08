import { describe, it, expect } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import Button from "./Button";

describe("Button Component", () => {
  it("renders an anchor element with button text", () => {
    const { container } = render(<Button>Click me</Button>);
    const link = container.querySelector("a");
    expect(link).not.toBeNull();
    expect(link!.textContent).toContain("Click me");
  });

  it("applies backgroundColor and color styles", () => {
    const { container } = render(
      <Button backgroundColor="#3b82f6" color="#ffffff">Styled</Button>
    );
    const link = container.querySelector("a");
    expect(link).not.toBeNull();
    expect(link!.style.backgroundColor).toBeTruthy();
    expect(container.innerHTML).toContain("#3b82f6");
    expect(container.innerHTML).toContain("#ffffff");
  });

  it("applies borderRadius", () => {
    const { container } = render(<Button borderRadius="8px">Round</Button>);
    expect(container.innerHTML).toContain("border-radius");
    expect(container.innerHTML).toContain("8px");
  });

  it("applies fontSize", () => {
    const { container } = render(<Button fontSize="18px">Big</Button>);
    expect(container.innerHTML).toContain("font-size: 18px");
  });

  it("renders children as button text", () => {
    const { container } = render(<Button>Custom Label</Button>);
    expect(container.textContent).toContain("Custom Label");
  });

  it("defaults to center alignment", () => {
    const { container } = render(<Button>Centered</Button>);
    expect(container.innerHTML).toContain("center");
  });

  it("produces table-based HTML in email mode", () => {
    const { container } = render(<Button mode="email">Email CTA</Button>);
    // Email mode includes VML roundrect for Outlook
    expect(container.innerHTML).toContain("v:roundrect");
    expect(container.innerHTML).toContain("mso");
    expect(container.textContent).toContain("Email CTA");
  });

  it("does not include VML in web mode", () => {
    const { container } = render(<Button mode="web">Web CTA</Button>);
    expect(container.innerHTML).not.toContain("v:roundrect");
  });

  it("renders default colors when none specified", () => {
    const { container } = render(<Button>Default</Button>);
    // Default: white text on #0879A1
    expect(container.innerHTML).toContain("#0879A1");
    expect(container.innerHTML).toContain("#FFFFFF");
  });

  it("has correct displayName", () => {
    expect(Button.displayName).toBe("Button");
  });

  // Regression: every accepted href shape must reach the rendered <a>.
  // Previously they all rendered as href="" because the mapper handed the
  // exporter the schema storage shape `{ name, values: { href, target } }`
  // but the exporter reads `e.url`. See semantic-props normalizeLinkValue.
  describe("href is rendered to the anchor (regression)", () => {
    const URL = "https://example.com";

    function getHref(container: HTMLElement): string | null {
      return container.querySelector("a")?.getAttribute("href") ?? null;
    }

    it("renders href when passed as a string", () => {
      const { container } = render(<Button href={URL}>Go</Button>);
      expect(getHref(container)).toBe(URL);
    });

    it("renders href when passed as the storage shape {name, values}", () => {
      const { container } = render(
        <Button
          href={
            { name: "web", values: { href: URL, target: "_blank" } } as any
          }
        >
          Go
        </Button>
      );
      expect(getHref(container)).toBe(URL);
    });

    it("renders href when passed via the values escape hatch", () => {
      const { container } = render(
        <Button
          values={
            {
              href: {
                name: "web",
                values: { href: URL, target: "_blank" },
              },
            } as any
          }
        >
          Go
        </Button>
      );
      expect(getHref(container)).toBe(URL);
    });

    it("renders href in email mode (table-based output)", () => {
      const { container } = render(
        <Button mode="email" href={URL}>
          Go
        </Button>
      );
      expect(getHref(container)).toBe(URL);
    });
  });
});
