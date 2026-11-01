import {
  asset,
  checkDocument,
  color,
  defineCustomComponent,
  describeComponent,
  documentJsonSchema,
  expandDocument,
  link,
  parseDocument,
  prop,
  Registry,
  resolveDocument,
  text,
  type ResolvedNode,
} from "../src";

const Card = defineCustomComponent({
  type: "acme.Card",
  label: "Card",
  props: {
    name: prop(text(), { label: "Name", required: true }),
    photo: prop(asset(), { label: "Photo", required: true }),
    href: prop(link(), { label: "Link", required: true }),
    accent: prop(color(), { label: "Accent", default: "#0879a1" }),
  },
  expand: ({ name, photo, href, accent }) => ({
    type: "Column",
    style: { gap: 8 },
    children: [
      { type: "Image", props: { src: photo, alt: name } },
      { type: "Heading", id: "title", props: { level: 3 }, children: [name] },
      { type: "Button", props: { href }, style: { backgroundColor: accent }, children: ["Buy"] },
    ],
  }),
});

const cards = (...nodes: unknown[]) => ({ version: 1, root: { type: "Email", children: [{ type: "Row", children: nodes }] } });
const card = (props: Record<string, unknown>, extra: Record<string, unknown> = {}) => ({
  type: "acme.Card",
  props: { name: "Sneaker", photo: "https://example.com/a.png", href: "https://example.com", ...props },
  ...extra,
});

describe("custom components", () => {
  it("are one node in the document, checked like any other", () => {
    const { document, diagnostics } = checkDocument(cards(card({ accent: "#FF0000" })), { components: [Card] });
    expect(diagnostics).toEqual([]);
    expect(document!.root.children![0]).toEqual({
      type: "Row",
      children: [{ type: "acme.Card", props: { name: "Sneaker", photo: "https://example.com/a.png", href: "https://example.com", accent: "#ff0000" } }],
    });
    const bad = checkDocument(cards(card({ href: undefined, accent: "nope", extra: 1 })), { components: [Card] });
    expect(bad.diagnostics.map((d) => d.code)).toEqual(["prop/invalid", "prop/unknown", "prop/required"]);
  });

  it("say which option a document needs them from", () => {
    const { diagnostics } = checkDocument(cards(card({})));
    expect(diagnostics.map((d) => d.code)).toEqual(["node/unknown-type"]);
    expect(diagnostics[0].message).toMatch(/components option/);
  });

  it("expand into primitives with their props and defaults; ids inside only when the instance has one", () => {
    const document = parseDocument(cards(card({}), card({ name: "Boot" }, { style: { flex: 2 }, id: "boot" })), { components: [Card] });
    const { document: expanded, diagnostics } = expandDocument(document, { components: [Card] });
    // The first card has no id, so the id its render gives the title is left out (it would repeat in every card).
    expect(diagnostics.map((d) => [d.code, d.severity, d.path])).toEqual([["id/dropped", "info", "root.children[0].children[0](acme.Card).children[1].id"]]);
    const [first, second] = (expanded.root.children![0] as { children: unknown[] }).children as Array<{ id?: string; type: string; style?: object; children: Array<{ id?: string; style?: object }> }>;
    expect(first.type).toBe("Column");
    expect(first.children.map((c) => c.id)).toEqual([undefined, undefined, undefined]);
    expect(first.children[2].style).toEqual({ backgroundColor: "#0879a1" });
    expect(second.children.map((c) => c.id)).toEqual([undefined, "boot-title", undefined]);
    expect(second.style).toEqual({ gap: 8, flex: 2 });
    // The document itself keeps the custom nodes.
    expect((document.root.children![0] as { children: Array<{ type: string }> }).children.map((c) => c.type)).toEqual(["acme.Card", "acme.Card"]);
  });

  it("are laid out as what they expand to", () => {
    const { root, diagnostics } = resolveDocument(parseDocument(cards(card({}), card({})), { components: [Card] }), { components: [Card] });
    expect(diagnostics.filter((d) => d.severity !== "info")).toEqual([]);
    const row = root.children[0] as ResolvedNode;
    expect(row.children.map((c) => [(c as ResolvedNode).type, (c as ResolvedNode).width])).toEqual([
      ["Column", 300],
      ["Column", 300],
    ]);
  });

  it("report what they render that doesn't fit where they are", () => {
    const Nested = defineCustomComponent({ type: "acme.Nested", label: "Nested", props: {}, expand: () => ({ type: "Email" }) });
    const Broken = defineCustomComponent({ type: "acme.Broken", label: "Broken", props: {}, expand: () => { throw new Error("no data"); } });
    const Many = defineCustomComponent({ type: "acme.Many", label: "Many", props: {}, expand: () => [{ type: "Text" }, { type: "Text" }] });
    const Bad = defineCustomComponent({ type: "acme.Bad", label: "Bad", props: {}, expand: () => ({ type: "Text", style: { margin: 4 } }) });
    const components = [Nested, Broken, Many, Bad];
    const document = parseDocument({ version: 1, root: { type: "Email", children: components.map((c) => ({ type: c.type })) } }, { components });
    const { diagnostics } = expandDocument(document, { components });
    expect(diagnostics.map((d) => [d.code, d.path])).toEqual([
      ["children/not-allowed", "root.children[0](acme.Nested)"],
      ["custom/render", "root.children[1]"],
      ["custom/render", "root.children[2]"],
      ["style/unknown", "root.children[3](acme.Bad).style.margin"],
    ]);
    expect(diagnostics[0].path).toBe("root.children[0](acme.Nested)");
  });

  it("can render other custom components, and are stopped when one contains itself", () => {
    const Inner = defineCustomComponent({ type: "acme.Inner", label: "Inner", props: {}, expand: () => ({ type: "Text", children: ["inner"] }) });
    const Outer = defineCustomComponent({
      type: "acme.Outer",
      label: "Outer",
      props: {},
      expand: (_, context) => {
        context.register(Inner);
        return { type: "Column", children: [{ type: "acme.Inner" }] };
      },
    });
    const document = parseDocument({ version: 1, root: { type: "Email", children: [{ type: "acme.Outer" }] } }, { components: [Outer] });
    const { document: expanded, diagnostics } = expandDocument(document, { components: [Outer] });
    expect(diagnostics).toEqual([]);
    expect(JSON.stringify(expanded.root)).toBe('{"type":"Email","children":[{"type":"Column","children":[{"type":"Text","children":["inner"]}]}]}');

    const Loop = defineCustomComponent({ type: "acme.Loop", label: "Loop", props: {}, expand: () => ({ type: "acme.Loop" }) });
    const looping = parseDocument({ version: 1, root: { type: "Email", children: [{ type: "acme.Loop" }] } }, { components: [Loop] });
    expect(expandDocument(looping, { components: [Loop] }).diagnostics.map((d) => d.code)).toEqual(["custom/depth"]);
  });

  it("have namespaced names that never clash", () => {
    expect(() => defineCustomComponent({ type: "Card", label: "Card", props: {}, expand: () => ({}) })).toThrow(/namespace/);
    const Other = defineCustomComponent({ type: "acme.Card", label: "Other", props: {}, expand: () => ({}) });
    expect(() => new Registry([Card, Other])).toThrow(/Two custom components/);
  });

  it("are in the JSON Schema and described like built-in components", () => {
    const schema = documentJsonSchema({ components: [Card] }) as { $defs: Record<string, { required: string[] }> };
    expect(schema.$defs["acme.Card"].required).toEqual(["type", "props"]);
    expect(describeComponent("acme.Card")).toBeUndefined();
    const described = describeComponent("acme.Card", { components: [Card] })!;
    expect(described.properties.find((p) => p.path === "props.accent")).toMatchObject({ editor: "color", default: "#0879a1" });
    expect(described.groups).toEqual([{ title: "Card", paths: ["props.name", "props.photo", "props.href", "props.accent"] }]);
  });

  it("type their props from their definitions", () => {
    type Props = Parameters<(typeof Card)["expand"]>[0];
    expectTypeOf<Props["accent"]>().toEqualTypeOf<string>();
    expectTypeOf<Props["name"]>().toEqualTypeOf<string>();
  });
});
