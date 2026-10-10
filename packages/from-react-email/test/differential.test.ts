/**
 * Pairs the differential test (bench/differential.ts) found the check passing
 * while Chromium shows them differently, each fixed and kept here: the check
 * must fail every one. The differential run also confirms in Chromium that
 * each still differs, so a fixture can't be wrong.
 */
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { checkFails, compareText } from "../src/index";

const folder = path.join(import.meta.dirname, "differential");
const fixtures = fs.readdirSync(folder).filter((f) => f.endsWith(".json")).sort();

describe("pairs Chromium shows differently", () => {
  it("has fixtures to replay", () => {
    expect(fixtures.length).toBeGreaterThan(0);
  });

  it.each(fixtures)("%s fails the check", (file) => {
    const { why, original, migrated } = JSON.parse(fs.readFileSync(path.join(folder, file), "utf8"));
    expect(checkFails(compareText(original, migrated)), why).toBe(true);
  });
});
