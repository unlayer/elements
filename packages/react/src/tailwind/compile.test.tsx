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
