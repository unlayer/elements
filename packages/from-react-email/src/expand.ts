/**
 * Expand a rendered React Email template into a tree of React Email's own
 * components (Container, Section, Text, …) and plain HTML elements.
 *
 * User components are called like React would; `<Tailwind>` is run so its
 * classes arrive as inline styles, exactly as React Email inlines them.
 */

import React from "react";

/** React Email components the converter maps (by displayName). */
export const REACT_EMAIL_COMPONENTS = new Set([
  "Html",
  "Head",
  "Body",
  "Container",
  "Section",
  "Row",
  "Column",
  "Text",
  "Heading",
  "Button",
  "Img",
  "Hr",
  "Link",
  "Preview",
  "Font",
  "Markdown",
  "CodeBlock",
  "CodeInline",
]);

export type Node =
  | { kind: "component"; name: string; props: Record<string, any>; children: Node[]; element: React.ReactElement }
  | { kind: "host"; tag: string; props: Record<string, any>; children: Node[]; element: React.ReactElement }
  | { kind: "text"; text: string };

const FORWARD_REF = Symbol.for("react.forward_ref");
const MEMO = Symbol.for("react.memo");
const PROVIDER = Symbol.for("react.provider");
const CONTEXT = Symbol.for("react.context");

export async function expand(node: React.ReactNode, depth = 0): Promise<Node[]> {
  if (depth > 200) throw new Error("Template nests too deeply to convert");
  if (node === null || node === undefined || typeof node === "boolean") return [];
  if (typeof node === "string" || typeof node === "number") return [{ kind: "text", text: String(node) }];
  if (Array.isArray(node)) return (await Promise.all(node.map((child) => expand(child, depth + 1)))).flat();
  if (!React.isValidElement(node)) return [];

  const element = node as React.ReactElement<any>;
  const type: any = element.type;
  const props: Record<string, any> = element.props ?? {};

  if (type === React.Fragment) return expand(props.children, depth + 1);
  if (typeof type === "string") {
    return [{ kind: "host", tag: type, props, children: await expand(props.children, depth + 1), element }];
  }

  const name = displayName(type);
  if (name === "Tailwind") return expand(await runTailwind(type, props), depth + 1);
  if (name && REACT_EMAIL_COMPONENTS.has(name) && type?.$$typeof === FORWARD_REF) {
    return [{ kind: "component", name, props, children: await expand(props.children, depth + 1), element }];
  }

  // Anything else renders like React would render it.
  if (type?.$$typeof === MEMO) return expand(React.createElement(type.type, props), depth + 1);
  if (type?.$$typeof === FORWARD_REF) return expand(type.render(props, null), depth + 1);
  if (type?.$$typeof === PROVIDER || type?.$$typeof === CONTEXT) return expand(props.children, depth + 1);
  if (typeof type === "function") {
    if (type.prototype?.isReactComponent) return expand(new type(props).render(), depth + 1);
    return expand(await callSuspending(() => type(props)), depth + 1);
  }
  return expand(props.children, depth + 1);
}

function displayName(type: any): string | undefined {
  return type?.displayName ?? type?.name ?? type?.render?.displayName;
}

/**
 * `<Tailwind>` compiles its classes asynchronously and suspends (throws a
 * promise) until it's done, then returns the children with styles inlined.
 *
 * It also renders every component it meets down to HTML, which would lose
 * which tables are Sections, Rows and Columns. So React Email components go
 * in as placeholder elements carrying the same props (Tailwind inlines styles
 * onto them without rendering them) and come back as themselves afterwards.
 */
async function runTailwind(type: (props: any) => React.ReactNode, props: any): Promise<React.ReactNode> {
  const types = new Map<string, any>();
  const marked = await toPlaceholders(props.children, types);
  const styled = await callSuspending(() => type({ ...props, children: marked }));
  return fromPlaceholders(styled, types);
}

const PLACEHOLDER = "x-react-email-";

async function toPlaceholders(node: React.ReactNode, types: Map<string, any>): Promise<React.ReactNode> {
  if (Array.isArray(node)) return Promise.all(node.map((child) => toPlaceholders(child, types)));
  if (!React.isValidElement(node)) return node;
  const element = node as React.ReactElement<any>;
  const type: any = element.type;
  const props = element.props ?? {};
  const kids = props.children === undefined ? undefined : await toPlaceholders(props.children, types);
  if (type === React.Fragment || typeof type === "string") {
    return React.cloneElement(element, undefined, ...(kids === undefined ? [] : [kids]));
  }
  const name = displayName(type);
  if (name && REACT_EMAIL_COMPONENTS.has(name) && type?.$$typeof === FORWARD_REF) {
    types.set(name, type);
    // A real <head>, so Tailwind can put rules it can't inline there.
    const tag = name === "Head" ? "head" : `${PLACEHOLDER}${name}`;
    return React.createElement(tag, { ...props, key: element.key, children: kids });
  }
  // User components render now, so Tailwind sees their output.
  if (type?.$$typeof === MEMO) return toPlaceholders(React.createElement(type.type, props), types);
  if (type?.$$typeof === FORWARD_REF) return toPlaceholders(type.render(props, null), types);
  if (typeof type === "function" && !type.prototype?.isReactComponent) {
    return toPlaceholders(await callSuspending(() => type(props)), types);
  }
  return node;
}

function fromPlaceholders(node: React.ReactNode, types: Map<string, any>): React.ReactNode {
  if (Array.isArray(node)) return node.map((child) => fromPlaceholders(child, types));
  if (!React.isValidElement(node)) return node;
  const element = node as React.ReactElement<any>;
  const { children, ...props } = element.props ?? {};
  const kids = children === undefined ? [] : [fromPlaceholders(children, types)];
  if (typeof element.type === "string" && element.type.startsWith(PLACEHOLDER)) {
    const type = types.get(element.type.slice(PLACEHOLDER.length));
    return React.createElement(type, { ...props, key: element.key }, ...kids);
  }
  return React.cloneElement(element, undefined, ...kids);
}

/** Call `fn`, waiting out any promise it throws (React suspense). */
export async function callSuspending<T>(fn: () => T): Promise<T> {
  for (let attempt = 0; attempt < 20; attempt++) {
    try {
      return fn();
    } catch (thrown) {
      if (thrown && typeof (thrown as Promise<unknown>).then === "function") {
        await thrown;
        continue;
      }
      throw thrown;
    }
  }
  throw new Error("Component kept suspending");
}

/**
 * The `config` passed to a template's <Tailwind>, found by running the
 * template until it gets there. For the codemod when the config isn't a
 * plain literal (plugins, imported presets).
 */
export async function findTailwindConfig(node: React.ReactNode, depth = 0): Promise<Record<string, unknown> | undefined> {
  if (depth > 200 || node === null || typeof node !== "object") return undefined;
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = await findTailwindConfig(child, depth + 1);
      if (found) return found;
    }
    return undefined;
  }
  if (!React.isValidElement(node)) return undefined;
  const element = node as React.ReactElement<any>;
  const type: any = element.type;
  const props = element.props ?? {};
  if (displayName(type) === "Tailwind") return props.config ?? {};
  if (typeof type === "string" || type === React.Fragment) return findTailwindConfig(props.children, depth + 1);
  if (displayName(type) && REACT_EMAIL_COMPONENTS.has(displayName(type) as string)) return findTailwindConfig(props.children, depth + 1);
  if (type?.$$typeof === MEMO) return findTailwindConfig(React.createElement(type.type, props), depth + 1);
  if (type?.$$typeof === FORWARD_REF) return findTailwindConfig(type.render(props, null), depth + 1);
  if (typeof type === "function" && !type.prototype?.isReactComponent) {
    return findTailwindConfig(await callSuspending(() => type(props)), depth + 1);
  }
  return findTailwindConfig(props.children, depth + 1);
}
