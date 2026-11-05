/**
 * Which of a module's imports bring today's components: today's entries (@unlayer/react-elements, or its /legacy), or
 * the project's own modules that pass them on (an index with `export { Email } from "@unlayer/react-elements"`,
 * `export *` from it, or an import it exports again), followed through as many of those as there are. A module is a
 * template by its imports, never by a mention of the package in a comment or a string.
 */
import { readFile } from "node:fs/promises";
import ts from "typescript";
import { DEFAULT_FROM, MIGRATED } from "../convert";

/** Where an import leads among the project's files, or undefined (a package, a file that isn't there). */
export type Resolve = (specifier: string, fromFile: string) => Promise<string | undefined>;

export interface TodaysImports {
  /** It imports today's components from today's entries. */
  direct: boolean;
  /** The project's modules it imports today's components through, by specifier: each name one is passed on as → the component. */
  through: Record<string, Record<string, string>>;
  /** Names it imports that are a namespace of today's components another module passes on, which isn't followed. */
  namespaces: Array<{ name: string; specifier: string; file: string }>;
}

const TODAYS = new Set(DEFAULT_FROM);
/** A namespace of today's components passed on (`export * as E from "@unlayer/react-elements"`). */
const NAMESPACE = "*";
/** How many modules passing today's components on are followed, one through another. */
const DEPTH = 8;

const parse = (path: string, source: string) => ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, /\.[cm]?ts$/.test(path) ? ts.ScriptKind.TS : ts.ScriptKind.TSX);

/** A module's imports that aren't types: each local name, where it comes from and its name there (`*` for a namespace). */
function importsOf(file: ts.SourceFile): Array<{ local: string; specifier: string; imported: string }> {
  const out: Array<{ local: string; specifier: string; imported: string }> = [];
  for (const statement of file.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
    const clause = statement.importClause;
    if (!clause || clause.isTypeOnly) continue;
    const specifier = statement.moduleSpecifier.text;
    if (clause.name) out.push({ local: clause.name.text, specifier, imported: "default" });
    const bindings = clause.namedBindings;
    if (bindings && ts.isNamespaceImport(bindings)) out.push({ local: bindings.name.text, specifier, imported: NAMESPACE });
    else if (bindings) for (const e of bindings.elements) if (!e.isTypeOnly) out.push({ local: e.name.text, specifier, imported: (e.propertyName ?? e.name).text });
  }
  return out;
}

/** The names a module exports of its own (declared there), which an `export *` it has doesn't pass on. */
function ownExports(file: ts.SourceFile, imported: Set<string>): Set<string> {
  const out = new Set<string>();
  const bound = (name: ts.BindingName): string[] => (ts.isIdentifier(name) ? [name.text] : name.elements.flatMap((e) => (ts.isOmittedExpression(e) ? [] : bound(e.name))));
  for (const statement of file.statements) {
    if (ts.isExportAssignment(statement)) out.add("default");
    else if (ts.isExportDeclaration(statement) && !statement.moduleSpecifier && statement.exportClause && ts.isNamedExports(statement.exportClause)) {
      for (const e of statement.exportClause.elements) if (!imported.has((e.propertyName ?? e.name).text)) out.add(e.name.text);
    } else if (ts.canHaveModifiers(statement) && ts.getModifiers(statement)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) {
      if (ts.getModifiers(statement)!.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword)) out.add("default");
      else if (ts.isVariableStatement(statement)) statement.declarationList.declarations.forEach((d) => bound(d.name).forEach((name) => out.add(name)));
      else if ((ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement) || ts.isEnumDeclaration(statement)) && statement.name) out.add(statement.name.text);
    }
  }
  return out;
}

/** Finds a module's imports of today's components, following the project's modules with `resolve`. */
export function todaysImports(resolve: Resolve): (path: string, source: string) => Promise<TodaysImports | undefined> {
  const done = new Map<string, Map<string, string>>();

  /** What a module passes on of today's components: each name it exports one as → the component (`*`: a namespace of them). */
  async function passedOn(path: string, chain: string[] = []): Promise<Map<string, string>> {
    const known = done.get(path);
    if (known) return known;
    const out = new Map<string, string>();
    if (chain.includes(path) || chain.length > DEPTH || !/\.[cm]?[jt]sx?$/.test(path)) return out;
    const source = await readFile(path, "utf8").catch(() => "");
    if (/\bexport\b/.test(source)) {
      const file = parse(path, source);
      const imports = importsOf(file);
      const next = [...chain, path];
      /** Today's component a name from a module is, through as many modules as pass it on. */
      const lookup = async (specifier: string, name: string): Promise<string | undefined> => {
        if (TODAYS.has(specifier)) return name === NAMESPACE ? NAMESPACE : MIGRATED.has(name) ? name : undefined;
        const target = await resolve(specifier, path);
        const inner = target ? await passedOn(target, next) : undefined;
        return !inner?.size ? undefined : name === NAMESPACE ? NAMESPACE : inner.get(name);
      };
      const own = ownExports(file, new Set(imports.map((i) => i.local)));
      // Names the module exports by name, which an `export *` doesn't pass on whatever the order (an explicit export
      // shadows a star export): each is today's component only where that export is one.
      const named = new Set<string>();
      const exportAs = (name: string, component: string | undefined) => {
        named.add(name);
        if (component) out.set(name, component);
        else out.delete(name);
      };
      for (const statement of file.statements) {
        if (ts.isExportAssignment(statement) && !statement.isExportEquals && ts.isIdentifier(statement.expression)) {
          const from = imports.find((i) => i.local === (statement.expression as ts.Identifier).text);
          const component = from && (await lookup(from.specifier, from.imported));
          if (component) out.set("default", component);
        }
        if (!ts.isExportDeclaration(statement) || statement.isTypeOnly) continue;
        const clause = statement.exportClause;
        if (!statement.moduleSpecifier) {
          // An import exported again (`import { Email } from "@unlayer/react-elements"; export { Email }`).
          for (const e of clause && ts.isNamedExports(clause) ? clause.elements : []) {
            if (e.isTypeOnly) continue;
            const from = imports.find((i) => i.local === (e.propertyName ?? e.name).text);
            exportAs(e.name.text, from ? await lookup(from.specifier, from.imported) : undefined);
          }
          continue;
        }
        if (!ts.isStringLiteral(statement.moduleSpecifier)) continue;
        const specifier = statement.moduleSpecifier.text;
        if (!clause) {
          // `export *`: every name the other module exports but `default`, and but the ones this one declares itself.
          const target = TODAYS.has(specifier) ? undefined : await resolve(specifier, path);
          const all = TODAYS.has(specifier) ? [...MIGRATED].map((name) => [name, name] as const) : target ? [...(await passedOn(target, next))] : [];
          for (const [name, component] of all) if (name !== "default" && !own.has(name) && !named.has(name) && !out.has(name)) out.set(name, component);
        } else if (ts.isNamedExports(clause)) {
          for (const e of clause.elements) if (!e.isTypeOnly) exportAs(e.name.text, await lookup(specifier, (e.propertyName ?? e.name).text));
        } else {
          exportAs(clause.name.text, await lookup(specifier, NAMESPACE));
        }
      }
    }
    done.set(path, out);
    return out;
  }

  return async (path, source) => {
    const found: TodaysImports = { direct: false, through: {}, namespaces: [] };
    const bySpecifier = new Map<string, Array<{ local: string; imported: string }>>();
    for (const { local, specifier, imported } of importsOf(parse(path, source))) {
      if (TODAYS.has(specifier)) found.direct ||= imported === NAMESPACE || MIGRATED.has(imported);
      else bySpecifier.set(specifier, [...(bySpecifier.get(specifier) ?? []), { local, imported }]);
    }
    for (const [specifier, names] of bySpecifier) {
      const target = await resolve(specifier, path);
      const passed = target ? await passedOn(target) : undefined;
      if (!passed?.size) continue;
      const components = Object.fromEntries([...passed].filter(([, component]) => component !== NAMESPACE));
      let uses = false;
      for (const { local, imported } of names) {
        // A namespace import of the module: today's components through it (`UI.Email`) are migrated.
        if (imported === NAMESPACE) uses ||= Object.keys(components).length > 0;
        else if (passed.get(imported) === NAMESPACE) found.namespaces.push({ name: local, specifier, file: target! });
        else if (passed.get(imported)) uses = true;
      }
      if (uses) found.through[specifier] = components;
    }
    return found.direct || Object.keys(found.through).length || found.namespaces.length ? found : undefined;
  };
}
