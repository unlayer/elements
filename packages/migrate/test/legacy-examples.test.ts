/**
 * main's examples, migrated by the codemod: the files Storybook compares with main ("Primitives/Codemod of main") are
 * the codemod's output, unedited. Run with UPDATE_LEGACY_EXAMPLES=1 to write them after changing the codemod.
 */
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { migrateElements } from "../src/legacy/codemod";

const REACT = path.resolve(__dirname, "../../react/src");
const OUT = path.join(REACT, "primitives/codemod");
/** main's templates (PhoneOverrides isn't one: it renders its template itself, with today's renderToHtmlParts). */
const EXAMPLES = ["AirbnbConfirmation", "LumaEventInvite", "MercuryReceipt", "MorningBrewDigest", "NikeDrop", "NotionWelcome", "ProductDigest", "StripeReceipt", "WarbyOrderShipped", "SpotifyWelcome"];
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

async function migrated(name: string) {
  const relative = path.relative(REACT, sourceOf(name)).split(path.sep).join("/");
  const { code, report } = await migrateElements(template(fs.readFileSync(sourceOf(name), "utf8")), { from: ["../index", "./index"], to: "../index" });
  const header = [
    `// main's ${relative}, migrated by @unlayer/migrate's codemod (packages/migrate/src/legacy): generated, don't edit.`,
    "// Regenerate: UPDATE_LEGACY_EXAMPLES=1 pnpm --filter @unlayer/migrate test legacy-examples",
    ...(report.length ? ["//", "// What the codemod reported:", ...report.map((line) => `// - ${line}`)] : []),
    "",
  ].join("\n");
  return header + code;
}

describe("main's examples, migrated", () => {
  for (const name of EXAMPLES) {
    it(`${name}: the file Storybook compares with main is the codemod's output`, async () => {
      const file = path.join(OUT, `${name}.tsx`);
      const code = await migrated(name);
      if (process.env.UPDATE_LEGACY_EXAMPLES) {
        fs.mkdirSync(OUT, { recursive: true });
        fs.writeFileSync(file, code);
      }
      expect(fs.existsSync(file) && fs.readFileSync(file, "utf8")).toBe(code);
    });
  }
});
