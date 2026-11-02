/**
 * Templates in the new components, put together at random from a seed, for tests that check a rule over many
 * of them rather than a few examples: every output shows the same words in the same order, the builder keeps
 * what it can't edit. Each place a reader sees words holds a word of its own (`zq001`, `zq002`, …), so a test
 * can tell which one is missing or out of order.
 *
 * Plain trees (`{ type, props, style, children }`), turned into elements with the components a test passes
 * (`toElement`), so the PDF and image packages' tests use them with what they import.
 */

export interface Tree {
  type: string;
  props?: Record<string, unknown>;
  style?: Record<string, unknown>;
  children?: Array<Tree | string>;
}

export type Root = "Email" | "Page" | "Document" | "Canvas";

/** A seeded random number generator (mulberry32). */
function random(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1));
  const pick = <T>(items: readonly T[]): T => items[Math.floor(next() * items.length)];
  return { next, int, pick, chance: (p: number) => next() < p };
}

/** A template under `root` from `seed`, valid by construction (a test checks it). */
export function generate(seed: number, root: Root): Tree {
  const r = random(seed);
  let count = 0;
  const word = () => `zq${String(++count).padStart(3, "0")}`;
  const href = () => `https://example.test/${count}`;

  /** Words with runs in them: a Span, a Link, a line break, a merge tag. */
  const inline = (links = true): Array<Tree | string> => {
    const out: Array<Tree | string> = [];
    for (let i = r.int(1, 3); i > 0; i--) {
      const kind = r.pick(["text", "text", "span", "link", "break", "tag"] as const);
      if (kind === "span") out.push({ type: "Span", style: r.pick([{ fontWeight: 700 }, { color: "#aa0000" }, { fontStyle: "italic" }]), children: [word()] });
      else if (kind === "link" && links) out.push({ type: "Link", props: { href: href() }, children: [word()] });
      else if (kind === "break" && out.length) out.push({ type: "LineBreak" });
      else if (kind === "tag") out.push({ type: "MergeTag", props: { name: word() } });
      else out.push(word());
      if (typeof out[out.length - 1] === "string" && i > 1) out.push(" ");
    }
    return out;
  };

  const list = (depth: number): Tree => ({
    type: "List",
    props: r.chance(0.5) ? { type: "number" } : {},
    children: Array.from({ length: r.int(1, 3) }, () => {
      const children: Array<Tree | string> = inline();
      // A List in the item, and words after it.
      if (depth < 1 && r.chance(0.4)) {
        children.push(list(depth + 1));
        if (r.chance(0.6)) children.push(word());
      }
      return { type: "ListItem", children };
    }),
  });

  const block = (): Tree => {
    switch (r.pick(["Text", "Paragraph", "Heading", "Button", "Link", "List", "Table", "Menu", "Divider", "Image", "Video"] as const)) {
      case "Text":
        return { type: "Text", children: inline() };
      case "Paragraph":
        return { type: "Paragraph", children: inline() };
      case "Heading":
        return { type: "Heading", props: { level: r.int(1, 3) }, children: inline(false) };
      case "Button":
        return { type: "Button", props: { href: href() }, children: [word()] };
      case "Link":
        return { type: "Link", props: { href: href() }, children: [word()] };
      case "List":
        return list(0);
      case "Table": {
        const columns = r.int(1, 3);
        return {
          type: "Table",
          children: Array.from({ length: r.int(1, 3) }, (_, i) => ({
            type: "TableRow",
            props: i === 0 && r.chance(0.5) ? { header: true } : {},
            children: Array.from({ length: columns }, () => ({ type: "TableCell", children: inline(false) })),
          })),
        };
      }
      case "Menu":
        return { type: "Menu", props: { items: Array.from({ length: r.int(1, 3) }, () => ({ text: word(), href: href() })), ...(r.chance(0.5) ? { separator: "|" } : {}) } };
      case "Divider":
        return { type: "Divider" };
      case "Image":
        return { type: "Image", props: { src: { src: "https://example.test/i.png", width: 120, height: 60 }, alt: "" } };
      case "Video":
        // A Vimeo video has no thumbnail of its own: where it can't play, its title is its words (a link in an email).
        return { type: "Video", props: { src: `https://vimeo.com/${76979871 + count}`, title: word() } };
    }
  };

  /** A block, or (above the deepest level) a layout of blocks. */
  const content = (depth: number): Tree => {
    if (depth >= 2 || r.chance(0.55)) return block();
    switch (r.pick(["Row", "Column", "Grid", "Layer"] as const)) {
      case "Row":
        return { type: "Row", children: Array.from({ length: r.int(1, 3) }, () => ({ type: "Column", children: Array.from({ length: r.int(1, 2) }, () => content(depth + 1)) })) };
      case "Column":
        return { type: "Column", children: Array.from({ length: r.int(1, 2) }, () => content(depth + 1)) };
      case "Grid":
        return { type: "Grid", props: { columns: r.int(2, 3) }, children: Array.from({ length: r.int(2, 4) }, () => block()) };
      case "Layer":
        // An Image with a block over it (what an email can draw: the image as the block's background).
        return { type: "Layer", children: [{ type: "Image", props: { src: { src: "https://example.test/l.png", width: 600, height: 300 }, alt: "" } }, block()] };
    }
  };

  const top = (): Tree => (r.chance(0.2) ? { type: "Section", children: Array.from({ length: r.int(1, 2) }, () => content(1)) } : content(0));
  const body = (): Tree[] => Array.from({ length: r.int(1, 4) }, top);

  switch (root) {
    case "Email":
    case "Page":
      return { type: root, children: body() };
    case "Canvas":
      return { type: "Canvas", props: { width: 600, height: 4000 }, children: body() };
    case "Document": {
      const children: Tree[] = [];
      if (r.chance(0.4)) children.push({ type: "PageHeader", children: [{ type: "Text", children: [word()] }] });
      for (let page = r.int(1, 2); page > 0; page--) {
        children.push(...body());
        if (page > 1) children.push({ type: "PageBreak" });
      }
      if (r.chance(0.4)) children.push({ type: "PageFooter", children: [{ type: "Text", children: [word(), " ", { type: "PageNumber" }] }] });
      return { type: "Document", children };
    }
  }
}

/**
 * The words a reader sees, in the template's order: its content's, and its header's and footer's (on every page).
 * A Video's title is words where the video can't play; HTML for a page or a print plays it (`players`), its title
 * the player's.
 */
export function words(tree: Tree, { players = false } = {}): { content: string[]; margins: string[] } {
  const content: string[] = [];
  const margins: string[] = [];
  const visit = (node: Tree | string, into: string[]) => {
    if (typeof node === "string") {
      if (/^zq\d{3}$/.test(node)) into.push(node);
      return;
    }
    if (node.type === "MergeTag") into.push(String(node.props?.name));
    if (node.type === "Video" && !players) into.push(String(node.props?.title));
    if (node.type === "Menu") for (const item of node.props?.items as Array<{ text: string }>) into.push(item.text);
    const target = node.type === "PageHeader" || node.type === "PageFooter" ? margins : into;
    for (const child of node.children ?? []) visit(child, target);
  };
  visit(tree, content);
  return { content, margins };
}

/** The tree as an element, with `components` (the new components, by name). */
export function toElement(tree: Tree, components: Record<string, unknown>, createElement: (type: any, props: any, ...children: any[]) => unknown, key?: number): unknown {
  const type = components[tree.type];
  if (!type) throw new Error(`No component ${tree.type}`);
  const props = { ...(tree.props ?? {}), ...(tree.style ? { style: tree.style } : {}), ...(key !== undefined ? { key } : {}) };
  const children = (tree.children ?? []).map((child, i) => (typeof child === "string" ? child : toElement(child, components, createElement, i)));
  return createElement(type, props, ...children);
}

/**
 * Where the words of `expected` are missing from `text`, out of their order, or there more than once. Letter case
 * doesn't count: an output may write words in capitals (plain text's headings, `textTransform`).
 */
export function misplaced(shown: string, expected: readonly string[]): string[] {
  const text = shown.toLowerCase();
  const problems: string[] = expected.filter((word) => text.split(word).length > 2).map((word) => `${word} more than once`);
  let at = 0;
  for (const word of expected) {
    const next = text.indexOf(word, at);
    if (next >= 0) {
      at = next + word.length;
      continue;
    }
    problems.push(text.includes(word) ? `${word} out of order` : `${word} missing`);
  }
  return problems;
}
