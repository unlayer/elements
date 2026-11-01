/**
 * Property discovery: what a component takes and how each thing is edited, as
 * plain data for editors, docs and agents.
 */
import { registryOf, type ComponentsOption } from "./registry";
import type { Category, ComponentDefinition, Target } from "./define";
import type { EditorKind, JsonSchema } from "./kinds";
import type { Json } from "./model";

export interface PropertyDescription {
  /** "props.href", "style.padding", "hover.color". */
  path: string;
  label: string;
  description?: string;
  kind: string;
  accepts: string;
  editor: EditorKind;
  editable: boolean;
  required: boolean;
  default?: Json;
  inherited: boolean;
  mobile: boolean;
  schema: JsonSchema;
}

export interface ComponentDescription {
  type: string;
  label: string;
  description: string;
  categories: readonly Category[];
  properties: PropertyDescription[];
  children: { text: boolean; categories: readonly Category[]; types: readonly string[] };
  targets: Target[];
  /** Editor groups: the paths each shows, or the composite editor and the paths it covers. */
  groups: Array<{ title: string; paths: readonly string[]; composite?: string }>;
}

export function describeComponent(type: string, options?: ComponentsOption): ComponentDescription | undefined {
  const definition = registryOf(options).get(type);
  return definition && describe(definition);
}

/** Every built-in component, and the custom ones given. */
export function describeComponents(options?: ComponentsOption): ComponentDescription[] {
  return registryOf(options).all().map(describe);
}

function describe(definition: ComponentDefinition): ComponentDescription {
  const properties: PropertyDescription[] = [];
  for (const [key, spec] of Object.entries(definition.props)) {
    properties.push({
      path: `props.${key}`,
      label: spec.label,
      ...(spec.description ? { description: spec.description } : {}),
      kind: spec.kind.name,
      accepts: spec.kind.accepts,
      editor: spec.kind.editor,
      editable: spec.editable !== false,
      required: !!spec.required,
      ...(spec.default !== undefined ? { default: spec.default } : {}),
      inherited: false,
      mobile: false,
      schema: spec.kind.jsonSchema(),
    });
  }
  const defaults = (definition.defaultStyle ?? {}) as Record<string, Json>;
  const hover = new Set<string>(definition.hover ?? []);
  for (const [key, spec] of Object.entries(definition.style)) {
    const base = {
      label: spec.label,
      ...(spec.description ? { description: spec.description } : {}),
      kind: spec.kind.name,
      accepts: spec.kind.accepts,
      editor: spec.kind.editor,
      editable: spec.editable !== false,
      required: false,
      inherited: !!spec.inherited,
      mobile: !!spec.mobile,
      schema: spec.kind.jsonSchema(),
    };
    properties.push({ path: `style.${key}`, ...base, ...(defaults[key] !== undefined ? { default: defaults[key] } : {}) });
    if (hover.has(key)) properties.push({ path: `hover.${key}`, ...base, label: `${spec.label} on hover`, mobile: false });
  }
  return {
    type: definition.type,
    label: definition.label,
    description: definition.description,
    categories: definition.categories,
    properties,
    children: { text: !!definition.children.text, categories: definition.children.categories ?? [], types: definition.children.types ?? [] },
    targets: Object.keys(definition.targets) as Target[],
    groups: (definition.editor?.groups ?? []).map((group) =>
      "composite" in group ? { title: group.title, paths: group.composite.covers, composite: group.composite.editor } : { title: group.title, paths: group.paths }
    ),
  };
}
