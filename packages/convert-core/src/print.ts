/**
 * Print an Elements tree as a TSX module, formatted with Prettier so the
 * same tree always gives the same file.
 */

import * as prettier from "prettier";
import { isExpr, type ElementNode, type Expr } from "./tree";

export interface PrintOptions {
  /** Name of the default-exported component. */
  componentName?: string;
  /** Comment lines for the top of the file. */
  header?: string[];
}

const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

/**
 * The JSX for a tree, and the Elements components it uses. `rename` prints a
 * component under another name (to avoid clashing with an existing import).
 */
export function printJsx(tree: ElementNode, rename: Record<string, string> = {}): { jsx: string; used: Set<string> } {
  const used = new Set<string>();
  return { jsx: printNode(tree, used, rename), used };
}

export async function treeToTsx(tree: ElementNode, options: PrintOptions = {}): Promise<string> {
  const { jsx: body, used } = printJsx(tree);
  const imports = [...used].sort();
  const header = (options.header ?? []).map((line) => (line ? `// ${line}` : "//"));
  const source = [
    // Lets tools without JSX config (plain `tsx`, esbuild) run the file.
    "/** @jsxRuntime automatic */",
    ...header,
    `import { ${imports.join(", ")} } from "@unlayer/react-elements";`,
    "",
    `export default function ${options.componentName ?? "Template"}() {`,
    `  return (${body});`,
    "}",
    "",
  ].join("\n");
  return formatTsx(source);
}

export function formatTsx(source: string): Promise<string> {
  return prettier.format(source, { parser: "typescript", printWidth: 100 });
}

function printNode(node: ElementNode | string | Expr, used: Set<string>, rename: Record<string, string> = {}): string {
  if (typeof node === "string") return printText(node);
  if (isExpr(node)) return `{${node.$expr}}`;
  if (node.type === "#expr") {
    const code = (node.code ?? "").replace(/§(\d+)/g, (_, i: string) => {
      const slot = node.slots?.[Number(i)] ?? [];
      const single = slot.length === 1 && typeof slot[0] !== "string" && !(slot[0] as ElementNode).fallback;
      if (single) return printNode(slot[0], used, rename);
      // Several nodes: a keyed array, not a fragment — renderToJson walks
      // arrays but not fragments, so rows inside a fragment would be lost.
      const items = slot
        .filter((child): child is ElementNode => typeof child !== "string")
        .map((child, n) =>
          child.type === "#expr"
            ? printNode(child, used, rename).slice(1, -1) // bare code inside the array
            : printNode({ ...child, props: { key: n, ...child.props }, fallback: undefined }, used, rename)
        );
      return `[${items.join(",\n")}]`;
    });
    return `{${code}}`;
  }
  used.add(node.type);
  const attrs = Object.entries(node.props ?? {}).filter(([, value]) => value !== undefined).map(([name, value]) => {
    if (name === "layout" && typeof value === "string") {
      used.add("ColumnLayouts");
      return `layout={ColumnLayouts.${value}}`;
    }
    return printAttribute(name, value);
  });
  const tag = rename[node.type] ?? node.type;
  const open = `<${tag}${attrs.map((a) => ` ${a}`).join("")}`;
  const todo = node.fallback ? `{/* TODO(convert): ${node.fallback.replace(/\*\//g, "* /")} */}\n` : "";
  const children = node.children ?? [];
  if (children.length === 0) return `${todo}${open} />`;
  // Text mixed with code stays on one line, so spaces between them survive.
  if (children.length > 1 && children.every((child) => typeof child === "string" || isExpr(child))) {
    const inline = children
      .map((child) => (isExpr(child) ? `{${child.$expr}}` : /[<>{}&\n]/.test(child) ? `{${JSON.stringify(child)}}` : child))
      .join("");
    return `${todo}${open}>${inline}</${tag}>`;
  }
  return `${todo}${open}>${children.map((child) => printNode(child, used, rename)).join("\n")}</${tag}>`;
}

/** Text children print raw when JSX keeps them exactly, else as an expression. */
function printText(text: string): string {
  const plain = /^[^\s<>{}&]([^<>{}&\n\r\t]*[^\s<>{}&])?$/.test(text) && !text.includes("  ");
  return plain ? text : `{${printLiteral(text)}}`;
}

function printAttribute(name: string, value: unknown): string {
  if (isExpr(value)) return `${name}={${value.$expr}}`;
  // JSX attribute strings decode HTML entities, so `&` needs an expression.
  if (typeof value === "string" && !/["&\n\r\\]/.test(value)) return `${name}="${value}"`;
  return `${name}={${printLiteral(value)}}`;
}

function printLiteral(value: unknown): string {
  if (isExpr(value)) return value.$expr;
  if (typeof value === "string") {
    if (!/["\n]/.test(value)) return JSON.stringify(value);
    // HTML reads best as a template literal.
    return `\`${value.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${")}\``;
  }
  if (Array.isArray(value)) return `[${value.map(printLiteral).join(", ")}]`;
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value).map(
      ([key, item]) => `${IDENTIFIER.test(key) ? key : JSON.stringify(key)}: ${printLiteral(item)}`
    );
    return `{ ${entries.join(", ")} }`;
  }
  return JSON.stringify(value) ?? "undefined";
}
