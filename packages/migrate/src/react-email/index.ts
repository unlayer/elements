/**
 * The React Email converter (@unlayer/migrate/react-email): React Email templates in Unlayer Elements' new components.
 *
 * Both modes write a template in Elements 0.2's components first, as source text, and move it to the new ones at once
 * (`toNewComponents`, in ../convert); what's checked, rendered and opened in the editor is the template in the new
 * components. Today's components are never run.
 */

import React from "react";
import { render } from "@react-email/components";
import * as Elements from "@unlayer/react-elements";
import { toDesign } from "@unlayer/react-elements/builder";
import {
  checkFails,
  compareText,
  editorFonts,
  NewComponentsError,
  phoneDiffers,
  pinImageWidths,
  readTemplate,
  toNewComponents,
  treeToTsx,
  type ConversionReport,
  type EditorFont,
  type ElementNode,
  type PrintOptions,
  type StyleDifference,
  type TextCheck,
} from "../convert";
import { callInRender, findTailwind, findTailwindConfig } from "./expand";
import { convertElement } from "./runtime";
import { mergeTagged, testedProps } from "./merge-tags";
import { CODEMOD_HELPERS, withoutLine } from "./codemod";

type Template = React.ComponentType<any> & { PreviewProps?: Record<string, unknown> };
/** A migrated template as its file exports it: a function, or one wrapped in `memo` or `forwardRef`. */
type MigratedTemplate = ((props: any) => React.ReactElement) | React.ExoticComponent<any>;

/** What a template the converter writes from a tree imports: the new components, and React. */
const MODULES = { "@unlayer/react-elements": Elements as unknown as Record<string, unknown>, react: React as unknown as Record<string, unknown> };

/** Whether a template's output is nothing: not an element (`null`), or an empty fragment (`<></>`). */
function rendersNothing(output: unknown): boolean {
  if (!React.isValidElement(output)) return true;
  return output.type === React.Fragment && React.Children.count((output.props as { children?: React.ReactNode }).children) === 0;
}

/**
 * A render's own copy of props (arrays and plain objects; elements, functions and other values as they are): a
 * template that changes what it's given (`events.reverse()`) would otherwise change it for the renders after it.
 */
function fresh<T>(value: T): T {
  if (Array.isArray(value)) return value.map(fresh) as T;
  if (value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype && !("$$typeof" in value)) {
    return Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, fresh(inner)])) as T;
  }
  return value;
}

/**
 * Call a migrated template for its root element, unwrapping `memo` and `forwardRef` as a render does, in a render of
 * its own: its hooks work.
 */
function callTemplate(Converted: MigratedTemplate, given: Record<string, unknown>): React.ReactElement {
  const props = fresh(given);
  const type = Converted as any;
  if (type?.$$typeof === Symbol.for("react.memo")) return callTemplate(type.type, props);
  if (type?.$$typeof === Symbol.for("react.forward_ref")) return callInRender(() => type.render(props, null));
  return callInRender(() => type(props));
}

/**
 * A component's own code, through `memo()` and `forwardRef()` (the text of an object is `[object Object]`): what tells
 * which props it tests. Undefined when there's no function to read.
 */
function componentCode(component: unknown): string | undefined {
  let type = component as { $$typeof?: symbol; type?: unknown; render?: unknown } | undefined;
  for (let depth = 0; depth < 10 && type && typeof type === "object"; depth++) {
    if (type.$$typeof === Symbol.for("react.memo")) type = type.type as typeof type;
    else if (type.$$typeof === Symbol.for("react.forward_ref")) type = type.render as typeof type;
    else break;
  }
  return typeof type === "function" ? String(type) : undefined;
}

/** Why text props stay their sample values when the component's code can't be read. */
const CODE_UNREAD = "text props kept as their sample values: the template's code can't be read to tell which props it tests (pass its source)";

/** The first line of what was thrown. */
/** What was thrown, in a line: all of it, as Elements' first line ("The template has 2 errors:") alone says nothing. */
const inALine = (error: unknown) => (error instanceof Error ? error.message : String(error)).trim().replace(/\s*\n\s*/g, "; ").slice(0, 400);

/** The HTML the new components render a template's root element to. */
async function htmlOf(element: React.ReactElement): Promise<string> {
  return (await Elements.render(element)).html;
}

/**
 * The template's root element in the builder's design JSON (`toDesign`), and what the visual editor wouldn't get: what
 * toDesign threw, or an error Elements logged while it read the template (a block that threw). `notes`: what the builder
 * holds otherwise than the template has it (toDesign's report).
 */
function designOf(element: React.ReactElement): { design?: Record<string, unknown>; warnings: string[]; notes: string[] } {
  const warnings: string[] = [];
  const error = console.error;
  console.error = (...args: unknown[]) => {
    const message = args.map(String).join(" ");
    if (/^\[(Unlayer|Elements)\]/.test(message)) warnings.push(message);
    else error(...args);
  };
  try {
    const { design, report } = toDesign(element);
    return { design: pinImageWidths(design as unknown as Record<string, unknown>), warnings, notes: report };
  } catch (thrown) {
    return { warnings: [...warnings, inALine(thrown)], notes: [] };
  } finally {
    console.error = error;
  }
}

export interface RuntimeOptions {
  /** Props to render the template with. Defaults to its `PreviewProps`. */
  props?: Record<string, unknown>;
  /** Name for the generated component. */
  componentName?: string;
  /**
   * Text props become merge tags (`{{user.name}}`) where the template shows
   * them as given, instead of their sample values. On by default; `false`
   * keeps the sample values.
   */
  mergeTags?: boolean;
}

export interface Conversion {
  /** The template in the new components, as a module (TSX): what it renders with the props given, flattened. */
  code: string;
  /** Its root element: render it with `render()` from @unlayer/react-elements. */
  element: React.ReactElement;
  /** The web fonts' stylesheets the template loads. */
  fonts: Array<{ url: string }>;
  report: ConversionReport;
  /** The design JSON the visual editor opens with `loadDesign()`, from `toDesign()`. Throws where it can't go there. */
  design(): Record<string, any>;
  /** The web fonts the design uses, to register with the editor (`fonts.customFonts`) so it shows and exports them. */
  editorFonts(): EditorFont[];
  /** The HTML it renders to. */
  html(): Promise<string>;
}

/** A tree in the new components: its module and its element (a `NewComponentsError` where it can't be). */
async function inNewComponents(tree: ElementNode, print: PrintOptions): Promise<{ code: string; element: React.ReactElement; notes: string[]; stacked: string[] }> {
  const intermediate = await treeToTsx(tree, print);
  const moved = await toNewComponents(intermediate);
  try {
    return { code: moved.code, notes: moved.notes.map(withoutLine), stacked: moved.stacked.map(withoutLine), element: readTemplate(moved.code, MODULES) };
  } catch (error) {
    throw new NewComponentsError(inALine(error), intermediate);
  }
}

/**
 * Runtime mode: render `Template` with sample props and convert what it renders, in the new components. Logic (loops,
 * conditions) is flattened into content.
 *
 * The result is checked against the original, rendered with the new components: `report.missingText` lists any words
 * the original shows that the conversion doesn't (empty when nothing was lost), `report.styleDifferences` the words it
 * shows in another style, `report.unverified` what the check couldn't read, `report.phoneDifferences` and
 * `report.layoutDifferences` what shows or sits elsewhere on phones and across the page, and `report.designWarnings`
 * what the visual editor wouldn't get. Throws a `NewComponentsError` (why, and the template in Elements 0.2's
 * components, as it was written first) where it can't be written in the new components.
 */
export async function convertReactEmail(Template: Template, options: RuntimeOptions = {}): Promise<Conversion> {
  const props = options.props ?? Template.PreviewProps ?? {};
  const element = React.createElement(Template, props);
  const converted = await convertElement(element);
  const { fonts, report } = converted;
  const print = { componentName: options.componentName ?? "Template", header: ["Converted from a React Email template by @unlayer/migrate (runtime mode)."] };
  // Checked with the sample values: merge tags stand in for them only where that changes nothing else.
  const sample = await inNewComponents(converted.tree, print);
  let html: string;
  try {
    html = await htmlOf(sample.element);
  } catch (error) {
    throw new NewComponentsError(`what it's written as doesn't render: ${inALine(error)}`, await treeToTsx(converted.tree, print));
  }
  const check = withoutPlaceholderLinks(compareText(await render(element), html));
  report.missingText = check.missing;
  report.addedText = check.added;
  report.missingAttributes = check.missingAttributes;
  report.addedAttributes = check.addedAttributes;
  report.styleDifferences = check.styles;
  report.unverified = check.unverified;
  report.phoneDifferences = check.phone;
  report.layoutDifferences = check.layout;
  let written = sample;
  const code = componentCode(Template);
  if (options.mergeTags !== false && code === undefined) report.info.push({ reason: CODE_UNREAD });
  else if (options.mergeTags !== false) {
    // The component's code says which props it tests (a function's text: its own code, not what it imports).
    const tested = testedProps(code!);
    const tagged = await mergeTagged(props, converted.tree, async (p, measured) => (await convertElement(React.createElement(Template, p), { measured })).tree, tested);
    if (tagged.result) written = await inNewComponents(tagged.result, print);
    if (tagged.used.length) report.info.push({ reason: "text props became merge tags", detail: tagged.used.join(", ") });
    for (const path of tagged.kept) report.info.push({ reason: "text prop kept as its sample value (the template changes or tests it, or an image shows it)", detail: path });
  }
  for (const line of written.notes) {
    if (written.stacked.includes(line)) report.notes.push({ reason: "columns written one under another", detail: line });
    else report.info.push({ reason: "in the new components", detail: line });
  }
  const designed = designOf(written.element);
  if (designed.warnings.length) report.designWarnings = designed.warnings;
  for (const line of designed.notes) report.info.push({ reason: "in the visual editor", detail: line });
  const design = () => designed.design ?? (toDesign(written.element).design as unknown as Record<string, any>);
  return {
    code: written.code,
    element: written.element,
    fonts,
    report,
    design,
    editorFonts: () => editorFonts(design(), fonts),
    html: () => htmlOf(written.element),
  };
}

export interface Verification extends TextCheck {
  originalHtml: string;
  convertedHtml: string;
  /** What the visual editor wouldn't get: what toDesign threw, or an error Elements logged reading the template. */
  designWarnings: string[];
  /**
   * The design JSON the visual editor opens (`loadDesign`), from toDesign() with the same props (or `designProps`).
   * Undefined where the template can't go to the editor (`designWarnings` says why).
   */
  design?: Record<string, unknown>;
  /** What the builder holds otherwise than the template has it (toDesign's report): one line each. */
  designNotes: string[];
  /**
   * The share of the design's blocks the editor can edit (not Html blocks; spacers, invisible dividers standing for
   * space, aren't counted): what it gets, with a block written both ways (`holdsElements(…) ? … : …`) as the props
   * render it.
   */
  editable: number;
  /** The web fonts the design uses, to register with the editor (`fonts.customFonts`) so it shows and exports them. */
  editorFonts: EditorFont[];
  /**
   * The same check with each boolean prop flipped, to reach branches the
   * preview props don't take, and with values the preview props may not hold.
   * Only variants the check fails (a difference, or something it couldn't
   * verify), or where the migrated template fails (it doesn't render, or the
   * visual editor wouldn't get it) and the original doesn't, are listed.
   */
  variants: Array<{
    change: string;
    missing: string[];
    added: string[];
    missingAttributes: string[];
    styles?: StyleDifference[];
    unverified?: TextCheck["unverified"];
    phone?: TextCheck["phone"];
    layout?: TextCheck["layout"];
    error?: string;
  }>;
}

/** A flipped prop's check, as listed in `variants`: every part that failed. */
function variant(change: string, check: TextCheck): Verification["variants"][number] {
  return {
    change,
    missing: check.missing,
    added: [...check.added, ...check.addedAttributes],
    missingAttributes: check.missingAttributes,
    ...(check.styles.length ? { styles: check.styles } : {}),
    ...(check.unverified.length ? { unverified: check.unverified } : {}),
    ...(phoneDiffers(check.phone) ? { phone: check.phone } : {}),
    ...(check.layout.length ? { layout: check.layout } : {}),
  };
}

/**
 * Check a migrated template, written with the new components, against the original: render both with the same props
 * and compare the words, links and images they show, their styles, on desktop and phones, and check the design JSON
 * the visual editor would open (toDesign). Each boolean prop is also flipped once, to cover branches the preview props
 * don't take, and values the preview props may not hold are tried (an element, text with markup). Run it before
 * trusting a migration.
 */
export async function verifyNewComponents(
  Original: Template,
  Converted: MigratedTemplate,
  options: {
    props?: Record<string, unknown>;
    /**
     * Props for the design JSON, if not `props`: the migrated template's own
     * `PreviewProps`, where the codemod converted the JSX the original's hold.
     */
    designProps?: Record<string, unknown>;
    /** The web fonts' stylesheets the template loads (the converter's `fonts`), for `editorFonts`. */
    fonts?: Array<{ url: string }>;
  } = {},
): Promise<Verification> {
  const props = options.props ?? Original.PreviewProps ?? {};
  const originalHtml = await render(React.createElement(Original, fresh(props)));
  const root = callTemplate(Converted, props);
  if (!React.isValidElement(root)) throw new Error("the template renders nothing with these props: give it PreviewProps it renders with");
  const convertedHtml = await htmlOf(root);
  const designed = designOf(options.designProps ? callTemplate(Converted, options.designProps) : root);

  const variants: Verification["variants"] = [];
  for (const [name, value] of Object.entries(props)) {
    if (typeof value !== "boolean") continue;
    const flipped = { ...props, [name]: !value };
    const change = `${name}: ${!value}`;
    let original: string;
    try {
      original = await render(React.createElement(Original, fresh(flipped)));
    } catch {
      continue; // the original doesn't render this way either: nothing to compare
    }
    try {
      const migrated = callTemplate(Converted, flipped);
      // It renders nothing this way (`return null`, an empty fragment): the original must show nothing either.
      if (rendersNothing(migrated)) {
        const check = compareText(original, "");
        if (checkFails(check)) variants.push(variant(change, check));
        continue;
      }
      const check = withoutPlaceholderLinks(compareText(original, await htmlOf(migrated)));
      // The visual editor must get it this way too.
      const lost = designOf(migrated).warnings;
      if (lost.length) {
        variants.push({ change, missing: check.missing, added: check.added, missingAttributes: check.missingAttributes, error: `the editor wouldn't get it: ${lost.join("; ")}` });
        continue;
      }
      if (checkFails(check)) variants.push(variant(change, check));
    } catch (error) {
      variants.push({ change, missing: [], added: [], missingAttributes: [], error: inALine(error) });
    }
  }
  for (const found of await valueVariants(Original, Converted, props, htmlOf)) {
    const left = { ...found, added: found.added.filter((word) => !PLACEHOLDER_LINK.test(word)) };
    if (left.error || left.missing.length || left.added.length || left.missingAttributes.length) variants.push(left);
  }
  const stylesheets = options.fonts ?? [];
  return {
    ...withoutPlaceholderLinks(compareText(originalHtml, convertedHtml)),
    originalHtml,
    convertedHtml,
    designWarnings: designed.warnings,
    ...(designed.design ? { design: designed.design } : {}),
    designNotes: designed.notes,
    editable: designed.design ? designEditable(designed.design) : 0,
    editorFonts: designed.design ? editorFonts(designed.design, stylesheets) : [],
    variants,
  };
}

/** A Button with no link has "#" in the new components, which require one: nothing a reader would follow. */
const PLACEHOLDER_LINK = /^href #(\s|$)/;
const withoutPlaceholderLinks = <Check extends { addedAttributes: string[] }>(check: Check): Check => ({ ...check, addedAttributes: check.addedAttributes.filter((attribute) => !PLACEHOLDER_LINK.test(attribute)) });

/**
 * The migrated template against the original with values the preview props may not hold: an element where the migration
 * tells them apart, and text with markup and `&"` in it.
 */
async function valueVariants(Original: Template, Converted: MigratedTemplate, props: Record<string, unknown>, draw: (migrated: React.ReactElement) => Promise<string>): Promise<Verification["variants"]> {
  const variants: Verification["variants"] = [];
  // Values the migration shows as text, or as they render where they hold React elements (`holdsElements(note) ? …`):
  // each given an element (a link), which the preview props may not, so the branch that keeps them is checked too.
  for (const path of elementValued(componentCode(Converted))) {
    const change = `${path}: an element`;
    const given = withValue(fresh(props), path, React.createElement("a", { href: "https://example.com/given-as-an-element" }, "given as an element"));
    if (!given) continue;
    let original: string;
    try {
      original = await render(React.createElement(Original, fresh(given)));
    } catch {
      continue; // the original doesn't render this way either
    }
    try {
      const migrated = callTemplate(Converted, given);
      const check = compareText(original, rendersNothing(migrated) ? "" : await draw(migrated));
      // An attribute the element was turned into text for (`alt="[object Object]"`) isn't content either side means.
      const meant = (attributes: string[]) => attributes.filter((a) => !a.includes("[object Object]"));
      const missingAttributes = meant(check.missingAttributes), addedAttributes = meant(check.addedAttributes);
      if (check.missing.length || check.added.length || missingAttributes.length || addedAttributes.length) variants.push({ change, missing: check.missing, added: [...check.added, ...addedAttributes], missingAttributes });
    } catch (error) {
      variants.push({ change, missing: [], added: [], missingAttributes: [], error: inALine(error) });
    }
  }
  // Text props with markup and `&"` in them, nested ones too (`user.city`, `items[0].name`):
  // React Email shows them as text, and so must the migrated template (no text or link turned into markup).
  const { value: marked, strings } = withMarkup(props);
  if (strings) {
    const change = "text props with markup";
    let original: string | undefined;
    try {
      original = await render(React.createElement(Original, fresh(marked)));
    } catch {
      original = undefined; // the original doesn't render this way either
    }
    if (original !== undefined) {
      try {
        const migrated = callTemplate(Converted, marked);
        const check = compareText(original, rendersNothing(migrated) ? "" : await draw(migrated));
        if (check.missing.length || check.added.length || check.missingAttributes.length || check.addedAttributes.length) variants.push({ change, missing: check.missing, added: [...check.added, ...check.addedAttributes], missingAttributes: check.missingAttributes });
      } catch (error) {
        // The new components refuse a value with markup where no text goes (a link's target, a color from a prop): the
        // original writes it in an attribute or a style no one reads as text. Text with markup in it, they show as text.
        const why = error instanceof Error ? error.message : "";
        const refused = /^\[Elements\][\s\S]*(prop|style)\/invalid/.test(why) && why.includes(MARKUP.slice(0, -1));
        if (!refused) variants.push({ change, missing: [], added: [], missingAttributes: [], error: inALine(error) });
      }
    }
  }
  return variants;
}

/** The share of a design's content blocks that aren't Html blocks, spacers (a divider with no line) not counted. */
export function designEditable(design: Record<string, unknown>): number {
  type Content = { type?: string; values?: { border?: { borderTopWidth?: string } } };
  const rows = ((design.body as { rows?: Array<{ columns?: Array<{ contents?: Content[] }> }> } | undefined)?.rows ?? []);
  const blocks = rows.flatMap((row) => (row.columns ?? []).flatMap((column) => column.contents ?? []))
    .filter((block) => !(block.type === "divider" && /^0(px)?$/.test(String(block.values?.border?.borderTopWidth ?? "").trim())));
  return blocks.length ? blocks.filter((block) => block.type !== "html").length / blocks.length : 1;
}

/**
 * The props a migrated template tests for React elements (`holdsElements(note, props.user.bio)`, the codemod's helper):
 * their paths (`note`, `user.bio`). Values it reads that aren't props are listed too (giving them changes nothing).
 */
function elementValued(code: string | undefined): string[] {
  const paths = new Set<string>();
  for (const call of (code ?? "").matchAll(/\b_*holdsElements\(([^()]*)\)/g)) {
    for (const arg of call[1].split(",")) {
      const path = arg.replace(/\s+/g, "").replace(/\?\./g, ".").replace(/^props\./, "");
      if (/^[A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*)*$/.test(path)) paths.add(path);
    }
  }
  return [...paths];
}

/** `props` with `value` at `path` (`user.bio`), where what holds it is there (undefined when it isn't). */
function withValue(props: Record<string, unknown>, path: string, value: unknown): Record<string, unknown> | undefined {
  const keys = path.split(".");
  let holder: Record<string, unknown> = props;
  // Only in plain objects (not a list's `length`, a Date's field).
  const plain = (v: unknown) => !!v && typeof v === "object" && [Object.prototype, null].includes(Object.getPrototypeOf(v));
  for (const key of keys.slice(0, -1)) {
    const next = holder[key];
    if (!plain(next)) return undefined;
    holder = next as Record<string, unknown>;
  }
  holder[keys[keys.length - 1]] = value;
  return props;
}

/** What `withMarkup` adds to every string. */
const MARKUP = `<i>x</i>&"`;

/**
 * `props` with markup and `&"` added to every string in it, through plain
 * objects and arrays. Anything else (a React element, a function, a Date) is
 * kept as given. `strings`: how many were changed.
 */
function withMarkup(props: Record<string, unknown>): { value: Record<string, unknown>; strings: number } {
  let strings = 0;
  const copies = new Map<object, unknown>(); // a value used twice (or itself) is copied once
  const mark = (value: unknown): unknown => {
    if (typeof value === "string") {
      strings++;
      return `${value}${MARKUP}`;
    }
    if (!value || typeof value !== "object" || React.isValidElement(value)) return value;
    const prototype = Object.getPrototypeOf(value);
    if (!Array.isArray(value) && prototype !== Object.prototype && prototype !== null) return value;
    if (copies.has(value)) return copies.get(value);
    const copy: Record<string, unknown> | unknown[] = Array.isArray(value) ? [] : {};
    copies.set(value, copy);
    for (const [key, item] of Object.entries(value)) (copy as Record<string, unknown>)[key] = mark(item);
    return copy;
  };
  return { value: mark(props) as Record<string, unknown>, strings };
}

/**
 * The design JSON the visual editor opens for a migrated template (toDesign), with
 * text props as merge tags (`{{user.name}}`) where the template shows them
 * as given. `design` is its design JSON with the sample props.
 */
export async function mergeTagDesign(
  Converted: MigratedTemplate,
  props: Record<string, unknown>,
  design: Record<string, unknown>,
  /**
   * The template's source (by default the component's own code): a prop it compares or falls back on (`count === "1"`,
   * `company || "Acme"`) keeps its sample value. `helpers`: functions in it that show what they're given as it is (the
   * codemod's, from `convertSource`).
   */
  options: { source?: string; helpers?: string[] } = {}
): Promise<{ design: Record<string, unknown>; used: string[]; kept: string[] }> {
  const warn = console.warn;
  const error = console.error;
  console.warn = () => undefined; // the same warnings as the sample render, already reported
  // What React says of a placeholder (`<uNlAyEr1 /> is using incorrect casing`) isn't the template's: the sample render
  // already said what the template's own renders do. A render with a placeholder in that the editor wouldn't get (see
  // `designOf`) can't use that placeholder.
  console.error = () => undefined;
  try {
    // Without the source, the component's own code calls the codemod's helpers it doesn't define: they show text as given.
    const source = options.source ?? componentCode(Converted);
    if (source === undefined) return { design, used: [], kept: [] };
    const tested = testedProps(source, new Set(options.helpers ?? (options.source === undefined ? CODEMOD_HELPERS : [])));
    const tagged = await mergeTagged(props, design, (p) => {
      // (Elements' own errors are still caught there; anything else goes to the silenced console.)
      const designed = designOf(callTemplate(Converted, p));
      if (designed.warnings.length || !designed.design) throw new Error(designed.warnings[0]);
      return designed.design;
    }, tested);
    return { design: tagged.result ?? design, used: tagged.used, kept: tagged.kept };
  } finally {
    console.warn = warn;
    console.error = error;
  }
}

/** A template's Tailwind config as it renders (it can be code: plugins, presets), for `convertSource`. */
export async function templateTailwindConfig(Original: Template, props?: Record<string, unknown>): Promise<Record<string, unknown> | undefined> {
  return findTailwindConfig(React.createElement(Original, props ?? Original.PreviewProps ?? {}));
}

/** The template's own <Tailwind> and its config, for `convertSource`'s `tailwind` and `tailwindConfig`. */
export async function templateTailwind(Original: Template, props?: Record<string, unknown>): Promise<{ config: Record<string, unknown>; component: unknown } | undefined> {
  return findTailwind(React.createElement(Original, props ?? Original.PreviewProps ?? {}));
}

export { rebaseImports } from "./imports";
export { mergeTagged, textProps, type TextProp } from "./merge-tags";
export { checkFails, compareText, htmlWords, NewComponentsError, phoneDiffers, shareEditorFonts, type ConversionReport, type EditorFont, type TextCheck } from "../convert";
export { convertElement } from "./runtime";
export { expand, findTailwind, findTailwindConfig, REACT_EMAIL_COMPONENTS } from "./expand";
export { convertSource, type CodemodOptions, type CodemodResult } from "./codemod";
export type { ModuleLoader } from "./components";
