// The comparison itself, without a browser: what it calls a difference, and what expected.json may excuse.
//   node --test harness.test.mjs   (npm test; after npm install)
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { differences } from "./harness/browser.mjs";
import { applyExpected } from "./harness/expected.mjs";
import { writeReports } from "./harness/report.mjs";

const EXPECTED = new URL("./expected.json", import.meta.url).pathname;

// Three words and two links, as collect() measures a page; `middle` is the link the middle word is in.
const page = (middle) => ({
  words: ["Open", "account", "settings"].map((t, i) => ({ t, box: [i * 100, 0, 80, 20], style: { color: "rgb(0, 0, 0)" }, link: [0, middle, 1][i] })),
  images: [],
  links: [
    { href: "/first", target: "", text: middle === 0 ? "Open account" : "Open" },
    { href: "/second", target: "", text: middle === 0 ? "settings" : "account settings" },
  ],
  height: 900,
  scrollWidth: 375,
  clientWidth: 375,
});

test("a link that goes elsewhere is a difference", () => {
  const changed = page(1);
  changed.links[0].href = "/changed";
  assert.ok(differences(page(1), changed, 1).some((d) => d.kind === "link"));
});

test("a word in another link is a difference, with the same links in the same order", () => {
  // <a href="/first">Open</a> <a href="/second">account settings</a> → <a href="/first">Open account</a> <a href="/second">settings</a>
  const found = differences(page(1), page(0), 1);
  assert.deepEqual(
    found.map((d) => d.line),
    ['link: 1 word(s) go to "/first" in place of "/second", first "account"'],
  );
});

// One template whose email at 600px differs as an email row's side padding fix does, plus `more`.
const template = (more) => ({
  id: "demo-welcome",
  source: "demo",
  module: "demo",
  problems: [],
  json: { status: "pass" },
  modes: {
    email: {
      problems: [],
      text: { status: "pass" },
      html: { status: "changed" },
      widths: {
        600: {
          status: "diff",
          differences: [
            { kind: "position", line: "position: 104 of 104 word(s) moved or resized beyond 1px" },
            { kind: "image", what: "box", line: 'image 1 "logo.png": (54,42,105,27) → (40,42,105,27)' },
            { kind: "paint", line: "paint: 3984 pixels painted differently" },
            ...more,
          ],
        },
      },
    },
  },
});

test("a declared fix is expected where it differs only as the fix does", () => {
  const t = template([]);
  const { matched, stale } = applyExpected([t], EXPECTED);
  assert.equal(t.modes.email.widths[600].status, "expected");
  assert.deepEqual([matched.length, stale.length], [1, 0]);
});

test("a declared fix doesn't excuse a difference of another kind at its width", () => {
  for (const other of [
    { kind: "text", line: 'text: "Welcome" is gone (at the start)' },
    { kind: "image", what: "gone", line: 'image: img "logo.png" (54,42,105,27) is gone' },
    { kind: "link", what: "words", line: 'link: 1 word(s) go to "/first" in place of "/second", first "account"' },
  ]) {
    const t = template([other]);
    const expectations = applyExpected([t], EXPECTED);
    const x = t.modes.email.widths[600];
    assert.equal(x.status, "diff", other.line);
    assert.deepEqual(x.differences, [other]);
    assert.equal(x.accepted.length, 3);
    const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "upgrade-sandbox-test-"));
    try {
      const pkg = { name: "@unlayer/react-elements", version: "0", how: "test", indexSha: "test" };
      const options = { widths: [600], modes: ["email"], tolerance: 1, paintTolerance: 8 };
      const report = writeReports({ sandbox: scratch, options, OLD: pkg, NEW: pkg, chromium: "none", templates: [t], skipped: [], moduleErrors: { old: [], new: [] }, phases: {}, durationMs: 0, expectations });
      assert.equal(report.differing, 1, other.line);
    } finally {
      fs.rmSync(scratch, { recursive: true, force: true });
    }
  }
});
