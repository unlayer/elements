/** A migrated module run: its component `T`, with React and the new components, checked by validate(). */
import { createRequire } from "node:module";
import ts from "typescript";

const elements = createRequire(createRequire(import.meta.url).resolve("@unlayer/react-elements/package.json"));
const React = elements("react");
const primitives = elements("@unlayer/react-elements/primitives");

/** The errors validate() finds in a migrated module's component `T` (or what it throws, as one). */
export function errors(code: string, props: Record<string, unknown> = {}): string[] {
  const js = ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2020 } }).outputText;
  const exports: { T?: unknown } = {};
  const modules: Record<string, unknown> = { react: React, "@unlayer/react-elements/primitives": primitives };
  try {
    new Function("require", "exports", "React", js)((name: string) => modules[name], exports, React);
    const { diagnostics } = primitives.validate(React.createElement(exports.T, props));
    return diagnostics.filter((d: { severity: string }) => d.severity === "error").map((d: { path: string; message: string }) => `${d.path}: ${d.message}`);
  } catch (error) {
    return [`throws: ${(error as Error).message}`];
  }
}
