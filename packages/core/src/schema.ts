/**
 * The JSON Schema of an Elements document, from the component definitions:
 * for editors that complete documents, and for agents that write them. It
 * checks shape and nesting; `checkDocument` remains the full check (unique
 * ids, the rules that need more than a schema).
 */
import type { ComponentDefinition, StyleSpecs } from "./define";
import type { JsonSchema } from "./kinds";
import { DOCUMENT_VERSION } from "./model";
import { registryOf, type ComponentsOption } from "./registry";

const ID_PATTERN = "^[A-Za-z][A-Za-z0-9_-]*$";

/** The schema of documents that may use the built-in components and the custom ones given. */
export function documentJsonSchema(options?: ComponentsOption): JsonSchema {
  const definitions = registryOf(options).all();
  const $defs: Record<string, JsonSchema> = {};
  for (const definition of definitions) $defs[definition.type] = nodeSchema(definition, definitions);
  $defs.root = { anyOf: definitions.filter((d) => d.categories.includes("root")).map((d) => ({ $ref: `#/$defs/${d.type}` })) };
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    title: "Elements document",
    type: "object",
    required: ["version", "root"],
    properties: { version: { const: DOCUMENT_VERSION }, root: { $ref: "#/$defs/root" } },
    additionalProperties: false,
    $defs,
  };
}

function stylesSchema(specs: StyleSpecs, keep: (key: string) => boolean = () => true): JsonSchema {
  return {
    type: "object",
    properties: Object.fromEntries(
      Object.entries(specs)
        .filter(([key]) => keep(key))
        .map(([key, spec]) => [key, { ...spec.kind.jsonSchema(), description: spec.label }])
    ),
    additionalProperties: false,
  };
}

function nodeSchema(definition: ComponentDefinition, all: ComponentDefinition[]): JsonSchema {
  const required = Object.entries(definition.props)
    .filter(([, spec]) => spec.required)
    .map(([key]) => key);
  const rule = definition.children;
  const childTypes = all.filter((d) => rule.types?.includes(d.type) || d.categories.some((c) => rule.categories?.includes(c)));
  const childSchemas: JsonSchema[] = [...(rule.text ? [{ type: "string" }] : []), ...childTypes.map((d) => ({ $ref: `#/$defs/${d.type}` }))];
  const hover = new Set<string>(definition.hover ?? []);
  return {
    type: "object",
    description: definition.description,
    required: ["type", ...(required.length ? ["props"] : [])],
    properties: {
      type: { const: definition.type },
      id: { type: "string", pattern: ID_PATTERN },
      props: {
        type: "object",
        properties: Object.fromEntries(Object.entries(definition.props).map(([key, spec]) => [key, { ...spec.kind.jsonSchema(), description: spec.label }])),
        ...(required.length ? { required } : {}),
        additionalProperties: false,
      },
      style: stylesSchema(definition.style),
      ...(hover.size ? { hover: stylesSchema(definition.style, (key) => hover.has(key)) } : {}),
      mobile: stylesSchema(definition.style, (key) => !!definition.style[key].mobile),
      hidden: { type: "object", properties: { mobile: { type: "boolean" }, desktop: { type: "boolean" } }, additionalProperties: false },
      children: childSchemas.length ? { type: "array", items: { anyOf: childSchemas } } : { type: "array", maxItems: 0 },
      compat: { type: "object" },
    },
    additionalProperties: false,
  };
}
