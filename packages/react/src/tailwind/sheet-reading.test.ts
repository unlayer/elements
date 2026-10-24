// @vitest-environment node
import { expect, it, vi } from "vitest";
import { classNameToDeclarations, loadTailwind } from "./index";
import { growth } from "../test-timing";

// Tailwind's stylesheets, as a handle builds them (each build is Tailwind's whole stylesheet again, read after it).
const sheets = vi.hoisted(() => ({ text: "" }));
vi.mock("./css", async (actual) => {
  const css = await actual<typeof import("./css")>();
  return { ...css, parseSheet: (text: string) => ((sheets.text = text), css.parseSheet(text)) };
});

// A spec of its own: what was slow here was so once Node 20 had optimized the reader on these stylesheets, which the
// builds of another spec's tests before it change.
it("reads a stylesheet in time linear in its size: each build reads Tailwind's whole stylesheet again", async () => {
  // Its comments were taken out a character at a time, which Node 20, once it had optimized it, ran in time growing
  // with the stylesheet's size squared: here 61 ms for the stylesheet of 1,600 classes (80 KB), 4.8 ms for 400's
  // (20 KB); a compiler's of 2,400 (114 KB) took 118 ms, read after each of its builds.
  const { parseSheet } = await vi.importActual<typeof import("./css")>("./css");
  const handle = await loadTailwind({ theme: { extend: { colors: { brand: "#007291" } } } });
  const built: string[] = [];
  for (let r = 0; r < 4; r++) {
    classNameToDeclarations(handle, Array.from({ length: 400 }, (_, i) => `indent-[${r * 400 + i}px]`).join(" "));
    built.push(sheets.text);
  }
  const time = (i: number) => {
    const start = performance.now();
    parseSheet(built[i]);
    return performance.now() - start;
  };
  // (Each read a few times first, in order, as a handle reads them: Node 20 optimizes the reader as it goes.)
  for (let i = 0; i < 4; i++) for (let k = 0; k < 3; k++) time(i);
  const { small, large, grows } = await growth(time, [0, 3], { ratio: 8, floor: 20 });
  expect(grows ? `${small.toFixed(1)} ms for ${built[0].length} characters, ${large.toFixed(1)} ms for ${built[3].length}` : "linear").toBe("linear");
});
