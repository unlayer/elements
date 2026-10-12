/**
 * Runtime mode renders a template with sample props, so their values would
 * become fixed text. Text props the template shows as given become merge
 * tags instead (`{{user.name}}`), which the editor keeps and email services
 * fill in.
 *
 * The template is rendered once more with a marker in place of each text
 * prop. A prop becomes a merge tag only where its marker comes through
 * intact and, with the sample values put back, the conversion is the same:
 * a prop the template changes (`name.toUpperCase()`, a date it formats) or
 * tests keeps its sample value. It's rendered again with other values (a
 * lowercase first letter, more words, longer), which must show as given
 * too: a change a sample doesn't reveal (`name.split(" ")[0]` of "Alex",
 * `slice(0, 40)` of a short title) keeps the sample value as well.
 */

import ts from "typescript";
import { decodeHtmlEntities } from "@unlayer/convert-core";
import { parseFragment, type DefaultTreeAdapterMap } from "parse5";

const OPEN = "\uE000";
const CLOSE = "\uE001";
// Mixed case makes upper/lowercasing change the marker, even when the sample
// already has that case. Such a prop must keep its transformed sample value.
const MARKER = /\uE000uNlAyEr(\d+)\uE001/g;

/** A text prop: its path (`user.name`) and sample value. */
export interface TextProp {
  path: string;
  value: string;
}

/** The text props of `props`: string values, nested in plain objects (not in lists, which loops repeat). */
export function textProps(props: Record<string, unknown>, prefix = ""): TextProp[] {
  const out: TextProp[] = [];
  for (const [key, value] of Object.entries(props)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string" && value.trim()) out.push({ path, value });
    else if (isPlainObject(value)) out.push(...textProps(value, path));
  }
  return out;
}

/**
 * Another value for a text prop, that a change the template makes shows on: its first letter in
 * lowercase, more words, and longer than a title cut short.
 */
function otherValue(value: string): string {
  return `${value.charAt(0).toLowerCase()}${value.slice(1)} zQ mOrE wOrDs ${"x".repeat(48)}`;
}

/** `props` with the chosen text props replaced by markers, or by `value(i)`. */
const marker = (i: number) => `${OPEN}uNlAyEr${i}${CLOSE}`;

function withMarkers(props: Record<string, unknown>, probes: TextProp[], chosen: number[], value = marker): Record<string, unknown> {
  // Copies only the objects on each prop's path: props can hold functions and elements.
  const copy: Record<string, unknown> = { ...props };
  for (const i of chosen) {
    const keys = probes[i].path.split(".");
    let target = copy;
    for (const key of keys.slice(0, -1)) {
      target[key] = { ...(target[key] as Record<string, unknown>) };
      target = target[key] as Record<string, unknown>;
    }
    target[keys[keys.length - 1]] = value(i);
  }
  return copy;
}

/**
 * A converted template (an Elements tree, design JSON) with text props as
 * merge tags. `render` converts the template with the props given; `base`
 * is its output with the sample props. Props that fail together are tried
 * one by one. `used`: the props that became merge tags; `kept`: props the
 * output shows but that keep their sample value.
 */
export async function mergeTagged<T>(
  props: Record<string, unknown>,
  base: T,
  render: (props: Record<string, unknown>, measured: (text: string) => string) => T | Promise<T>,
  /** Props the template tests (compares, falls back on): they keep their sample value. */
  tested: ReadonlySet<string> = new Set(),
): Promise<{ result?: T; used: string[]; kept: string[] }> {
  // A prop written as HTML (`footerHtml`: its sample's markup is markup in the output) isn't
  // text: as a merge tag, its links would go. A prop shown as text (escaped) still is.
  const output = JSON.stringify(base);
  const asHtml = (p: TextProp) => /<[a-z!/]/i.test(p.value) && output.includes(JSON.stringify(p.value).slice(1, -1));
  // A sample that's already an email service's placeholder (`{{ first_name }}`, `*|FNAME|*`, `{% if %}`) stays as
  // written: as a merge tag named after the prop, the service would get another name.
  const placeholder = (p: TextProp) => /\{\{|\{%|\*\|[^|]*\|\*|<%|%%[^%\s]+%%|\[\[[^\]]+\]\]/.test(p.value);
  // A prop the template compares (`count === "1"`) or falls back on (`company || "Acme"`) shows another text for
  // other values than the ones tried here: as a merge tag, "1 items", an empty company. It keeps its sample value.
  const shown = (p: TextProp) => output.includes(JSON.stringify(p.value).slice(1, -1));
  const html = textProps(props).filter((p) => asHtml(p) || placeholder(p) || (tested.has(p.path) && shown(p))).map((p) => p.path);
  const probes = textProps(props).filter((p) => !asHtml(p) && !placeholder(p) && !tested.has(p.path));
  if (!probes.length) return { used: [], kept: html };
  // Text is measured as the samples (a column sized by its content, a phone size its words fit): each
  // value put in for a prop is read as the prop's sample value.
  const asSamples = (chosen: number[], value: (i: number) => string) => (text: string) =>
    chosen.reduce((out, i) => out.split(value(i)).join(probes[i].value), text);
  const attempt = async (chosen: number[]): Promise<T | undefined> => {
    let output: T;
    try {
      output = await render(withMarkers(props, probes, chosen), asSamples(chosen, marker));
    } catch {
      return undefined; // the template can't take a placeholder there
    }
    if (hasBrokenMarkers(output) || !sameOutput(replaceMarkers(output, probes, (p) => p.value), base)) return undefined;
    // Shown as given: with other values in, the output is the marked one with them in place.
    const others = probes.map((p) => otherValue(p.value));
    let other: T;
    try {
      other = await render(withMarkers(props, probes, chosen, (i) => others[i]), asSamples(chosen, (i) => others[i]));
    } catch {
      return undefined;
    }
    if (!sameOutput(replaceMarkers(output, probes.map((p, i) => ({ ...p, value: others[i] })), (p) => p.value), other)) return undefined;
    return output;
  };
  const all = probes.map((_, i) => i);
  let chosen = all;
  let marked = await attempt(all);
  if (!marked) {
    chosen = [];
    for (const i of all) if (await attempt([i])) chosen.push(i);
    marked = chosen.length ? await attempt(chosen) : undefined;
  }
  if (!marked) return { used: [], kept: [...html, ...probes.filter(shown).map((p) => p.path)] };
  const tag = (p: TextProp) => `{{${p.path}}}`;
  const result = replaceMarkers(marked, probes, tag);
  const text = JSON.stringify(result);
  return {
    result,
    // Tagged somewhere (image sources keep the sample value).
    used: [...markersIn(marked)]
      .sort((a, b) => a - b)
      .map((i) => probes[i])
      .filter((p) => text.includes(tag(p)))
      .map((p) => p.path),
    kept: [
      ...html,
      ...probes
        .filter((p) => !text.includes(tag(p)) && shown(p))
        .map((p) => p.path),
    ],
  };
}

/**
 * The props a template's code tests, by path (`count`, `user.name`, and each path above them): compared
 * (`===`, `<`, `in`), tested for truth (`a || b`, `a ?? b`, `a && b`, `!a`, a condition, `if`, `switch`),
 * directly or through a name given to them (`const n = Number(count)`, `const { name } = user`, a prop of a
 * component in the file: `<Footer company={company} />`). Names are resolved, so a helper's own `name` isn't a prop.
 * The component is the file's default export, or its first function (a component's own code).
 */
export function testedProps(source: string): Set<string> {
  const NAME = "template.tsx";
  const file = ts.createSourceFile(NAME, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const host = ts.createCompilerHost({});
  const program = ts.createProgram({
    rootNames: [NAME],
    options: { noLib: true, noResolve: true, types: [], jsx: ts.JsxEmit.Preserve },
    host: { ...host, getSourceFile: (name) => (name === NAME ? file : undefined), fileExists: (name) => name === NAME, readFile: () => undefined },
  });
  const checker = program.getTypeChecker();
  const component = mainFunction(file, checker);
  if (!component) return new Set();
  // Where a name was declared, as the prop paths it stands for.
  const seen = new Set<ts.Node>();
  const declared = (decl: ts.Node): string[] => {
    if (seen.has(decl)) return [];
    seen.add(decl);
    try {
      if (ts.isParameter(decl)) return parameterPaths(decl);
      if (ts.isBindingElement(decl)) {
        const key = decl.propertyName ? (ts.isIdentifier(decl.propertyName) || ts.isStringLiteral(decl.propertyName) ? decl.propertyName.text : undefined) : ts.isIdentifier(decl.name) ? decl.name.text : undefined;
        if (key === undefined) return [];
        const pattern = decl.parent.parent; // ObjectBindingPattern → its declaration (or an outer BindingElement)
        const above = ts.isParameter(pattern) ? parameterPaths(pattern) : ts.isBindingElement(pattern) ? declared(pattern) : ts.isVariableDeclaration(pattern) && pattern.initializer ? paths(pattern.initializer) : [];
        return above.map((path) => (path ? `${path}.${key}` : key));
      }
      if (ts.isVariableDeclaration(decl) && decl.initializer) return paths(decl.initializer);
      return [];
    } finally {
      seen.delete(decl);
    }
  };
  // A parameter's paths: the component's props, or a component's in this file, by what each place that renders it passes.
  const parameterPaths = (param: ts.ParameterDeclaration): string[] => {
    if (param === component.parameters[0]) return [""]; // props
    const fn = param.parent;
    if (!ts.isFunctionLike(fn) || fn.parameters[0] !== param) return [];
    const target = fn.name ?? (ts.isVariableDeclaration(fn.parent) ? fn.parent.name : undefined);
    const symbol = target && ts.isIdentifier(target) ? checker.getSymbolAtLocation(target) : undefined;
    if (!symbol) return [];
    // Each attribute passed is read as the prop of the same name: `<Footer company={company} />`.
    return [`\0${symbol.escapedName as string}`];
  };
  const attributeUses = new Map<string, Map<string, ts.Expression[]>>();
  const collectUses = (node: ts.Node): void => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = ts.isIdentifier(node.tagName) ? node.tagName.text : undefined;
      if (tag)
        for (const attr of node.attributes.properties)
          if (ts.isJsxAttribute(attr) && ts.isIdentifier(attr.name) && attr.initializer && ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
            const uses = attributeUses.get(tag) ?? new Map<string, ts.Expression[]>();
            attributeUses.set(tag, uses);
            uses.set(attr.name.text, [...(uses.get(attr.name.text) ?? []), attr.initializer.expression]);
          }
    }
    ts.forEachChild(node, collectUses);
  };
  collectUses(file);
  // The prop paths an expression reads: `props.user.name` and `user?.name` read `user.name`.
  const paths = (node: ts.Node, out: string[] = []): string[] => {
    if (ts.isIdentifier(node) || ts.isPropertyAccessExpression(node)) {
      const parts: string[] = [];
      let root: ts.Expression = node;
      while (ts.isPropertyAccessExpression(root)) {
        parts.unshift(root.name.text);
        root = root.expression;
      }
      if (ts.isIdentifier(root)) {
        const decl = checker.getSymbolAtLocation(root)?.valueDeclaration;
        for (const base of decl ? declared(decl) : []) {
          if (base.startsWith("\0")) {
            // A prop of a component in this file: what's passed for it where it's rendered.
            const [tag, ...rest] = base.slice(1).split(".");
            const [key, ...deeper] = [...rest, ...parts];
            for (const passed of (key && attributeUses.get(tag)?.get(key)) || []) for (const path of paths(passed)) out.push([path, ...deeper].filter(Boolean).join("."));
          } else out.push([base, ...parts].filter(Boolean).join("."));
        }
        return out;
      }
    }
    ts.forEachChild(node, (child) => void paths(child, out));
    return out;
  };
  const COMPARE = new Set([
    ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken, ts.SyntaxKind.EqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsToken,
    ts.SyntaxKind.LessThanToken, ts.SyntaxKind.GreaterThanToken, ts.SyntaxKind.LessThanEqualsToken, ts.SyntaxKind.GreaterThanEqualsToken,
    ts.SyntaxKind.InKeyword, ts.SyntaxKind.InstanceOfKeyword,
  ]);
  const TRUTH = new Set([ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken, ts.SyntaxKind.AmpersandAmpersandToken]);
  const out = new Set<string>();
  const test = (node: ts.Node) => {
    for (const path of paths(node)) {
      const parts = path.split(".");
      for (let i = 1; i <= parts.length; i++) out.add(parts.slice(0, i).join("."));
    }
  };
  const visit = (node: ts.Node): void => {
    if (ts.isBinaryExpression(node) && COMPARE.has(node.operatorToken.kind)) {
      test(node.left);
      test(node.right);
    } else if (ts.isBinaryExpression(node) && TRUTH.has(node.operatorToken.kind)) {
      // `text ?? ""` and `text || ""` show any text as given.
      const empty = node.operatorToken.kind !== ts.SyntaxKind.AmpersandAmpersandToken && (ts.isStringLiteral(node.right) || ts.isNoSubstitutionTemplateLiteral(node.right)) && node.right.text === "";
      if (!empty) test(node.left);
    } else if (ts.isConditionalExpression(node)) test(node.condition);
    else if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.ExclamationToken) test(node.operand);
    else if (ts.isIfStatement(node) || ts.isWhileStatement(node) || ts.isSwitchStatement(node)) test(node.expression);
    else if (ts.isCaseClause(node)) test(node.expression);
    ts.forEachChild(node, visit);
  };
  visit(file);
  return out;
}

/** The template component in a file: its default export, or its first function. */
function mainFunction(file: ts.SourceFile, checker: ts.TypeChecker): ts.SignatureDeclaration | undefined {
  const fn = (node: ts.Node | undefined): ts.SignatureDeclaration | undefined => {
    while (node && (ts.isParenthesizedExpression(node) || ts.isCallExpression(node))) node = ts.isCallExpression(node) ? node.arguments[0] : node.expression; // memo(), forwardRef()
    if (!node) return undefined;
    if (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node)) return node;
    if (ts.isIdentifier(node)) {
      const decl = checker.getSymbolAtLocation(node)?.valueDeclaration;
      return decl && ts.isVariableDeclaration(decl) ? fn(decl.initializer) : decl && ts.isFunctionDeclaration(decl) ? decl : undefined;
    }
    return undefined;
  };
  for (const statement of file.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.modifiers?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword)) return statement;
    if (ts.isExportAssignment(statement)) return fn(statement.expression);
  }
  for (const statement of file.statements) {
    if (ts.isFunctionDeclaration(statement)) return statement;
    if (ts.isExpressionStatement(statement) && fn(statement.expression)) return fn(statement.expression);
  }
  return undefined;
}

/** Replace markers only in text and links; styles and image sources keep samples. */
export function replaceMarkers<T>(
  output: T,
  probes: TextProp[],
  tag: (prop: TextProp) => string,
): T {
  type Context = "sample" | "text" | "html" | "richText";
  const escape = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  const swap = (text: string, allowed: boolean, html = false) =>
    text.replace(MARKER, (_, i: string) => {
      const p = probes[Number(i)];
      const value = allowed ? tag(p) : p.value;
      return html ? escape(value) : value;
    });
  const html = (source: string) => {
    // Source ranges preserve the markup verbatim while the parser identifies
    // text and attributes, including quoted '>' and embedded styles/images.
    const allowed: Array<{ start: number; end: number }> = [];
    const visit = (
      node: DefaultTreeAdapterMap["node"],
      hidden = false,
    ): void => {
      const blocked =
        hidden || node.nodeName === "style" || node.nodeName === "script";
      if (node.nodeName === "#text" && !blocked && node.sourceCodeLocation) {
        allowed.push({
          start: node.sourceCodeLocation.startOffset,
          end: node.sourceCodeLocation.endOffset,
        });
      }
      if ("tagName" in node) {
        for (const [name, location] of Object.entries(
          node.sourceCodeLocation?.attrs ?? {},
        )) {
          if (
            (node.tagName === "a" && name === "href") ||
            (node.tagName === "img" && name === "alt")
          ) {
            allowed.push({
              start: location.startOffset,
              end: location.endOffset,
            });
          }
        }
        if ("content" in node) visit(node.content, blocked);
      }
      if ("childNodes" in node)
        for (const child of node.childNodes) visit(child, blocked);
    };
    visit(parseFragment(source, { sourceCodeLocationInfo: true }));
    return source.replace(MARKER, (marker, i: string, offset: number) =>
      swap(
        marker,
        allowed.some(
          (r) => offset >= r.start && offset + marker.length <= r.end,
        ),
        true,
      ),
    );
  };
  const walk = (value: unknown, context: Context = "sample"): unknown => {
    if (typeof value === "string") {
      if (context === "html") return html(value);
      if (context === "richText") {
        try {
          return JSON.stringify(walk(JSON.parse(value), "richText"));
        } catch {
          return swap(value, false);
        }
      }
      return swap(value, context === "text");
    }
    if (Array.isArray(value)) return value.map((item) => walk(item, context));
    if (value && typeof value === "object") {
      const node = value as Record<string, unknown>;
      const out: Record<string, unknown> = {};
      for (const [key, inner] of Object.entries(node)) {
        const field: Context =
          key === "html" || (key === "text" && context !== "richText")
            ? "html"
            : key === "textJson"
              ? "richText"
              : ["children", "previewText", "preheaderText", "alt", "altText", "href"].includes(
                    key,
                  ) ||
                  (context === "richText" && key === "text")
                ? "text"
                : // Design actions contain their link in values.href; other URLs
                  // (fonts, backgroundImage, src.url) must stay usable sample values.
                  key === "url" && context === "text"
                  ? "text"
                  : key === "action"
                    ? "text"
                    : context === "richText"
                      ? "richText"
                      : "sample";
        out[key] = walk(inner, field);
      }
      return out;
    }
    return value;
  };
  return walk(output) as T;
}

function escapeAttribute(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Which markers appear in `output`. */
function markersIn(output: unknown): Set<number> {
  const found = new Set<number>();
  for (const m of JSON.stringify(output).matchAll(MARKER)) found.add(Number(m[1]));
  return found;
}

/** Whether marker characters appear outside whole markers (a marker cut or changed). */
function hasBrokenMarkers(output: unknown): boolean {
  return /[\uE000\uE001]/.test(JSON.stringify(output).replace(MARKER, ""));
}

/** Two outputs the same, reading HTML entities as the characters they stand for. */
function sameOutput(a: unknown, b: unknown): boolean {
  const text = (output: unknown) =>
    JSON.stringify(output, (_, value: unknown) =>
      typeof value === "string" ? decodeHtmlEntities(value) : value,
    );
  return text(a) === text(b);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}
