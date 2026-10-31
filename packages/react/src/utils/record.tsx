/**
 * How a template is collected (see src/model): the collecting render (src/engine) prepares it for react-dom, and
 * asks this collector about each element first. Elements' Rows, Columns and blocks (of any copy of Elements: by their
 * markers, or an older copy's names and code), <Tailwind> scopes and <Head>/<Font> entries are recorded instead of
 * being called, what's inside them rendered inside their records; everything else (the user's components, markup,
 * Fragments, Context) renders as React renders it.
 * Each component of the template's own in a list is in a boundary, where it's left out when it fails and the render
 * leaves failed parts out (`onError: "omit"`).
 */
import React from "react";
import { HEAD_ENTRY, RECORDS, type Recorded } from "./collect";
import { isElementsType } from "./unwrap-root";
import { rootName } from "./root-type";
import { TAILWIND, TAILWIND_LOADER } from "./tailwind";
import { UNLAYER_CONFIG_KEY, UNLAYER_RENDER_KEY } from "./create-component";
import { boundary, recordNode } from "../engine/records";
import { htmlOf } from "../engine/output";
import { checked, checkKeys } from "../engine/keys";
import type { Collector } from "../engine";

interface Options {
  /** Markup is in a boundary too, so markup React rejects is left out rather than failing the render. */
  omit: boolean;
  /** In a template with no root: what says a root met in its content (by its name). */
  nested?: (root: string) => void;
}

/** Children as a list (arrays flattened, nothing and booleans left out), each list checked for keys. */
function childList(children: React.ReactNode, owner: string, out: React.ReactNode[] = []): React.ReactNode[] {
  if (Array.isArray(children)) {
    checkKeys(children, owner, true);
    for (const child of children) childList(child, owner, out);
  } else if (children !== null && children !== undefined && typeof children !== "boolean") out.push(children);
  return out;
}

const displayName = (type: unknown) => (type as { displayName?: string } | null)?.displayName ?? "";

/**
 * Children with each component of the template's own in a boundary. Fragments are kept, their children in
 * boundaries too; markup with such a component in it (`<div><Promo /></div>`) gets that component's.
 */
export function guard(children: React.ReactNode, options: Options, owner: string, inContainer = false): React.ReactNode[] {
  // (Its lists checked for keys as written: the one it gives back isn't checked again.)
  return checked(childList(children, owner).map((child) => guarded(child, options, owner, inContainer)));
}

function guarded(child: React.ReactNode, options: Options, owner: string, inContainer: boolean): React.ReactNode {
  if (!React.isValidElement(child)) return child;
  const type = child.type as any;
  // No component at all (`undefined` from a broken or circular import): the render fails, as an email missing a
  // block shouldn't send. A <Tailwind> and Elements' own are recorded where the walk reaches them.
  if (!type || (typeof type === "object" && !("$$typeof" in type)) || type[TAILWIND] || type[HEAD_ENTRY]) return child;
  if (isElementsType(type)) {
    // A root (Email, Page, Document) placed in a Row or Column: left out, as 0.1.22 left it out, saying so. Among the
    // rows (`<Email><Email>…</Email></Email>`) it renders as it renders, as 0.1.22 rendered it.
    const root = rootName(type);
    if (root && !type[UNLAYER_RENDER_KEY]) {
      if (!inContainer) return child;
      console.warn(`[Unlayer] <${root}> is a root: it can't be placed in a Row or Column, so it's left out.`);
      return null;
    }
    if (kindOf(type)) return child;
  }
  if (typeof type === "string") {
    const inside = (child.props as { children?: React.ReactNode }).children;
    const element = inside !== undefined && hasComponent(inside) ? React.cloneElement(child, undefined, guard(inside, options, owner, inContainer)) : child;
    // Markup React rejects (`<hr style="…">` with a string style): left out, where failed parts are.
    return options.omit ? boundary(null, element) : element;
  }
  if (type === React.Fragment) return guard((child.props as { children?: React.ReactNode }).children, options, owner, inContainer);
  // A context's provider, or <StrictMode>, around the rows: kept, as a Fragment's are, with its children in boundaries
  // (`onError: "omit"` left out every row in it where one of them failed: a blank email). In a Row or Column it's one,
  // whose HTML around what it renders is kept (src/model/elements.ts's keptMarkup).
  if (!inContainer && wraps(child)) {
    const inside = (child.props as { children?: React.ReactNode }).children;
    const wrapped = React.cloneElement(child, undefined, ...guard(inside, options, owner, inContainer));
    // (Its children given again as arguments, as written: the list cloneElement makes of them isn't one React's
    // development build freezes, as createElement's is, so it's said to be checked; React 19 said it lacked keys.)
    const list = (wrapped.props as { children?: unknown }).children;
    if (Array.isArray(list)) checked(list);
    return wrapped;
  }
  // (Among the rows, what it renders among them is made parts of their own, where failed parts are left out: see
  // the engine's CollectOptions `parts`.)
  const record: Recorded = inContainer ? { kind: "boundary", element: child } : { kind: "boundary", element: child, rows: true };
  return boundary(record, child);
}

/**
 * What a component of the user's among the rows (a provider or a layout written as a component) rendered, where failed
 * parts are left out (see the engine's CollectOptions `parts`): each section it was given (`given`, its children and
 * the elements its other props hold, a layout's `header={<Hero />}`) that it renders among the rows a part of its own, so one that fails is left out alone, not with the rows around it.
 * A section is told by its component, the one given (cloned too, `React.Children.map`'s); what the component renders
 * of its own is one part with it (a Section's heading, with the list that failed in it). A component of the user's
 * that the given sections are rendered in (a provider in a provider component) is a part that gives them on
 * (`inherited`). Fragments, a context's provider and <StrictMode> are read through, as among the content's rows.
 */
export function rowParts(rendered: React.ReactNode, given: React.ReactNode, inherited?: unknown): React.ReactNode {
  const types = new Set<unknown>(inherited instanceof Set ? inherited : []);
  sectionTypes(given, types);
  if (!types.size) return rendered;
  const walk = (node: React.ReactNode): React.ReactNode => {
    // (A list made again of one the template wrote: checked as it was, see keys.ts.)
    if (Array.isArray(node)) return checked(node.map(walk));
    if (!React.isValidElement(node)) return node;
    const props = node.props as { children?: React.ReactNode };
    if (node.type === React.Fragment || wraps(node)) return React.cloneElement(node, { children: walk(props.children) } as object);
    if (types.has(node.type)) return boundary({ kind: "boundary", element: node, rows: true } satisfies Recorded, node);
    if (userType(node.type) && holds(Object.values(props), types)) return boundary({ kind: "boundary", element: node, rows: true, given: types } satisfies Recorded, node);
    return node;
  };
  return walk(rendered);
}

/** The components of the user's among `children`, through lists and Fragments: the sections a component is given. */
function sectionTypes(children: React.ReactNode, into: Set<unknown>, depth = 0): void {
  if (depth > 32) return;
  for (const child of Array.isArray(children) ? children : [children]) {
    if (Array.isArray(child)) sectionTypes(child, into, depth + 1);
    else if (React.isValidElement(child)) {
      if (child.type === React.Fragment) sectionTypes((child.props as { children?: React.ReactNode }).children, into, depth + 1);
      else if (userType(child.type)) into.add(child.type);
    }
  }
}

/** Whether a section of `types` is among `children`, through lists, Fragments, providers and components' props. */
function holds(children: React.ReactNode, types: ReadonlySet<unknown>, depth = 0): boolean {
  if (depth > 32) return false;
  for (const child of Array.isArray(children) ? children : [children]) {
    if (Array.isArray(child) ? holds(child, types, depth + 1) : React.isValidElement(child) && (types.has(child.type) || holds(Object.values(child.props as object), types, depth + 1))) return true;
  }
  return false;
}

const MEMO = Symbol.for("react.memo");
const FORWARD_REF = Symbol.for("react.forward_ref");
/** A component of the user's (a function or a class, memo'd or forwardRef'd): not markup, React's, or Elements' own. */
function userType(type: unknown): boolean {
  const of = typeof type === "object" && type ? (type as { $$typeof?: symbol }).$$typeof : undefined;
  return (typeof type === "function" || of === MEMO || of === FORWARD_REF) && !isElementsType(type);
}

const PROVIDER = Symbol.for("react.provider");
const CONTEXT = Symbol.for("react.context");
/**
 * Whether `element` only passes its children on: a context's provider (React 18's `<Ctx.Provider>`, React 19's
 * `<Ctx value>`, not a Consumer, whose child is a function) or <StrictMode>.
 */
function wraps(element: React.ReactElement): boolean {
  const type = element.type as { $$typeof?: symbol } | symbol;
  if (type === React.StrictMode) return true;
  const of = typeof type === "object" && type ? type.$$typeof : undefined;
  return of === PROVIDER || (of === CONTEXT && typeof (element.props as { children?: unknown }).children !== "function");
}

/** Whether there's a component of the user's own in `children`, in markup or Fragments (not Elements' own). */
function hasComponent(children: React.ReactNode): boolean {
  return childList(children, "").some(
    (child) =>
      React.isValidElement(child) &&
      (typeof child.type === "string" || child.type === React.Fragment ? hasComponent((child.props as { children?: React.ReactNode }).children) : !isElementsType(child.type))
  );
}

/**
 * Which of Elements' components a type is, of any copy of Elements: a Row or Column (0.2 and later carry RECORDS; an
 * older copy's reads the config Body passes it, `_config`, which a component of the user's own named after one
 * doesn't), or a block (its item config).
 */
function kindOf(type: any): "row" | "column" | "block" | undefined {
  if (type[UNLAYER_CONFIG_KEY] && type[UNLAYER_RENDER_KEY]) return "block";
  const name = displayName(type);
  if ((name === "Row" || name === "Column") && (type[RECORDS] || /\b_config\b/.test(String(type)))) return name === "Row" ? "row" : "column";
  return undefined;
}

/** Rich text: a Paragraph's, Heading's or Button's children with elements in them, rendered inside its record. */
const RICH = /^(Paragraph|Heading|Button)$/;

/** A record, with where it is in the template (`Row 3 › Column 1 › Button`), worked out when an error names it. */
const placed = <T extends object>(record: T, where: () => string): T & { where: () => string } => Object.assign(record, { where });

/** The collector a template's collecting walk asks (see the engine's Collector). */
export function collector(options: Options): Collector {
  return (element) => {
    const type = element.type as any;
    if (!type || typeof type === "string") return undefined;
    const props = element.props as Record<string, any>;
    if (typeof type[TAILWIND] === "function") {
      // A scope: its rewrite in its props, so each Row, Column and block knows the one it's in.
      // (With its copy's compiler, which the async renderers compile its config with.)
      return { record: (position) => container(placed({ kind: "tailwind", props: { ...props, [TAILWIND]: type[TAILWIND] }, load: type[TAILWIND_LOADER] }, position), options, "Tailwind") };
    }
    if (typeof type[HEAD_ENTRY] === "function") {
      const name = displayName(type);
      return {
        name,
        record: (position) => {
          const record = placed({ ...type[HEAD_ENTRY](props) }, position);
          // A <Head>'s tags: what's in it, walked here as the template's content is (its components wait, fail and are
          // left out as theirs do), as HTML.
          record.tags ??= () => [htmlOf(record.content)];
          return recordNode(record, guard(record.children, options, name), true);
        },
      };
    }
    const kind = kindOf(type);
    if (kind === "row" || kind === "column") {
      const name = kind === "row" ? "Row" : "Column";
      return { name, record: (position) => container(placed({ kind, props }, position), options, name) };
    }
    if (kind === "block") {
      const name = type[UNLAYER_CONFIG_KEY]?.name ?? displayName(type);
      return {
        name,
        record: (position) => {
          const record: Recorded = placed({ kind: "block", type, props }, position);
          // Text with elements in it (markup, a component of yours, react-intl's <FormattedMessage>): rendered here, with
          // the template's context, inside its record; their HTML is its text (see src/model).
          if (!RICH.test(name) || !childList(props.children, name).some(React.isValidElement)) return recordNode(record);
          return recordNode(Object.assign(record, { rich: true }), guard(props.children, options, name));
        },
      };
    }
    // A root in a template with no root (unwrapping stopped before it): rendered as it renders, said.
    const root = options.nested && !type[UNLAYER_RENDER_KEY] && rootName(type);
    if (root) options.nested!(root);
    return undefined;
  };
}

/** A Row, Column or scope: its props recorded, its children (in boundaries) inside it. */
function container(record: Recorded & { props: Record<string, any> }, options: Options, name: string): React.ReactNode {
  return recordNode(record, guard(record.props.children, options, name, true));
}
