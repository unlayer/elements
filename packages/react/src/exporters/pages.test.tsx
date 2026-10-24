/**
 * The full HTML of every template with a Divider, Html, Menu or Social block (test-corpus.tsx) as a Page and as a
 * Document, as a digest of each document. The snapshot was written by 0.3.0 (React 18), where these blocks' web and
 * document exporters rendered with react-dom/server, so the documents must stay the same byte for byte (with React
 * 19, as react-dom 19 writes them), but for a `javascript:` URL (see BLOCKED).
 */
import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { Document, Page, renderToHtml } from "../index";
import { as, corpus } from "./test-corpus";

/** The blocks' HTML, or the class of their wrapper: a template with any of them. */
const BLOCKS = /aria-label="(divider|menu|social)"|u_content_(divider|html|menu|social)\b|\/social\/icons\//;

const digest = (html: string) => createHash("sha256").update(html).digest("hex").slice(0, 20);

/**
 * Where a document is written otherwise than react-dom 18 wrote it (the snapshot): a `javascript:` link, which
 * Elements writes as react-dom 19 does, as a URL that throws, with any React (see attributes.ts), the editor's exporters'
 * own links too (a Button's, an Image's: see unrunLinks). Each one's digest, the snapshot's and the one written now, by
 * root.
 */
const BLOCKED: Record<string, Record<string, [string, string]>> = {
  Page: { 'link 8: "javascript:alert(1)"': ["cb5c73844884eb5f608c", "0cc7c54651e42795bbee"] },
  Document: { 'link 8: "javascript:alert(1)"': ["0107f525ae7ac69fda05", "bf6a9d1c77778cdc7242"] },
};

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
      for (const [name, [react18, blocked]] of Object.entries(BLOCKED[Root.displayName])) {
        expect(digests[name], name).toBe(blocked);
        digests[name] = react18;
      }
      expect(digests).toMatchSnapshot();
    } finally {
      for (const spy of quiet) spy.mockRestore();
    }
  });
});
