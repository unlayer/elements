/**
 * The generated code type-checks against the package's types: every design codegen's tests convert, as modules of
 * one TypeScript program with the package's type-check settings (strict, the automatic JSX runtime).
 */
import { describe, expect, it } from "vitest";
import path from "node:path";
import { DESIGNS } from "./__fixtures__/designs";
import { quiet, SOURCES } from "./__fixtures__/sources";
import { designToElements } from "./design-to-elements";
import { PACKAGE, typecheck, valuesShapesModule } from "./test-harness";

describe("generated code", () => {
  it("type-checks against the package's types", () => {
    const modules = new Map<string, string>();
    const add = (name: string, code: string) => modules.set(path.join(PACKAGE, "src/codegen/__generated__", `${name.replace(/\W+/g, "-")}-${modules.size}.tsx`), code);
    for (const [name, c] of Object.entries(DESIGNS)) add(name, quiet(() => designToElements(c.design, c.options)).code);
    for (const c of SOURCES) add(c.name, quiet(() => designToElements(c.design(), { displayMode: c.displayMode })).code);
    expect(typecheck(modules)).toEqual([]);
  }, 120_000);

  it("writes `values` as they are where they type-check, from the keys the types have (values-shapes.ts is current)", async () => {
    // (When the types change: `vitest run src/codegen -u` writes it again.)
    await expect(valuesShapesModule()).toMatchFileSnapshot("./values-shapes.ts");
  }, 60_000);
});
