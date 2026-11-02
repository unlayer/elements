/**
 * The components' reference, written from their definitions (`describeComponents()`): what each one is, what it
 * holds, which outputs draw it, and every prop and style with the values it takes. It's the package's PRIMITIVES.md,
 * for the people and agents who write templates; nothing in it is written by hand, so it can't fall behind (a test
 * checks the file is what this writes).
 */
import { describeComponents, type ComponentDescription, type PropertyDescription } from "@unlayer-internal/elements-core";

/** How a template writes a component whose definition is named otherwise. */
const JSX: Record<string, string> = { DocumentPage: "Document.Page" };
const name = (type: string) => JSX[type] ?? type;

const OUTPUTS: Record<string, string> = { email: "email", web: "page", print: "print and PDF", image: "image" };

const GROUPS: Array<{ title: string; about: string; has: (c: ComponentDescription) => boolean }> = [
  {
    title: "Roots",
    about: "A template is one of these, and the root decides the output: `render()` writes an Email's HTML, a Page's HTML, and a Document's print HTML. `renderPdf()` (`@unlayer/elements-pdf`) writes a Document's PDF, and `renderImage()` (`@unlayer/elements-image`) a Canvas's PNG or SVG (`render()` writes a Canvas's HTML, to look at).",
    has: (c) => c.categories.includes("root"),
  },
  { title: "Sections and layout", about: "Bands and boxes that arrange blocks. None is required: a root stacks its children.", has: (c) => c.categories.includes("section") || c.categories.includes("layout") },
  { title: "Blocks", about: "Content, stacked down whatever holds it.", has: (c) => c.categories.includes("block") && !c.categories.includes("layout") && !c.categories.includes("inline") },
  { title: "Inline", about: "Inside text: a styled run, a link, a line break, a merge tag.", has: (c) => c.categories.includes("inline") },
  { title: "Parts", about: "Only inside the component named: a list's items, a table's rows and cells, a document's pages, header and footer.", has: (c) => c.categories.length === 0 },
  { title: "Shapes", about: "Only inside an Svg, in its viewBox's units.", has: (c) => c.categories.includes("shape") },
];

/** Value kinds described once, in "Values", rather than on every property that takes one. */
function glossary(all: ComponentDescription[]): Map<string, string> {
  const accepts = new Map<string, Set<string>>();
  for (const p of all.flatMap((c) => c.properties)) accepts.set(p.kind, (accepts.get(p.kind) ?? new Set()).add(p.accepts));
  return new Map([...accepts].filter(([, texts]) => texts.size === 1 && [...texts][0].length > 30).map(([kind, texts]) => [kind, [...texts][0]]));
}

const code = (value: unknown) => `\`${JSON.stringify(value)}\``;

function property(p: PropertyDescription, named: Map<string, string>): string {
  const key = p.path.slice(p.path.indexOf(".") + 1);
  const takes = named.has(p.kind) ? `*${p.kind}*` : p.accepts;
  const notes = [p.required ? "required" : "", p.default !== undefined ? `default ${code(p.default)}` : "", p.inherited ? "inherited" : ""].filter(Boolean);
  return `- \`${key}\`: ${takes}${notes.length ? ` (${notes.join(", ")})` : ""}${p.description ? `. ${p.description.replace(/\.$/, "")}.` : ""}`;
}

function component(c: ComponentDescription, all: ComponentDescription[], named: Map<string, string>): string {
  const inCategory = (category: string) => all.filter((other) => other.categories.includes(category as never)).map((other) => name(other.type));
  const holds = [...new Set([...c.children.categories.flatMap(inCategory), ...c.children.types.map(name)])];
  const children = [c.children.text ? "text" : "", holds.join(", ")].filter(Boolean).join("; ");
  const props = c.properties.filter((p) => p.path.startsWith("props."));
  const style = c.properties.filter((p) => p.path.startsWith("style."));
  const hover = c.properties.filter((p) => p.path.startsWith("hover.")).map((p) => `\`${p.path.slice(6)}\``);
  const phone = style.filter((p) => p.mobile).map((p) => `\`${p.path.slice(6)}\``);
  return [
    `### ${name(c.type)}`,
    "",
    c.description,
    "",
    `Holds: ${children || "nothing"}. Drawn in: ${c.targets.map((t) => OUTPUTS[t] ?? t).join(", ")}.`,
    ...(props.length ? ["", "Props:", ...props.map((p) => property(p, named))] : []),
    ...(style.length ? ["", "`style`:", ...style.map((p) => property(p, named))] : []),
    ...(hover.length ? ["", `\`hover\`: ${hover.join(", ")}.`] : []),
    ...(phone.length ? ["", `\`mobile\` (on phones): ${phone.join(", ")}.`] : []),
  ].join("\n");
}

export function primitivesReference(): string {
  const all = describeComponents();
  const named = glossary(all);
  const placed = new Set<string>();
  const sections = GROUPS.map((group) => {
    const members = all.filter((c) => !placed.has(c.type) && group.has(c));
    for (const c of members) placed.add(c.type);
    return [`## ${group.title}`, "", group.about, "", members.map((c) => component(c, all, named)).join("\n\n")].join("\n");
  });
  const missing = all.filter((c) => !placed.has(c.type)).map((c) => c.type);
  if (missing.length) throw new Error(`[Elements] The reference has no section for ${missing.join(", ")}`);
  return [
    "# Components reference (`@unlayer/react-elements/primitives`)",
    "",
    "<!-- Written from the component definitions by src/primitives/reference.ts: don't edit by hand. Regenerate with UPDATE_REFERENCE=1 pnpm --filter @unlayer/react-elements test reference -->",
    "",
    "Every component, what it holds, and every prop and style it takes. The [README](./README.md#new-components-unlayerreact-elementsprimitives) shows how a template is written; `validate()` checks one against what's here.",
    "",
    "Every component also takes:",
    "",
    "- `style={{ … }}`: the styles listed under it. A number is px (`padding: 16` is `16px`).",
    "- `mobile={{ … }}`: style overrides on phones, in an `Email` or a `Page`, for the styles listed under \"`mobile`\".",
    "- `hover={{ … }}`: styles on hover, for the ones listed under \"`hover`\".",
    "- `hidden={{ mobile: true }}` or `hidden={{ desktop: true }}`: shown on one only.",
    "- `id`: an id of your own, written into the HTML.",
    "",
    "## Values",
    "",
    "What a property takes, where it says *kind*:",
    "",
    ...[...named].map(([kind, accepts]) => `- *${kind}*: ${accepts}`),
    "",
    sections.join("\n\n"),
    "",
  ].join("\n");
}
