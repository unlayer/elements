/**
 * Designs put together at random from the values the editor writes (and some it doesn't: numbers where it writes
 * px, `rgb()` colors, alignments no prop takes, links in every shape), each converted, rendered back and compared:
 * every one must come back the same, render without a word from Elements, type-check, and be written as prettier
 * writes it.
 *
 *   CODEGEN_SEEDS=2000 pnpm vitest run src/codegen/generated.test.ts
 */
import { describe, expect, it, vi } from "vitest";
import path from "node:path";
import * as prettier from "prettier";
import { PACKAGE, roundTrip, typecheck } from "./test-harness";
import type { DisplayMode } from "./design-to-elements";
import type { Plain } from "./values";

const SEEDS = Number(process.env.CODEGEN_SEEDS ?? 300);

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
  const pick = <T,>(list: readonly T[]): T => list[Math.floor(next() * list.length)];
  const chance = (p: number) => next() < p;
  /** Some of `entries`, each with probability `p`. */
  const some = (entries: Record<string, () => unknown>, p = 0.4): Plain => Object.fromEntries(Object.entries(entries).filter(() => chance(p)).map(([key, make]) => [key, make()]));
  return { next, pick, chance, some };
}

const COLORS = ["#ffffff", "#1A1F36", "#ff0000", "rgb(10, 20, 30)", "rgba(0, 0, 0, 0.5)", "transparent"];
const SIZES = ["12px", "16px", "28px", "1.5em", 14];
const PADDINGS = ["0px", "10px", "8px 16px", "4px 8px 12px 16px", "0px 0px", 12];
const LINE_HEIGHTS = ["140%", "120%", "1.5", 1.4, "24px"];
const ALIGNS = ["left", "center", "right", "justify", "start"];
const WEIGHTS = [400, 600, 700, "700", "bold"];
const FONTS = [
  { label: "Georgia", value: "georgia,serif" },
  { label: "Montserrat", value: "'Montserrat',sans-serif", url: "https://fonts.googleapis.com/css?family=Montserrat:400,700", defaultFont: true },
  { label: "Inter", value: "'Inter', Arial, sans-serif", url: "https://fonts.googleapis.com/css2?family=Inter" },
  { label: "Quoted", value: '"Helvetica Neue", Arial, sans-serif' },
];
const TEXTS = ["Hello", "Hello there, friend", "Fish & chips", "Fish &amp; chips", "<p>Hi <strong>you</strong></p>", "Don't stop", "{{first_name}}", "  spaced  ", "Line\nbreak", "Café — “quoted”", "<%name%> wins", "a  b", "<p>One</p><p>Two</p>"];
const LINKS = [
  { name: "web", values: { href: "https://example.com", target: "_blank" } },
  { name: "web", values: { href: "https://example.com/self", target: "_self" } },
  { name: "email", values: { email: "hi@example.com", subject: "Hello", body: "" } },
  { name: "web", values: { href: "https://example.com/attrs", target: "_blank" }, attrs: { href: "{{href}}", target: "{{target}}" } },
  "https://example.com/string",
  // As the editor saves them: their templates, and what they keep of other link types.
  { name: "email", values: { href: "", target: "_blank", email: "support@example.com", subject: "Help & more?", body: "Hi,\nthere" }, attrs: { href: "mailto:{{email}}?subject={{subject}}&body={{body}}" } },
  { name: "phone", values: { href: "", target: "_blank", phone: "+15550100" }, attrs: { href: "tel:{{phone}}" } },
  { name: "sms", values: { phone: "+15550100" }, attrs: { href: "sms:{{phone}}" } },
  { name: "web", values: { href: "", target: "_blank" }, attrs: { href: "{{href}}", target: "{{target}}" } },
];
const URLS = ["https://example.com/a.png", "https://cdn.example.com/photo.jpg?w=1200&q=80"];

function generate(seed: number): { design: Plain; displayMode: DisplayMode } {
  const r = random(seed);
  const displayMode = r.pick(["email", "email", "web", "document"] as const);
  const textStyle = () => r.some({ fontSize: () => r.pick(SIZES), color: () => r.pick(COLORS), textAlign: () => r.pick(ALIGNS), lineHeight: () => r.pick(LINE_HEIGHTS), fontWeight: () => r.pick(WEIGHTS), fontFamily: () => r.pick(FONTS), letterSpacing: () => r.pick(["1px", 2, "0.05em"]) }, 0.3);
  const base = () =>
    r.some({
      containerPadding: () => r.pick(PADDINGS),
      anchor: () => r.pick(["", "intro"]),
      locked: () => r.chance(0.5),
      hideDesktop: () => r.chance(0.3),
      displayCondition: () => (r.chance(0.5) ? null : { type: "vip", label: "VIP", description: "VIPs", before: "{% if vip %}", after: "{% endif %}" }),
      _override: () => ({
        mobile: r.some({ fontSize: () => r.pick(SIZES), textAlign: () => r.pick(ALIGNS), containerPadding: () => r.pick(PADDINGS), lineHeight: () => r.pick(LINE_HEIGHTS), hideMobile: () => r.chance(0.5), color: () => r.pick(COLORS) }, 0.3),
        desktop: r.some({ hideDesktop: () => r.chance(0.5) }, 0.5),
      }),
    }, 0.25);
  const blocks: Record<string, () => Plain> = {
    text: () => ({ type: "text", values: { ...base(), ...textStyle(), text: r.pick(TEXTS), ...r.some({ linkStyle: () => ({ inherit: false, linkColor: r.pick(COLORS), linkHoverColor: "#0000ee", linkUnderline: r.chance(0.5), linkHoverUnderline: true }) }, 0.2) } }),
    paragraph: () => ({ type: "paragraph", values: { ...base(), ...textStyle(), textJson: JSON.stringify({ root: { type: "root", children: [{ type: "paragraph", children: [{ type: "text", text: r.pick(["Lexical", "Bold & sure"]), format: r.pick([0, 1, 2]) }] }] } }) } }),
    heading: () => ({ type: "heading", values: { ...base(), ...textStyle(), text: r.pick(TEXTS), ...r.some({ headingType: () => r.pick(["h1", "h2", "h3", "h6"]) }, 0.6) } }),
    button: () => ({
      type: "button",
      values: {
        ...base(),
        ...textStyle(),
        text: r.pick(TEXTS),
        ...r.some({
          href: () => r.pick(LINKS),
          buttonColors: () => r.some({ color: () => r.pick(COLORS), backgroundColor: () => r.pick(COLORS), hoverColor: () => r.pick(COLORS), hoverBackgroundColor: () => r.pick(COLORS) }, 0.5),
          size: () => r.pick([{ autoWidth: true, width: "100%" }, { autoWidth: false, width: "60%" }, { autoWidth: true, width: "40%" }, { autoWidth: false, width: "200px" }]),
          padding: () => r.pick(PADDINGS),
          borderRadius: () => r.pick(["4px", "8px", 6]),
          border: () => ({ borderTopWidth: "2px", borderTopStyle: "solid", borderTopColor: r.pick(COLORS) }),
          _override: () => ({ mobile: r.pick([{ size: { autoWidth: false, width: "100%" } }, { size: { autoWidth: true } }, { padding: "6px 12px" }]) }),
        }),
      },
    }),
    image: () => ({
      type: "image",
      values: {
        ...base(),
        src: r.pick([
          { url: r.pick(URLS) },
          { url: r.pick(URLS), autoWidth: true, maxWidth: "100%" },
          { url: r.pick(URLS), width: 800, height: 400, autoWidth: true, maxWidth: "100%" },
          { url: r.pick(URLS), width: 800, height: 400, autoWidth: false, maxWidth: r.pick(["45%", "70.87%", "100%"]) },
          { url: r.pick(URLS), width: 1200, height: 600, autoWidth: false, maxWidth: "50%", contentType: "image/png", filename: "a.png" },
          { url: r.pick(URLS), width: 800, height: 400 },
        ]),
        ...r.some({ altText: () => r.pick(["", "A photo", 'Say "cheese"']), textAlign: () => r.pick(ALIGNS), action: () => r.pick(LINKS.filter((l) => typeof l !== "string")), _override: () => ({ mobile: { src: r.pick([{ autoWidth: true }, { autoWidth: false, maxWidth: "80%" }]) } }) }),
      },
    }),
    divider: () => ({ type: "divider", values: { ...base(), ...r.some({ width: () => r.pick(["100%", "60%"]), textAlign: () => r.pick(ALIGNS), border: () => ({ borderTopWidth: r.pick(["1px", "3px"]), borderTopStyle: r.pick(["solid", "dashed"]), borderTopColor: r.pick(COLORS) }) }) } }),
    html: () => ({ type: "html", values: { ...base(), html: r.pick(['<div class="x">Raw &amp; <em>HTML</em></div>', "<table><tr><td>Cell</td></tr></table>", "<p>Say 'hi' \"there\"</p>"]) } }),
    menu: () => ({
      type: "menu",
      values: {
        ...base(),
        menu: { items: r.pick([[{ key: "1", text: "Docs", link: LINKS[0] }, { key: "2", text: "Blog", link: LINKS[1] }], [{ key: "1606923979749", text: "Call", link: { name: "phone", values: { phone: "+15550100" } } }]]) },
        ...r.some({ fontSize: () => r.pick(SIZES), textColor: () => r.pick(COLORS), linkColor: () => r.pick(COLORS), align: () => r.pick(ALIGNS), layout: () => r.pick(["horizontal", "vertical"]), separator: () => r.pick(["", "|"]), padding: () => r.pick(PADDINGS) }),
      },
    }),
    social: () => ({
      type: "social",
      values: {
        ...base(),
        icons: { iconType: r.pick(["circle", "rounded", "squared", "circle-black"]), icons: [{ name: "Facebook", url: "https://facebook.com/acme" }, ...(r.chance(0.3) ? [{ name: "Custom", url: "https://example.com", imgUrl: "https://example.com/icon.png" }] : [])] },
        ...r.some({ iconSize: () => r.pick([24, 32]), spacing: () => r.pick([5, 10]), align: () => r.pick(ALIGNS) }),
      },
    }),
    table: () => {
      const columns = r.pick([1, 2, 3]);
      const rows = r.pick([0, 1, 2]);
      const cell = (text: string) => ({ text, width: 0 });
      const row = (fill: (i: number) => string) => ({ cells: Array.from({ length: columns }, (_, i) => cell(fill(i))), height: 0 });
      const headers = r.chance(0.5) ? [row((i) => `H${i}`)] : [];
      const empty = r.chance(0.3);
      return {
        type: "table",
        values: {
          ...base(),
          columns,
          rows,
          enableHeader: r.pick([true, false]),
          table: { headers, rows: Array.from({ length: rows }, (_, k) => row((i) => (empty ? "" : `R${k}C${i}`))), footers: r.chance(0.2) ? [row(() => "F")] : [] },
          ...r.some({ stripedRows: () => r.chance(0.5), headerBackgroundColor: () => r.pick(COLORS), contentFontSize: () => r.pick(SIZES), headerColor: () => r.pick(COLORS), headerFontWeight: () => r.pick(WEIGHTS), headerPadding: () => r.pick(PADDINGS) }),
        },
      };
    },
    video: () => ({
      type: "video",
      values: {
        ...base(),
        video: r.pick([
          { type: "youtube", videoId: "aqz-KE-bpKQ", thumbnail: "https://img.youtube.com/vi/aqz-KE-bpKQ/0.jpg", loading: false },
          { type: "youtube", videoId: "aqz-KE-bpKQ", thumbnail: "https://img.youtube.com/vi/aqz-KE-bpKQ/0.jpg", loading: false, url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ" },
          { type: "vimeo", videoId: "76979871", thumbnail: "", loading: false },
          {},
        ]),
      },
    }),
  };
  const kinds = Object.keys(blocks);
  const layouts = [[1], [1, 1], [2, 1], [1, 2], [1, 1, 1], [1, 2, 1], [1, 1, 1, 1], [3, 1]];
  const rows = Array.from({ length: 1 + Math.floor(r.next() * 3) }, () => {
    const cells = r.pick(layouts);
    return {
      cells,
      columns: cells.map(() => ({
        values: r.some({ backgroundColor: () => r.pick(COLORS), padding: () => r.pick(PADDINGS), borderRadius: () => r.pick(["8px", "0px"]), border: () => ({ borderTopWidth: "1px", borderTopStyle: "solid", borderTopColor: r.pick(COLORS) }), _override: () => ({ mobile: { padding: r.pick(PADDINGS) } }) }, 0.3),
        contents: Array.from({ length: Math.floor(r.next() * 3) }, () => blocks[r.pick(kinds)]()),
      })),
      values: r.some({
        backgroundColor: () => r.pick(COLORS),
        columnsBackgroundColor: () => r.pick(COLORS),
        padding: () => r.pick(PADDINGS),
        backgroundImage: () => ({ url: r.pick(URLS), fullWidth: r.chance(0.5), repeat: "no-repeat", size: r.pick(["cover", "custom"]), position: "center" }),
        anchor: () => "section",
        _override: () => ({ mobile: r.some({ padding: () => r.pick(PADDINGS), noStackMobile: () => r.chance(0.7), hideMobile: () => r.chance(0.5) }, 0.5), desktop: r.some({ hideDesktop: () => r.chance(0.5) }, 0.5) }),
      }, 0.3),
    };
  });
  const body = r.some({
    backgroundColor: () => r.pick(COLORS),
    contentWidth: () => r.pick(["600px", 640, "100%"]),
    textColor: () => r.pick(COLORS),
    fontFamily: () => r.pick(FONTS),
    linkStyle: () => ({ body: true, linkColor: r.pick(COLORS), linkHoverColor: "#0000ee", linkUnderline: r.chance(0.5), linkHoverUnderline: true }),
    preheaderText: () => r.pick(["", "Preview & more"]),
    textDirection: () => r.pick(["ltr", "rtl"]),
    contentAlign: () => r.pick(ALIGNS),
    fontWeight: () => r.pick(WEIGHTS),
    backgroundImage: () => ({ url: r.pick(URLS), fullWidth: r.chance(0.5), repeat: r.pick(["no-repeat", "repeat"]), size: r.pick(["cover", "custom", "auto"]), position: "center" }),
    contentVerticalAlign: () => r.pick(["top", "middle", "center"]),
  }, 0.35);
  return { design: { counters: {}, schemaVersion: 27, body: { rows, values: body } }, displayMode };
}

describe("random designs", () => {
  it(`come back the same, render without a word, type-check and read as prettier writes them (${SEEDS} seeds)`, async () => {
    const failures: string[] = [];
    const modules = new Map<string, string>();
    for (let seed = 1; seed <= SEEDS; seed++) {
      const { design, displayMode } = generate(seed);
      const said = (["warn", "error"] as const).map((level) => vi.spyOn(console, level).mockImplementation(() => {}));
      try {
        const result = roundTrip(design, { displayMode });
        // (Advice for a template's author, said of a row with padding and a content background as the editor makes
        // one: not a problem in the design.)
        const words = said.flatMap((spy) => spy.mock.calls.map((call) => String(call[0]))).filter((word) => !word.startsWith("[Unlayer] Row padding sits outside"));
        if (result.differences.length || words.length) {
          failures.push(`seed ${seed}:\n${result.differences.map((d) => `  ${d.path}: ${JSON.stringify(d.expected)} → ${JSON.stringify(d.actual)}`).join("\n")}${words.map((w) => `\n  said: ${w}`).join("")}`);
        }
        modules.set(path.join(PACKAGE, "src/codegen/__generated__", `seed-${seed}.tsx`), result.code);
      } catch (error) {
        failures.push(`seed ${seed}: ${(error as Error).message}`);
      } finally {
        said.forEach((spy) => spy.mockRestore());
      }
    }
    expect(failures.slice(0, 10).join("\n")).toBe("");
    expect(typecheck(modules).slice(0, 10)).toEqual([]);
    // As prettier writes it (the first hundred: prettier takes its time).
    const unformatted: string[] = [];
    for (const [file, code] of [...modules].slice(0, 100)) if ((await prettier.format(code, { parser: "typescript" })) !== code) unformatted.push(path.basename(file));
    expect(unformatted).toEqual([]);
  }, 300_000);
});
