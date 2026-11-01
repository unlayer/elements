/**
 * Component definitions: one per component, the source of its props, styles,
 * children, targets and editors. Types, validation, the JSON Schema and
 * property discovery are all read from these.
 */
import type { EditorKind, InputOf, Kind, OutputOf } from "./kinds";
import type { Json, Node } from "./model";

/** What a component is, for the nesting rules: a component belongs to one or more. */
export type Category = "root" | "section" | "layout" | "block" | "inline";

/** The outputs Elements renders. */
export type Target = "email" | "web" | "print" | "pdf" | "image";

export const TARGETS: readonly Target[] = ["email", "web", "print", "pdf", "image"];

export interface PropSpec<K extends Kind<any, any> = Kind<any, any>, R extends boolean = boolean> {
  kind: K;
  required?: R;
  label: string;
  description?: string;
  /** Used where the prop isn't given (not written into the document). */
  default?: OutputOf<K>;
  /** Editors may change it (default true). */
  editable?: boolean;
}

export interface StyleSpec<K extends Kind<any, any> = Kind<any, any>> {
  kind: K;
  label: string;
  description?: string;
  /** Passed down to children that don't set it (text styles). */
  inherited?: boolean;
  /** May be overridden on phones (`mobile`). */
  mobile?: boolean;
  editable?: boolean;
}

export type PropSpecs = Record<string, PropSpec>;
export type StyleSpecs = Record<string, StyleSpec>;

export interface ChildrenRule {
  /** Text (strings) may be children. */
  text?: boolean;
  /** Components of these categories may be children. */
  categories?: readonly Category[];
  /** These types may be children, whatever their category. */
  types?: readonly string[];
}

export interface TargetSupport {
  /** What's different in this target, for docs and diagnostics. */
  note?: string;
}

/** A change to a node: what a composite editor writes. */
export interface NodePatch {
  props?: Record<string, Json | undefined>;
  style?: Record<string, Json | undefined>;
  hover?: Record<string, Json | undefined>;
}

/** An editor that reads and writes several props at once (a button's colors). */
export interface CompositeEditor<V = any> {
  /** The conceptual editor ("buttonColors"); editors map it to a widget. */
  editor: string;
  /** The paths it reads and writes ("style.color", "hover.backgroundColor"). */
  covers: readonly string[];
  read(node: Pick<Node, "props" | "style" | "hover">): V;
  write(value: V): NodePatch;
}

export type EditorGroup =
  | { title: string; paths: readonly string[] }
  | { title: string; composite: CompositeEditor };

export interface ComponentDefinition<P extends PropSpecs = PropSpecs, S extends StyleSpecs = StyleSpecs> {
  type: string;
  label: string;
  description: string;
  categories: readonly Category[];
  props: P;
  style: S;
  /** The component's own style, under what the author sets and over what's inherited (as a browser's defaults are). */
  defaultStyle?: { [K in keyof S]?: OutputOf<S[K]["kind"]> };
  /** Default style that depends on a prop's value (a Heading's size on its level), over `defaultStyle`. */
  defaultStyleBy?: { prop: keyof P & string; values: Record<string, { [K in keyof S]?: OutputOf<S[K]["kind"]> }> };
  /** Style keys that may be set for `hover`. */
  hover?: readonly (keyof S & string)[];
  children: ChildrenRule;
  /**
   * How wide it is where nothing sets its width: `stretch` fills its parent's
   * content width; `shrink` takes its own size (an image's, a button's
   * content).
   */
  sizing: "stretch" | "shrink" | "none";
  /** A root that has a phone width (Email, Page): `mobile` and `hidden` apply under it. */
  responsive?: boolean;
  /** Where it renders; a target left out is a diagnostic. */
  targets: Partial<Record<Target, TargetSupport>>;
  editor?: { groups: readonly EditorGroup[] };
}

/** Keeps the literal types of a definition's props and styles, for the derived TypeScript types. */
export function defineComponent<const P extends PropSpecs, const S extends StyleSpecs>(definition: ComponentDefinition<P, S>): ComponentDefinition<P, S> {
  return definition;
}

/** A prop of `kind`; the type keeps whether it's required and whether it has a default. */
export function prop<K extends Kind<any, any>, const R extends boolean = false, const D extends OutputOf<K> | undefined = undefined>(
  kind: K,
  options: Omit<PropSpec<K, R>, "kind" | "default"> & { default?: D }
): PropSpec<K, R> & { default: D } {
  return { kind, ...options } as PropSpec<K, R> & { default: D };
}

// ─── Types derived from definitions ─────────────────────────────────────────

type RequiredKeys<P extends PropSpecs> = { [K in keyof P]: Exclude<P[K]["required"], undefined> extends true ? K : never }[keyof P];
type OptionalKeys<P extends PropSpecs> = Exclude<keyof P, RequiredKeys<P>>;

/** The props a component takes, as authors write them. */
export type PropsInput<P extends PropSpecs> = { [K in RequiredKeys<P>]: InputOf<P[K]["kind"]> } & {
  [K in OptionalKeys<P>]?: InputOf<P[K]["kind"]>;
};

/** Its style, as authors write it. */
export type StyleInput<S extends StyleSpecs> = { [K in keyof S]?: InputOf<S[K]["kind"]> };

/** Its style once normalized (in a document). */
export type StyleOutput<S extends StyleSpecs> = { [K in keyof S]?: OutputOf<S[K]["kind"]> };

/** A node of this component as authors write it in JSON (before ids and normalization). */
export type NodeInput<D extends ComponentDefinition<any, any>> = D extends ComponentDefinition<infer P, infer S>
  ? {
      type: D["type"];
      id?: string;
      props?: PropsInput<P>;
      style?: StyleInput<S>;
      mobile?: StyleInput<S>;
      hover?: StyleInput<S>;
      hidden?: { mobile?: boolean; desktop?: boolean };
      children?: Array<{ type: string; [key: string]: unknown } | string>;
      compat?: Record<string, Json>;
    }
  : never;

export type { EditorKind };
