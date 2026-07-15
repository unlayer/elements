import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { escapeHtml, sanitizeUrl, escapeUrlAttribute } from "./escape-html";

describe("escapeHtml", () => {
  it("escapes the HTML/attribute-breaking characters", () => {
    expect(escapeHtml(`& < > "`)).toBe("&amp; &lt; &gt; &quot;");
  });

  it("escapes ampersands before other entities (no double-escaping order bug)", () => {
    expect(escapeHtml("a & b < c")).toBe("a &amp; b &lt; c");
  });

  it("leaves safe text untouched", () => {
    expect(escapeHtml("Hello, world! 你好 — 42")).toBe("Hello, world! 你好 — 42");
  });
});

describe("sanitizeUrl", () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    warn.mockRestore();
  });

  it("passes through safe URLs unchanged", () => {
    for (const url of [
      "https://example.com/path?q=1#h",
      "http://example.com",
      "mailto:a@b.com",
      "tel:+15551234567",
      "sms:+15551234567",
      "ftp://host/file",
      "/relative/path",
      "./rel",
      "#anchor",
      "//protocol-relative.example.com",
      "",
    ]) {
      expect(sanitizeUrl(url)).toBe(url);
    }
    expect(warn).not.toHaveBeenCalled();
  });

  it("blocks the script-executing schemes", () => {
    for (const url of [
      "javascript:alert(1)",
      "JavaScript:alert(1)",
      "  javascript:alert(1)",
      "vbscript:msgbox(1)",
      "data:text/html,<script>alert(1)</script>",
    ]) {
      expect(sanitizeUrl(url)).toBe("");
    }
  });

  // Regression: browsers strip \t \n \r from a URL before parsing its scheme,
  // so a control character embedded in the scheme must not bypass the blocklist.
  it("blocks schemes obfuscated with embedded tab/newline/carriage-return", () => {
    const bypasses = [
      "java\tscript:alert(1)",
      "java\nscript:alert(1)",
      "java\rscript:alert(1)",
      "JAVA\rSCRIPT:alert(1)",
      "  java\tscript:alert(1)",
      "vb\tscript:msgbox(1)",
      "da\nta:text/html,x",
      "\tjavascript:alert(1)",
    ];
    for (const url of bypasses) {
      expect(sanitizeUrl(url), `should block ${JSON.stringify(url)}`).toBe("");
    }
  });

  it("strips embedded control characters from otherwise-safe URLs", () => {
    expect(sanitizeUrl("https://exa\tmple.com/pa\nth")).toBe(
      "https://example.com/path"
    );
  });
});

describe("escapeUrlAttribute", () => {
  it("blocks dangerous schemes then escapes attribute-breaking characters", () => {
    expect(escapeUrlAttribute("javascript:alert(1)")).toBe("");
    expect(escapeUrlAttribute(`https://x.com/?a=1&b="2"`)).toBe(
      "https://x.com/?a=1&amp;b=&quot;2&quot;"
    );
  });

  it("blocks the tab-obfuscated bypass at the attribute layer too", () => {
    expect(escapeUrlAttribute("java\tscript:alert(1)")).toBe("");
  });
});
