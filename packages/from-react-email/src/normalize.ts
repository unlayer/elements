/**
 * After components and constants are inlined: the code their props were written into, as code the template could
 * have written. Inlining writes each prop's value where the component reads it, and what that gives isn't always
 * code TypeScript accepts, or that does what the component did:
 *
 *   {url && <Link href={url}>…</Link>}           with no url:   {undefined && …}     (TS2873, always falsy)
 *                                                with a link:   {"https://…" && …}   (TS2872, always truthy)
 *   {children ? <Text>{children}</Text> : null}  given text and a link: <>…</> ? … : …  (TS2872)
 *   {links.length > 0 ? links.map((l) => l.href) : null}  with `links = []`: [].map((l) => l.href)  (l is never)
 *   render(children)                             given `{message}`: render(<>{message}</>)  (an element, not the text)
 *   {secondary ? <Link href={secondary.href} /> : null}  given `cond ? {…} : undefined`: no narrowing (TS2532)
 *   {title ? <Text>{title}</Text> : null}       given `plan ? "Pro" : "Free"`: always truthy (TS2872)
 *
 * So, wherever it is (inlining leaves no trace of where it wrote), code whose value is known is written as it:
 * conditions on literals, JSX or objects (`&&`, `||`, `??`, `? :`, `!`, comparisons), an empty array literal's
 * length and what mapping or filtering it gives; one child in a fragment used as a value is that child, as React
 * passes it; and a condition on `c ? {…} : undefined` is a condition on `c`, with the value written as the object
 * where it holds. Imports of the same name from the same module (an inlined component's and the template's own)
 * become one.
 */

import ts from "typescript";
import { jsxLines, jsxText } from "./jsx-text";

export function normalizeInlined(source: string, fileName: string): string {
  for (let round = 0; round < 1000; round++) {
    const file = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const edit = firstFold(file);
    if (!edit) break;
    source = source.slice(0, edit.from) + edit.text + source.slice(edit.to);
  }
  return dedupeImports(source, fileName);
}

/** A value known from the code alone: a primitive, or an object (JSX, `{…}`, `[…]`, a function), which is truthy. */
type Known = { value: unknown } | { object: true };

function unwrap(node: ts.Expression): ts.Expression {
  while (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isSatisfiesExpression(node) || ts.isTypeAssertionExpression(node) || ts.isNonNullExpression(node)) node = node.expression;
  return node;
}

function known(expression: ts.Expression): Known | undefined {
  const node = unwrap(expression);
  if (ts.isIdentifier(node) && node.text === "undefined") return { value: undefined };
  if (node.kind === ts.SyntaxKind.NullKeyword) return { value: null };
  if (node.kind === ts.SyntaxKind.TrueKeyword) return { value: true };
  if (node.kind === ts.SyntaxKind.FalseKeyword) return { value: false };
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return { value: node.text };
  if (ts.isNumericLiteral(node)) return { value: Number(node.text) };
  if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken && ts.isNumericLiteral(node.operand)) return { value: -Number(node.operand.text) };
  // A template with text of its own is never empty.
  if (ts.isTemplateExpression(node) && (node.head.text || node.templateSpans.some((span) => span.literal.text))) return { object: true };
  if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node) || ts.isObjectLiteralExpression(node) || ts.isArrayLiteralExpression(node) || ts.isArrowFunction(node) || ts.isFunctionExpression(node) || ts.isRegularExpressionLiteral(node)) return { object: true };
  // `c ? "one text" : "another"`: truthy either way (only where reading `c` changes nothing, as it's then not read).
  if (ts.isConditionalExpression(node) && stable(node.condition)) {
    const yes = known(node.whenTrue), no = known(node.whenFalse);
    if (yes && no && truthy(yes) && truthy(no)) return { object: true };
  }
  return undefined;
}

const truthy = (k: Known) => ("object" in k ? true : Boolean(k.value));

/** A literal's text: a primitive written as code. */
function literal(value: unknown): string {
  return value === undefined ? "undefined" : JSON.stringify(value);
}

/** Code put where an expression was: in parentheses unless it's one token or already in them. */
function paren(node: ts.Expression): string {
  const text = node.getText();
  return ts.isParenthesizedExpression(node) || ts.isIdentifier(node) || ts.isLiteralExpression(node) || /^(true|false|null|undefined)$/.test(text) ? text : `(${text})`;
}

/** Code that reads values without changing anything (`props.id`, `!a`, `a === "b"`): the same each time it's read. */
function stable(node: ts.Expression): boolean {
  const n = unwrap(node);
  if (ts.isIdentifier(n) || known(n)) return true;
  if (ts.isPropertyAccessExpression(n)) return stable(n.expression);
  if (ts.isElementAccessExpression(n)) return stable(n.expression) && stable(n.argumentExpression);
  if (ts.isPrefixUnaryExpression(n)) return n.operator === ts.SyntaxKind.ExclamationToken && stable(n.operand);
  if (ts.isBinaryExpression(n)) {
    const op = n.operatorToken.kind;
    return [ts.SyntaxKind.AmpersandAmpersandToken, ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken, ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken, ts.SyntaxKind.EqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsToken, ts.SyntaxKind.LessThanToken, ts.SyntaxKind.GreaterThanToken, ts.SyntaxKind.LessThanEqualsToken, ts.SyntaxKind.GreaterThanEqualsToken].includes(op) && stable(n.left) && stable(n.right);
  }
  return false;
}

/** The text of the code without spaces, parentheses around it, or comments: to find the same code again. */
function shape(node: ts.Node): string {
  return (ts.isExpression(node) ? unwrapParens(node) : node).getText().replace(/\s+/g, "");
}

function unwrapParens(node: ts.Expression): ts.Expression {
  while (ts.isParenthesizedExpression(node)) node = node.expression;
  return node;
}

/** The one edit to make next, or undefined when there's nothing to fold. */
function firstFold(file: ts.SourceFile): { from: number; to: number; text: string } | undefined {
  let found: { from: number; to: number; text: string } | undefined;
  const replace = (node: ts.Node, text: string) => (found = { from: node.getStart(), to: node.getEnd(), text });
  const visit = (node: ts.Node): void => {
    if (found) return;
    // Inner code first: what it folds to can fold what's around it.
    ts.forEachChild(node, visit);
    if (found || !ts.isExpression(node)) return;
    if (ts.isBinaryExpression(node)) {
      const op = node.operatorToken.kind;
      const left = known(node.left);
      if (op === ts.SyntaxKind.AmpersandAmpersandToken && left) return void replace(node, truthy(left) ? paren(node.right) : paren(node.left));
      if (op === ts.SyntaxKind.BarBarToken && left) return void replace(node, truthy(left) ? paren(node.left) : paren(node.right));
      if (op === ts.SyntaxKind.QuestionQuestionToken && left) return void replace(node, "value" in left && (left.value === undefined || left.value === null) ? paren(node.right) : paren(node.left));
      const right = known(node.right);
      if (left && right && "value" in left && "value" in right) {
        const a = left.value as any, b = right.value as any;
        const result =
          op === ts.SyntaxKind.EqualsEqualsEqualsToken ? a === b
          : op === ts.SyntaxKind.ExclamationEqualsEqualsToken ? a !== b
          // eslint-disable-next-line eqeqeq
          : op === ts.SyntaxKind.EqualsEqualsToken ? a == b
          // eslint-disable-next-line eqeqeq
          : op === ts.SyntaxKind.ExclamationEqualsToken ? a != b
          : typeof a === "number" && typeof b === "number" && op === ts.SyntaxKind.GreaterThanToken ? a > b
          : typeof a === "number" && typeof b === "number" && op === ts.SyntaxKind.LessThanToken ? a < b
          : typeof a === "number" && typeof b === "number" && op === ts.SyntaxKind.GreaterThanEqualsToken ? a >= b
          : typeof a === "number" && typeof b === "number" && op === ts.SyntaxKind.LessThanEqualsToken ? a <= b
          : undefined;
        if (result !== undefined) return void replace(node, String(result));
      }
      // `(c ? {…} : undefined) && X`: when c, X with the object for the value; else what the value is then.
      if (op === ts.SyntaxKind.AmpersandAmpersandToken) {
        const split = splitCondition(node.left);
        if (split) return void replace(node, `(${split.condition} ? ${narrowed(node.right, node.left, split.truthy)} : ${split.falsy})`);
      }
      return;
    }
    if (ts.isConditionalExpression(node)) {
      const condition = known(node.condition);
      if (condition) return void replace(node, paren(truthy(condition) ? node.whenTrue : node.whenFalse));
      // `(c ? {…} : undefined) ? X : Y`: `c ? X : Y`, with the object written for the value in X.
      const split = splitCondition(node.condition);
      if (split) return void replace(node, `(${split.condition} ? ${narrowed(node.whenTrue, node.condition, split.truthy)} : ${paren(node.whenFalse)})`);
      return;
    }
    if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.ExclamationToken) {
      const operand = known(node.operand);
      if (operand) return void replace(node, String(!truthy(operand)));
      return;
    }
    // An empty array literal: its length, and what mapping, filtering or joining it gives.
    if (ts.isPropertyAccessExpression(node) && node.name.text === "length" && isEmptyArray(node.expression)) return void replace(node, "0");
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && isEmptyArray(node.expression.expression)) {
      const method = node.expression.name.text;
      if (/^(map|filter|flatMap|slice|reverse|sort|flat)$/.test(method)) return void replace(node, "[]");
      if (method === "join") return void replace(node, '""');
      if (/^(some|includes)$/.test(method)) return void replace(node, "false");
      if (method === "every") return void replace(node, "true");
      return;
    }
    // One child in a fragment used as a value (passed to a function, tested, read): the child, as React passes one child.
    if (ts.isJsxFragment(node) && usedAsValue(node)) {
      const children = node.children.filter((child) => !(ts.isJsxText(child) && !jsxLines(child.text).trim() && /[\r\n]/.test(child.text)));
      const [only] = children;
      if (children.length !== 1) return;
      if (ts.isJsxExpression(only) && only.expression) return void replace(node, `(${only.expression.getText()})`);
      if (ts.isJsxText(only)) return void replace(node, JSON.stringify(jsxText(only.text)));
    }
  };
  visit(file);
  return found;
}

/** Where a value is used, not shown: an argument, an operand, a condition, what a property is read from. */
function usedAsValue(node: ts.Node): boolean {
  let parent = node.parent;
  while (ts.isParenthesizedExpression(parent)) parent = parent.parent;
  return (
    ((ts.isCallExpression(parent) || ts.isNewExpression(parent)) && !!parent.arguments?.some((arg) => unwrapParens(arg) === node)) ||
    ts.isBinaryExpression(parent) ||
    (ts.isConditionalExpression(parent) && unwrapParens(parent.condition) === node) ||
    ts.isPrefixUnaryExpression(parent) ||
    ((ts.isPropertyAccessExpression(parent) || ts.isElementAccessExpression(parent)) && unwrapParens(parent.expression) === node) ||
    ts.isTemplateSpan(parent)
  );
}

function isEmptyArray(node: ts.Expression): boolean {
  const n = unwrap(node);
  return ts.isArrayLiteralExpression(n) && n.elements.length === 0;
}

/**
 * `c ? {…} : undefined` (or the other way round) as a value that's tested: true exactly when `condition` is, with the
 * object (`truthy`) and the value otherwise (`falsy`). Only for a condition that reads the same each time (a prop, a
 * comparison).
 */
function splitCondition(expression: ts.Expression): { condition: string; truthy: string; falsy: string } | undefined {
  const node = unwrap(expression);
  if (!ts.isConditionalExpression(node) || !stable(node.condition)) return undefined;
  const yes = known(node.whenTrue), no = known(node.whenFalse);
  if (!yes || !no || truthy(yes) === truthy(no)) return undefined;
  const condition = paren(node.condition);
  return truthy(yes)
    ? { condition, truthy: paren(node.whenTrue), falsy: paren(node.whenFalse) }
    : { condition: `!${condition}`, truthy: paren(node.whenFalse), falsy: paren(node.whenTrue) };
}

/** `node`'s code with each copy of `value` (as written) replaced by `by`: where the condition held, that's what it is. */
function narrowed(node: ts.Expression, value: ts.Expression, by: string): string {
  const target = shape(value);
  const start = node.getStart();
  const edits: Array<{ from: number; to: number }> = [];
  const visit = (n: ts.Node) => {
    if (ts.isExpression(n) && !ts.isParenthesizedExpression(n.parent) && shape(n) === target) {
      edits.push({ from: n.getStart() - start, to: n.getEnd() - start });
      return;
    }
    ts.forEachChild(n, visit);
  };
  visit(node);
  let text = node.getText();
  for (const edit of edits.sort((a, b) => b.from - a.from)) text = text.slice(0, edit.from) + by + text.slice(edit.to);
  return `(${text})`;
}

/**
 * Imports of a name from a module the file imports it from already (the template's `import { type ReactNode }` and an
 * inlined component's `import type { ReactNode }`): one, a value import if either is.
 */
function dedupeImports(source: string, fileName: string): string {
  const file = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const seen = new Map<string, { specifier: string; imported: string; type: boolean; element: ts.ImportSpecifier; declaration: ts.ImportDeclaration }>();
  const drop = new Set<ts.ImportSpecifier>();
  const valued = new Set<ts.ImportSpecifier>();
  for (const statement of file.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
    const bindings = statement.importClause?.namedBindings;
    if (!bindings || !ts.isNamedImports(bindings) || statement.importClause?.name) continue;
    for (const element of bindings.elements) {
      const name = element.name.text;
      const imported = (element.propertyName ?? element.name).text;
      const type = !!statement.importClause?.isTypeOnly || element.isTypeOnly;
      const before = seen.get(name);
      if (!before) {
        seen.set(name, { specifier: statement.moduleSpecifier.text, imported, type, element, declaration: statement });
        continue;
      }
      // The same name from somewhere else is another thing: left for TypeScript to say.
      if (before.specifier !== statement.moduleSpecifier.text || before.imported !== imported) continue;
      drop.add(element);
      if (before.type && !type) valued.add(before.element);
    }
  }
  if (!drop.size) return source;
  const edits: Array<{ from: number; to: number; text: string }> = [];
  for (const statement of file.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    const bindings = statement.importClause?.namedBindings;
    if (!bindings || !ts.isNamedImports(bindings)) continue;
    const elements = bindings.elements;
    if (!elements.some((e) => drop.has(e) || valued.has(e))) continue;
    const kept = elements.filter((e) => !drop.has(e));
    if (!kept.length) {
      edits.push({ from: statement.getFullStart(), to: statement.getEnd(), text: "" });
      continue;
    }
    // A type-only declaration with a name now needed as a value: each name says which it is instead.
    const typeOnly = !!statement.importClause?.isTypeOnly;
    const upgrade = typeOnly && kept.some((e) => valued.has(e));
    const text = kept.map((e) => (upgrade && !valued.has(e) ? `type ${e.getText()}` : valued.has(e) && !typeOnly ? e.getText().replace(/^type\s+/, "") : e.getText())).join(", ");
    if (upgrade) edits.push({ from: statement.importClause!.getStart(), to: statement.importClause!.getEnd(), text: `{ ${text} }` });
    else edits.push({ from: bindings.getStart(), to: bindings.getEnd(), text: `{ ${text} }` });
  }
  for (const edit of edits.sort((a, b) => b.from - a.from)) source = source.slice(0, edit.from) + edit.text + source.slice(edit.to);
  return source;
}
