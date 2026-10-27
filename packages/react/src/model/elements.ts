/**
 * A collected template (collect.ts) as Elements components only, Email > Row > Column > blocks, with their resolved
 * props: the model the HTML, the head and the design are made from, so they can't disagree. Made from the collected
 * content as it is, a tree of records, markup and text: nothing is parsed.
 *
 * What a template puts among them that isn't one keeps what it did before: markup among the rows is kept as it is;
 * text in a Row or Column shows as text (with a warning); a component of the user's own that renders markup in a
 * Column is an HTML block named after it; other markup in a Row or Column is left out. A component that fails fails
 * the render, or with `onError: "omit"` is left out of all three (see engine/errors.ts).
 */
import React from "react";
// (React 19 takes the props object as it's given, where createElement copies it.)
import { jsx, jsxs } from "react/jsx-runtime";
import type { Item, RecordItem } from "../engine";
import { whereIs } from "../utils/collect";
import { RenderError } from "../engine";
import { failed, failedBefore, guest, rightToLeft, sayOnce } from "../utils/render-scope";
import { containerOf } from "../utils/container-render";
import { classProps, isTailwindError, prepareClasses, TAILWIND } from "../utils/tailwind";
import { OWN, UNLAYER_CONFIG_KEY } from "../utils/create-component";
import { asWritten, inlineHtml } from "../utils/inline-html";
import { closestName } from "../utils/closest-name";
import { MEMO } from "../utils/unwrap-root";
import { COLUMN_DEFAULTS, ROW_DEFAULTS } from "../utils/container-defaults";
import { PROP_ALIASES } from "@unlayer-internal/shared-elements";
import Row from "../components/Row";
import Column from "../components/Column";
import Html from "../components/Html";
import Paragraph from "../components/Paragraph";
import Divider from "../components/Divider";
import Heading, { margins } from "../components/Heading";
import Button from "../components/Button";
import Image from "../components/Image";
import Menu from "../components/Menu";
import Social from "../components/Social";
import Table from "../components/Table";
import Video from "../components/Video";
import PageBreak from "../components/PageBreak";
import { hasMarkup, markupOnly, partsOf, recordOf, runs, startOf, textOf, type Part, type Token } from "./content";
import type { Collected } from "./collect";

/**
 * On markup a component of the user's own rendered in a Column (see `keptMarkup`): the Html block the design
 * keeps it as. The HTML numbers it after the component, and the head counts it so too.
 */
export const KEPT = Symbol.for("@unlayer/react-elements/kept");

type Place = "root" | "row" | "column";
/** A record's item, and the <Tailwind> it's in (whose classes its `className` takes). */
type Scoped = { item: RecordItem; tw?: Record<string, any> };

function innerType(type: any): any {
  while (type?.$$typeof === MEMO) type = type.type;
  return type;
}

const nameOf = (element: React.ReactElement): string => {
  if (typeof element.type === "string") return element.type;
  const type = innerType(element.type);
  return type?.displayName || type?.name || "component";
};

/**
 * A component of the user's own that rendered markup in a Column: an HTML block of it, named after the component
 * (with its props, for its padding and visibility). An element given `dangerouslySetInnerHTML` gives what's in it,
 * as 0.1.22 kept it (the element itself left out), whatever that holds (a `<div/>`, a stray end tag, a comment);
 * other markup, which 0.1.22 left out (a link, a table, an image, elements side by side), is kept as it is.
 */
function keptMarkup(c: Collected, item: RecordItem): React.ReactElement | undefined {
  c.kept ??= new Map();
  if (!c.kept.has(item.record)) c.kept.set(item.record, keptMarkupOnce(item));
  return c.kept.get(item.record);
}

function keptMarkupOnce(item: RecordItem): React.ReactElement | undefined {
  const raw = markupOnly(item.items);
  if (raw === undefined) return undefined;
  const list = partsOf(item.items);
  // Text alone shows as text (see `elements`).
  if (!list.some((p) => typeof p !== "string")) return undefined;
  const element = recordOf(item).element as React.ReactElement<any>;
  // A link alone (a <Link>) is a Paragraph holding it, a rule a Divider: blocks the design can edit.
  const solo = list.filter((p) => typeof p !== "string" || textOf(p).trim());
  const { containerPadding, hideOnMobile, hideOnDesktop } = (element.props ?? {}) as Record<string, unknown>;
  const block = solo.length === 1 && typeof solo[0] !== "string" ? asBlock(solo[0], { containerPadding, hideOnMobile, hideOnDesktop }, true) : undefined;
  if (block) return block;
  // One element: React writes `dangerouslySetInnerHTML` and children alike, so what the component returned says which
  // it gave (the walker keeps it, whatever kind of component it is: engine/walk.ts's `returned`). Children are kept
  // with the element around them, its styles with them.
  const one = list.length === 1 && typeof list[0] !== "string" && list[0].inner !== undefined ? list[0] : undefined;
  const out = (recordOf(item).output as { value: unknown } | undefined)?.value as React.ReactElement<{ dangerouslySetInnerHTML?: unknown }> | undefined;
  const given = React.isValidElement(out) && typeof out.type === "string" && out.props.dangerouslySetInnerHTML != null;
  const html = one && given ? one.inner! : raw;
  const Rendered = () => React.createElement("div", { dangerouslySetInnerHTML: { __html: html } });
  Rendered.displayName = nameOf(element);
  (Rendered as unknown as Record<symbol, unknown>)[OWN] = true;
  (Rendered as unknown as Record<symbol, unknown>)[KEPT] = React.createElement(Html, {
    html,
    ...(containerPadding !== undefined ? { containerPadding } : {}),
    ...(hideOnMobile !== undefined ? { hideOnMobile } : {}),
    ...(hideOnDesktop !== undefined ? { hideOnDesktop } : {}),
  } as Record<string, unknown>);
  return React.createElement(Rendered, { ...element.props });
}

/** Collected content as HTML: markup as it is, each row, column or block by `render`. */
export function markup(c: Collected, items: readonly Item[], render: (element: React.ReactElement) => string, tw?: Record<string, any>): string {
  let html = "";
  for (const item of items) {
    if (typeof item === "string") html += item;
    else if (item.kind === "markup") html += item.html;
    else if (item.kind === "cut") html += item.open + markup(c, item.items, render, tw) + item.close;
    else {
      const r = recordOf(item);
      if (r.kind === "boundary") html += markup(c, item.items, render, tw);
      else if (r.kind === "tailwind") html += markup(c, item.items, render, r);
      else html += recordHtml(c, { item, tw }, render);
    }
  }
  return html;
}

/**
 * A recorded row (or a block among the rows) as HTML, by `render`. A Row or Column whose own HTML fails (see
 * renderContainer) fails the render, or is left out (`onError: "omit"`): a Column with its cell, the Row made again
 * without it (the Columns after it move up, as a block's siblings do), and the Row with its last Column.
 */
function recordHtml(c: Collected, scoped: Scoped, render: (element: React.ReactElement) => string): string {
  const r = recordOf(scoped.item);
  for (let out = element(c, scoped); out; out = element(c, scoped)) {
    try {
      return render(out);
    } catch (error) {
      const container = containerOf(error);
      if (!container || failedBefore(container)) {
        // A block's failure says which block it was.
        if (error instanceof RenderError) throw error;
        failed(new RenderError(`${String((error as Error)?.message ?? error)}`, r.kind === "row" ? "Row" : nameOf(out), whereIs(r) ?? "", error), r);
        return "";
      }
      failed(error as RenderError, container);
      if (container === r) return "";
      c.made!.delete(r);
    }
  }
  return "";
}

/**
 * The Rows, Columns and blocks in a <Tailwind> (`tw`, its record) and in the render's others with its `tw` (or
 * `config`), not in one inside it with another: the records whose classes its handle rewrites, built at once, once per
 * render (one list for the scopes of a handle). Worked out once per render, for every scope.
 */
function inScope(c: Collected, tw: object): object[] {
  if (!c.scopes) {
    const scopes = (c.scopes = new Map<object, object[]>());
    const byHandle = new Map<unknown, object[]>();
    const walk = (items: readonly Item[], list?: object[]) => {
      for (const item of items) {
        if (typeof item === "string" || item.kind === "markup") continue;
        let inner = list;
        if (item.kind === "record") {
          const r = recordOf(item);
          if (r.kind === "tailwind") {
            const key = r.props?.tw ?? r.props?.config ?? r;
            scopes.set(r, (inner = byHandle.get(key) ?? byHandle.set(key, []).get(key)!));
          } else if (list && r.kind !== "boundary") {
            // A block with rich text: its markup, under the prop its rewrite reads it as (see made), for its classes.
            const key = r.rich ? ((r.type as any)?.[UNLAYER_CONFIG_KEY]?.name === "Paragraph" ? "html" : "text") : undefined;
            list.push(key ? { ...r, props: { ...r.props, [key]: markupOnly(item.items) } } : r);
          }
        }
        walk(item.items, inner);
      }
    };
    walk(c.content);
  }
  return c.scopes.get(tw) ?? [];
}

/**
 * A recorded Row's, Column's or block's props, with its `className` turned into props by the <Tailwind> it's in
 * (worked out once: the HTML, the head and the design ask for the same); null where reading its classes failed (a
 * Tailwind plugin threw) and the render leaves it out (`onError: "omit"`).
 */
function styled(c: Collected, tw: Record<string, any> | undefined, r: Record<string, any>, props: Record<string, any>, type: any = r.type): Record<string, any> | null {
  // (Classes in a block's `html` or `text` are inlined too: one that has a class attribute, however it's written.)
  if (tw === undefined || !(props.className || /class/i.test(props.html) || /class/i.test(props.text))) return props;
  c.styled ??= new Map();
  if (!c.styled.has(r)) {
    // (First, the classes of the records in its scope, built at once: see prepareClasses.)
    if (!c.styled.has(tw)) c.styled.set(tw, (prepareClasses(tw.props, inScope(c, tw)), {}));
    const config = type?.[UNLAYER_CONFIG_KEY];
    const [name, defaults] = r.kind === "row" ? ["Row", ROW_DEFAULTS] : r.kind === "column" ? ["Column", COLUMN_DEFAULTS] : [config?.name ?? type?.displayName ?? "Block", config?.defaultValues];
    let own: Record<string, any> | null;
    try {
      own = classProps(tw.props, name, defaults, props);
    } catch (error) {
      // What reading its classes threw (a Tailwind plugin's error) is its: it fails the render, or it's left out.
      if (isTailwindError(error) || error instanceof RenderError) throw error;
      failed(new RenderError(`${String((error as Error)?.message ?? error)}`, name, whereIs(r) ?? name, error), r);
      own = null;
    }
    c.styled.set(r, own);
  }
  return c.styled.get(r)!;
}

/**
 * A block markup in a Column is (a link alone, a <Link>, is a Paragraph holding it: see asBlock), its markup's classes
 * inlined by the <Tailwind> it's in, as a block's are (once per render, by `key`); none where reading them failed.
 */
function restyled(c: Collected, tw: Record<string, any> | undefined, key: object, block: React.ReactElement<any>): React.ReactElement[] {
  if (block.type !== Paragraph && block.type !== Html) return [block];
  const own = styled(c, tw, key, block.props, block.type);
  return own === block.props ? [block] : own ? [jsx(block.type, own)] : [];
}

/** Props any block takes beside its values (its defaults' keys); `font…` in camel case (`fontsize` is a slip). */
const KNOWN = /^(children|className|style|mode|values|containerPadding|hideOn(Mobile|Desktop)|mobile|skipInText|html|text|href|action|alt|src|width|maxWidth|items|icons|icon\w+|spacing|videoUrl|headers|data|columns|rows|font[A-Z]\w*|letterSpacing|color|lineHeight|textAlign|padding|border\w*|backgroundColor|hover\w*|_\w+)$/;

type ItemConfig = { name: string; defaultValues: Record<string, unknown>; names?: readonly string[] };

/** A block's props: its values' names (flat too) and the names it takes for them (see PROP_ALIASES), once per block. */
const propNames = new WeakMap<object, { names: string[]; known: Map<string, boolean> }>();

/** Whether a block takes a prop: one of its names (see namesOf), one any block takes, or a link's `target`. */
function takes(config: ItemConfig, key: string): boolean {
  const { names, known } = namesOf(config);
  let takes = known.get(key);
  if (takes === undefined) {
    const values = config.defaultValues;
    // (`target` is a link's: a block without one has no use for it.)
    takes = names.includes(key) || KNOWN.test(key) || (key === "target" && ("href" in values || "action" in values));
    // (Names a template gives: a few per block, kept.)
    if (known.size < 500) known.set(key, takes);
  }
  return takes;
}

function namesOf(config: ItemConfig): { names: string[]; known: Map<string, boolean> } {
  let entry = propNames.get(config);
  if (!entry) {
    const values = config.defaultValues;
    const names = Object.keys({ ...values, ...PROP_ALIASES[config.name] }).concat(config.names ?? [], ...Object.values(values).map((v) => (v && typeof v == "object" ? Object.keys(v) : [])));
    propNames.set(config, (entry = { names, known: new Map() }));
  }
  return entry;
}

/** The tags in markup, in order (attributes aside). */
const tagsOf = (html: string) => String(html.match(/<\/?[a-zA-Z][\w:-]*/g));

/**
 * Markup that is a block: an <a> whose tags are all ones text holds a Paragraph holding it (its link kept to what text
 * can hold), a bare <hr> a Divider. Another <a> or <hr> (an image in the link, a styled rule) is an HTML block, as it
 * is; with `exact` (a component's markup, kept as HTML anyway), nothing, unless the block keeps all of it.
 */
const asBlock = (part: Part, props: Record<string, unknown> = {}, exact = false): React.ReactElement | undefined => {
  if (!/^(a|hr)$/.test(part.tag)) return undefined;
  const text = part.tag === "a" ? inlineHtml(part.html) : "";
  // (A component's markup, kept whole: as text writes it, its quotes and <%name%> tags as written.)
  if (text && (exact ? text === asWritten(part.html) : tagsOf(text) === tagsOf(part.html))) return React.createElement(Paragraph, { ...props, html: text });
  if (part.html === "<hr/>") return React.createElement(Divider, props);
  return exact ? undefined : React.createElement(Html, { ...props, html: part.html });
};

/**
 * This copy's blocks, by name. A block of another copy of Elements (a package still on an earlier release, in a
 * monorepo) is this copy's block of its name, so its HTML is this release's, the export of its design (a custom tool
 * stays its own).
 */
const BLOCKS: Record<string, React.ComponentType<any>> = { Paragraph, Heading, Button, Image, Divider, Html, Menu, Social, Table, Video, PageBreak };

/**
 * A recorded Row, Column or block, as the Elements component it was, with what rendered in it (null: left out), made
 * once per render: the HTML, the head and the design ask for the same. `_record` is its record: a Column names a block
 * by it when its exporter fails, and the head and the design leave out what failed in the HTML (see `failedBefore`).
 */
export function element(c: Collected, scoped: Scoped): React.ReactElement | null {
  const r = recordOf(scoped.item);
  // A row or block whose exporter failed in this render's HTML (`onError: "omit"`): left out of the head and design too.
  if (failedBefore(r)) return null;
  c.made ??= new Map();
  if (!c.made.has(r)) c.made.set(r, made(c, scoped, r));
  return c.made.get(r)!;
}

function made(c: Collected, scoped: Scoped, r: ReturnType<typeof recordOf>): React.ReactElement | null {
  const { item, tw } = scoped;
  if (r.kind === "block") {
    let props: Record<string, any> = r.props;
    // Its text as it rendered (see record.tsx): HTML, kept to inline formatting.
    const html = r.rich ? markupOnly(item.items) : undefined;
    const config = (r.type as any)[UNLAYER_CONFIG_KEY];
    if (html !== undefined) props = { ...props, children: undefined, [config.name === "Paragraph" ? "html" : "text"]: inlineHtml(html) };
    if (config?.name === "Heading") props = margins(props);
    // A prop a block has no use for is said, not dropped quietly (a custom tool's props are its own).
    if (config && !config.contentType) {
      for (const key in props) {
        if (takes(config, key) || props[key] === undefined) continue;
        const near = closestName(key, namesOf(config).names);
        sayOnce(`[Unlayer] ${config.name} ignores the prop \`${key}\`${near ? `: did you mean \`${near}\`?` : "."}`);
      }
    }
    const own = styled(c, tw, r, props);
    return own && jsx((config?.contentType !== "custom" && BLOCKS[config?.name]) || r.type, { ...own, _record: r });
  }
  const own = styled(c, tw, r, r.props);
  if (!own) return null;
  if (r.kind === "column") return jsxs(Column, { ...own, children: elements(c, item.items, "column", tw), _record: r });
  const props: Record<PropertyKey, any> = { ...own };
  let list = elements(c, item.items, "row", tw);
  // Columns whose own HTML failed in this render (`onError: "omit"`), by their places among the Columns: left out with
  // their cells, and the Row with the last of them (see `recordHtml`).
  const gone = leftOut(list);
  if (gone.length) {
    list = list.filter((child) => child !== LEFT_OUT);
    if (!list.some((child: any) => child?.type === Column)) return null;
    if (!props.layout && props.cells) props.cells = without(props.cells, gone);
  }
  // A layout counts the Columns as written (a condition's place included) or as rendered (from Fragments and
  // components): either fits it. The rendered Row is then given its cells, which hold no condition's place. A Row
  // neither fits is left out, of the HTML and the design alike, and said once.
  const layout = props.layout;
  if (layout) {
    const columns = list.filter((child: any) => child?.type === Column).length + gone.length;
    if (columns !== layout.expectedColumns && React.Children.count(props.children) !== layout.expectedColumns) {
      // It fails the render, or is left out (once: the HTML, the head and the design ask).
      if (!c.told.has(r)) {
        c.told.add(r);
        failed(new RenderError(`A Row with the ${layout.name} layout, for ${layout.expectedColumns} Columns, has ${columns}`, "Row", whereIs(r) ?? "Row"));
      }
      return null;
    }
    props.cells = without(layout.cells, gone);
    delete props.layout;
  }
  // A scope's rewrite, the Row's, one its Columns' classes give, or the root's, can put what its classes give the Row
  // in its Columns (Tailwind's padding and margins, and text styles for the text in them: see utils/tailwind.ts).
  const rewrite = props[TAILWIND] ?? columnsRewrite(list) ?? c.root?.[TAILWIND];
  const rtl = rightToLeft();
  const children = (rewrite && guest(() => rewrite(list, props, c.root, rtl))) ?? list;
  // Its own padding is the editor's: around the row, outside its content background (a hook's warned already).
  if (!props[TAILWIND] && /[1-9]/.test(String(given(props, "padding") ?? ""))) {
    const image = given(props, "backgroundImage");
    if (/^(transparent)?$/.test(given(props, "columnsBackgroundColor") ?? "") ? image?.url && image.fullWidth === false : 1)
      sayOnce("[Unlayer] Row padding sits outside the row's content background, as in the editor; to inset the content use the Columns' padding.");
  }
  return jsxs(Row, { ...props, children, _record: r });
}

/** Where a Column left out was, among its Row's Columns (see `elements`). */
const LEFT_OUT = React.createElement(() => null);

function leftOut(list: React.ReactNode[]): number[] {
  const places: number[] = [];
  let column = 0;
  for (const child of list) {
    if (child === LEFT_OUT) places.push(column++);
    else if ((child as React.ReactElement | null)?.type === Column) column++;
  }
  return places;
}

const without = (cells: number[], places: number[]): number[] => (places.length ? cells.filter((_, i) => !places.includes(i)) : cells);

/** A prop as given, or in `values` (where it's given as neither, undefined). */
const given = (props: Record<string, any>, key: string) => (key in props ? props[key] : props.values?.[key]);

/** The rewrite a Row's Columns' classes give it (see utils/tailwind.ts). */
function columnsRewrite(list: React.ReactNode[]): unknown {
  for (const child of list) {
    const rewrite = (child as React.ReactElement<any> | null)?.props?.style?.[TAILWIND]?.row;
    if (rewrite) return rewrite;
  }
  return undefined;
}

/** Text among the rows, or straight in a Row or Column, as it reads. */
const text = (html: string): React.ReactNode[] => [textOf(html)];

/** `out.push(...list)` for a list of any length: a spread of a long one (Markdown's blocks) overflows the stack. */
function append(out: React.ReactNode[], list: readonly React.ReactNode[]): void {
  for (const node of list) out.push(node);
}

/**
 * What's among the rows, or in a Row or a Column, as Elements components. In a Row or Column, markup a record cuts
 * (`<p>Hello <Name />, welcome back</p>`, a `<div>` around a block) is left out whole, as 0.1.22 left it out, with
 * what's in it (text, markup a component renders there); a Row, Column or block in it is kept, as one beside it is,
 * and a Row says where markup starts in it isn't a Column.
 */
export function elements(c: Collected, items: readonly Item[], place: Place, tw?: Record<string, any>, owner?: React.FC, inMarkup = false): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const inColumn = place === "column";
  /** A record, `inside` markup it cuts. */
  const recorded = (item: RecordItem, inside: boolean) => {
    const r = recordOf(item);
    if (r.kind === "tailwind") return void append(out, elements(c, item.items, place, r, owner, inside));
    if (r.kind !== "boundary") {
      const made = element(c, { item, tw });
      if (made) out.push(made);
      // (Its place among the Columns, for its Row's cells: see made.)
      else if (place === "row" && r.kind === "column" && failedBefore(r)) out.push(LEFT_OUT);
      return;
    }
    const kept = inColumn && !inside ? keptMarkup(c, item) : undefined;
    if (kept) return void out.push(...restyled(c, tw, r, kept));
    // Markup it renders, where it isn't kept, is named after it in the messages that say so.
    const Named = () => null;
    Named.displayName = nameOf(r.element);
    if (inColumn && !inside && !c.told.has(r) && hasMarkup(item.items)) {
      c.told.add(r);
      console.warn(`Column: <${Named.displayName}> rendered markup that isn't a block, so it's left out. Put HTML in an <Html> block.`);
    }
    append(out, elements(c, item.items, place, tw, Named, inside));
  };
  // Among the rows, and in markup a record cuts, the content as it's written: its records, and its markup between them.
  if (place === "root" || inMarkup) {
    for (const run of runs(items)) {
      if (!Array.isArray(run)) recorded(run, inMarkup);
      else if (!inMarkup) append(out, rootMarkup(run, owner));
    }
    return out;
  }
  for (const item of items) {
    if (typeof item === "string") out.push(...text(item));
    else if (item.kind === "record") recorded(item, false);
    else if (item.kind === "cut") {
      // Left out whole, the records in it kept (a Row says where markup starts in it isn't a Column).
      for (const run of runs([item])) {
        if (!Array.isArray(run)) recorded(run, true);
        else if (place === "row" && startOf(run)) out.push(React.createElement(owner ?? startOf(run)!));
      }
    }
    // Other markup isn't a Column, which a Row says (and leaves it out); in a Column, an <a> or <hr> is a block (see
    // asBlock), other markup is said and left out.
    else if (!inColumn) out.push(React.createElement(owner ?? item.tag));
    else {
      const block = asBlock(item);
      // (A component's markup is said where it's left out, above.)
      if (!block && !owner) sayOnce(`[Unlayer] Column: <${item.tag}> isn't a block, so it's left out. Put HTML in an <Html> block.`);
      if (block) out.push(...restyled(c, tw, item, block));
    }
  }
  return out;
}

/**
 * Markup among the rows between records, as Elements components for the head and the design (the HTML has it as it
 * is): text as it reads, and each element, which isn't a Row (the design says so). Markup a record cuts, from its
 * start or end tag to the next record, is one element (a `div` unless a component of the template's own wrote it).
 */
function rootMarkup(run: Token[], owner?: React.FC): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  for (const token of run) {
    if (typeof token === "string") out.push(...text(token));
    else if ("tag" in token) out.push(React.createElement(owner ?? token.tag));
    else {
      out.push(React.createElement(owner ?? "div"));
      break;
    }
  }
  return out;
}
