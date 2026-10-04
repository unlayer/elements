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
        if (refs.length && usable) {
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

/** Whether a function or block between `ref` and `scope` declares one of `names`. */
function shadowed(ref: ts.Node, scope: ts.Node, names: Set<string>): boolean {
  const declares = (binding: ts.BindingName): boolean =>
    ts.isIdentifier(binding)
      ? names.has(binding.text)
      : binding.elements.some((e) => !ts.isOmittedExpression(e) && declares(e.name));
  for (let node: ts.Node = ref.parent; node && node !== scope; node = node.parent) {
    if (ts.isFunctionLike(node) && node.parameters.some((p) => declares(p.name))) return true;
    if (ts.isBlock(node)) {
      for (const statement of node.statements) {
        if (ts.isVariableStatement(statement) && statement.declarationList.declarations.some((d) => declares(d.name))) return true;
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
