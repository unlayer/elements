/**
 * Before converting: put the JSX of components defined in the same file
 * (an `EmailLayout`, a `FeatureRow`) where they're used, with their props
 * filled in, so their React Email markup converts like the template's own.
 *
 *   const Layout = ({ preview, children }) => <Html><Preview>{preview}</Preview>…{children}…</Html>;
 *   export default () => <Layout preview="Hi"><Text>Body</Text></Layout>;
 *
 * Components imported from other files (`import { Footer } from "./footer"`)
 * are inlined the same way when `load` can read them; what they use from
 * their own module comes along (its imports, rebased; its constants,
 * imported when exported, else copied).
 *
 * Only components whose body is a single returned JSX expression (after any
 * `const`s), whose props are a plain destructuring (or read as `props.x`),
 * and whose names can't be captured either way. Anything else stays a
 * component (kept as HTML).
 */

import path from "node:path";
import ts from "typescript";

/** Reads the module an import refers to (`specifier`, imported from `fromFile`). */
export type ModuleLoader = (specifier: string, fromFile: string) => { fileName: string; source: string } | undefined;

export function inlineLocalComponents(source: string, fileName: string, load?: ModuleLoader): { source: string; inlined: string[]; copied: string[] } {
  const inlined = new Set<string>();
  const copied = new Set<string>();
  const skipped = new Set<number>(); // usage positions that can't be inlined
  const modules = new Map<string, ts.SourceFile | null>();
  const foreign = (specifier: string): ts.SourceFile | undefined => {
    if (!load) return undefined;
    if (!modules.has(specifier)) {
      const loaded = load(specifier, fileName);
      modules.set(specifier, loaded ? ts.createSourceFile(loaded.fileName, loaded.source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX) : null);
    }
    return modules.get(specifier) ?? undefined;
  };
  for (let round = 0; round < 200; round++) {
    const file = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const next = inlineOne(file, skipped, foreign);
    if (!next) break;
    if (next.skip !== undefined) {
      skipped.add(next.skip);
      continue;
    }
    source = next.source;
    inlined.add(next.name);
    for (const name of next.copied ?? []) copied.add(name);
  }
  // Components no longer used: their declarations, and imports of them, go.
  if (inlined.size) source = removeUnused(source, fileName, inlined);
  return { source, inlined: [...inlined], copied: [...copied] };
}

/** A component from another module: where it is, and how the template imports it. */
interface Imported {
  file: ts.SourceFile;
  /** The template's specifier for that module. */
  specifier: string;
}

interface Component {
  name: string;
  declaration: ts.Node;
  returned: ts.Expression;
  /** `const x = …` before the return, in order: substituted like props. */
  consts: Array<{ name: string; init: ts.Expression }>;
  /** Prop name → the local it binds and its default value. */
  props?: Map<string, { local: string; fallback?: ts.Expression }>;
  /** `(props) => …props.x…` */
  propsObject?: string;
}

function inlineOne(
  file: ts.SourceFile,
  skipped: Set<number>,
  foreign: (specifier: string) => ts.SourceFile | undefined
): { source: string; name: string; copied?: string[]; skip?: undefined } | { skip: number } | undefined {
  const components = localComponents(file);
  const imports = importedBindings(file);
  let found: { usage: ts.JsxElement | ts.JsxSelfClosingElement; component: Component; from?: Imported } | undefined;
  const visit = (node: ts.Node) => {
    if (found) return;
    if ((ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) && !skipped.has(node.getStart())) {
      const tag = (ts.isJsxElement(node) ? node.openingElement : node).tagName.getText();
      const component = components.get(tag);
      if (component && !contains(component.declaration, node)) {
        found = { usage: node, component };
        return;
      }
      const binding = imports.get(tag);
      if (binding && /^[A-Z]/.test(tag) && !binding.namespace && !/^(react|react-dom|react-email|@react-email\/)/.test(binding.specifier)) {
        const module = foreign(binding.specifier);
        const exported = module && exportedComponent(module, binding.imported);
        if (module && exported) {
          found = { usage: node, component: exported, from: { file: module, specifier: binding.specifier } };
          return;
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  if (!found) return undefined;
  const text = substitute(found.usage, found.component);
  if (text === undefined) return { skip: found.usage.getStart() };
  // An imported component's own imports and constants come along.
  const needs = found.from ? requirements(found.component, found.from, file) : { imports: [], declarations: [], copied: [] };
  if (!needs) return { skip: found.usage.getStart() };
  const usage = found.usage;
  const inChildPosition = ts.isJsxElement(usage.parent) || ts.isJsxFragment(usage.parent);
  const replacement = inChildPosition ? text : `(${text})`;
  const source = file.getFullText();
  let next = source.slice(0, usage.getStart()) + replacement + source.slice(usage.getEnd());
  const added = [...needs.imports, ...needs.declarations];
  if (added.length) {
    const lastImport = [...file.statements].reverse().find(ts.isImportDeclaration);
    const at = lastImport ? lastImport.getEnd() : 0;
    next = `${next.slice(0, at)}\n${added.join("\n")}\n${next.slice(at)}`;
  }
  // Imported: reported by the name the template uses.
  const name = found.from ? (ts.isJsxElement(usage) ? usage.openingElement : usage).tagName.getText() : found.component.name;
  return { source: next, name, copied: needs.copied };
}

function isPackage(specifier: string): boolean {
  return !specifier.startsWith(".") && !specifier.startsWith("/");
}

/** The template's import bindings: local name → module and imported name. */
function importedBindings(file: ts.SourceFile): Map<string, { specifier: string; imported: string; namespace?: boolean }> {
  const out = new Map<string, { specifier: string; imported: string; namespace?: boolean }>();
  for (const statement of file.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier) || statement.importClause?.isTypeOnly) continue;
    const specifier = statement.moduleSpecifier.text;
    const clause = statement.importClause;
    if (clause?.name) out.set(clause.name.text, { specifier, imported: "default" });
    const bindings = clause?.namedBindings;
    if (bindings && ts.isNamedImports(bindings)) {
      for (const element of bindings.elements) {
        if (!element.isTypeOnly) out.set(element.name.text, { specifier, imported: (element.propertyName ?? element.name).text });
      }
    }
    if (bindings && ts.isNamespaceImport(bindings)) out.set(bindings.name.text, { specifier, imported: "*", namespace: true });
  }
  return out;
}

/** A module's component exported as `name` ("default" for the default export). */
function exportedComponent(file: ts.SourceFile, name: string): Component | undefined {
  if (name === "default") {
    for (const statement of file.statements) {
      if (ts.isFunctionDeclaration(statement) && hasDefault(statement)) return componentFrom(statement.name?.text ?? "Default", statement, statement);
      if (ts.isExportAssignment(statement)) {
        const value = unwrap(statement.expression);
        if (ts.isArrowFunction(value) || ts.isFunctionExpression(value)) return componentFrom("Default", statement, value);
        if (ts.isIdentifier(value)) return localComponents(file, true).get(value.text);
      }
    }
    return undefined;
  }
  const exportedNames = new Map<string, string>(); // export name → local name (`export { A as B }`)
  for (const statement of file.statements) {
    if (ts.isExportDeclaration(statement) && !statement.moduleSpecifier && statement.exportClause && ts.isNamedExports(statement.exportClause)) {
      for (const element of statement.exportClause.elements) exportedNames.set(element.name.text, (element.propertyName ?? element.name).text);
    }
  }
  const local = localComponents(file, true);
  const direct = local.get(name);
  if (direct && isExported(direct.declaration)) return direct;
  const aliased = exportedNames.get(name);
  return aliased ? local.get(aliased) : undefined;
}

/**
 * What an imported component reads from its own module, made available in
 * the template: its imports (paths rebased), and its module's constants
 * (imported when exported, else copied). Undefined when a name would clash.
 */
function requirements(component: Component, from: Imported, template: ts.SourceFile): { imports: string[]; declarations: string[]; copied: string[] } | undefined {
  const module = from.file;
  const imports: string[] = [];
  const copies: string[] = [];
  const copiedNames: string[] = [];
  const templateBindings = topLevelBindings(template);
  const moduleImports = importedBindings(module);
  const moduleDeclarations = new Map<string, ts.Statement>();
  for (const statement of module.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name) moduleDeclarations.set(statement.name.text, statement);
    if (ts.isVariableStatement(statement)) {
      for (const decl of statement.declarationList.declarations) if (ts.isIdentifier(decl.name)) moduleDeclarations.set(decl.name.text, statement);
    }
  }
  const templateImports = importedBindings(template);
  const done = new Set<string>();

  const need = (names: Iterable<string>, depth: number): boolean => {
    for (const name of names) {
      if (done.has(name)) continue;
      done.add(name);
      const imported = moduleImports.get(name);
      const declared = moduleDeclarations.get(name);
      let wanted: { specifier: string; imported: string; namespace?: boolean } | undefined;
      if (imported) {
        wanted = { ...imported, specifier: rebase(imported.specifier, module.fileName, template.fileName) };
      } else if (declared && isExported(declared)) {
        wanted = { specifier: from.specifier, imported: name };
      } else if (declared) {
        // Not exported: a copy of its declaration (a const or function), and what it needs in turn.
        if (depth > 5 || templateBindings.has(name)) return false;
        if (!(ts.isVariableStatement(declared) && declared.declarationList.flags & ts.NodeFlags.Const && declared.declarationList.declarations.length === 1) && !ts.isFunctionDeclaration(declared)) return false;
        if (!need(freeIdentifiers(declared), depth + 1)) return false;
        copies.push(declared.getText());
        copiedNames.push(name);
        continue;
      } else {
        continue; // a global (Date, Math, process)
      }
      const existing = templateImports.get(name);
      if (existing) {
        if (existing.imported !== wanted.imported || existing.namespace !== wanted.namespace) return false;
        if (path.resolve(path.dirname(template.fileName), existing.specifier) !== path.resolve(path.dirname(template.fileName), wanted.specifier) && existing.specifier !== wanted.specifier) return false;
        continue;
      }
      if (templateBindings.has(name)) return false;
      imports.push(
        wanted.namespace
          ? `import * as ${name} from ${JSON.stringify(wanted.specifier)};`
          : wanted.imported === "default"
            ? `import ${name} from ${JSON.stringify(wanted.specifier)};`
            : `import { ${wanted.imported === name ? name : `${wanted.imported} as ${name}`} } from ${JSON.stringify(wanted.specifier)};`
      );
    }
    return true;
  };

  const parts: ts.Node[] = [...component.consts.map((c) => c.init), component.returned, ...[...(component.props?.values() ?? [])].flatMap((p) => (p.fallback ? [p.fallback] : []))];
  const declaredInside = new Set(parts.flatMap((part) => [...declarations(part)]));
  const own = new Set([...component.consts.map((c) => c.name), ...[...(component.props?.values() ?? [])].map((p) => p.local), ...(component.propsObject ? [component.propsObject] : [])]);
  const free = new Set(parts.flatMap((part) => [...identifiersIn(part)]).filter((n) => !declaredInside.has(n) && !own.has(n)));
  return need(free, 0) ? { imports, declarations: copies, copied: copiedNames } : undefined;
}

/** A module specifier as seen from another file (packages stay as they are). */
function rebase(specifier: string, fromFile: string, toFile: string): string {
  if (isPackage(specifier)) return specifier;
  let next = path.relative(path.dirname(toFile), path.resolve(path.dirname(fromFile), specifier)).split(path.sep).join("/");
  if (!next.startsWith(".")) next = `./${next}`;
  return next;
}

/** Names a file declares or imports at the top level. */
function topLevelBindings(file: ts.SourceFile): Set<string> {
  const names = new Set<string>(importedBindings(file).keys());
  for (const statement of file.statements) {
    if ((ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement)) && statement.name) names.add(statement.name.text);
    if (ts.isVariableStatement(statement)) for (const d of statement.declarationList.declarations) if (ts.isIdentifier(d.name)) names.add(d.name.text);
  }
  return names;
}

/** Identifiers a declaration reads that it doesn't declare itself. */
function freeIdentifiers(node: ts.Node): Set<string> {
  const declared = declarations(node);
  const own = ts.isVariableStatement(node) ? node.declarationList.declarations.map((d) => d.name.getText()) : ts.isFunctionDeclaration(node) && node.name ? [node.name.text] : [];
  return new Set([...identifiersIn(node)].filter((n) => !declared.has(n) && !own.includes(n)));
}

/** Top-level components that return one JSX expression (not the default export, unless `all`). */
function localComponents(file: ts.SourceFile, all = false): Map<string, Component> {
  const out = new Map<string, Component>();
  const defaultName = all ? undefined : defaultExportName(file);
  const add = (name: string, declaration: ts.Node, fn: ts.FunctionLikeDeclaration) => {
    if (!/^[A-Z]/.test(name) || name === defaultName) return;
    const component = componentFrom(name, declaration, fn);
    if (component) out.set(name, component);
  };
  for (const statement of file.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name && (all || !hasDefault(statement))) add(statement.name.text, statement, statement);
    if (ts.isVariableStatement(statement)) {
      for (const decl of statement.declarationList.declarations) {
        const init = decl.initializer && unwrap(decl.initializer);
        if (ts.isIdentifier(decl.name) && init && (ts.isArrowFunction(init) || ts.isFunctionExpression(init))) add(decl.name.text, statement, init);
      }
    }
  }
  return out;
}

function componentFrom(name: string, declaration: ts.Node, fn: ts.FunctionLikeDeclaration): Component | undefined {
  const body = componentBody(fn);
  if (!body || !isJsx(body.returned) || fn.parameters.length > 1) return undefined;
  const component: Component = { name, declaration, returned: body.returned, consts: body.consts };
  const param = fn.parameters[0];
  if (param) {
    if (ts.isObjectBindingPattern(param.name)) {
      const props = new Map<string, { local: string; fallback?: ts.Expression }>();
      for (const element of param.name.elements) {
        if (element.dotDotDotToken || !ts.isIdentifier(element.name)) return undefined;
        const prop = element.propertyName ? element.propertyName.getText() : element.name.text;
        props.set(prop, { local: element.name.text, fallback: element.initializer });
      }
      component.props = props;
    } else if (ts.isIdentifier(param.name)) {
      component.propsObject = param.name.text;
    } else {
      return undefined;
    }
  }
  return component;
}

/** The component's JSX with this usage's props filled in, or undefined when that isn't safe. */
function substitute(usage: ts.JsxElement | ts.JsxSelfClosingElement, component: Component): string | undefined {
  const opening = ts.isJsxElement(usage) ? usage.openingElement : usage;
  const values = new Map<string, { code: string; node?: ts.Expression }>();
  for (const attr of opening.attributes.properties) {
    if (ts.isJsxSpreadAttribute(attr)) return undefined;
    const name = attr.name.getText();
    const init = attr.initializer;
    if (!init) values.set(name, { code: "true" });
    else if (ts.isStringLiteral(init)) values.set(name, { code: JSON.stringify(init.text) });
    else if (ts.isJsxExpression(init) && init.expression) values.set(name, { code: init.expression.getText(), node: init.expression });
    else return undefined;
  }
  const key = values.get("key");
  values.delete("key");
  const children = ts.isJsxElement(usage) ? usage.children : undefined;
  const childrenText = children && children.length ? children.map((c) => c.getFullText()).join("") : undefined;

  const parts: ts.Node[] = [...component.consts.map((c) => c.init), component.returned];
  const declaredInside = new Set(parts.flatMap((part) => [...declarations(part)]));
  const constNames = new Set(component.consts.map((c) => c.name));
  const propLocals = new Set([...(component.props?.values() ?? [])].map((p) => p.local).concat(component.propsObject ?? []));

  // Names the component reads from its module must mean the same where it's used…
  const free = [...new Set(parts.flatMap((part) => [...identifiersIn(part)]))].filter(
    (n) => !declaredInside.has(n) && !propLocals.has(n) && !constNames.has(n)
  );
  if (shadowedAt(usage, free)) return undefined;
  // …and what's passed in mustn't be captured by names the component declares.
  const capturable = new Set([...declaredInside, ...constNames]);
  for (const value of values.values()) {
    if (value.node && [...identifiersIn(value.node)].some((n) => capturable.has(n))) return undefined;
  }
  if (children && [...children].some((c) => [...identifiersIn(c)].some((n) => capturable.has(n)))) return undefined;
  if ([...propLocals].some((n) => declaredInside.has(n) || constNames.has(n))) return undefined;

  // What each local becomes: props from the usage (or their defaults), consts from their initializers.
  const local = new Map<string, () => string>();
  const valueOf = (prop: string, fallback?: ts.Expression) => {
    if (prop === "children" && childrenText !== undefined) return `<>${childrenText}</>`;
    const given = values.get(prop);
    if (!given) return fallback ? rewrite(fallback) : "undefined";
    if (!fallback || !given.node) return given.code;
    const value = unwrap(given.node);
    if (ts.isIdentifier(value) && value.text === "undefined" && !shadowedAt(usage, ["undefined"])) return rewrite(fallback);
    // Destructuring defaults also apply to supplied values that evaluate to
    // undefined. Keep the component for dynamic arguments: substituting them
    // would drop the default or change when the argument/default is evaluated.
    if (
      ts.isStringLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value) ||
      ts.isNumericLiteral(value) || ts.isBigIntLiteral(value) ||
      ts.isObjectLiteralExpression(value) || ts.isArrayLiteralExpression(value) ||
      value.kind === ts.SyntaxKind.NullKeyword || value.kind === ts.SyntaxKind.TrueKeyword || value.kind === ts.SyntaxKind.FalseKeyword
    ) return given.code;
    throw new Unsafe();
  };
  if (component.props) {
    for (const [prop, { local: name, fallback }] of component.props) local.set(name, () => valueOf(prop, fallback));
  }
  const constValues = new Map<string, string>();
  for (const { name } of component.consts) local.set(name, () => constValues.get(name) ?? "undefined");

  /** `node`'s text with props and consts replaced. */
  function rewrite(node: ts.Node, childrenInPlace = false): string {
    const start = node.getStart();
    let text = node.getText();
    const edits: Array<{ from: number; to: number; text: string }> = [];
    let unknownProps = false;
    const visit = (n: ts.Node) => {
      if (component.propsObject && ts.isPropertyAccessExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === component.propsObject) {
        const prop = n.name.text;
        const child = ts.isJsxExpression(n.parent) && (ts.isJsxElement(n.parent.parent) || ts.isJsxFragment(n.parent.parent));
        if (prop === "children" && childrenInPlace && childrenText !== undefined && child) {
          edits.push({ from: n.parent.getStart() - start, to: n.parent.getEnd() - start, text: childrenText });
        } else {
          edits.push({ from: n.getStart() - start, to: n.getEnd() - start, text: `(${valueOf(prop)})` });
        }
        return;
      }
      if (ts.isIdentifier(n) && component.propsObject === n.text && isValueReference(n)) unknownProps = true;
      if (ts.isIdentifier(n) && local.has(n.text) && isValueReference(n)) {
        // A tag name (`<Tailwind>` from a prop): only a plain name can stand there.
        if ((ts.isJsxOpeningElement(n.parent) || ts.isJsxClosingElement(n.parent) || ts.isJsxSelfClosingElement(n.parent)) && n.parent.tagName === n) {
          const value = local.get(n.text)!().trim();
          if (!/^[A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*)*$/.test(value)) throw new Unsafe();
          edits.push({ from: n.getStart() - start, to: n.getEnd() - start, text: value });
          return;
        }
        const child = ts.isJsxExpression(n.parent) && (ts.isJsxElement(n.parent.parent) || ts.isJsxFragment(n.parent.parent));
        const isChildren = component.props?.get("children")?.local === n.text;
        if (isChildren && childrenInPlace && childrenText !== undefined && child) {
          // `{children}` as a JSX child: the children go there as they are.
          edits.push({ from: n.parent.getStart() - start, to: n.parent.getEnd() - start, text: childrenText });
        } else if (ts.isShorthandPropertyAssignment(n.parent)) {
          edits.push({ from: n.getStart() - start, to: n.getEnd() - start, text: `${n.text}: (${local.get(n.text)!()})` });
        } else {
          edits.push({ from: n.getStart() - start, to: n.getEnd() - start, text: `(${local.get(n.text)!()})` });
        }
        return;
      }
      ts.forEachChild(n, visit);
    };
    visit(node);
    if (unknownProps) throw new Unsafe();
    edits.sort((a, b) => b.from - a.from);
    for (const edit of edits) text = text.slice(0, edit.from) + edit.text + text.slice(edit.to);
    return text;
  }

  let text: string;
  try {
    // Consts first (in order), so later ones and the JSX see their values.
    for (const { name, init } of component.consts) constValues.set(name, rewrite(init));
    text = rewrite(component.returned, true);
  } catch (error) {
    if (error instanceof Unsafe) return undefined;
    throw error;
  }
  if (key) {
    const root = component.returned;
    if (!(ts.isJsxElement(root) || ts.isJsxSelfClosingElement(root))) return undefined;
    const tag = (ts.isJsxElement(root) ? root.openingElement : root).tagName;
    const at = tag.getEnd() - root.getStart();
    text = `${text.slice(0, at)} key={${key.code}}${text.slice(at)}`;
  }
  return text;
}

class Unsafe extends Error {}

/** Declarations of the inlined components that nothing uses any more. */
function removeUnused(source: string, fileName: string, names: Set<string>): string {
  const file = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const used = new Set<string>();
  /** Inlined components: their declarations, or the import specifiers that bring them in. */
  const declared = new Map<string, ts.Node>();
  for (const statement of file.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name && names.has(statement.name.text) && !isExported(statement)) declared.set(statement.name.text, statement);
    if (ts.isVariableStatement(statement) && !isExported(statement) && statement.declarationList.declarations.length === 1) {
      const decl = statement.declarationList.declarations[0];
      if (ts.isIdentifier(decl.name) && names.has(decl.name.text)) declared.set(decl.name.text, statement);
    }
    if (ts.isImportDeclaration(statement) && statement.importClause) {
      const clause = statement.importClause;
      if (clause.name && names.has(clause.name.text)) declared.set(clause.name.text, clause.name);
      if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) {
        for (const element of clause.namedBindings.elements) if (names.has(element.name.text)) declared.set(element.name.text, element);
      }
    }
  }
  const visit = (node: ts.Node) => {
    if (ts.isIdentifier(node) && declared.has(node.text) && isValueReference(node)) {
      const own = declared.get(node.text)!;
      if (!contains(own, node)) used.add(node.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  const edits: Array<{ from: number; to: number }> = [];
  for (const [name, node] of declared) {
    if (used.has(name)) continue;
    if (ts.isStatement(node)) {
      edits.push({ from: node.getFullStart(), to: node.getEnd() });
      continue;
    }
    // An import: drop the binding, or the whole import when nothing else is left in it.
    const declaration = findAncestor(node, ts.isImportDeclaration);
    if (!declaration) continue;
    const clause = declaration.importClause!;
    const others = [
      ...(clause.name && clause.name !== node && !(names.has(clause.name.text) && !used.has(clause.name.text)) ? [clause.name] : []),
      ...(clause.namedBindings && ts.isNamedImports(clause.namedBindings)
        ? clause.namedBindings.elements.filter((e) => e !== node && !(names.has(e.name.text) && !used.has(e.name.text)))
        : clause.namedBindings
          ? [clause.namedBindings]
          : []),
    ];
    if (!others.length) edits.push({ from: declaration.getFullStart(), to: declaration.getEnd() });
    else if (ts.isImportSpecifier(node)) {
      const list = node.parent;
      const index = list.elements.indexOf(node);
      const next = list.elements[index + 1];
      const previous = list.elements[index - 1];
      edits.push(next ? { from: node.getStart(), to: next.getStart() } : previous ? { from: previous.getEnd(), to: node.getEnd() } : { from: node.getStart(), to: node.getEnd() });
    }
  }
  // An import emptied by several edits is removed once.
  const unique = edits.filter((e, i) => !edits.some((o, j) => j !== i && o.from <= e.from && o.to >= e.to && (o.from !== e.from || o.to !== e.to)));
  const seen = new Set<string>();
  for (const edit of unique.sort((a, b) => b.from - a.from)) {
    const id = `${edit.from}:${edit.to}`;
    if (seen.has(id)) continue;
    seen.add(id);
    source = source.slice(0, edit.from) + source.slice(edit.to);
  }
  return source;
}

function findAncestor<T extends ts.Node>(node: ts.Node, test: (n: ts.Node) => n is T): T | undefined {
  for (let n: ts.Node | undefined = node.parent; n; n = n.parent) if (test(n)) return n;
  return undefined;
}

// ============================================
// Helpers
// ============================================

/**
 * A component body the inliner can take: `return <JSX/>`, after any number
 * of `const name = value` (no hooks: they'd run in the template instead).
 */
function componentBody(fn: ts.FunctionLikeDeclaration): { returned: ts.Expression; consts: Array<{ name: string; init: ts.Expression }> } | undefined {
  if (!fn.body) return undefined;
  if (!ts.isBlock(fn.body)) return { returned: unwrap(fn.body), consts: [] };
  const statements = fn.body.statements;
  const last = statements[statements.length - 1];
  if (!last || !ts.isReturnStatement(last) || !last.expression) return undefined;
  const consts: Array<{ name: string; init: ts.Expression }> = [];
  for (const statement of statements.slice(0, -1)) {
    if (!ts.isVariableStatement(statement) || !(statement.declarationList.flags & ts.NodeFlags.Const)) return undefined;
    for (const decl of statement.declarationList.declarations) {
      if (!ts.isIdentifier(decl.name) || !decl.initializer || callsHook(decl.initializer)) return undefined;
      consts.push({ name: decl.name.text, init: decl.initializer });
    }
  }
  return { returned: unwrap(last.expression), consts };
}

function callsHook(node: ts.Node): boolean {
  let found = false;
  const visit = (n: ts.Node) => {
    if (ts.isCallExpression(n)) {
      const callee = ts.isPropertyAccessExpression(n.expression) ? n.expression.name : n.expression;
      if (ts.isIdentifier(callee) && /^use[A-Z]/.test(callee.text)) found = true;
    }
    if (!found) ts.forEachChild(n, visit);
  };
  visit(node);
  return found;
}

function defaultExportName(file: ts.SourceFile): string | undefined {
  for (const statement of file.statements) {
    if (ts.isFunctionDeclaration(statement) && hasDefault(statement)) return statement.name?.text ?? "default";
    if (ts.isExportAssignment(statement) && ts.isIdentifier(unwrap(statement.expression))) return (unwrap(statement.expression) as ts.Identifier).text;
  }
  return undefined;
}

function hasDefault(node: ts.Node): boolean {
  return (ts.canHaveModifiers(node) ? ts.getModifiers(node) ?? [] : []).some((m) => m.kind === ts.SyntaxKind.DefaultKeyword);
}

function isExported(node: ts.Node): boolean {
  return (ts.canHaveModifiers(node) ? ts.getModifiers(node) ?? [] : []).some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
}

/** An identifier read as a value (not a property name, attribute name or declaration). */
function isValueReference(node: ts.Identifier): boolean {
  const parent = node.parent;
  if (ts.isPropertyAccessExpression(parent) && parent.name === node) return false;
  if (ts.isPropertyAssignment(parent) && parent.name === node) return false;
  if (ts.isJsxAttribute(parent)) return false;
  if ((ts.isJsxOpeningElement(parent) || ts.isJsxClosingElement(parent) || ts.isJsxSelfClosingElement(parent)) && parent.tagName === node) return true;
  if ((ts.isVariableDeclaration(parent) || ts.isParameter(parent) || ts.isBindingElement(parent) || ts.isFunctionDeclaration(parent)) && parent.name === node) return false;
  if (ts.isBindingElement(parent) && parent.propertyName === node) return false;
  if (ts.isQualifiedName(parent) && parent.right === node) return false;
  return true;
}

function identifiersIn(node: ts.Node): Set<string> {
  const names = new Set<string>();
  const visit = (n: ts.Node) => {
    if (ts.isIdentifier(n) && isValueReference(n)) names.add(n.text);
    ts.forEachChild(n, visit);
  };
  visit(node);
  return names;
}

/** Names declared inside `node` (parameters, variables, functions). */
function declarations(node: ts.Node): Set<string> {
  const names = new Set<string>();
  const add = (name: ts.BindingName) => {
    if (ts.isIdentifier(name)) names.add(name.text);
    else for (const e of name.elements) if (!ts.isOmittedExpression(e)) add(e.name);
  };
  const visit = (n: ts.Node) => {
    if (ts.isVariableDeclaration(n) || ts.isParameter(n)) add(n.name);
    if (ts.isFunctionDeclaration(n) && n.name) names.add(n.name.text);
    ts.forEachChild(n, visit);
  };
  visit(node);
  return names;
}

/** Whether a function or block around `node` declares one of `names` (so they'd mean something else there). */
function shadowedAt(node: ts.Node, names: string[]): boolean {
  if (!names.length) return false;
  const wanted = new Set(names);
  const declares = (binding: ts.BindingName): boolean =>
    ts.isIdentifier(binding) ? wanted.has(binding.text) : binding.elements.some((e) => !ts.isOmittedExpression(e) && declares(e.name));
  for (let n: ts.Node | undefined = node.parent; n && !ts.isSourceFile(n); n = n.parent) {
    if (ts.isFunctionLike(n) && n.parameters.some((p) => declares(p.name))) return true;
    if (ts.isBlock(n)) {
      for (const statement of n.statements) {
        if (ts.isVariableStatement(statement) && statement.declarationList.declarations.some((d) => declares(d.name))) return true;
        if (ts.isFunctionDeclaration(statement) && statement.name && wanted.has(statement.name.text)) return true;
      }
    }
  }
  return false;
}

function contains(outer: ts.Node, inner: ts.Node): boolean {
  return inner.getStart() >= outer.getStart() && inner.getEnd() <= outer.getEnd();
}

function isJsx(node: ts.Node): boolean {
  return ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node);
}

function unwrap(node: ts.Expression): ts.Expression {
  while (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isSatisfiesExpression(node)) node = node.expression;
  return node;
}
