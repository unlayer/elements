/**
 * The string exporters write HTML as the React that's installed does (react-version.ts), and React 19 writes some
 * attributes, styles and children otherwise than React 18, which these tests run with (parity.test.tsx compares
 * with react-dom/server 18). Here React 19's: an element with each attribute name and value where React 19 writes
 * otherwise than React 18 (and each name with a string and a number), style properties and children, against what
 * react-dom/server 19.1.0 and 19.3.1 wrote for them (`__fixtures__/react-19.json`; 19.0 and 19.2 write the same as
 * 19.1, and 19.3 adds `credentialless` and `maskType`).
 */
import { describe, expect, it, vi } from "vitest";
import fixture from "./__fixtures__/react-19.json";

type Entry = [string, unknown, string, string?];

describe.each(["19.1.0", "19.3.1"])("as React %s", (version) => {
  it("writes each attribute, style and child as react-dom/server does", async () => {
    vi.resetModules();
    vi.doMock("react", async () => {
      const own = await vi.importActual<typeof import("react") & { default: object }>("react");
      return { ...own, version, default: { ...own.default, version } };
    });
    const { element } = await import("./markup");
    const differences: string[] = [];
    const expect19 = (entry: Entry) => (version === "19.3.1" && entry[3] !== undefined ? entry[3] : entry[2]);
    for (const entry of fixture.attributes as Entry[]) {
      const html = element("a", { [entry[0]]: entry[1] }, "t").html;
      if (html !== `<a${expect19(entry)}>t</a>`) differences.push(`${entry[0]}=${JSON.stringify(entry[1])}: ${html}`);
    }
    for (const entry of fixture.styles as Entry[]) {
      const html = element("div", { style: { [entry[0]]: entry[1] } }, "t").html;
      if (html !== `<div${entry[2]}>t</div>`) differences.push(`style ${entry[0]}: ${JSON.stringify(entry[1])}: ${html}`);
    }
    for (const [child, html] of fixture.children as [unknown, string][]) if (element("span", {}, child).html !== html) differences.push(`child ${JSON.stringify(child)}`);
    // (A BigInt, which JSON doesn't hold: React 19 renders it as a number, React 18 not at all.)
    if (element("span", {}, 10n).html !== "<span>10</span>") differences.push("child 10n");
    expect(differences).toEqual([]);
    expect(fixture.attributes.length).toBeGreaterThan(200);
  });
});
