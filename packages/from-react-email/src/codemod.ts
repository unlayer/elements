/**
 * Codemod mode: rewrite a React Email template's source into an Elements
 * component that keeps the template's props, loops and conditions.
 *
 * Only the import and the returned JSX change. JSX inside expressions
 * (`{items.map(…)}`, `{cond && …}`) is converted in place, so the logic stays.
 * Styles are read statically (object literals, module constants, Tailwind
 * classes); what can't be read is reported.
 */

import ts from "typescript";
import {
  decodeHtmlEntities,
  SLOT_CLOSE,
  SLOT_OPEN,
  el,
  expr,
  fallbackHtml,
  formatTsx,
  hole,
  isExpr,
  printJsx,
  ReportBuilder,
  type ConversionReport,
  type ElementNode,
  type Expr,
} from "@unlayer/convert-core";
import { borders, boxStyle, columnWidth, drawsBox, mergeColumnAndBox, mergeRowAndColumn, noteVerticalAlign, textBox, noteTextBox, needsTextBox, wrapPadding } from "./boxes";
import { layout, NO_STYLE, type BoxNode, type ColumnNode, type ColumnsHole, type Flow, type RowNode } from "./layout";
import {
  buttonBlock,
  collapse,
  dividerBlock,
  headingBlock,
  headingMarginProps,
  imageBlock,
  fontStylesheets,
  importedStylesheets,
  hasWidth,
  inheritedStyle,
  noteAttributes,
  paragraphBlock,
  INHERITED,
  LIST_DEFAULTS,
  spanStyle,
  loopMargins,
  type Block,
  type FontSpec,
  type Content,
  type MapCtx,
  type Parts,
} from "./map";
import { addSides, backgroundColor, backgroundImage, boxSides, color, fillColor, fontFamilyProp, fontSizePx, inherit, isHidden, margins, noteContainerWidth, pageColor, phoneOnly, px, shownOnPhones, toPx, ZERO, type Style } from "./styles";
import { inlineLocalComponents, type ModuleLoader } from "./components";
import { inlineLocalJsx } from "./inline";
import { splitConditionalClasses } from "./variants";
import { phoneSides, withPhoneStyles, handledPhoneClass, unheldPhoneStyles } from "./phone-styles";
import { addRules, classStyle, NO_CLASSES, overInline, phoneRules, resolveTailwind, stacksOnPhones, stylesheetRules, underInline, type ResolvedClasses, type RuleOrder } from "./tailwind";

export interface CodemodResult {
  code: string;
  report: ConversionReport;
}

type Ctx = MapCtx;

const STRUCTURE = new Set(["Row", "Column", "Section", "Container"]);
const BOXES = new Set(["Container", "Body", "Html", "Tailwind", "Section"]);
const HOST_CONTENT = new Set(["p", "h1", "h2", "h3", "h4", "h5", "h6", "img", "hr", "a", "ul", "ol"]);

/** A JSX element read statically. */
interface Jsx {
  node: ts.JsxElement | ts.JsxSelfClosingElement;
  /** React Email component name, or undefined for HTML / user components. */
  name?: string;
  tag: string;
  attrs: Map<string, ts.Expression | undefined>;
  style: Style;
  children: ts.JsxChild[];
  /** Props that must be preserved by rendering the original JSX. */
  opaqueProps: boolean;
}

const SKIP = new Set(["Head", "Font", "Preview", "head", "style", "meta", "title", "link", "script"]);
const INLINE_TAGS = new Set(["span", "strong", "b", "em", "i", "br", "small", "u", "code", "sup", "sub"]);

export interface CodemodOptions {
  fileName?: string;
  /**
   * Reads a module the template imports, so components it imports from
   * other files can be inlined too (see components.ts). The CLI passes one
   * that reads the project's files.
   */
  loadModule?: ModuleLoader;
  /**
   * The template's Tailwind config, when the source's isn't a plain literal
   * (plugins, imported presets). Get it with `findTailwind`.
   */
  tailwindConfig?: Record<string, unknown>;
  /** The template's own <Tailwind> (from `findTailwind`), to resolve classes as it does. */
  tailwind?: unknown;
}

export async function convertSource(source: string, options: CodemodOptions = {}): Promise<CodemodResult> {
  const fileName = options.fileName ?? "template.tsx";
  // Source-level preparation: React Email components by name, same-file
  // components and JSX constants where they're used, and conditional
  // classNames as one element per class list.
  // (Same lines as the source: `Email.Text` → `Text`.)
  const named = nameNamespaces(source, fileName);
  const components = inlineLocalComponents(named, fileName, options.loadModule);
  const constants = inlineLocalJsx(components.source, fileName);
  const variants = splitConditionalClasses(constants.source, fileName);
  const file = ts.createSourceFile(fileName, variants.source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const converter = new Converter(file, options.tailwindConfig, /\.(?:jsx?|mjs|cjs)$/i.test(fileName), options.tailwind);
  return converter.run({ components: components.inlined, constants: constants.inlined, variants: variants.split, copied: components.copied, original: named });
}

/**
 * `import * as Email from "@react-email/components"` with `<Email.Text>`:
 * named imports instead (`import { Text } from …`, `<Text>`), so the codemod
 * finds the components. A name the file already uses gets an alias
 * (`EmailText`). Left as it is when the namespace is used other than as
 * `Email.Name`.
 */
function nameNamespaces(source: string, fileName: string): string {
  const file = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const edits: Array<{ from: number; to: number; text: string }> = [];
  const identifiers: ts.Identifier[] = [];
  const collect = (node: ts.Node) => {
    if (ts.isIdentifier(node)) identifiers.push(node);
    ts.forEachChild(node, collect);
  };
  collect(file);
  for (const statement of file.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier) || !isReactEmailModule(statement.moduleSpecifier.text)) continue;
    const clause = statement.importClause;
    const bindings = clause?.namedBindings;
    if (!clause || clause.name || !bindings || !ts.isNamespaceImport(bindings)) continue;
    const namespace = bindings.name.text;
    // Each use: `Email.Text` (a value or tag) or `Email.TextProps` (a type).
    const uses: Array<{ node: ts.PropertyAccessExpression | ts.QualifiedName; member: string; type: boolean }> = [];
    let other = false;
    for (const id of identifiers) {
      if (id.text !== namespace || id === bindings.name) continue;
      const parent = id.parent;
      if (ts.isPropertyAccessExpression(parent) && parent.expression === id && ts.isIdentifier(parent.name)) uses.push({ node: parent, member: parent.name.text, type: false });
      else if (ts.isQualifiedName(parent) && parent.left === id) uses.push({ node: parent, member: parent.right.text, type: !ts.isTypeQueryNode(parent.parent) });
      else other = true;
    }
    if (other || !uses.length) continue;
    const members = [...new Set(uses.map((u) => u.member))];
    // Names the file uses besides these members.
    const memberNodes = new Set(uses.map((u) => (ts.isPropertyAccessExpression(u.node) ? u.node.name : u.node.right)));
    const taken = new Set(identifiers.filter((id) => !memberNodes.has(id) && id.text !== namespace).map((id) => id.text));
    const local = new Map(members.map((m) => [m, taken.has(m) ? `${namespace}${m}` : m]));
    if (members.some((m) => local.get(m) !== m && taken.has(local.get(m)!))) continue;
    const specifiers = members.map((m) => {
      const type = uses.filter((u) => u.member === m).every((u) => u.type);
      return `${type && !clause.isTypeOnly ? "type " : ""}${local.get(m) === m ? m : `${m} as ${local.get(m)}`}`;
    });
    edits.push({ from: bindings.getStart(), to: bindings.getEnd(), text: `{ ${specifiers.join(", ")} }` });
    for (const use of uses) edits.push({ from: use.node.getStart(), to: use.node.getEnd(), text: local.get(use.member)! });
  }
  edits.sort((a, b) => b.from - a.from);
  for (const edit of edits) source = source.slice(0, edit.from) + edit.text + source.slice(edit.to);
  return source;
}

/** `undefined` or `null`, which a spread adds nothing from (an optional prop left out, once inlined). */
function nothing(expression: ts.Expression): boolean {
  const node = unwrap(expression);
  return (ts.isIdentifier(node) && node.text === "undefined") || node.kind === ts.SyntaxKind.NullKeyword;
}

/** Packages React Email components are imported from: `react-email` and `@react-email/*`. */
function isReactEmailModule(from: string): boolean {
  return from === "react-email" || from.startsWith("@react-email/");
}

class Converter {
  private readonly report = new ReportBuilder();
  private readonly components = new Map<string, string>();
  /** Where each React Email import comes from (`react-email`, `@react-email/components`, …), and which are types. */
  private readonly componentSources = new Map<string, { from: string; type: boolean }>();
  private readonly constants = new Map<string, ts.Expression>();
  private readonly checker: ts.TypeChecker;
  private tailwind: ResolvedClasses = NO_CLASSES;
  private needsEscape = false;
  private needsHtmlText = false;
  private needsAttribute = false;
  private needsPlainText = false;
  private plainTextName = "plainText";
  /** The functions the migrated file gets, by names the template doesn't use already. */
  private readonly helper = { escapeHtml: "escapeHtml", htmlText: "htmlText", htmlAttribute: "htmlAttribute", renderToStaticMarkup: "renderToStaticMarkup", reactStaticMarkup: "reactStaticMarkup" };
  private needsStaticMarkup = false;
  /** Module constants copied in with imported components: dropped if the output doesn't use them. */
  private copied: string[] = [];
  private original?: string;
  /** Lines of `file` → lines of `original` (see lineMap). */
  private lines?: number[];
  /** Source ranges copied into the output as-is (fallbacks). */
  private readonly fallbackRanges: Array<{ from: number; to: number }> = [];
  /** Rules on a single class from the head's <style>: desktop, and phone media queries. */
  private readonly headClasses = new Map<string, Style>();
  private readonly headImportant = new Map<string, Set<string>>();
  private readonly headPhoneImportant = new Map<string, Set<string>>();
  private readonly headPhone = new Map<string, Style>();
  private readonly headOrder: RuleOrder = new Map();
  private readonly phoneNoted = new Set<string>();
  private mutations?: Set<ts.Symbol>;
  /** Statements added before a return (a `dir` worked out once): where, and the code. */
  private readonly hoisted: Array<{ at: number; text: string }> = [];
  /** Style values computed at render time, by where they are in the source. */
  private readonly droppedStyles: Array<{ from: number; to: number; detail: string }> = [];


  constructor(
    private readonly file: ts.SourceFile,
    private readonly tailwindConfig?: Record<string, unknown>,
    private readonly javascript = false,
    private readonly tailwindComponent?: unknown,
  ) {
    const names = new Set(file.getFullText().match(/\b[A-Za-z_$][\w$]*/g));
    while (names.has(this.plainTextName)) this.plainTextName = `_${this.plainTextName}`;
    for (const key of Object.keys(this.helper) as Array<keyof typeof this.helper>) while (names.has(this.helper[key])) this.helper[key] = `_${this.helper[key]}`;
    // Bind this source without resolving dependencies. The checker still
    // distinguishes module constants from parameters, locals and loop bindings.
    const options: ts.CompilerOptions = { noLib: true, noResolve: true };
    const host = ts.createCompilerHost(options);
    host.getSourceFile = () => file;
    this.checker = ts.createProgram([file.fileName], options, host).getTypeChecker();
  }

  async run(prepared: {
    components: string[];
    constants: string[];
    variants: number;
    copied: string[];
    /** The template as written, before its components were inlined (React Email components by name). */
    original?: string;
  }): Promise<CodemodResult> {
    this.copied = prepared.copied;
    this.original = prepared.original;
    for (const name of prepared.components) this.report.info("local component inlined where it's used", name);
    for (const name of prepared.constants) this.report.info("local JSX constant inlined where it's used", name);
    if (prepared.variants) this.report.info("conditional className split into one element per class list", String(prepared.variants));
    this.readModule();
    const component = this.findComponent();
    if (!component) throw new Error("No default-exported component found");
    const returned = this.returnedJsx(component);
    if (!returned.length)
      throw new Error("Couldn't find the JSX the component returns");

    this.tailwind = await this.resolveClasses(this.file);
    const conversions = returned.map((expression) => ({
      expression,
      tree: this.root(expression),
    }));
    // A computed style is lost where its element became Elements; one kept as HTML keeps it.
    for (const dropped of this.droppedStyles) {
      if (!this.fallbackRanges.some((r) => dropped.from >= r.from && dropped.to <= r.to)) this.report.lostStyle(dropped.detail);
    }
    const report = this.report.finish(
      el(
        "Email",
        {},
        conversions.map((c) => c.tree),
      ),
    );
    const code = await this.emit(conversions);
    return { code, report };
  }

  // ============================================
  // Module
  // ============================================

  private readModule(): void {
    for (const statement of this.file.statements) {
      if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier)) {
        const from = statement.moduleSpecifier.text;
        if (!isReactEmailModule(from)) continue;
        const bindings = statement.importClause?.namedBindings;
        if (bindings && ts.isNamedImports(bindings)) {
          for (const spec of bindings.elements) {
            this.components.set(spec.name.text, (spec.propertyName ?? spec.name).text);
            this.componentSources.set(spec.name.text, { from, type: !!statement.importClause?.isTypeOnly || spec.isTypeOnly });
          }
        }
      }
      if (ts.isVariableStatement(statement)) {
        for (const decl of statement.declarationList.declarations) {
          if (ts.isIdentifier(decl.name) && decl.initializer) this.constants.set(decl.name.text, decl.initializer);
        }
      }
    }
  }

  private findComponent(): ts.FunctionLikeDeclaration | undefined {
    const wrappers = new Set<string>();
    const namespaces = new Set<string>();
    for (const statement of this.file.statements) {
      if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier) || statement.moduleSpecifier.text !== "react") continue;
      const clause = statement.importClause;
      if (clause?.name) namespaces.add(clause.name.text);
      const bindings = clause?.namedBindings;
      if (bindings && ts.isNamespaceImport(bindings)) namespaces.add(bindings.name.text);
      if (bindings && ts.isNamedImports(bindings)) {
        for (const spec of bindings.elements) {
          if (["memo", "forwardRef"].includes((spec.propertyName ?? spec.name).text)) wrappers.add(spec.name.text);
        }
      }
    }
    const seen = new Set<string>();
    const resolve = (expression: ts.Expression): ts.FunctionLikeDeclaration | undefined => {
      const value = unwrap(expression);
      if (ts.isArrowFunction(value) || ts.isFunctionExpression(value)) return value;
      if (ts.isCallExpression(value) && value.arguments.length) {
        const callee = unwrap(value.expression);
        const wrapper = ts.isIdentifier(callee) ? wrappers.has(callee.text)
          : ts.isPropertyAccessExpression(callee) && ts.isIdentifier(callee.expression) && namespaces.has(callee.expression.text) && ["memo", "forwardRef"].includes(callee.name.text);
        if (wrapper) return resolve(value.arguments[0]);
      }
      if (!ts.isIdentifier(value) || seen.has(value.text)) return undefined;
      seen.add(value.text);
      for (const statement of this.file.statements) {
        if (ts.isFunctionDeclaration(statement) && statement.name?.text === value.text) return statement;
      }
      const initializer = this.constants.get(value.text);
      return initializer ? resolve(initializer) : undefined;
    };
    for (const statement of this.file.statements) {
      if (ts.isFunctionDeclaration(statement) && hasModifier(statement, ts.SyntaxKind.DefaultKeyword)) return statement;
      if (ts.isExportAssignment(statement) && !statement.isExportEquals) return resolve(statement.expression);
    }
    return undefined;
  }

  private returnedJsx(fn: ts.FunctionLikeDeclaration): ts.Expression[] {
    if (!fn.body) return [];
    const returns: ts.Expression[] = [];
    const add = (expression: ts.Expression): void => {
      const value = unwrap(expression);
      if (ts.isConditionalExpression(value)) {
        add(value.whenTrue);
        add(value.whenFalse);
      } else if (!rendersNothing(value)) returns.push(value);
      // `return null` (an early exit) renders nothing: it stays as written.
    };
    if (!ts.isBlock(fn.body)) {
      add(fn.body);
      return returns;
    }
    const visit = (node: ts.Node): void => {
      // A callback/helper has its own returns, converted only where used.
      if (ts.isFunctionLike(node)) return;
      if (ts.isReturnStatement(node)) {
        if (node.expression) add(node.expression);
        return;
      }
      ts.forEachChild(node, visit);
    };
    visit(fn.body);
    return returns;
  }

  private async resolveClasses(fn: ts.Node): Promise<ResolvedClasses> {
    const classes: string[] = [];
    // A shared class list may appear on components with different phone props.
    const classOwners = new Map<string, Set<string>>();
    let config: Record<string, unknown> | undefined;
    let usesTailwind = false;
    const component = this.findComponent();
    const visit = (node: ts.Node) => {
      // A class list in an object spread onto an element (`const shared = { className: "…" }`) is resolved too.
      if (ts.isPropertyAssignment(node) && node.name.getText() === "className") {
        const value = this.evaluate(node.initializer);
        if (typeof value === "string") classes.push(value);
      }
      if (ts.isJsxAttribute(node) && node.name.getText() === "className") {
        const value = this.attrValue(node.initializer) ?? this.classList(node.initializer);
        // A class-list call's classes picked from values (`active && "font-bold"`) can't be kept: lost.
        const call = node.initializer && ts.isJsxExpression(node.initializer) ? node.initializer.expression : undefined;
        if (call && this.classListCall(call) && call.arguments.some((arg) => typeof this.evaluate(arg) !== "string" && !nothing(arg))) this.lose(node, node.getText());
        const owner = node.parent.parent;
        if (typeof value === "string") {
          classes.push(value);
          if (ts.isJsxOpeningElement(owner) || ts.isJsxSelfClosingElement(owner)) {
            const names = classOwners.get(value) ?? new Set<string>();
            names.add(this.components.get(owner.tagName.getText()) ?? owner.tagName.getText());
            classOwners.set(value, names);
          }
        } else if (node.initializer) {
          // Classes built from values (`text-${tone}-500`), or picked by a value (`plan === "pro" ? "…" : undefined`,
          // `active && "…"`, `tones[level]`), can't be kept: lost, the check fails. One that comes to nothing
          // (`(true) ? undefined : "mb-9"` once inlined) has none; a component's own prop passed on is noted.
          const expression = ts.isJsxExpression(node.initializer) ? node.initializer.expression : undefined;
          const inner = expression && unwrap(expression);
          const built = inner && (ts.isTemplateExpression(inner) || (ts.isBinaryExpression(inner) && inner.operatorToken.kind === ts.SyntaxKind.PlusToken));
          const picked =
            inner &&
            (ts.isConditionalExpression(inner) ||
              ts.isElementAccessExpression(inner) ||
              (ts.isBinaryExpression(inner) && [ts.SyntaxKind.AmpersandAmpersandToken, ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken].includes(inner.operatorToken.kind)));
          if (expression && this.comesToNothing(expression)) {
            // No classes.
          } else if (built || picked) this.lose(node, node.getText());
          else if (!(expression && this.classListCall(expression))) this.report.note("dynamic className", node.initializer.getText().slice(0, 60));
        }
      }
      if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && this.components.get(node.tagName.getText()) === "Tailwind") {
        const attr = node.attributes.properties.find((p) => ts.isJsxAttribute(p) && p.name.getText() === "config") as ts.JsxAttribute | undefined;
        usesTailwind = true;
        const value = attr ? this.attrValue(attr.initializer) : undefined;
        // A config built from props or the component's own values differs from one render to the next: it can't be frozen.
        const configCode = attr?.initializer && ts.isJsxExpression(attr.initializer) ? attr.initializer.expression : undefined;
        if (configCode && value === undefined && component && this.declaredInside(configCode, component)) {
          throw new Error("Can't convert a <Tailwind> config built from props or values inside the component: the migrated template's styles are fixed. Build the config from module-level values");
        }
        if (value && typeof value === "object") config = value as Record<string, unknown>;
        else if (attr && !this.tailwindConfig) this.report.note("tailwind config not static; default config used");
      }
      ts.forEachChild(node, visit);
    };
    visit(fn);
    // Without <Tailwind>, class names are plain CSS classes: nothing to resolve.
    if (!usesTailwind) return NO_CLASSES;
    const resolved = await resolveTailwind(classes, this.tailwindConfig ?? config, this.tailwindComponent);
    for (const [list, rest] of resolved.leftover) {
      for (const cls of rest) if (![...(classOwners.get(list) ?? [""])].every(name => handledPhoneClass(cls, resolved.phone, name))) this.report.note("tailwind class not inlined", cls);
    }
    return resolved;
  }

  // ============================================
  // Static values
  // ============================================

  /** Evaluate literals, object/array literals and module constants. */
  /** Whether a value is nothing (`undefined`, `null`, `false`) wherever it renders: through conditions it can work out. */
  private comesToNothing(expression: ts.Expression): boolean {
    const node = unwrap(expression);
    if (nothing(node) || node.kind === ts.SyntaxKind.FalseKeyword) return true;
    if (ts.isConditionalExpression(node)) {
      const test = this.truthy(node.condition, 0);
      return test !== undefined && this.comesToNothing(test ? node.whenTrue : node.whenFalse);
    }
    return false;
  }

  private evaluate(node: ts.Expression | undefined, depth = 0): unknown {
    if (!node || depth > 20) return undefined;
    node = unwrap(node);
    // A JSX attribute's string has its HTML entities decoded (`&amp;` is `&`), as JSX reads it.
    if (ts.isStringLiteral(node) && ts.isJsxAttribute(node.parent)) return decodeHtmlEntities(node.text);
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
    if (ts.isTemplateExpression(node)) {
      let text = node.head.text;
      for (const span of node.templateSpans) {
        const value = this.evaluate(span.expression, depth + 1);
        if (typeof value !== "string" && typeof value !== "number") return undefined;
        text += String(value) + span.literal.text;
      }
      return text;
    }
    if (ts.isNumericLiteral(node)) return Number(node.text);
    if (ts.isConditionalExpression(node)) {
      const test = this.truthy(node.condition, depth + 1);
      return test === undefined ? undefined : this.evaluate(test ? node.whenTrue : node.whenFalse, depth + 1);
    }
    if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
    if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
    if (node.kind === ts.SyntaxKind.NullKeyword) return null;
    if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken) {
      const value = this.evaluate(node.operand, depth + 1);
      return typeof value === "number" ? -value : undefined;
    }
    if (ts.isIdentifier(node)) {
      const value = this.constants.get(node.text);
      const binding = ts.isShorthandPropertyAssignment(node.parent)
        ? this.checker.getShorthandAssignmentValueSymbol(node.parent)
        : this.checker.getSymbolAtLocation(node);
      // Only a `const` that isn't changed later: a `let` can be reassigned (`configure(url)`), and
      // a const object changed (`theme.color = …`), so its first value isn't what renders.
      return value && binding && !this.mutated().has(binding) && binding.declarations?.some((decl) => ts.isVariableDeclaration(decl) && decl.initializer === value && (ts.getCombinedNodeFlags(decl) & ts.NodeFlags.Const) !== 0)
        ? this.evaluate(value, depth + 1)
        : undefined;
    }
    if (ts.isArrayLiteralExpression(node)) {
      const items = node.elements.map((item) => this.evaluate(item, depth + 1));
      return items.some((item) => item === undefined) ? undefined : items;
    }
    if (ts.isObjectLiteralExpression(node)) {
      const out: Record<string, unknown> = {};
      for (const prop of node.properties) {
        if (ts.isSpreadAssignment(prop)) {
          if (nothing(prop.expression)) continue;
          const value = this.evaluate(prop.expression, depth + 1);
          if (!value || typeof value !== "object") return undefined;
          Object.assign(out, value);
        } else if (ts.isPropertyAssignment(prop)) {
          const key = ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name) ? prop.name.text : undefined;
          const value = this.evaluate(prop.initializer, depth + 1);
          if (key === undefined || value === undefined) return undefined;
          out[key] = value;
        } else if (ts.isShorthandPropertyAssignment(prop)) {
          const value = this.evaluate(prop.name, depth + 1);
          if (value === undefined) return undefined;
          out[prop.name.text] = value;
        } else {
          return undefined;
        }
      }
      return out;
    }
    return undefined;
  }

  /**
   * Whether a value holds JSX (a prop like `banner: ReactElement`): from its type, or, without
   * types, from the preview props' value for it.
   */
  private jsxValued(expression: ts.Expression): boolean {
    const type = this.checker.typeToString(this.checker.getTypeAtLocation(expression));
    if (/\b(ReactElement|JSX\.Element|ReactPortal)\b|\bElement\[\]/.test(type)) return true;
    // An array JSX is pushed into (`rows.push(<Text>…</Text>)`).
    if (ts.isIdentifier(expression)) {
      let pushed = false;
      const find = (node: ts.Node) => {
        if (pushed) return;
        if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && /^(push|unshift)$/.test(node.expression.name.text) && ts.isIdentifier(node.expression.expression) && node.expression.expression.text === expression.text && node.arguments.some((arg) => containsJsx(arg))) pushed = true;
        else ts.forEachChild(node, find);
      };
      find(this.file);
      if (pushed) return true;
    }
    const name = ts.isIdentifier(expression) ? expression.text : ts.isPropertyAccessExpression(expression) ? expression.name.text : undefined;
    if (!name || !/^(any|ReactNode|React\.ReactNode)$/.test(type)) return false;
    // Untyped, or typed ReactNode (text or JSX): JSX when the preview props give JSX.
    let found = false;
    const visit = (node: ts.Node) => {
      if (found) return;
      if (ts.isBinaryExpression(node) && ts.isPropertyAccessExpression(node.left) && node.left.name.text === "PreviewProps" && ts.isObjectLiteralExpression(unwrap(node.right))) {
        for (const prop of (unwrap(node.right) as ts.ObjectLiteralExpression).properties) {
          if (ts.isPropertyAssignment(prop) && prop.name.getText() === name && containsJsx(prop.initializer)) found = true;
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(this.file);
    return found;
  }

  /** Whether a call builds a class list (`cx`, `clsx`, `classnames`, `cn`, `twMerge`). */
  private classListCall(node: ts.Expression): node is ts.CallExpression {
    const call = unwrap(node);
    return ts.isCallExpression(call) && /^(cx|clsx|classnames|classNames|cn|twMerge|twJoin)$/.test(call.expression.getText());
  }

  /** The classes a class-list call always gives (its string arguments); the ones it picks from values are left out. */
  private classListOf(node: ts.Expression): string | undefined {
    const call = unwrap(node) as ts.CallExpression;
    const fixed = call.arguments.map((arg) => this.evaluate(arg)).filter((v): v is string => typeof v === "string");
    return fixed.length ? fixed.join(" ") : undefined;
  }

  /** A className attribute's class-list call, as the classes it always gives. */
  private classList(initializer: ts.JsxAttributeValue | undefined): string | undefined {
    const expression = initializer && ts.isJsxExpression(initializer) ? initializer.expression : undefined;
    return expression && this.classListCall(expression) ? this.classListOf(expression) : undefined;
  }

  /** Whether an expression uses a value declared inside `scope` (its props, or values worked out in it). */
  private declaredInside(node: ts.Node, scope: ts.Node): boolean {
    let found = false;
    const visit = (n: ts.Node) => {
      if (found) return;
      // A name that reads a value: not a property's own name (`theme:`, `.extend`), but `{ brand }` reads `brand`.
      const parent = n.parent;
      const named = parent && ((ts.isPropertyAssignment(parent) && parent.name === n) || (ts.isPropertyAccessExpression(parent) && parent.name === n) || (ts.isMethodDeclaration(parent) && parent.name === n));
      if (ts.isIdentifier(n) && !named) {
        const symbol = parent && ts.isShorthandPropertyAssignment(parent) ? this.checker.getShorthandAssignmentValueSymbol(parent) : this.checker.getSymbolAtLocation(n);
        if (symbol?.declarations?.some((d) => d.getStart() >= scope.getStart() && d.getEnd() <= scope.getEnd())) found = true;
      }
      ts.forEachChild(n, visit);
    };
    visit(node);
    return found;
  }

  /** A value computed from props that the codemod can't keep: the check fails, naming it with its line. */
  private lose(part: ts.Node, text: string): void {
    const line = this.originalLine(part.getStart());
    if (!this.droppedStyles.some((d) => d.from === part.getStart())) this.droppedStyles.push({ from: part.getStart(), to: part.getEnd(), detail: `line ${line}: ${text.replace(/\s+/g, " ").slice(0, 80)}` });
  }

  /** Values changed after they're declared (`theme.color = …`, `items.push(…)`), by symbol. */
  private mutated(): Set<ts.Symbol> {
    if (this.mutations) return this.mutations;
    const out = new Set<ts.Symbol>();
    const mark = (target: ts.Expression | undefined, memberOnly: boolean) => {
      if (!target || (memberOnly && !ts.isPropertyAccessExpression(target) && !ts.isElementAccessExpression(target))) return;
      let root: ts.Expression = target;
      while (ts.isPropertyAccessExpression(root) || ts.isElementAccessExpression(root) || ts.isParenthesizedExpression(root) || ts.isNonNullExpression(root)) root = root.expression;
      const symbol = ts.isIdentifier(root) ? this.checker.getSymbolAtLocation(root) : undefined;
      if (symbol) out.add(symbol);
    };
    const visit = (node: ts.Node) => {
      if (ts.isBinaryExpression(node) && node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment && node.operatorToken.kind <= ts.SyntaxKind.LastAssignment) mark(node.left, true);
      else if ((ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) && (node.operator === ts.SyntaxKind.PlusPlusToken || node.operator === ts.SyntaxKind.MinusMinusToken)) mark(node.operand, true);
      else if (ts.isDeleteExpression(node)) mark(node.expression, true);
      else if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
        const { expression: object, name } = node.expression;
        if (ts.isIdentifier(object) && object.text === "Object" && /^(assign|defineProperty|defineProperties|setPrototypeOf)$/.test(name.text)) mark(node.arguments[0], false);
        else if (/^(push|pop|shift|unshift|splice|sort|reverse|fill|copyWithin)$/.test(name.text)) mark(object, false);
      }
      ts.forEachChild(node, visit);
    };
    visit(this.file);
    // A change through another name (`const alias = style; alias.color = …`) changes the original too.
    for (let changed = true; changed; ) {
      changed = false;
      const aliases = (node: ts.Node): void => {
        if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer && ts.isIdentifier(unwrap(node.initializer))) {
          const alias = this.checker.getSymbolAtLocation(node.name);
          const original = this.checker.getSymbolAtLocation(unwrap(node.initializer));
          if (alias && original && out.has(alias) && !out.has(original)) {
            out.add(original);
            changed = true;
          }
        }
        ts.forEachChild(node, aliases);
      };
      aliases(this.file);
    }
    return (this.mutations = out);
  }

  /** A prop whose value is computed (`as={level}`): lost, as the codemod writes a fixed one. */
  private computed(jsx: Jsx, name: string): boolean {
    const value = jsx.attrs.get(name);
    if (!value || this.evaluate(value) !== undefined || nothing(value)) return false;
    this.lose(value.parent ?? value, `${name}={${value.getText()}}`);
    return true;
  }

  /** The line of a position in the template as written (components inlined above it move lines). */
  private originalLine(position: number): number {
    const line = this.file.getLineAndCharacterOfPosition(position).line + 1;
    if (this.original === undefined || this.original === this.file.text) return line;
    this.lines ??= lineMap(this.original, this.file.text);
    return this.lines[line - 1] ?? line;
  }

  /**
   * The properties of a style object that are known; the ones computed from
   * props or state are recorded as lost (unless the element is kept as HTML).
   */
  private staticStyle(expression: ts.Expression | undefined): Style {
    const style: Style = {};
    const node = expression && unwrap(expression);
    const lose = (part: ts.Node, text: string) => this.lose(part, text);
    if (!node || !ts.isObjectLiteralExpression(node)) {
      if (expression) lose(expression, `style={${expression.getText()}}`);
      return style;
    }
    for (const prop of node.properties) {
      if (ts.isSpreadAssignment(prop) && nothing(prop.expression)) continue;
      const key = (ts.isPropertyAssignment(prop) || ts.isShorthandPropertyAssignment(prop)) && (ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name)) ? prop.name.text : undefined;
      const value = key === undefined ? undefined : this.evaluate(ts.isPropertyAssignment(prop) ? prop.initializer : (prop as ts.ShorthandPropertyAssignment).name);
      if (key !== undefined && (typeof value === "string" || typeof value === "number")) (style as Record<string, unknown>)[key] = value;
      else lose(prop, prop.getText());
    }
    return style;
  }

  /** Whether a condition is true, when it's known (`undefined`, a constant, `a === b` of known values). */
  private truthy(node: ts.Expression, depth: number): boolean | undefined {
    node = unwrap(node);
    const known = (side: ts.Expression): { value: unknown } | undefined => {
      side = unwrap(side);
      if (ts.isIdentifier(side) && side.text === "undefined") return { value: undefined };
      const value = this.evaluate(side, depth + 1);
      return value === undefined ? undefined : { value };
    };
    if (ts.isBinaryExpression(node)) {
      const op = node.operatorToken.kind;
      const equal = op === ts.SyntaxKind.EqualsEqualsEqualsToken, unequal = op === ts.SyntaxKind.ExclamationEqualsEqualsToken;
      if (!equal && !unequal) return undefined;
      const left = known(node.left), right = known(node.right);
      if (!left || !right) return undefined;
      return (left.value === right.value) === equal;
    }
    const value = known(node);
    return value && Boolean(value.value);
  }

  private attrValue(initializer: ts.JsxAttributeValue | undefined): unknown {
    if (!initializer) return true;
    if (ts.isStringLiteral(initializer)) return decodeHtmlEntities(initializer.text);
    if (ts.isJsxExpression(initializer)) return this.evaluate(initializer.expression);
    return undefined;
  }

  /** A prop as a value when static, else as code. */
  /**
   * A link's target, or what the element opens it in without one (`fallback`):
   * from props, the same, where the prop is left out.
   */
  private target(jsx: Jsx, fallback: string): unknown {
    const given = this.attr(jsx, "target");
    return isExpr(given) ? expr(`${given.$expr} ?? ${JSON.stringify(fallback)}`) : given ?? fallback;
  }

  private attr(jsx: Jsx, name: string): unknown {
    if (!jsx.attrs.has(name)) return undefined;
    const value = jsx.attrs.get(name);
    if (value === undefined) return true;
    const evaluated = this.evaluate(value);
    return evaluated !== undefined ? evaluated : expr(value.getText());
  }

  // ============================================
  // JSX
  // ============================================

  /** Expand literal spreads without evaluating their dynamic values. */
  private spreadAttrs(expression: ts.Expression, depth = 0): Map<string, ts.Expression> | undefined {
    if (depth > 20) return undefined;
    const node = unwrap(expression);
    const attrs = new Map<string, ts.Expression>();
    if (ts.isObjectLiteralExpression(node)) {
      for (const prop of node.properties) {
        if (ts.isSpreadAssignment(prop)) {
          const spread = this.spreadAttrs(prop.expression, depth + 1);
          if (!spread) return undefined;
          for (const [key, value] of spread) attrs.set(key, value);
        } else if (ts.isPropertyAssignment(prop) && (ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name))) {
          attrs.set(prop.name.text, prop.initializer);
        } else if (ts.isShorthandPropertyAssignment(prop) && !prop.objectAssignmentInitializer) {
          attrs.set(prop.name.text, prop.name);
        } else return undefined;
      }
      return attrs;
    }
    // Module objects can be expanded only when every value is static. Moving
    // an unevaluated module expression here could capture a shadowing local.
    const value = this.evaluate(node);
    if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
    for (const [key, inner] of Object.entries(value)) {
      const literal = ts.createSourceFile("prop.ts", `const value = ${JSON.stringify(inner)};`, ts.ScriptTarget.Latest, true);
      attrs.set(key, (literal.statements[0] as ts.VariableStatement).declarationList.declarations[0].initializer!);
    }
    return attrs;
  }

  private read(node: ts.JsxElement | ts.JsxSelfClosingElement): Jsx {
    const opening = ts.isJsxElement(node) ? node.openingElement : node;
    const tag = opening.tagName.getText();
    const attrs = new Map<string, ts.Expression | undefined>();
    let opaqueProps = false;
    for (const prop of opening.attributes.properties) {
      if (ts.isJsxSpreadAttribute(prop)) {
        const spread = this.spreadAttrs(prop.expression);
        if (spread) for (const [key, value] of spread) attrs.set(key, value);
        else opaqueProps = true;
        continue;
      }
      const init = prop.initializer;
      attrs.set(
        prop.name.getText(),
        init === undefined ? undefined : ts.isStringLiteral(init) ? init : ts.isJsxExpression(init) ? init.expression : undefined
      );
    }
    let style: Style = {};
    // Head rules marked !important: they win over the element's own style too.
    let important: { rules: Style; names: Set<string> } | undefined;
    const className = attrs.get("className");
    if (className) {
      const value = this.evaluate(className) ?? (this.classListCall(className) ? this.classListOf(className) : undefined);
      if (typeof value === "string") style = withPhoneStyles({ ...(this.tailwind.styles.get(value) ?? {}) }, this.tailwind.leftover.get(value) ?? [], this.tailwind.phone);
      // Head <style> rules on these classes sit under Tailwind's inline styles, as in the browser.
      if (typeof value === "string" && (this.headClasses.size || this.headPhone.size)) {
        const names = value.split(/\s+/);
        // React Email's own inline styles (Text's 14px) beat a class rule unless it's !important.
        const component = this.components.get(tag);
        const strong = (from: Map<string, Set<string>>) => new Set(names.flatMap((name) => [...(from.get(name) ?? [])]));
        const rules = underInline(component, classStyle(names, this.headClasses, this.headImportant, this.headOrder), strong(this.headImportant));
        important = { rules, names: strong(this.headImportant) };
        const phoneStrong = strong(this.headPhoneImportant);
        const phone = new Map([...this.headPhone].map(([cls, rule]) => [cls, underInline(component, rule, phoneStrong)] as const));
        for (const cls of names) for (const css of unheldPhoneStyles(phone.get(cls) ?? {}, component)) this.notePhone(`${css} (.${cls})`);
        const head = withPhoneStyles(rules, names, phone);
        const phoneStyle = { ...(head._phone as Style | undefined), ...(style._phone as Style | undefined) };
        style = { ...head, ...style, ...(Object.keys(phoneStyle).length ? { _phone: phoneStyle } : {}) };
      }
    }
    if (attrs.has("style")) {
      const expression = attrs.get("style");
      const value = this.evaluate(expression);
      if (value && typeof value === "object") style = { ...style, ...(value as Style) };
      else style = { ...style, ...this.staticStyle(expression) };
      if (important) style = overInline(style, important.rules, important.names);
    }
    opaqueProps ||= attrs.has("children") || attrs.has("dangerouslySetInnerHTML");
    const name = this.components.get(tag);
    if (opaqueProps && ["Html", "Body", "Tailwind", "Head", "Preview", "Font"].includes(name ?? "")) {
      throw new Error(`Can't safely convert ${tag} with dynamic spread or content props`);
    }
    return {
      node,
      tag,
      name,
      attrs,
      style,
      children: ts.isJsxElement(node) ? [...node.children] : [],
      opaqueProps,
    };
  }

  /** Children with fragments flattened and empty text dropped. */
  private flatten(children: readonly ts.JsxChild[]): ts.JsxChild[] {
    const out: ts.JsxChild[] = [];
    for (const child of children) {
      if (ts.isJsxFragment(child)) out.push(...this.flatten(child.children));
      else if (ts.isJsxText(child) && !jsxText(child.text)) continue;
      else if (ts.isJsxExpression(child) && !child.expression) continue;
      else out.push(child);
    }
    return out;
  }

  private root(returned: ts.Expression): ElementNode {
    if (
      !ts.isJsxElement(returned) &&
      !ts.isJsxSelfClosingElement(returned) &&
      !ts.isJsxFragment(returned)
    ) {
      throw new Error(
        "A template return must be JSX; use separate JSX returns for conditional roots",
      );
    }
    let previewText: unknown;
    let fontStack: string | undefined;
    const fonts: FontSpec[] = [];
    const linked: string[] = [];
    let body: Jsx | undefined;
    let document: Jsx | undefined;
    // Each return is a document of its own: one's <style> rules don't reach another's elements.
    for (const map of [this.headClasses, this.headImportant, this.headPhone, this.headPhoneImportant, this.headOrder]) map.clear();
    /** `wrapper`: a component of the template's own around what's being read (a context provider). */
    const seek = (children: ts.JsxChild[], wrapper?: string) => {
      for (const child of this.flatten(children)) {
        // A <style> under a condition (`{alert && <style>…</style>}`) applies only sometimes: the migrated template can't keep that.
        if (ts.isJsxExpression(child) && child.expression && containsTag(child.expression, "style")) {
          throw new Error("Can't convert a <style> shown under a condition: the migrated template has one set of styles. Write the styles out unconditionally, or apply them inline where the condition is");
        }
        if (!(ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child))) continue;
        const jsx = this.read(child);
        // <Html> inside a component of the template's own: the migrated root is <Email>, and the wrapper would be dropped.
        if (jsx.name === "Html" && wrapper) {
          throw new Error(`Can't convert <Html> inside <${wrapper}>: the migrated template's root is <Email>, so <${wrapper}> (a context provider, say) would be dropped. Move it inside <Html>, or provide what it gives another way`);
        }
        if (jsx.name === "Html" && !document) document = jsx;
        if (jsx.name === "Preview") previewText = this.plainContent(jsx.children);
        if (jsx.name === "Font") {
          const family = this.attr(jsx, "fontFamily");
          const fallback = this.attr(jsx, "fallbackFontFamily");
          if (typeof family === "string") fontStack ??= [family, ...([] as unknown[]).concat(fallback ?? []).map(String)].join(", ");
          const webFont = this.attr(jsx, "webFont") as { url?: unknown; format?: unknown } | undefined;
          const weight = this.attr(jsx, "fontWeight");
          const style = this.attr(jsx, "fontStyle");
          if (typeof family === "string" && webFont && typeof webFont.url === "string") {
            fonts.push({
              family,
              url: webFont.url,
              format: typeof webFont.format === "string" ? webFont.format : undefined,
              weight: typeof weight === "string" || typeof weight === "number" ? weight : undefined,
              style: typeof style === "string" ? style : undefined,
            });
          } else if (jsx.attrs.has("webFont")) {
            this.report.note("web font not static: not loaded", String(family));
          }
        }
        // Stylesheets the head links or imports (web fonts).
        if (!jsx.name && jsx.tag === "link" && /stylesheet/i.test(String(this.attr(jsx, "rel") ?? "")) && typeof this.attr(jsx, "href") === "string") {
          linked.push(String(this.attr(jsx, "href")));
        }
        if (!jsx.name && jsx.tag === "style") {
          const inner = this.attr(jsx, "dangerouslySetInnerHTML") as { __html?: unknown } | undefined;
          const css = typeof inner?.__html === "string" ? inner.__html : this.plainContent(jsx.children);
          // CSS that comes from code can't be read to convert, and dropping it would change the email.
          if (typeof css !== "string" && (inner !== undefined || jsx.children.some((c) => !this.isBlank(c)))) {
            throw new Error("Can't convert a <style> whose CSS comes from code: write the CSS out in the template");
          }
          if (typeof css === "string") {
            linked.push(...importedStylesheets(css));
            const rules = stylesheetRules(css);
            addRules(this.headClasses, this.headImportant, { styles: rules.classes, important: rules.important, order: rules.order }, this.headOrder);
            addRules(this.headPhone, this.headPhoneImportant, phoneRules(css));
            for (const selector of rules.other) this.report.note("head style rule not converted", selector);
          }
        }
        if (jsx.name === "Body" && !body) body = jsx;
        else if (jsx.name === "Html" || jsx.name === "Tailwind" || jsx.name === "Head") seek(jsx.children, jsx.name === "Html" ? undefined : wrapper);
        else if (!body) seek(jsx.children, jsx.name || !/^[A-Z]|\./.test(jsx.tag) ? wrapper : jsx.tag);
      }
    };
    const top = ts.isJsxFragment(returned) ? [...returned.children] : [returned as ts.JsxChild];
    seek(top as ts.JsxChild[]);
    // <Preview> can sit anywhere (often first inside <Body>).
    if (previewText === undefined) {
      const find = (node: ts.Node): void => {
        if (previewText !== undefined || ts.isJsxExpression(node)) return;
        if ((ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) && this.read(node).name === "Preview") {
          previewText = this.plainContent(this.read(node).children);
          return;
        }
        ts.forEachChild(node, find);
      };
      find(returned);
    }

    const content = body ? body.children : (top as ts.JsxChild[]);
    const container = this.findContainer(content);
    const bodyStyle = body?.style ?? {};
    // Its width in em is relative to its own font size (the body's, else 16px).
    const em = fontSizePx(container?.style.fontSize, fontSizePx(bodyStyle.fontSize, 16) ?? 16) ?? fontSizePx(bodyStyle.fontSize, 16) ?? 16;
    const sizes = [toPx(container?.style.maxWidth, em), toPx(container?.style.width, em)].filter((n): n is number => !!n && n > 0);
    // React Email's Container is 37.5em wide unless it says otherwise.
    const contentWidth = sizes.length ? Math.min(...sizes) : container ? 37.5 * em : 600;
    if (container && !sizes.length) noteContainerWidth(container.style, em, contentWidth, this.report);
    const rootFont = (bodyStyle.fontFamily ?? container?.style.fontFamily ?? fontStack) as string | undefined;
    // `dir` from props (`dir={direction}`) is worked out where each block is aligned.
    const dir = this.hoistDirection(returned, document && this.attr(document, "dir"));
    const rtl = isExpr(dir) ? dir : /^rtl$/i.test(String(dir ?? "")) || undefined;
    const ctx: Ctx = { report: this.report, inherited: inherit({ fontSize: "16px", ...(rtl ? { rtl } : {}) }, bodyStyle), rootFont };
    const page = pageColor(bodyStyle, this.report, document?.style);
    const rows = layout(this.flow(content, ctx), { contentWidth, report: this.report, background: backgroundImage(bodyStyle, true) ? undefined : page });
    return el(
      "Email",
      {
        backgroundColor: page,
        contentWidth: px(contentWidth),
        fontFamily: rootFont ? fontFamilyProp(rootFont) : undefined,
        textColor: color(bodyStyle.color),
        previewText: previewText === "" ? undefined : previewText,
        fonts: fonts.length || linked.length ? fontStylesheets(fonts, linked) : undefined,
        textDirection: dir,
        lang: document && this.attr(document, "lang"),
      },
      rows.length ? rows : [el("Row", {}, [el("Column")])]
    );
  }

  /**
   * A `dir` written as an expression other than a name (`locale === "ar" ? "rtl" : "ltr"`): a
   * const before the return, so the blocks aligned by it don't each repeat it. Left as it is when
   * the email is one branch of a condition, where the expression may only hold in that branch.
   */
  private hoistDirection(returned: ts.Expression, dir: unknown): unknown {
    if (!isExpr(dir) || /^[\w$.]+$/.test(dir.$expr)) return dir;
    let node: ts.Node = returned;
    while (ts.isParenthesizedExpression(node.parent)) node = node.parent;
    const statement = node.parent;
    if (!ts.isReturnStatement(statement) || !ts.isBlock(statement.parent)) return dir;
    const source = this.file.getFullText();
    let name = "textDirection";
    for (let n = 2; new RegExp(`\\b${name}\\b`).test(source) || this.hoisted.some((h) => h.text.startsWith(`const ${name} =`)); n++) name = `textDirection${n}`;
    const at = statement.getStart();
    this.hoisted.push({ at, text: `const ${name} = ${dir.$expr};\n${/[ \t]*$/.exec(source.slice(0, at))?.[0] ?? ""}` });
    return expr(name);
  }

  /** The first Container, through wrappers (Tailwind, Html, Body, Sections). */
  private findContainer(children: readonly ts.JsxChild[]): Jsx | undefined {
    for (const child of this.flatten(children)) {
      if (!(ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child))) continue;
      const jsx = this.read(child);
      if (jsx.name === "Container") return jsx;
      const inner = this.findContainer(jsx.children);
      if (inner) return inner;
    }
    return undefined;
  }

  // ============================================
  // Structure → the layout tree
  // ============================================

  /** A box's children → layout flow: boxes, rows, content and code, in order. */
  private flow(children: readonly ts.JsxChild[], ctx: Ctx): Flow[] {
    const out: Flow[] = [];
    let loose: ts.JsxChild[] = [];
    const flush = () => {
      out.push(...this.contentFlow(loose, ctx));
      loose = [];
    };
    for (const child of this.flatten(children)) {
      if (ts.isJsxExpression(child) && child.expression && containsJsx(child.expression) && (this.holdsStructure(child.expression) || this.holdsTextBoxes(child.expression))) {
        flush();
        out.push(this.rowsHole(child.expression, ctx));
        continue;
      }
      if (!(ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child))) {
        loose.push(child);
        continue;
      }
      let jsx = this.read(child);
      if (SKIP.has(jsx.name ?? jsx.tag)) continue;
      // Shown only on phones: a block hidden on desktop. A box can't be hidden that way, so it stays HTML.
      if (shownOnPhones(jsx.style) && !(jsx.name && BOXES.has(jsx.name))) jsx = { ...jsx, style: phoneOnly(jsx.style) };
      // Hidden (the `hidden` attribute too, from props or not): kept as HTML, as it renders.
      if (isHidden(jsx.style) || jsx.attrs.has("hidden")) {
        if (shownOnPhones(jsx.style)) this.report.note("content shown only on phones stays hidden there", jsx.name ?? jsx.tag);
        flush();
        out.push({ kind: "content", block: { node: this.fallback(jsx, ctx, "hidden element"), margin: ZERO, padding: ZERO } });
        continue;
      }
      if (jsx.opaqueProps) {
        flush();
        out.push({ kind: "content", block: { node: this.fallback(jsx, ctx, "dynamic spread or content props"), margin: ZERO, padding: ZERO } });
        continue;
      }
      if (jsx.name && BOXES.has(jsx.name)) {
        flush();
        out.push(this.boxNode(jsx, ctx));
      } else if (jsx.name === "Row") {
        flush();
        out.push(...this.rowFlow(jsx, ctx));
      } else if (jsx.name === "Column") {
        flush();
        out.push(...this.rowFlow(jsx, ctx, [child]));
      } else if (this.isWrapper(jsx)) {
        // A plain wrapper (div, table, center) around React Email components.
        flush();
        this.report.info("wrapper element treated as a section", jsx.tag);
        out.push(this.boxNode(jsx, ctx));
      } else {
        loose.push(child);
      }
    }
    flush();
    return out;
  }

  private boxNode(jsx: Jsx, ctx: Ctx): BoxNode {
    const style = jsx.style;
    return {
      kind: "box",
      container: jsx.name === "Container",
      label: jsx.name ?? jsx.tag,
      style: boxStyle(style, { fitWidth: () => this.fitWidth(jsx), table: jsx.name === "Section" || jsx.name === "Container" || jsx.name === "Row" ? { align: this.attr(jsx, "align") } : undefined }),
      children: this.flow(jsx.children, { ...ctx, inherited: inherit(ctx.inherited, style) }),
    };
  }

  /** Code whose JSX holds rows or boxes: laid out where it sits, each item in place. */
  private rowsHole(expression: ts.Expression, ctx: Ctx): Flow {
    const parts = this.holeParts(expression, (jsx, key) => {
      const flow = this.flow([jsx], ctx);
      if (key && flow.length === 1 && flow[0].kind !== "rows") flow[0].key = key;
      return flow;
    });
    if (parts) return { kind: "rows", code: parts.code, slots: parts.slots };
    return { kind: "content", block: { node: this.codeFallback(expression, false, ctx), margin: ZERO, padding: ZERO } };
  }

  /**
   * A React Email Row. Only cells belong in a <tr>: browsers move anything
   * else out, before the row's table, where it stacks, so that's where it
   * goes. One column is a box (it can hold more rows); several make a row.
   */
  private rowFlow(jsx: Jsx, ctx: Ctx, kids = this.flatten(jsx.children).filter((kid) => !this.isBlank(kid))): Flow[] {
    let opaqueColumn = false;
    let hiddenColumn = false;
    const scan = (node: ts.Node) => {
      if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
        const child = this.read(node);
        if (child.name === "Column" || child.tag === "td") {
          opaqueColumn ||= child.opaqueProps;
          hiddenColumn ||= isHidden(child.style);
        }
      }
      ts.forEachChild(node, scan);
    };
    for (const kid of kids) scan(kid);
    if (hiddenColumn) return [{ kind: "content", block: { node: this.fallback(jsx, ctx, "hidden element"), margin: ZERO, padding: ZERO } }];
    if (jsx.opaqueProps || opaqueColumn) return [{ kind: "content", block: { node: this.fallback(jsx, ctx, "dynamic spread or content props"), margin: ZERO, padding: ZERO } }];
    const style = jsx.name === "Row" ? jsx.style : {};
    const kinds = kids.map((kid) => this.cellKind(kid));
    // Can't tell what goes in the row's cells (custom components, code
    // mixing cells and content): keep the whole Row as it renders.
    if (kinds.includes("unknown")) return [{ kind: "content", block: { node: this.fallback(jsx, ctx), margin: ZERO, padding: ZERO } }];
    if (kinds.includes("content")) {
      this.report.info("content directly in a Row stacked above it");
      const stray = kids.filter((_, i) => kinds[i] === "content");
      const cells = kids.filter((_, i) => kinds[i] === "cell");
      return [...this.contentFlow(stray, ctx), ...(cells.length ? this.rowFlow(jsx, ctx, cells) : [])];
    }
    if (!kids.length) return [];
    const rowCtx: Ctx = { ...ctx, inherited: inherit(ctx.inherited, style) };
    const only = kids.length === 1 && (ts.isJsxElement(kids[0]) || ts.isJsxSelfClosingElement(kids[0])) ? this.read(kids[0] as ts.JsxElement) : undefined;
    if (only) {
      const colStyle = this.columnStyle(only);
      return [
        {
          kind: "box",
          label: "Row",
          style: mergeRowAndColumn(boxStyle(style, { table: { align: jsx.name === "Row" ? this.attr(jsx, "align") : undefined } }), boxStyle(colStyle)),
          children: this.flow(only.children, { ...rowCtx, inherited: inherit(rowCtx.inherited, colStyle) }),
        },
      ];
    }
    const plain = kids.filter((kid): kid is ts.JsxElement | ts.JsxSelfClosingElement => ts.isJsxElement(kid) || ts.isJsxSelfClosingElement(kid));
    if (plain.length === kids.length) noteVerticalAlign(plain.map((kid) => this.columnStyle(this.read(kid))), rowCtx);
    const columns: Array<ColumnNode | ColumnsHole> = kids.map((kid) => {
      if (ts.isJsxExpression(kid) && kid.expression) {
        const expression = kid.expression;
        const parts = this.holeParts(expression, (node, key) => [this.columnNode(this.read(node), rowCtx, key)]);
        if (parts) return { kind: "columns", code: parts.code, slots: parts.slots, mappedOver: this.mappedList(expression) };
        return { kind: "column", style: NO_STYLE, blocks: [{ node: this.codeFallback(expression, true, rowCtx), margin: ZERO, padding: ZERO }] };
      }
      return this.columnNode(this.read(kid as ts.JsxElement), rowCtx);
    });
    const branches = kids.length === 1 && ts.isJsxExpression(kids[0]) ? this.branchWidths(kids[0].expression) : undefined;
    return [{ kind: "row", style: boxStyle(style, { table: { align: jsx.name === "Row" ? this.attr(jsx, "align") : undefined } }), columns, branches }];
  }

  private columnNode(col: Jsx, ctx: Ctx, key?: Expr): ColumnNode {
    const colStyle = this.columnStyle(col);
    let look = boxStyle(colStyle);
    let content = col.children;
    let inherited = inherit(ctx.inherited, colStyle);
    // A column holding one styled box (a card): the box's look goes on the column.
    const kids = this.flatten(col.children).filter((k) => !this.isBlank(k));
    const box = kids.length === 1 && (ts.isJsxElement(kids[0]) || ts.isJsxSelfClosingElement(kids[0])) ? this.read(kids[0] as ts.JsxElement) : undefined;
    if (box && (box.name === "Section" || box.name === "Container") && !this.hasStructure(this.flatten(box.children))) {
      look = mergeColumnAndBox(look, boxStyle(box.style));
      content = box.children;
      inherited = inherit(inherited, box.style);
    }
    const colCtx: Ctx = { ...ctx, inherited };
    return {
      kind: "column",
      key,
      style: { ...look, margin: ZERO, width: undefined, align: undefined },
      width: this.columnWidth(col),
      stacks: this.stacksOnPhones(col),
      blocks: this.blocks(content, colCtx).map((entry) => {
        if (entry.style) noteTextBox(entry.style, ctx);
        return entry.block;
      }),
    };
  }

  /** Whether the column's classes make it full width on phones (`mobile:!block`). */
  private stacksOnPhones(col: Jsx): boolean {
    const className = col.attrs.get("className");
    const value = className ? this.evaluate(className) : undefined;
    // Tailwind's phone classes (`mobile:!block`), or a class a head <style> stacks on phones.
    return typeof value === "string" && (stacksOnPhones(this.tailwind.leftover.get(value) ?? [], this.tailwind.phone) || stacksOnPhones(value.split(/\s+/), this.headPhone));
  }

  /** A Column's style, with its `align` attribute as text-align. */
  private columnStyle(col: Jsx): Style {
    const align = this.attr(col, "align");
    return { ...(typeof align === "string" ? { textAlign: align } : {}), ...col.style };
  }

  private columnWidth(col: Jsx): number | string | undefined {
    const width = this.attr(col, "width");
    // Computed from props (`width={wide ? 500 : 100}`): the codemod writes a fixed width, so the check fails.
    if (isExpr(width)) this.computed(col, "width");
    return columnWidth(col.style, isExpr(width) ? undefined : width);
  }

  /** What a Row child puts in the row: a cell, content (moved out of the table), or unknown. */
  private cellKind(kid: ts.JsxChild): "cell" | "content" | "unknown" {
    const kindOf = (jsx: Jsx) => {
      if (jsx.name === "Column" || (!jsx.name && jsx.tag === "td")) return "cell";
      if (!jsx.name && /^[A-Z]/.test(jsx.tag)) return "unknown"; // a custom component: may render cells
      return "content";
    };
    if (ts.isJsxElement(kid) || ts.isJsxSelfClosingElement(kid)) return kindOf(this.read(kid));
    if (ts.isJsxExpression(kid) && kid.expression && containsJsx(kid.expression)) {
      const kinds = new Set(this.outermostJsx(kid.expression).map((jsx) => kindOf(this.read(jsx))));
      return kinds.size === 1 ? ([...kinds][0] as "cell" | "content" | "unknown") : "unknown";
    }
    return "content";
  }

  /**
   * The width of one cell: a Column, or `c ? <Column/> : <Column/>` with the
   * same width both ways. False when it isn't one cell.
   */
  private cellWidth(node: ts.Expression): number | string | undefined | false {
    const value = unwrap(node);
    if ((ts.isJsxElement(value) || ts.isJsxSelfClosingElement(value)) && this.cellKind(value) === "cell") return this.columnWidth(this.read(value));
    if (ts.isConditionalExpression(value)) {
      const a = this.cellWidth(value.whenTrue);
      const b = this.cellWidth(value.whenFalse);
      return a !== false && a === b ? a : false;
    }
    return false;
  }

  /** `list.map((item) => <Column/>)` (the callback returns one cell): `list`'s code. */
  private mappedList(expression: ts.Expression): string | undefined {
    const call = unwrap(expression);
    if (!ts.isCallExpression(call) || !ts.isPropertyAccessExpression(call.expression) || call.expression.name.text !== "map") return undefined;
    const callback = call.arguments[0] && unwrap(call.arguments[0]);
    if (!callback || !(ts.isArrowFunction(callback) || ts.isFunctionExpression(callback))) return undefined;
    let body: ts.Node | undefined = callback.body;
    if (ts.isBlock(body)) {
      const last = body.statements[body.statements.length - 1];
      body = last && ts.isReturnStatement(last) && last.expression ? last.expression : undefined;
    }
    if (!body || this.cellWidth(body as ts.Expression) === false) return undefined;
    return call.expression.expression.getText();
  }

  /** `cond ? <>…</> : <>…</>` where both branches are static cell lists: their widths. */
  private branchWidths(expression: ts.Expression | undefined): RowNode["branches"] {
    const node = expression && unwrap(expression);
    if (!node || !ts.isConditionalExpression(node)) return undefined;
    const widthsOf = (branch: ts.Expression) => {
      const value = unwrap(branch);
      const cells = ts.isJsxFragment(value) ? this.flatten(value.children).filter((c) => !this.isBlank(c)) : [value as ts.JsxChild];
      const widths: Array<number | string | undefined> = [];
      for (const cell of cells) {
        const width = this.cellWidth(ts.isJsxExpression(cell) && cell.expression ? cell.expression : (cell as ts.Expression));
        if (width === false) return undefined;
        widths.push(width);
      }
      return widths;
    };
    const whenTrue = widthsOf(node.whenTrue);
    const whenFalse = widthsOf(node.whenFalse);
    return whenTrue && whenFalse ? { condition: node.condition.getText(), whenTrue, whenFalse } : undefined;
  }

  /** `width: fit-content` around one row of fixed-width columns: their total width. */
  private fitWidth(jsx: Jsx): number | undefined {
    const kids = this.flatten(jsx.children).filter((k) => !this.isBlank(k));
    if (kids.length !== 1 || !(ts.isJsxElement(kids[0]) || ts.isJsxSelfClosingElement(kids[0]))) return undefined;
    const only = this.read(kids[0] as ts.JsxElement);
    const cells = only.name === "Row" ? this.flatten(only.children).filter((k) => !this.isBlank(k)) : only.name === "Column" ? [kids[0]] : [];
    if (!cells.length || !cells.every((c) => ts.isJsxElement(c) || ts.isJsxSelfClosingElement(c))) return undefined;
    const widths = cells.map((c) => this.columnWidth(this.read(c as ts.JsxElement)));
    return widths.every((w): w is number => typeof w === "number") ? widths.reduce((a, b) => a + b, 0) : undefined;
  }

  /** Whitespace text and `{" "}`: nothing a <tr> or a row shows. */
  private isBlank(kid: ts.JsxChild): boolean {
    if (ts.isJsxText(kid)) return !jsxText(kid.text).trim();
    if (ts.isJsxExpression(kid)) {
      if (!kid.expression) return true;
      const value = this.evaluate(kid.expression);
      return typeof value === "string" && !value.trim();
    }
    return false;
  }

  /** Whether children hold Rows or Columns (at any depth through boxes), directly or from code. */
  private hasColumns(kids: readonly ts.JsxChild[]): boolean {
    const columns = (jsx: Jsx): boolean =>
      (jsx.name === "Row" && (!this.soleColumn(jsx) || this.hasColumns(this.flatten(this.soleColumn(jsx)!.children)))) ||
      jsx.name === "Column" || (!jsx.name && jsx.tag === "td") ||
      ((jsx.name === "Section" || jsx.name === "Container" || this.isWrapper(jsx)) && this.hasColumns(this.flatten(jsx.children)));
    return kids.some((kid) => {
      if (ts.isJsxElement(kid) || ts.isJsxSelfClosingElement(kid)) return columns(this.read(kid));
      if (ts.isJsxExpression(kid) && kid.expression) return this.outermostJsx(kid.expression).some((jsx) => columns(this.read(jsx)));
      return false;
    });
  }

  /** A Row's only Column (written out, not from code): the Row is just a box around it. */
  private soleColumn(row: Jsx): Jsx | undefined {
    const kids = this.flatten(row.children).filter((kid) => !this.isBlank(kid));
    if (kids.length !== 1 || !(ts.isJsxElement(kids[0]) || ts.isJsxSelfClosingElement(kids[0]))) return undefined;
    const column = this.read(kids[0]);
    return column.name === "Column" ? column : undefined;
  }

  /** Whether children include rows, sections or containers, directly or from code. */
  private hasStructure(kids: readonly ts.JsxChild[]): boolean {
    return kids.some((kid) => {
      if (ts.isJsxElement(kid) || ts.isJsxSelfClosingElement(kid)) return this.isStructure(this.read(kid));
      if (ts.isJsxExpression(kid) && kid.expression) return this.holdsStructure(kid.expression);
      return false;
    });
  }

  /** Text with its own box (max-width, background, border): it needs a row of its own. */
  private holdsTextBoxes(expression: ts.Expression): boolean {
    return this.outermostJsx(expression).some((jsx) => {
      const read = this.read(jsx);
      return (
        ["Text", "Heading"].includes(read.name ?? hostAlias(read.tag)) &&
        needsTextBox(read.style)
      );
    });
  }

  private holdsStructure(expression: ts.Expression): boolean {
    return this.outermostJsx(expression).some((jsx) => this.isStructure(this.read(jsx)));
  }

  private isStructure(jsx: Jsx): boolean {
    return STRUCTURE.has(jsx.name ?? "") || this.isWrapper(jsx);
  }

  /** A plain HTML element around React Email components. */
  private isWrapper(jsx: Jsx): boolean {
    return (
      !jsx.name &&
      /^[a-z]/.test(jsx.tag) &&
      !HOST_CONTENT.has(jsx.tag) &&
      !INLINE_TAGS.has(jsx.tag) &&
      this.hasComponents(jsx)
    );
  }

  private outermostJsx(node: ts.Node): Array<ts.JsxElement | ts.JsxSelfClosingElement> {
    const out: Array<ts.JsxElement | ts.JsxSelfClosingElement> = [];
    const visit = (n: ts.Node) => {
      if (ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n)) out.push(n);
      else if (ts.isJsxFragment(n)) n.children.forEach(visit);
      else ts.forEachChild(n, visit);
    };
    visit(node);
    return out;
  }

  // ============================================
  // Content
  // ============================================

  /** Content at box level: blocks, with max-width text in narrow boxes of its own. */
  private contentFlow(children: readonly ts.JsxChild[], ctx: Ctx): Flow[] {
    return this.blocks(children, ctx).map((entry) =>
      entry.style ? textBox(entry.block, entry.style) : { kind: "content", block: entry.block }
    );
  }

  /** Children → content blocks (inline runs become one Paragraph; code stays, its JSX converted). */
  private blocks(children: readonly ts.JsxChild[], ctx: Ctx): Array<{ block: Block; style?: Style }> {
    const out: Array<{ block: Block; style?: Style }> = [];
    let inline: ts.JsxChild[] = [];
    const flushInline = () => {
      if (inline.length) {
        const parts = this.plainParts(inline);
        out.push({ block: paragraphBlock(parts ? "" : this.inlineContent(inline), {}, ctx, ZERO, parts, INHERITED) });
      }
      inline = [];
    };
    const significant = this.flatten(children);
    const element = (c: ts.JsxChild | undefined): c is ts.JsxElement | ts.JsxSelfClosingElement => !!c && (ts.isJsxElement(c) || ts.isJsxSelfClosingElement(c));
    const imageish = (c: ts.JsxChild | undefined) => element(c) && this.isInlineImage(this.read(c));
    // Code making only inline images (`stars.map(s => <Img className="inline-block" />)`): a run of its own.
    const imageList = (c: ts.JsxChild | undefined) => !!c && ts.isJsxExpression(c) && !!c.expression && this.makesInlineImages(c.expression);
    for (const [at, child] of significant.entries()) {
      // A prop or value holding JSX (`{banner}`) isn't text: kept as HTML, rendered as the template renders it.
      if (ts.isJsxExpression(child) && child.expression && !containsJsx(child.expression) && this.jsxValued(child.expression)) {
        flushInline();
        this.fallbackRanges.push({ from: child.getStart(), to: child.getEnd() });
        out.push({ block: { node: { ...fallbackHtml("", `JSX from a value: ${child.expression.getText().slice(0, 40)}`), props: { html: this.staticMarkup(this.inherited(`<>${this.keptText(child)}</>`, ctx)) } }, margin: ZERO, padding: ZERO } });
        continue;
      }
      if (ts.isJsxText(child) || (ts.isJsxExpression(child) && child.expression && !containsJsx(child.expression))) {
        inline.push(child);
        continue;
      }
      // Image links and inline images side by side (icon rows, rating stars) flow inline together.
      const neighbour = (c: ts.JsxChild | undefined) => imageish(c) || imageList(c);
      if (imageList(child) || (imageish(child) && (neighbour(significant[at - 1]) || neighbour(significant[at + 1])))) {
        inline.push(child);
        continue;
      }
      if (ts.isJsxExpression(child) && child.expression) {
        flushInline();
        const expression = child.expression;
        const items: Block[][] = [];
        const parts = this.holeParts(expression, (jsx, key) => {
          const blocks = this.blocks([jsx], ctx).map((entry) => entry.block);
          items.push(blocks);
          const nodes = blocks.map((block) => block.node);
          if (key && nodes.length === 1 && nodes[0].type !== "#expr") nodes[0].props = { key, ...nodes[0].props };
          return nodes;
        });
        // A loop's items stack like CSS blocks: their margins collapse
        // between them and with the blocks around the loop.
        const shared = parts && isLoop(expression) ? loopMargins(items) : undefined;
        for (const blocks of items) collapse(shared && blocks.length ? [{ ...blocks[0], margin: { ...blocks[0].margin, top: 0 } }, ...blocks.slice(1)] : blocks);
        out.push({ block: { node: parts ? hole(parts.code, parts.slots) : this.codeFallback(expression, false, ctx), margin: shared ?? ZERO, padding: ZERO } });
        continue;
      }
      if (!(ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child))) continue;
      let jsx = this.read(child);
      if (SKIP.has(jsx.name ?? jsx.tag)) continue;
      if (shownOnPhones(jsx.style) && !(jsx.name && BOXES.has(jsx.name))) jsx = { ...jsx, style: phoneOnly(jsx.style) };
      if (isHidden(jsx.style) || jsx.attrs.has("hidden")) {
        if (shownOnPhones(jsx.style)) this.report.note("content shown only on phones stays hidden there", jsx.name ?? jsx.tag);
        flushInline();
        out.push({ block: { node: this.fallback(jsx, ctx, "hidden element"), margin: ZERO, padding: ZERO } });
        continue;
      }
      if (this.isInline(jsx)) {
        inline.push(child);
        continue;
      }
      flushInline();
      const blocks = this.block(jsx, ctx);
      const textual = ["Text", "Heading"].includes(jsx.name ?? hostAlias(jsx.tag));
      blocks.forEach((block) => out.push({ block, style: textual && blocks.length === 1 ? jsx.style : undefined }));
    }
    flushInline();
    return out;
  }

  /** A phone style a head rule sets that Elements can't hold: once per rule, as elements are read more than once. */
  private notePhone(detail: string): void {
    if (this.phoneNoted.has(detail)) return;
    this.phoneNoted.add(detail);
    this.report.note("phone style not converted", detail);
  }

  private block(jsx: Jsx, ctx: Ctx): Block[] {
    if (jsx.opaqueProps) return [{ node: this.fallback(jsx, ctx, "dynamic spread or content props"), margin: ZERO, padding: ZERO }];
    const style = jsx.style;
    const kind = jsx.name ?? hostAlias(jsx.tag);
    if (["Text", "Heading", "Button", "Img", "Link"].includes(kind ?? "")) noteAttributes(jsx.attrs.keys(), ctx, kind!);
    switch (kind) {
      case "Text": {
        const parts = this.plainParts(jsx.children);
        const html = parts ? "" : this.inlineContent(jsx.children);
        return [paragraphBlock(parts && needsHtml(spanStyle(style, ctx)) ? this.inlineContent(jsx.children) : html, style, ctx, margins(style, { top: 16, bottom: 16 }), parts)];
      }
      case "Heading": {
        this.computed(jsx, "as");
        const level = String(this.attr(jsx, "as") ?? (jsx.name ? "h1" : jsx.tag));
        const content = this.inlineContent(jsx.children);
        // A margin from props (`m={margin}`) can't be kept: written as a fixed one, so it's reported.
        for (const k of ["m", "mx", "my", "mt", "mr", "mb", "ml"]) this.computed(jsx, k);
        const marginProps = headingMarginProps(Object.fromEntries(["m", "mx", "my", "mt", "mr", "mb", "ml"].map((k) => [k, this.attr(jsx, k)])));
        const parts = this.plainParts(jsx.children);
        return [headingBlock(level, { html: content, plain: false, parts }, style, marginProps, ctx)];
      }
      case "Button":
        return [buttonBlock(this.attr(jsx, "href"), this.buttonLabel(jsx.children, spanStyle(style, ctx)), style, ctx, this.target(jsx, "_blank"))];
      case "Img":
        this.computed(jsx, "width");
        if (!hasWidth(this.attr(jsx, "width"), style)) return [{ node: this.fallback(jsx, ctx, "image without a width (its natural size isn't known)"), margin: ZERO, padding: ZERO }];
        // Elements images have no border: one with a border is kept as HTML, as it renders.
        if (borders(style)) return [{ node: this.fallback(jsx, ctx, "image with a border"), margin: ZERO, padding: ZERO }];
        return [imageBlock({ src: this.attr(jsx, "src"), alt: this.attr(jsx, "alt"), width: this.attr(jsx, "width"), height: this.attr(jsx, "height") }, style, ctx)];
      case "Hr":
        return [dividerBlock(style, ctx)];
      case "List": {
        // Elements text takes list markup (the editor edits it as a list) — unless
        // its items come from code that isn't JSX (they could be elements): kept.
        const opaque = this.flatten(jsx.children).some((c) => ts.isJsxExpression(c) && c.expression && !containsJsx(c.expression) && !this.isBlank(c));
        if (opaque) return [{ node: this.fallback(jsx, ctx), margin: ZERO, padding: ZERO }];
        return [paragraphBlock(this.inlineContent([jsx.node]), {}, ctx, margins(style, { top: 16, bottom: 16 }), undefined, LIST_DEFAULTS)];
      }
      case "Link": {
        const kids = this.flatten(jsx.children);
        const only = kids.length === 1 && (ts.isJsxElement(kids[0]) || ts.isJsxSelfClosingElement(kids[0])) ? this.read(kids[0] as ts.JsxElement) : undefined;
        if (only && (only.name === "Img" || only.tag === "img")) {
          if (only.opaqueProps) return [{ node: this.fallback(jsx, ctx, "dynamic spread or content props"), margin: ZERO, padding: ZERO }];
          if (!hasWidth(this.attr(only, "width"), only.style)) return [{ node: this.fallback(jsx, ctx, "image without a width (its natural size isn't known)"), margin: ZERO, padding: ZERO }];
          if (borders(only.style)) return [{ node: this.fallback(jsx, ctx, "image with a border"), margin: ZERO, padding: ZERO }];
          this.computed(only, "width");
          // React Email's Link opens in a new tab unless it sets another target; a plain <a> keeps its own.
          const target = this.target(jsx, jsx.name === "Link" ? "_blank" : "_self");
          return [imageBlock({ src: this.attr(only, "src"), alt: this.attr(only, "alt"), width: this.attr(only, "width"), height: this.attr(only, "height"), href: this.attr(jsx, "href"), target }, only.style, ctx)];
        }
        if (fillColor(style) && (style.padding || style.paddingTop || style.paddingLeft)) {
          return [buttonBlock(this.attr(jsx, "href"), this.buttonLabel(jsx.children, spanStyle(style, ctx)), style, ctx, this.target(jsx, jsx.name === "Link" ? "_blank" : "_self"))];
        }
        return [paragraphBlock(this.inlineContent([jsx.node]), {}, ctx, ZERO)];
      }
      case "Row": {
        // Inside a column of several, a Row of one Column is a box: its content goes in this column.
        const column = this.soleColumn(jsx);
        if (!column || this.hasColumns(this.flatten(column.children))) return [{ node: this.fallback(jsx, ctx), margin: ZERO, padding: ZERO }];
        // A box it draws (a background, a border) can't nest in a column: kept as HTML, as it renders.
        if (drawsBox(style) || drawsBox(column.style)) return [{ node: this.fallback(jsx, ctx, "box with a background or border inside a column"), margin: ZERO, padding: ZERO }];
        const inside = this.blocks(column.children, { ...ctx, inherited: inherit(inherit(ctx.inherited, style), column.style) }).map((entry) => entry.block);
        return wrapPadding(inside, addSides(boxSides(style, "padding"), boxSides(column.style, "padding")), ctx, style._phone || column.style._phone ? addSides(phoneSides(style, "padding", boxSides(style, "padding")) ?? boxSides(style, "padding"), phoneSides(column.style, "padding", boxSides(column.style, "padding")) ?? boxSides(column.style, "padding")) : undefined, style._phone?.display === "none" || column.style._phone?.display === "none");
      }
      case "Section":
      case "Container": {
        // Inside a column of several: rows can't nest, so the section's
        // content goes in this column, with its padding around it.
        // Columns can't nest in a column: those are kept. Sections inside flatten too.
        if (this.hasColumns(this.flatten(jsx.children))) return [{ node: this.fallback(jsx, ctx), margin: ZERO, padding: ZERO }];
        // A box it draws (a background, a border) can't nest in a column: kept as HTML, as it renders.
        if (drawsBox(style)) return [{ node: this.fallback(jsx, ctx, "box with a background or border inside a column"), margin: ZERO, padding: ZERO }];
        const inside = this.blocks(jsx.children, { ...ctx, inherited: inherit(ctx.inherited, style) }).map((entry) => entry.block);
        return wrapPadding(inside, boxSides(style, "padding"), ctx, phoneSides(style, "padding", boxSides(style, "padding")), style._phone?.display === "none");
      }
      default:
        if (this.isWrapper(jsx)) {
          this.report.note("wrapper element flattened", jsx.tag);
          const inside = this.blocks(jsx.children, { ...ctx, inherited: inherit(ctx.inherited, style) }).map((entry) => entry.block);
          return wrapPadding(inside, boxSides(style, "padding"), ctx, phoneSides(style, "padding", boxSides(style, "padding")), style._phone?.display === "none");
        }
        return [{ node: this.fallback(jsx, ctx), margin: ZERO, padding: ZERO }];
    }
  }

  /** A button's label: as children, or as markup when a text style has no prop (uppercase, italics), as for Text. */
  private buttonLabel(children: ts.JsxChild[], style: Style): Content | Parts {
    const parts = this.plainParts(children);
    return parts && !needsHtml(style) ? parts : this.inlineContent(children);
  }

  /** An attribute from code in markup: a value that's always a string is written as it is, any other is left out when missing. */
  private codeAttribute(name: string, code: string): string {
    if (/^[`"']/.test(code.trim())) return `${name}="\${${this.helper.escapeHtml}(String(${code}))}"`;
    this.needsAttribute = true;
    return `\${${this.helper.htmlAttribute}("${name}", ${code})}`;
  }

  private isInline(jsx: Jsx): boolean {
    if (!jsx.name && INLINE_TAGS.has(jsx.tag)) return true;
    if (jsx.name === "CodeInline") return true;
    // A Text set inline (pills, badges side by side) flows with its neighbours.
    if ((jsx.name === "Text" || (!jsx.name && jsx.tag === "p")) && inlineDisplay(jsx.style)) return true;
    if (jsx.name === "Link" || jsx.tag === "a") {
      const style = jsx.style;
      const kids = this.flatten(jsx.children);
      const onlyImage = kids.length === 1 && (ts.isJsxElement(kids[0]) || ts.isJsxSelfClosingElement(kids[0])) && ["Img", "img"].includes(this.read(kids[0] as ts.JsxElement).name ?? this.read(kids[0] as ts.JsxElement).tag);
      const buttonLike = fillColor(style) && (style.padding || style.paddingTop || style.paddingLeft);
      return !onlyImage && !buttonLike && style.display !== "block";
    }
    return false;
  }

  /** An image link, or an image set inline (`display: inline-block`): it sits on a line with its neighbours. */
  private isInlineImage(jsx: Jsx): boolean {
    return (
      this.isImageLink(jsx) ||
      ((jsx.name === "Img" || jsx.tag === "img") && inlineDisplay(jsx.style))
    );
  }

  /** Whether code only makes inline images: every JSX element it returns is one. */
  private makesInlineImages(expression: ts.Expression): boolean {
    const roots: Array<ts.JsxElement | ts.JsxSelfClosingElement> = [];
    const visit = (node: ts.Node) => {
      if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) roots.push(node);
      else if (!ts.isJsxFragment(node)) ts.forEachChild(node, visit);
      else roots.push(node as never);
    };
    visit(expression);
    return (
      roots.length > 0 &&
      roots.every(
        (node) =>
          (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) &&
          this.isInlineImage(this.read(node)),
      )
    );
  }

  private isImageLink(jsx: Jsx): boolean {
    if (jsx.name !== "Link" && jsx.tag !== "a") return false;
    const kids = this.flatten(jsx.children);
    return (
      kids.length === 1 &&
      (ts.isJsxElement(kids[0]) || ts.isJsxSelfClosingElement(kids[0])) &&
      ["Img", "img"].includes(
        this.read(kids[0] as ts.JsxElement).name ??
          this.read(kids[0] as ts.JsxElement).tag,
      )
    );
  }

  private hasComponents(jsx: Jsx): boolean {
    let found = false;
    const visit = (node: ts.Node) => {
      if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && this.components.has(node.tagName.getText())) found = true;
      if (!found) ts.forEachChild(node, visit);
    };
    jsx.children.forEach(visit);
    return found;
  }

  /** Something Elements can't express: kept, rendered to HTML at run time. */
  private fallback(jsx: Jsx, ctx?: Ctx, why?: string): ElementNode {
    this.fallbackRanges.push({ from: jsx.node.getStart(), to: jsx.node.getEnd() });
    const reason = why ?? (jsx.name ? `unsupported component: ${jsx.name}` : /^[A-Z]/.test(jsx.tag) ? `custom component: ${jsx.tag}` : `unsupported element: ${jsx.tag}`);
    return { ...fallbackHtml("", reason), props: { html: this.staticMarkup(this.inherited(this.keptText(jsx.node), ctx)) } };
  }

  /** Kept JSX in a div with the text styles it inherited in the original (alignment, color, size). */
  private inherited(jsx: string, ctx?: Ctx): string {
    const style = ctx && inheritedStyle(ctx);
    if (!style) return jsx;
    return `<div style={${JSON.stringify(style)}}>${jsx}</div>`;
  }

  /** `renderToStaticMarkup(<jsx>)` for kept JSX. */
  private staticMarkup(jsx: string): Expr {
    this.needsStaticMarkup = true;
    return expr(`${this.helper.renderToStaticMarkup}(${jsx})`);
  }

  /**
   * Source kept as it is (fallbacks), with its Tailwind classes written as
   * inline styles: the migrated template has no <Tailwind> to apply them.
   */
  private keptText(node: ts.Node): string {
    const start = node.getStart();
    let text = node.getText();
    for (const edit of this.classesToStyles(node).sort((a, b) => b.from - a.from)) {
      text = text.slice(0, edit.from - start) + edit.text + text.slice(edit.to - start);
    }
    return text;
  }

  /** Edits turning each static className under `root` into the style Tailwind gives it (leftover classes stay). */
  private classesToStyles(root: ts.Node): Array<{ from: number; to: number; text: string }> {
    const edits: Array<{ from: number; to: number; text: string }> = [];
    // A head rule's hiding (`.hide{display:none}`) is written in too: the migrated email has no head <style>.
    const hidden = new Set([...this.headClasses].filter(([, rule]) => /^none$/i.test(String(rule.display ?? "").trim())).map(([name]) => name));
    if (!this.tailwind.styles.size && !hidden.size) return edits;
    const visit = (node: ts.Node) => {
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        const attrs = node.attributes.properties;
        const className = attrs.find((a): a is ts.JsxAttribute => ts.isJsxAttribute(a) && a.name.getText() === "className");
        const value = className ? this.attrValue(className.initializer) : undefined;
        const tailwind = typeof value === "string" ? this.tailwind.styles.get(value) : undefined;
        // Hidden when the display that wins among its class rules (by !important, then stylesheet order) is none.
        const names = typeof value === "string" ? value.split(/\s+/) : [];
        const hides = names.some((name) => hidden.has(name)) && /^none$/i.test(String(classStyle(names, this.headClasses, this.headImportant, this.headOrder).display ?? "").trim());
        const strongHide = hides && names.some((name) => this.headImportant.get(name)?.has("display"));
        const style = { ...tailwind, ...(hides && !strongHide ? { display: "none" } : {}) };
        const after = strongHide ? [`display: "none"`] : [];
        if (className && typeof value === "string" && (Object.keys(style).length || after.length)) {
          const styleAttr = attrs.find((a): a is ts.JsxAttribute => ts.isJsxAttribute(a) && a.name.getText() === "style");
          const own = styleAttr?.initializer && ts.isJsxExpression(styleAttr.initializer) ? styleAttr.initializer.expression?.getText() : undefined;
          const entries = Object.entries(style).map(([k, v]) => `${/^[a-zA-Z_$][\w$]*$/.test(k) ? k : JSON.stringify(k)}: ${JSON.stringify(v)}`);
          const merged = `style={{ ${[...entries, ...(own ? [`...(${own})`] : []), ...after].join(", ")} }}`;
          // Classes Tailwind couldn't inline (mobile:, hover:) have no stylesheet here: they go.
          if (tailwind && Object.keys(tailwind).length) edits.push({ from: className.getStart(), to: className.getEnd(), text: "" });
          if (styleAttr) edits.push({ from: styleAttr.getStart(), to: styleAttr.getEnd(), text: merged });
          else edits.push({ from: className.getEnd(), to: className.getEnd(), text: ` ${merged}` });
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(root);
    return edits;
  }



  // ============================================
  // Text
  // ============================================

  /** Text + expressions only (no inline elements), as children. */
  private plainParts(children: readonly ts.JsxChild[]): Parts | undefined {
    const parts: Parts = [];
    for (const child of this.flatten(children)) {
      if (ts.isJsxText(child)) parts.push(jsxText(child.text));
      else if (ts.isJsxExpression(child) && child.expression && !containsJsx(child.expression)) {
        const value = this.evaluate(child.expression);
        parts.push(typeof value === "string" || typeof value === "number" ? String(value) : expr(child.expression.getText()));
      } else return undefined;
    }
    // Neighbouring strings merge, so the text prints as one run.
    return parts.reduce<Parts>((out, part) => {
      const last = out[out.length - 1];
      if (typeof part === "string" && typeof last === "string") out[out.length - 1] = last + part;
      else out.push(part);
      return out;
    }, []);
  }

  /** Text + expressions as one value (for a prop like previewText). */
  private plainContent(children: readonly ts.JsxChild[]): string | Expr | undefined {
    const parts = this.plainParts(children);
    if (!parts) return undefined;
    if (parts.every((p) => typeof p === "string")) return parts.join("");
    this.needsPlainText = true;
    if (parts.length === 1 && isExpr(parts[0])) return expr(`${this.plainTextName}(${parts[0].$expr})`);
    return expr(`\`${parts.map((p) => (typeof p === "string" ? escapeTemplate(p) : `\${${this.plainTextName}(${p.$expr})}`)).join("")}\``);
  }

  /** Inline content (text, expressions, links, bold, …) as HTML. */
  private inlineContent(children: readonly ts.JsxChild[]): Content {
    const parts: Array<string | Expr> = [];
    const visit = (nodes: readonly ts.JsxChild[]) => {
      for (const child of this.flatten(nodes)) {
        if (ts.isJsxText(child)) parts.push(escapeHtml(jsxText(child.text)));
        else if (ts.isJsxExpression(child) && child.expression) {
          if (containsJsx(child.expression)) {
            this.fallbackRanges.push({ from: child.getStart(), to: child.getEnd() });
            parts.push(this.staticMarkup(`<>${this.keptText(child)}</>`));
            continue;
          }
          const value = this.evaluate(child.expression);
          if (typeof value === "string" || typeof value === "number") parts.push(escapeHtml(String(value)));
          else {
            // Its value is unknown: text, a number, or React elements (a prop
            // holding JSX). htmlText renders each the way React would.
            this.needsEscape = true;
            this.needsHtmlText = true;
            this.needsStaticMarkup = true;
            parts.push(expr(`${this.helper.htmlText}(${child.expression.getText()})`));
          }
        } else if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)) {
          const jsx = this.read(child);
          const tag =
            jsx.name === "Link" ? "a"
            : jsx.name === "CodeInline" ? "code"
            : (jsx.name === "Text" || jsx.tag === "p") && inlineDisplay(jsx.style) ? "span"
            : jsx.name ? undefined
            // A component the codemod doesn't convert (`<Trans>`) is rendered where the template renders, not written as a tag.
            : /^[A-Z]|\./.test(jsx.tag) ? undefined
            : jsx.tag;
          if (!tag || jsx.opaqueProps) {
            this.fallbackRanges.push({ from: child.getStart(), to: child.getEnd() });
            parts.push(this.staticMarkup(this.keptText(child)));
            continue;
          }
          // Each attribute, and whether it's code (a fixed one's text can hold `${`, which isn't code).
          const attrs: Array<{ text: string; code?: boolean }> = [];
          const href = jsx.name === "Link" || tag === "a" ? this.attr(jsx, "href") : undefined;
          // A URL from props that's missing renders no href, as React renders it (not href="undefined").
          if (href !== undefined) attrs.push(isExpr(href) ? { text: this.codeAttribute("href", href.$expr), code: true } : { text: `href="${escapeAttribute(String(href))}"` });
          if (href !== undefined) this.needsEscape ||= isExpr(href);
          const css = cssText(jsx.name === "Link" ? { color: "#067df7", textDecorationLine: "none", ...jsx.style } : jsx.style);
          if (css) attrs.push({ text: `style="${escapeAttribute(css)}"` });
          // React Email's Link opens in a new tab unless it sets another target; a plain <a> keeps the target it has.
          if (jsx.name === "Link" || tag === "a") {
            const target = this.attr(jsx, "target");
            if (isExpr(target)) this.needsEscape = true;
            // From props: where it's left out, a Link still opens a new tab.
            if (isExpr(target)) attrs.push({ text: this.codeAttribute("target", jsx.name === "Link" ? `${target.$expr} ?? "_blank"` : target.$expr), code: true });
            else if (typeof target === "string" || jsx.name === "Link") attrs.push({ text: `target="${escapeAttribute(typeof target === "string" ? target : "_blank")}"` });
          }
          // With code in it, the tag is a template literal (fixed text escaped for it); an attribute
          // from code that may be missing brings its own space (it may render nothing).
          const code = attrs.some((a) => a.code);
          const open = code
            ? expr(`\`<${tag}${attrs.map((a) => (a.code ? (a.text.startsWith(`\${${this.helper.htmlAttribute}(`) ? a.text : ` ${a.text}`) : ` ${escapeTemplate(a.text)}`)).join("")}>\``)
            : `<${tag}${attrs.map((a) => ` ${a.text}`).join("")}>`;
          if (tag === "br") {
            parts.push("<br/>");
            continue;
          }
          parts.push(open);
          visit(jsx.children);
          parts.push(`</${tag}>`);
        }
      }
    };
    visit(children);
    if (parts.every((p) => typeof p === "string")) return parts.join("");
    return expr(
      `\`${parts.map((p) => (typeof p === "string" ? escapeTemplate(p) : p.$expr.startsWith("`") ? p.$expr.slice(1, -1) : `\${${p.$expr}}`)).join("")}\``
    );
  }

  // ============================================
  // Holes
  // ============================================

  /**
   * Code with JSX inside: each outermost JSX element is converted with
   * `convert` into a slot (SLOT_OPEN n SLOT_CLOSE); the code around it stays. A fragment becomes
   * an array (`<>{a}<B/></>` → `[a, slot 0]`), as Elements walks arrays but not
   * fragments. Undefined when part of it can't be converted safely (text in
   * a fragment): the caller then keeps the whole expression as HTML, so
   * nothing is dropped.
   */
  private holeParts<T>(expression: ts.Expression, convert: (jsx: ts.JsxElement | ts.JsxSelfClosingElement, key?: Expr) => T[]): { code: string; slots: T[][] } | undefined {
    const source = this.file.getFullText();
    const slots: T[][] = [];
    const keyOf = (node: ts.JsxElement | ts.JsxSelfClosingElement) => {
      const key = this.read(node).attrs.get("key");
      return key ? expr(key.getText()) : undefined;
    };
    const slot = (node: ts.JsxElement | ts.JsxSelfClosingElement, key?: Expr) => {
      slots.push(convert(node, keyOf(node) ?? key));
      return `${SLOT_OPEN}${slots.length - 1}${SLOT_CLOSE}`;
    };
    const codeOf = (node: ts.Node, key?: Expr): string | undefined => {
      if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) return slot(node, key);
      if (ts.isJsxFragment(node)) {
        const items: string[] = [];
        for (const [i, child] of this.flatten(node.children).filter((c) => !this.isBlank(c)).entries()) {
          const itemKey = expr(String(i));
          if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)) items.push(slot(child, itemKey));
          else if (ts.isJsxExpression(child) && child.expression && containsJsx(child.expression)) {
            const code = codeOf(child.expression, itemKey);
            if (code === undefined) return undefined;
            items.push(code);
          } else return undefined; // text, or code that could hold React Email elements
        }
        return `[${items.join(", ")}]`;
      }
      // What a condition renders must be JSX we convert, or nothing: any other
      // value (a prop, a variable) could hold React Email elements.
      if (ts.isConditionalExpression(node) && ![node.whenTrue, node.whenFalse].every(rendersSafely)) return undefined;
      if (ts.isBinaryExpression(node) && [ts.SyntaxKind.AmpersandAmpersandToken, ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken].includes(node.operatorToken.kind) && !rendersSafely(node.right)) return undefined;
      // Any other code: its text, with the JSX inside it converted.
      let text = "";
      let at = node.getStart();
      let failed = false;
      ts.forEachChild(node, (child) => {
        if (failed || !containsJsx(child)) return;
        const code = codeOf(child, ts.isConditionalExpression(node) || ts.isBinaryExpression(node) || ts.isParenthesizedExpression(node) ? key : undefined);
        if (code === undefined) {
          failed = true;
          return;
        }
        text += source.slice(at, child.getStart()) + code;
        at = child.getEnd();
      });
      if (failed) return undefined;
      return text + source.slice(at, node.getEnd());
    };
    const code = codeOf(expression);
    return code === undefined ? undefined : { code, slots };
  }

  /** Code kept as it is, its JSX rendered to HTML at run time (`cells`: inside a table row). */
  private codeFallback(expression: ts.Expression, cells = false, ctx?: Ctx): ElementNode {
    this.fallbackRanges.push({ from: expression.getStart(), to: expression.getEnd() });
    const code = `{${this.keptText(expression)}}`;
    const jsx = cells ? `<table width="100%" cellPadding={0} cellSpacing={0} role="presentation"><tbody><tr>${code}</tr></tbody></table>` : `<>${code}</>`;
    return { ...fallbackHtml("", "code that couldn't be converted"), props: { html: this.staticMarkup(this.inherited(jsx, ctx)) } };
  }


  // ============================================
  // Output
  // ============================================

  /** Top-level names the file declares itself (not React Email imports). */
  private localNames(): string[] {
    const names: string[] = [];
    // Every name the file declares, at any depth (a `Paragraph` inside the component, a prop named `Button`).
    const bind = (name: ts.BindingName) => {
      if (ts.isIdentifier(name)) names.push(name.text);
      else for (const element of name.elements) if (!ts.isOmittedExpression(element)) bind(element.name);
    };
    const visit = (node: ts.Node) => {
      if ((ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node) || ts.isFunctionExpression(node) || ts.isClassExpression(node)) && node.name) names.push(node.name.text);
      if (ts.isVariableDeclaration(node) || ts.isParameter(node) || ts.isBindingElement(node)) bind(node.name);
      ts.forEachChild(node, visit);
    };
    visit(this.file);
    for (const statement of this.file.statements) {
      if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier) && !isReactEmailModule(statement.moduleSpecifier.text)) {
        const clause = statement.importClause;
        if (clause?.name) names.push(clause.name.text);
        const bindings = clause?.namedBindings;
        if (bindings && ts.isNamedImports(bindings)) bindings.elements.forEach((e) => names.push(e.name.text));
        if (bindings && ts.isNamespaceImport(bindings)) names.push(bindings.name.text);
      }
    }
    return names;
  }

  /** React Email imports referenced outside `returned`, or by fallbacks copied from inside it. */
  private reactEmailNamesUsedOutside(returned: ts.Expression[]): Set<string> {
    const names = new Set<string>();
    const inside = (node: ts.Node) =>
      returned.some(
        (r) => node.getStart() >= r.getStart() && node.getEnd() <= r.getEnd(),
      );
    const kept = (node: ts.Node) => this.fallbackRanges.some((r) => node.getStart() >= r.from && node.getEnd() <= r.to);
    const visit = (node: ts.Node) => {
      if (ts.isImportDeclaration(node)) return;
      if (ts.isIdentifier(node) && this.components.has(node.text) && (!inside(node) || kept(node))) names.add(node.text);
      ts.forEachChild(node, visit);
    };
    visit(this.file);
    return names;
  }

  private async emit(
    conversions: Array<{ expression: ts.Expression; tree: ElementNode }>,
  ): Promise<string> {
    // React Email names still used outside the converted JSX (helper
    // components, fallbacks) keep their import; Elements names that clash
    // with them get an alias.
    const returned = conversions.map((c) => c.expression);
    const stillUsed = this.reactEmailNamesUsedOutside(returned);
    const rename: Record<string, string> = {};
    // Names the file already uses for something else (React Email imports it
    // keeps, its own components) get an alias on the Elements import.
    for (const name of [...stillUsed, ...this.localNames()]) rename[name] = `Unlayer${name}`;
    const printed = conversions.map((c) => ({
      ...c,
      ...printJsx(c.tree, rename),
    }));
    const used = new Set(printed.flatMap((c) => [...c.used]));

    const source = this.file.getFullText();
    const imports = this.file.statements.filter(
      (s): s is ts.ImportDeclaration =>
        ts.isImportDeclaration(s) && ts.isStringLiteral(s.moduleSpecifier) && isReactEmailModule(s.moduleSpecifier.text)
    );
    const elementNames = [...used].sort().map((name) => (rename[name] ? `${name} as ${rename[name]}` : name));
    const newImports = [
      // Each kept React Email name comes from the package the template imported it from.
      ...[...new Set([...stillUsed].map((local) => this.componentSources.get(local)?.from ?? "@react-email/components"))].sort().map((from) => {
        const names = [...stillUsed]
          .filter((local) => (this.componentSources.get(local)?.from ?? "@react-email/components") === from)
          .sort()
          .map((local) => {
            const imported = this.components.get(local);
            return `${this.componentSources.get(local)?.type ? "type " : ""}${imported === local ? local : `${imported} as ${local}`}`;
          });
        return `import { ${names.join(", ")} } from "${from}";`;
      }),
      `import { ${elementNames.join(", ")} } from "@unlayer/react-elements";`,
      ...(this.needsStaticMarkup
        ? [`import { renderToStaticMarkup as ${this.helper.reactStaticMarkup} } from "react-dom/server";`]
        : []),
    ].join("\n");

    // Rebuild the file: imports out, the converted JSX in.
    const edits: Array<{ from: number; to: number; text: string }> = imports.map((imp, i) => ({
      from: imp.getStart(),
      to: imp.getEnd(),
      text: i === 0 ? newImports : "",
    }));
    for (const { expression, jsx } of printed)
      edits.push({
        from: expression.getStart(),
        to: expression.getEnd(),
        text: `(${jsx})`,
      });
    // JSX left outside the converted part (same-file components kept as HTML,
    // JSX constants) no longer renders inside <Tailwind>: its classes become styles.
    const inside = (e: { from: number }) =>
      returned.some((r) => e.from >= r.getStart() && e.from < r.getEnd());
    edits.push(...this.classesToStyles(this.file).filter((e) => !inside(e)));
    edits.push(...this.hoisted.map(({ at, text }) => ({ from: at, to: at, text })));
    edits.sort((a, b) => b.from - a.from);
    let body = source;
    for (const edit of edits) body = body.slice(0, edit.from) + edit.text + body.slice(edit.to);
    if (imports.length === 0) body = `${newImports}\n${body}`;

    const javascript = this.javascript;
    let helpers = this.needsEscape
      ? `\n\nfunction escapeHtml(text${javascript ? "" : ": string"})${javascript ? "" : ": string"} {\n  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");\n}\n`
      : "";
    if (this.needsStaticMarkup) {
      const type = (annotation: string) => (javascript ? "" : annotation);
      helpers += String.raw`
/**
 * React's static markup, without the image preload links React 19 adds, and
 * safe from the email's head styles: tables and cells take the color of the
 * div around it (an Elements email sets "table, td { color: #000000 }"), and
 * tables and paragraphs say the browser's defaults the editor's export resets
 * ("border-collapse: collapse" drops a table's padding, rounded corners and
 * cell spacing; "p { margin: 0 }" a paragraph's margins).
 */
function renderToStaticMarkup(node${type(": Parameters<typeof reactStaticMarkup>[0]")})${type(": string")} {
  const html = reactStaticMarkup(node).replace(/<link rel="preload" as="image"[^>]*>/g, "");
  const color = /^<div style="(?:[^"]*;)?\s*color:\s*([^;"]+)/.exec(html)?.[1]?.trim();
  return html.replace(/<(table|td|p)\b([^>]*)>/g, (tag${type(": string")}, name${type(": string")}, attrs${type(": string")}) => {
    const style = /\sstyle="([^"]*)"/.exec(attrs);
    const css = style ? style[1] : "";
    const sets = (property${type(": string")}) => new RegExp("(^|;)\\s*(" + property + ")\\s*:", "i").test(css);
    const add${type(": string[]")} = [];
    if (color && name !== "p" && !sets("color")) add.push("color:" + color);
    if (name === "table" && !sets("border-collapse")) add.push("border-collapse:separate");
    if (name === "p" && !sets("margin|margin-block")) {
      if (!sets("margin-top|margin-block-start")) add.push("margin-top:1em");
      if (!sets("margin-bottom|margin-block-end")) add.push("margin-bottom:1em");
    }
    if (!add.length) return tag;
    const value = style ? css.replace(/;?\s*$/, ";") + add.join(";") : add.join(";");
    return style ? tag.replace(style[0], ' style="' + value + '"') : "<" + name + ' style="' + value + '"' + tag.slice(name.length + 1);
  });
}
`;
    }
    if (this.needsHtmlText) {
      helpers +=
        `\n/** A value inside text, as HTML: what React would render for it. */\n` +
        `function htmlText(value${javascript ? "" : ": unknown"})${javascript ? "" : ": string"} {\n` +
        `  if (value === null || value === undefined || typeof value === "boolean") return "";\n` +
        `  if (typeof value === "string" || typeof value === "number") return escapeHtml(String(value));\n` +
        `  return renderToStaticMarkup(<>{value${javascript ? "" : " as Parameters<typeof renderToStaticMarkup>[0]"}}</>);\n` +
        `}\n`;
    }
    if (this.needsAttribute) {
      helpers +=
        `\n/** An attribute as React renders it: left out when its value is missing. */\n` +
        `function htmlAttribute(name${javascript ? "" : ": string"}, value${javascript ? "" : ": unknown"})${javascript ? "" : ": string"} {\n` +
        `  return value === null || value === undefined || value === false ? "" : \` \${name}="\${escapeHtml(String(value))}"\`;\n` +
        `}\n`;
    }
    // The helpers by the names chosen for them (the template may use these names already).
    for (const [name, chosen] of Object.entries(this.helper)) if (name !== chosen) helpers = helpers.replace(new RegExp(`\\b${name}\\b`, "g"), chosen);
    if (this.needsPlainText) {
      helpers +=
        `\nfunction ${this.plainTextName}(value${javascript ? "" : ": unknown"})${javascript ? "" : ": string"} {\n` +
        `  return value === null || value === undefined || typeof value === "boolean" ? "" : String(value);\n` +
        `}\n`;
    }
    const header = [
      "/** @jsxRuntime automatic */",
      "// Migrated from React Email by @unlayer/from-react-email (codemod mode).",
      ...(this.fallbackRanges.length ? ["// Blocks marked TODO(convert) still render their React Email markup as HTML."] : []),
    ].join("\n");
    // Copied constants the converted JSX no longer reads (their values were written in).
    for (const name of this.copied) {
      const statement = this.file.statements.find(
        (st) => ts.isVariableStatement(st) && st.declarationList.declarations.some((d) => ts.isIdentifier(d.name) && d.name.text === name)
      );
      if (statement && (body.match(new RegExp(`\\b${name}\\b`, "g")) ?? []).length === 1) body = body.replace(statement.getText(), "");
    }
    const generated = new Set([
      ...(this.needsEscape ? [this.helper.escapeHtml] : []),
      ...(this.needsStaticMarkup ? [this.helper.renderToStaticMarkup, this.helper.reactStaticMarkup] : []),
      ...(this.needsHtmlText ? [this.helper.htmlText] : []),
      ...(this.needsAttribute ? [this.helper.htmlAttribute] : []),
      ...(this.needsPlainText ? [this.plainTextName] : []),
    ]);
    const original = this.original === undefined ? this.file : ts.createSourceFile(this.file.fileName, this.original, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const raw = dropUnused(`${header}\n${body}${helpers}`, original, javascript, generated, new Set(this.copied));
    try {
      return await formatTsx(raw);
    } catch (error) {
      throw Object.assign(new Error(`Generated code doesn't parse: ${(error as Error).message.split("\n")[0]}`), { raw });
    }
  }
}

// ============================================
// Helpers
// ============================================

/**
 * Each line of `changed` (a template with its components inlined) → the line
 * of `original` it comes from, by a line diff: an unchanged line keeps its
 * own, a line the inlining wrote takes the first line it replaced (where the
 * component is used).
 */
function lineMap(original: string, changed: string): number[] {
  const a = original.split("\n");
  const b = changed.split("\n");
  // Longest common subsequence of lines, from the end.
  const common = Array.from({ length: a.length + 1 }, () => new Uint32Array(b.length + 1));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) common[i][j] = a[i] === b[j] ? common[i + 1][j + 1] + 1 : Math.max(common[i + 1][j], common[i][j + 1]);
  }
  const map: number[] = [];
  let i = 0;
  let replaced = 0; // where the current run of changes starts in `original`
  for (let j = 0; j < b.length; ) {
    if (i < a.length && a[i] === b[j]) {
      map[j++] = ++i;
      replaced = i;
    } else if (i < a.length && common[i + 1][j] >= common[i][j + 1]) {
      i++;
    } else {
      map[j++] = Math.min(replaced, a.length - 1) + 1;
    }
  }
  return map;
}

/**
 * Constants, functions and imports the template read but the migrated file no
 * longer does (their values were written into the props, components inlined),
 * and what this codemod added but didn't use (its helpers, constants copied
 * with imported components): removed, so a build with `noUnusedLocals` passes.
 * Only declarations with no side effects, so removing one can't change what
 * the file does.
 */
function dropUnused(code: string, original: ts.SourceFile, javascript: boolean, helpers: Set<string>, copied: Set<string>): string {
  const usedBefore = references(original, new Set());
  for (;;) {
    const file = ts.createSourceFile("migrated.tsx", code, ts.ScriptTarget.Latest, true, javascript ? ts.ScriptKind.JSX : ts.ScriptKind.TSX);
    const uses = references(file, helpers);
    // Read before (or added here), declared once and not read now.
    const unused = (name: ts.Identifier) => ((usedBefore.get(name.text) ?? 0) > 1 || helpers.has(name.text) || copied.has(name.text)) && uses.get(name.text) === 1;
    const cuts: Array<{ from: number; to: number; text: string }> = [];
    // A statement's comments go with it; the file's first (the header) stays.
    const cut = (statement: ts.Statement) =>
      cuts.push({ from: statement === file.statements[0] ? statement.getStart() : statement.getFullStart(), to: statement.getEnd(), text: "" });
    const visit = (statements: readonly ts.Statement[]) => {
      for (const statement of statements) {
        if (ts.isVariableStatement(statement)) {
          const declarations = statement.declarationList.declarations;
          if (
            !hasModifier(statement, ts.SyntaxKind.ExportKeyword) &&
            !hasModifier(statement, ts.SyntaxKind.DeclareKeyword) &&
            declarations.every((d) => ts.isIdentifier(d.name) && unused(d.name) && (!d.initializer || pure(d.initializer)))
          )
            cut(statement);
        } else if (ts.isFunctionDeclaration(statement) && statement.name && statement.body && !hasModifier(statement, ts.SyntaxKind.ExportKeyword) && unused(statement.name)) {
          cut(statement);
        } else if (ts.isImportDeclaration(statement) && statement.importClause) {
          const clause = statement.importClause;
          const bindings = clause.namedBindings;
          const named = bindings && ts.isNamedImports(bindings) ? bindings.elements : [];
          const keptNamed = named.filter((e) => !unused(e.name));
          const keepDefault = clause.name && !unused(clause.name);
          const keepNamespace = bindings && ts.isNamespaceImport(bindings) && !unused(bindings.name);
          if (keptNamed.length === named.length && (!clause.name || keepDefault) && (!bindings || ts.isNamedImports(bindings) || keepNamespace)) continue;
          if (!keepDefault && !keepNamespace && keptNamed.length === 0) {
            // TypeScript drops an import none of whose names are read, too.
            cut(statement);
            continue;
          }
          const parts = [
            ...(keepDefault ? [clause.name!.getText()] : []),
            ...(keepNamespace ? [bindings!.getText()] : []),
            ...(keptNamed.length ? [`{ ${keptNamed.map((e) => e.getText()).join(", ")} }`] : []),
          ];
          cuts.push({ from: clause.getStart(), to: clause.getEnd(), text: `${clause.isTypeOnly ? "type " : ""}${parts.join(", ")}` });
        }
      }
    };
    // Statements at the top and inside functions (a loop's `const isLeft = …`).
    const walk = (node: ts.Node) => {
      if (ts.isSourceFile(node) || ts.isBlock(node)) visit(node.statements);
      ts.forEachChild(node, walk);
    };
    walk(file);
    if (cuts.length === 0) return code;
    // A cut inside another (a constant in a removed function) goes with it.
    const ordered = cuts.sort((x, y) => y.from - x.from).filter((c, i, all) => !all.some((o, j) => j !== i && o.from <= c.from && c.to <= o.to && (o.from !== c.from || o.to !== c.to)));
    for (const c of ordered) code = code.slice(0, c.from) + c.text + code.slice(c.to);
  }
}

/**
 * How many times each name appears in a file as a binding (declared or read).
 * Property names (`a.text`, `{ text: 1 }`, `<X text="" />`), the imported name
 * in `import { A as B }`, and the inside of the helpers this codemod adds
 * (`helpers`) don't count: they never read the file's own `text` or `A`.
 */
function references(file: ts.SourceFile, helpers: Set<string>): Map<string, number> {
  const counts = new Map<string, number>();
  const visit = (node: ts.Node, helper: boolean) => {
    if (ts.isIdentifier(node)) {
      const parent = node.parent;
      const property =
        (ts.isImportSpecifier(parent) && parent.propertyName === node) ||
        (ts.isPropertyAccessExpression(parent) && parent.name === node) ||
        ((ts.isPropertyAssignment(parent) || ts.isPropertySignature(parent)) && parent.name === node) ||
        (ts.isJsxAttribute(parent) && parent.name === node) ||
        (ts.isQualifiedName(parent) && parent.right === node);
      if (!property && (!helper || helpers.has(node.text))) counts.set(node.text, (counts.get(node.text) ?? 0) + 1);
    }
    const inHelper = helper || (ts.isFunctionDeclaration(node) && !!node.name && helpers.has(node.name.text));
    ts.forEachChild(node, (child) => visit(child, inHelper));
  };
  visit(file, false);
  return counts;
}

/** A value whose evaluation has no side effects: literals, objects, arrays, functions, JSX. */
function pure(node: ts.Node): boolean {
  if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) return true;
  if (
    ts.isCallExpression(node) ||
    ts.isNewExpression(node) ||
    ts.isTaggedTemplateExpression(node) ||
    ts.isAwaitExpression(node) ||
    ts.isYieldExpression(node) ||
    ts.isDeleteExpression(node) ||
    ts.isClassExpression(node) ||
    ts.isPostfixUnaryExpression(node) ||
    (ts.isPrefixUnaryExpression(node) && (node.operator === ts.SyntaxKind.PlusPlusToken || node.operator === ts.SyntaxKind.MinusMinusToken)) ||
    (ts.isBinaryExpression(node) && node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment && node.operatorToken.kind <= ts.SyntaxKind.LastAssignment)
  )
    return false;
  return !ts.forEachChild(node, (child) => (pure(child) ? undefined : true));
}

function unwrap(node: ts.Expression): ts.Expression {
  while (
    ts.isParenthesizedExpression(node) ||
    ts.isAsExpression(node) ||
    ts.isSatisfiesExpression(node) ||
    ts.isTypeAssertionExpression(node) ||
    ts.isNonNullExpression(node)
  ) {
    node = node.expression;
  }
  return node;
}

function hasModifier(node: ts.Node, kind: ts.SyntaxKind): boolean {
  return (ts.canHaveModifiers(node) ? (ts.getModifiers(node) ?? []) : []).some(
    (m) => m.kind === kind,
  );
}

/** Code that renders a list: `items.map(…)` (not a map inside the JSX it renders). */
function isLoop(node: ts.Node): boolean {
  if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node)) return false;
  if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && ["map", "flatMap"].includes(node.expression.name.text)) return true;
  return ts.forEachChild(node, (child) => (isLoop(child) ? true : undefined)) ?? false;
}

/** null, undefined, false or "": a return or branch that renders nothing. */
function rendersNothing(value: ts.Expression): boolean {
  if (value.kind === ts.SyntaxKind.NullKeyword || value.kind === ts.SyntaxKind.FalseKeyword) return true;
  // An empty fragment (`<></>`) renders nothing too: it stays as written, not an empty email.
  if (ts.isJsxFragment(value) && value.children.every((child) => ts.isJsxText(child) && !child.text.trim())) return true;
  if (ts.isIdentifier(value) && value.text === "undefined") return true;
  return (ts.isStringLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value)) && value.text === "";
}

/** JSX (converted) or an empty value: what a branch of a hole may render. */
function rendersSafely(node: ts.Expression): boolean {
  const value = unwrap(node);
  if (containsJsx(value)) return true;
  if (value.kind === ts.SyntaxKind.NullKeyword || value.kind === ts.SyntaxKind.FalseKeyword) return true;
  if (ts.isIdentifier(value) && value.text === "undefined") return true;
  return (
    (ts.isStringLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value)) &&
    value.text === ""
  );
}

function containsJsx(node: ts.Node): boolean {
  if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node)) return true;
  return (
    ts.forEachChild(node, (child) => (containsJsx(child) ? true : undefined)) ??
    false
  );
}

/** JSX text the way React sees it: lines trimmed and joined by spaces, entities decoded. */
function jsxText(text: string): string {
  return jsxLines(text).replace(
    /&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]+);/gi,
    (reference, name: string) => {
      if (name.startsWith("#")) return decodeHtmlEntities(reference);
      let decoded = JSX_ENTITIES.get(name);
      if (decoded === undefined) {
        // JSX uses the React/TypeScript entity set, not every HTML5 name.
        // Ask our parser rather than maintaining a second, incomplete table.
        const emitted = ts.transpileModule(
          `const text = <span>${reference}</span>;`,
          { compilerOptions: { jsx: ts.JsxEmit.React } },
        ).outputText;
        const file = ts.createSourceFile(
          "entity.js",
          emitted,
          ts.ScriptTarget.Latest,
          true,
          ts.ScriptKind.JS,
        );
        const statement = file.statements[0];
        const init = ts.isVariableStatement(statement)
          ? statement.declarationList.declarations[0].initializer
          : undefined;
        const child =
          init && ts.isCallExpression(init) ? init.arguments[2] : undefined;
        decoded = child && ts.isStringLiteral(child) ? child.text : reference;
        JSX_ENTITIES.set(name, decoded);
      }
      return decoded;
    },
  );
}

const JSX_ENTITIES = new Map<string, string>();

function jsxLines(text: string): string {
  const lines = text.split(/\r\n|\n|\r/);
  let out = "";
  lines.forEach((line, i) => {
    let t = line.replace(/\t/g, " ");
    if (i > 0) t = t.replace(/^ +/, "");
    if (i < lines.length - 1) t = t.replace(/ +$/, "");
    if (t) out += (out && lines.length > 1 && i > 0 ? " " : "") + t;
  });
  return out;
}

function inlineDisplay(style: Style): boolean {
  return /^inline(-block)?$/.test(String(style.display ?? "").replace(/\s*!important$/, "").trim());
}

function needsHtml(style: Style): boolean {
  const decoration = style.textDecoration ?? style.textDecorationLine;
  return Boolean(style.textTransform || (style.fontStyle && style.fontStyle !== "normal") || (decoration && decoration !== "none"));
}

/**
 * The React Email component an HTML tag reads as. A capitalised tag that isn't
 * React Email's (a project's own `Button`) is never read by its name: it's kept.
 */
/** Whether `node` has a JSX element with this tag in it (`<style>` inside a condition). */
function containsTag(node: ts.Node, tag: string): boolean {
  let found = false;
  const visit = (n: ts.Node) => {
    if (found) return;
    if ((ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) && n.tagName.getText() === tag) found = true;
    else ts.forEachChild(n, visit);
  };
  visit(node);
  return found;
}

function hostAlias(tag: string): string {
  if (tag === "p") return "Text";
  if (tag === "ul" || tag === "ol") return "List";
  if (/^h[1-6]$/.test(tag)) return "Heading";
  if (tag === "img") return "Img";
  if (tag === "hr") return "Hr";
  if (tag === "a") return "Link";
  return /^[a-z]/.test(tag) ? tag : "";
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** A value for a double-quoted attribute: a quote in it (`font-family:"Inter"`) can't end the attribute. */
function escapeAttribute(text: string): string {
  return escapeHtml(text).replace(/"/g, "&quot;");
}

function escapeTemplate(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
}

function cssText(style: Style): string {
  return Object.entries(style)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}:${typeof v === "number" && !/^(lineHeight|fontWeight|opacity|zIndex)$/.test(k) ? `${v}px` : v}`)
    .join(";");
}
