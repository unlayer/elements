// @vitest-environment node
import React from "react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";
import { Column, Email, Paragraph, Row } from "../index";
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
import { CLASSES, declarationReader, type Compiler } from "./declarations";
import { CONFIGS } from "./load";

// Tailwind as it is, its compilers counted once compiled: a handle compiles a fresh one after building many classes.
const compiled = vi.hoisted(() => ({ count: 0 }));
vi.mock("tailwindcss", async (actual) => {
  const tailwind = await actual<Record<string, any>>();
  const compile = async (...args: unknown[]) => {
    const compiler = await tailwind.compile(...args);
    compiled.count++;
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
  });

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

describe("a handle's reader of classes", () => {
  /** A compiler that gives each class it's built a rule, as Tailwind gives the stylesheet of all so far. */
  const counting = () => {
    const built: string[] = [];
    return { built, build: (classes: string[]) => (built.push(...classes), built.map((c) => `.${c} { margin: 1px; }`).join("\n")) };
  };

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

  it("keeps its compiler where a fresh one fails", async () => {
    const old = counting();
    const renew = vi.fn(() => Promise.reject(new Error("no Tailwind")));
    const read = declarationReader(old, renew, 1);
    read("a b");
    await Promise.resolve();
    read("c");
    expect(read("a c").declarations.map((d) => d.className)).toEqual(["a", "c"]);
    expect(old.built).toEqual(["a", "b", "c"]);
    expect(renew).toHaveBeenCalledTimes(1);
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
