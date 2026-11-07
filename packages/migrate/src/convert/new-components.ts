/**
 * The converters' intermediate source in the new components. A converter writes a template in Elements 0.2's
 * components ("today's") as source text first; `migrateElements` rewrites it in the new ones at once, and what it can't
 * rewrite fails here, saying why. Today's components are never run: 0.3.0 doesn't have them.
 */

import React from "react";
import ts from "typescript";
import { migrateElements } from "./elements/codemod";
import { TODAYS_COMPONENTS, treeToTsx, type PrintOptions } from "./print";
import type { ElementNode } from "./tree";

/** A template the converter couldn't write in the new components: why, and its source in today's components. */
export class NewComponentsError extends Error {
  override readonly name = "NewComponentsError";
  /** Why it can't be written in the new components. */
  readonly reason: string;
  /** The template as the converter wrote it before, in today's components: what couldn't be moved. */
  readonly intermediate: string;

  constructor(reason: string, intermediate: string) {
    super(`it can't be written in the new components: ${reason}`);
    this.reason = reason;
    this.intermediate = intermediate;
  }
}

export interface NewComponents {
  /** The module in the new components, formatted. */
  code: string;
  /** What the codemod said it may change, or left out: one line each, with where. */
  notes: string[];
  /** Of those, the Rows whose Columns are written one under another (their layout can't be read): they move. */
  stacked: string[];
}

/** The first line of what was thrown. */
const firstLine = (error: unknown) => (error instanceof Error ? error.message : String(error)).split("\n")[0];

/**
 * A module in today's components (the converter's intermediate source) in the new ones. Throws a `NewComponentsError`
 * where it can't be: the codemod fails, the template's root is chosen at run time, or what it writes still uses today's.
 */
export async function toNewComponents(intermediate: string, options: { typescript?: boolean } = {}): Promise<NewComponents> {
  let moved: Awaited<ReturnType<typeof migrateElements>>;
  try {
    moved = await migrateElements(intermediate, { typescript: options.typescript });
  } catch (error) {
    throw new NewComponentsError(firstLine(error), intermediate);
  }
  if (moved.stayed) throw new NewComponentsError(moved.report.join("; "), intermediate);
  const left = todaysLeft(moved.code);
  if (left.length) {
    // What the codemod said of each (`ColumnLayouts stays imported from …: it's used other than as …`).
    const why = moved.report.filter((line) => left.some((name) => line.includes(` ${name} `)));
    throw new NewComponentsError(`it still uses Unlayer Elements' ${left.join(", ")}${why.length ? ` (${why.join("; ")})` : ""}`, intermediate);
  }
  return { code: moved.code, notes: moved.report, stacked: moved.stacked ?? [] };
}

/** An Elements tree (today's components) as a module in the new ones: printed, then rewritten (see `toNewComponents`). */
export async function treeToNewComponents(tree: ElementNode, options: PrintOptions = {}): Promise<NewComponents> {
  return toNewComponents(await treeToTsx(tree, options));
}

/**
 * What a module the codemod wrote still has of today's components: names it imports from where the intermediate source
 * imports them, and elements and layouts (`<Row>`, `ColumnLayouts`) it uses but neither imports nor declares.
 */
function todaysLeft(code: string): string[] {
  const file = ts.createSourceFile("template.tsx", code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const left = new Set<string>();
  const known = new Set<string>();
  for (const statement of file.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
    const clause = statement.importClause;
    const names = [
      ...(clause?.name ? [clause.name.text] : []),
      ...(clause?.namedBindings ? (ts.isNamespaceImport(clause.namedBindings) ? [clause.namedBindings.name.text] : clause.namedBindings.elements.map((e) => e.name.text)) : []),
    ];
    if (statement.moduleSpecifier.text === TODAYS_COMPONENTS) names.forEach((name) => left.add(name));
    else names.forEach((name) => known.add(name));
  }
  const declared = (n: ts.Node): void => {
    const name = (n as { name?: ts.Node }).name;
    if ((ts.isVariableDeclaration(n) || ts.isFunctionDeclaration(n) || ts.isClassDeclaration(n) || ts.isParameter(n) || ts.isBindingElement(n)) && name && ts.isIdentifier(name)) known.add(name.text);
    ts.forEachChild(n, declared);
  };
  declared(file);
  const used = (n: ts.Node): void => {
    if (ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) {
      let tag: ts.Node = n.tagName;
      while (ts.isPropertyAccessExpression(tag)) tag = tag.expression;
      if (ts.isIdentifier(tag) && /^[A-Z]/.test(tag.text) && !known.has(tag.text)) left.add(tag.text);
    }
    if (ts.isIdentifier(n) && n.text === "ColumnLayouts" && !known.has(n.text)) left.add(n.text);
    ts.forEachChild(n, used);
  };
  used(file);
  return [...left];
}

/** The names the reader gives JSX's factory and fragment: no template has them. */
const FACTORY = "__elementsTemplateJsx";
const FRAGMENT = "__elementsTemplateFragment";

/**
 * The element a module the codemod wrote from an Elements tree renders: its default export's return, read without
 * running it (no `eval`). Such a module holds only imports (each from one of `modules`) and a component returning JSX
 * with literal values, as a tree printed has nothing else; TypeScript writes its JSX as calls (with JSX's own spacing
 * and entities), which are read here. Anything else (code, a name it doesn't import) throws, saying what.
 */
export function readTemplate(code: string, modules: Record<string, Record<string, unknown>>): React.ReactElement {
  // The comments before its first line choose how its JSX compiles (`/** @jsxRuntime automatic */`): not here.
  const leading = ts.getLeadingCommentRanges(code, 0) ?? [];
  const head = leading.length ? leading[leading.length - 1].end : 0;
  const js = ts.transpileModule(code.slice(0, head).replace(/@jsx/g, "@-jsx") + code.slice(head), {
    fileName: "template.tsx",
    compilerOptions: { jsx: ts.JsxEmit.React, jsxFactory: FACTORY, jsxFragmentFactory: FRAGMENT, target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext },
  }).outputText;
  const file = ts.createSourceFile("template.js", js, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const scope = new Map<string, unknown>();
  const unread = (node: ts.Node, what = "this code"): never => {
    const text = node.getText(file).replace(/\s+/g, " ");
    throw new Error(`the template can't be read as it's written: ${what} (${text.length > 80 ? `${text.slice(0, 80)}…` : text})`);
  };
  let returned: ts.Expression | undefined;
  for (const statement of file.statements) {
    if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier)) {
      const specifier = statement.moduleSpecifier.text;
      const module = Object.prototype.hasOwnProperty.call(modules, specifier) ? modules[specifier] : undefined;
      if (!module) unread(statement, `an import of ${specifier}`);
      const clause = statement.importClause;
      if (clause?.name) scope.set(clause.name.text, module!.default ?? module);
      const bindings = clause?.namedBindings;
      if (bindings && ts.isNamespaceImport(bindings)) scope.set(bindings.name.text, module);
      else if (bindings) {
        for (const element of bindings.elements) {
          const name = (element.propertyName ?? element.name).text;
          if (!Object.prototype.hasOwnProperty.call(module, name)) unread(element, `${specifier} has no ${name}`);
          scope.set(element.name.text, module![name]);
        }
      }
      continue;
    }
    const exportedDefault = ts.isFunctionDeclaration(statement) && (ts.getModifiers(statement) ?? []).some((m) => m.kind === ts.SyntaxKind.DefaultKeyword);
    if (!exportedDefault || returned || !statement.body || statement.parameters.length) return unread(statement);
    const [only, ...rest] = statement.body.statements;
    if (!only || rest.length || !ts.isReturnStatement(only) || !only.expression) return unread(statement.body, "a component that does more than return its JSX");
    returned = only.expression;
  }
  if (!returned) throw new Error("the template can't be read as it's written: it has no default-exported component");

  const value = (node: ts.Expression): unknown => {
    if (ts.isParenthesizedExpression(node)) return value(node.expression);
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
    if (ts.isNumericLiteral(node)) return Number(node.text);
    if (ts.isPrefixUnaryExpression(node) && ts.isNumericLiteral(node.operand) && (node.operator === ts.SyntaxKind.MinusToken || node.operator === ts.SyntaxKind.PlusToken)) {
      return (node.operator === ts.SyntaxKind.MinusToken ? -1 : 1) * Number(node.operand.text);
    }
    if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
    if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
    if (node.kind === ts.SyntaxKind.NullKeyword) return null;
    if (ts.isIdentifier(node) && node.text === "undefined") return undefined;
    if (ts.isArrayLiteralExpression(node)) return node.elements.map((element) => (ts.isSpreadElement(element) || ts.isOmittedExpression(element) ? unread(element) : value(element)));
    if (ts.isObjectLiteralExpression(node)) {
      const out: Record<string, unknown> = {};
      for (const property of node.properties) {
        if (ts.isSpreadAssignment(property)) {
          const spread = value(property.expression);
          if (!spread || typeof spread !== "object" || Array.isArray(spread)) unread(property);
          Object.assign(out, spread);
        } else if (ts.isPropertyAssignment(property) && (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name) || ts.isNumericLiteral(property.name))) {
          out[property.name.text] = value(property.initializer);
        } else unread(property);
      }
      return out;
    }
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === FACTORY && node.arguments.length >= 2) {
      const [tag, props, ...children] = node.arguments;
      const type = component(tag);
      const given = value(props);
      if (given !== null && (typeof given !== "object" || Array.isArray(given))) unread(props);
      return React.createElement(type as React.ElementType, given as Record<string, unknown> | null, ...(children.map(value) as React.ReactNode[]));
    }
    return unread(node);
  };
  const component = (tag: ts.Expression): unknown => {
    if (ts.isIdentifier(tag) && tag.text === FRAGMENT) return React.Fragment;
    if (ts.isStringLiteral(tag)) return tag.text;
    if (ts.isIdentifier(tag) && scope.has(tag.text)) return scope.get(tag.text);
    if (ts.isPropertyAccessExpression(tag) && ts.isIdentifier(tag.expression) && scope.has(tag.expression.text)) {
      const holder = scope.get(tag.expression.text) as Record<string, unknown> | undefined;
      if (holder && Object.prototype.hasOwnProperty.call(holder, tag.name.text)) return holder[tag.name.text];
    }
    return unread(tag, "a component it doesn't import");
  };
  const root = value(returned);
  if (!React.isValidElement(root)) throw new Error("the template can't be read as it's written: it doesn't return an element");
  return root;
}
