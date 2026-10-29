/**
 * For the Beefree converter's tests and measurement script: a design written as Elements code
 * (`designToElements()`), that code compiled (TypeScript's transpiler, as a project's build would) and run against
 * the built `@unlayer/react-elements`, and rendered to HTML and back to a design; and the code type-checked against
 * the package's published types.
 */
import { createRequire } from "node:module";
import path from "node:path";
import ts from "typescript";
import type { TextCheck } from "@unlayer/convert-core";

const require = createRequire(import.meta.url);
const elementsEntry = require.resolve("@unlayer/react-elements");
// React as Elements loads it: one copy, so the generated code's JSX renders with Elements' React.
const elementsRequire = createRequire(elementsEntry);

const Elements = require("@unlayer/react-elements") as typeof import("@unlayer/react-elements");
const codegen = require("@unlayer/react-elements/codegen") as typeof import("@unlayer/react-elements/codegen");
const React = elementsRequire("react") as typeof import("react");

const MODULES: Record<string, unknown> = {
  react: React,
  "react/jsx-runtime": elementsRequire("react/jsx-runtime"),
  "@unlayer/react-elements": Elements,
  "@unlayer/react-elements/font": require("@unlayer/react-elements/font"),
};

export const { designToElements } = codegen;
export const { renderToHtml, renderToJson } = Elements;

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
  const load = (id: string) => {
    if (!(id in MODULES)) throw new Error(`generated code imports ${id}`);
    return MODULES[id];
  };
  new Function("require", "module", "exports", compile(code))(load, module, module.exports);
  return module.exports.default as React.ComponentType;
}

export interface Rendered {
  code: string;
  /** designToElements' warnings. */
  codegenWarnings: string[];
  html: string;
  /** The design the code renders back to (renderToJson). */
  back: Record<string, any>;
}

/** design → Elements code → HTML, and back to a design. */
export function render(design: unknown, componentName = "Template"): Rendered {
  const { code, warnings } = designToElements(design, { componentName });
  const Template = evaluate(code);
  const element = React.createElement(Template);
  return { code, codegenWarnings: warnings, html: renderToHtml(element), back: renderToJson(element) as Record<string, any> };
}

/** TypeScript's diagnostics for generated modules (name → code), checked together against the published types. */
export function typecheck(modules: Map<string, string>): string[] {
  // Virtual files beside this one: imports resolve from this package's node_modules.
  const files = new Map([...modules].map(([name, code]) => [path.join(import.meta.dirname, "__generated__", `${name}.tsx`), code]));
  const options: ts.CompilerOptions = {
    jsx: ts.JsxEmit.ReactJSX,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    target: ts.ScriptTarget.ES2020,
    strict: true,
    skipLibCheck: true,
    noEmit: true,
    esModuleInterop: true,
    types: [],
  };
  const host = ts.createCompilerHost(options);
  const { getSourceFile, fileExists, readFile } = host;
  host.fileExists = (file) => files.has(file) || fileExists(file);
  host.readFile = (file) => files.get(file) ?? readFile(file);
  host.getSourceFile = (file, language, ...rest) => (files.has(file) ? ts.createSourceFile(file, files.get(file)!, language, true, ts.ScriptKind.TSX) : getSourceFile(file, language, ...rest));
  const program = ts.createProgram([...files.keys()], options, host);
  return ts
    .getPreEmitDiagnostics(program)
    .filter((d) => !d.file || files.has(d.file.fileName))
    .map((d) => {
      const line = d.file && d.start !== undefined ? d.file.getLineAndCharacterOfPosition(d.start).line : undefined;
      const where = d.file ? `${path.basename(d.file.fileName)}${line !== undefined ? `:${line + 1} \`${d.file.text.split("\n")[line].trim()}\`` : ""}` : "";
      return `${where}: ${ts.flattenDiagnosticMessageText(d.messageText, " ")}`;
    });
}

const BLOCK_FLAGS = new Set(["_meta", "selectable", "draggable", "duplicatable", "deletable", "hideable", "locked"]);

/**
 * Where a design and the design its code renders back to differ: each block's, column's, row's and the body's values
 * (ids and the builder's flags aside), as `Row 1, column 2, block 3: fontSize "14px" → "16px"`.
 */
export function roundTripDifferences(design: Record<string, any>, back: Record<string, any>): string[] {
  const out: string[] = [];
  const same = (a: unknown, b: unknown) => JSON.stringify(sortKeys(a)) === JSON.stringify(sortKeys(b));
  const compare = (where: string, a: Record<string, any> = {}, b: Record<string, any> = {}) => {
    for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
      if (BLOCK_FLAGS.has(key)) continue;
      if (!same(a[key], b[key])) out.push(`${where}: ${key} ${JSON.stringify(a[key])} → ${JSON.stringify(b[key])}`);
    }
  };
  compare("The body", design.body?.values, back.body?.values);
  const rows = design.body?.rows ?? [];
  const backRows = back.body?.rows ?? [];
  if (rows.length !== backRows.length) out.push(`${rows.length} rows → ${backRows.length}`);
  rows.forEach((row: any, r: number) => {
    const backRow = backRows[r] ?? {};
    if (!same(row.cells, backRow.cells)) out.push(`Row ${r + 1}: cells ${JSON.stringify(row.cells)} → ${JSON.stringify(backRow.cells)}`);
    compare(`Row ${r + 1}`, row.values, backRow.values);
    (row.columns ?? []).forEach((column: any, c: number) => {
      const backColumn = backRow.columns?.[c] ?? {};
      compare(`Row ${r + 1}, column ${c + 1}`, column.values, backColumn.values);
      const contents = column.contents ?? [];
      if (contents.length !== (backColumn.contents ?? []).length) out.push(`Row ${r + 1}, column ${c + 1}: ${contents.length} blocks → ${(backColumn.contents ?? []).length}`);
      contents.forEach((content: any, b: number) => {
        const backContent = backColumn.contents?.[b] ?? {};
        if (content.type !== backContent.type) out.push(`Row ${r + 1}, column ${c + 1}, block ${b + 1}: ${content.type} → ${backContent.type}`);
        else compare(`Row ${r + 1}, column ${c + 1}, block ${b + 1} (${content.type})`, content.values, backContent.values);
      });
    });
  });
  return out;
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, sortKeys(v)]));
}

/**
 * Why a template's content check fails, as far as the two known causes explain it: `social alt text` (Unlayer's
 * social icons say "Facebook icon" where Beefree's said "Facebook"), `menu hamburger` (Beefree folds a menu into ☰
 * on phones, and at the check's 700px desktop width for templates whose phone breakpoint is above it; Unlayer menus
 * show their items). What's left is `other`.
 */
export function failureCauses(check: TextCheck, design: Record<string, any>): string[] {
  const causes = new Set<string>();
  const blocks = (design.body?.rows ?? []).flatMap((row: any) => (row.columns ?? []).flatMap((column: any) => column.contents ?? []));
  const menuItems = blocks.filter((b: any) => b.type === "menu").flatMap((b: any) => (b.values?.menu?.items ?? []).map((item: any) => String(item.text)));
  const menuWords = new Set<string>(menuItems.flatMap((text: string) => text.split(/\s+/)));
  const icons = blocks.filter((b: any) => b.type === "social").flatMap((b: any) => b.values?.icons?.icons ?? []);
  const iconSources = icons.map((icon: any) => icon.imgUrl).filter(Boolean) as string[];
  const iconNames = new Set(icons.map((icon: any) => String(icon.name).toLowerCase()));
  const imageAlts = new Set(blocks.filter((b: any) => b.type === "image").map((b: any) => b.values?.altText));
  /** A social icon's image or image text (Unlayer's "<name> icon", or the alt Beefree gave it). */
  const social = (attr: string, added: boolean) => {
    if (iconSources.some((src) => attr.includes(src))) return true;
    const alt = /^alt (.*)$/.exec(attr)?.[1];
    if (alt === undefined || !icons.length) return false;
    return added ? / icon$/.test(alt) && iconNames.has(alt.replace(/ icon$/, "").toLowerCase()) : !imageAlts.has(alt);
  };
  /** A link on a menu item (Beefree's hidden behind ☰), or ☰'s own icon. */
  const hamburger = (attr: string) => /^src data:image\/svg\+xml/.test(attr) || (/^href /.test(attr) && menuItems.some((text: string) => attr.endsWith(`(${text})`)));
  const left: string[] = [];
  const sort = (list: string[] | undefined, added: boolean) => {
    for (const attr of list ?? []) {
      if (social(attr, added)) causes.add("social alt text");
      else if (hamburger(attr)) causes.add("menu hamburger");
      else left.push(attr);
    }
  };
  sort(check.missingAttributes, false);
  sort(check.addedAttributes, true);
  sort(check.phone.missingAttributes, false);
  sort(check.phone.addedAttributes, true);
  for (const word of [...check.missing, ...check.added, ...check.phone.missing, ...check.phone.added]) {
    if (word === "☰" || word === "✕" || menuWords.has(word)) causes.add("menu hamburger");
    else left.push(word);
  }
  if (left.length) causes.add(`other: ${left.slice(0, 6).map((w) => JSON.stringify(w.slice(0, 80))).join(", ")}${left.length > 6 ? ` (+${left.length - 6})` : ""}`);
  return [...causes];
}


/** Whether the conversion lost or added content (migrate's ✗): words, links, images, alt text, on any screen. */
export const lostContent = (check: TextCheck) =>
  Boolean(check.missing.length || check.added.length || check.missingAttributes.length || check.addedAttributes.length || check.phone.missing.length || check.phone.added.length || check.phone.missingAttributes?.length || check.phone.addedAttributes?.length);

