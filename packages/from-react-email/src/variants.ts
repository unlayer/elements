/**
 * Before converting: a className chosen by a condition becomes the element
 * twice, once per class list, under the same condition.
 *
 *   <Section className={plan.highlighted ? "border-2 bg-indigo-50" : "border bg-white"}>…</Section>
 *   → {plan.highlighted ? <Section className="border-2 bg-indigo-50">…</Section>
 *                       : <Section className="border bg-white">…</Section>}
 *
 * Each copy has static classes, so it converts to static props, and the
 * condition stays in the code. Handles `c ? "a" : "b"`, `c && "a"` and a
 * template string with one of those inside. When the element is the only
 * child of a Column, the Column is copied instead, so the card's look can go
 * on the column.
 */

import ts from "typescript";

export function splitConditionalClasses(source: string, fileName: string): { source: string; split: number } {
  let split = 0;
  for (let round = 0; round < 50; round++) {
    const file = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const next = splitOne(file);
    if (next === undefined) break;
    source = next;
    split++;
  }
  return { source, split };
}

function splitOne(file: ts.SourceFile): string | undefined {
  let result: string | undefined;
  const visit = (node: ts.Node) => {
    if (result !== undefined) return;
    if ((ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) && insideJsx(node)) {
      const variants = classVariants(node);
      if (variants) {
        result = rewrite(file, node, variants);
        return;
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return result;
}

interface Variants {
  attribute: ts.JsxAttribute;
  condition: string;
  whenTrue: string;
  whenFalse: string;
}

function classVariants(node: ts.JsxElement | ts.JsxSelfClosingElement): Variants | undefined {
  const opening = ts.isJsxElement(node) ? node.openingElement : node;
  const attribute = opening.attributes.properties.find(
    (p): p is ts.JsxAttribute => ts.isJsxAttribute(p) && p.name.getText() === "className"
  );
  const init = attribute?.initializer;
  if (!attribute || !init || !ts.isJsxExpression(init) || !init.expression) return undefined;
  const value = unwrap(init.expression);
  const branches = choice(value);
  if (branches) return { attribute, ...branches };
  // `base ${c ? "a" : "b"} more`
  if (ts.isTemplateExpression(value) && value.templateSpans.length === 1) {
    const span = value.templateSpans[0];
    const inner = choice(unwrap(span.expression));
    if (!inner) return undefined;
    const around = (middle: string) => `${value.head.text}${middle}${span.literal.text}`;
    return { attribute, condition: inner.condition, whenTrue: around(inner.whenTrue), whenFalse: around(inner.whenFalse) };
  }
  return undefined;
}

/** `c ? "a" : "b"` / `c && "a"` with string branches. */
function choice(value: ts.Expression): { condition: string; whenTrue: string; whenFalse: string } | undefined {
  if (ts.isConditionalExpression(value)) {
    const a = text(value.whenTrue);
    const b = text(value.whenFalse);
    if (a !== undefined && b !== undefined) return { condition: value.condition.getText(), whenTrue: a, whenFalse: b };
  }
  if (ts.isBinaryExpression(value) && value.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) {
    const a = text(value.right);
    if (a !== undefined) return { condition: value.left.getText(), whenTrue: a, whenFalse: "" };
  }
  return undefined;
}

function text(node: ts.Expression): string | undefined {
  const value = unwrap(node);
  return ts.isStringLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value) ? value.text : undefined;
}

/** A class with a variant (`mobile:`, `hover:`): never inlined, so it can't make the branches differ. */
function isVariant(token: string): boolean {
  const head = token.split("[")[0];
  return head.includes(":");
}

/** A condition that's a literal once props are filled in (`(true)`, `(undefined)`): its truth. */
function literalCondition(condition: string): boolean | undefined {
  const text = condition.trim().replace(/^\((.*)\)$/s, "$1").trim();
  if (text === "true") return true;
  if (["false", "undefined", "null", "0", '""', "''"].includes(text)) return false;
  return undefined;
}

/** A margin or padding class behind a screen variant (`mobile:mb-8`), not a state like `hover:`. */
function isSpacing(token: string): boolean {
  return /^(?!(hover|focus|active|visited|disabled|group|peer|dark|first|last|odd|even)\b)[\w-]+:!?-?[mp][trblxy]?-/.test(token);
}

function variantClasses(classes: string): string[] {
  return classes.split(/\s+/).filter((t) => t && isVariant(t));
}

/**
 * true/false when `node` sits in the true/false branch of `condition` (same code, same function).
 * A condition named by a `const` (`const isLeft = side === "left"`) also matches its value.
 */
function branchOf(node: ts.Node, condition: string): boolean | undefined {
  const norm = (a: string) => a.replace(/\s+/g, "").replace(/"/g, "'");
  const names = new Set([norm(condition)]);
  const alias = /^[A-Za-z_$][\w$]*$/.test(condition.trim()) ? constValue(node, condition.trim()) : undefined;
  if (alias) names.add(norm(alias));
  const same = (a: string) => names.has(norm(a));
  for (let n: ts.Node = node; n.parent && !ts.isSourceFile(n.parent); n = n.parent) {
    const p = n.parent;
    if (ts.isConditionalExpression(p) && same(p.condition.getText())) {
      if (n === p.whenTrue) return true;
      if (n === p.whenFalse) return false;
    }
    if (ts.isFunctionLike(p)) return undefined;
  }
  return undefined;
}

/** The initializer of `const name = …` declared in a block around `node`. */
function constValue(node: ts.Node, name: string): string | undefined {
  for (let n: ts.Node | undefined = node.parent; n; n = n.parent) {
    if (!ts.isBlock(n) && !ts.isSourceFile(n)) continue;
    for (const statement of n.statements) {
      if (!ts.isVariableStatement(statement) || !(statement.declarationList.flags & ts.NodeFlags.Const)) continue;
      for (const decl of statement.declarationList.declarations) {
        if (ts.isIdentifier(decl.name) && decl.name.text === name && decl.initializer) return decl.initializer.getText();
      }
    }
  }
  return undefined;
}

function inlinable(classes: string): string[] {
  return classes.split(/\s+/).filter((t) => t && !isVariant(t)).sort();
}

function rewrite(file: ts.SourceFile, node: ts.JsxElement | ts.JsxSelfClosingElement, variants: Variants): string {
  const source = file.getFullText();
  const attribute = variants.attribute;
  const replaceWith = (classes: string) => source.slice(0, attribute.getStart()) + `className=${JSON.stringify(classes)}` + source.slice(attribute.getEnd());
  // Already inside a branch of the same condition (`c ? <>{a}{b}</> : <>{b}{a}</>`): that branch's classes.
  const known = literalCondition(variants.condition) ?? branchOf(node, variants.condition);
  if (known !== undefined) return replaceWith(known ? variants.whenTrue : variants.whenFalse);
  // Branches that differ only in variant classes give the same styles: one static class list,
  // keeping the variant classes (`mobile:!block`) both branches share.
  const a = inlinable(variants.whenTrue);
  const b = inlinable(variants.whenFalse);
  if (a.length === b.length && a.every((t, i) => t === b[i])) {
    const inTrue = variantClasses(variants.whenTrue);
    const inFalse = variantClasses(variants.whenFalse);
    const shared = inTrue.filter((t) => inFalse.includes(t));
    // Spacing only one branch has (`isLast ? "" : " mobile:mb-8"`): kept, since a gap too many
    // reads closer to the original than every gap missing. Not when the other branch sets it too.
    const key = (t: string) => t.replace(/-[^-]*$/, "");
    const oneSided = [...inTrue.filter((t) => !inFalse.includes(t)), ...inFalse.filter((t) => !inTrue.includes(t))].filter(
      (t) => isSpacing(t) && ![...inTrue, ...inFalse].some((o) => o !== t && key(o) === key(t)),
    );
    return replaceWith([...shared, ...oneSided, ...a].join(" "));
  }
  // The only child of a Column: copy the Column.
  const parent = node.parent;
  const host =
    ts.isJsxElement(parent) &&
    parent.openingElement.tagName.getText() === "Column" &&
    parent.children.filter((c) => !(ts.isJsxText(c) && !c.text.trim())).length === 1
      ? parent
      : node;
  const start = host.getStart();
  const base = host.getText();
  const attr = { from: variants.attribute.getStart() - start, to: variants.attribute.getEnd() - start };
  const copy = (classes: string) => `${base.slice(0, attr.from)}className=${JSON.stringify(classes)}${base.slice(attr.to)}`;
  const choiceText = `${variants.condition} ? (${copy(variants.whenTrue)}) : (${copy(variants.whenFalse)})`;
  const inChild = ts.isJsxElement(host.parent) || ts.isJsxFragment(host.parent);
  const replacement = inChild ? `{${choiceText}}` : `(${choiceText})`;
  return source.slice(0, start) + replacement + source.slice(host.getEnd());
}

/**
 * Inside another element's children or a {…} in JSX — including what a
 * callback in there returns (`items.map(i => <Section/>)`) — where a
 * `c ? <A/> : <B/>` can go. Not the template's own root.
 */
function insideJsx(node: ts.Node): boolean {
  for (let n = node.parent; n && !ts.isSourceFile(n); n = n.parent) {
    if (ts.isJsxElement(n) || ts.isJsxFragment(n) || ts.isJsxExpression(n)) return true;
    if (ts.isFunctionLike(n)) return n.parent ? insideJsx(n) : false;
  }
  return false;
}

function unwrap(node: ts.Expression): ts.Expression {
  while (ts.isParenthesizedExpression(node) || ts.isAsExpression(node)) node = node.expression;
  return node;
}
