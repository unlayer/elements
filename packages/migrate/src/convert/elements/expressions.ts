/**
 * Whether the migration may write an expression of the template twice (`(logo) ? <Image src={logo} /> : null`):
 * reading it again gives the same value and does nothing else. A name, a property of one, a literal, and choices,
 * comparisons, joins, objects and arrays of those can be; a call, `new`, an assignment, `++`, `await` or `yield` may
 * do something, or give something else, each time it runs (`images.shift()`), so it's written once.
 */
import ts from "typescript";

export function readsTwice(node: ts.Expression): boolean {
  if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isSatisfiesExpression(node) || ts.isNonNullExpression(node) || ts.isTypeAssertionExpression(node)) return readsTwice(node.expression);
  if (ts.isIdentifier(node) || ts.isStringLiteral(node) || ts.isNumericLiteral(node) || ts.isBigIntLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return true;
  if ([ts.SyntaxKind.ThisKeyword, ts.SyntaxKind.TrueKeyword, ts.SyntaxKind.FalseKeyword, ts.SyntaxKind.NullKeyword].includes(node.kind)) return true;
  if (ts.isPropertyAccessExpression(node)) return readsTwice(node.expression);
  if (ts.isElementAccessExpression(node)) return readsTwice(node.expression) && readsTwice(node.argumentExpression);
  if (ts.isTemplateExpression(node)) return node.templateSpans.every((span) => readsTwice(span.expression));
  if (ts.isConditionalExpression(node)) return readsTwice(node.condition) && readsTwice(node.whenTrue) && readsTwice(node.whenFalse);
  if (ts.isPrefixUnaryExpression(node)) return node.operator !== ts.SyntaxKind.PlusPlusToken && node.operator !== ts.SyntaxKind.MinusMinusToken && readsTwice(node.operand);
  if (ts.isTypeOfExpression(node)) return readsTwice(node.expression);
  // An object of such values (`{ color: fg, ...theme }`), by names or by keys that are such values themselves. A method
  // or an accessor is code of its own.
  if (ts.isObjectLiteralExpression(node)) {
    return node.properties.every((property) => {
      if (ts.isShorthandPropertyAssignment(property)) return !property.objectAssignmentInitializer;
      if (ts.isSpreadAssignment(property)) return readsTwice(property.expression);
      return ts.isPropertyAssignment(property) && (!ts.isComputedPropertyName(property.name) || readsTwice(property.name.expression)) && readsTwice(property.initializer);
    });
  }
  // An array of such values. Spreading one (`[...items]`) iterates it, which an iterator does only once.
  if (ts.isArrayLiteralExpression(node)) return node.elements.every((element) => ts.isOmittedExpression(element) || (!ts.isSpreadElement(element) && readsTwice(element)));
  if (ts.isBinaryExpression(node)) {
    const operator = node.operatorToken.kind;
    const assigns = operator >= ts.SyntaxKind.FirstAssignment && operator <= ts.SyntaxKind.LastAssignment;
    return !assigns && readsTwice(node.left) && readsTwice(node.right);
  }
  return false;
}

/** The same, for an expression's source (one in a template literal's `${…}`). */
export function sourceReadsTwice(code: string): boolean {
  const file = ts.createSourceFile("expression.tsx", `(${code});`, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const [statement] = file.statements;
  return file.statements.length === 1 && ts.isExpressionStatement(statement) && readsTwice(statement.expression);
}
