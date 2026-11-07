/**
 * A template to the builder and back (toDesign, then fromDesign) draws what it drew: each block a reader sees in the
 * same place and width, with the same words and styles, images, links and targets, backgrounds, borders and spacing
 * (testing/reader.ts). The tree comes back flatter (a Section of several Rows as a Section each, a box's padding on its
 * blocks), and a second trip changes nothing. Over the adapter's templates, main's examples, the codemod's and
 * templates put together at random (ROUNDTRIP_SEEDS=1000 for a longer run).
 */
import type { Node } from "@unlayer-internal/elements-core";
import { JSDOM } from "jsdom";
import React from "react";
import { describe, expect, it } from "vitest";
import * as primitives from "../primitives";
import { collectTemplate } from "../primitives/collect";
import { generate, toElement, type Root } from "../primitives/testing/templates";
import { airbnb, brew, digest, luma, menu, mercury, nike, notion, phone, social, spotify, stripe, video, warby } from "../primitives/testing/examples";
import {
  airbnb as codemodAirbnb,
  brew as codemodBrew,
  digest as codemodDigest,
  luma as codemodLuma,
  mercury as codemodMercury,
  nike as codemodNike,
  notion as codemodNotion,
  spotify as codemodSpotify,
  stripe as codemodStripe,
  warby as codemodWarby,
} from "../primitives/testing/codemod-examples";
import { fromDesign, toDesign, type DisplayMode } from "./index";
import { seen, type Seen } from "./testing/reader";
import { TEMPLATES } from "./testing/templates";

const SEEDS = Number(process.env.ROUNDTRIP_SEEDS ?? 60);
const tree = (element: React.ReactElement): Node => collectTemplate(element).document!.root;
const MODES: Record<string, DisplayMode> = { Email: "email", Page: "web", Document: "document" };
const modeOf = (element: React.ReactElement) => MODES[tree(element).type];
const trip = (element: React.ReactElement) => {
  const { design, report } = toDesign(element);
  return { ...fromDesign(JSON.parse(JSON.stringify(design)), { displayMode: modeOf(element) }), locked: lockedPaths(report) };
};
/** Where toDesign() wrote an HTML block of the new engine's markup (what no tool shows), by toDesign()'s report. */
const lockedPaths = (report: string[]) => new Set(report.flatMap((line) => /^(root[^:]*): .*it's an HTML block/.exec(line)?.[1] ?? []));

/** Numbers within a px of each other (a width as a percentage of its column), anything else equal. */
function close(a: unknown, b: unknown): boolean {
  if (typeof a === "number" && typeof b === "number") return Math.abs(a - b) <= 1;
  if (a && b && typeof a === "object" && typeof b === "object") return [...new Set([...Object.keys(a), ...Object.keys(b)])].every((k) => close((a as never)[k], (b as never)[k]));
  return JSON.stringify(a) === JSON.stringify(b);
}

/** Where what a reader gets differs: one line each, with the block. */
function differences(a: Seen[], b: Seen[]): string[] {
  const out: string[] = [];
  if (a.length !== b.length) out.push(`${a.length} blocks, then ${b.length}: ${a.map((s) => s.kind).join(", ")} | ${b.map((s) => s.kind).join(", ")}`);
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    for (const key of new Set([...Object.keys(a[i]), ...Object.keys(b[i])]) as Set<keyof Seen>) {
      if (!close(a[i][key], b[i][key])) out.push(`block ${i} (${a[i].kind}) ${key}: ${JSON.stringify(a[i][key])} then ${JSON.stringify(b[i][key])}`);
    }
  }
  return out;
}

/** The template to the builder and back: what a reader gets is the same, and a second trip changes nothing. */
function expectRoundTrip(element: React.ReactElement) {
  const once = trip(element);
  expect(differences(seen(element, { markup: once.locked }), seen(once.element))).toEqual([]);
  const twice = trip(once.element);
  expect(tree(twice.element)).toEqual(tree(once.element));
  expect(twice.code).toBe(once.code);
}

describe("to the builder and back", () => {
  for (const [name, template] of Object.entries(TEMPLATES)) {
    it(`draws ${name} as it went`, () => expectRoundTrip(template));
  }

  const examples: Record<string, React.ReactElement> = {
    StripeReceipt: stripe,
    SpotifyWelcome: spotify,
    PhoneOverrides: phone,
    AirbnbConfirmation: airbnb,
    MercuryReceipt: mercury,
    LumaEventInvite: luma,
    WarbyOrderShipped: warby,
    NotionWelcome: notion,
    NikeDrop: nike,
    MorningBrewDigest: brew,
    ProductDigest: digest,
    SocialMediaBar: social.bar,
    SocialRounded: social.rounded,
    SocialSquared: social.squared,
    SocialEmailFooter: social.footer,
    MenuLinks: menu.links,
    MenuSeparatorColor: menu.separators,
    VideoInEmail: video.email,
    VideoOnPage: video.page,
  };
  for (const [name, template] of Object.entries(examples)) {
    it(`draws the ${name} example as it went`, () => expectRoundTrip(template));
  }

  const codemod = [codemodStripe.StripeReceipt, codemodSpotify.SpotifyPremiumWelcome, codemodAirbnb.AirbnbConfirmation, codemodMercury.MercuryReceipt, codemodLuma.LumaEventInvite, codemodWarby.WarbyOrderShipped, codemodNotion.NotionWelcome, codemodNike.NikeDrop, codemodBrew.MorningBrewDigest, codemodDigest.ProductDigest];
  for (const Example of codemod) {
    it(`draws the codemod's ${Example.name} as it went`, () => expectRoundTrip(<Example />));
  }

  it("brings the template back in the root of the builder's display mode, and a design made in the builder as an Email unless it has a document's parts", () => {
    const content = [<primitives.Heading key="h">Title</primitives.Heading>, <primitives.Text key="p">Words</primitives.Text>];
    for (const [root, Root] of [["Email", primitives.Email], ["Page", primitives.Page], ["Document", primitives.Document]] as const) {
      const template = React.createElement(Root as React.FC<{ children: React.ReactNode }>, null, content);
      expectRoundTrip(template);
      expect(tree(trip(template).element).type).toBe(root);
      expect(tree(fromDesign(toDesign(template).design).element).type).toBe("Email");
    }
    expect(tree(fromDesign(toDesign(TEMPLATES.invoice).design).element).type).toBe("Document");
    expect(tree(fromDesign(toDesign(TEMPLATES.sample).design, { displayMode: "web" }).element).type).toBe("Page");
  });

  it("is told by what a reader gets: a block moved, resized, restyled or relinked is a difference", () => {
    const template = TEMPLATES.sample;
    const before = seen(template);
    const changed = (edit: (design: any) => void) => {
      const design = JSON.parse(JSON.stringify(toDesign(template).design));
      edit(design);
      return differences(before, seen(fromDesign(design).element));
    };
    const text = (design: any) => design.body.rows[0].columns[0].contents[1].values;
    expect(changed(() => undefined)).toEqual([]);
    expect(changed((design) => (text(design).containerPadding = "30px 20px 0px"))).toEqual([expect.stringContaining("above")]);
    expect(changed((design) => (text(design).textJson = text(design).textJson.replace('"url":"https://x.test"', '"url":"https://y.test"')))).toEqual([expect.stringContaining("runs")]);
    expect(changed((design) => (text(design).fontSize = "17px"))).toEqual([expect.stringContaining("runs")]);
    expect(changed((design) => (design.body.rows[1].cells = [1, 1]))).not.toEqual([]);
    expect(changed((design) => (design.body.rows[0].values.backgroundColor = "#ff0000"))).toEqual(expect.arrayContaining([expect.stringContaining("behind")]));
  });

  it("keeps the phone values the builder has fields for: a Divider's width in %, a Button's width and padding", () => {
    const template = (
      <primitives.Email>
        <primitives.Divider mobile={{ width: "50%" }} />
        <primitives.Button href="https://x.test" mobile={{ width: "40%", padding: [4, 8, 4, 8] }}>
          Go
        </primitives.Button>
      </primitives.Email>
    );
    const { design, report } = toDesign(template);
    expect(report).toEqual([]);
    const back = tree(fromDesign(JSON.parse(JSON.stringify(design))).element).children as Node[];
    expect(back[0].mobile).toEqual({ width: "50%" });
    const button = (back[1].type === "Button" ? back[1] : back[1].children![0]) as Node;
    expect(button.mobile).toEqual({ width: "40%", padding: { top: 4, right: 8, bottom: 4, left: 8 } });
  });

  it("draws a block locked as markup in the text styles every ancestor gives it, not only the root's", async () => {
    const template = (
      <primitives.Page width={600}>
        <primitives.Column style={{ color: "#b91c1c", fontSize: 30 }}>
          <primitives.Layer style={{ height: 100 }}>
            <primitives.Text>Locked label</primitives.Text>
          </primitives.Layer>
        </primitives.Column>
      </primitives.Page>
    );
    /** The locked words' color and size, as a browser draws them (jsdom computes no inherited size: the nearest declared). */
    const drawn = async (element: React.ReactElement) => {
      const { window } = new JSDOM((await primitives.render(element)).html);
      const words = [...window.document.querySelectorAll("p")].find((p) => p.textContent === "Locked label")!;
      let at: Element | null = words;
      let fontSize = "";
      while (at && !fontSize) [fontSize, at] = [window.getComputedStyle(at).fontSize, at.parentElement];
      return { color: window.getComputedStyle(words).color, fontSize };
    };
    const once = trip(template);
    expect(once.locked.size).toBe(1);
    expect(await drawn(once.element)).toEqual({ color: "rgb(185, 28, 28)", fontSize: "30px" });
  });

  it("fills its place with a block locked as markup in a Page, where a page's own margins would shrink it in a flex box", () => {
    const locked = (element: React.ReactElement) => JSON.stringify(toDesign(element).design).match(/\\"[^"]*max-width:600px[^"]*\\"/)?.[0];
    const table = (
      <primitives.Table>
        <primitives.TableRow>
          <primitives.TableCell>Locked</primitives.TableCell>
        </primitives.TableRow>
      </primitives.Table>
    );
    expect(locked(<primitives.Page width={600}>{table}</primitives.Page>)).toContain("width:100%;max-width:600px;margin:0 auto;");
    // Only there: an email's markup fills its place already, and a page written on its own keeps its markup.
    expect(locked(<primitives.Email width={600}>{table}</primitives.Email>)).not.toContain("width:100%;max-width:600px;margin:0 auto;");
  });

  it("writes a page on its own without that width", async () => {
    const { body } = await primitives.render(<primitives.Page width={600}><primitives.Text>Words</primitives.Text></primitives.Page>);
    expect(body).toMatch(/^<main style="max-width:600px;margin:0 auto;/);
  });

  describe("templates put together at random", () => {
    for (const root of ["Email", "Page", "Document"] as Root[]) {
      it(`draws ${SEEDS} ${root}s as they went`, () => {
        const failed: string[] = [];
        for (let seed = 1; seed <= SEEDS; seed++) {
          const element = toElement(generate(seed, root), primitives, React.createElement) as React.ReactElement;
          try {
            const once = trip(element);
            const diffs = differences(seen(element, { markup: once.locked }), seen(once.element));
            const twice = trip(once.element);
            if (diffs.length || twice.code !== once.code) failed.push(`seed ${seed}: ${diffs.slice(0, 3).join("; ") || "a second trip changes it"}`);
          } catch (error) {
            failed.push(`seed ${seed}: ${(error as Error).message.split("\n")[0]}`);
          }
        }
        expect(failed).toEqual([]);
      });
    }
  });
});
