// @vitest-environment node
/**
 * The React versions the walker knows, and the check that the installed one has what it relies on: CI runs this on
 * each version in the table (see .github/workflows/react-versions.yml), and weekly on React's canary.
 */
import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ID_PATTERN, KNOWN_REACT, reactRow, slotOf } from "./react-compat";
import { checkReact, probe, untested } from "./self-test";

describe("the React compat table", () => {
  it("has the installed React's minor, or (a newer one) the nearest one before it", () => {
    const { row, known } = reactRow();
    const newest = KNOWN_REACT[KNOWN_REACT.length - 1];
    const newer = Number.parseFloat(React.version) > Number.parseFloat(newest.react);
    // A version the table should have (one before its newest) is in it; a newer one renders if the self-check passes.
    if (!newer) expect(known, `React ${React.version} isn't in the table: add its row`).toBe(true);
    if (known) expect(React.version.startsWith(row.react + ".")).toBe(true);
    else expect(row).toBe(newest);
    expect(reactRow("19.2.4").row.react).toBe("19.2");
    expect(reactRow("19.9.0")).toEqual({ row: KNOWN_REACT[KNOWN_REACT.length - 1], known: false });
    expect(reactRow("20.0.0-canary-abc").known).toBe(false);
    // React 18's every minor (the peer range's), 18.0.0 with its build in its version.
    for (const v of ["18.0.0-fc46dba67-20220329", "18.1.0", "18.2.0", "18.3.1"]) expect(reactRow(v), v).toMatchObject({ row: { react: v.slice(0, 4) }, known: true });
    expect(reactRow("17.0.2")).toEqual({ row: KNOWN_REACT[0], known: false, older: true });
  });

  it("says a React it isn't tested with is newer, or older, than those it is", () => {
    expect(untested("19.9.0")).toBe(`[Unlayer] React 19.9.0 is newer than the versions Elements is tested with (18.0–19.3); it passed Elements' check of the React it relies on.`);
    expect(untested("17.0.2")).toMatch(/^\[Unlayer\] React 17\.0\.2 is older than the versions Elements is tested with \(18\.0–/);
  });

  it("gives useId's format as the installed react-dom/server writes it", () => {
    const ids: string[] = [];
    const Probe = () => (ids.push(React.useId(), React.useId()), null);
    renderToStaticMarkup(React.createElement(React.Fragment, null, React.createElement(Probe), React.createElement(Probe)));
    for (const id of ids) expect(id).toMatch(ID_PATTERN[reactRow().row.id]);
  });

  it("passes the self-check on the installed React", () => {
    expect(() => checkReact()).not.toThrow();
    expect(probe(reactRow().row)).toBeUndefined();
  });

  it("names what a React without the shapes it relies on lacks", () => {
    const { row } = reactRow();
    expect(slotOf({}, row.slots)).toBeNull();
    expect(probe(row, {}, null)).toBe(`its hooks dispatcher isn't at ${row.slots.join(" or ")}`);
    // A dispatcher slot that doesn't reach the walker's hooks.
    const deaf = { get: () => null, set: () => {}, path: "fake.H" };
    expect(probe(row, React, deaf)).toBe("the dispatcher didn't install at fake.H");
  });
});
