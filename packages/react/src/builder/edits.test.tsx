/**
 * Each of the builder's edits, read back: every field of every tool set to another value, to the builder's default,
 * and removed (which the builder fills with its default), with the template it gives written out here (not compared
 * against another reader). A design is written from a small template with toDesign(), one value of one item changed
 * as the builder changes it, and read with fromDesign(). Then the edits the reviews of the earlier adapter found lost.
 */
import type { Node } from "@unlayer-internal/elements-core";
import React from "react";
import { describe, expect, it } from "vitest";
import { Button, Column, Divider, Document, Email, Heading, Html, Image, Link, Menu, PageBreak, Paragraph, render, Row, Section, Social, Text, Video } from "../primitives";
import { collectTemplate } from "../primitives/collect";
import { fromDesign, toDesign, type DisplayMode } from "./index";

type Values = Record<string, any>;
const REMOVED = Symbol("removed");
type Edit = [field: string, value: unknown, expected: Node[] | ((nodes: Node[]) => void)];

const tree = (element: React.ReactElement): Node => collectTemplate(element).document!.root;
const designOf = (element: React.ReactElement) => JSON.parse(JSON.stringify(toDesign(element).design));

/** The item at a path of the design ("rows.0.columns.0.contents.0", "body"). */
function itemAt(design: any, path: string): Values {
  return path === "body" ? design.body.values : path.split(".").reduce((at, key) => at[key], design.body).values;
}

/** Sets (or removes) a value at a dotted path in an item's values, as the builder does. */
function set(values: Values, field: string, value: unknown) {
  const keys = field.split(".");
  const last = keys.pop()!;
  const holder = keys.reduce((at, key) => (at[key] ??= {}), values);
  if (value === REMOVED) delete holder[last];
  else holder[last] = value;
}

/** The root's children (or the root) after an edit. */
function edited(template: React.ReactElement, item: string, field: string, value: unknown, displayMode?: DisplayMode): Node[] {
  const design = designOf(template);
  set(itemAt(design, item), field, value);
  const root = tree(fromDesign(design, { displayMode }).element);
  return item === "body" ? [root] : ((root.children ?? []) as Node[]);
}

/** One test per edit of a tool's field: another value, the builder's default, removed. */
function fields(tool: string, template: React.ReactElement, item: string, edits: Record<string, [another: Edit[1], anotherIs: Edit[2], builderDefault: Edit[1], defaultIs: Edit[2], removedIs: Edit[2]]>, displayMode?: DisplayMode) {
  describe(`the ${tool}'s`, () => {
    for (const [field, [another, anotherIs, builderDefault, defaultIs, removedIs]] of Object.entries(edits)) {
      for (const [what, value, expected] of [["set to another value", another, anotherIs], ["set to the builder's default", builderDefault, defaultIs], ["removed", REMOVED, removedIs]] as const) {
        it(`${field} ${what}`, () => {
          const nodes = edited(template, item, field, value, displayMode);
          if (typeof expected === "function") expected(nodes);
          else expect(nodes).toEqual(expected);
        });
      }
    }
  });
}

const BLOCK = "rows.0.columns.0.contents.0";
const hello = (style?: Values, extra: Values = {}): Node[] => [{ type: "Paragraph", ...extra, ...(style ? { style } : {}), children: ["Hello"] }];

describe("an edit in the builder", () => {
  fields("text", <Email><Paragraph>Hello</Paragraph></Email>, BLOCK, {
    text: ["<strong>Hi</strong> there", [{ type: "Paragraph", children: [{ type: "Span", style: { fontWeight: 700 }, children: ["Hi"] }, " there"] }], "This is a new Text block. Change the text.", [{ type: "Paragraph", children: ["This is a new Text block. Change the text."] }], [{ type: "Paragraph" }]],
    color: ["#ff0000", hello({ color: "#ff0000" }), "#000000", hello(), hello()],
    textAlign: ["center", hello({ textAlign: "center" }), "left", hello(), hello()],
    fontFamily: [{ label: "Georgia", value: "georgia,palatino" }, hello({ fontFamily: "georgia,palatino" }), { label: "Arial", value: "arial,helvetica,sans-serif" }, hello({ fontFamily: "arial,helvetica,sans-serif" }), hello()],
    fontWeight: [700, hello({ fontWeight: 700 }), 400, hello(), hello()],
    fontSize: ["20px", hello({ fontSize: 20 }), "14px", hello({ fontSize: 14 }), hello({ fontSize: 14 })],
    lineHeight: ["200%", hello({ lineHeight: 2 }), "140%", hello({ lineHeight: 1.4 }), hello({ lineHeight: 1.4 })],
    letterSpacing: ["2px", hello({ letterSpacing: 2 }), "0px", hello(), hello()],
    containerPadding: ["20px 30px", hello({ padding: { top: 20, right: 30, bottom: 20, left: 30 } }), "10px", hello({ padding: { top: 10, right: 10, bottom: 10, left: 10 } }), hello({ padding: { top: 10, right: 10, bottom: 10, left: 10 } })],
    textDirection: ["rtl", hello(undefined, { props: { dir: "rtl" } }), "ltr", hello(undefined, { props: { dir: "ltr" } }), hello()],
    "_override.mobile.hideMobile": [true, hello(undefined, { hidden: { mobile: true } }), false, hello(), hello()],
    "_override.desktop.hideDesktop": [true, hello(undefined, { hidden: { desktop: true } }), false, hello(), hello()],
    "_override.mobile.fontSize": ["12px", hello(undefined, { mobile: { fontSize: 12 } }), "14px", hello(undefined, { mobile: { fontSize: 14 } }), hello()],
    "_override.mobile.containerPadding": ["4px", hello(undefined, { mobile: { padding: { top: 4, right: 4, bottom: 4, left: 4 } } }), "10px", hello(undefined, { mobile: { padding: { top: 10, right: 10, bottom: 10, left: 10 } } }), hello()],
  });

  const title = (style?: Values, props?: Values): Node[] => [{ type: "Heading", ...(props ? { props } : {}), ...(style ? { style } : {}), children: ["Title"] }];
  fields("heading", <Email><Heading>Title</Heading></Email>, BLOCK, {
    // Its size is its own field, which a level doesn't change.
    headingType: ["h3", title({ fontSize: 32 }, { level: 3 }), "h1", title(), title()],
    text: ["New <em>title</em>", [{ type: "Heading", children: ["New ", { type: "Span", style: { fontStyle: "italic" }, children: ["title"] }] }], "Heading", [{ type: "Heading", children: ["Heading"] }], [{ type: "Heading" }]],
    // A heading is in bold where it says no weight; 22px and 140% are the builder's, not a heading's own.
    fontWeight: [400, title({ fontWeight: 400 }), 700, title(), title()],
    fontSize: ["40px", title({ fontSize: 40 }), "22px", title({ fontSize: 22 }), title({ fontSize: 22 })],
    lineHeight: ["100%", title({ lineHeight: 1 }), "140%", title({ lineHeight: 1.4 }), title({ lineHeight: 1.4 })],
    color: ["#333333", title({ color: "#333333" }), "#000000", title(), title()],
    textAlign: ["center", title({ textAlign: "center" }), "left", title(), title()],
    fontFamily: [{ label: "Georgia", value: "georgia,serif" }, title({ fontFamily: "georgia,serif" }), { label: "Arial", value: "Arial, Helvetica, sans-serif" }, title(), title()],
    letterSpacing: ["3px", title({ letterSpacing: 3 }), "0px", title(), title()],
    containerPadding: ["0px 8px", title({ padding: { top: 0, right: 8, bottom: 0, left: 8 } }), "10px", title({ padding: { top: 10, right: 10, bottom: 10, left: 10 } }), title({ padding: { top: 10, right: 10, bottom: 10, left: 10 } })],
    textDirection: ["rtl", title(undefined, { dir: "rtl" }), "ltr", title(undefined, { dir: "ltr" }), title()],
    "_override.mobile.hideMobile": [true, [{ ...title()[0], hidden: { mobile: true } }], false, title(), title()],
  });

  const go = (style?: Values, column: Values = { alignItems: "center" }, button: Values = {}): Node[] => [{ type: "Column", style: column, children: [{ type: "Button", props: { href: "https://x.test" }, ...button, ...(style ? { style } : {}), children: ["Go"] }] }];
  fields("button", <Email style={{ alignItems: "center" }}><Button href="https://x.test">Go</Button></Email>, BLOCK, {
    text: ["Buy <b>now</b>", (nodes) => expect((nodes[0].children![0] as Node).children).toEqual(["Buy ", { type: "Span", style: { fontWeight: 700 }, children: ["now"] }]), "Button", (nodes) => expect((nodes[0].children![0] as Node).children).toEqual(["Button"]), (nodes) => expect((nodes[0].children![0] as Node).children).toBeUndefined()],
    href: [{ name: "web", values: { href: "https://y.test", target: "_blank" } }, (nodes) => expect((nodes[0].children![0] as Node).props).toEqual({ href: { href: "https://y.test", target: "_blank" } }), { name: "web", values: { href: "", target: "_blank" } }, (nodes) => expect((nodes[0].children![0] as Node).props).toEqual({ href: "#" }), (nodes) => expect((nodes[0].children![0] as Node).props).toEqual({ href: "#" })],
    buttonColors: [{ color: "#000000", backgroundColor: "#ffcc00", hoverColor: "#ffffff", hoverBackgroundColor: "#000000" }, go({ color: "#000000", backgroundColor: "#ffcc00" }, undefined, { hover: { color: "#ffffff", backgroundColor: "#000000" } }), { color: "#FFFFFF", backgroundColor: "#0879A1", hoverColor: "#FFFFFF", hoverBackgroundColor: "#0879A1" }, go(), go()],
    "buttonColors.hoverBackgroundColor": ["#222222", go(undefined, undefined, { hover: { backgroundColor: "#222222" } }), "#0879A1", go(), go()],
    size: [{ autoWidth: false, width: "50%" }, go({ width: "50%" }), { autoWidth: true, width: "100%" }, go(), go()],
    "_override.mobile.size": [{ autoWidth: false, width: "33%" }, go(undefined, undefined, { mobile: { width: "33%" } }), { autoWidth: true, width: "100%" }, go(), go()],
    // Its alignment on phones places the button, which Elements can't there: said, not read as its label's.
    "_override.mobile.textAlign": ["right", go(), "center", go(), go()],
    fontSize: ["18px", go({ fontSize: 18 }), "14px", go(), go()],
    fontWeight: [700, go({ fontWeight: 700 }), 400, go(), go()],
    lineHeight: ["150%", go({ lineHeight: 1.5 }), "120%", go(), go()],
    letterSpacing: ["1px", go({ letterSpacing: 1 }), "0px", go(), go()],
    fontFamily: [{ label: "Georgia", value: "georgia,serif" }, go({ fontFamily: "georgia,serif" }), { label: "Arial", value: "Arial, Helvetica, sans-serif" }, go(), go()],
    padding: ["16px 32px", go({ padding: { top: 16, right: 32, bottom: 16, left: 32 } }), "10px 20px", go(), go()],
    border: [{ borderTopWidth: "2px", borderTopStyle: "solid", borderTopColor: "#ff0000" }, go({ border: { top: { width: 2, style: "solid", color: "#ff0000" } } }), {}, go(), go()],
    borderRadius: ["0px", go({ borderRadius: 0 }), "4px", go(), go()],
    textAlign: ["right", go(undefined, { alignItems: "end" }), "center", go(), go()],
    "_override.mobile.padding": ["6px 12px", go(undefined, undefined, { mobile: { padding: { top: 6, right: 12, bottom: 6, left: 12 } } }), "10px 20px", go(undefined, undefined, { mobile: { padding: { top: 10, right: 20, bottom: 10, left: 20 } } }), go()],
    "_override.mobile.hideMobile": [true, go(undefined, { alignItems: "center" }).map((node) => ({ ...node, hidden: { mobile: true } })), false, go(), go()],
    containerPadding: ["24px", go(undefined, { padding: { top: 24, right: 24, bottom: 24, left: 24 }, alignItems: "center" }), "10px", go(undefined, { padding: { top: 10, right: 10, bottom: 10, left: 10 }, alignItems: "center" }), go(undefined, { padding: { top: 10, right: 10, bottom: 10, left: 10 }, alignItems: "center" })],
  });

  const image = (props: Values = {}, style?: Values, column: Values = { alignItems: "center" }): Node[] => [{ type: "Column", style: column, children: [{ type: "Image", props: { src: { src: "https://x.test/a.png", width: 600, height: 300 }, alt: "A", ...props }, ...(style ? { style } : {}) }] }];
  fields("image", <Email style={{ alignItems: "center" }}><Image src={{ src: "https://x.test/a.png", width: 600, height: 300 }} alt="A" /></Email>, BLOCK, {
    src: [{ url: "https://x.test/b.png", width: 300, height: 100, autoWidth: false, maxWidth: "50%" }, image({ src: { src: "https://x.test/b.png", width: 300, height: 100 } }, { width: "50%" }), { url: "https://cdn.tools.unlayer.com/image/placeholder.png", width: 1600, height: 400 }, image({ src: { src: "https://cdn.tools.unlayer.com/image/placeholder.png", width: 1600, height: 400 } }), image({ src: { src: "https://cdn.tools.unlayer.com/image/placeholder.png", width: 1600, height: 400 } })],
    // A width of its own (its share of its place), or its own size.
    "src.autoWidth": [false, image({}, { width: "100%" }), true, image(), image()],
    "src.maxWidth": ["25%", image(), "100%", image(), image()],
    altText: ["A sea", image({ alt: "A sea" }), "", (nodes) => expect((nodes[0].children![0] as Node).props).toEqual({ src: { src: "https://x.test/a.png", width: 600, height: 300 } }), (nodes) => expect((nodes[0].children![0] as Node).props).toEqual({ src: { src: "https://x.test/a.png", width: 600, height: 300 } })],
    action: [{ name: "web", values: { href: "https://x.test", target: "_blank" } }, (nodes) => expect(nodes[0].children![0]).toEqual({ type: "Link", props: { href: { href: "https://x.test", target: "_blank" } }, children: [image()[0].children![0]] }), { name: "web", values: { href: "", target: "_blank" } }, image(), image()],
    textAlign: ["left", [image()[0].children![0] as Node], "center", image(), image()],
    "_override.mobile.textAlign": ["right", image(), "center", image(), image()],
    "_override.mobile.src": [{ autoWidth: false, maxWidth: "50%" }, [{ ...image()[0], children: [{ ...(image()[0].children![0] as Node), mobile: { width: "50%" } }] }], { autoWidth: true, maxWidth: "100%" }, image(), image()],
    containerPadding: ["16px", image({}, undefined, { padding: { top: 16, right: 16, bottom: 16, left: 16 }, alignItems: "center" }), "10px", image({}, undefined, { padding: { top: 10, right: 10, bottom: 10, left: 10 }, alignItems: "center" }), image({}, undefined, { padding: { top: 10, right: 10, bottom: 10, left: 10 }, alignItems: "center" })],
  });

  const line = (style?: Values): Node[] => [{ type: "Divider", ...(style ? { style } : {}) }];
  fields("divider", <Email><Divider /></Email>, BLOCK, {
    border: [{ borderTopWidth: "3px", borderTopStyle: "dashed", borderTopColor: "#ff0000" }, line({ borderTop: { width: 3, style: "dashed", color: "#ff0000" } }), { borderTopWidth: "1px", borderTopStyle: "solid", borderTopColor: "#BBBBBB" }, line(), line()],
    // A line shorter than its place sits as its textAlign places it: left, as the template's text is.
    width: ["50%", line({ width: "50%" }), "100%", line(), line()],
    "_override.mobile.width": ["33%", [{ type: "Divider", mobile: { width: "33%" } }], "100%", line(), line()],
    containerPadding: ["8px 0px", line({ padding: { top: 8, right: 0, bottom: 8, left: 0 } }), "10px", line({ padding: { top: 10, right: 10, bottom: 10, left: 10 } }), line({ padding: { top: 10, right: 10, bottom: 10, left: 10 } })],
    textAlign: ["right", line(), "center", line(), line()],
  });

  const items = [{ text: "Docs", href: "https://x.test/docs" }];
  const menu = (style?: Values, props: Values = {}): Node[] => [{ type: "Menu", props: { items, ...props }, ...(style ? { style } : {}) }];
  fields("menu", <Email><Menu items={items} /></Email>, BLOCK, {
    menu: [{ items: [{ key: "1", text: "Blog", link: { name: "web", values: { href: "https://x.test/blog", target: "_blank" } } }] }, menu(undefined, { items: [{ text: "Blog", href: { href: "https://x.test/blog", target: "_blank" } }] }), { items: [] }, menu(undefined, { items: [] }), menu(undefined, { items: [] })],
    linkColor: ["#ff0000", menu({ color: "#ff0000" }), "#0068A5", menu(), menu()],
    textColor: ["#999999", menu({ separatorColor: "#999999" }), "#444444", menu(), menu()],
    separator: ["·", menu(undefined, { separator: "·" }), "", menu(), menu()],
    layout: ["vertical", menu(undefined, { layout: "vertical" }), "horizontal", menu(), menu()],
    align: ["left", menu({ justifyContent: "start" }), "center", menu(), menu()],
    padding: ["2px 8px", menu({ padding: { top: 2, right: 8, bottom: 2, left: 8 } }), "5px 15px", menu(), menu()],
    fontSize: ["16px", menu({ fontSize: 16 }), "14px", menu(), menu()],
    "_override.mobile.fontSize": ["9px", [{ ...menu()[0], mobile: { fontSize: 9 } }], "14px", menu(), menu()],
    fontWeight: [700, menu({ fontWeight: 700 }), 400, menu(), menu()],
    letterSpacing: ["1px", menu({ letterSpacing: 1 }), "0px", menu(), menu()],
    fontFamily: [{ label: "Georgia", value: "georgia,serif" }, menu({ fontFamily: "georgia,serif" }), { label: "Arial", value: "Arial, Helvetica, sans-serif" }, menu(), menu()],
    containerPadding: ["12px", [{ type: "Column", style: { padding: { top: 12, right: 12, bottom: 12, left: 12 } }, children: menu() }], "10px", [{ type: "Column", style: { padding: { top: 10, right: 10, bottom: 10, left: 10 } }, children: menu() }], [{ type: "Column", style: { padding: { top: 10, right: 10, bottom: 10, left: 10 } }, children: menu() }]],
  });

  const icons = [{ name: "Facebook", href: "https://facebook.com/x" }];
  const social = (style?: Values, props: Values = {}): Node[] => [{ type: "Social", props: { icons, ...props }, ...(style ? { style } : {}) }];
  fields("social", <Email><Social icons={icons} /></Email>, BLOCK, {
    icons: [{ iconType: "squared", icons: [{ name: "X", url: "https://x.com/x" }] }, social(undefined, { icons: [{ name: "X", href: "https://x.com/x" }], iconType: "squared" }), { iconType: "circle", icons: [] }, [], []],
    iconSize: [48, social(undefined, { size: 48 }), 32, social(), social()],
    spacing: [12, social({ gap: 12 }), 5, social(), social()],
    align: ["right", social({ justifyContent: "end" }), "center", social(), social()],
    containerPadding: ["0px", social(), "10px", [{ type: "Column", style: { padding: { top: 10, right: 10, bottom: 10, left: 10 } }, children: social() }], [{ type: "Column", style: { padding: { top: 10, right: 10, bottom: 10, left: 10 } }, children: social() }]],
    "_override.mobile.hideMobile": [true, [{ ...social()[0], hidden: { mobile: true } }], false, social(), social()],
  });

  const player = (column?: Values): Node[] => [column ? { type: "Column", style: column, children: [{ type: "Video", props: { src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" } }] } : { type: "Video", props: { src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" } }];
  fields("video", <Email style={{ alignItems: "center" }}><Video src="https://www.youtube.com/watch?v=dQw4w9WgXcQ" /></Email>, BLOCK, {
    video: [{ type: "vimeo", videoId: "76979871" }, [{ type: "Column", style: { alignItems: "center" }, children: [{ type: "Video", props: { src: "https://vimeo.com/76979871" } }] }], {}, [], []],
    textAlign: ["left", player(), "center", player({ alignItems: "center" }), player({ alignItems: "center" })],
    containerPadding: ["6px", player({ padding: { top: 6, right: 6, bottom: 6, left: 6 }, alignItems: "center" }), "10px", player({ padding: { top: 10, right: 10, bottom: 10, left: 10 }, alignItems: "center" }), player({ padding: { top: 10, right: 10, bottom: 10, left: 10 }, alignItems: "center" })],
  });

  const markup = (html: string, column?: Values): Node[] => [column ? { type: "Column", style: column, children: [{ type: "Html", props: { html } }] } : { type: "Html", props: { html } }];
  fields("html", <Email><Html html="<b>Sale</b>" /></Email>, BLOCK, {
    html: ["<i>New</i>", markup("<i>New</i>"), "<strong>Hello, world!</strong>", markup("<strong>Hello, world!</strong>"), markup("<strong>Hello, world!</strong>")],
    // An HTML block's spacing edit applies (the earlier adapter's review).
    containerPadding: ["30px 0px", markup("<b>Sale</b>", { padding: { top: 30, right: 0, bottom: 30, left: 0 } }), "10px", markup("<b>Sale</b>", { padding: { top: 10, right: 10, bottom: 10, left: 10 } }), markup("<b>Sale</b>", { padding: { top: 10, right: 10, bottom: 10, left: 10 } })],
  });

  const row = (holder: Values | undefined, children: Node[] = hello()): Node[] => (holder ? [{ ...holder, children } as Node] : children);
  fields("row", <Email><Text>Hello</Text></Email>, "rows.0", {
    backgroundColor: ["#eeeeee", row({ type: "Section", style: { backgroundColor: "#eeeeee" } }), "", row(undefined), row(undefined)],
    columnsBackgroundColor: ["#ffffff", row({ type: "Row", style: { backgroundColor: "#ffffff" } }, [{ type: "Column", children: hello() }]), "", row(undefined), row(undefined)],
    // A row's side padding set in the builder is kept (the earlier adapter's review).
    padding: ["10px 20px", hello({ padding: { top: 10, right: 20, bottom: 10, left: 20 } }), "0px", hello(), hello()],
    // Its padding on phones, around its blocks there (the builder's default is its padding on desktop).
    "_override.mobile.padding": ["30px", [{ type: "Column", mobile: { padding: { top: 30, right: 30, bottom: 30, left: 30 } }, children: hello() }], "0px", hello(), hello()],
    alignItems: ["center", row({ type: "Row", style: { alignItems: "center" } }, [{ type: "Column", children: hello() }]), "flex-start", hello(), hello()],
    noStackMobile: [true, hello(), false, hello(), hello()],
    // Unhiding a row shows it (the earlier adapter's review).
    "_override.mobile.hideMobile": [true, hello(undefined, { hidden: { mobile: true } }), false, hello(), hello()],
    "_override.desktop.hideDesktop": [true, hello(undefined, { hidden: { desktop: true } }), false, hello(), hello()],
  });

  const twoColumns = (
    <Email>
      <Row>
        <Column>
          <Text>A</Text>
        </Column>
        <Column>
          <Text>B</Text>
        </Column>
      </Row>
    </Email>
  );
  const columns = (first: Values = {}, row: Values = {}): Node[] => [
    { type: "Row", ...row, children: [{ type: "Column", ...first, style: { width: "50%", ...first.style }, children: [{ type: "Paragraph", children: ["A"] }] }, { type: "Column", style: { width: "50%" }, children: [{ type: "Paragraph", children: ["B"] }] }] },
  ];
  fields("column", twoColumns, "rows.0.columns.0", {
    backgroundColor: ["#fafafa", columns({ style: { backgroundColor: "#fafafa" } }), "", columns(), columns()],
    padding: ["12px", columns({ style: { padding: { top: 12, right: 12, bottom: 12, left: 12 } } }), "0px", columns(), columns()],
    border: [{ borderLeftWidth: "4px", borderLeftStyle: "solid", borderLeftColor: "#000000" }, columns({ style: { border: { left: { width: 4, style: "solid", color: "#000000" } } } }), {}, columns(), columns()],
    borderRadius: ["8px", columns({ style: { borderRadius: 8 } }), "0px", columns(), columns()],
    "_override.mobile.padding": ["4px", columns({ mobile: { padding: { top: 4, right: 4, bottom: 4, left: 4 } } }), "0px", columns({ mobile: { padding: { top: 0, right: 0, bottom: 0, left: 0 } } }), columns()],
  });
  fields("row of columns", twoColumns, "rows.0", {
    noStackMobile: [true, columns({}, { props: { stackOnMobile: false } }), false, columns(), columns()],
  });

  const body = (props?: Values, style?: Values, type = "Email"): Node[] => [{ type, ...(props ? { props } : {}), ...(style ? { style } : {}), children: hello() }];
  /** The body with its block's own text style. */
  const own = ([root]: Node[], style: Values): Node[] => [{ ...root, children: hello(style) }];
  fields("body", <Email><Text>Hello</Text></Email>, "body", {
    contentWidth: ["700px", body({ width: 700 }), "500px", body({ width: 500 }), body({ width: 500 })],
    backgroundColor: ["#f0f0f0", body(undefined, { backgroundColor: "#f0f0f0" }), "#F7F8F9", body(undefined, { backgroundColor: "#f7f8f9" }), body(undefined, { backgroundColor: "#f7f8f9" })],
    // A block's own text style is its field: the body's change doesn't change it.
    textColor: ["#333333", own(body(undefined, { color: "#333333" }), { color: "#000000" }), "#000000", body(), body()],
    fontFamily: [{ label: "Georgia", value: "georgia,serif" }, own(body(undefined, { fontFamily: "georgia,serif" }), { fontFamily: "Arial, Helvetica, sans-serif" }), { label: "Arial", value: "arial,helvetica,sans-serif" }, own(body(undefined, { fontFamily: "arial,helvetica,sans-serif" }), { fontFamily: "Arial, Helvetica, sans-serif" }), own(body(undefined, { fontFamily: "arial,helvetica,sans-serif" }), { fontFamily: "Arial, Helvetica, sans-serif" })],
    fontWeight: [300, own(body(undefined, { fontWeight: 300 }), { fontWeight: 400 }), 400, body(), body()],
    preheaderText: ["Hi there", body({ previewText: "Hi there" }), "", body(), body()],
    textDirection: ["rtl", body({ dir: "rtl" }), "ltr", body({ dir: "ltr" }), body()],
  });
  fields("document's body", <Document><Text>Hello</Text></Document>, "body", {
    documentSize: ["Letter", body({ size: "Letter" }, undefined, "Document"), "A4", body(undefined, undefined, "Document"), body(undefined, undefined, "Document")],
    documentOrientation: ["landscape", body({ orientation: "landscape" }, undefined, "Document"), "portrait", body(undefined, undefined, "Document"), body(undefined, undefined, "Document")],
    documentMargin: ["30px", body({ margin: { top: 30, right: 30, bottom: 30, left: 30 } }, undefined, "Document"), "96px", body({ margin: { top: 96, right: 96, bottom: 96, left: 96 } }, undefined, "Document"), body({ margin: { top: 96, right: 96, bottom: 96, left: 96 } }, undefined, "Document")],
  }, "document");
});

describe("an edit the earlier adapter's reviews found lost", () => {
  it("keeps columns added to a row in the builder", () => {
    const design = designOf(
      <Email>
        <Row>
          <Column>
            <Text>A</Text>
          </Column>
        </Row>
      </Email>
    );
    const [row] = design.body.rows;
    row.columns.push(JSON.parse(JSON.stringify(row.columns[0])), JSON.parse(JSON.stringify(row.columns[0])));
    row.columns[2].contents[0].values.text = "C";
    row.cells = [2, 1, 1];
    expect(tree(fromDesign(design).element).children).toEqual([
      {
        type: "Row",
        children: [
          { type: "Column", style: { width: "50%" }, children: [{ type: "Paragraph", children: ["A"] }] },
          { type: "Column", style: { width: "25%" }, children: [{ type: "Paragraph", children: ["A"] }] },
          { type: "Column", style: { width: "25%" }, children: [{ type: "Paragraph", children: ["C"] }] },
        ],
      },
    ]);
  });

  it("keeps an empty padded Column, in a Row and on its own", () => {
    const template = (
      <Email>
        <Row>
          <Column style={{ padding: 20 }} />
          <Column>
            <Text>B</Text>
          </Column>
        </Row>
        <Column style={{ padding: [30, 0, 30, 0] }} />
        <Text>After</Text>
      </Email>
    );
    const [row, space] = tree(fromDesign(toDesign(template).design).element).children as Node[];
    // (Its padding takes room beside its share, as CSS flex has it: 320px of 600, as the template draws it.)
    expect((row.children![0] as Node).style).toEqual({ width: "53.33%", padding: { top: 20, right: 20, bottom: 20, left: 20 } });
    expect(space).toEqual({ type: "Column", style: { padding: { top: 30, right: 0, bottom: 30, left: 0 } } });
  });

  it("takes a link's edits on a button (keeping its target when only its URL changes), an image and a link in text", () => {
    const design = designOf(
      <Email>
        <Button href={{ href: "https://x.test", target: "_blank" }}>Go</Button>
        <Link href="https://x.test/image">
          <Image src={{ src: "https://x.test/a.png", width: 600, height: 300 }} alt="" />
        </Link>
        <Paragraph>
          See <Link href={{ href: "https://x.test/text", target: "_blank" }}>this</Link>
        </Paragraph>
      </Email>
    );
    const [button, image, text] = design.body.rows[0].columns[0].contents;
    button.values.href.values.href = "https://y.test";
    image.values.action = { name: "web", values: { href: "https://y.test/image", target: "_blank" } };
    text.values.text = text.values.text.replace('href="https://x.test/text" target="_blank"', 'href="https://y.test/text" target="_self"');
    const [b, i, t] = tree(fromDesign(design).element).children as Node[];
    expect(b.props).toEqual({ href: { href: "https://y.test", target: "_blank" } });
    expect(i.type === "Link" ? i.props : (i.children![0] as Node).props).toEqual({ href: { href: "https://y.test/image", target: "_blank" } });
    expect(t.children).toEqual(["See ", { type: "Link", props: { href: { href: "https://y.test/text", target: "_self" } }, children: ["this"] }]);
  });

  it("keeps the alignment and spacing of an image, a button and a divider made in the builder (the builder's own values, no others)", () => {
    const design = designOf(
      <Email>
        <Text>Start</Text>
      </Email>
    );
    design.body.rows[0].columns[0].contents.push(
      { type: "image", values: { src: { url: "https://x.test/new.png", width: 800, height: 400 }, textAlign: "right", containerPadding: "15px" } },
      { type: "button", values: { href: { name: "web", values: { href: "https://x.test/new", target: "_blank" } }, text: "New", textAlign: "left", containerPadding: "5px 10px" } },
      { type: "divider", values: { width: "60%", textAlign: "center", containerPadding: "20px" } }
    );
    expect((tree(fromDesign(design).element).children as Node[]).slice(1)).toEqual([
      { type: "Column", style: { padding: { top: 15, right: 15, bottom: 15, left: 15 }, alignItems: "end" }, children: [{ type: "Image", props: { src: { src: "https://x.test/new.png", width: 800, height: 400 } } }] },
      { type: "Column", style: { padding: { top: 5, right: 10, bottom: 5, left: 10 } }, children: [{ type: "Button", props: { href: { href: "https://x.test/new", target: "_blank" } }, children: ["New"] }] },
      { type: "Column", style: { textAlign: "center" }, children: [{ type: "Divider", style: { width: "60%", padding: { top: 20, right: 20, bottom: 20, left: 20 } } }] },
    ]);
  });

  it("keeps the size of an image made with autoWidth", () => {
    const design = designOf(
      <Email>
        <Text>Start</Text>
      </Email>
    );
    design.body.rows[0].columns[0].contents.push({ type: "image", values: { src: { url: "https://x.test/small.png", width: 120, height: 60, autoWidth: true, maxWidth: "100%" }, containerPadding: "0px", textAlign: "left" } });
    expect((tree(fromDesign(design).element).children as Node[])[1]).toEqual({ type: "Image", props: { src: { src: "https://x.test/small.png", width: 120, height: 60 } } });
  });

  it("keeps a Section copied into another design apart from that design's Sections", () => {
    const from = designOf(
      <Email>
        <Section style={{ backgroundColor: "#eeeeee" }}>
          <Text>Copied</Text>
        </Section>
      </Email>
    );
    const into = designOf(
      <Email>
        <Section style={{ backgroundColor: "#eeeeee" }}>
          <Text>Own</Text>
        </Section>
      </Email>
    );
    into.body.rows.push(from.body.rows[0]);
    expect(tree(fromDesign(into).element).children).toEqual([
      { type: "Section", style: { backgroundColor: "#eeeeee" }, children: [{ type: "Paragraph", children: ["Own"] }] },
      { type: "Section", style: { backgroundColor: "#eeeeee" }, children: [{ type: "Paragraph", children: ["Copied"] }] },
    ]);
  });

  it("keeps a box whole when a block is added in it in the builder", () => {
    const design = designOf(
      <Email>
        <Column style={{ backgroundColor: "#ffeeee", padding: 12 }}>
          <Text>In the box</Text>
        </Column>
      </Email>
    );
    design.body.rows[0].columns[0].contents.push({ type: "text", values: { text: "Added", containerPadding: "0px" } });
    expect(tree(fromDesign(design).element).children).toEqual([
      { type: "Column", style: { backgroundColor: "#ffeeee", padding: { top: 12, right: 12, bottom: 12, left: 12 } }, children: [{ type: "Paragraph", children: ["In the box"] }, { type: "Paragraph", style: { fontSize: 14, lineHeight: 1.4 }, children: ["Added"] }] },
    ]);
  });

  it("reads a page break deleted between two pages as one page", () => {
    const design = designOf(
      <Document>
        <Text>One</Text>
        <PageBreak />
        <Text>Two</Text>
      </Document>
    );
    expect((tree(fromDesign(design).element).children as Node[]).map((node) => node.type)).toEqual(["Paragraph", "PageBreak", "Paragraph"]);
    design.body.rows = design.body.rows.filter((row: any) => row.columns[0].contents[0]?.type !== "page_break");
    expect(tree(fromDesign(design, { displayMode: "document" }).element).children).toEqual([
      { type: "Paragraph", children: ["One"] },
      { type: "Paragraph", children: ["Two"] },
    ]);
  });
});

describe("an edit this adapter's review found lost", () => {
  /** The design of a one-block template, and that block's values. */
  const one = (element: React.ReactElement) => {
    const design = designOf(element);
    return { design, values: design.body.rows[0].columns[0].contents[0].values as Values };
  };

  /** Rich text as the builder's editor saves it (Lexical's JSON): a paragraph of runs, as its heading and button tools mark theirs where `inline`. */
  const richText = (runs: Array<{ text: string; format?: number }>, inline = false) =>
    JSON.stringify({ root: { type: "root", version: 1, children: [{ type: "paragraph", version: 1, format: "", indent: 0, direction: "ltr", ...(inline ? { isInlineTool: true } : {}), children: runs.map(({ text, format = 0 }) => ({ type: "text", version: 1, text, format, style: "", mode: "normal", detail: 0 })) }] } });

  it("reads a text's, a heading's and a button's rich text (textJson), not the older text beside it", () => {
    const design = designOf(
      <Email>
        <Paragraph>Old text</Paragraph>
        <Heading>Old title</Heading>
        <Button href="https://x.test">Old label</Button>
      </Email>
    );
    const [text, heading, button] = design.body.rows[0].columns[0].contents.map((content: any) => content.values);
    text.textJson = richText([{ text: "Total: " }, { text: "123", format: 1 }]);
    heading.textJson = richText([{ text: "New title" }], true);
    button.textJson = richText([{ text: "New label" }], true);
    const back = fromDesign(design);
    expect(back.report).toEqual([]);
    const [t, h, b] = tree(back.element).children as Node[];
    expect(t.children).toEqual(["Total: ", { type: "Span", style: { fontWeight: 700 }, children: ["123"] }]);
    expect(h.children).toEqual(["New title"]);
    expect((b.type === "Button" ? b : (b.children![0] as Node)).children).toEqual(["New label"]);
  });

  it("reads a link in every shape today's writers read: its URL in attrs, an email's", () => {
    const design = designOf(
      <Email>
        <Button href="https://x.test">Go</Button>
        <Link href="https://x.test/image">
          <Image src={{ src: "https://x.test/a.png", width: 600, height: 300 }} alt="" />
        </Link>
        <Menu items={[{ text: "Docs", href: "https://x.test/docs" }]} />
      </Email>
    );
    const [button, image, menu] = design.body.rows[0].columns[0].contents.map((content: any) => content.values);
    const email = { name: "email", attrs: { href: "mailto:{{email}}?subject={{subject}}&body={{body}}" }, values: { email: "a@b.test", subject: "Hi", body: "" } };
    button.href = { name: "web", attrs: { href: "https://x.test/attrs", target: "_blank" } };
    image.action = email;
    menu.menu.items[0].link = { name: "phone", attrs: { href: "tel:{{phone}}" }, values: { phone: "+15551234" } };
    const back = fromDesign(design);
    expect(back.report).toEqual([]);
    const [b, i, m] = tree(back.element).children as Node[];
    expect((b.type === "Button" ? b : (b.children![0] as Node)).props).toEqual({ href: { href: "https://x.test/attrs", target: "_blank" } });
    expect((i.type === "Link" ? i : (i.children![0] as Node)).props).toEqual({ href: "mailto:{{email}}?subject={{subject}}&body={{body}}" });
    expect((m.type === "Menu" ? m : (m.children![0] as Node)).props).toEqual({ items: [{ text: "Docs", href: "tel:{{phone}}" }] });
  });

  it("says a link that holds what a link in Elements can't (a click handler), and isn't empty", () => {
    const { design, values } = one(
      <Email>
        <Button href="https://x.test">Go</Button>
      </Email>
    );
    values.href = { name: "web", values: { href: "https://x.test" }, attrs: { onClick: "track()" } };
    expect(fromDesign(design).report).toEqual([expect.stringMatching(/^rows\[0\]\.columns\[0\]\.contents\[0\]: its link .* holds what a link in Elements can't/)]);
  });

  it("keeps an email service's tag in text as written (an Html block of its markup), and says one Elements escapes", async () => {
    for (const text of ["{% if orders > 1 %}Thanks{% endif %}", "{% if a && b %}x{% endif %}", "Hi <%name%>"]) {
      const { design, values } = one(
        <Email>
          <Paragraph>Hello</Paragraph>
        </Email>
      );
      values.text = text;
      const back = fromDesign(design);
      expect(back.report).toEqual([expect.stringContaining("an email service's tag, kept as written): it's an Html block of its markup")]);
      expect((await render(back.element)).html).toContain(text);
    }
    const { design, values } = one(
      <Email>
        <Button href="https://x.test">Go</Button>
      </Email>
    );
    values.text = "Hi <%name%>";
    design.body.values.preheaderText = "{% if vip %}Early access{% endif %}";
    expect(fromDesign(design).report).toEqual([expect.stringContaining("its preview text has an email service's tag"), expect.stringContaining("its label has an email service's tag")]);
  });

  it("says a button's or an image's alignment on phones, which places it there, rather than reading it as a label's", () => {
    const design = designOf(
      <Email>
        <Button href="https://x.test">Go</Button>
        <Image src={{ src: "https://x.test/a.png", width: 600, height: 300 }} alt="" />
      </Email>
    );
    for (const content of design.body.rows[0].columns[0].contents) content.values._override = { mobile: { textAlign: "right" } };
    const back = fromDesign(design);
    expect(back.report).toEqual([expect.stringContaining("its alignment on phones (right) places the button there"), expect.stringContaining("its alignment on phones (right) isn't one Elements can place it in")]);
    expect(JSON.stringify(tree(back.element))).not.toContain('"textAlign":"right"');
  });

  it("keeps a paragraph's own margins, collapsing between two, and gives one without any none", () => {
    const { design, values } = one(
      <Email>
        <Paragraph>Hello</Paragraph>
      </Email>
    );
    values.text = '<p style="margin:100px 0">First</p><p style="margin:100px 0">Second</p><p>Third</p>';
    const back = fromDesign(design);
    expect(back.report).toEqual([]);
    expect(tree(back.element).children).toEqual([
      { type: "Paragraph", style: { padding: { top: 100, right: 0, bottom: 0, left: 0 } }, children: ["First"] },
      { type: "Paragraph", style: { padding: { top: 100, right: 0, bottom: 0, left: 0 } }, children: ["Second"] },
      { type: "Paragraph", style: { padding: { top: 100, right: 0, bottom: 0, left: 0 } }, children: ["Third"] },
    ]);
  });
});
