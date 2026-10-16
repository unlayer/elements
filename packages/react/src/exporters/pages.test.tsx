/**
 * The full HTML of every template with a Divider, Html, Menu or Social block (test-corpus.tsx) as a Page and as a
 * Document, as a digest of each document. The snapshot was written by 0.3.0, where these blocks' web and document
 * exporters rendered with react-dom/server, so the documents must stay the same byte for byte.
 */
import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { Document, Page, renderToHtml } from "../index";
import { as, corpus } from "./test-corpus";

/** The blocks' HTML, or the class of their wrapper: a template with any of them. */
const BLOCKS = /aria-label="(divider|menu|social)"|u_content_(divider|html|menu|social)\b|\/social\/icons\//;

const digest = (html: string) => createHash("sha256").update(html).digest("hex").slice(0, 20);

describe.each([
  ["a web page", Page],
  ["a document", Document],
] as const)("as %s", (_, Root) => {
  it("renders every template with these blocks as 0.3.0 did", () => {
    const quiet = [vi.spyOn(console, "warn").mockImplementation(() => {}), vi.spyOn(console, "error").mockImplementation(() => {})];
    try {
      const digests: Record<string, string> = {};
      for (const { name, element, options } of corpus()) {
        const html = renderToHtml(as(element, Root), options as never);
        if (BLOCKS.test(html) || /^components\/(Divider|Html|Menu|Social): /.test(name)) digests[name] = digest(html);
      }
      expect(Object.keys(digests).length).toBeGreaterThan(150);
      expect(digests).toMatchSnapshot();
    } finally {
      for (const spy of quiet) spy.mockRestore();
    }
  });
});
