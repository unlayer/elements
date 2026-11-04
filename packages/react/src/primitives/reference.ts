/**
 * The docs the package ships for writing templates, from the components' definitions (`describeComponents()`), so
 * they can't fall behind (a test checks the files are what this writes):
 *
 * - PRIMITIVES.md, the guide: how a template is written, a whole one, and each component on a line (what it holds,
 *   its props and styles), short enough to read whole before writing one. It's what an agent needs.
 * - PRIMITIVES-REFERENCE.md: every prop and style, with the values it takes, its default and what it does.
 * - skills/unlayer-elements/SKILL.md, at the repository's root: the guide as an agent skill.
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

/** The note at the top of each file this writes, naming this file as `from` the file's own folder. */
const generated = (from: string) => `<!-- Written from the component definitions by ${from}: don't edit by hand. Regenerate with UPDATE_REFERENCE=1 pnpm --filter @unlayer/react-elements test reference -->`;
const GENERATED = generated("src/primitives/reference.ts");

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
    GENERATED,
    "",
    "Every component, what it holds, and every prop and style it takes, with its default and what it does. [PRIMITIVES.md](./PRIMITIVES.md) shows how a template is written; `validate()` checks one against what's here.",
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

// ─── The guide ─────────────────────────────────────────────────────────────

/** Styles most components share, named as a group on a component's line. */
const TEXT = ["color", "fontFamily", "fontSize", "fontWeight", "fontStyle", "lineHeight", "letterSpacing", "textAlign", "textTransform"];
const BOX = ["width", "maxWidth", "padding", "backgroundColor", "border", "borderRadius"];
const CATEGORY: Record<string, string> = { section: "sections", layout: "layout", block: "blocks", inline: "inline", shape: "shapes" };

/**
 * A value as short as it can be said: an enum's options, a kind the Values section names, else what it takes in
 * full (a Menu's items are `{ text, href }`, a Social's icons `{ name, href }`: the shape is what gets written wrong).
 */
function short(p: PropertyDescription, named: Map<string, string>): string {
  const options = /^one of (.*)$/.exec(p.accepts)?.[1];
  if (options) return options.replace(/"/g, "").split(", ").join("|");
  return named.has(p.kind) ? p.kind : p.accepts;
}

/** Keys, with the shared groups named where all of a group's keys are there. */
function keys(found: string[], describe: (key: string) => string = (key) => key): string {
  const out: string[] = [];
  let rest = found;
  for (const [group, members] of [["text", TEXT], ["box", BOX]] as const) {
    if (members.every((key) => rest.includes(key))) {
      out.push(group);
      rest = rest.filter((key) => !members.includes(key));
    }
  }
  return [...out, ...rest.map(describe)].join(", ");
}

function line(c: ComponentDescription, named: Map<string, string>): string {
  const of = (prefix: string) => c.properties.filter((p) => p.path.startsWith(prefix));
  const byKey = new Map(c.properties.map((p) => [p.path, p]));
  const enumOf = (prefix: string) => (key: string) => {
    const p = byKey.get(`${prefix}${key}`)!;
    return /^one of /.test(p.accepts) ? `${key} (${short(p, named)})` : key;
  };
  const props = of("props.").map((p) => `${p.path.slice(6)}${p.required ? "*" : ""} (${short(p, named)})`);
  const style = of("style.").map((p) => p.path.slice(6));
  const hover = of("hover.").map((p) => p.path.slice(6));
  const phone = of("style.").filter((p) => p.mobile).map((p) => p.path.slice(6));
  const holds = [c.children.text ? "text" : "", ...c.children.categories.map((category) => CATEGORY[category] ?? category), ...c.children.types.map(name)].filter(Boolean);
  const parts = [
    `${c.description.replace(/\.$/, "")}.`,
    holds.length ? `Holds ${holds.join(", ")}.` : "",
    props.length ? `Props: ${props.join(", ")}.` : "",
    style.length ? `Style: ${keys(style, enumOf("style."))}.` : "",
    hover.length ? `Hover: ${hover.join(", ")}.` : "",
    phone.length ? `Phones: ${keys(phone)}.` : "",
  ].filter(Boolean);
  return `- **${name(c.type)}**: ${parts.join(" ")}`;
}

/** PRIMITIVES.md: how a template is written, the README's template (`example`, as an author imports it), and each component on a line. */
export function primitivesGuide(example: string): string {
  return [
    "# Writing templates with the new components (`@unlayer/react-elements/primitives`)",
    "",
    GENERATED,
    "",
    "Everything needed to write a template, in short. Every prop's and style's details: [PRIMITIVES-REFERENCE.md](./PRIMITIVES-REFERENCE.md).",
    "",
    guide(example),
  ].join("\n");
}

/** What the skill's frontmatter says, which is how an agent decides to load it. */
const SKILL_DESCRIPTION =
  "Write emails, web pages, printed documents, PDFs and images in code with Unlayer Elements (@unlayer/react-elements), React components that render email-safe HTML, responsive page HTML, print HTML, PDFs and PNG or SVG images. Use when writing or changing an Elements template, or when asked to build an email, page, document, PDF or image in code with Elements.";

/**
 * skills/unlayer-elements/SKILL.md, at the repository's root, which `npx skills add unlayer/elements` installs: the
 * guide, as PRIMITIVES.md has it, under the frontmatter a skill needs and a few lines for projects already on today's
 * components. An agent given the guide before writing a template gets it right on the first try far more often.
 */
export function primitivesSkill(example: string): string {
  return [
    "---",
    "name: unlayer-elements",
    `description: ${SKILL_DESCRIPTION}`,
    "---",
    "",
    "# Unlayer Elements",
    "",
    generated("packages/react/src/primitives/reference.ts"),
    "",
    "Write emails, web pages, printed documents, PDFs and images in code with Elements (`npm install @unlayer/react-elements`). This is the package's own guide to its components at `@unlayer/react-elements/primitives` (PRIMITIVES.md in the package), written from their definitions: everything needed to write a template, in short. Every prop's and style's details, with its default: `node_modules/@unlayer/react-elements/PRIMITIVES-REFERENCE.md`.",
    "",
    "## Templates on today's components",
    "",
    "A project may already have templates on today's components: they import from `@unlayer/react-elements` (or `@unlayer/react-elements/legacy`, the same entry), not `/primitives`, and use `ColumnLayouts`, `html` props and `renderToHtml()`.",
    "",
    "- They keep working. Their API is unchanged, and since 0.3.0 they render through the same engine as the new components: content, links, images and layout are preserved, and input that can't be drawn gets a diagnostic.",
    "- The two sets don't mix: a template uses one or the other. When changing one of these templates, keep its components, or move it first.",
    "- To move them, the codemod: `npx @unlayer/migrate src/emails --from elements` lists what it would change, `--write` replaces the files (only those git can restore) and `--report notes.md` writes what it noted. It rewrites the imports and the JSX, and keeps props, loops and conditions. The new components render with `await render(element)`, which is async, in place of `renderToHtml()`. More: https://github.com/unlayer/elements/blob/main/docs/migrating-to-primitives.md",
    "",
    guide(example),
  ].join("\n");
}

/** The guide itself, from "How a template is written" on: the same in PRIMITIVES.md and the skill. */
function guide(example: string): string {
  const all = describeComponents();
  const named = glossary(all);
  const placed = new Set<string>();
  const sections = GROUPS.map((group) => {
    const members = all.filter((c) => !placed.has(c.type) && group.has(c));
    for (const c of members) placed.add(c.type);
    return [`### ${group.title}`, "", ...members.map((c) => line(c, named))].join("\n");
  });
  return [
    "## How a template is written",
    "",
    "- Import from `@unlayer/react-elements/primitives`. A template has one root: `Email`, `Page`, `Document` or `Canvas`.",
    "- Styles go in `style={{ … }}`, never as props: `<Heading style={{ fontSize: 24, color: \"#111827\" }}>`. A number is px; `padding` takes `16`, `[12, 24]` or `\"12px 24px\"`. A box's text styles are inherited by what it holds.",
    "- There are no margins: space between blocks is their parent's `gap` (`<Column style={{ gap: 16 }}>`), space inside a box its `padding`.",
    "- A root, a `Section` and a `Column` stack their children. A `Row` puts its children side by side (each `Column` at its `style.width`, or an equal share) and stacks them on phones. `Grid columns={3}` makes rows of three. A `Section` is a band whose background spans the window; a `Column` with a background is a card.",
    "- Text is components, not HTML: `Heading level={1}`, `Paragraph` and `Text` hold text; inside them `Span` styles a run, `Link href` links one, `LineBreak` breaks the line and `MergeTag name` writes a merge tag. No raw HTML (`<b>`, `<br>`, `<div>`) and no `html` prop.",
    "- `Image src={{ src, width, height }}` (the file's size in px) with `alt`; `style.width` sets the size shown.",
    "- Lists: `<List type=\"number\">` of `ListItem`s. Tables: a `Table` of `TableRow`s (`header` on the first) of `TableCell`s, with `cellPadding` and `rowBorder` in the Table's `style`.",
    "- Phones: `mobile={{ fontSize: 20 }}` (the styles listed under \"Phones\"), `hidden={{ mobile: true }}`. Hover: `hover={{ backgroundColor: \"#374151\" }}` (those under \"Hover\").",
    "- `await render(element)` gives `{ html, text, diagnostics }`; a template with errors throws an `ElementsError` whose `diagnostics` give each problem's `code`, `message` and `path`. `validate(element)` runs the same checks without rendering. `outline(element)` prints the laid-out template (each block, its width, its text), to check the layout without reading the HTML.",
    "",
    "## Common mistakes",
    "",
    "Each of these made an agent's first try fail:",
    "",
    "- `<Email backgroundColor=\"#fff\">` → `<Email style={{ backgroundColor: \"#fff\" }}>`. Styles never go as props.",
    "- `<Email style={{ width: 600, padding: 24 }}>` → `<Email width={600}>`, with the padding on a `Column` (a card) or a `Section` (a band) inside it. A root's width is a prop, and a root has no padding.",
    "- `items={[{ text: \"Home\", link: \"/\" }]}` → `items={[{ text: \"Home\", href: \"/\" }]}`. A `Menu`'s items are `{ text, href }`, a `Social`'s icons `{ name, href }`.",
    "- `style={{ marginBottom: 16 }}` → `gap: 16` on the parent. There are no margins.",
    "- `ColumnLayouts`, `layout`, `headingType`, `altText`, `html` are the main import's props, not these: a `Row` of `Column`s, `level`, `alt`, and text as children.",
    "- `<Image src=\"https://example.com/logo.png\">` → `src={{ src: \"https://example.com/logo.png\", width: 240, height: 80 }}`, the file's size. Without it Outlook shows the image at its file's size, and Elements warns.",
    "",
    "## A whole template",
    "",
    "```tsx",
    example.trim(),
    "```",
    "",
    "## Components",
    "",
    `\\* required. *text* styles: ${TEXT.join(", ")}. *box* styles: ${BOX.join(", ")}.`,
    "",
    sections.join("\n\n"),
    "",
    "## Values",
    "",
    ...[...named].map(([kind, accepts]) => `- *${kind}*: ${accepts}`),
    "",
  ].join("\n");
}
