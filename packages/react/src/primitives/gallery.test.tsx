/**
 * The gallery's templates and the stress templates, each in every root it's written for: they render
 * without errors (the gallery's without warnings too), every word they hold reaches the plain-text
 * version, and every word survives a trip to the builder and back (toDesign, then fromDesign).
 */
import { isValidElement, type ReactElement, type ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { fromDesign, toDesign, type DisplayMode } from "../builder";
import { gallery } from "./examples/gallery";
import { stress } from "./examples/stress";
import { Canvas, Document, Email, Page, PageFooter, PageHeader, render, validate } from "./index";

/**
 * The words of some text, or of a template's text components (what they hold, not their props), in lower case. A
 * Document's header and footer are on every page, and its text is its pages' content once, so theirs aren't counted.
 */
function words(node: ReactNode, out: string[] = []): string[] {
  if (typeof node === "string" || typeof node === "number") out.push(...(String(node).toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []));
  else if (Array.isArray(node)) for (const child of node) words(child, out);
  else if (isValidElement(node) && node.type !== PageHeader && node.type !== PageFooter) words((node.props as { children?: ReactNode }).children, out);
  return out;
}

/** The words of a template that its plain text doesn't have. */
async function missing(template: ReactElement, from: ReactElement = template): Promise<string[]> {
  const { text } = await render(from);
  const have = new Set(words(text));
  return [...new Set(words(template))].filter((word) => !have.has(word));
}

const errors = (diagnostics: Array<{ severity: string }>) => diagnostics.filter((d) => d.severity === "error");
const MODES = new Map<unknown, DisplayMode>([
  [Email, "email"],
  [Page, "web"],
  [Document, "document"],
]);

type Case = { name: string; template: ReactElement; gallery: boolean };
const cases: Case[] = [
  ...Object.entries(gallery).map(([name, template]) => ({ name: `the gallery's ${name}`, template, gallery: true })),
  ...Object.entries(stress).flatMap(([name, entry]) =>
    entry.roots === "screen"
      ? [
          { name: `stress ${name}, as an Email`, template: entry.template(Email), gallery: false },
          { name: `stress ${name}, as a Page`, template: entry.template(Page), gallery: false },
        ]
      : [{ name: `stress ${name}`, template: entry.template, gallery: false }]
  ),
];

describe.each(cases)("$name", ({ template, gallery: fromGallery }) => {
  it(`renders without errors${fromGallery ? " or warnings" : ""}, with every word in its plain text`, async () => {
    const checked = validate(template);
    const rendered = await render(template);
    expect(errors(checked.diagnostics)).toEqual([]);
    expect(errors(rendered.diagnostics)).toEqual([]);
    if (fromGallery) expect(rendered.diagnostics.filter((d) => d.severity === "warning")).toEqual([]);
    expect(await missing(template)).toEqual([]);
  });

  // A Canvas is an image, which the builder doesn't make.
  it.skipIf(template.type === Canvas)("goes to the builder and back with every word", async () => {
    const { design } = toDesign(template);
    const back = fromDesign(JSON.parse(JSON.stringify(design)), { displayMode: MODES.get(template.type) });
    expect(errors(validate(back.element).diagnostics)).toEqual([]);
    expect(await missing(template, back.element)).toEqual([]);
  });
});

describe("the gallery and the stress templates", () => {
  it("use every component, in an Email and in a Page where it shows on both", () => {
    const used = (node: ReactNode, into: Map<string, Set<string>>, root: string) => {
      if (Array.isArray(node)) for (const child of node) used(child, into, root);
      else if (isValidElement(node)) {
        const name = typeof node.type === "string" ? node.type : ((node.type as { displayName?: string; name?: string }).displayName ?? (node.type as { name?: string }).name ?? "");
        if (!into.has(name)) into.set(name, new Set());
        into.get(name)!.add(root);
        used((node.props as { children?: ReactNode }).children, into, root);
      }
    };
    const seen = new Map<string, Set<string>>();
    for (const { template } of cases) used(template, seen, (template.type as { displayName?: string }).displayName ?? "");
    const onScreens = ["Section", "Row", "Column", "Grid", "Layer", "Paragraph", "Paragraph", "Heading", "Link", "Button", "Image", "Divider", "List", "ListItem", "Table", "TableRow", "TableCell", "Video", "Social", "Menu", "Html", "Span", "LineBreak", "MergeTag"];
    for (const name of onScreens) expect([name, [...(seen.get(name) ?? [])].filter((root) => root === "Email" || root === "Page").sort()]).toEqual([name, ["Email", "Page"]]);
    for (const name of ["Svg", "Rect", "Circle", "Ellipse", "Line", "Polygon", "Path", "PageBreak", "PageHeader", "PageFooter", "PageNumber", "Canvas", "Document"]) expect([name, seen.has(name)]).toEqual([name, true]);
  });
});
