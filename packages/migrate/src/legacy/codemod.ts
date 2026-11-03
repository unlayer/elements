/**
 * Codemod: today's components (@unlayer/react-elements's main entry, or /legacy) rewritten as the new ones
 * (/primitives), keeping the template's props, loops, conditions and helpers (RFC 0001, step 7).
 *
 * Only the import and the JSX of today's components change; JSX inside expressions is rewritten in place. The new
 * template draws what today's draws: where today's components fill in a default the new ones don't share (a block's
 * 10px of padding, a Heading's 22px at 140%, an email's 500px width), the value is written out; where today's draw
 * something other than their props say (an image's width in px, which they draw as a percentage of their column),
 * the value they draw is written out too, so nothing moves when a template is migrated. Values that can't be read
 * from the source (expressions) are kept as they are, and what that may change is reported, as is anything with no
 * new component yet (Html, Table, custom tools): the migration never drops anything quietly.
 */
import * as prettier from "prettier";
import ts from "typescript";
import { formatTsx } from "@unlayer/convert-core";
import { hole, inlineHtml, plain } from "./html";

export interface MigrateElementsOptions {
  /** Module specifiers today's components are imported from (default: the package and its /legacy entry). */
  from?: string[];
  /** Where the new components are imported from (default "@unlayer/react-elements/primitives"). */
  to?: string;
  /**
   * The project's modules that pass today's components on (an index re-exporting them), by the specifier the module
   * imports them with: each name one is passed on as, and the component it is (`{ "./ui": { Band: "Row" } }`). Their
   * other names stay imported from them.
   */
  through?: Record<string, Record<string, string>>;
  /**
   * Whether the module is TypeScript (default true). A JavaScript one (a .js, .jsx, .mjs or .cjs file) is written with
   * no TypeScript in it.
   */
  typescript?: boolean;
}

export interface MigrateElementsResult {
  /** The migrated module, formatted. */
  code: string;
  /** What couldn't be migrated as it was, or what it may change: one line each, with where. */
  report: string[];
}

export const DEFAULT_FROM = ["@unlayer/react-elements", "@unlayer/react-elements/legacy"];
const DEFAULT_TO = "@unlayer/react-elements/primitives";

/** Today's components that have a new one (by the same name, or the one they become). */
const COMPONENTS = new Set(["Email", "Page", "Row", "Column", "Heading", "Paragraph", "Text", "Button", "Image", "Divider", "Social", "Menu", "Video", "Html", "Table", "Spacer"]);
/** What the codemod migrates of today's exports: its components and its layouts. */
export const MIGRATED = new Set([...COMPONENTS, "ColumnLayouts"]);
/** A record's own value for a key (never one from Object.prototype, as `constructor` would be). */
const own = <T>(record: Record<string, T> | undefined, key: string): T | undefined => (record && Object.prototype.hasOwnProperty.call(record, key) ? record[key] : undefined);
const LAYOUTS: Record<string, number[]> = {
  OneColumn: [1],
  TwoEqual: [1, 1],
  TwoWideNarrow: [2, 1],
  TwoNarrowWide: [1, 2],
  ThreeEqual: [1, 1, 1],
  ThreeNarrowWideNarrow: [1, 2, 1],
  FourEqual: [1, 1, 1, 1],
  FiveEqual: [1, 1, 1, 1, 1],
};
const isLayout = (name: string) => Object.prototype.hasOwnProperty.call(LAYOUTS, name);
/** The image today's Image draws without a src (as wide as its place, as it is there). */
const PLACEHOLDER = "https://cdn.tools.unlayer.com/image/placeholder.png";

/**
 * A prop's value: one known from the source (a literal, or a constant whose name is kept as `code`), or its source as
 * it is (an expression, its node kept for the html it may build).
 */
type Value = { literal: unknown; code?: string } | { code: string; node?: ts.Expression };

/** A component's props, and which of them its new JSX used: the others are reported, never dropped quietly. */
class Props extends Map<string, Value> {
  readonly used = new Set<string>();
  override get(name: string): Value | undefined {
    this.used.add(name);
    return super.get(name);
  }
  /** The props given that nothing used. */
  unused(): string[] {
    return [...this.keys()].filter((name) => !this.used.has(name));
  }
}

const isLiteral = (value: Value | undefined): value is { literal: unknown; code?: string } => !!value && "literal" in value;
const code = (value: Value): string => value.code ?? JSON.stringify((value as { literal: unknown }).literal);

/** Strings and values joined into one: a string where every part is a literal, else a template literal. */
function joined(parts: Array<Value | string>): Value {
  const known = parts.every((part) => typeof part === "string" || isLiteral(part));
  const text = known ? parts.map((part) => (typeof part === "string" ? part : String((part as { literal: unknown }).literal))).join("") : undefined;
  if (parts.every((part) => typeof part === "string" || (isLiteral(part) && part.code === undefined))) return { literal: text };
  const escape = (s: string) => s.replace(/[`\\]|\$\{/g, (m) => `\\${m}`);
  const template = `\`${parts.map((part) => (typeof part === "string" ? escape(part) : isLiteral(part) && part.code === undefined ? escape(String(part.literal)) : `\${${code(part)}}`)).join("")}\``;
  return known ? { literal: text, code: template } : { code: template };
}

/** px from "18px", "18" or 18; undefined for anything else. */
function px(value: unknown): number | undefined {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  const match = typeof value === "string" ? /^\s*(-?\d+(?:\.\d+)?)\s*(px)?\s*$/.exec(value) : null;
  return match ? Number(match[1]) : undefined;
}

/** "10px 20px" (1 to 4 values) as [top, right, bottom, left]. */
function sides(value: unknown): [number, number, number, number] | undefined {
  if (typeof value === "number") return [value, value, value, value];
  if (typeof value !== "string" || !value.trim()) return undefined;
  const parts = value.trim().split(/\s+/).map(px);
  if (parts.some((part) => part === undefined) || parts.length > 4) return undefined;
  const [top, right = top, bottom = top, left = right] = parts as number[];
  return [top, right, bottom, left];
}

const round = (n: number) => Math.round(n * 100) / 100;

/** What a block knows about where it is, for widths today's components work out (undefined where it isn't known). */
interface Place {
  /** The column's width, the row's side padding taken off (today's image maximum is a share of it). */
  column?: number;
  /** The room in the column, its padding taken off. */
  room?: number;
  /** The Row's side padding, which today's leave out of the column (the new Section is that much wider). */
  outside?: number;
}

export async function migrateElements(source: string, options: MigrateElementsOptions = {}): Promise<MigrateElementsResult> {
  const from = new Set(options.from ?? DEFAULT_FROM);
  const typescript = options.typescript ?? true;
  const file = ts.createSourceFile("template.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const report: string[] = [];
  const used = new Set<string>();
  const where = (node: ts.Node) => `line ${file.getLineAndCharacterOfPosition(node.getStart()).line + 1}`;

  /** Whether a name is declared again where it's used (a parameter, a local): there, it isn't the import. */
  const shadowed = (name: ts.Identifier): boolean => {
    const declares = (binding: ts.Node | undefined): boolean =>
      !!binding && (ts.isIdentifier(binding) ? binding.text === name.text : (ts.isObjectBindingPattern(binding) || ts.isArrayBindingPattern(binding)) && binding.elements.some((element) => !ts.isOmittedExpression(element) && declares(element.name)));
    const declaredIn = (list: ts.VariableDeclarationList) => list.declarations.some((declaration) => declares(declaration.name));
    for (let scope: ts.Node = name.parent; scope && !ts.isSourceFile(scope); scope = scope.parent) {
      if (ts.isFunctionLike(scope) && scope.parameters.some((parameter) => declares(parameter.name))) return true;
      if (ts.isBlock(scope) || ts.isCaseClause(scope) || ts.isDefaultClause(scope)) {
        for (const statement of scope.statements) {
          if (ts.isVariableStatement(statement) && declaredIn(statement.declarationList)) return true;
          if ((ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement)) && statement.name?.text === name.text) return true;
        }
      }
      if ((ts.isForStatement(scope) || ts.isForOfStatement(scope) || ts.isForInStatement(scope)) && scope.initializer && ts.isVariableDeclarationList(scope.initializer) && declaredIn(scope.initializer)) return true;
      if (ts.isCatchClause(scope) && declares(scope.variableDeclaration?.name)) return true;
    }
    return false;
  };
  /** Whether every use of an imported name (but its import, and where the name is another's) is one `ok` takes. */
  const onlyUsedAs = (name: ts.Identifier, ok: (use: ts.Identifier) => boolean) => {
    let only = true;
    const visit = (n: ts.Node): void => {
      const parent = n.parent;
      const named = parent && ((ts.isPropertyAccessExpression(parent) && parent.name === n) || (ts.isPropertyAssignment(parent) && parent.name === n));
      if (ts.isIdentifier(n) && n.text === name.text && n !== name && !named && !shadowed(n) && !ok(n)) only = false;
      ts.forEachChild(n, visit);
    };
    visit(file);
    return only;
  };
  /** Whether an expression is an element's tag (`<Row>`, `<E.Row>`, or its closing tag). */
  const isTag = (expression: ts.Node) => {
    const parent = expression.parent;
    return (ts.isJsxOpeningElement(parent) || ts.isJsxSelfClosingElement(parent) || ts.isJsxClosingElement(parent)) && parent.tagName === expression;
  };
  /** The name an expression starts with (`E` in `E.ColumnLayouts`). */
  const leftmost = (expression: ts.Node): ts.Identifier => {
    while (ts.isPropertyAccessExpression(expression)) expression = expression.expression;
    return expression as ts.Identifier;
  };
  /** Whether an expression is followed by one of today's layout names (`ColumnLayouts.TwoEqual`). */
  const beforeLayout = (expression: ts.Node) => ts.isPropertyAccessExpression(expression.parent) && expression.parent.expression === expression && isLayout(expression.parent.name.text);

  // Today's components and layouts, by the name they're imported as (through a namespace, `E.Button`); the imports of
  // today's package (or of a module passing its components on), each with what stays imported from it (today's other
  // API, and its types; the module's own names).
  const local = new Map<string, string>();
  const imports: Array<{ statement: ts.ImportDeclaration; kept: string[] }> = [];
  /** Names the migrated module no longer declares: today's components, its layouts and their namespace where only they used it. */
  const freed: string[] = [];
  const todaysImport = (statement: ts.Statement): statement is ts.ImportDeclaration & { moduleSpecifier: ts.StringLiteral } =>
    ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier) && (from.has(statement.moduleSpecifier.text) || !!own(options.through, statement.moduleSpecifier.text));
  for (const statement of file.statements) {
    if (!todaysImport(statement)) continue;
    const clause = statement.importClause;
    // `import type` stays as it is: today's types are still exported.
    if (!clause || clause.isTypeOnly) continue;
    const specifier = statement.moduleSpecifier.text;
    const through = from.has(specifier) ? undefined : own(options.through, specifier);
    /** Today's component (or ColumnLayouts) a name exported here is, or undefined (today's other API, the module's own). */
    const todays = (name: string) => (through ? own(through, name) : MIGRATED.has(name) ? name : undefined);
    const named = clause.namedBindings;
    if (named && ts.isNamespaceImport(named)) {
      const ns = named.name.text;
      for (const name of through ? Object.keys(through) : MIGRATED) local.set(`${ns}.${name}`, todays(name)!);
      // The namespace goes where it's only used for today's components and layouts, which are rewritten.
      const migrated = onlyUsedAs(named.name, (use) => {
        const name = ts.isPropertyAccessExpression(use.parent) && use.parent.expression === use ? todays(use.parent.name.text) : undefined;
        return !!name && ((COMPONENTS.has(name) && isTag(use.parent)) || (name === "ColumnLayouts" && beforeLayout(use.parent)));
      });
      if (migrated && !clause.name) {
        imports.push({ statement, kept: [] });
        freed.push(ns);
      } else report.push(`${where(statement)}: ${ns} stays imported from ${specifier} for ${through ? "the rest it passes on" : "today's API used through it"}; its components are migrated`);
      continue;
    }
    const kept: string[] = clause.name ? [clause.name.text] : [];
    const specifiers: string[] = [];
    for (const element of named && ts.isNamedImports(named) ? named.elements : []) {
      const name = todays((element.propertyName ?? element.name).text);
      if (element.isTypeOnly) specifiers.push(element.getText());
      else if (through && !name) specifiers.push(element.getText());
      else if (name && COMPONENTS.has(name)) {
        local.set(element.name.text, name);
        if (onlyUsedAs(element.name, isTag)) freed.push(element.name.text);
        else {
          specifiers.push(element.getText());
          report.push(`${where(element)}: ${name} stays imported from ${specifier}: it's used other than as an element (<${element.name.text}>), which is all that's migrated`);
        }
      } else if (name === "ColumnLayouts") {
        local.set(element.name.text, name);
        if (onlyUsedAs(element.name, beforeLayout)) freed.push(element.name.text);
        else {
          specifiers.push(element.getText());
          report.push(`${where(element)}: ${name} stays imported from ${specifier}: it's used other than as a layout's name (${element.name.text}.TwoEqual), which is all that's rewritten`);
        }
      } else {
        specifiers.push(element.getText());
        report.push(`${where(element)}: ${(element.propertyName ?? element.name).text} is today's API and stays imported from ${specifier}; it doesn't take the new components (render them with render() from the new entry)`);
      }
    }
    if (specifiers.length) kept.push(`{ ${specifiers.join(", ")} }`);
    imports.push({ statement, kept });
  }

  // The names the module declares itself (a component of its own called Section, Next's Link): a new component whose
  // name is one of them is imported as another.
  const declared = new Map<string, number>();
  const declare = (n: ts.Node): void => {
    const name = (n as { name?: ts.Node }).name;
    const declaration =
      ts.isVariableDeclaration(n) || ts.isFunctionDeclaration(n) || ts.isClassDeclaration(n) || ts.isParameter(n) || ts.isBindingElement(n) || ts.isImportSpecifier(n) || ts.isImportClause(n) || ts.isNamespaceImport(n) || ts.isImportEqualsDeclaration(n) || ts.isTypeAliasDeclaration(n) || ts.isInterfaceDeclaration(n) || ts.isEnumDeclaration(n);
    if (declaration && name && ts.isIdentifier(name)) declared.set(name.text, (declared.get(name.text) ?? 0) + 1);
    ts.forEachChild(n, declare);
  };
  declare(file);
  for (const name of freed) declared.set(name, declared.get(name)! - 1);
  const names = new Map<string, string>();
  /** The name a new component is written as. */
  const nameOf = (component: string): string => {
    let name = names.get(component);
    if (!name) {
      name = component;
      for (let n = 1; declared.get(name); n++) name = `Elements${component}${n > 1 ? n : ""}`;
      names.set(component, name);
    }
    return name;
  };

  const bare = (expression: ts.Expression): ts.Expression => {
    while (ts.isAsExpression(expression) || ts.isParenthesizedExpression(expression) || ts.isSatisfiesExpression(expression)) expression = expression.expression;
    return expression;
  };
  /** The value a name is a constant for where it's used (the nearest `const` in scope), or undefined (a parameter, a `let`). */
  const constant = (name: ts.Identifier): ts.Expression | undefined => {
    for (let scope: ts.Node | undefined = name.parent; scope; scope = scope.parent) {
      if (ts.isFunctionLike(scope) && scope.parameters.some((parameter) => parameter.name.getText() === name.text)) return undefined;
      if (!ts.isBlock(scope) && !ts.isSourceFile(scope)) continue;
      for (const statement of scope.statements) {
        if (!ts.isVariableStatement(statement)) continue;
        const declaration = statement.declarationList.declarations.find((d) => ts.isIdentifier(d.name) && d.name.text === name.text);
        if (declaration) return statement.declarationList.flags & ts.NodeFlags.Const && declaration.initializer ? bare(declaration.initializer) : undefined;
      }
    }
    return undefined;
  };

  /** A literal value from an expression (with the constant's name, where it's one), or undefined where it isn't one. */
  const literal = (expression: ts.Expression, depth = 0): { value: unknown; code?: string } | undefined => {
    if (depth > 8) return undefined;
    if (ts.isParenthesizedExpression(expression) || ts.isAsExpression(expression) || ts.isSatisfiesExpression(expression)) return literal(expression.expression, depth);
    if (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) return { value: expression.text };
    if (ts.isNumericLiteral(expression)) return { value: Number(expression.text) };
    if (ts.isPrefixUnaryExpression(expression) && expression.operator === ts.SyntaxKind.MinusToken && ts.isNumericLiteral(expression.operand)) return { value: -Number(expression.operand.text) };
    if (expression.kind === ts.SyntaxKind.TrueKeyword) return { value: true };
    if (expression.kind === ts.SyntaxKind.FalseKeyword) return { value: false };
    if (ts.isArrayLiteralExpression(expression)) {
      const items = expression.elements.map((element) => literal(element));
      return items.every(Boolean) ? { value: items.map((item) => item!.value) } : undefined;
    }
    if (ts.isObjectLiteralExpression(expression)) {
      const out: Record<string, unknown> = {};
      for (const property of expression.properties) {
        if (!ts.isPropertyAssignment(property) || !(ts.isIdentifier(property.name) || ts.isStringLiteral(property.name))) return undefined;
        const value = literal(property.initializer);
        if (!value) return undefined;
        out[property.name.text] = value.value;
      }
      return { value: out };
    }
    if (ts.isIdentifier(expression)) {
      const init = constant(expression);
      const value = init && literal(init, depth + 1);
      return value && { value: value.value, code: expression.text };
    }
    const cells = layoutCells(expression);
    return cells && { value: { cells } };
  };
  /** The cells of one of today's layouts (`ColumnLayouts.TwoEqual`), or undefined where it isn't one. */
  function layoutCells(expression: ts.Node): number[] | undefined {
    return ts.isPropertyAccessExpression(expression) && local.get(expression.expression.getText()) === "ColumnLayouts" && !shadowed(leftmost(expression.expression)) && isLayout(expression.name.text) ? LAYOUTS[expression.name.text] : undefined;
  }

  const valueOf = (expression: ts.Expression): Value => {
    const value = literal(expression);
    return value ? { literal: value.value, code: value.code } : { code: rewrite(expression), node: expression };
  };
  const read = new Map<ts.JsxOpeningLikeElement, Props>();
  const propsOf = (element: ts.JsxOpeningLikeElement): Props => {
    if (read.has(element)) return read.get(element)!;
    const out = new Props();
    read.set(element, out);
    for (const attribute of element.attributes.properties) {
      if (ts.isJsxSpreadAttribute(attribute)) {
        // A spread of an object literal (or a constant for one): its props, each read as a prop given here.
        let spread: ts.Expression | undefined = bare(attribute.expression);
        if (ts.isIdentifier(spread)) spread = constant(spread);
        if (spread && ts.isObjectLiteralExpression(spread) && spread.properties.every((p) => (ts.isPropertyAssignment(p) || ts.isShorthandPropertyAssignment(p)) && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)))) {
          for (const property of spread.properties as ts.NodeArray<ts.PropertyAssignment | ts.ShorthandPropertyAssignment>) {
            const value = ts.isPropertyAssignment(property) ? property.initializer : property.name;
            out.set((property.name as ts.Identifier).text, valueOf(value));
          }
        } else {
          report.push(`${where(attribute)}: the props spread here ({...${attribute.expression.getText()}}) can't be read, so they're left out: give them as props`);
        }
        continue;
      }
      const name = attribute.name.getText();
      const init = attribute.initializer;
      if (!init) out.set(name, { literal: true });
      else if (ts.isStringLiteral(init)) out.set(name, { literal: init.text });
      else if (ts.isJsxExpression(init) && init.expression) out.set(name, valueOf(init.expression));
    }
    return out;
  };

  // ─── Writing the new JSX ───────────────────────────────────────────────────

  const element = (component: string, attributes: Array<string | false | undefined>, children: string[] = []) => {
    used.add(component);
    const tag = nameOf(component);
    const attrs = attributes.filter(Boolean).join(" ");
    return children.length ? `<${tag}${attrs ? ` ${attrs}` : ""}>${children.join("")}</${tag}>` : `<${tag}${attrs ? ` ${attrs}` : ""} />`;
  };
  const attr = (name: string, value: Value | undefined) =>
    value && (isLiteral(value) && value.code === undefined && typeof value.literal === "string" && !/["\\&{}\n]/.test(value.literal) ? `${name}="${value.literal}"` : `${name}={${code(value)}}`);
  const object = (entries: Array<[string, Value | undefined]>) => {
    const set = entries.filter((entry): entry is [string, Value] => entry[1] !== undefined);
    return set.length ? `{{ ${set.map(([key, value]) => `${key}: ${code(value)}`).join(", ")} }}` : undefined;
  };
  const styleAttr = (entries: Array<[string, Value | undefined]>) => {
    const value = object(entries);
    return value && `style=${value}`;
  };
  const lit = (value: unknown): Value => ({ literal: value });
  const given = (props: Props, name: string, fallback?: unknown): Value | undefined => props.get(name) ?? (fallback === undefined ? undefined : lit(fallback));
  /** A non-empty color, or nothing ("" and "transparent" are none). */
  const color = (props: Props, name: string): Value | undefined => {
    const value = props.get(name);
    return isLiteral(value) && (value.literal === "" || value.literal === "transparent") ? undefined : value;
  };
  const hidden = (props: Props) => {
    const mobile = props.get("hideOnMobile");
    const desktop = props.get("hideOnDesktop");
    return mobile || desktop ? `hidden=${object([["mobile", mobile], ["desktop", desktop]])}` : undefined;
  };
  /** A font: today's `{ label, value }` or a stack; the stack. */
  const font = (props: Props, name = "fontFamily"): Value | undefined => {
    const value = props.get(name);
    if (!value) return undefined;
    if (isLiteral(value) && value.literal && typeof value.literal === "object") return { literal: (value.literal as { value?: string }).value, code: value.code && `${value.code}.value` };
    if (!isLiteral(value)) report.push(`${where(value.node ?? file)}: its ${name} comes from an expression: it's kept as it is; where it's today's { label, value }, give its value`);
    return value;
  };
  /** Letter spacing in px: today's take em ("0.06em"), which is worked out from the font size where both are known. */
  const letterSpacing = (props: Props, fontSize: Value | undefined, at: ts.Node): Value | undefined => {
    const value = props.get("letterSpacing");
    if (!value || !isLiteral(value) || typeof value.literal !== "string" || !value.literal.trim().endsWith("em")) return value;
    const size = isLiteral(fontSize!) ? px(fontSize!.literal) : undefined;
    if (size === undefined) {
      report.push(`${where(at)}: letterSpacing ${value.literal} is in em and the font size isn't known here: it's left out (give it in px)`);
      return undefined;
    }
    return lit(round(parseFloat(value.literal) * size));
  };
  /** "14px" as 14: a literal length in px written as a number; anything else as it is. */
  const n = (value: Value | undefined): Value | undefined => {
    if (!isLiteral(value) || value.code !== undefined || typeof value.literal !== "string" || !/^\s*-?[\d.]+(px)?\s*$/.test(value.literal)) return value;
    return lit(px(value.literal));
  };
  /** Today's `mobile` prop, setting by setting (none where it can't be read, which is reported). */
  const phones = new Map<Props, { at: ts.Node; settings: Props }>();
  const phone = (props: Props, at: ts.Node): Props => {
    if (phones.has(props)) return phones.get(props)!.settings;
    const value = props.get("mobile");
    const out = new Props();
    phones.set(props, { at, settings: out });
    if (!value) return out;
    const node = !isLiteral(value) && value.node ? bare(value.node) : undefined;
    if (isLiteral(value) && value.literal && typeof value.literal === "object") {
      for (const [key, item] of Object.entries(value.literal as Record<string, unknown>)) out.set(key, lit(item));
    } else if (node && ts.isObjectLiteralExpression(node) && node.properties.every((p) => ts.isPropertyAssignment(p) && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)))) {
      for (const property of node.properties as ts.NodeArray<ts.PropertyAssignment>) out.set((property.name as ts.Identifier).text, valueOf(property.initializer));
    } else {
      report.push(`${where(at)}: its mobile settings come from an expression: they're left out (give them as an object)`);
    }
    return out;
  };
  const mobileAttr = (entries: Array<[string, Value | undefined]>) => {
    const value = object(entries);
    return value && `mobile=${value}`;
  };
  /**
   * A text block's words as today's draw them: a Paragraph's children, else its `text` (plain text: markup in it
   * shows), else its `html`; a Heading's or a Button's `text` (markup), else its children (an `html` they don't draw).
   * What today's don't draw beside it is left out, and said.
   */
  const textChildren = (node: ts.JsxElement | ts.JsxSelfClosingElement, props: Props, at: ts.Node, component: string): string[] => {
    // Children as JSX gives them: not the line breaks and indentation between tags, nor a comment in braces.
    const children = ts.isJsxElement(node) ? node.children.filter((c) => !(ts.isJsxText(c) && c.containsOnlyTriviaWhiteSpaces) && !(ts.isJsxExpression(c) && !c.expression)) : [];
    const sources = { children: children.length ? ({ code: "" } as Value) : undefined, text: props.get("text"), html: props.get("html") };
    const paragraph = component === "Paragraph" || component === "Text";
    const order: Array<keyof typeof sources> = paragraph ? ["children", "text", "html"] : ["text", "children"];
    const drawn = order.find((source) => sources[source]);
    // Where what's drawn may be undefined (an expression), today's draw what comes after it in its place.
    const maybe = drawn === "children" ? children.every((c) => ts.isJsxExpression(c)) : !!drawn && !isLiteral(sources[drawn]);
    for (const source of ["children", "text", "html"] as const) {
      if (!sources[source] || source === drawn) continue;
      const is = source === "children" ? ["children", "are", "aren't", "they're"] : [source, "is", "isn't", "it's"];
      const later = drawn && order.indexOf(source) > order.indexOf(drawn);
      report.push(
        maybe && later
          ? `${where(at)}: its ${is[0]} ${is[1]} drawn by today's ${component} only where its ${drawn} ${drawn === "children" ? "are" : "is"} undefined: ${is[3]} left out`
          : `${where(at)}: its ${is[0]} ${is[2]} drawn by today's ${component}, which draws its ${drawn ?? order.join(" or its ")}: ${is[3]} left out`
      );
    }
    if (drawn === "children" && ts.isJsxElement(node)) return node.children.map((c) => child(c)).filter(Boolean);
    const value = drawn && sources[drawn]!;
    if (!value) return [];
    if (drawn === "text" && paragraph) return [isLiteral(value) && typeof value.literal === "string" ? plain(value.literal) : `{${code(value)}}`];
    // Markup in a string, or in a template literal with expressions in it (`<b>${value}</b>`).
    const template = !isLiteral(value) && value.node ? bare(value.node) : undefined;
    let markup: string;
    let holes: string[] = [];
    if (isLiteral(value) && typeof value.literal === "string") markup = value.literal;
    else if (template && ts.isTemplateExpression(template)) {
      markup = template.head.text + template.templateSpans.map((span, index) => hole(index) + span.literal.text).join("");
      holes = template.templateSpans.map((span) => rewrite(span.expression));
    } else {
      report.push(`${where(at)}: its ${drawn} comes from an expression (${code(value)}): it's written as text, so markup in it would show; write that with Span, Link and LineBreak`);
      return [`{${code(value)}}`];
    }
    // What the new components hold is written with them; what they don't is named, each on a line of the report.
    const parsed = inlineHtml(markup, holes, nameOf);
    for (const left of parsed.dropped) report.push(`${where(at)}: its ${drawn}'s ${left}`);
    parsed.used.forEach((name) => used.add(name));
    return [parsed.jsx];
  };
  /** A block's padding (today's containerPadding, 10px by default): the block's own, or a Column around it. */
  const padding = (props: Props) => given(props, "containerPadding", "10px")!;
  const ALIGN: Record<string, string> = { left: "start", center: "center", right: "end" };
  /** Today's alignment (left, center, right) as the new one's (start, center, end): one read at run time is looked up there (with a cast in TypeScript). */
  const alignOf = (value: Value | undefined): Value | undefined =>
    value &&
    (isLiteral(value)
      ? lit(ALIGN[String(value.literal)] ?? "start")
      : { code: typescript ? `({ left: "start", center: "center", right: "end" } as const)[(${value.code}) as "left"] ?? "start"` : `({ left: "start", center: "center", right: "end" })[${value.code}] ?? "start"` });
  const align = (props: Props, name: string, fallback: string): Value => alignOf(props.get(name) ?? lit(fallback))!;
  /** A border's shorthand ("1px solid #BBBBBB") from today's width, style and color. */
  const line = (width: Value, style: Value | undefined, color: Value): Value =>
    joined([isLiteral(width) && width.code === undefined && px(width.literal) !== undefined ? `${px(width.literal)}px` : width, " ", style ?? "solid", " ", color]);
  /** A block today's components pad (an Image, a Button, ...) in a Column the new one sits in, with that padding. */
  const wrapped = (props: Props, block: string, alignment: Value | undefined, at: ts.Node) => {
    const m = phone(props, at);
    // A block sits on phones where it does on desktop: the new components have no phone alignment for one.
    const phoneAlign = alignOf(m.get("textAlign"));
    if (phoneAlign && (!alignment || code(phoneAlign) !== code(alignment))) report.push(`${where(at)}: its alignment on phones (mobile textAlign) is left out: the new components place a block on phones where it is on desktop`);
    return element("Column", [
      styleAttr([["padding", n(padding(props))], ["alignItems", alignment]]),
      mobileAttr([["padding", n(m.get("containerPadding"))]]),
      hidden(props),
    ], [block]);
  };
  /** Today's text direction (ltr, rtl or auto; anything else today's leave out) as the new `dir`. */
  const dir = (props: Props) => {
    const value = props.get("textDirection");
    if (!isLiteral(value)) return attr("dir", value);
    const direction = String(value.literal).trim().toLowerCase();
    return ["ltr", "rtl", "auto"].includes(direction) && `dir="${direction}"`;
  };

  // ─── Each of today's components ────────────────────────────────────────────

  function root(type: "Email" | "Page", props: Props, children: string[]) {
    const width = props.get("contentWidth");
    return element(type, [
      `width={${width ? (isLiteral(width) && px(width.literal) !== undefined ? px(width.literal) : code(width)) : 500}}`,
      type === "Email" && attr("previewText", props.get("previewText")),
      dir(props),
      styleAttr([
        ["backgroundColor", color(props, "backgroundColor")],
        ["color", given(props, "textColor", "#000000")],
        ["fontFamily", font(props) ?? lit("arial,helvetica,sans-serif")],
      ]),
    ], children);
  }

  function row(node: ts.JsxElement | ts.JsxSelfClosingElement, props: Props, body: number | undefined) {
    const layout = props.get("layout");
    if (layout && !isLiteral(layout)) report.push(`${where(node)}: this Row's layout can't be read (${layout.code}): its Columns are written one under another (give it as ColumnLayouts.TwoEqual or the like)`);
    const cells: number[] = (isLiteral(layout) && (layout.literal as { cells?: number[] })?.cells) || (isLiteral(props.get("cells")) && (props.get("cells") as { literal: number[] }).literal) || [1];
    const pad = props.get("padding");
    const p = isLiteral(pad) ? sides(pad.literal) : undefined;
    if (pad && !p) report.push(`${where(node)}: this Row's padding can't be read: it's kept as written, its sides inside the content (today's are outside it)`);
    const total = cells.reduce((sum, cell) => sum + cell, 0) || 1;
    const rowWidth = body !== undefined && (p || !pad) ? body - (p ? p[1] + p[3] : 0) : undefined;
    const columns = ts.isJsxElement(node) ? node.children.filter((c) => !(ts.isJsxText(c) && !c.text.trim())) : [];
    const isColumn = (c: ts.JsxChild): c is ts.JsxElement | ts.JsxSelfClosingElement => (ts.isJsxElement(c) || ts.isJsxSelfClosingElement(c)) && todays(c) === "Column";
    const columnProps = columns.map((c) => (isColumn(c) ? propsOf(opening(c)) : undefined));
    const stacks = !(isLiteral(props.get("noStackMobile")) && (props.get("noStackMobile") as { literal: unknown }).literal);
    // Today's stretch a Row's Columns to its height, so a line along the top or the bottom of each is one line across
    // the Row; the new email's Columns end with their content. A line every Column has is the Row's (and, where they
    // stack on phones, each Column's there).
    const shared: Partial<Record<"top" | "bottom", Value>> = {};
    if (cells.length > 1 && columnProps.length > 1 && columnProps.every(Boolean)) {
      for (const side of ["Top", "Bottom"] as const) {
        const lines = columnProps.map((c) => borderOf(c!, side));
        if (lines.every((l) => l && code(l) === code(lines[0]!))) shared[side.toLowerCase() as "top" | "bottom"] = lines[0]!;
      }
    }
    let index = 0;
    const outside = rowSides;
    rowSides = p ? p[1] + p[3] : 0;
    const written = columns.map((c) => {
      const at = index++;
      if (isColumn(c)) {
        const share = cells[at] ?? 1;
        const width = rowWidth !== undefined ? (share / total) * rowWidth : undefined;
        return column(c, columnProps[at]!, cells.length > 1 ? `${round((share / total) * 100)}%` : undefined, width, cells.length === 1 ? color(props, "columnsBackgroundColor") : undefined, stacks ? shared : {}, Object.keys(shared), cells.length === 1 && columnProps.filter(Boolean).length === 1);
      }
      return child(c);
    });
    const unshared = cells.length > 1 && columnProps.some((c) => c && (c.get("backgroundColor") || (["Top", "Right", "Bottom", "Left"] as const).some((side) => !shared[side.toLowerCase() as "top"] && borderOf(c, side))));
    rowSides = outside;
    if (unshared) report.push(`${where(node)}: today's stretch this Row's Columns to its height, the new email's end with their content: a Column's border or background may end higher than its neighbor's`);
    const rowBorder = Object.keys(shared).length ? { code: object(Object.entries(shared))!.slice(1, -1) } : undefined;
    // Today's side padding is outside the content (none of it shows in a wide window, and phones zero it): left out.
    const section = styleAttr([
      ["backgroundColor", color(props, "backgroundColor")],
      ["padding", p ? (p[0] || p[2] ? lit([p[0], 0, p[2], 0]) : undefined) : pad],
    ]);
    const inner =
      cells.length > 1
        ? [
            element("Row", [
              stacks ? undefined : "stackOnMobile={false}",
              styleAttr([["backgroundColor", color(props, "columnsBackgroundColor")], ["border", rowBorder]]),
              stacks && rowBorder ? mobileAttr([["border", { code: object(Object.keys(shared).map((side) => [side, lit("none")]))!.slice(1, -1) }]]) : undefined,
            ], written),
          ]
        : written;
    return element("Section", [section, hidden(props)], inner);
  }

  /** A Column's border on one side, as a line ("1px solid #BBBBBB"), or undefined where it has none. */
  function borderOf(props: Props, side: "Top" | "Right" | "Bottom" | "Left"): Value | undefined {
    const w = props.get(`border${side}Width`);
    if (!w || (isLiteral(w) && !px(w.literal))) return undefined;
    return line(w, props.get(`border${side}Style`), props.get(`border${side}Color`) ?? lit("#000000"));
  }

  /**
   * A Column. `phoneLines` are lines its Row draws on desktop, which it draws itself on phones (where it's stacked);
   * `rowLines` are the sides its Row draws, which it leaves out.
   */
  function column(node: ts.JsxElement | ts.JsxSelfClosingElement, props: Props, width: string | undefined, columnWidth: number | undefined, background?: Value, phoneLines: Partial<Record<string, Value>> = {}, rowLines: string[] = [], alone = false) {
    const pad = props.get("padding");
    const p = isLiteral(pad) ? sides(pad.literal) : pad ? undefined : [0, 0, 0, 0];
    const borders: Array<[string, Value]> = [];
    for (const side of ["Top", "Right", "Bottom", "Left"] as const) {
      const value = rowLines.includes(side.toLowerCase()) ? undefined : borderOf(props, side);
      if (value) borders.push([side.toLowerCase(), value]);
    }
    const place: Place = { column: columnWidth, room: columnWidth !== undefined && p ? columnWidth - p[1] - p[3] : undefined, outside: rowSides };
    const blocks = ts.isJsxElement(node) ? node.children.map((c) => child(c, place)).filter(Boolean) : [];
    const attributes = [
      styleAttr([
        ["width", width === undefined ? undefined : lit(width)],
        ["padding", p && p.every((side) => side === 0) ? undefined : pad],
        ["backgroundColor", color(props, "backgroundColor") ?? background],
        ["border", borders.length ? { code: object(borders)!.slice(1, -1) } : undefined],
        ["borderRadius", n(props.get("borderRadius"))],
      ]),
      columnPhone(props, node, phoneLines),
    ];
    // The only Column of a Row, with nothing of its own: its blocks are the Section's.
    if (alone && !attributes.some(Boolean)) return blocks.join("");
    return element("Column", attributes, blocks);
  }

  /** A Column's phone padding and borders. */
  function columnPhone(props: Props, at: ts.Node, lines: Partial<Record<string, Value>> = {}) {
    const m = phone(props, at);
    const border = m.get("border");
    const sides = Object.entries(lines) as Array<[string, Value]>;
    if (isLiteral(border) && border.literal && typeof border.literal === "object") {
      const b = border.literal as Record<string, unknown>;
      for (const side of ["Top", "Right", "Bottom", "Left"]) {
        const w = b[`border${side}Width`];
        if (w === undefined) continue;
        const at = sides.findIndex(([key]) => key === side.toLowerCase());
        if (at >= 0) sides.splice(at, 1);
        sides.push([side.toLowerCase(), px(w) ? line(lit(w), b[`border${side}Style`] === undefined ? undefined : lit(b[`border${side}Style`]), lit(b[`border${side}Color`] ?? "#000000")) : lit("none")]);
      }
    } else if (border) report.push(`${where(at)}: its phone border can't be read: it's left out`);
    return mobileAttr([["padding", n(m.get("padding"))], ["border", sides.length ? { code: object(sides)!.slice(1, -1) } : undefined]]);
  }

  /** A text block's phone settings: today's padding, font size, line height and alignment. */
  const textPhone = (props: Props, at: ts.Node) => {
    const m = phone(props, at);
    return mobileAttr([["padding", n(m.get("containerPadding"))], ["fontSize", n(m.get("fontSize"))], ["lineHeight", lineHeightOf(m.get("lineHeight"), at)], ["textAlign", m.get("textAlign")]]);
  };

  function heading(node: ts.JsxElement | ts.JsxSelfClosingElement, props: Props) {
    const type = props.get("headingType");
    const level = isLiteral(type) ? Number(String(type.literal).replace(/^h/, "")) || 1 : 1;
    if (type && !isLiteral(type)) report.push(`${where(node)}: headingType can't be read: it's a level 1 Heading`);
    const fontSize = given(props, "fontSize", "22px");
    return element("Heading", [
      level !== 1 && `level={${level}}`,
      dir(props),
      styleAttr(textStyle(props, fontSize, "400", "140%", node)),
      textPhone(props, node),
      hidden(props),
    ], textChildren(node, props, node, "Heading"));
  }

  /** Today's font weight (a number, a numeric string, normal, bold, lighter or bolder) as the new one's: 100 to 900 in hundreds, normal or bold. */
  function fontWeight(value: Value | undefined, at: ts.Node): Value | undefined {
    if (value && !isLiteral(value)) {
      report.push(`${where(at)}: its fontWeight is computed (${value.code}): it's kept as it is, and the new components take a number from 100 to 900 in hundreds, "normal" or "bold", not a string of digits ("700")`);
      return value;
    }
    if (!isLiteral(value) || value.literal === "normal" || value.literal === "bold") return value;
    if (value.literal === "lighter" || value.literal === "bolder") {
      const weight = value.literal === "bolder" ? 700 : 100;
      report.push(`${where(at)}: its fontWeight ${value.literal} is ${weight}, what it is beside normal text (the new components have no weight relative to the text around it)`);
      return lit(weight);
    }
    const number = typeof value.literal === "number" ? value.literal : typeof value.literal === "string" && value.literal.trim() ? Number(value.literal) : NaN;
    if (!Number.isFinite(number)) {
      report.push(`${where(at)}: its fontWeight ${JSON.stringify(value.literal)} can't be read: it's left out`);
      return undefined;
    }
    const weight = Math.min(900, Math.max(100, Math.round(number / 100) * 100));
    if (weight !== number) report.push(`${where(at)}: its fontWeight ${value.literal} is ${weight}: the new components take 100 to 900 in hundreds`);
    return lit(weight);
  }

  /**
   * Today's line height (a multiple of the font size, as a number or a string of digits; a percentage; px; em) as
   * the new one's: a multiple, a percentage or px.
   */
  function lineHeightOf(value: Value | undefined, at: ts.Node): Value | undefined {
    if (value && !isLiteral(value)) {
      report.push(`${where(at)}: its lineHeight is computed (${value.code}): it's kept as it is, and the new components take a multiple of the font size (1.5), a percentage ("150%") or px ("24px"), not a string of digits ("1.5")`);
      return value;
    }
    if (!isLiteral(value) || typeof value.literal === "number") return value;
    const text = String(value.literal).trim();
    if (/^\d*\.?\d+(px|%)$/.test(text)) return value;
    // A string of digits, or em (of the font size): the multiple it is.
    const multiple = /^(\d*\.?\d+)(em)?$/.exec(text);
    if (multiple && Number(multiple[1]) > 0) return lit(Number(multiple[1]));
    report.push(`${where(at)}: its lineHeight ${JSON.stringify(value.literal)} can't be read: it's left out`);
    return undefined;
  }

  function textStyle(props: Props, fontSize: Value | undefined, weight: string | undefined, lineHeight: string, at: ts.Node): Array<[string, Value | undefined]> {
    return [
      ["padding", n(padding(props))],
      ["fontFamily", font(props)],
      ["fontSize", n(fontSize)],
      ["fontWeight", fontWeight(given(props, "fontWeight", weight === undefined ? undefined : Number(weight)), at)],
      ["color", color(props, "color")],
      ["textAlign", props.get("textAlign")],
      ["lineHeight", lineHeightOf(given(props, "lineHeight", lineHeight), at)],
      ["letterSpacing", letterSpacing(props, fontSize, at)],
      ["textTransform", props.get("textTransform")],
    ];
  }

  function paragraph(node: ts.JsxElement | ts.JsxSelfClosingElement, props: Props, tag: "Paragraph" | "Text") {
    const fontSize = given(props, "fontSize", "14px");
    return element(tag, [dir(props), styleAttr(textStyle(props, fontSize, undefined, "140%", node)), textPhone(props, node), hidden(props)], textChildren(node, props, node, tag));
  }

  function button(node: ts.JsxElement | ts.JsxSelfClosingElement, props: Props) {
    const href = props.get("href");
    const fontSize = props.get("fontSize");
    const radius = props.get("borderRadius");
    const m = phone(props, node);
    const block = element("Button", [
      attr("href", href ?? lit("#")),
      styleAttr([
        ["width", isLiteral(props.get("width")) && (props.get("width") as { literal: unknown }).literal !== "auto" ? props.get("width") : undefined],
        ["backgroundColor", color(props, "backgroundColor")],
        ["color", color(props, "color")],
        ["fontFamily", font(props)],
        ["fontSize", n(fontSize)],
        ["fontWeight", fontWeight(props.get("fontWeight"), node)],
        ["lineHeight", lineHeightOf(props.get("lineHeight"), node)],
        ["letterSpacing", letterSpacing(props, fontSize, node)],
        ["padding", n(props.get("padding"))],
        ["borderRadius", n(radius)],
      ]),
      mobileAttr([["width", isLiteral(m.get("autoWidth")) && (m.get("autoWidth") as { literal: unknown }).literal === true ? undefined : n(m.get("width"))], ["fontSize", n(m.get("fontSize"))], ["lineHeight", lineHeightOf(m.get("lineHeight"), node)], ["padding", n(m.get("padding"))]]),
    ], textChildren(node, props, node, "Button"));
    if (!href) report.push(`${where(node)}: this Button has no href: it links to "#"`);
    return wrapped(props, block, align(props, "textAlign", "center"), node);
  }

  function image(at: ts.JsxElement | ts.JsxSelfClosingElement, props: Props, place: Place) {
    // Today's `{ url, width, height }` is the new one's `{ src, width, height }`. Without one, today's draw their
    // placeholder image: the new Image needs its src, so that's written in.
    let src = props.get("src");
    const nothing = (value: Value) => (isLiteral(value) ? value.literal === undefined || value.literal === null : /^(undefined|null)$/.test(value.code.trim()));
    if (!src || nothing(src)) {
      src = lit(PLACEHOLDER);
      report.push(`${where(at)}: this Image has no src: today's draw their placeholder image, which is written in (give it its own)`);
    }
    let natural: unknown;
    let source: Value | undefined = src;
    const node = src && !isLiteral(src) && src.node ? bare(src.node) : undefined;
    if (isLiteral(src) && src.literal && typeof src.literal === "object") {
      const { url, width, height } = src.literal as Record<string, unknown>;
      natural = width;
      const asset = Object.fromEntries(Object.entries({ src: url, width, height }).filter(([, v]) => v !== undefined));
      source = { literal: asset, code: src.code && `{ ${Object.keys(asset).map((key) => `${key}: ${src.code}.${key === "src" ? "url" : key}`).join(", ")} }` };
    } else if (node && ts.isObjectLiteralExpression(node)) {
      const parts: string[] = [];
      for (const property of node.properties) {
        if (!ts.isPropertyAssignment(property) && !ts.isShorthandPropertyAssignment(property)) continue;
        const key = property.name.getText();
        const value = ts.isPropertyAssignment(property) ? valueOf(property.initializer) : { code: key };
        if (key === "width" && isLiteral(value)) natural = value.literal;
        if (key === "url" || key === "width" || key === "height") parts.push(`${key === "url" ? "src" : key}: ${code(value)}`);
      }
      source = { code: `{ ${parts.join(", ")} }` };
    }
    // An image as wide as its column: today's make it no wider than the column less the Row's side padding.
    const full = (): Array<[string, Value | undefined]> => (place.outside && place.column !== undefined ? [["width", lit("100%")], ["maxWidth", lit(round(place.column))]] : []);
    // Today's take the first width given (width, maxWidth, then the source's maxWidth and width) as the one to draw.
    const srcMax = isLiteral(src) && src.literal && typeof src.literal === "object" ? (src.literal as Record<string, unknown>).maxWidth : undefined;
    const [givenWidth, givenMax] = [props.get("width"), props.get("maxWidth")];
    const width = givenWidth ?? givenMax ?? (srcMax === undefined ? undefined : lit(srcMax)) ?? (natural === undefined ? undefined : lit(natural));
    let size: Array<[string, Value | undefined]> = [];
    const w = isLiteral(width) ? width.literal : undefined;
    const percentGiven = typeof w === "string" && /^\s*[\d.]+%\s*$/.test(w);
    if (width && !isLiteral(width)) {
      size = [["width", width]];
      report.push(`${where(at)}: this Image's width comes from an expression: it's kept as it is, but today's draw a width in px as a share of its column, so it may come out a little narrower or wider`);
    } else if (percentGiven && parseFloat(w as string) < 100) {
      size = [["width", lit(w)]];
    } else if (width === undefined || percentGiven) {
      size = full();
    } else if (px(w) !== undefined) {
      // Today's draw a width in px as a share of the column's room (its padding and the block's taken off), at most that
      // share of the column, and no wider than the room: written out, so the image is as wide as it was.
      const pad = sides(isLiteral(padding(props)) ? (padding(props) as { literal: unknown }).literal : undefined);
      if (place.column !== undefined && place.room !== undefined && pad) {
        const percent = round((px(w)! / (place.room - pad[1] - pad[3])) * 100);
        if (percent < 100) {
          size = [["width", lit(`${percent}%`)], ["maxWidth", lit(round((percent / 100) * place.column))]];
          report.push(`${where(at)}: today's draw this Image's ${String(w)} as ${percent}% of its column, at most ${round((percent / 100) * place.column)}px: that's written out so it doesn't move (give it its width in px to draw it at that)`);
        } else size = full();
      } else {
        size = [["width", lit(px(w))]];
        report.push(`${where(at)}: this Image is ${String(w)} wide, which today's draw as a share of a column whose size isn't known here: it may come out a little narrower or wider`);
      }
    }
    // Today's phone width: the column's (autoWidth), no wider than the image is; or the width given.
    const m = phone(props, at);
    const auto = m.get("autoWidth");
    const phoneSize: Array<[string, Value | undefined]> =
      isLiteral(auto) && auto.literal === true
        ? [["width", lit("100%")], ["maxWidth", typeof natural === "number" ? lit(natural) : size.some(([key]) => key === "maxWidth") ? lit("100%") : undefined]]
        : [["width", n(m.get("width"))], ["maxWidth", n(m.get("maxWidth"))]];
    const block = element("Image", [attr("src", source), attr("alt", props.get("altText") ?? props.get("alt")), styleAttr(size), mobileAttr(phoneSize)]);
    const href = actionHref(props.get("action"), at);
    return wrapped(props, href ? element("Link", [attr("href", href)], [block]) : block, align(props, "textAlign", "center"), at);
  }

  /**
   * Today's image action as a link: a URL (which today's open in a new tab), or `{ name: "web", values: { href,
   * target } }`; anything else (an expression, an email or phone action) is reported and left out.
   */
  function actionHref(action: Value | undefined, at: ts.Node): Value | undefined {
    if (!action) return undefined;
    const value = isLiteral(action) ? action.literal : undefined;
    if (typeof value === "string" && value) return lit({ href: value, target: "_blank" });
    if (value && typeof value === "object" && (value as { name?: unknown }).name === "web") {
      const { values = {}, attrs = {} } = value as { values?: Record<string, unknown>; attrs?: Record<string, unknown> };
      const href = values.href ?? attrs.href;
      const target = values.target ?? attrs.target;
      if (typeof href === "string" && href) return lit(typeof target === "string" && target ? { href, target } : href);
    }
    report.push(`${where(at)}: this Image's action can't be read as a web link: its link is left out (put the Image in a Link)`);
    return undefined;
  }

  function divider(node: ts.JsxElement | ts.JsxSelfClosingElement, props: Props) {
    const border = line(props.get("borderTopWidth") ?? lit("1px"), props.get("borderTopStyle"), props.get("borderTopColor") ?? lit("#BBBBBB"));
    const width = props.get("width");
    const m = phone(props, node);
    const block = element("Divider", [
      styleAttr([["borderTop", border], ["width", isLiteral(width) && width.literal === "100%" ? undefined : n(width)], ["padding", n(padding(props))]]),
      mobileAttr([["padding", n(m.get("containerPadding"))], ["width", n(m.get("width"))]]),
      hidden(props),
    ]);
    return width && !(isLiteral(width) && width.literal === "100%") ? element("Column", [styleAttr([["alignItems", align(props, "textAlign", "center")]])], [block]) : block;
  }

  function social(node: ts.JsxElement | ts.JsxSelfClosingElement, props: Props) {
    const icons = props.get("icons");
    // Today's `{ name, url, target }` icons are the new one's `{ name, href }`, a target part of the link.
    const rename = (list: string) => `${list}.map(({ name, url }) => ({ name, href: url }))`;
    const target = (icon: { target?: unknown }) => (icon.target === "_blank" || icon.target === "_self" ? icon.target : undefined);
    const literal = isLiteral(icons) && Array.isArray(icons.literal) ? (icons.literal as Array<{ name: string; url: string; target?: unknown }>) : undefined;
    for (const icon of literal ?? []) {
      if (icon.target !== undefined && !target(icon)) report.push(`${where(node)}: an icon's target ${JSON.stringify(icon.target)} is left out: a link opens in a new window ("_blank") or in its own ("_self")`);
    }
    if (icons && !literal) report.push(`${where(node)}: this Social's icons are computed (${code(icons)}): each one's url is its href, and a target it has is left out`);
    const list: Value | undefined = literal
      ? { literal: literal.map((icon) => ({ name: icon.name, href: target(icon) ? { href: icon.url, target: target(icon) } : icon.url })), code: icons!.code && !literal.some(target) ? rename(icons!.code) : undefined }
      : icons && { code: rename(code(icons)) };
    const block = element("Social", [
      attr("icons", list ?? lit([])),
      attr("iconType", props.get("iconType")),
      attr("size", n(props.get("iconSize"))),
      styleAttr([["gap", n(props.get("spacing"))], ["justifyContent", alignOf(props.get("align"))]]),
    ]);
    if (!icons) report.push(`${where(node)}: this Social has no icons`);
    return wrapped(props, block, undefined, node);
  }

  /** Today's Menu items (`{ text, href, target }`) as the new ones: a target is part of the link (`{ href, target }`). */
  function menuItems(items: Value | undefined, at: ts.Node): Value | undefined {
    const targeted = (item: unknown): item is Record<string, unknown> => !!item && typeof item === "object" && "target" in item;
    if (items && !isLiteral(items)) {
      report.push(`${where(at)}: this Menu's items are computed (${items.code}): they're kept as they are, and an item's target is part of its link now ({ text, href: { href, target } }), not a field of its own`);
      return items;
    }
    if (!isLiteral(items) || !Array.isArray(items.literal) || !items.literal.some(targeted)) return items;
    if (items.code) report.push(`${where(at)}: ${items.code}'s items are written here, each target part of its link`);
    return lit(
      items.literal.map((item: unknown) => {
        if (!targeted(item)) return item;
        const { target, ...rest } = item;
        if (target === "_blank" || target === "_self") return { ...rest, href: { href: rest.href, target } };
        report.push(`${where(at)}: a Menu item's target ${JSON.stringify(target)} is left out: a link opens in a new window ("_blank") or in its own ("_self")`);
        return rest;
      })
    );
  }

  function menu(node: ts.JsxElement | ts.JsxSelfClosingElement, props: Props) {
    const items = menuItems(props.get("items"), node);
    const fontSize = given(props, "fontSize", "14px");
    const m = phone(props, node);
    const layout = props.get("layout");
    const separator = props.get("separator");
    const links = isLiteral(items) && Array.isArray(items.literal) ? (items.literal as Array<{ text?: unknown; href?: unknown }>) : undefined;
    const known = (value: Value | undefined) => !value || (isLiteral(value) && value.code === undefined);
    if (links && links.every((item) => item && typeof item === "object" && typeof item.text === "string") && known(separator) && (!layout || (isLiteral(layout) && layout.literal === "horizontal"))) {
      return wrapped(props, menuRow(node, props, links as Array<{ text: string; href?: unknown }>, separator && String((separator as { literal: unknown }).literal), fontSize, m, items!), undefined, node);
    }
    const block = element("Menu", [
      attr("items", items ?? lit([])),
      attr("separator", props.get("separator")),
      attr("layout", props.get("layout")),
      styleAttr([
        ["color", color(props, "linkColor")],
        ["separatorColor", color(props, "textColor")],
        ["fontFamily", font(props)],
        ["fontSize", n(fontSize)],
        ["fontWeight", fontWeight(props.get("fontWeight"), node)],
        ["letterSpacing", letterSpacing(props, fontSize, node)],
        ["padding", n(props.get("padding"))],
        ["justifyContent", alignOf(props.get("align"))],
      ]),
      mobileAttr([["fontSize", n(m.get("fontSize"))]]),
    ]);
    if (m.get("padding")) report.push(`${where(node)}: its phone padding is left out: the new Menu's links keep their padding on phones`);
    report.push(`${where(node)}: today's Menu puts a space between its links on top of their padding (a few px); the new one spaces them by their padding alone`);
    return wrapped(props, block, undefined, node);
  }

  /**
   * A horizontal menu of known links as today's draws it: each link, and each separator, in the links' padding, with a
   * space between each two on top of it, in the font around them. The new Menu spaces its links by their padding alone
   * (a separator has none of its own), and no style of its holds a font's space; so the menu is written as the new
   * Menu draws one (a Row that wraps, each link and separator a Text in the links' padding, separators left out on
   * phones), with a non-breaking space before each but the first where today's space is. On phones today's separators
   * are gone and one space stays between two links, as here.
   */
  function menuRow(node: ts.JsxElement | ts.JsxSelfClosingElement, props: Props, links: Array<{ text: string; href?: unknown }>, separator: string | undefined, fontSize: Value | undefined, m: Props, items: Value) {
    if (isLiteral(items) && items.code) report.push(`${where(node)}: ${items.code}'s links are written here, each a Link of its own`);
    report.push(`${where(node)}: written as a Row of its links, spaced as today's Menu spaces them (the new Menu leaves out the space today's puts between its links): in the visual editor it's a row of text, not a Menu`);
    const box = (extra: Array<[string, Value | undefined]> = []) => [
      styleAttr([["flex", lit("none")], ["padding", n(props.get("padding")) ?? lit([5, 15])], ...extra]),
      mobileAttr([["padding", n(m.get("padding"))]]),
    ];
    const nbsp = (text: string) => `{${JSON.stringify(`\u00a0${text}`).replace(/\u00a0/g, "\\u00a0")}}`;
    const linkColor = color(props, "linkColor") ?? lit("#0068A5");
    const children = links.flatMap((item, index) => [
      ...(index && separator ? [element("Text", ["hidden={{ mobile: true }}", ...box([["color", color(props, "textColor") ?? lit("#444444")]])], [nbsp(separator)])] : []),
      element("Text", box(), [element("Link", [attr("href", lit(item.href ?? "")), styleAttr([["color", linkColor], ["textDecoration", lit("none")]])], [index ? nbsp(item.text) : plain(item.text)])]),
    ]);
    return element(
      "Row",
      [
        "stackOnMobile={false}",
        styleAttr([
          ["flexWrap", lit("wrap")],
          ["justifyContent", alignOf(props.get("align")) ?? lit("center")],
          ["fontFamily", font(props)],
          ["fontSize", n(fontSize)],
          ["fontWeight", fontWeight(props.get("fontWeight"), node)],
          ["letterSpacing", letterSpacing(props, fontSize, node)],
          ["lineHeight", lit(1.2)],
        ]),
        mobileAttr([["fontSize", n(m.get("fontSize"))]]),
      ],
      children
    );
  }

  function video(node: ts.JsxElement | ts.JsxSelfClosingElement, props: Props) {
    const src = props.get("videoUrl") ?? props.get("url");
    if (!src) {
      props.forEach((_, prop) => props.used.add(prop));
      report.push(`${where(node)}: this Video's link can't be read (give it videoUrl): it's left out`);
      return "";
    }
    return wrapped(props, element("Video", [attr("src", src)]), undefined, node);
  }

  // ─── The walk ──────────────────────────────────────────────────────────────

  /** Today's component an element is, or undefined (another component, or a name declared again where it's used). */
  function todays(node: ts.JsxElement | ts.JsxSelfClosingElement): string | undefined {
    const name = local.get(tagName(node));
    return name && !shadowed(leftmost(opening(node).tagName)) ? name : undefined;
  }
  function tagName(node: ts.JsxElement | ts.JsxSelfClosingElement): string {
    return opening(node).tagName.getText();
  }
  function opening(node: ts.JsxElement | ts.JsxSelfClosingElement): ts.JsxOpeningLikeElement {
    return ts.isJsxElement(node) ? node.openingElement : node;
  }

  /** A child of today's component, as the new JSX (text, an expression with today's JSX inside it rewritten, or an element). */
  function child(node: ts.JsxChild, place: Place = {}): string {
    if (ts.isJsxText(node)) return node.text;
    if (ts.isJsxExpression(node)) return node.expression ? `{${rewrite(node.expression)}}` : node.getText();
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) return convert(node, place);
    return node.getText();
  }

  let body: number | undefined;
  /** The side padding of the Row being written. */
  let rowSides = 0;
  /** One of today's elements as the new JSX; another element as it is, today's elements inside it rewritten. */
  function convert(node: ts.JsxElement | ts.JsxSelfClosingElement, place: Place = {}): string {
    const name = todays(node);
    if (!name) return rewrite(node);
    const props = propsOf(opening(node));
    const out = written(name, node, props, place);
    // An element of a list (`items.map(...)`): its key the new element's.
    const key = props.get("key");
    if (!key) return out;
    if (/^<[A-Z]/.test(out)) return out.replace(/^<[\w.]+/, (tag) => `${tag} key={${code(key)}}`);
    report.push(`${where(node)}: its key is left out: it's migrated to no element of its own`);
    return out;
  }

  function written(name: string, node: ts.JsxElement | ts.JsxSelfClosingElement, props: Props, place: Place): string {
    const children = () => (ts.isJsxElement(node) ? node.children.map((c) => child(c, place)).filter(Boolean) : []);
    switch (name) {
      case "Email":
      case "Page": {
        const width = props.get("contentWidth");
        const outer = body;
        body = width ? (isLiteral(width) ? px(width.literal) : undefined) : 500;
        const out = root(name, props, children());
        body = outer;
        return out;
      }
      case "Row":
        return row(node, props, body);
      case "Column":
        return column(node, props, undefined, undefined);
      case "Heading":
        return heading(node, props);
      case "Paragraph":
      case "Text":
        return paragraph(node, props, name);
      case "Button":
        return button(node, props);
      case "Image":
        return image(node, props, place);
      case "Divider":
        return divider(node, props);
      case "Social":
        return social(node, props);
      case "Menu":
        return menu(node, props);
      case "Video":
        return video(node, props);
      default:
        props.forEach((_, prop) => props.used.add(prop));
        report.push(`${where(node)}: <${name}> has no new component yet: it's left out (write it with the new components, or keep this template on today's API)`);
        return `{/* @unlayer/migrate: <${name}> isn't migrated: ${node.getText().replace(/\*\//g, "* /").slice(0, 120)}… */}`;
    }
  }

  /** Converted JSX where an expression goes (`show && <Html />`, `return <Html />`): a placeholder there is a comment and `null`, nothing is `null`. */
  const asExpression = (out: string) => (out === "" ? "null" : out.startsWith("{/*") ? `${out.slice(1, -1)} null` : out);

  /** Source text with today's JSX inside it rewritten. */
  function rewrite(node: ts.Node): string {
    const edits: Array<{ start: number; end: number; text: string }> = [];
    const visit = (n: ts.Node) => {
      // One of today's layouts (a constant for a Row's layout): its cells, as the Row reads them.
      const cells = layoutCells(n);
      if (cells) {
        edits.push({ start: n.getStart(), end: n.getEnd(), text: `{ cells: ${JSON.stringify(cells)} }` });
        return;
      }
      if ((ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n)) && todays(n)) {
        const among = ts.isJsxElement(n.parent) || ts.isJsxFragment(n.parent);
        edits.push({ start: n.getStart(), end: n.getEnd(), text: among ? convert(n) : asExpression(convert(n)) });
        return;
      }
      ts.forEachChild(n, visit);
    };
    // Called on an expression (a prop's value, `{...}` in JSX, a template literal's hole): what it's converted to goes there.
    if ((ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) && todays(node)) return asExpression(convert(node));
    const cells = layoutCells(node);
    if (cells) return `{ cells: ${JSON.stringify(cells)} }`;
    ts.forEachChild(node, visit);
    let text = node.getText();
    const start = node.getStart();
    for (const edit of edits.sort((a, b) => b.start - a.start)) text = text.slice(0, edit.start - start) + edit.text + text.slice(edit.end - start);
    return text;
  }

  // The module: its imports of today's components replaced, its JSX rewritten.
  const edits: Array<{ start: number; end: number; text: string }> = [];
  for (const statement of file.statements) {
    if (imports.some((entry) => entry.statement === statement)) continue;
    const text = rewrite(statement);
    if (text !== statement.getText()) edits.push({ start: statement.getStart(), end: statement.getEnd(), text });
  }
  // What today's components had that the new JSX doesn't use.
  for (const [opening, props] of read) {
    const component = `<${local.get(opening.tagName.getText()) ?? opening.tagName.getText()}>`;
    const settings = phones.get(props)?.settings;
    const left = [...props.unused().filter((name) => name !== "key"), ...(settings?.unused().map((name) => `mobile.${name}`) ?? [])];
    if (left.length) report.push(`${where(opening)}: ${component}'s ${left.join(", ")} ${left.length > 1 ? "aren't migrated: they're" : "isn't migrated: it's"} left out (the new components have nothing ${left.length > 1 ? "they become" : "it becomes"})`);
  }
  // In the order of the lines (a stable sort: lines of one place stay in the order they were found).
  const lineOf = (entry: string) => Number(/^line (\d+):/.exec(entry)?.[1] ?? 0);
  report.sort((a, b) => lineOf(a) - lineOf(b));
  // None of today's JSX or layouts in it (today's other API, a name passed on): nothing to migrate, so it's left as it is.
  if (!edits.length) return { code: source, report };

  const to = options.to ?? DEFAULT_TO;
  const imported = [...used].sort().map((component) => (nameOf(component) === component ? component : `${component} as ${nameOf(component)}`));
  const added = imported.length ? `import { ${imported.join(", ")} } from ${JSON.stringify(to)};` : "";
  imports.forEach(({ statement, kept }, index) => {
    const rest = kept.length ? `import ${kept.join(", ")} from ${JSON.stringify((statement.moduleSpecifier as ts.StringLiteral).text)};` : "";
    edits.push({ start: statement.getStart(), end: statement.getEnd(), text: [index === 0 ? added : "", rest].filter(Boolean).join("\n") });
  });
  // Today's imports all stay (a namespace used for more than its components): the new import goes before them.
  const first = file.statements.find(todaysImport);
  if (!imports.length && added && first) edits.push({ start: first.getStart(), end: first.getStart(), text: `${added}\n` });
  let out = source;
  for (const edit of edits.sort((a, b) => b.start - a.start)) out = out.slice(0, edit.start) + edit.text + out.slice(edit.end);
  // JavaScript is formatted as JavaScript: TypeScript written into it would be an error here, not in the project.
  return { code: typescript ? await formatTsx(out) : await prettier.format(out, { parser: "babel", printWidth: 100 }), report };
}
