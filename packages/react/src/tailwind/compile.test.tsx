// @vitest-environment node
import React from "react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";
import { Column, Email, Html, Paragraph, Row, renderToHtml as renderToHtmlNow, renderToHtmlParts as renderToHtmlPartsNow, renderToJson as renderToJsonNow } from "../index";
import { Markdown } from "../markdown";
import {
  Tailwind,
  classNameToDeclarations,
  loadTailwind,
  renderToHtml,
  renderToHtmlParts,
  renderToJson,
  renderToPlainText,
  type ClassDeclaration,
  type TailwindHandle,
} from "./index";
import { CLASSES, SUSPECTS, declarationReader, type Compiler, type PluginFailure, type ReadScope } from "./declarations";
import { parseSheet } from "./css";
import { CONFIGS } from "./load";

// Tailwind as it is, its compilers counted once compiled (a handle compiles a fresh one after building many classes),
// and their builds (each one Tailwind's whole stylesheet again).
const compiled = vi.hoisted(() => ({ count: 0, builds: 0, candidates: 0 }));
vi.mock("tailwindcss", async (actual) => {
  const tailwind = await actual<Record<string, any>>();
  const compile = async (...args: unknown[]) => {
    const compiler = await tailwind.compile(...args);
    compiled.count++;
    const build = compiler.build;
    compiler.build = (candidates: string[]) => (compiled.builds++, (compiled.candidates += candidates.length), build.call(compiler, candidates));
    return compiler;
  };
  return { ...tailwind, compile };
});

const config = { theme: { extend: { colors: { brand: "#007291" } } } };
let tw: TailwindHandle;
beforeAll(async () => {
  tw = await loadTailwind(config);
});

let warn: MockInstance;
beforeEach(() => {
  warn = vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => warn.mockRestore());

/** Each declaration as `class when property: value`. */
const read = (className: string) =>
  classNameToDeclarations(tw, className).declarations.map((d: ClassDeclaration) => `${d.className} ${d.when} ${d.property}: ${d.value}${d.important ? " !important" : ""}`);

describe("classNameToDeclarations", () => {
  it("converts Tailwind's oklch palette and opacity modifiers to the colors email clients read", () => {
    expect(read("bg-gray-100 text-red-500 border-blue-800 text-brand bg-black/50 bg-brand/50")).toEqual([
      "border-blue-800 always border-color: #193cb8",
      "bg-black/50 always background-color: rgba(0, 0, 0, 0.5)",
      "bg-brand/50 always background-color: rgba(0, 114, 145, 0.5)",
      "bg-gray-100 always background-color: #f3f4f6",
      "text-brand always color: #007291",
      "text-red-500 always color: #fb2c36",
    ]);
    // Arbitrary values in other color spaces, and a translucent hex Outlook can't read.
    expect(read("text-[hsl(0_100%_50%)] text-[lab(50%_0_0)] text-[oklch(62.8%_0.2577_29.23)] bg-[rgb(1_2_3)] bg-[#ff000080]").map((d) => d.split(": ")[1])).toEqual(
      expect.arrayContaining(["#ff0000", "#777777", "#010203", "rgba(255, 0, 0, 0.502)"])
    );
  });

  it("gives sizes in pixels, with variables and calc() worked out", () => {
    expect(read("p-6 text-lg max-w-xl w-1/2 rounded-full px-[13px] tracking-wide -mt-2")).toEqual([
      "-mt-2 always margin-top: -8px",
      "w-1/2 always width: 50%",
      "max-w-xl always max-width: 576px",
      "rounded-full always border-radius: 9999px",
      "p-6 always padding: 24px",
      "px-[13px] always padding-inline: 13px",
      "text-lg always font-size: 18px",
      "text-lg always line-height: 1.5556",
      "tracking-wide always letter-spacing: 0.025em",
    ]);
    // An element's own variables: `leading-6` sets the line height `text-lg` reads.
    expect(read("text-lg leading-6")).toContain("text-lg always line-height: 24px");
    expect(read("border")).toEqual(["border always border-style: solid", "border always border-width: 1px"]);
    expect(read("!p-4")).toEqual(["!p-4 always padding: 16px !important"]);
  });

  it("works out variables that use each other many times over at once, leaving out (and saying) a value past 4,096 characters", () => {
    // `--v0` uses `--v1` twice, which uses `--v2` twice, and so on: 2^n characters, from n × 30 of classes (which a
    // Markdown's HTML can carry, as its sanitizer keeps them).
    const chain = (n: number, property: string) => [...Array.from({ length: n }, (_, i) => `[--v${i}:var(--v${i + 1})_var(--v${i + 1})]`), `[--v${n}:x]`, `[${property}:var(--v0)]`].join(" ");
    expect(read(chain(4, "font-family"))).toEqual([`[font-family:var(--v0)] always font-family: ${Array(16).fill("x").join(" ")}`]);
    expect(read(chain(11, "font-family"))[0]).toHaveLength(4095 + "[font-family:var(--v0)] always font-family: ".length);
    const start = performance.now();
    for (const n of [12, 20, 31]) {
      expect(classNameToDeclarations(tw, chain(n, "color")), `${n}`).toEqual({
        declarations: [],
        ignored: [{ className: "[color:var(--v0)]", reason: "`color`'s variables come to more than 4096 characters" }],
      });
    }
    // (Without the limit, 31 would run the process out of memory.)
    expect(performance.now() - start).toBeLessThan(5000);
  }, 30000);

  it("says when each applies: phones, above a breakpoint, on hover", () => {
    expect(read("max-sm:p-2 max-[480px]:text-sm md:p-8 hover:bg-blue-500")).toEqual([
      "hover:bg-blue-500 hover background-color: #2b7fff",
      "max-[480px]:text-sm phone font-size: 14px",
      "max-[480px]:text-sm phone line-height: 1.4286",
      "max-sm:p-2 phone padding: 8px",
      "md:p-8 desktop padding: 32px",
    ]);
  });

  it("lists the classes that don't apply in an email, with why", () => {
    expect(classNameToDeclarations(tw, "dark:bg-black print:hidden focus:underline space-y-4 group-hover:text-red-500 max-sm:hover:bg-red-500 nonsense").ignored).toEqual([
      { className: "dark:bg-black", reason: "it applies only for @media (prefers-color-scheme: dark)" },
      { className: "print:hidden", reason: "it applies only for @media print" },
      { className: "focus:underline", reason: "it applies only for `:focus`" },
      { className: "space-y-4", reason: "it styles other elements (`:where(.space-y-4 > :not(:last-child))`)" },
      { className: "group-hover:text-red-500", reason: "it applies only for `:is(:where(.group):hover *)`" },
      { className: "max-sm:hover:bg-red-500", reason: "Elements has no hover style for one screen size" },
      { className: "nonsense", reason: "Tailwind has no such class" },
    ]);
  });

  it("knows a class by its own name in its rule's selector, wherever it is there (after a variant's `.group` or `.dark`)", async () => {
    const reasons = (handle: TailwindHandle, className: string) => classNameToDeclarations(handle, className).ignored.map(({ className, reason }) => `${className}: ${reason}`);
    // `group` is a class no rule is for: it stays the user's, though rules for other classes have it.
    expect(reasons(tw, "group [.group:hover_&]:underline [.dark_&]:p-2 in-hover:p-1")).toEqual([
      "group: Tailwind has no such class",
      "[.group:hover_&]:underline: it applies only for `.group:hover &`",
      "[.dark_&]:p-2: it applies only for `.dark &`",
      "in-hover:p-1: it applies only for `:where(*:hover) &`",
    ]);
    // A config's own variants (a plugin's `addVariant`).
    const variants = { handler: ({ addVariant }: { addVariant: (name: string, selector: string) => void }) => (addVariant("group-on", ".group:hover &"), addVariant("peer-on", ".peer:checked ~ &")) };
    expect(reasons(await loadTailwind({ plugins: [variants] }), "peer group-on:text-white peer-on:underline")).toEqual([
      "peer: Tailwind has no such class",
      "group-on:text-white: it applies only for `.group:hover &`",
      "peer-on:underline: it applies only for `.peer:checked ~ &`",
    ]);
  });

  it("gives a class string the same declarations whatever its compiler built before", async () => {
    // Tailwind's compiler builds every class it's been given, in an order of its own, each with the theme's variables
    // and the registered properties it uses: a class string read after thousands of others reads as on its own.
    const theme = { theme: { extend: { colors: { brand: "#007291", accent: "var(--color-blue-500)" } } } };
    const others: string[] = [];
    for (const color of ["red-500", "blue-500", "gray-100", "brand", "accent", "black", "white"])
      for (const utility of ["text", "bg", "border", "ring", "shadow", "from", "via", "to", "outline", "decoration", "divide"]) others.push(`${utility}-${color}`, `hover:${utility}-${color}`, `max-sm:${utility}-${color}/50`);
    for (const n of [0, 1, 2, 4, 8, 16]) for (const utility of ["p", "px", "pl", "m", "-mt", "w", "max-w", "space-y", "translate-x", "ring", "ring-offset", "border", "outline"]) others.push(`${utility}-${n}`, `md:${utility}-${n}`, `!${utility}-${n}`);
    for (const size of ["sm", "md", "lg", "xl"]) others.push(`shadow-${size}`, `rounded-${size}`, `blur-${size}`, `drop-shadow-${size}`, `inset-shadow-${size}`, `text-${size}`);
    others.push("font-sans", "font-serif", "leading-6", "tracking-wide", "rotate-3", "scale-95", "bg-linear-to-r", "border-dashed", "italic", "underline");
    for (let i = 0; i < 2000; i++) others.push(`w-[${i}px]`, `text-[#${(i * 40503).toString(16).padStart(6, "0").slice(-6)}]`, `[--tw-x-${i % 9}:${i}px]`);
    const strings = [
      "bg-brand text-white text-accent opacity-50 bg-black/50 text-brand/75",
      "text-lg leading-6",
      "border border-2 border-dashed border-red-500",
      "shadow-md shadow-red-500/50 ring-2 ring-blue-500 ring-offset-2 inset-shadow-sm",
      "max-sm:p-2 md:p-8 hover:bg-blue-500 max-[480px]:text-sm",
      "!p-4 p-2 px-4 pl-1 py-[3px]",
      "font-sans font-serif rounded-lg rounded-t-none translate-x-2 rotate-3",
      "bg-linear-to-r from-red-500 via-white to-blue-500",
      "[--tw-x-3:9px] w-[var(--tw-x-3)] w-1/2 -mt-2",
      "space-y-4 dark:bg-black nonsense",
    ];
    const fresh = await Promise.all(strings.map((_, i) => loadTailwind({ ...theme, fresh: i })));
    const warmed = await loadTailwind({ ...theme, warmed: true });
    // (Read without waiting from here on: a compiler it compiles meanwhile isn't swapped in.)
    for (const other of others.slice(0, 50).reverse()) classNameToDeclarations(warmed, other);
    classNameToDeclarations(warmed, others.join(" "));
    for (const [i, className] of strings.entries()) expect(classNameToDeclarations(warmed, className), className).toEqual(classNameToDeclarations(fresh[i], className));
    // (Thousands of classes built: about half a second here, ten on a CI runner.)
  }, 60_000);

  it("reads the classes after one it can't read as before: a class can't change how the stylesheet reads", async () => {
    const handle = await loadTailwind({ ...config, hostile: true });
    const unreadable = "it isn't a class Tailwind can read here";
    const asFresh = (after: string) => {
      for (const normal of ["text-red-500", "p-2", "bg-blue-500/50", "before:content-['a']"]) expect(classNameToDeclarations(handle, normal), `${normal} after ${after}`).toEqual(classNameToDeclarations(tw, normal));
    };
    // Brackets, parentheses, braces or quotes left open (an escaped one doesn't close), a comment: refused, never built.
    for (const hostile of ["[color:x(]", "[color:/*]", "[color:*/]", "bg-[x\\]", "[color:x{]", "[content:'a]", "[content:'a\\']"]) {
      expect(classNameToDeclarations(handle, `${hostile} text-red-500`).ignored, hostile).toEqual([{ className: hostile, reason: unreadable }]);
      asFresh(hostile);
    }
    // Quotes in a value, escaped ones in its selector: built, and read as CSS reads them.
    for (const quoted of ['[background-image:image-set("x.png"_1x)]', "[content:'a\\'b']", '[content:"a\\"b"]']) {
      expect(classNameToDeclarations(handle, quoted).ignored, quoted).toEqual([]);
      asFresh(quoted);
    }
    expect(classNameToDeclarations(handle, '[background-image:image-set("x.png"_1x)]').declarations.map((d) => d.value)).toEqual(['image-set("x.png" 1x)']);
    // What Tailwind can read stays readable: quotes and brackets closed, an escape in a string.
    expect(classNameToDeclarations(handle, "before:content-['\\201C'] font-['Open_Sans'] [&>*]:p-2 max-[480px]:p-1").ignored.map((i) => i.reason)).not.toContain(unreadable);
  });

  it("keeps every class reading as on a fresh handle, whatever hostile classes it's given (fuzzed)", async () => {
    // `TAILWIND_POISON_FUZZ_RUNS=5000` for a longer run, `TAILWIND_POISON_FUZZ_SEED` for other inputs.
    const runs = Number(process.env.TAILWIND_POISON_FUZZ_RUNS ?? 300);
    const handle = await loadTailwind({ ...config, fuzzed: true });
    const normals = ["text-red-500", "p-2", "px-4", "bg-blue-500/50", "font-bold", "rounded-md", "border-2", "md:p-4", "hover:underline", "max-sm:text-sm", "w-[10px]", "text-[#123456]", "leading-6", "shadow-md", "before:content-['a']", "font-['Open_Sans']", "bg-[url(x.png)]", "text-brand"];
    const opens = ["[color:", "bg-[", "[content:", "before:content-[", "[background-image:", "w-[", "font-[", "[--x:", "max-[", "[&"];
    const parts = ["x", "1px", "(", ")", "[", "]", "{", "}", '"', "'", "\\", '\\"', "/*", "*/", "_", "url(", "a.png", ";", ":", "@media", "&", ".x", ",", "!important", "<", "%", "#", "\\72"];
    const r = random(Number(process.env.TAILWIND_POISON_FUZZ_SEED ?? 20261018));
    const pick = (list: string[]) => list[Math.floor(r() * list.length)];
    const expected = new Map(normals.map((normal) => [normal, classNameToDeclarations(tw, normal)]));
    const bad: string[] = [];
    for (let run = 0; run < runs && bad.length < 5; run++) {
      const tokens: string[] = [];
      for (let n = Math.floor(r() * 3); n >= 0; n--) tokens.push(pick(normals));
      for (let n = Math.floor(r() * 4); n > 0; n--) {
        let hostile = pick(opens);
        for (let k = 1 + Math.floor(r() * 4); k > 0; k--) hostile += pick(parts);
        tokens.splice(Math.floor(r() * (tokens.length + 1)), 0, hostile + (r() < 0.6 ? "]" : ""));
      }
      classNameToDeclarations(handle, tokens.join(" "));
      for (const normal of normals) {
        const read = classNameToDeclarations(handle, normal);
        if (JSON.stringify(read) !== JSON.stringify(expected.get(normal))) bad.push(`${JSON.stringify(tokens.join(" "))}: then \`${normal}\` reads ${JSON.stringify(read)}`);
      }
    }
    expect(bad).toEqual([]);
  }, 120000);

  it("takes only a compiled Tailwind", () => {
    expect(() => classNameToDeclarations({ config } as TailwindHandle, "p-2")).toThrow(/takes the compiled Tailwind/);
  });
});

describe("loadTailwind", () => {
  it("compiles a config once: the same object, or one equal to it", async () => {
    expect(await loadTailwind(config)).toBe(tw);
    expect(await loadTailwind({ theme: { extend: { colors: { brand: "#007291" } } } })).toBe(tw);
    expect(await loadTailwind()).not.toBe(tw);
    expect(tw.config).toBe(config);
    expect(warn).not.toHaveBeenCalled();
  });

  it("keeps the configs used last compiled: one used longer ago is compiled again, and its handle keeps working", async () => {
    // A server rendering each customer's theme: the 50 themes used last stay compiled, not every one it has rendered.
    const themed = (i: number) => ({ theme: { extend: { colors: { brand: `#${(0x100000 + i).toString(16)}` } } } });
    const handles: TailwindHandle[] = [];
    for (let i = 0; i < CONFIGS; i++) handles.push(await loadTailwind(themed(i)));
    // Used again (an equal config: the same handle), it's the last to go.
    expect(await loadTailwind(themed(0))).toBe(handles[0]);
    await loadTailwind(themed(CONFIGS));
    expect(await loadTailwind(themed(0))).toBe(handles[0]);
    const again = await loadTailwind(themed(1));
    expect(again).not.toBe(handles[1]);
    for (const handle of [handles[1], again]) expect(classNameToDeclarations(handle, "text-brand").declarations[0].value).toBe("#100001");
  });

  it("compiles a fresh compiler past the classes it keeps, reading as before", async () => {
    const handle = await loadTailwind({ theme: { extend: { colors: { brand: "#007291" } } }, fresh: "classes" });
    const before = classNameToDeclarations(handle, "text-brand shadow-md max-sm:p-2 border");
    const count = compiled.count;
    for (let i = 0; i <= CLASSES; i += 500) classNameToDeclarations(handle, Array.from({ length: 500 }, (_, j) => `w-[${i + j}px]`).join(" "));
    await vi.waitFor(() => expect(compiled.count).toBe(count + 1));
    expect(classNameToDeclarations(handle, "text-brand shadow-md max-sm:p-2 border")).toEqual(before);
    expect(classNameToDeclarations(handle, "w-[3px]").declarations[0].value).toBe("3px");
  });

  it("compiles a config changed in place as it is now, the handles given before working as they did", async () => {
    // It was known by the object: the theme it had when it was first compiled, whatever it said after.
    const theme = { theme: { extend: { colors: { brand: "#ff0000" } } } };
    const red = await loadTailwind(theme);
    theme.theme.extend.colors.brand = "#0000ff";
    const blue = await loadTailwind(theme);
    expect(blue).not.toBe(red);
    expect(classNameToDeclarations(blue, "text-brand").declarations[0].value).toBe("#0000ff");
    expect(classNameToDeclarations(red, "text-brand").declarations[0].value).toBe("#ff0000");
    // Changed back, it's the handle of that text again; equal to another config, that one's.
    theme.theme.extend.colors.brand = "#ff0000";
    expect(await loadTailwind(theme)).toBe(red);
    expect(await loadTailwind({ theme: { extend: { colors: { brand: "#0000ff" } } } })).toBe(blue);
    // A handle's fresh compiler (past the classes it keeps) is compiled from what it was compiled from.
    theme.theme.extend.colors.brand = "#00ff00";
    const count = compiled.count;
    for (let i = 0; i <= CLASSES; i += 500) classNameToDeclarations(red, Array.from({ length: 500 }, (_, j) => `w-[${i + j}px]`).join(" "));
    await vi.waitFor(() => expect(compiled.count).toBe(count + 1));
    expect(classNameToDeclarations(red, "text-brand").declarations[0].value).toBe("#ff0000");
    theme.theme.extend.colors.brand = "#ff0000";
    // The async renderers, given the same object changed between renders.
    const template = () => <Tailwind config={theme}><Email><Row><Column><Paragraph className="text-brand">Hi</Paragraph></Column></Row></Email></Tailwind>;
    expect(await renderToHtml(template())).toContain("color: #ff0000");
    theme.theme.extend.colors.brand = "#0000ff";
    expect(await renderToHtml(template())).toContain("color: #0000ff");
    expect(warn).not.toHaveBeenCalled();
  });

  it("compiles a config with functions changed in place again where what isn't a function changed, saying so once", async () => {
    // (Its functions can't be compared: one changed in place isn't seen.)
    const withPlugin = { plugins: [() => {}], theme: { extend: { colors: { brand: "#ff0000" } } } };
    const red = await loadTailwind(withPlugin);
    expect(await loadTailwind(withPlugin)).toBe(red);
    withPlugin.theme.extend.colors.brand = "#0000ff";
    const blue = await loadTailwind(withPlugin);
    expect(blue).not.toBe(red);
    expect(classNameToDeclarations(blue, "text-brand").declarations[0].value).toBe("#0000ff");
    expect(await loadTailwind(withPlugin)).toBe(blue);
    withPlugin.theme.extend.colors.brand = "#00ff00";
    expect(classNameToDeclarations(await loadTailwind(withPlugin), "text-brand").declarations[0].value).toBe("#00ff00");
    const said = warn.mock.calls.map((call) => String(call[0]));
    expect(said.filter((message) => /changed since it was compiled/.test(message))).toEqual([
      "[Unlayer] loadTailwind: a config with functions (plugins) changed since it was compiled, so it's compiled again: give a changed config as a new object (a function changed in place isn't seen).",
    ]);
  });

  it("says a config with functions is compiled again for each object", async () => {
    const plugin = () => {};
    const withPlugin = { plugins: [plugin] };
    const handle = await loadTailwind(withPlugin);
    expect(await loadTailwind(withPlugin)).toBe(handle);
    expect(await loadTailwind({ plugins: [plugin] })).not.toBe(handle);
    expect(warn).toHaveBeenCalledTimes(2);
    expect(String(warn.mock.calls[0][0])).toMatch(/config holds functions \(plugins\).*define it once, outside your components/);
  });
});

describe("the stylesheet's reader", () => {
  it("reads CSS as CSS does: an escape, a string, a comment or a bracket in a rule doesn't change how the rules after it read", () => {
    const sheet = parseSheet(
      [
        ".a\\(\\] { color: red; }",
        '.b\\"x { content: "}"; }',
        ".c { content: '/* not a comment {'; }",
        "/* a comment: } { */",
        '.d { background: url("a;b.png"); margin: 1px; }',
        ".e\\{ { color: x(}); }",
        ".f { color: blue; }",
      ].join("\n")
    );
    expect(sheet.clean).toBe(true);
    expect(sheet.rules.map((rule) => [rule.token, rule.declarations.map((d) => `${d.property}: ${d.value}`)])).toEqual([
      ["a(]", ["color: red"]],
      ['b"x', ['content: "}"']],
      ["c", ["content: '/* not a comment {'"]],
      ["d", ['background: url("a;b.png")', "margin: 1px"]],
      ["e{", ["color: x(})"]],
      ["f", ["color: blue"]],
    ]);
    // What runs to its end (a block, a bracket, a string, a comment left open) or closes what isn't open isn't clean.
    for (const css of [".a { color: red;", ".a { color: x(; } .b { color: red; }", ".a { content: 'x; }\n", ".a { color: red; } /* x", ".a { color: red; } } .b { color: red; }"]) expect(parseSheet(css).clean, css).toBe(false);
  });
});

describe("a handle's reader of classes", () => {
  /** A compiler that gives each class it's built a rule, as Tailwind gives the stylesheet of all so far. */
  const counting = () => {
    const built: string[] = [];
    return { built, build: (classes: string[]) => (built.push(...classes), built.map((c) => `.${c} { margin: 1px; }`).join("\n")) };
  };
  /** A compiler whose stylesheet, once it has built `evil`, never reads cleanly: as Tailwind keeps every class it built. */
  const poisoned = () => {
    const built: string[] = [];
    return { built, build: (classes: string[]) => (built.push(...classes), built.map((c) => (c === "evil" ? `.${c} { color: x(; }` : `.${c} { margin: 1px; }`)).join("\n")) };
  };
  const settled = () => new Promise((resolve) => setTimeout(resolve, 0));

  it("swaps its compiler for a fresh one past its classes, once that's ready, the old one read till then", async () => {
    const old = counting();
    const fresh = counting();
    let ready!: (compiler: Compiler) => void;
    const renew = vi.fn(() => new Promise<Compiler>((resolve) => (ready = resolve)));
    const read = declarationReader(old, renew, 3);
    read("a b");
    read("b c");
    expect(renew).not.toHaveBeenCalled();
    read("d");
    read("e");
    expect(renew).toHaveBeenCalledTimes(1);
    expect(old.built).toEqual(["a", "b", "c", "d", "e"]);
    ready(fresh);
    await Promise.resolve();
    expect(read("a f").declarations.map((d) => d.className)).toEqual(["a", "f"]);
    expect(fresh.built).toEqual(["a", "f"]);
    expect(old.built).toHaveLength(5);
  });

  it("drops the classes of a build it can't read cleanly, keeps reading the others, and compiles a fresh compiler without them", async () => {
    const compilers = [poisoned(), poisoned(), poisoned()];
    const ready: Array<(compiler: Compiler) => void> = [];
    const renew = vi.fn(() => new Promise<Compiler>((resolve) => ready.push(resolve)));
    const read = declarationReader(compilers[0], renew);
    const classes = (className: string) => read(className).declarations.map((d) => d.className);
    const because = (reason: string) => (className: string) => read(className).ignored.filter((i) => i.reason === reason).map((i) => i.className);
    const unreadable = because("it isn't a class Tailwind can read here");
    const waiting = because("it's read once Tailwind has compiled again, after a class it couldn't read");
    expect(classes("a")).toEqual(["a"]);
    // `evil` and `b`, built together, are left out till a fresh compiler is ready; `a` reads as before.
    expect(waiting("b evil")).toEqual(["b", "evil"]);
    expect(classes("a")).toEqual(["a"]);
    expect(renew).toHaveBeenCalledTimes(1);
    // Till it's ready, nothing more is built on the one that can't read.
    expect(waiting("c")).toEqual(["c"]);
    expect(compilers[0].built).toEqual(["a", "b", "evil"]);
    ready[0](compilers[1]);
    await Promise.resolve();
    // On the fresh one, each class of that build is built alone first: `b` reads, `evil` is refused for good.
    expect(classes("b c a")).toEqual(["b", "c", "a"]);
    expect(unreadable("evil")).toEqual(["evil"]);
    expect(renew).toHaveBeenCalledTimes(2);
    ready[1](compilers[2]);
    await Promise.resolve();
    expect(classes("evil d")).toEqual(["d"]);
    expect(unreadable("evil")).toEqual(["evil"]);
    expect(compilers[2].built).toEqual(["d"]);
    expect(renew).toHaveBeenCalledTimes(2);
  });

  it("keeps a plugin's error it finds no class of a build for to the render that built them: there, its classes with no CSS fail", () => {
    // A failure whose name no class of the build has (Tailwind called the function for a class the reader can't tie
    // it to): `odd`, with no CSS, could be why; `a`, with CSS, couldn't. Another render's classes aren't a part of it.
    const failures: PluginFailure[] = [];
    const built: string[] = [];
    const compiler: Compiler = {
      failures,
      build: (classes) => (built.push(...classes), classes.includes("odd") && failures.push({ name: "elsewhere", error: new Error("stray") }), built.filter((c) => c !== "odd").map((c) => `.${c} { margin: 1px; }`).join("\n")),
    };
    const read = declarationReader(compiler);
    const render: ReadScope = { strays: [] };
    read.prepare("a odd", render);
    expect(read("a", render).declarations.map((d) => d.className)).toEqual(["a"]);
    expect(() => read("odd", render)).toThrow("stray");
    expect(() => read("a odd", render)).toThrow("stray");
    // Another render reads them as Tailwind gives them: `odd` as a class Tailwind doesn't have.
    expect(read("odd a").ignored).toEqual([{ className: "odd", reason: "Tailwind has no such class" }]);
    expect(read("a").declarations.map((d) => d.className)).toEqual(["a"]);
  });

  it("builds the classes `prepare` is given at once, without reading them: reading them after builds nothing", () => {
    const compiler = counting();
    const build = vi.fn(compiler.build);
    const read = declarationReader({ build });
    read.prepare("a b  c a");
    expect([build.mock.calls.length, compiler.built]).toEqual([1, ["a", "b", "c"]]);
    expect(read("c a").declarations.map((d) => d.className)).toEqual(["a", "c"]);
    read.prepare("b c");
    expect(build).toHaveBeenCalledTimes(1);
  });

  it(`builds alone at most ${SUSPECTS} of the classes of a build it can't read cleanly on one compiler, the others on the next: only the one that was why is refused`, async () => {
    // A render's classes are built at once: built alone, each one Tailwind's whole stylesheet again, they'd take the
    // square of their number. One render with a build that didn't read cleanly can't take an app's `p-4` away from
    // the renders after it, on a handle every tenant shares.
    const compilers = [poisoned(), poisoned(), poisoned(), poisoned()];
    const ready: Array<(compiler: Compiler) => void> = [];
    const renew = vi.fn(() => new Promise<Compiler>((resolve) => ready.push(resolve)));
    const read = declarationReader(compilers[0], renew);
    const tokens = [...Array.from({ length: SUSPECTS + 50 }, (_, i) => `c${i}`), "p-4", "evil"];
    const classes = tokens.join(" ");
    const reasons = (found: { ignored: Array<{ reason: string }> }) => [...new Set(found.ignored.map((i) => i.reason))];
    read.prepare(classes);
    ready[0](compilers[1]);
    await Promise.resolve();
    const build = vi.spyOn(compilers[1], "build");
    const first = read(classes);
    expect(build).toHaveBeenCalledTimes(SUSPECTS);
    expect(first.declarations.map((d) => d.className)).toEqual(tokens.slice(0, SUSPECTS));
    // The others wait for the next compiler (asked for now), not refused.
    expect(first.ignored.map((i) => i.className)).toEqual(tokens.slice(SUSPECTS));
    expect(reasons(first)).toEqual(["it's read once Tailwind has compiled again, after a class it couldn't read"]);
    expect(renew).toHaveBeenCalledTimes(2);
    ready[1](compilers[2]);
    await Promise.resolve();
    // On it, they're built alone: `p-4` reads, `evil` is refused for good.
    const second = read(classes);
    expect(second.declarations.map((d) => d.className)).toEqual(tokens.slice(SUSPECTS, -1));
    expect(read("evil").ignored).toEqual([{ className: "evil", reason: "it isn't a class Tailwind can read here" }]);
    ready[2](compilers[3]);
    await Promise.resolve();
    const third = read(classes);
    expect(third.declarations.map((d) => d.className)).toEqual(tokens.slice(0, -1));
    expect(third.ignored).toEqual([{ className: "evil", reason: "it isn't a class Tailwind can read here" }]);
    expect(compilers[3].built).not.toContain("evil");
  });

  it("asks again for a fresh compiler that failed, on the next read that needs one", async () => {
    const compilers = [poisoned(), poisoned()];
    let failing = 2;
    const renew = vi.fn(() => (failing-- > 0 ? Promise.reject(new Error("out of memory")) : Promise.resolve<Compiler>(compilers[1])));
    const read = declarationReader(compilers[0], renew);
    const classes = (className: string) => read(className).declarations.map((d) => d.className);
    expect(classes("a b evil")).toEqual([]);
    await settled();
    expect(renew).toHaveBeenCalledTimes(1);
    // Each class it can't build yet asks again (one at a time), till one is compiled.
    expect(classes("a c")).toEqual([]);
    expect(renew).toHaveBeenCalledTimes(2);
    expect(classes("c")).toEqual([]);
    expect(renew).toHaveBeenCalledTimes(2);
    await settled();
    expect(classes("c")).toEqual([]);
    expect(renew).toHaveBeenCalledTimes(3);
    await settled();
    expect(classes("a b c")).toEqual(["a", "b", "c"]);
    expect(compilers[1].built).toEqual(["a", "b", "c"]);
    expect(renew).toHaveBeenCalledTimes(3);
  });

  it("stops asking for a fresh compiler after three fail in a row, and says why it reads no new class", async () => {
    const renew = vi.fn(() => Promise.reject(new Error("out of memory")));
    const read = declarationReader(poisoned(), renew);
    for (const className of ["a evil", "b", "c", "d", "e"]) {
      read(className);
      await settled();
    }
    expect(renew).toHaveBeenCalledTimes(3);
    expect(read("f evil").ignored).toEqual([
      { className: "f", reason: "Tailwind couldn't compile again after a class it couldn't read (out of memory)" },
      { className: "evil", reason: "Tailwind couldn't compile again after a class it couldn't read (out of memory)" },
    ]);
  });

  it("keeps its compiler where a fresh one fails, asking again on the next build past its classes, three times in a row at most", async () => {
    const old = counting();
    const renew = vi.fn(() => Promise.reject(new Error("no Tailwind")));
    const read = declarationReader(old, renew, 1);
    for (const className of ["a b", "c", "d", "e"]) {
      read(className);
      await settled();
    }
    expect(read("a c e").declarations.map((d) => d.className)).toEqual(["a", "c", "e"]);
    expect(old.built).toEqual(["a", "b", "c", "d", "e"]);
    expect(renew).toHaveBeenCalledTimes(3);
  });
});

describe("a render's classes", () => {
  it("are built at once, before its components are rewritten one at a time: their classes, their markup's, a Markdown's blocks'", async () => {
    // Each build is Tailwind's whole stylesheet again: a class at a time, a few thousand took seconds (and markup from
    // data, as many as it has).
    const handle = await loadTailwind({ ...config, render: "at once" });
    const n = 300;
    const template = (
      <Tailwind tw={handle}>
        <Email className="bg-white">
          <Row className="bg-gray-100">
            <Column className="p-1">
              {Array.from({ length: n }, (_, i) => <Paragraph key={i} className={`p-[${i}px]`}>x</Paragraph>)}
              {/* A scope of its own for each (a component that wraps itself in one): the render's classes are built once. */}
              {Array.from({ length: n }, (_, i) => <Tailwind key={`tw${i}`} tw={handle}><Paragraph className={`pt-[${i}px]`}>x</Paragraph></Tailwind>)}
              {Array.from({ length: n }, (_, i) => <Html key={`html${i}`} html={`<p class="m-[${i}px]">x</p>`} />)}
              <Markdown markdown={Array.from({ length: n }, (_, i) => `<span class="w-[${i}px]">x</span>`).join("\n\n")} />
              <Markdown markdown={Array.from({ length: n }, (_, i) => `<span class="h-[${i}px]">x</span>`).join(" ")} />
            </Column>
          </Row>
        </Email>
      </Tailwind>
    );
    for (const render of [() => renderToHtmlNow(template), () => renderToHtml(template)]) {
      const builds = compiled.builds;
      const html = await render();
      for (const style of [/padding: ?299px/, /padding: ?299px 10px 10px/, /margin: 299px/, /width: 299px/, /height: 299px/]) expect(html).toMatch(style);
      // The root's classes, then the render's.
      expect(compiled.builds - builds).toBeLessThanOrEqual(2);
    }
  });

  it(`are read ${CLASSES} different ones at most, the others left out and said once: classes from data take no more memory than that`, async () => {
    const handle = await loadTailwind({ ...config, render: "capped" });
    const many = Array.from({ length: CLASSES + 100 }, (_, i) => `indent-[${i}px]`);
    const template = (
      <Tailwind tw={handle}>
        <Email>
          <Row>
            <Column>
              <Markdown markdown={`<p class="${many.join(" ")}">x</p>`} />
              {/* A class the render read before is read; a new one isn't. */}
              <Paragraph className="indent-[5px] p-[3px]">late</Paragraph>
            </Column>
          </Row>
        </Email>
      </Tailwind>
    );
    for (const render of [() => renderToHtmlNow(template), () => renderToHtml(template)]) {
      warn.mockClear();
      const candidates = compiled.candidates;
      const html = await render();
      expect(html.match(/text-indent: ?\d+px/g)).toHaveLength(CLASSES + 1);
      expect(html).toContain(`class="${many.slice(CLASSES).join(" ")}"`);
      expect(html).not.toMatch(/padding: 3px/);
      expect(compiled.candidates - candidates).toBeLessThanOrEqual(CLASSES);
      const said = warn.mock.calls.map((call) => String(call[0])).filter((text) => text.includes(`${CLASSES} at most`));
      expect(said).toEqual([`[Unlayer] Html ignores class \`indent-[${CLASSES}px]\`, and the render's other classes past its first ${CLASSES} different ones: a render reads ${CLASSES} at most.`]);
    }
    // A class string's, in classNameToDeclarations, as a render's.
    const found = classNameToDeclarations(handle, many.join(" "));
    expect(found.declarations).toHaveLength(CLASSES);
    expect(found.ignored).toHaveLength(100);
    expect(found.ignored[0]).toEqual({ className: `indent-[${CLASSES}px]`, reason: `it's past the first ${CLASSES} different classes of the render (or class string), all one reads` });
  });

  it(`are read ${CLASSES} different ones at most per render, not per handle`, async () => {
    const handle = await loadTailwind({ ...config, render: "per render" });
    for (const from of [0, 1500, 3000]) {
      warn.mockClear();
      const html = renderToHtmlNow(
        <Tailwind tw={handle}>
          <Email>
            <Row>
              <Column>
                <Html html={Array.from({ length: 1500 }, (_, i) => `<b class="indent-[${from + i}px]">x</b>`).join("")} />
              </Column>
            </Row>
          </Email>
        </Tailwind>
      );
      expect(html.match(/text-indent: \d+px/g)).toHaveLength(1500);
      expect(warn).not.toHaveBeenCalled();
    }
  });

  describe("with a plugin that throws for one of them", () => {
    // A plugin's function for a class's value (a utility's, a variant's) that throws for one value: a class from data.
    const plugin = ({ matchUtilities, matchVariant }: any) => {
      matchUtilities({ boom: (value: string) => (value === "now" ? (() => { throw new Error("boom"); })() : { color: "red" }) }, { values: { now: "now", later: "later" } });
      matchVariant("vboom", (value: string) => (value === "now" ? (() => { throw new Error("vboom"); })() : "&:hover"), { values: { now: "now", later: "later" } });
    };
    const template = (handle: TailwindHandle, bad = "boom-now") => (
      <Tailwind tw={handle}>
        <Email>
          <Row>
            <Column>
              <Paragraph className="p-[7px]">A</Paragraph>
              <Paragraph className={bad}>B</Paragraph>
              <Paragraph className="p-[9px]">C</Paragraph>
            </Column>
          </Row>
        </Email>
      </Tailwind>
    );
    // Another tenant's template on the same handle, whose classes are fine: one it hasn't built yet, and a color.
    const other = (handle: TailwindHandle, n: number) => (
      <Tailwind tw={handle}>
        <Email>
          <Row>
            <Column>
              <Paragraph className={`text-red-500 p-[${n}px]`}>other</Paragraph>
            </Column>
          </Row>
        </Email>
      </Tailwind>
    );
    const fine = (html: string, n: number) => [html.includes("#fb2c36"), new RegExp(`padding: ?${n}px`).test(html)];
    let error: MockInstance;
    beforeEach(() => void (error = vi.spyOn(console, "error").mockImplementation(() => {})));
    afterEach(() => error.mockRestore());

    it.each(["boom-now", "vboom-now:p-[3px]", "group-vboom-now:p-[3px]", "hover:boom-now!"])("fail the component whose class it is (%s), from the first render, every time, and leave the others' classes be", async (bad) => {
      const handle = await loadTailwind({ plugins: [plugin] });
      const name = bad.includes("vboom") ? "vboom" : "boom";
      for (let i = 0; i < 3; i++) {
        expect(() => renderToHtmlNow(template(handle, bad))).toThrow(`[Unlayer] ${name} (in <Paragraph> at Row 1 › Column 1 › Paragraph 2)`);
        // With `onError: "omit"`, that block is left out, and listed; the others keep their classes.
        const parts = renderToHtmlPartsNow(template(handle, bad), { onError: "omit" });
        expect(parts.omitted.map((e) => e.message)).toEqual([`[Unlayer] ${name} (in <Paragraph> at Row 1 › Column 1 › Paragraph 2)`]);
        expect([/padding: ?7px/.test(parts.body), />\s*B\s*</.test(parts.body), /padding: ?9px/.test(parts.body)]).toEqual([true, false, true]);
      }
      expect(() => classNameToDeclarations(handle, bad)).toThrow(name);
    });

    it("fail the component whose class it is where another utility gives the class CSS too, first and later, synchronous and async", async () => {
      // A static utility of the same name (`.boom-now`, bold) beside the plugin's, which throws for it: the class has
      // CSS from one and the plugin's error from the other.
      const both = ({ matchUtilities, addUtilities }: any) => {
        plugin({ matchUtilities, matchVariant: () => {} });
        addUtilities({ ".boom-now": { fontWeight: "bold" }, ".now": { color: "green" } });
      };
      const page = (handle: TailwindHandle) => (
        <Tailwind tw={handle}>
          <Email>
            <Row>
              <Column>
                <Paragraph className="boom-now">FAIL</Paragraph>
                <Paragraph className="now">OK</Paragraph>
              </Column>
            </Row>
          </Email>
        </Tailwind>
      );
      const pinned = "[Unlayer] boom (in <Paragraph> at Row 1 › Column 1 › Paragraph)";
      const shown = (body: string) => [/>\s*FAIL\s*</.test(body), />\s*OK\s*</.test(body), /color: ?(green|#008000)/.test(body)];
      for (const render of [(tw: TailwindHandle) => renderToHtmlPartsNow(page(tw), { onError: "omit" }), (tw: TailwindHandle) => renderToHtmlParts(page(tw), { onError: "omit" })]) {
        const handle = await loadTailwind({ plugins: [both] });
        for (let i = 0; i < 3; i++) {
          const parts = await render(handle);
          expect(parts.omitted.map((e) => e.message)).toEqual([pinned]);
          expect(shown(parts.body)).toEqual([false, true, true]);
        }
        expect(() => renderToHtmlNow(page(handle))).toThrow(pinned);
      }
    });

    it("change nothing in another render on the same handle, synchronous or async, at once or right after", async () => {
      const handle = await loadTailwind({ plugins: [plugin] });
      expect(() => renderToHtmlNow(template(handle))).toThrow("[Unlayer] boom");
      expect(fine(renderToHtmlNow(other(handle, 13)), 13)).toEqual([true, true]);
      const [bad, good] = await Promise.allSettled([renderToHtml(template(handle, "vboom-now:p-[3px]")), renderToHtml(other(handle, 14))]);
      expect(bad.status === "rejected" && String(bad.reason.message)).toContain("[Unlayer] vboom (in <Paragraph>");
      expect(good.status === "fulfilled" && fine(good.value, 14)).toEqual([true, true]);
      expect(fine(renderToHtmlNow(other(handle, 15)), 15)).toEqual([true, true]);
    });

    it("fail only the component whose class holds a variant named `@` (`@boom:`) its function throws for, not one with a class Tailwind doesn't have", async () => {
      // Tailwind reads `@boom` as the `@` variant and `boom`, with no dash: a failure was tied to no class of the build,
      // and fell on its classes with no CSS, `text-nope` too, every render's.
      const at = ({ matchVariant }: any) => matchVariant("@", (value: string) => (value === "boom" ? (() => { throw new Error("at boom"); })() : "&:hover"), { values: { boom: "boom", ok: "ok" } });
      const handle = await loadTailwind({ plugins: [at] });
      const page = (
        <Tailwind tw={handle}>
          <Email>
            <Row>
              <Column>
                <Paragraph className="@boom:p-[3px]">A</Paragraph>
                <Paragraph className="text-nope p-[5px]">B</Paragraph>
              </Column>
            </Row>
          </Email>
        </Tailwind>
      );
      for (let i = 0; i < 2; i++) {
        const parts = renderToHtmlPartsNow(page, { onError: "omit" });
        expect(parts.omitted.map((e) => e.message)).toEqual(["[Unlayer] at boom (in <Paragraph> at Row 1 › Column 1 › Paragraph)"]);
        expect([/padding: ?5px/.test(parts.body), />\s*B\s*</.test(parts.body)]).toEqual([true, true]);
      }
      expect(classNameToDeclarations(handle, "text-nope").ignored).toEqual([{ className: "text-nope", reason: "Tailwind has no such class" }]);
    });

    it("read a class its function gives nothing for (`if (!ok) return;`) as one Tailwind doesn't have, every time, changing nothing in another render", async () => {
      // `undefined` and `null`, as a function gives for a value it doesn't take, which Tailwind 4's compiler throws for
      // (and then for every build after it), where Tailwind 3 gave the class no CSS.
      const sizes: Record<string, string> = { sm: "12px" };
      const nothing = ({ matchUtilities, matchVariant }: any) => {
        matchUtilities({ fs: (value: string) => (sizes[value] ? { fontSize: sizes[value] } : undefined) }, { values: { sm: "sm", lg: "lg" }, type: "any" });
        matchVariant("vnone", (value: string) => (value === "ok" ? "&:hover" : null), { values: { ok: "ok", no: "no" } });
      };
      let n = 30;
      for (const bad of ["fs-lg", "fs-[huge]", "vnone-no:p-[3px]"]) {
        const handle = await loadTailwind({ plugins: [nothing] });
        for (const render of [(t: React.ReactElement) => renderToHtmlPartsNow(t, { onError: "omit" }), (t: React.ReactElement) => renderToHtmlParts(t, { onError: "omit" }), (t: React.ReactElement) => renderToHtmlPartsNow(t)]) {
          for (let i = 0; i < 2; i++) {
            warn.mockClear();
            const parts = await render(template(handle, bad));
            expect(parts.omitted).toEqual([]);
            expect([/padding: ?7px/.test(parts.body), />\s*B\s*</.test(parts.body), /padding: ?9px/.test(parts.body)]).toEqual([true, true, true]);
            expect(warn).toHaveBeenCalledWith(`[Unlayer] Paragraph ignores class \`${bad}\`: Tailwind has no such class.`);
            expect(fine(renderToHtmlNow(other(handle, ++n)), n)).toEqual([true, true]);
          }
        }
        expect(JSON.stringify(renderToJsonNow(template(handle, bad)))).toContain('"B"');
      }
    });

    // What Tailwind's compiler can't compile, which it throws for, and then for every build after it: an `@apply` of a
    // class or a variant it doesn't have, or of the class itself, or of nothing; a list holding nothing; a variant
    // that isn't a selector.
    const rejected = ({ matchUtilities, matchVariant }: any) => {
      const gives: Record<string, unknown> = { bad: { "@apply not-a-class": {} }, variant: { "@apply nope:p-1": {} }, self: { "@apply ap-self": {} }, empty: { "@apply": {} }, list: { color: [null] }, ok: { color: "red" } };
      matchUtilities({ ap: (value: string) => gives[value] }, { values: Object.fromEntries(Object.keys(gives).map((k) => [k, k])) });
      matchVariant("vobj", (value: string) => (value === "bad" ? {} : "&:hover"), { values: { bad: "bad", ok: "ok" } });
    };
    it.each([
      ["ap-bad", "<Tailwind> can't read `ap-bad`: it applies (`@apply`) `not-a-class`, a class Tailwind doesn't have"],
      ["ap-variant", "<Tailwind> can't read `ap-variant`: it applies (`@apply`) `nope:p-1`, a class Tailwind doesn't have"],
      ["ap-self", "<Tailwind> can't read `ap-self`: it applies itself (`@apply`), a circular dependency"],
      ["ap-empty", "<Tailwind>: the plugin's `ap` function gives an `@apply` with no class in it"],
      ["ap-list", "<Tailwind>: the plugin's `ap` function gives a list holding `null`, which Tailwind can't compile"],
      ["vobj-bad:p-[3px]", "<Tailwind>: the plugin's `vobj` variant gives an object, not a selector or a list of them"],
    ])("fail the component whose class it is where Tailwind can't compile what its function gives (%s), every time, changing nothing in another render", async (bad, message) => {
      const handle = await loadTailwind({ plugins: [rejected] });
      const failure = `[Unlayer] ${message} (in <Paragraph> at Row 1 › Column 1 › Paragraph 2)`;
      for (let i = 0; i < 3; i++) {
        expect(() => renderToHtmlNow(template(handle, bad))).toThrow(failure);
        for (const parts of [renderToHtmlPartsNow(template(handle, bad), { onError: "omit" }), await renderToHtmlParts(template(handle, bad), { onError: "omit" })]) {
          expect(parts.omitted.map((e) => e.message)).toEqual([failure]);
          expect([/padding: ?7px/.test(parts.body), />\s*B\s*</.test(parts.body), /padding: ?9px/.test(parts.body)]).toEqual([true, false, true]);
        }
        expect(fine(renderToHtmlNow(other(handle, 40 + i)), 40 + i)).toEqual([true, true]);
        expect(() => renderToJsonNow(template(handle, bad))).toThrow(failure);
      }
    });

    it("apply what its function gives `@apply` of, as Tailwind does: where the `@apply` is, with the variants and the `!important` it's under", async () => {
      const applies = ({ matchUtilities }: any) =>
        matchUtilities({ btn: (value: string) => ({ "@apply px-[4px] py-[2px]": {}, backgroundColor: value, "&:hover": { "@apply text-[#ff0000]": {} }, "@media (width < 40rem)": { "@apply p-[1px]": {} } }) }, { values: { blue: "#0000ff" } });
      const handle = await loadTailwind({ plugins: [applies] });
      const each = (className: string) => classNameToDeclarations(handle, className).declarations.map((d) => `${d.className} ${d.when} ${d.property}: ${d.value}${d.important ? " !important" : ""}`);
      const own = (className: string, as: string, important = "") => each(className).map((d) => d.replace(/^\S+/, as) + important);
      expect(each("btn-blue")).toEqual([...own("px-[4px] py-[2px]", "btn-blue"), "btn-blue always background-color: #0000ff", ...own("hover:text-[#ff0000]", "btn-blue"), ...own("max-sm:p-[1px]", "btn-blue")]);
      expect(each("btn-blue!")).toEqual(each("btn-blue").map((d) => d.replace("btn-blue", "btn-blue!") + " !important"));
    });
  });

  const fine = (html: string, n: number) => [html.includes("#fb2c36"), new RegExp(`padding: ?${n}px`).test(html)];

  it("fail, saying to render again, where Tailwind compiles again after a class it couldn't read; the async renderers wait for it", async () => {
    // A theme value with a quote left open (a config's own: no plugin gave it), which Tailwind writes as CSS that can't be
    // read: nothing more can be built on that compiler, so a fresh one is compiled, and until it's ready a class it
    // hasn't built can't be read. A render that needs one fails, as no render goes out without a class's styles.
    const handle = await loadTailwind({ theme: { extend: { colors: { weird: 'red"' } } } });
    const page = (className: string) => (
      <Tailwind tw={handle}>
        <Email>
          <Row>
            <Column>
              <Paragraph className={className}>x</Paragraph>
            </Column>
          </Row>
        </Email>
      </Tailwind>
    );
    expect(() => renderToHtmlNow(page("text-weird p-[5px]"))).toThrow("<Tailwind> can't read the class `text-weird` now: it's read once Tailwind has compiled again, after a class it couldn't read. Render again then (the async renderers wait for it) (in <Paragraph>)");
    expect(() => renderToHtmlNow(page("text-red-500 p-[6px]"))).toThrow("Render again then");
    // The async renderers wait for the fresh compiler, and read the class on it.
    expect(fine(await renderToHtml(page("text-red-500 p-[6px]")), 6)).toEqual([true, true]);
  });

  it("render, from the async renderers, after Tailwind compiles again for a class of their own it couldn't read", async () => {
    // The same theme, on a handle no render used: the async render's own class is the one Tailwind can't read, and its
    // render waits for the fresh compiler (twice: the class is built alone, then refused) where a synchronous one fails.
    const handle = await loadTailwind({ theme: { extend: { colors: { weird: 'red"' } } }, render: "async first" });
    const page = (
      <Tailwind tw={handle}>
        <Email>
          <Row>
            <Column>
              <Paragraph className="text-weird p-[5px]">x</Paragraph>
              <Paragraph className="text-red-500 p-[6px]">y</Paragraph>
            </Column>
          </Row>
        </Email>
      </Tailwind>
    );
    const html = await renderToHtml(page);
    expect([/padding: ?5px/.test(html), /padding: ?6px/.test(html), html.includes("#fb2c36")]).toEqual([true, true, true]);
    expect(warn.mock.calls.map((call) => String(call[0]))).toContain("[Unlayer] Paragraph ignores class `text-weird`: it isn't a class Tailwind can read here.");
  });

  it("past a compiler's classes, compile on without an error or a class left out, for renders at once and one after another", async () => {
    // Each render's 1,500 new classes: past CLASSES, a fresh compiler takes over once ready, the old one read till then.
    const handle = await loadTailwind({ ...config, render: "renewals" });
    const page = (from: number) => (
      <Tailwind tw={handle}>
        <Email>
          <Row>
            <Column>
              <Html html={Array.from({ length: 1500 }, (_, i) => `<b class="indent-[${from + i}px]">x</b>`).join("")} />
            </Column>
          </Row>
        </Email>
      </Tailwind>
    );
    const count = (html: string) => html.match(/text-indent: \d+px/g)?.length;
    for (let round = 0; round < 2; round++) {
      const sync = [0, 1, 2].map((i) => count(renderToHtmlNow(page((round * 6 + i) * 1500))));
      const async = await Promise.all([3, 4, 5].map(async (i) => count(await renderToHtml(page((round * 6 + i) * 1500)))));
      expect([...sync, ...async]).toEqual([1500, 1500, 1500, 1500, 1500, 1500]);
    }
    expect(warn).not.toHaveBeenCalled();
  }, 60_000);

  it("are a <Tailwind>'s own: a class outside it isn't compiled", async () => {
    // (The plugin says which of its classes Tailwind compiled, and throws for this one.)
    const called: string[] = [];
    const plugin = ({ matchUtilities }: any) => matchUtilities({ boom: (value: string) => (called.push(value), value === "now" ? (() => { throw new Error("boom"); })() : { color: "red" }) }, { values: { now: "now", later: "later" } });
    const handle = await loadTailwind({ plugins: [plugin] });
    const html = renderToHtmlNow(
      <Email>
        <Row>
          <Column>
            <Paragraph className="boom-now">Out</Paragraph>
          </Column>
        </Row>
        <Tailwind tw={handle}>
          <Row>
            <Column>
              <Paragraph className="p-[7px] boom-later">In</Paragraph>
            </Column>
          </Row>
        </Tailwind>
      </Email>
    );
    expect([/padding: ?7px/.test(html), />\s*Out\s*</.test(html)]).toEqual([true, true]);
    expect(called).toContain("later");
    expect(called).not.toContain("now");
  });
});

describe("the async renderers, with <Tailwind config>", () => {
  const template = (
    <Tailwind config={config}>
      <Email className="bg-gray-100">
        <Row className="bg-white">
          <Column className="p-6">
            <Paragraph className="text-brand text-lg">Hello</Paragraph>
          </Column>
        </Row>
      </Email>
    </Tailwind>
  );

  it("compile it and render, in all four forms", async () => {
    const html = await renderToHtml(template, { title: "Hi" });
    expect(html).toMatch(/^<!DOCTYPE/);
    for (const css of ["#f3f4f6", "color: #007291", "font-size: 18px", "padding: 24px", "<title>Hi</title>"]) expect(html).toContain(css);
    expect(await renderToPlainText(template)).toBe("Hello");
    const design = await renderToJson(template);
    expect(design.body.values.backgroundColor).toBe("#f3f4f6");
    expect(design.body.rows[0].values.columnsBackgroundColor).toBe("#fff");
    expect(design.body.rows[0].columns[0].values.padding).toBe("24px");
    expect(design.body.rows[0].columns[0].contents[0].values).toMatchObject({ color: "#007291", fontSize: "18px" });
    const parts = await renderToHtmlParts(template);
    expect(parts.body).toContain("color: #007291");
  });

  it("compile it with the compiler of its own copy of Elements, whichever copy's Tailwind entry loaded last", async () => {
    // Another copy of Elements in the app (another version, a package still on one), whose Tailwind entry loaded after.
    const LOADER = Symbol.for("@unlayer/react-elements/tailwind-loader");
    const global = globalThis as Record<symbol, unknown>;
    const own = global[LOADER];
    const other = vi.fn(async () => {
      throw new Error("another copy's compiler");
    });
    global[LOADER] = other;
    try {
      expect(await renderToHtml(template)).toContain("color: #007291");
      expect(other).not.toHaveBeenCalled();
    } finally {
      global[LOADER] = own;
    }
  });

  it("take Tailwind's default theme from a <Tailwind> without a config, and `tw` as it is", async () => {
    const plain = await renderToJson(
      <Tailwind>
        <Email className="bg-red-500">
          <Row>
            <Column />
          </Row>
        </Email>
      </Tailwind>
    );
    expect(plain.body.values.backgroundColor).toBe("#fb2c36");
    const given = await renderToJson(
      <Tailwind tw={tw}>
        <Email className="bg-brand">
          <Row>
            <Column />
          </Row>
        </Email>
      </Tailwind>
    );
    expect(given.body.values.backgroundColor).toBe("#007291");
  });

  it("keep what they compiled their own: a synchronous render the user's code starts in theirs needs `tw`, as anywhere else", async () => {
    // It found the async render's compiled config while that render ran, and rendered there only.
    const { registerTool, renderToHtml: renderToHtmlSync } = await import("../index");
    const inner = <Tailwind config={config}><Email><Row><Column><Paragraph className="text-brand">Inner</Paragraph></Column></Row></Email></Tailwind>;
    const said: string[] = [];
    const nested = () => {
      try {
        renderToHtmlSync(inner);
        said.push("rendered");
      } catch (error) {
        said.push(String((error as Error).message));
      }
    };
    const Nested = registerTool({ name: "tailwind_nested", renderer: { exporters: { email: () => (nested(), "<b>nested</b>") } } });
    const onError = () => nested();
    const Broken = () => {
      throw new Error("broken");
    };
    nested();
    expect(await renderToHtml(<Tailwind config={config}><Email><Row><Column><Nested /><Broken /><Paragraph className="text-brand">Outer</Paragraph></Column></Row></Email></Tailwind>, { onError })).toContain("color: #007291");
    expect(said).toHaveLength(3);
    expect(new Set(said)).toEqual(new Set(['[Unlayer] <Tailwind config> needs `tw`: `await loadTailwind(config)` from "@unlayer/react-elements/tailwind", or the async renderers ("@unlayer/react-elements/async"), which compile it (these are synchronous).']));
  });

  it("find a <Tailwind> a template returns, and render its components once", async () => {
    const calls = { welcome: 0, greeting: 0 };
    const Greeting = ({ name }: { name: string }) => {
      calls.greeting++;
      return <Paragraph className="text-brand">Hi {name}</Paragraph>;
    };
    // A config written in the component: a new object each time it's called.
    const Welcome = ({ name }: { name: string }) => {
      calls.welcome++;
      return (
        <Tailwind config={{ theme: { extend: { colors: { brand: "#007291" } } } }}>
          <Email className="bg-gray-100">
            <Row>
              <Column>
                <Greeting name={name} />
              </Column>
            </Row>
          </Email>
        </Tailwind>
      );
    };
    const html = await renderToHtml(<Welcome name="Ada" />);
    expect(html).toContain("color: #007291");
    expect(html).toContain("#f3f4f6");
    expect(calls).toEqual({ welcome: 1, greeting: 1 });
    const design = await renderToJson(<Welcome name="Ada" />);
    expect(design.body.rows[0].columns[0].contents[0].values.color).toBe("#007291");
  });

  it("find a <Tailwind> a component deeper in renders, too", async () => {
    const Section = () => (
      <Tailwind config={config}>
        <Paragraph className="text-brand">Inside</Paragraph>
      </Tailwind>
    );
    const design = await renderToJson(
      <Email>
        <Row>
          <Column>
            <Section />
          </Column>
        </Row>
      </Email>
    );
    expect(design.body.rows[0].columns[0].contents[0].values.color).toBe("#007291");
  });
});

/** A seeded random number generator (mulberry32): the same inputs every run. */
function random(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
