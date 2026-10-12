/**
 * Before converting: put JSX held in local constants back where it's used.
 *
 *   const image = <Column>…</Column>;
 *   return <Row>{image}{text}</Row>;
 *
 * Converted in place, `image` would be mapped without knowing it ends up in
 * a Row. Inlined, it's converted as the Column it is. Only `const`s used
 * solely as JSX children, declared once, and not shadowed where used.
 */

import ts from "typescript";

export function inlineLocalJsx(source: string, fileName: string): { source: string; inlined: string[] } {
  const inlined: string[] = [];
  // One at a time: an inlined constant can hold references to another.
  for (let round = 0; round < 200; round++) {
    const file = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const next = inlineOne(file);
    if (!next) break;
    source = next.source;
    inlined.push(next.name);
  }
  return { source, inlined };
}

function inlineOne(file: ts.SourceFile): { source: string; name: string } | undefined {
  const declared = declarationCounts(file);
  let result: { source: string; name: string } | undefined;
  const visit = (node: ts.Node) => {
    if (result) return;
    if (
      ts.isVariableStatement(node) &&
      ts.isBlock(node.parent) &&
      node.declarationList.flags & ts.NodeFlags.Const &&
      node.declarationList.declarations.length === 1
    ) {
      const decl = node.declarationList.declarations[0];
      const init = decl.initializer && unwrap(decl.initializer);
      if (ts.isIdentifier(decl.name) && init && isJsx(init) && declared.get(decl.name.text) === 1) {
        const name = decl.name.text;
        const block = node.parent;
        const refs = references(block, name, decl.name);
        const free = identifiers(init);
        const usable = refs.every(
          (ref) => ref.getStart() > node.getEnd() && isJsxChild(ref) && !shadowed(ref, block, free)
        );
        if (refs.length && usable && !changesBetween(block, free, node.getEnd(), Math.max(...refs.map((ref) => ref.getStart())))) {
          const text = init.getText();
          const edits = [
            { from: node.getFullStart(), to: node.getEnd(), text: "" },
            ...refs.map((ref) => ({ from: ref.parent.getStart(), to: ref.parent.getEnd(), text })),
          ].sort((a, b) => b.from - a.from);
          let source = file.getFullText();
          for (const edit of edits) source = source.slice(0, edit.from) + edit.text + source.slice(edit.to);
          result = { source, name };
          return;
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return result;
}

/** How many times each name is declared anywhere in the file (variables, parameters, functions). */
function declarationCounts(file: ts.SourceFile): Map<string, number> {
  const counts = new Map<string, number>();
  const add = (name: ts.BindingName | undefined) => {
    if (!name) return;
    if (ts.isIdentifier(name)) counts.set(name.text, (counts.get(name.text) ?? 0) + 1);
    else for (const element of name.elements) if (!ts.isOmittedExpression(element)) add(element.name);
  };
  const visit = (node: ts.Node) => {
    if (ts.isVariableDeclaration(node) || ts.isParameter(node) || ts.isBindingElement(node)) {
      if (!ts.isBindingElement(node)) add(node.name);
      else if (ts.isIdentifier(node.name)) add(node.name);
    }
    if ((ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) && node.name) add(node.name);
    ts.forEachChild(node, visit);
  };
  visit(file);
  return counts;
}

/** Uses of `name` in `scope` as a value (not property names or the declaration itself). */
function references(scope: ts.Node, name: string, declaration: ts.Identifier): ts.Identifier[] {
  const out: ts.Identifier[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isIdentifier(node) && node.text === name && node !== declaration) {
      const parent = node.parent;
      const propertyName =
        (ts.isPropertyAccessExpression(parent) && parent.name === node) ||
        (ts.isPropertyAssignment(parent) && parent.name === node) ||
        ts.isJsxAttribute(parent) ||
        (ts.isQualifiedName(parent) && parent.right === node);
      if (!propertyName) out.push(node);
    }
    ts.forEachChild(node, visit);
  };
  visit(scope);
  return out;
}

/** `{name}` as a child of a JSX element or fragment. */
function isJsxChild(ref: ts.Identifier): boolean {
  const parent = ref.parent;
  return ts.isJsxExpression(parent) && parent.expression === ref && (ts.isJsxElement(parent.parent) || ts.isJsxFragment(parent.parent));
}

/** Every identifier in `node` (an over-approximation of the names it reads). */
function identifiers(node: ts.Node): Set<string> {
  const names = new Set<string>();
  const visit = (n: ts.Node) => {
    if (ts.isIdentifier(n)) names.add(n.text);
    ts.forEachChild(n, visit);
  };
  visit(node);
  return names;
}

/** Moving JSX must not move its reads past a possible change to those values. */
function changesBetween(scope: ts.Node, names: Set<string>, start: number, end: number): boolean {
  const rooted = (node: ts.Expression): boolean => {
    node = unwrap(node);
    if (ts.isNonNullExpression(node)) return rooted(node.expression);
    if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) return rooted(node.expression);
    if (ts.isIdentifier(node)) return names.has(node.text);
    if (ts.isArrayLiteralExpression(node)) return node.elements.some((n) => !ts.isOmittedExpression(n) && rooted(ts.isSpreadElement(n) ? n.expression : n));
    if (ts.isObjectLiteralExpression(node)) return node.properties.some((n) =>
      ts.isShorthandPropertyAssignment(n) ? names.has(n.name.text)
        : ts.isPropertyAssignment(n) ? rooted(n.initializer)
        : ts.isSpreadAssignment(n) && rooted(n.expression));
    return false;
  };
  let changed = false;
  const visit = (node: ts.Node) => {
    if (changed || node.getEnd() <= start || node.getStart() >= end) return;
    if (node.getStart() >= start) {
      if (ts.isBinaryExpression(node) && node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment && node.operatorToken.kind <= ts.SyntaxKind.LastAssignment) changed = rooted(node.left);
      else if (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) changed = [ts.SyntaxKind.PlusPlusToken, ts.SyntaxKind.MinusMinusToken].includes(node.operator) && rooted(node.operand);
      else if (ts.isDeleteExpression(node)) changed = rooted(node.expression);
      else if (ts.isCallExpression(node) && (ts.isPropertyAccessExpression(node.expression) || ts.isElementAccessExpression(node.expression))) changed = rooted(node.expression);
    }
    if (!changed) ts.forEachChild(node, visit);
  };
  visit(scope);
  return changed;
}

/** Whether a function or block between `ref` and `scope` declares one of `names`. */
function shadowed(ref: ts.Node, scope: ts.Node, names: Set<string>): boolean {
  const declares = (binding: ts.BindingName): boolean =>
    ts.isIdentifier(binding)
      ? names.has(binding.text)
      : binding.elements.some((e) => !ts.isOmittedExpression(e) && declares(e.name));
  for (let node: ts.Node = ref.parent; node && node !== scope; node = node.parent) {
    if (ts.isFunctionLike(node) && node.parameters.some((p) => declares(p.name))) return true;
    // A loop's variable (`for (const item of items)`) and a catch clause's.
    if ((ts.isForStatement(node) || ts.isForInStatement(node) || ts.isForOfStatement(node)) && node.initializer && ts.isVariableDeclarationList(node.initializer) && node.initializer.declarations.some((d) => declares(d.name))) return true;
    if (ts.isCatchClause(node) && node.variableDeclaration && declares(node.variableDeclaration.name)) return true;
    if (ts.isBlock(node) || ts.isSourceFile(node)) {
      for (const statement of node.statements) {
        if (ts.isVariableStatement(statement) && statement.declarationList.declarations.some((d) => declares(d.name))) return true;
        if ((ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement)) && statement.name && names.has(statement.name.text)) return true;
      }
    }
  }
  return false;
}

function isJsx(node: ts.Node): boolean {
  return ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node);
}

function unwrap(node: ts.Expression): ts.Expression {
  while (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isSatisfiesExpression(node)) node = node.expression;
  return node;
}

/**
 * A list mapped with a function of the file's own given by name (`articles.map(renderArticle)`): the function is
 * written in its place (`articles.map((a: Article) => <Section…>)`), so its JSX converts as a loop's does. Left as a
 * name, it was code the converter can't see into, and its links and images were written as text.
 */
export function inlineMapCallbacks(source: string, fileName: string): { source: string; inlined: string[] } {
  const file = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  // The file's functions by name: `function f(…) {…}` and `const f = (…) => …`, declared once.
  const functions = new Map<string, ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression>();
  const counts = new Map<string, number>();
  const collect = (node: ts.Node): void => {
    if (ts.isFunctionDeclaration(node) && node.name && node.body) functions.set(node.name.text, node);
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer && (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer))) functions.set(node.name.text, node.initializer);
    if ((ts.isFunctionDeclaration(node) || ts.isVariableDeclaration(node)) && node.name && ts.isIdentifier(node.name)) counts.set(node.name.text, (counts.get(node.name.text) ?? 0) + 1);
    ts.forEachChild(node, collect);
  };
  collect(file);
  const returnsJsx = (fn: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression): boolean => {
    if (fn.asteriskToken || fn.modifiers?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword)) return false;
    const isJsx = (e: ts.Node | undefined): boolean => {
      while (e && ts.isParenthesizedExpression(e)) e = e.expression;
      return !!e && (ts.isJsxElement(e) || ts.isJsxSelfClosingElement(e) || ts.isJsxFragment(e) || (ts.isConditionalExpression(e) && (isJsx(e.whenTrue) || isJsx(e.whenFalse))));
    };
    if (fn.body && !ts.isBlock(fn.body)) return isJsx(fn.body);
    let found = false;
    const own = (n: ts.Node): void => {
      if (found || (n !== fn.body && ts.isFunctionLike(n))) return;
      if (ts.isReturnStatement(n) && isJsx(n.expression)) found = true;
      else ts.forEachChild(n, own);
    };
    if (fn.body) own(fn.body);
    return found;
  };
  // The function as an expression: an arrow with its one returned JSX, else a function expression of its body.
  const written = (fn: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression): string => {
    // Its type parameters too (`<T extends Line>(line: T)`): the types it names are declared there. A lone one
    // without a constraint is written `<T,>`, which a .tsx file doesn't read as a tag.
    const types = fn.typeParameters?.length
      ? `<${fn.typeParameters.map((t) => t.getText(file)).join(", ")}${fn.typeParameters.length === 1 && !fn.typeParameters[0].constraint ? "," : ""}>`
      : "";
    const params = `${types}(${fn.parameters.map((p) => p.getText(file)).join(", ")})`;
    if (!fn.body) return fn.getText(file);
    if (!ts.isBlock(fn.body)) return `${params} => (${fn.body.getText(file)})`;
    const [only] = fn.body.statements;
    if (fn.body.statements.length === 1 && ts.isReturnStatement(only) && only.expression) return `${params} => (${only.expression.getText(file)})`;
    return `function ${params} ${fn.body.getText(file)}`;
  };
  const edits: Array<{ from: number; to: number; text: string; name: string }> = [];
  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && ["map", "flatMap"].includes(node.expression.name.text)) {
      const [callback] = node.arguments;
      const fn = callback && ts.isIdentifier(callback) && counts.get(callback.text) === 1 ? functions.get(callback.text) : undefined;
      if (fn && callback && returnsJsx(fn) && !(callback.getStart(file) >= fn.getStart(file) && callback.getEnd() <= fn.getEnd()))
        edits.push({ from: callback.getStart(file), to: callback.getEnd(), text: written(fn), name: (callback as ts.Identifier).text });
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  for (const edit of edits.sort((a, b) => b.from - a.from)) source = source.slice(0, edit.from) + edit.text + source.slice(edit.to);
  return { source, inlined: [...new Set(edits.map((e) => e.name))] };
}
