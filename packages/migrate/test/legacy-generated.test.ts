/**
 * Templates in today's components put together at random, with every kind of value each of their props takes
 * today (a number, a size in px, a string of digits, a keyword, a shorthand, a phone setting), migrated by the
 * codemod: the template it writes must be valid as the new components check it. A value the new components take
 * otherwise is converted, or left out and said; it's never written as something render() rejects.
 *
 *   MIGRATE_SEEDS=2000 pnpm vitest run test/legacy-generated.test.ts
 */
import { describe, expect, it } from "vitest";
import { migrateElements } from "../src/legacy/codemod";
import { errors } from "./migrated";

const SEEDS = Number(process.env.MIGRATE_SEEDS ?? 150);

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
  return { int: (min: number, max: number) => min + Math.floor(next() * (max - min + 1)), pick: <T>(items: readonly T[]): T => items[Math.floor(next() * items.length)], chance: (p: number) => next() < p };
}

// Values as today's components take them, as source.
const size = ["14", '"14px"', '"18px"'];
const lineHeight = ["1.5", '"1.5"', '"150%"', '"24px"', '"140%"'];
const letterSpacing = ["1", '"1px"', '"-0.5px"', '"0.1em"'];
const fontWeight = ["400", "700", '"700"', '"bold"', '"normal"', '"bolder"', '"lighter"', "650", '"300"'];
const fontFamily = ['"Georgia, serif"', '{ label: "Arial", value: "arial,helvetica,sans-serif" }'];
const color = ['"#123456"', '"red"', '"rgba(0, 0, 0, 0.5)"', '"transparent"', '""'];
const align = ['"left"', '"center"', '"right"'];
const padding = ["10", '"10px"', '"10px 20px"', '"5px 10px 15px 20px"', '"0px"'];
const href = ['"https://example.test/a"', '"mailto:hi@example.test"'];

type Props = Record<string, readonly string[]>;
const TEXT: Props = {
  fontSize: size,
  fontWeight,
  lineHeight,
  letterSpacing,
  color,
  textAlign: [...align, '"justify"'],
  fontFamily,
  containerPadding: padding,
  textTransform: ['"uppercase"', '"none"'],
  textDirection: ['"ltr"', '"rtl"'],
  hideOnMobile: ["true"],
};
const TEXT_PHONE: Props = { fontSize: size, lineHeight, textAlign: align, containerPadding: padding };
/** Today's inline HTML for a text block's words. */
const html = [
  `'<b>Bold</b> and <i>italic</i>'`,
  `'<span style="font-weight:600;color:#123456">Weighted</span> words'`,
  `'<span style="font-size:18px">Big</span><br>next line'`,
  `'<a href="https://example.test/l" style="color:#0000ee">a link</a> &amp; more'`,
  `'<span style="line-height:2">Spaced</span>'`,
  `'<p style="line-height: 140%;">One &amp; two</p><p>Three <a href="https://example.test/l" target="_blank">four</a></p>'`,
  `'Logo <img src="https://example.test/i.png" alt="Logo"> <sup>1</sup><ul><li>Item</li><li>Next</li></ul>'`,
];

/** Each of today's blocks: its props, its phone settings, and what it holds. */
const BLOCKS: Record<string, { props: Props; phone?: Props; body?: () => string }> = {
  Heading: { props: { ...TEXT, headingType: ['"h1"', '"h2"', '"h3"'], html }, phone: TEXT_PHONE, body: () => "Title" },
  Paragraph: { props: { ...TEXT, html }, phone: TEXT_PHONE, body: () => "Words" },
  Text: { props: { ...TEXT, html }, phone: TEXT_PHONE, body: () => "Words" },
  Button: {
    props: { href, width: ['"auto"', '"50%"', "200", '"200px"'], backgroundColor: color, color, fontSize: size, fontWeight, lineHeight, letterSpacing, padding: ['"10px 20px"', "12"], borderRadius: ["4", '"4px"'], textAlign: align, containerPadding: padding },
    phone: { width: ['"100%"', "200"], autoWidth: ["true", "false"], fontSize: size, lineHeight, padding: ['"8px 16px"'], textAlign: align },
    body: () => "Go",
  },
  Image: {
    props: {
      src: ['"https://example.test/i.png"', '{ url: "https://example.test/i.png", width: 600, height: 300 }', "undefined"],
      altText: ['"A photo"'],
      width: ["300", '"300px"', '"50%"'],
      maxWidth: ['"100%"', "400", '"400px"'],
      action: ['"https://example.test/go"', '{ name: "web", values: { href: "https://example.test/go", target: "_self" } }'],
      textAlign: align,
      containerPadding: padding,
    },
    phone: { autoWidth: ["true"], width: ['"100%"', "300"], maxWidth: ['"100%"'] },
  },
  Divider: {
    props: { borderTopWidth: ['"1px"', "2"], borderTopStyle: ['"solid"', '"dashed"', '"dotted"'], borderTopColor: color.slice(0, 3), width: ['"100%"', '"50%"', "300"], containerPadding: padding, textAlign: align },
    phone: { containerPadding: padding, width: ['"100%"'] },
  },
  Social: {
    props: {
      icons: ['[{ name: "Facebook", url: "https://facebook.com/acme" }]', '[{ name: "X", url: "https://x.com/acme", target: "_self" }]'],
      iconType: ['"circle"', '"rounded"', '"squared"'],
      iconSize: ["32", '"32px"'],
      spacing: ["5", '"5px"'],
      align,
    },
  },
  Menu: {
    props: {
      items: ['[{ text: "Home", href: "/" }, { text: "Blog", href: "/blog" }]', '[{ text: "Home", href: "/", target: "_self" }]', '[{ text: "Docs", href: "/docs", target: "_blank" }]'],
      separator: ['"|"'],
      layout: ['"horizontal"', '"vertical"'],
      linkColor: color.slice(0, 3),
      textColor: color.slice(0, 3),
      fontSize: size,
      fontWeight,
      letterSpacing,
      padding: ["5", '"5px 10px"'],
      align,
    },
    phone: { fontSize: size, padding: ["4", '"4px 8px"'] },
  },
  Video: { props: { videoUrl: ['"https://youtu.be/dQw4w9WgXcQ"', '"https://vimeo.com/76979871"'] } },
  // No new version yet: left out, and said.
  Html: { props: { html: [`'<table><tr><td>Raw</td></tr></table>'`] } },
  Table: { props: {} },
  Spacer: { props: { height: ["20", '"20px"'] } },
};
const ROW: Props = { padding: padding, backgroundColor: color, columnsBackgroundColor: color, noStackMobile: ["true"], hideOnMobile: ["true"] };
const COLUMN: Props = { backgroundColor: color, padding: padding, borderTopWidth: ['"1px"'], borderTopStyle: ['"solid"'], borderTopColor: ['"#cccccc"'], borderRadius: ["6"] };
const LAYOUTS: Array<[string, number]> = [["ColumnLayouts.Single", 1], ["ColumnLayouts.TwoEqual", 2], ["ColumnLayouts.ThreeEqual", 3], ["ColumnLayouts.OneThirdTwoThirds", 2], ["ColumnLayouts.FourEqual", 4]];

/** A template's source, from `seed`. */
function template(seed: number): string {
  const r = random(seed);
  const attributes = (props: Props, most: number) => {
    const names = Object.keys(props);
    const out: string[] = [];
    if (!names.length) return out;
    for (let i = r.int(0, most); i > 0; i--) {
      const name = r.pick(names);
      if (out.some((a) => a.startsWith(`${name}=`))) continue;
      out.push(`${name}={${r.pick(props[name])}}`);
    }
    return out;
  };
  const block = () => {
    const type = r.pick(Object.keys(BLOCKS));
    const spec = BLOCKS[type];
    const attrs = attributes(spec.props, 4);
    if (spec.phone && r.chance(0.3)) attrs.push(`mobile={{ ${attributes(spec.phone, 2).map((a) => a.replace(/^(\w+)=\{([\s\S]*)\}$/, "$1: $2")).join(", ")} }}`);
    const body = spec.body?.();
    return body ? `<${type} ${attrs.join(" ")}>${body}</${type}>` : `<${type} ${attrs.join(" ")} />`;
  };
  const row = () => {
    const [layout, count] = r.pick(LAYOUTS);
    const columns = Array.from({ length: count }, () => `<Column ${attributes(COLUMN, 2).join(" ")}>${Array.from({ length: r.int(1, 2) }, block).join("")}</Column>`);
    return `<Row layout={${layout}} ${attributes(ROW, 2).join(" ")}>${columns.join("")}</Row>`;
  };
  const root = r.pick(["Email", "Page"]);
  const rootAttributes = attributes({ contentWidth: ["600", '"600px"'], backgroundColor: color.slice(0, 2), textColor: color.slice(0, 2), fontFamily }, 2);
  const rows = Array.from({ length: r.int(1, 3) }, row).join("\n    ");
  return `import { ${root}, Row, Column, ColumnLayouts, ${Object.keys(BLOCKS).join(", ")} } from "@unlayer/react-elements";
export const T = () => (
  <${root} ${rootAttributes.join(" ")}>
    ${rows}
  </${root}>
);`;
}

describe("templates in today's components, migrated", () => {
  it(`are valid in the new components (${SEEDS} templates)`, async () => {
    const failures: string[] = [];
    for (let seed = 1; seed <= SEEDS; seed++) {
      const source = template(seed);
      const { code } = await migrateElements(source);
      const found = errors(code);
      if (found.length) failures.push(`seed ${seed}: ${found.join("; ")}\n${source}`);
    }
    expect(failures.slice(0, 6)).toEqual([]);
  }, 120_000);
});
