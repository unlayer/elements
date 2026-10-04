/**
 * Relative imports in a file that moves: rewritten to reach the same modules
 * from the new place (a migrated template written to another folder).
 */

import path from "node:path";
import ts from "typescript";

export function rebaseImports(code: string, fromFile: string, toFile: string): string {
  const fromDir = path.dirname(path.resolve(fromFile));
  const toDir = path.dirname(path.resolve(toFile));
  if (fromDir === toDir) return code;
  const file = ts.createSourceFile(toFile, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const edits: Array<{ from: number; to: number; text: string }> = [];
  const rebase = (literal: ts.StringLiteralLike) => {
    const specifier = literal.text;
    if (!specifier.startsWith("./") && !specifier.startsWith("../") && specifier !== "." && specifier !== "..") return;
    let next = path.relative(toDir, path.resolve(fromDir, specifier)).split(path.sep).join("/");
    if (!next.startsWith(".")) next = `./${next}`;
    edits.push({ from: literal.getStart() + 1, to: literal.getEnd() - 1, text: next });
  };
  const visit = (node: ts.Node) => {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      rebase(node.moduleSpecifier);
    } else if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(node.expression) && node.expression.text === "require")) &&
      node.arguments.length === 1 &&
      ts.isStringLiteralLike(node.arguments[0])
    ) {
      rebase(node.arguments[0]);
    } else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument) && ts.isStringLiteral(node.argument.literal)) {
      rebase(node.argument.literal);
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  edits.sort((a, b) => b.from - a.from);
  for (const edit of edits) code = code.slice(0, edit.from) + edit.text + code.slice(edit.to);
  return code;
}
