/**
 * main's examples, migrated by the codemod: primitives/testing/codemod-examples.tsx, which the builder's tests take to
 * the builder and back, is the codemod's output, unedited but for what makes ten modules one: each in a scope of its
 * own, returning its component, their imports merged. Run with UPDATE_LEGACY_EXAMPLES=1 to write it after changing the
 * codemod.
 */
import fs from "node:fs";
import path from "node:path";
import { formatTsx } from "@unlayer/convert-core";
import ts from "typescript";
import { beforeAll, describe, expect, it } from "vitest";
import { migrateElements } from "../src/legacy/codemod";

const REACT = path.resolve(__dirname, "../../react/src");
const FILE = path.join(REACT, "primitives/testing/codemod-examples.tsx");
/**
 * main's templates (PhoneOverrides isn't one: it renders its template itself, with today's renderToHtmlParts), and what
 * the file exports each one's scope as. Not its component's name: a bundler renames a function that shadows one of the
 * module's, and the tests name each example by its component.
 */
const SCOPES: Record<string, string> = { AirbnbConfirmation: "airbnb", LumaEventInvite: "luma", MercuryReceipt: "mercury", MorningBrewDigest: "brew", NikeDrop: "nike", NotionWelcome: "notion", ProductDigest: "digest", StripeReceipt: "stripe", WarbyOrderShipped: "warby", SpotifyWelcome: "spotify" };
const EXAMPLES = Object.keys(SCOPES);
const sourceOf = (name: string) => path.join(REACT, name === "SpotifyWelcome" ? "" : "examples", `${name}.stories.tsx`);

/** The example without what makes it a story (Storybook's import, its meta and its story), so the template is left. */
function template(source: string): string {
  const file = ts.createSourceFile("example.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  // Storybook's types, and type aliases of them (`type Story = StoryObj<typeof meta>`).
  const types = ["Meta", "StoryObj"];
  for (const statement of file.statements) if (ts.isTypeAliasDeclaration(statement) && types.some((type) => new RegExp(`\\b${type}\\b`).test(statement.type.getText()))) types.push(statement.name.text);
  const mentions = new RegExp(`\\b(${types.join("|")})\\b`);
  const story = (statement: ts.Statement) =>
    (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier) && statement.moduleSpecifier.text.startsWith("@storybook/")) ||
    ts.isExportAssignment(statement) ||
    ((ts.isVariableStatement(statement) || ts.isTypeAliasDeclaration(statement)) && mentions.test(statement.getText()));
  let out = source;
  for (const statement of [...file.statements].reverse()) if (story(statement)) out = out.slice(0, statement.getFullStart()) + out.slice(statement.getEnd());
  return out;
}

/** Where an example's output sits in the file: its part starts at this line. */
const markerOf = (name: string) => `// main's ${path.relative(REACT, sourceOf(name)).split(path.sep).join("/")}\n`;

/** The codemod's output as a scope: its imports taken out (the file's own have them), `export` off its declarations, and the components it exported. */
function scoped(code: string) {
  const file = ts.createSourceFile("example.tsx", code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const imports = new Map<string, Set<string>>();
  const components: string[] = [];
  const cuts: Array<[number, number]> = [];
  for (const statement of file.statements) {
    if (ts.isImportDeclaration(statement)) {
      const clause = statement.importClause;
      if (!clause || clause.name || clause.isTypeOnly || !clause.namedBindings || !ts.isNamedImports(clause.namedBindings)) throw new Error(`An import this file can't merge: ${statement.getText()}`);
      const module = (statement.moduleSpecifier as ts.StringLiteral).text;
      for (const name of clause.namedBindings.elements) imports.set(module, (imports.get(module) ?? new Set()).add(name.getText()));
      cuts.push([statement.getStart(), statement.getEnd()]);
    } else if (ts.isExportAssignment(statement) || ts.isExportDeclaration(statement)) {
      throw new Error(`An export this file can't scope: ${statement.getText()}`);
    } else if (ts.canHaveModifiers(statement)) {
      const keyword = ts.getModifiers(statement)?.find((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);
      if (!keyword) continue;
      cuts.push([keyword.getStart(), keyword.getEnd()]);
      if (ts.isFunctionDeclaration(statement) && statement.name) components.push(statement.name.text);
      else if (!ts.isInterfaceDeclaration(statement) && !ts.isTypeAliasDeclaration(statement)) throw new Error(`An export this file can't scope: ${statement.getText()}`);
    }
  }
  if (!components.length) throw new Error("An output that exports no component");
  let body = code;
  for (const [start, end] of cuts.reverse()) body = body.slice(0, start) + body.slice(end);
  return { imports, components, body };
}

/** The file: the codemod's output of each example in a scope of its own, with what it reported, and their imports merged. */
async function generated() {
  const outputs = await Promise.all(
    EXAMPLES.map(async (name) => {
      const { code, report } = await migrateElements(template(fs.readFileSync(sourceOf(name), "utf8")), { from: ["../index", "./index"], to: "../index" });
      return { name, report, ...scoped(code) };
    })
  );
  const imports = new Map<string, Set<string>>();
  for (const output of outputs) for (const [module, names] of output.imports) imports.set(module, new Set([...(imports.get(module) ?? []), ...names]));
  return formatTsx(
    [
      "// main's examples, migrated by @unlayer/migrate's codemod (packages/migrate/src/legacy): generated, don't edit.",
      "// Regenerate: UPDATE_LEGACY_EXAMPLES=1 pnpm --filter @unlayer/migrate test legacy-examples",
      ...[...imports].map(([module, names]) => `import { ${[...names].sort().join(", ")} } from ${JSON.stringify(module)};`),
      "",
      ...outputs.flatMap(({ name, report, components, body }) => [
        markerOf(name).trimEnd(),
        ...(report.length ? ["//", "// What the codemod reported:", ...report.map((line) => `// - ${line}`)] : []),
        `export const ${SCOPES[name]} = (() => {`,
        body,
        `return { ${components.join(", ")} };`,
        "})();",
        "",
      ]),
    ].join("\n")
  );
}

/** An example's part of the file: from its line to the next example's. */
function partOf(file: string, name: string) {
  const start = file.indexOf(markerOf(name));
  if (start < 0) return undefined;
  const after = EXAMPLES.map((other) => file.indexOf(markerOf(other))).filter((at) => at > start);
  return file.slice(start, after.length ? Math.min(...after) : file.length);
}

describe("main's examples, migrated", () => {
  let code: string;
  const written = () => (fs.existsSync(FILE) ? fs.readFileSync(FILE, "utf8") : "");

  beforeAll(async () => {
    code = await generated();
    if (process.env.UPDATE_LEGACY_EXAMPLES) {
      fs.mkdirSync(path.dirname(FILE), { recursive: true });
      fs.writeFileSync(FILE, code);
    }
  }, 60000);

  for (const name of EXAMPLES) {
    it(`${name}: its part of the generated file is the codemod's output`, () => {
      expect(partOf(written(), name)).toBe(partOf(code, name));
    });
  }

  it("the generated file is the codemod's output of them all, their imports merged", () => {
    expect(written()).toBe(code);
  });
});
