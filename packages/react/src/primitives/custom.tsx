/**
 * Custom components: a named block made of primitives, with its own typed
 * props and editors, kept as one node in the document and expanded when it's
 * rendered (see docs/rfcs/0001-primitives-and-exporters.md, Custom components).
 */
import type React from "react";
import {
  asset,
  boolean,
  color,
  defineCustomComponent,
  enumOf,
  fontFamily,
  fontWeight,
  formatDiagnostics,
  length,
  link,
  number,
  prop as defineProp,
  text,
  type CustomDefinition,
  type ExpandProps,
  type Kind,
  type LengthUnit,
  type OutputOf,
  type PropSpec,
  type PropSpecs,
  type PropsInput,
} from "@unlayer-internal/elements-core";
import { collectingPrimitives, collectNodes, recordPrimitive, registerUsed } from "./collect";

type PropOptions<K extends Kind<any, any>, R extends boolean, D> = Omit<PropSpec<K, R>, "kind" | "default"> & { default?: D };

/** A prop helper for one value kind: `required` and `default` keep their literal types, for `render`'s props. */
function kindProp<K extends Kind<any, any>>(make: () => K) {
  return <const R extends boolean = false, const D extends OutputOf<K> | undefined = undefined>(options: PropOptions<K, R, D>) => defineProp(make(), options);
}

/** Props of a custom component, by value kind. */
export const prop = {
  text: kindProp(() => text()),
  color: kindProp(() => color()),
  image: kindProp(() => asset()),
  link: kindProp(() => link()),
  boolean: kindProp(() => boolean()),
  fontFamily: kindProp(() => fontFamily()),
  fontWeight: kindProp(() => fontWeight()),
  number: <const R extends boolean = false, const D extends number | undefined = undefined>(
    options: PropOptions<Kind<number, number>, R, D> & { min?: number; max?: number; integer?: boolean }
  ) => {
    const { min, max, integer, ...rest } = options;
    return defineProp(number({ min, max, integer }), rest);
  },
  length: <const U extends LengthUnit = "px", const R extends boolean = false, const D extends OutputOf<ReturnType<typeof length<U>>> | undefined = undefined>(
    options: PropOptions<ReturnType<typeof length<U>>, R, D> & { units?: readonly U[]; min?: number }
  ) => {
    const { units, min, ...rest } = options;
    return defineProp<ReturnType<typeof length<U>>, R, D>(length<U>(units, { min }), rest);
  },
  choice: <const V extends readonly (string | number)[], const R extends boolean = false, const D extends V[number] | undefined = undefined>(
    values: V,
    options: PropOptions<Kind<V[number], V[number]>, R, D>
  ) => defineProp(enumOf(values), options),
};

/** What a custom component takes in JSX: its props, and its place in a Row and its visibility. */
export type CustomProps<P extends PropSpecs> = PropsInput<P> & {
  id?: string;
  style?: { flex?: number | "none" };
  hidden?: { mobile?: boolean; desktop?: boolean };
};

export type CustomComponent<P extends PropSpecs> = React.FC<CustomProps<P>> & { definition: CustomDefinition<P> };

export interface ComponentSpec<P extends PropSpecs> {
  /** A namespace, a dot, a capitalized name: "acme.ProductCard". */
  type: string;
  label: string;
  description?: string;
  props: P;
  /** Where it goes: where a block goes (default), or where a Section goes (and it renders a Section). */
  placement?: "block" | "section";
  /**
   * The component as primitives, from its props (normalized, defaults applied). Pure: no hooks or data,
   * so it can be rendered anywhere. Returns one component.
   */
  render(props: ExpandProps<P>): React.ReactElement;
}

export function component<const P extends PropSpecs>(spec: ComponentSpec<P>): CustomComponent<P> {
  const definition = defineCustomComponent({
    type: spec.type,
    label: spec.label,
    description: spec.description,
    props: spec.props,
    placement: spec.placement,
    expand(props, context) {
      const { nodes, components, diagnostics } = collectNodes(spec.render(props));
      for (const used of components) context.register(used);
      if (diagnostics.length) throw new Error(formatDiagnostics(diagnostics));
      return nodes.length === 1 ? nodes[0] : nodes;
    },
  });
  const Custom = (props: CustomProps<P>): React.ReactElement => {
    const collection = collectingPrimitives();
    if (!collection) {
      throw new Error(`[Elements] <${spec.type}> is part of a template: render the template with render(), not this component on its own`);
    }
    registerUsed(collection, definition);
    return recordPrimitive(collection, spec.type, props as Record<string, unknown>);
  };
  Custom.displayName = spec.type;
  return Object.assign(Custom, { definition });
}
