/**
 * How a template is collected (see src/model): the walker (src/engine) renders it, and asks this collector about
 * each element first. Elements' Rows, Columns and blocks (of any copy of Elements: by their markers, or an older
 * copy's names and code), <Tailwind> scopes and <Head>/<Font> entries are recorded instead of being called, what's
 * inside them walked inside their records; everything else (the user's components, markup, Fragments, Context)
 * renders as React renders it.
 * Each component of the template's own in a list is in a boundary, where it's left out when it fails and the render
 * leaves failed parts out (`onError: "omit"`).
 */
import React from "react";
import { HEAD_ENTRY, RECORDS, type Recorded } from "./collect";
import { isElementsType, ROOT_NAMES } from "./unwrap-root";
import { TAILWIND, TAILWIND_LOADER } from "./tailwind";
import { UNLAYER_CONFIG_KEY, UNLAYER_RENDER_KEY } from "./create-component";
import { boundary, recordNode } from "../engine/records";
import { checked, checkKeys } from "../engine/keys";
import type { Collector } from "../engine";

interface Options {
  /** Markup is in a boundary too, so markup React rejects is left out rather than failing the render. */
  omit: boolean;
}

/** Children as a list (arrays flattened, nothing and booleans left out), each list checked for keys. */
function childList(children: React.ReactNode, owner: string, out: React.ReactNode[] = []): React.ReactNode[] {
  if (Array.isArray(children)) {
    checkKeys(children, owner);
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
    if (ROOT_NAMES.has(displayName(type)) && !type[UNLAYER_RENDER_KEY]) {
      if (!inContainer) return child;
      console.warn(`[Unlayer] <${displayName(type)}> is a root: it can't be placed in a Row or Column, so it's left out.`);
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
  const record: Recorded = { kind: "boundary", element: child };
  return boundary(record, child);
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
    if (typeof type[HEAD_ENTRY] === "function") return { record: (position) => recordNode(placed({ ...type[HEAD_ENTRY](props) }, position), undefined, true) };
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
    return undefined;
  };
}

/** A Row, Column or scope: its props recorded, its children (in boundaries) inside it. */
function container(record: Recorded & { props: Record<string, any> }, options: Options, name: string): React.ReactNode {
  return recordNode(record, guard(record.props.children, options, name, true));
}
