import {
  buttonColors,
  checkDocument,
  COMPONENTS,
  describeComponent,
  describeComponents,
  htmlText,
  markupText,
  parseDocument,
  type AssetInput,
  type ComponentDefinition,
  type InsetsInput,
  type NodeInput,
  type PropsInput,
  type StyleInput,
} from "../src";
import type { Button, Heading, Image } from "../src/components";

describe("property discovery", () => {
  it("describes a component's props, styles, editors and children", () => {
    const button = describeComponent("Button")!;
    expect(button.targets).toEqual(["email", "web"]);
    const byPath = Object.fromEntries(button.properties.map((p) => [p.path, p]));
    expect(byPath["props.href"]).toMatchObject({ editor: "link", required: true, kind: "link" });
    expect(byPath["style.backgroundColor"]).toMatchObject({ editor: "color", default: "#0879a1" });
    expect(byPath["style.padding"]).toMatchObject({ editor: "insets", mobile: true });
    expect(byPath["style.fontSize"]).toMatchObject({ editor: "length", inherited: true });
    expect(byPath["hover.backgroundColor"]).toMatchObject({ editor: "color", label: "Background color on hover" });
    expect(byPath["style.textAlign"].schema).toEqual({ enum: ["left", "center", "right", "justify"] });
    expect(button.groups).toContainEqual({ title: "Colors", paths: buttonColors.covers, composite: "buttonColors" });
    expect(describeComponent("Nope")).toBeUndefined();
  });

  it("leaves imported nodes (Raw) out of what a template can use, and has Html, their authorable twin, in it", () => {
    expect(describeComponents().map((d) => d.type)).not.toContain("Raw");
    expect(describeComponents().length).toBe(Object.keys(COMPONENTS).length - 1);
    expect(describeComponent("Raw")?.type).toBe("Raw");
    const html = describeComponent("Html")!;
    expect(describeComponents().map((d) => d.type)).toContain("Html");
    expect(html.properties.map((p) => [p.path, p.required])).toEqual([
      ["props.html", true],
      ["props.text", false],
    ]);
    expect(html.categories).toEqual(["block"]);
  });

  it("reads markup's words for what can't show markup: blocks a line each, what a browser hides left out", () => {
    expect(markupText("<style>p{color:red}</style><p>Sale&nbsp;<b>today</b></p><!--[if mso]><p>Outlook</p><![endif]--><div>Ends &amp; soon</div>x<br>y")).toBe("Sale today\nEnds & soon\nx\ny");
    expect(markupText("<table><tr><td>a</td><td>b</td></tr><tr><td>c</td></tr></table>")).toBe("ab\nc");
    expect(markupText("&copy; &#8364;5 &unknown;")).toBe("© €5 &unknown;");
    expect(htmlText({ props: { html: "<b>Sale</b>", text: " Sale today " } })).toBe("Sale today");
    expect(htmlText({ props: { html: "<b>Sale</b>" } })).toBe("Sale");
  });

  it("names only paths each component has in its editor groups", () => {
    for (const description of describeComponents()) {
      const paths = new Set(description.properties.map((p) => p.path));
      for (const group of description.groups) for (const path of group.paths) expect([description.type, path, paths.has(path)]).toEqual([description.type, path, true]);
    }
  });

  it("gives every definition a description, a target and labeled properties", () => {
    for (const definition of Object.values(COMPONENTS) as ComponentDefinition[]) {
      expect(definition.description).toBeTruthy();
      expect(Object.keys(definition.targets).length).toBeGreaterThan(0);
      for (const spec of [...Object.values(definition.props), ...Object.values(definition.style)]) expect(spec.label).toBeTruthy();
    }
  });
});

describe("composite editors", () => {
  it("write one value to every prop they cover, and read it back", () => {
    const patch = buttonColors.write({ color: "#111111", backgroundColor: "#FFCC00", hoverColor: "#000", hoverBackgroundColor: "#ffaa00" });
    expect(patch).toEqual({ style: { color: "#111111", backgroundColor: "#FFCC00" }, hover: { color: "#000", backgroundColor: "#ffaa00" } });
    const node = parseDocument({ root: { type: "Email", children: [{ type: "Button", props: { href: "https://example.com" }, ...patch, children: ["Go"] }] } }).root.children![0];
    expect(buttonColors.read(node as never)).toEqual({ color: "#111111", backgroundColor: "#ffcc00", hoverColor: "#000000", hoverBackgroundColor: "#ffaa00" });
  });
});

describe("types from definitions", () => {
  it("derives props and styles authors write", () => {
    expectTypeOf<PropsInput<(typeof Button)["props"]>["href"]>().toEqualTypeOf<string | { href: string; target?: "_blank" | "_self" }>();
    // href is required
    expectTypeOf<{}>().not.toMatchTypeOf<PropsInput<(typeof Button)["props"]>>();
    expectTypeOf<PropsInput<(typeof Heading)["props"]>["level"]>().toEqualTypeOf<1 | 2 | 3 | 4 | 5 | 6 | undefined>();
    expectTypeOf<StyleInput<(typeof Button)["style"]>["padding"]>().toEqualTypeOf<InsetsInput | undefined>();
    expectTypeOf<{ src: AssetInput }>().toMatchTypeOf<PropsInput<(typeof Image)["props"]>>();
    expectTypeOf<{ alt: string }>().not.toMatchTypeOf<PropsInput<(typeof Image)["props"]>>();
    expectTypeOf<StyleInput<(typeof Image)["style"]>>().not.toHaveProperty("color");
    const node: NodeInput<typeof Image> = { type: "Image", props: { src: "https://example.com/a.png" }, style: { width: "50%" } };
    expect(node.type).toBe("Image");
    // @ts-expect-error a width in em isn't a length Image takes
    const bad: NodeInput<typeof Image> = { type: "Image", props: { src: "x" }, style: { width: "2em" } };
    expect(bad).toBeTruthy();
  });
});
