import Ajv2020 from "ajv/dist/2020";
import {
  applyPatch,
  buttonColors,
  checkDocument,
  COMPONENTS,
  describeComponent,
  describeComponents,
  documentJsonSchema,
  findNode,
  parseDocument,
  type AssetInput,
  type ComponentDefinition,
  type InsetsInput,
  type NodeInput,
  type PropsInput,
  type StyleInput,
} from "../src";
import type { Button, Heading, Image } from "../src/components";

describe("JSON Schema", () => {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  const validate = ajv.compile(documentJsonSchema());

  const valid = {
    version: 1,
    root: {
      type: "Email",
      props: { width: 600 },
      style: { backgroundColor: "#f4f4f4" },
      children: [
        { type: "Section", style: { backgroundColor: "#111", padding: 24 }, children: [{ type: "Image", props: { src: "https://example.com/logo.png", alt: "Logo" } }] },
        { type: "Row", style: { gap: 16 }, children: [{ type: "Column", children: [{ type: "Text", children: ["a"] }] }, { type: "Column" }] },
        { type: "Button", props: { href: "https://example.com" }, hover: { backgroundColor: "#000" }, children: ["Go"] },
      ],
    },
  };

  it("accepts what checkDocument accepts", () => {
    expect(checkDocument(valid).diagnostics).toEqual([]);
    expect(validate(valid)).toBe(true);
  });

  it("rejects wrong nesting, unknown props and missing required props, as checkDocument does", () => {
    const wrong = [
      { version: 1, root: { type: "Email", children: [{ type: "Column", children: [{ type: "Section" }] }] } },
      { version: 1, root: { type: "Email", children: [{ type: "Button", props: { href: "#", rel: "x" } }] } },
      { version: 1, root: { type: "Email", children: [{ type: "Image" }] } },
      { version: 1, root: { type: "Email", children: [{ type: "Row", children: ["text"] }] } },
      { version: 1, root: { type: "Text" } },
      { version: 1, root: { type: "Email", children: [{ type: "Text", style: { margin: 4 } }] } },
    ];
    for (const document of wrong) {
      expect(validate(document)).toBe(false);
      expect(checkDocument(document).diagnostics.some((d) => d.severity === "error")).toBe(true);
    }
  });

  it("is plain JSON", () => {
    const schema = documentJsonSchema();
    expect(JSON.parse(JSON.stringify(schema))).toEqual(schema);
  });
});

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

describe("editing", () => {
  const document = parseDocument({
    version: 1,
    root: { type: "Email", children: [{ type: "Button", id: "cta", props: { href: "https://example.com" }, style: { color: "#fff" }, children: ["Go"] }] },
  });

  it("writes a composite editor's value to every prop it covers", () => {
    const patch = buttonColors.write({ color: "#111111", backgroundColor: "#FFCC00", hoverColor: "#000", hoverBackgroundColor: "#ffaa00" });
    const { document: edited, diagnostics } = applyPatch(document, "cta", patch);
    expect(diagnostics).toEqual([]);
    const node = findNode(edited, "cta")!;
    expect(node.style).toEqual({ color: "#111111", backgroundColor: "#ffcc00" });
    expect(node.hover).toEqual({ color: "#000000", backgroundColor: "#ffaa00" });
    expect(buttonColors.read(node)).toEqual({ color: "#111111", backgroundColor: "#ffcc00", hoverColor: "#000000", hoverBackgroundColor: "#ffaa00" });
    expect(findNode(document, "cta")!.style).toEqual({ color: "#ffffff" });
  });

  it("removes values set to undefined, and refuses invalid values and removing required props", () => {
    const { document: edited, diagnostics } = applyPatch(document, "cta", { style: { color: undefined, padding: "1em" }, props: { href: undefined } });
    expect(findNode(edited, "cta")!.style).toBeUndefined();
    expect(findNode(edited, "cta")!.props).toEqual({ href: "https://example.com" });
    expect(diagnostics.map((d) => d.code)).toEqual(["patch/required", "patch/invalid"]);
    expect(applyPatch(document, "nope", {}).diagnostics.map((d) => d.code)).toEqual(["patch/no-node"]);
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
