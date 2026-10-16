// @vitest-environment node
/**
 * The React versions the walker knows, and the check that the installed one has what it relies on: CI runs this on
 * each version in the table (see .github/workflows/test.yml), and weekly on React's canary.
 */
import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ID_PATTERN, KNOWN_REACT, reactRow, slotOf } from "./react-compat";
import { checkReact, probe } from "./self-test";

describe("the React compat table", () => {
  it("has the installed React's minor, or the nearest one before it", () => {
    const { row, known } = reactRow();
    expect(known, `React ${React.version} isn't in the table: add its row`).toBe(true);
    expect(React.version.startsWith(row.react + ".")).toBe(true);
    expect(reactRow("19.2.4").row.react).toBe("19.2");
    expect(reactRow("19.9.0")).toEqual({ row: KNOWN_REACT[KNOWN_REACT.length - 1], known: false });
    expect(reactRow("20.0.0-canary-abc").known).toBe(false);
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
