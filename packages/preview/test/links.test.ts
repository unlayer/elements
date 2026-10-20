import path from "node:path";
import { describe, expect, it } from "vitest";
import { checkLinks, extractLinks, GMAIL_CLIP_BYTES } from "../src/server/links";
import { FIXTURE } from "./helpers";

const DIR = path.join(FIXTURE, "emails");

/** A fetch that answers from a table: status, content type and size per URL; unknown URLs fail to connect. */
function fakeFetch(table: Record<string, { status: number; type?: string; size?: number; url?: string }>): typeof fetch {
  return (async (input: string | URL | Request) => {
    const url = String(input);
    const entry = table[url];
    if (!entry) throw Object.assign(new TypeError("fetch failed"), { cause: { code: "ENOTFOUND" } });
    const headers = new Headers();
    if (entry.type) headers.set("content-type", entry.type);
    if (entry.size !== undefined) headers.set("content-length", String(entry.size));
    const res = new Response(null, { status: entry.status, headers });
    Object.defineProperty(res, "url", { value: entry.url ?? url });
    return res;
  }) as typeof fetch;
}

const html = (body: string) => `<!doctype html><html><body>${body}</body></html>`;

describe("link and image checks", () => {
  it("finds links and images with the block they're in, and skips Outlook-only copies", () => {
    const found = extractLinks(
      html(
        '<table id="u_content_button_1"><tr><td><!--[if mso]><v:roundrect href="https://example.com/x"></v:roundrect><![endif]--><a href="https://example.com/x">Go <b>now</b></a></td></tr></table>' +
          '<table id="u_content_image_2"><tr><td><img src="https://example.com/a.png" alt="Logo"></td></tr></table>'
      )
    );
    expect(found).toEqual([
      expect.objectContaining({ kind: "link", url: "https://example.com/x", block: "Button 1", label: "Go now" }),
      expect.objectContaining({ kind: "image", url: "https://example.com/a.png", block: "Image 2", alt: "Logo" }),
    ]);
  });

  it("reports what's wrong in the HTML itself without requesting anything", async () => {
    const report = await checkLinks(
      html(
        '<a href="#">A</a><a href="">B</a><a href="/pricing">C</a><a href="http://example.com">D</a><a href="http://localhost:3000/x">E</a>' +
          '<a href="mailto:nobody">F</a><a href="{{unsubscribe_url}}">G</a><a href="https://example.com/start">H</a><a href="https://shop.example/cart">I</a><img src="https://example.com/a.svg"><img src="/static/missing.png" alt="">'
      ),
      { dir: DIR, network: false }
    );
    const messages = report.findings.map((f) => `${f.level}: ${f.url} ${f.message}`);
    expect(messages).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^error: # This link goes nowhere/),
        expect.stringMatching(/^error:  This link goes nowhere/),
        expect.stringMatching(/^error: \/pricing A relative URL/),
        expect.stringMatching(/^warning: http:\/\/example.com Not HTTPS/),
        expect.stringMatching(/^error: http:\/\/localhost:3000\/x It points to localhost/),
        expect.stringMatching(/^error: mailto:nobody This mailto/),
        expect.stringMatching(/^info: \{\{unsubscribe_url\}\} A merge tag/),
        expect.stringMatching(/^warning: https:\/\/example.com\/a.svg Gmail and Outlook don't show SVG/),
        expect.stringMatching(/^warning: https:\/\/example.com\/a.svg No alt text/),
        expect.stringMatching(/^info: \/static\/missing.png Empty alt text/),
        expect.stringMatching(/^warning: https:\/\/example.com\/start A placeholder address/),
        expect.stringMatching(/^warning: https:\/\/shop.example\/cart A placeholder address/),
        expect.stringMatching(/^error: \/static\/missing.png There's no static\/missing.png/),
      ])
    );
    expect(report.network).toBe(false);
    // Errors first.
    expect(report.findings[0].level).toBe("error");
  });

  it("reports a /static/ URL that doesn't decode, and checks the rest", async () => {
    const report = await checkLinks(html('<img src="/static/%" alt="Logo"><img src="/static/%E0%A4%A" alt="Logo"><a href="javascript:x">A</a>'), { dir: DIR, network: false });
    const messages = report.findings.map((f) => `${f.level}: ${f.url} ${f.message}`);
    expect(messages).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^error: \/static\/% A malformed URL/),
        expect.stringMatching(/^error: \/static\/%E0%A4%A A malformed URL/),
        expect.stringMatching(/^error: javascript:x Email clients don't run javascript: links/),
      ])
    );
  });

  it("accepts the templates folder's static files, and says to host them", async () => {
    const report = await checkLinks(html('<img src="/static/logo.png" alt="Acme">'), { dir: DIR, network: false });
    expect(report.findings).toEqual([expect.objectContaining({ level: "info", message: expect.stringMatching(/host the image/) })]);
  });

  it("requests each URL once (not placeholders), and reports broken links, wrong image types, large images and redirects", async () => {
    let requests = 0;
    const table = {
      "https://acme.dev/ok": { status: 200, type: "text/html" },
      "https://acme.dev/gone": { status: 404, type: "text/html" },
      "https://acme.dev/logo.png": { status: 200, type: "text/html" },
      "https://acme.dev/huge.jpg": { status: 200, type: "image/jpeg", size: 3 * 1024 * 1024 },
      "https://acme.dev/old": { status: 200, type: "text/html", url: "https://acme.dev/new" },
    };
    const fetchTable = fakeFetch(table);
    const counting: typeof fetch = (input, init) => {
      requests++;
      return fetchTable(input, init);
    };
    const report = await checkLinks(
      html(
        '<a href="https://acme.dev/ok">1</a><a href="https://acme.dev/ok">2</a><a href="https://acme.dev/gone">3</a>' +
          '<a href="https://nowhere.acme.dev/">4</a><a href="https://acme.dev/old">5</a><a href="https://example.org/plans">6</a>' +
          '<img src="https://acme.dev/logo.png" alt="Logo"><img src="https://acme.dev/huge.jpg" alt="Huge">'
      ),
      { dir: DIR, fetch: counting }
    );
    expect(requests).toBe(6);
    const byUrl = (url: string) => report.findings.filter((f) => f.url === url).map((f) => f.message);
    expect(byUrl("https://acme.dev/ok")).toEqual([]);
    expect(byUrl("https://acme.dev/gone")).toEqual(["It answers 404."]);
    expect(byUrl("https://nowhere.acme.dev/")).toEqual(["The host doesn't exist."]);
    expect(byUrl("https://acme.dev/logo.png")).toEqual(["It isn't an image (text/html)."]);
    expect(byUrl("https://acme.dev/huge.jpg")[0]).toMatch(/A large image \(3.0 MB\)/);
    expect(byUrl("https://acme.dev/old")).toEqual(["It redirects to https://acme.dev/new."]);
    // A placeholder isn't requested.
    expect(byUrl("https://example.org/plans")).toEqual([expect.stringMatching(/^A placeholder address/)]);
  });

  it("requests an image with empty alt text: a note doesn't stand for a check of the URL", async () => {
    const requested: string[] = [];
    const fetchTable = fakeFetch({ "https://acme.dev/gone.png": { status: 404, type: "text/html" } });
    const report = await checkLinks(html('<img src="https://acme.dev/gone.png" alt=""><a href="https://acme.dev/{{id}}">Order</a>'), {
      dir: DIR,
      fetch: (input, init) => {
        requested.push(String(input));
        return fetchTable(input, init);
      },
    });
    const messages = report.findings.filter((f) => f.url === "https://acme.dev/gone.png").map((f) => `${f.level}: ${f.message}`);
    expect(messages).toEqual(["error: It answers 404.", expect.stringMatching(/^info: Empty alt text/)]);
    // A merge tag is still filled in later, so not requested.
    expect(requested).toEqual(["https://acme.dev/gone.png"]);
  });

  it("warns when Gmail would clip the email", async () => {
    const report = await checkLinks(html(`<p>${"x".repeat(GMAIL_CLIP_BYTES)}</p>`), { dir: DIR, network: false });
    expect(report.findings[0]).toMatchObject({ kind: "email", level: "warning", message: expect.stringMatching(/Gmail clips/) });
  });
});
