/**
 * For codegen's tests: generated code compiled (TypeScript's transpiler, as a project's build would), run, and
 * rendered back to a design with renderToJson.
 */
import React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import path from "node:path";
import ts from "typescript";
import * as Elements from "../index";
import * as FontEntry from "../font/index";
import { compareDesigns, type DesignDifference } from "./compare";
import { designToElements, type DesignToElementsOptions } from "./design-to-elements";
import type { Plain } from "./values";

const MODULES: Record<string, unknown> = {
  react: React,
  "react/jsx-runtime": jsxRuntime,
  "@unlayer/react-elements": Elements,
  "@unlayer/react-elements/font": FontEntry,
};

/** The module's JavaScript (CommonJS, the automatic JSX runtime). */
export function compile(code: string): string {
  const { outputText, diagnostics } = ts.transpileModule(code, {
    fileName: "Template.tsx",
    reportDiagnostics: true,
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  });
  if (diagnostics?.length) throw new Error(`generated code doesn't compile: ${diagnostics.map((d) => ts.flattenDiagnosticMessageText(d.messageText, "\n")).join("; ")}`);
  return outputText;
}

/** The generated module's default export. */
export function evaluate(code: string): React.ComponentType {
  const module = { exports: {} as Record<string, unknown> };
  const require = (id: string) => {
    if (!(id in MODULES)) throw new Error(`generated code imports ${id}`);
    return MODULES[id];
  };
  new Function("require", "module", "exports", compile(code))(require, module, module.exports);
  return module.exports.default as React.ComponentType;
}

export interface RoundTrip {
  code: string;
  warnings: string[];
  /** The design the code renders to. */
  design: Plain;
  differences: DesignDifference[];
}

/** design → code → renderToJson, and how what comes back differs from the design. */
export function roundTrip(design: Plain, options?: DesignToElementsOptions): RoundTrip {
  const { code, warnings } = designToElements(design, options);
  const Template = evaluate(code);
  const back = Elements.renderToJson(React.createElement(Template)) as unknown as Plain;
  return { code, warnings, design: back, differences: compareDesigns(design, back) };
}

// (Read by codegen's own tests only. Not with `path`, which the production test run, React's production build, loads
// as an empty module, where a regression test evaluates generated code.)
export const PACKAGE = __dirname.replace(/[\\/]src[\\/]codegen[\\/]?$/, "");

/** Diagnostics for `modules` (path → code) type-checked with the package's tsconfig.typecheck.json. */
export function typecheck(modules: Map<string, string>): string[] {
  const { config } = ts.readConfigFile(path.join(PACKAGE, "tsconfig.typecheck.json"), ts.sys.readFile);
  const { options } = ts.parseJsonConfigFileContent(config, ts.sys, PACKAGE);
  const host = ts.createCompilerHost(options);
  const { getSourceFile, fileExists, readFile } = host;
  host.fileExists = (file) => modules.has(file) || fileExists(file);
  host.readFile = (file) => modules.get(file) ?? readFile(file);
  host.getSourceFile = (file, language, ...rest) => (modules.has(file) ? ts.createSourceFile(file, modules.get(file)!, language, true, ts.ScriptKind.TSX) : getSourceFile(file, language, ...rest));
  const program = ts.createProgram([...modules.keys()], { ...options, noEmit: true }, host);
  return ts
    .getPreEmitDiagnostics(program)
    .filter((d) => !d.file || modules.has(d.file.fileName))
    .map((d) => {
      const at = d.file && d.start !== undefined ? d.file.getLineAndCharacterOfPosition(d.start).line : undefined;
      const where = d.file ? `${path.basename(d.file.fileName)}${at !== undefined ? `:${at + 1} \`${d.file.text.split("\n")[at].trim()}\`` : ""}` : "";
      return `${where}: ${ts.flattenDiagnosticMessageText(d.messageText, " ")}`;
    });
}

/** The components whose `values` codegen writes (see checked-values.ts). */
export const VALUES_COMPONENTS = ["Email", "Page", "Document", "Row", "Column", "Paragraph", "Heading", "Button", "Image", "Divider", "Html", "Menu", "Social", "Table", "Video", "PageBreak"];

/**
 * The keys each component's `values` prop takes, at every depth, as TypeScript reads its type: the source of
 * values-shapes.ts. A key's shape is `0` (a value only), `1` (anything), its keys (an object), or `[item]` (a list);
 * a key typed `never` is left out (it takes no value), and so is `_override`, whose devices take the component's keys.
 */
export function valuesShapes(): Record<string, unknown> {
  const file = path.join(PACKAGE, "src/codegen/__generated__/values-shapes.tsx");
  const code = `import type * as E from "@unlayer/react-elements";\n${VALUES_COMPONENTS.map((name) => `export declare const ${name}: E.${name}Props["values"];`).join("\n")}\n`;
  const { config } = ts.readConfigFile(path.join(PACKAGE, "tsconfig.typecheck.json"), ts.sys.readFile);
  const { options } = ts.parseJsonConfigFileContent(config, ts.sys, PACKAGE);
  const host = ts.createCompilerHost(options);
  const { getSourceFile, fileExists, readFile } = host;
  host.fileExists = (name) => name === file || fileExists(name);
  host.readFile = (name) => (name === file ? code : readFile(name));
  host.getSourceFile = (name, language, ...rest) => (name === file ? ts.createSourceFile(name, code, language, true, ts.ScriptKind.TSX) : getSourceFile(name, language, ...rest));
  const program = ts.createProgram([file], { ...options, noEmit: true }, host);
  const checker = program.getTypeChecker();
  const SCALAR = ts.TypeFlags.StringLike | ts.TypeFlags.NumberLike | ts.TypeFlags.BooleanLike | ts.TypeFlags.BigIntLike | ts.TypeFlags.Null | ts.TypeFlags.Undefined | ts.TypeFlags.Void | ts.TypeFlags.Never | ts.TypeFlags.ESSymbolLike;
  type Shape = 0 | 1 | Shape[] | { [key: string]: Shape };
  /** Two shapes a key may have (a union's members), as one. */
  const merge = (a: Shape | undefined, b: Shape): Shape => {
    if (a === undefined || a === 0) return b;
    if (b === 0) return a;
    if (a === 1 || b === 1) return 1;
    if (Array.isArray(a) && Array.isArray(b)) return [merge(a[0], b[0])];
    if (Array.isArray(a) || Array.isArray(b)) return 1;
    const out: Record<string, Shape> = { ...a };
    for (const [key, shape] of Object.entries(b)) out[key] = merge(out[key], shape);
    return out;
  };
  const shapeOf = (type: ts.Type, depth: number): Shape => {
    if (depth > 10 || type.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) return 1;
    let shape: Shape | undefined;
    for (const member of type.isUnion() ? type.types : [type]) {
      if (member.flags & SCALAR) continue;
      // `string & {}`: a value (see LooseValue).
      if (member.isIntersection() && member.types.some((part) => part.flags & SCALAR)) continue;
      if (member.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) return 1;
      if (checker.isArrayType(member) || checker.isTupleType(member)) {
        const items = checker.getTypeArguments(member as ts.TypeReference);
        shape = merge(shape, [items.reduce<Shape>((all, item) => merge(all, shapeOf(item, depth + 1)), 0)]);
        continue;
      }
      if (member.getCallSignatures().length || checker.getIndexInfoOfType(member, ts.IndexKind.String)) return 1;
      const keys: Record<string, Shape> = {};
      for (const property of checker.getPropertiesOfType(member)) {
        const type = checker.getTypeOfSymbol(property);
        const members = type.isUnion() ? type.types : [type];
        if (members.every((part) => part.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Never))) continue;
        if (depth === 0 && property.name === "_override") continue;
        keys[property.name] = shapeOf(type, depth + 1);
      }
      shape = merge(shape, keys);
    }
    return shape ?? 0;
  };
  const source = program.getSourceFile(file)!;
  const shapes: Record<string, unknown> = {};
  ts.forEachChild(source, (node) => {
    if (!ts.isVariableStatement(node)) return;
    const declaration = node.declarationList.declarations[0];
    shapes[declaration.name.getText(source)] = shapeOf(checker.getTypeAtLocation(declaration.name), 0);
  });
  return shapes;
}

/** values-shapes.ts, as valuesShapes() gives it (components with the same shape share it). */
export function valuesShapesModule(): string {
  const shapes = valuesShapes();
  const named = new Map<string, string>();
  const lines: string[] = [];
  const entries = Object.entries(shapes).map(([component, shape]) => {
    const text = JSON.stringify(shape);
    if (!named.has(text)) {
      named.set(text, component.toUpperCase());
      lines.push(`const ${component.toUpperCase()}: Shape = ${text};`);
    }
    return `  ${component}: ${named.get(text)},`;
  });
  return [
    "/**",
    " * Generated from the components' `values` types by codegen's type-check test (`vitest run src/codegen -u` writes it",
    " * again): the keys each `values` takes, at every depth (see checked-values.ts). A key's shape is `0` (a value only),",
    " * `1` (anything), its keys (an object), or `[item]` (a list).",
    " */",
    "export type Shape = 0 | 1 | Shape[] | { [key: string]: Shape };",
    "",
    ...lines,
    "",
    "export const VALUES_SHAPES: Record<string, Shape> = {",
    ...entries,
    "};",
    "",
  ].join("\n");
}
